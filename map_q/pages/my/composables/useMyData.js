import { computed, ref } from 'vue'
import { favoriteApi, footprintApi, profileApi, timelineApi } from '../../../utils/api/social.js'

export const FOOTPRINT_TYPES = [
  { key: 'all', label: '全部' },
  { key: 'photo', label: '照片' },
  { key: 'video', label: '视频' },
  { key: 'article', label: '文章' },
  { key: 'music', label: '音乐' },
  { key: 'place', label: '地点' },
  { key: 'service', label: '服务' },
  { key: 'event', label: '活动' },
  { key: 'route', label: '路线' }
]

// Tab entry is intentionally deterministic. Persisted view data may retain
// transient context elsewhere, but never changes what “我的” opens to.
export function createMyEntryState(now = new Date()) {
  const date = new Date(now)
  const dateKey = Number.isNaN(date.getTime())
    ? ''
    : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  return {
    mode: 'favorite',
    category: 'all',
    panelState: 'default',
    date: dateKey,
    dateLayout: 'list',
    profileCollapsed: true,
    selectedPointId: '',
    sheetY: null
  }
}

export function isMinimumSheetPosition(sheetY, minimumY, threshold = 8) {
  return Number.isFinite(Number(sheetY))
    && Number.isFinite(Number(minimumY))
    && Number(sheetY) >= Number(minimumY) - threshold
}

const CATEGORY_TYPES = {
  photos: 'photo', videos: 'video', articles: 'article', music: 'music',
  locations: 'place', services: 'service', event: 'event', events: 'event',
  route: 'route', routes: 'route', track: 'route'
}

export function normalizeContentType(item = {}, category = '') {
  const explicit = item.contentType || CATEGORY_TYPES[category]
  if (explicit && FOOTPRINT_TYPES.some((type) => type.key === explicit)) return explicit
  const detail = item.detailType || item.type || item.layer || item.sourceType
  if (detail === 'normal' && category === 'photos') return 'photo'
  if (detail === 'track') return 'route'
  if (detail === 'content') return 'article'
  return FOOTPRINT_TYPES.some((type) => type.key === detail) ? detail : 'article'
}

function normalizeMedia(item = {}) {
  const source = item.media || item.images || item.snapshot?.media || item.snapshot?.images || []
  const media = Array.isArray(source) ? source : [source]
  const cover = item.cover || item.thumbnail || item.snapshot?.cover || item.snapshot?.thumbnail
  return [...(cover ? [cover] : []), ...media]
    .map((entry) => typeof entry === 'string' ? entry : entry?.url || entry?.src || '')
    .filter(Boolean)
    .filter((entry) => !/\/static\/logo\.png(?:\?|$)/i.test(entry))
    .filter((entry, index, list) => list.indexOf(entry) === index)
    .slice(0, 3)
}

export function createFootprintViewModels(cards = [], favorites = []) {
  const favoriteBySource = new Map()
  favorites.forEach((record) => favoriteBySource.set(String(record.objectId), record))
  return cards.map((card) => {
    const favorite = favoriteBySource.get(String(card.sourceId))
    return {
      footprintId: String(card.id),
      sourceId: String(card.sourceId),
      favoriteId: favorite ? String(favorite.id) : '',
      contentType: normalizeContentType(card, card.snapshot?.category),
      title: card.title,
      author: card.author || '',
      createdAt: Number(card.createdAt || 0),
      duration: card.duration || '',
      media: normalizeMedia(card),
      latitude: card.hasLocation ? Number(card.latitude) : null,
      longitude: card.hasLocation ? Number(card.longitude) : null,
      hasLocation: !!card.hasLocation,
      address: card.address || '',
      isFavorite: !!favorite,
      folderId: favorite?.folderId || '',
      visibility: card.visibility || 'private',
      detailType: card.detailType || 'normal',
      availableState: card.availableState || 'available',
      likes: Number(card.likes || 0)
    }
  })
}

export function groupTimelineRecords(records = []) {
  const groups = new Map()
  records.forEach((record) => {
    const date = new Date(Number(record.createdAt || 0))
    if (Number.isNaN(date.getTime())) return
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(record)
  })
  return Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({
      date,
      items: items.slice().sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0))
    }))
}

const todayKey = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const buildScheduleFixtures = () => ({
  [todayKey()]: [
    { id: 'review', title: '代码审查', time: '09:00', description: '整理文档资料', location: '线上会议', type: 'work' },
    { id: 'dinner', title: '聚餐', time: '19:30', description: '享受生活', location: '成都', type: 'personal' }
  ]
})

const favoriteFixtures = {
  photos: [
    { id: 1, title: '锦江日落', author: '摄影师小王', location: '成都市锦江区', likes: 128, time: '2026-08-08 18:30', cover: '/static/logo.png' },
    { id: 2, title: '人民公园春色', author: '城市漫步', location: '成都市青羊区', likes: 89, time: '2026-08-07 16:15', cover: '/static/logo.png' }
  ],
  videos: [
    { id: 4, title: '春熙路街头表演', author: '街拍小哥', location: '成都市锦江区', likes: 234, time: '2026-08-06 16:45', thumbnail: '/static/logo.png', duration: '08:51' }
  ],
  articles: [
    { id: 6, title: '成都城市漫步攻略', author: '旅行达人', location: '成都市', likes: 445, time: '2026-08-05 09:15' }
  ],
  music: [
    { id: 8, title: '成都民谣现场', author: '民谣歌手', location: '成都城市音乐厅', likes: 267, time: '2026-08-04 19:30' }
  ],
  locations: [
    { id: 9, title: '宽窄巷子', author: '地点收藏', location: '成都市青羊区', likes: 89, time: '2026-08-03 11:00' },
    { id: 10, title: '锦里古街', author: '古建筑爱好者', location: '成都市武侯区', likes: 156, time: '2026-08-02 16:30' }
  ],
  services: [
    { id: 1001, type: 'service', name: '家电维修', author: '张师傅', location: { coordinates: [104.0668, 30.5728] }, address: '成都市锦江区春熙路', likes: 56, time: '2026-08-01 10:30', rating: 4.7 },
    { id: 1002, type: 'service', name: '上门开锁', author: '李师傅', location: { coordinates: [104.0431, 30.6765] }, address: '成都市武侯区火车南站', likes: 123, time: '2026-07-31 21:00', score: 4.9 }
  ]
}

const knownLocations = {
  1: [104.0832, 30.6571, '成都市锦江区春熙路', '锦江区'],
  2: [104.0559, 30.6733, '成都市青羊区人民公园', '青羊区'],
  4: [104.0816, 30.6547, '成都市锦江区春熙路', '锦江区'],
  8: [104.0669, 30.6643, '成都市青羊区音乐厅', '青羊区'],
  9: [104.0564, 30.6739, '成都市青羊区宽窄巷子', '青羊区'],
  10: [104.0812, 30.6518, '成都市武侯区锦里古街', '武侯区'],
  1001: [104.0668, 30.5728, '成都市锦江区春熙路', '锦江区'],
  1002: [104.0431, 30.6765, '成都市武侯区火车南站', '武侯区']
}

export function useMyData() {
  const userInfo = ref({ avatar: '/static/logo.png', username: '用户名', description: '这里是用户描述信息' })
  const profileStats = ref([])
  const scheduleData = ref(buildScheduleFixtures())
  const favoriteData = ref(favoriteFixtures)
  const footprintCards = ref([])
  const favoriteRecords = ref([])
  const timelineRecords = ref([])

  const footprintEntries = computed(() => createFootprintViewModels(footprintCards.value, favoriteRecords.value))
  const favoriteEntries = computed(() => footprintEntries.value.filter((item) => item.isFavorite))
  const userLocations = computed(() => footprintEntries.value.filter((item) => item.hasLocation).map((item) => ({
    id: item.sourceId,
    footprintId: item.footprintId,
    title: item.title,
    latitude: item.latitude,
    longitude: item.longitude,
    address: item.address,
    cover: item.media[0] || '',
    subtitle: item.author,
    likes: item.likes,
    type: item.contentType,
    detailType: item.detailType,
    layer: item.contentType
  })))

  const timelineEntries = computed(() => {
    const bySource = new Map(footprintEntries.value.map((item) => [String(item.sourceId), item]))
    return timelineRecords.value.map((record) => {
      const footprint = bySource.get(String(record.sourceId))
      return footprint || {
        footprintId: '', sourceId: String(record.sourceId || record.id), favoriteId: '',
        contentType: normalizeContentType(record), title: record.title || '时间轴记录',
        author: '', createdAt: Number(record.createdAt || 0), duration: '', media: [],
        latitude: null, longitude: null, hasLocation: false, address: '', isFavorite: false,
        folderId: '', visibility: record.private ? 'private' : 'public', detailType: record.type || 'normal',
        availableState: record.sourceDeleted ? 'deleted' : 'available', likes: 0
      }
    })
  })

  const hydrateRepositories = () => {
    const profile = profileApi.get()
    userInfo.value = {
      avatar: profile.avatar || '/static/logo.png', username: profile.username || '用户名',
      description: profile.description || '这里是用户描述信息', verified: !!profile.verified,
      interests: profile.interests || []
    }

    const seededFavorites = []
    const footprints = []
    Object.entries(favoriteData.value).forEach(([category, items]) => {
      items.forEach((item, index) => {
        const sourceId = String(item.id || `${category}-${index}`)
        const type = normalizeContentType(item, category)
        const known = knownLocations[item.id] || []
        const coordinates = item.location?.coordinates || (known.length ? known.slice(0, 2) : null)
        const address = item.address || (typeof item.location === 'string' ? item.location : '') || known[2] || ''
        const hasLocation = Array.isArray(coordinates) && coordinates.length === 2
        seededFavorites.push({
          id: `favorite-${category}-${sourceId}`, objectType: type, objectId: sourceId,
          folderId: 'default', availableState: 'available', title: item.title || item.name,
          snapshot: { ...item, category, contentType: type }, createdAt: Date.parse(item.time || '') || Date.now()
        })
        footprints.push({
          id: `footprint-${sourceId}`, sourceType: type, sourceId, detailType: type === 'photo' || type === 'music' ? 'normal' : type,
          contentType: type, title: item.title || item.name || '足迹内容', author: item.author || '',
          cover: item.cover || item.thumbnail || '', media: normalizeMedia(item), duration: item.duration || '',
          latitude: hasLocation ? Number(coordinates[1]) : null, longitude: hasLocation ? Number(coordinates[0]) : null,
          city: '成都', district: known[3] || '未定位', address, layer: type, likes: Number(item.likes || 0),
          locationPrecision: hasLocation ? 'exact' : 'hidden', visibility: 'public', snapshot: { ...item, category, contentType: type },
          dataOrigin: 'profile-fixture', createdAt: Date.parse(item.time || '') || Date.now(), deleted: false
        })
      })
    })
    favoriteApi.seed(seededFavorites)
    footprintApi.sync(footprints)

    const scheduledTimeline = Object.entries(scheduleData.value).flatMap(([date, items]) => items.map((item) => ({
      id: `timeline-event-${item.id}`, type: 'event', sourceId: String(item.id), title: item.title,
      private: false, createdAt: Date.parse(`${date} ${item.time}`) || Date.now()
    })))
    timelineApi.seed([
      ...scheduledTimeline,
      ...footprints.map((item) => ({ id: `timeline-${item.id}`, type: item.contentType, sourceId: item.sourceId, title: item.title, private: false, createdAt: item.createdAt }))
    ])

    footprintCards.value = footprintApi.cards()
    favoriteRecords.value = favoriteApi.list()
    timelineRecords.value = timelineApi.list()
    const stats = profileApi.stats()
    profileStats.value = [
      { number: stats.following, label: '关注' }, { number: stats.followers, label: '粉丝' }, { number: stats.posts, label: '动态' }
    ]
  }

  const refreshFavorites = () => { favoriteRecords.value = favoriteApi.list() }
  hydrateRepositories()

  return {
    userInfo, profileStats, scheduleData, favoriteData, footprintCards, footprintEntries,
    favoriteEntries, timelineEntries, userLocations, hydrateRepositories, refreshFavorites
  }
}

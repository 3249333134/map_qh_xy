import { creationApi } from './creation.js'
import { loadExploreDataCache } from '../mapExploreState.js'
import { readVersioned, writeVersioned } from './storage.js'

export const INTEREST_RADAR_CACHE_TTL = 60 * 1000
const CACHE_KEY = 'INTEREST_RADAR_CACHE_V3'
const VERSION = 3

const DEFAULT_INTERESTS = ['摄影', '漫步', '咖啡', '展览']
const kindMap = {
  normal: 'content',
  video: 'content',
  article: 'content',
  event: 'event',
  service: 'service',
  place: 'place',
  replica: 'place',
  track: 'content'
}

const clone = value => JSON.parse(JSON.stringify(value))
const toRad = value => Number(value) * Math.PI / 180

export function distanceKm(a = {}, b = {}) {
  const lat1 = Number(a.latitude)
  const lng1 = Number(a.longitude)
  const lat2 = Number(b.latitude)
  const lng2 = Number(b.longitude)
  if (![lat1, lng1, lat2, lng2].every(Number.isFinite)) return 0
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

export function blurPublicLocation(location = {}, seed = 0) {
  const latitude = Number(location.latitude)
  const longitude = Number(location.longitude)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  const direction = seed % 2 ? 1 : -1
  return {
    latitude: Number((latitude + direction * (0.0027 + (seed % 3) * 0.0004)).toFixed(4)),
    longitude: Number((longitude - direction * (0.0024 + (seed % 2) * 0.0005)).toFixed(4))
  }
}

function pointLocation(item = {}) {
  const coordinates = item.location?.type === 'Point' ? item.location.coordinates : null
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null
  const longitude = Number(coordinates[0])
  const latitude = Number(coordinates[1])
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null
}

export function formatFreshness(activeAt, now = Date.now()) {
  const elapsed = Math.max(0, now - Number(activeAt || 0))
  const minutes = Math.floor(elapsed / 60000)
  if (minutes < 3) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)} 小时前`
  return '今天'
}

function normalizeMapItem(item, center, now) {
  const location = pointLocation(item)
  const kind = kindMap[item.type]
  if (!location || !kind || item.authorOnly) return null
  const activeAt = Number(item.updatedAt || item.createdAt || now - 35 * 60 * 1000)
  const isOngoing = kind === 'event' && (
    item.status === 'ongoing' ||
    (new Date(item.startTime || 0).getTime() <= now && new Date(item.endTime || 0).getTime() >= now)
  )
  return {
    id: String(item._id || item.id),
    kind,
    title: String(item.name || item.title || '附近内容'),
    subtitle: isOngoing ? '正在发生 · 可立即查看' : String(item.description || item.address || (kind === 'service' ? '营业中 · 可预约' : '附近的新鲜内容')),
    sharedInterests: Array.isArray(item.tags) && item.tags.length ? item.tags.slice(0, 2) : DEFAULT_INTERESTS.slice(0, 1),
    distance: distanceKm(center, location),
    location,
    locationPrecision: 'exact',
    activeAt,
    freshness: formatFreshness(activeAt, now),
    anchorId: String(item._id || item.id),
    sourceItem: item,
    detailId: String(item._id || item.id),
    detailType: String(item.type || 'normal'),
    isLive: isOngoing
  }
}

function buildPublicPeopleFromContent(contentItems = [], center, now) {
  return contentItems
    .filter(item => item.sourceItem && item.sourceItem.author)
    .slice(0, 4)
    .map((content, index) => {
    const source = content.sourceItem
    const publicArea = blurPublicLocation(content.location, index)
    return {
      id: `public_author_${source.author}_${content.id}`,
      kind: 'person',
      title: String(source.author),
      subtitle: `发布了「${content.title}」`,
      sharedInterests: content.sharedInterests,
      distance: distanceKm(center, publicArea),
      location: publicArea,
      locationPrecision: 'fuzzy',
      activeAt: content.activeAt,
      freshness: formatFreshness(content.activeAt, now),
      anchorId: content.anchorId,
      detailId: content.detailId,
      detailType: content.detailType,
      sourceItem: source,
      isLive: now - content.activeAt < 10 * 60 * 1000,
      privacyLabel: '公开作者 · 模糊位置'
    }
  })
}

function buildFallbackMapItems(center, now) {
  const fixtures = [
    { id: 'radar_event_citywalk', kind: 'event', type: 'event', author: '林屿', title: '春熙路夜景漫步', subtitle: '正在集合 · 还可加入', interests: ['漫步', '摄影'], offset: [0.0042, -0.0021], minutes: 4, live: true },
    { id: 'radar_place_gallery', kind: 'place', type: 'place', author: '安安', title: '红星路青年艺术展', subtitle: '今日展览 · 距闭馆 3 小时', interests: ['展览', '艺术'], offset: [-0.0031, 0.0038], minutes: 18 },
    { id: 'radar_service_photo', kind: 'service', type: 'service', author: '木早', title: '街拍跟拍服务', subtitle: '营业中 · 30 分钟响应', interests: ['摄影', '街区'], offset: [0.0013, -0.0044], minutes: 11 },
    { id: 'radar_content_coffee', kind: 'content', type: 'article', author: '南璟', title: '巷子里的手冲咖啡地图', subtitle: '附近用户刚刚发布', interests: ['咖啡', '探店'], offset: [-0.0045, -0.0012], minutes: 7 },
    { id: 'radar_video_sunset', kind: 'content', type: 'video', author: '阿澈', title: '河畔日落延时摄影', subtitle: '2 分钟前发布 · 竖屏视频', interests: ['摄影', '日落'], offset: [0.0026, 0.0041], minutes: 2 },
    { id: 'radar_normal_bookshop', kind: 'content', type: 'normal', author: '千禾', title: '旧书店今日新到书单', subtitle: '附近动态 · 可以一起交换', interests: ['阅读', '街区'], offset: [-0.0018, 0.0048], minutes: 14 },
    { id: 'radar_service_pottery', kind: 'service', type: 'service', author: '器物所', title: '周末陶艺体验课', subtitle: '营业中 · 今日仍可预约', interests: ['手作', '体验'], offset: [0.0051, 0.0015], minutes: 22 },
    { id: 'radar_event_music', kind: 'event', type: 'event', author: '听风', title: '屋顶落日音乐会', subtitle: '即将开始 · 余 12 个名额', interests: ['音乐', '日落'], offset: [-0.0053, 0.0026], minutes: 9 },
    { id: 'radar_place_park', kind: 'place', type: 'place', author: '城市漫游', title: '口袋公园观景台', subtitle: '附近热门地点 · 适合停留', interests: ['公园', '漫步'], offset: [0.0038, 0.0052], minutes: 31 },
    { id: 'radar_track_cycle', kind: 'content', type: 'track', author: '山雀', title: '城市绿道轻骑路线', subtitle: '8.6km · 约 52 分钟', interests: ['骑行', '路线'], offset: [-0.0042, -0.0047], minutes: 26 }
  ]
  return fixtures.map(item => {
    const location = {
      longitude: Number(center.longitude) + item.offset[0],
      latitude: Number(center.latitude) + item.offset[1]
    }
    const activeAt = now - item.minutes * 60000
    return {
      id: item.id,
      kind: item.kind,
      title: item.title,
      subtitle: item.subtitle,
      sharedInterests: item.interests,
      distance: distanceKm(center, location),
      location,
      locationPrecision: 'exact',
      activeAt,
      freshness: formatFreshness(activeAt, now),
      anchorId: item.id,
      detailId: item.id,
      detailType: item.type,
      isLive: Boolean(item.live),
      sourceItem: {
        _id: item.id,
        id: item.id,
        type: item.type,
        author: item.author,
        name: item.title,
        title: item.title,
        description: item.subtitle,
        tags: item.interests,
        createdAt: activeAt,
        location: { type: 'Point', coordinates: [location.longitude, location.latitude] }
      }
    }
  })
}

export function rankRadarItems(items = [], query = {}) {
  const interests = new Set((query.interestTags || DEFAULT_INTERESTS).map(String))
  const now = Number(query.requestedAt || Date.now())
  return [...items]
    .map(item => {
      const shared = (item.sharedInterests || []).filter(tag => interests.has(String(tag))).length
      const freshness = Math.max(0, 1 - (now - Number(item.activeAt || 0)) / (24 * 60 * 60 * 1000))
      const proximity = Math.max(0, 1 - Number(item.distance || 0) / Math.max(1, Number(query.radiusKm || 5)))
      return { ...item, score: shared * 30 + freshness * 35 + proximity * 25 + (item.isLive ? 20 : 0) }
    })
    .sort((a, b) => b.score - a.score)
}

export const interestRadarApi = {
  async fetchNearby(query = {}, options = {}) {
    const now = Number(query.requestedAt || Date.now())
    const center = {
      latitude: Number(query.center?.latitude),
      longitude: Number(query.center?.longitude)
    }
    const radiusKm = Math.max(1, Number(query.radiusKm || 5))
    const cache = readVersioned(CACHE_KEY, VERSION, null)
    const cacheMatches = cache &&
      Math.abs(Number(cache.center?.latitude) - center.latitude) < 0.01 &&
      Math.abs(Number(cache.center?.longitude) - center.longitude) < 0.01 &&
      now - Number(cache.generatedAt || 0) < INTEREST_RADAR_CACHE_TTL
    if (!options.force && cacheMatches) return { ...clone(cache), cached: true }

    await new Promise(resolve => setTimeout(resolve, options.immediate ? 0 : 360))
    const cachedMap = loadExploreDataCache({ allowStale: true })
    const sourceItems = [
      ...(cachedMap?.items || []),
      ...creationApi.getMapItems()
    ]
    const normalized = sourceItems
      .map(item => normalizeMapItem(item, center, now))
      .filter(Boolean)
      .filter(item => item.distance <= radiusKm)
    const fallbackItems = buildFallbackMapItems(center, now)
    const mapItems = normalized.length >= 10
      ? normalized
      : [...new Map([...normalized, ...fallbackItems].map(item => [item.id, item])).values()]
    const people = buildPublicPeopleFromContent(mapItems, center, now).filter(item => item.distance <= radiusKm)
    const unique = new Map([...people, ...mapItems].map(item => [item.id, item]))
    const items = rankRadarItems([...unique.values()], { ...query, radiusKm, requestedAt: now }).slice(0, 14)
    const matchScore = Math.min(96, Math.round(52 + items.reduce((sum, item) => sum + Math.min(3, item.sharedInterests?.length || 0), 0) * 3))
    const nearbyHeat = Math.min(98, Math.round(38 + items.length * 6 + items.filter(item => item.isLive).length * 5))
    const result = {
      items,
      interestCount: items.length,
      matchScore,
      nearbyHeat,
      radiusKm,
      generatedAt: now,
      source: normalized.length ? 'map-cache-and-public-demo' : 'deterministic-demo-adapter',
      center
    }
    writeVersioned(CACHE_KEY, VERSION, result)
    return clone(result)
  },

  clearCache() {
    try { uni.removeStorageSync(CACHE_KEY) } catch (e) {}
  }
}

export default interestRadarApi

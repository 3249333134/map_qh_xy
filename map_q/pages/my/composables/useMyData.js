import { ref } from 'vue'
import { favoriteApi, footprintApi, profileApi, timelineApi } from '../../../utils/api/social.js'

export function useMyData() {
  // 用户信息
  const userInfo = ref({
    avatar: '/static/logo.png',
    username: '用户名',
    description: '这里是用户描述信息'
  })

  // 个人资料统计
  const profileStats = ref([
    { number: 128, label: '关注' },
    { number: 256, label: '粉丝' },
    { number: 32, label: '动态' }
  ])

  // 日程数据
  const scheduleData = ref([
    { id: 1, title: '会议', time: '09:00', date: '2024-01-20', location: '会议室A', content: '项目讨论会议' },
    { id: 2, title: '午餐', time: '12:30', date: '2024-01-20', location: '餐厅', content: '与客户午餐' }
  ])

  // 收藏数据示例（与原来结构保持一致）
  const favoriteData = ref({
    photos: [
      { id: 1, title: '美丽的日落', icon: '🌅', author: '摄影师小王', location: '成都市锦江区', likes: 128, time: '2024-01-15 18:30' },
      { id: 2, title: '城市夜景', icon: '🌃', author: '夜拍达人', location: '成都市武侯区', likes: 89, time: '2024-01-14 20:15' },
      { id: 3, title: '春天的花朵', icon: '🌸', author: '花卉爱好者', location: '成都市青羊区', likes: 156, time: '2024-01-13 14:20' }
    ],
    videos: [
      { id: 4, title: '街头表演', icon: '🎭', author: '街拍小哥', location: '成都市春熙路', likes: 234, time: '2024-01-12 16:45' },
      { id: 5, title: '美食制作', icon: '🍜', author: '美食博主', location: '成都市宽窄巷子', likes: 312, time: '2024-01-11 12:30' }
    ],
    articles: [
      { id: 6, title: '成都旅游攻略', icon: '📖', author: '旅游达人', location: '成都市', likes: 445, time: '2024-01-10 09:15' },
      { id: 7, title: '川菜文化探索', icon: '📚', author: '文化学者', location: '成都市金牛区', likes: 178, time: '2024-01-09 15:20' }
    ],
    music: [
      { id: 8, title: '成都民谣', icon: '🎵', author: '民谣歌手', location: '成都市音乐厅', likes: 267, time: '2024-01-08 19:30' }
    ],
    locations: [
      { id: 9, title: '宽窄巷子', icon: '🏛️', author: '地点收藏', location: '成都市青羊区', likes: 89, time: '2024-01-07 11:00' },
      { id: 10, title: '锦里古街', icon: '🏮', author: '古建筑爱好者', location: '成都市武侯区', likes: 156, time: '2024-01-06 16:30' }
    ],
    services: [
      { id: 1001, type: 'service', name: '家电维修', author: '张师傅', location: { coordinates: [104.0668, 30.5728] }, address: '成都市锦江区春熙路', likes: 56, time: '2024-01-05 10:30', rating: 4.7 },
      { id: 1002, type: 'service', name: '上门开锁', author: '李师傅', location: { coordinates: [104.0431, 30.6765] }, address: '成都市武侯区火车南站', likes: 123, time: '2024-01-04 21:00', score: 4.9 },
      { id: 1003, type: 'service', name: '管道疏通', author: '杨师傅', location: { coordinates: [104.0720, 30.6710] }, address: '成都市青羊区太升南路', likes: 32, time: '2024-01-03 08:45', rating: 4.5 }
    ]
  })

  const userLocations = ref([])
  const footprintCards = ref([])
  const knownLocations = {
    1: { coordinates: [104.0832, 30.6571], address: '成都市锦江区春熙路', district: '锦江区' },
    2: { coordinates: [104.0431, 30.6324], address: '成都市武侯区科华北路', district: '武侯区' },
    3: { coordinates: [104.0559, 30.6733], address: '成都市青羊区人民公园', district: '青羊区' },
    4: { coordinates: [104.0816, 30.6547], address: '成都市锦江区春熙路', district: '锦江区' },
    5: { coordinates: [104.0577, 30.6718], address: '成都市青羊区宽窄巷子', district: '青羊区' },
    7: { coordinates: [104.0722, 30.6991], address: '成都市金牛区文化路', district: '金牛区' },
    8: { coordinates: [104.0669, 30.6643], address: '成都市青羊区音乐厅', district: '青羊区' },
    9: { coordinates: [104.0564, 30.6739], address: '成都市青羊区宽窄巷子', district: '青羊区' },
    10: { coordinates: [104.0812, 30.6518], address: '成都市锦江区锦里古街', district: '锦江区' },
    1001: { coordinates: [104.0668, 30.5728], address: '成都市锦江区春熙路', district: '锦江区' },
    1002: { coordinates: [104.0431, 30.6765], address: '成都市武侯区火车南站', district: '武侯区' },
    1003: { coordinates: [104.0720, 30.6710], address: '成都市青羊区太升南路', district: '青羊区' }
  }

  const resolveKnownLocation = (item) => {
    if (!item || typeof item !== 'object') return { coordinates: null, address: '', district: '未定位' }
    const coordinates = item.location && Array.isArray(item.location.coordinates)
      ? item.location.coordinates
      : Array.isArray(item.coordinates) ? item.coordinates : null
    const known = knownLocations[item._id || item.id] || {}
    return {
      coordinates: coordinates || known.coordinates || null,
      address: item.address || known.address || '',
      district: item.district || known.district || '未定位'
    }
  }

  const buildUserLocationsFromFootprints = () => {
    userLocations.value = footprintApi.cards()
      .filter(item => item.hasLocation)
      .map(item => ({
        id: item.sourceId,
        footprintId: item.id,
        title: item.title,
        latitude: item.latitude,
        longitude: item.longitude,
        address: item.address,
        cover: item.cover,
        subtitle: item.author || item.subtitle,
        likes: item.likes,
        type: item.detailType === 'service' ? 'service' : item.detailType,
        detailType: item.detailType,
        layer: item.layer
      }))
  }

  const hydrateRepositories = () => {
    const profile = profileApi.get()
    userInfo.value = {
      avatar: profile.avatar || '/static/logo.png',
      username: profile.username || '用户名',
      description: profile.description || '这里是用户描述信息',
      verified: !!profile.verified,
      interests: profile.interests || []
    }

    const favoriteRecords = []
    Object.keys(favoriteData.value || {}).forEach((category) => {
      ;(favoriteData.value[category] || []).forEach((item, index) => {
        favoriteRecords.push({
          id: `favorite-${category}-${item.id || index}`,
          objectType: category === 'locations' ? 'place' : category === 'services' ? 'service' : 'content',
          objectId: String(item.id || index),
          folderId: 'default',
          availableState: 'available',
          title: item.title || item.name,
          snapshot: item,
          createdAt: Date.parse(item.time || '') || Date.now() - index * 86400000
        })
      })
    })
    favoriteApi.seed(favoriteRecords)

    const detailTypes = {
      photos: 'normal',
      videos: 'video',
      articles: 'article',
      music: 'normal',
      locations: 'place',
      services: 'service'
    }
    const footprints = []
    Object.keys(favoriteData.value || {}).forEach((category) => {
      ;(favoriteData.value[category] || []).forEach((item, index) => {
        const location = resolveKnownLocation(item)
        const coordinates = location.coordinates
        const hasLocation = Array.isArray(coordinates) && coordinates.length === 2
        const detailType = detailTypes[category] || 'normal'
        const layer = detailType === 'normal' || detailType === 'video' || detailType === 'article'
          ? 'content'
          : detailType
        footprints.push({
          id: `footprint-${item.id || `${category}-${index}`}`,
          sourceType: layer,
          sourceId: String(item.id || `${category}-${index}`),
          detailType,
          title: item.title || item.name || '足迹内容',
          author: item.author || '',
          subtitle: item.desc || '',
          cover: item.cover || item.thumbnail || '',
          latitude: hasLocation ? coordinates[1] : null,
          longitude: hasLocation ? coordinates[0] : null,
          city: '成都',
          district: location.district,
          address: location.address,
          layer,
          likes: Number(item.likes || 0),
          locationPrecision: hasLocation ? 'exact' : 'hidden',
          visibility: 'public',
          snapshot: item,
          dataOrigin: 'profile-fixture',
          createdAt: Date.parse(item.time || '') || Date.now() - index * 86400000,
          deleted: false
        })
      })
    })
    footprintApi.sync(footprints)
    footprintCards.value = footprintApi.cards()
    buildUserLocationsFromFootprints()

    timelineApi.seed([
      ...scheduleData.value.map((item, index) => ({
        id: `timeline-event-${item.id}`,
        type: 'event',
        sourceId: String(item.id),
        title: item.title,
        private: false,
        createdAt: Date.parse(`${item.date} ${item.time}`) || Date.now() - index * 86400000
      })),
      ...footprints.map((item) => ({
        id: `timeline-${item.id}`,
        type: item.sourceType,
        sourceId: item.sourceId,
        title: item.title,
        private: item.visibility !== 'public',
        createdAt: item.createdAt
      }))
    ])

    const stats = profileApi.stats()
    profileStats.value = [
      { number: stats.following, label: '关注' },
      { number: stats.followers, label: '粉丝' },
      { number: stats.posts, label: '动态' }
    ]
  }

  hydrateRepositories()

  return {
    userInfo,
    profileStats,
    scheduleData,
    favoriteData,
    userLocations,
    footprintCards,
    resolveKnownLocation,
    buildUserLocationsFromFootprints,
    hydrateRepositories
  }
}

import { ROUTE_PLANNER } from './routePlanner.js'

const CARD_TYPE_PATTERN = ['normal', 'video', 'article', 'place', 'event', 'normal', 'video', 'article', 'track', 'place', 'event', 'normal']

const TITLE_PREFIXES = {
  'hot': { normal: '热门打卡', video: '热门视频', article: '热门攻略', place: '热门地点', event: '热门活动', track: '热门路线' },
  'exhibition': { normal: '展会推荐', video: '展会视频', article: '展会资讯', place: '展馆地址', event: '展会活动', track: '逛展路线' },
  'personal': { normal: '个人分享', video: '生活视频', article: '心得笔记', place: '私密地点', event: '私人活动', track: '个人轨迹' },
  'all': { normal: '推荐打卡', video: '精彩视频', article: '精选文章', place: '推荐地点', event: '推荐活动', track: '推荐路线' }
}

const PREFIX_MAP = {
  'hot': '热门',
  'exhibition': '展会',
  'personal': '个人',
  'all': '推荐'
}

const ADDRESS_MAP = {
  'hot': '成都市锦江区',
  'exhibition': '成都市高新区',
  'personal': '成都市武侯区',
  'all': '成都市'
}

const buildTrackCard = async (index, titles, activeCategory, currentPage, centerLat, centerLng, latRange, lngRange) => {
  let trackPoints = []
  let highEnergyPoints = []
  let distanceKm = '0.00'
  let duration = '0分钟'

  try {
    const routeResult = await ROUTE_PLANNER.getFixedRoute()
    if (routeResult.success && routeResult.path.length > 0) {
      trackPoints = routeResult.path
      distanceKm = (routeResult.distance / 1000).toFixed(2)
      const durationMinutes = Math.round(routeResult.duration / 60) || 30
      duration = `${durationMinutes}分钟`
    }
  } catch (error) {
    console.warn('Mock路径规划失败，使用备用路线:', error)
  }

  if (trackPoints.length === 0) {
    const startLng = 104.056801
    const startLat = 30.562815
    const endLng = 104.076801
    const endLat = 30.582815
    const totalPoints = 30
    for (let j = 0; j < totalPoints; j++) {
      const progress = j / (totalPoints - 1)
      const lngP = startLng + (endLng - startLng) * progress
      const latP = startLat + (endLat - startLat) * progress
      trackPoints.push([lngP, latP])
    }
    distanceKm = '2.50'
    duration = '20分钟'
  }

  highEnergyPoints = []
  if (trackPoints.length > 0) {
    highEnergyPoints.push({ coordinate: trackPoints[0], energy: 100, label: '起点' })
    const pointCount = Math.floor(Math.random() * 2) + 3
    const labels = ['补给站', '观景台', '休息点', '打卡点', '特色点']
    for (let k = 1; k <= pointCount; k++) {
      const pointIndex = Math.floor((k / (pointCount + 1)) * trackPoints.length)
      highEnergyPoints.push({
        coordinate: trackPoints[Math.min(pointIndex, trackPoints.length - 1)],
        energy: Math.floor(Math.random() * 60) + 40,
        label: labels[(k - 1) % labels.length]
      })
    }
    highEnergyPoints.push({ coordinate: trackPoints[trackPoints.length - 1], energy: 100, label: '终点' })
  }

  return {
    _id: `track_${activeCategory}_${currentPage}_${index}_${Date.now()}`,
    type: 'track',
    name: `${titles.track} ${Math.floor(index / 6) + 1}`,
    author: `用户${Math.floor(Math.random() * 1000)}`,
    distance: distanceKm,
    location: { type: 'LineString', coordinates: trackPoints },
    highEnergyPoints: highEnergyPoints,
    likes: Math.floor(Math.random() * 500) + 50,
    duration: duration
  }
}

const buildNormalCard = (index, type, titles, addressPrefix, activeCategory, currentPage, lng, lat) => {
  const baseData = {
    _id: `${activeCategory}_${currentPage}_${index}_${Date.now()}`,
    type: type,
    name: `${titles[type]} ${(index % 10) + 1}`,
    author: `用户${Math.floor(Math.random() * 1000)}`,
    address: `${addressPrefix}测试地址 ${(index % 10) + 1}`,
    description: `这是${titles[type]}的描述内容，包含了丰富的信息和详细的介绍。`,
    location: { type: 'Point', coordinates: [lng, lat] },
    likes: Math.floor(Math.random() * 500) + 10
  }

  switch (type) {
    case 'video':
      baseData.plays = Math.floor(Math.random() * 50000) + 100
      baseData.duration = Math.floor(Math.random() * 600) + 30
      baseData.cover = ''
      break
    case 'article':
      baseData.reads = Math.floor(Math.random() * 20000) + 50
      baseData.summary = `本文介绍了${baseData.name}的相关内容，包含详细的步骤说明和实用技巧，帮助读者更好地了解和掌握...`
      baseData.cover = ''
      break
    case 'place':
      baseData.rating = (Math.random() * 1.5 + 3.5).toFixed(1)
      baseData.tags = ['热门', '推荐', '必去', '拍照'].slice(0, Math.floor(Math.random() * 3) + 1)
      baseData.address = `${addressPrefix}春熙路${(index % 5) + 1}号`
      break
    case 'event':
      const now = Date.now()
      const startOffset = Math.random() > 0.5 ? Math.random() * 7 * 24 * 60 * 60 * 1000 : -Math.random() * 7 * 24 * 60 * 60 * 1000
      baseData.startTime = new Date(now + startOffset).toISOString()
      baseData.endTime = new Date(now + startOffset + 3 * 60 * 60 * 1000).toISOString()
      baseData.participants = Math.floor(Math.random() * 500) + 10
      baseData.maxParticipants = Math.floor(Math.random() * 200) + 200
      baseData.status = startOffset > 0 ? 'upcoming' : 'ongoing'
      baseData.cover = ''
      break
    default:
      baseData.cover = ''
      break
  }

  return baseData
}

export const generateMockMapData = async (activeCategory, mapConfig, mapBounds, currentPage, existingCount, isLoadMore = false) => {
  const count = 12
  const startIndex = existingCount

  const prefix = PREFIX_MAP[activeCategory] || '推荐'
  const addressPrefix = ADDRESS_MAP[activeCategory] || '成都市'
  const titles = TITLE_PREFIXES[activeCategory] || TITLE_PREFIXES['all']

  let centerLat, centerLng, latRange, lngRange
  if (mapBounds) {
    centerLat = (mapBounds.northeast.latitude + mapBounds.southwest.latitude) / 2
    centerLng = (mapBounds.northeast.longitude + mapBounds.southwest.longitude) / 2
    latRange = mapBounds.northeast.latitude - mapBounds.southwest.latitude
    lngRange = mapBounds.northeast.longitude - mapBounds.southwest.longitude
  } else {
    centerLat = mapConfig.latitude
    centerLng = mapConfig.longitude
    latRange = 0.02
    lngRange = 0.02
  }

  const result = []

  for (let i = 0; i < count; i++) {
    const index = startIndex + i
    const type = CARD_TYPE_PATTERN[index % CARD_TYPE_PATTERN.length]
    const lng = centerLng + (Math.random() - 0.5) * lngRange * 0.8
    const lat = centerLat + (Math.random() - 0.5) * latRange * 0.8

    if (type === 'track') {
      const trackCard = await buildTrackCard(index, titles, activeCategory, currentPage, centerLat, centerLng, latRange, lngRange)
      result.push(trackCard)
    } else {
      result.push(buildNormalCard(index, type, titles, addressPrefix, activeCategory, currentPage, lng, lat))
    }
  }

  return result
}

export const isMockEnabled = () => {
  try {
    if (typeof process !== 'undefined' && process.env && process.env.VUE_APP_USE_MOCK) {
      return process.env.VUE_APP_USE_MOCK === 'true'
    }
    const mockFlag = uni.getStorageSync('USE_MOCK_DATA')
    if (mockFlag !== '') {
      return mockFlag === true || mockFlag === 'true'
    }
  } catch (e) {}
  return true
}

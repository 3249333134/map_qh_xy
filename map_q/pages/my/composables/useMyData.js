import { ref } from 'vue'

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
  const _favoriteRandomLocations = {}

  const getRandomCoordinateInChengdu = () => {
    const minLat = 30.55, maxLat = 30.75
    const minLng = 104.03, maxLng = 104.15
    const lat = +(minLat + Math.random() * (maxLat - minLat)).toFixed(6)
    const lng = +(minLng + Math.random() * (maxLng - minLng)).toFixed(6)
    return [lng, lat]
  }

  const getRandomAddress = () => {
    const addresses = [
      '成都市锦江区春熙路',
      '成都市武侯区科华北路',
      '成都市青羊区顺城大街',
      '成都市高新区天府大道',
      '成都市金牛区一环路北一段'
    ]
    return addresses[Math.floor(Math.random() * addresses.length)]
  }

  const ensureRandomLocationForIndex = (item, index, categoryKey) => {
    if (!item || typeof item !== 'object') return { coordinates: null, address: '' }
    const hasCoords = !!(item.location && Array.isArray(item.location.coordinates) && item.location.coordinates.length === 2)
    const coordsFromAlt = Array.isArray(item.coordinates) ? item.coordinates : null
    if (hasCoords) {
      return { coordinates: item.location.coordinates, address: item.address || '' }
    }
    if (coordsFromAlt) {
      return { coordinates: coordsFromAlt, address: item.address || '' }
    }
    const key = (item._id || item.id) ? (item._id || item.id) : `${categoryKey}-${index}`
    if (!_favoriteRandomLocations[key]) {
      const coordinates = getRandomCoordinateInChengdu()
      _favoriteRandomLocations[key] = {
        coordinates,
        address: item.address || getRandomAddress()
      }
    }
    return _favoriteRandomLocations[key]
  }

  const buildUserLocationsFromFavorites = () => {
    try {
      const result = []
      const data = favoriteData.value || {}
      const categoryKeys = Object.keys(data)
      categoryKeys.forEach((key) => {
        const list = Array.isArray(data[key]) ? data[key] : []
        list.forEach((item, index) => {
          const isService = item && (item.type === 'service' || key === 'services' || item.category === 'service' || item.category === 'services')
          let coords = null
          let address = item.address || ''
          if (isService) {
            if (item.location && Array.isArray(item.location.coordinates)) {
              coords = item.location.coordinates
            } else if (Array.isArray(item.coordinates)) {
              coords = item.coordinates
            }
          } else {
            const ensured = ensureRandomLocationForIndex(item, index, key)
            coords = ensured.coordinates
            address = address || ensured.address
          }
          if (Array.isArray(coords) && coords.length === 2) {
            const [lng, lat] = coords
            result.push({
              id: item._id || item.id || `${key}-${index}`,
              title: item.title || item.name || '收藏项',
              latitude: lat,
              longitude: lng,
              address,
              cover: item.cover || item.thumbnail || (item.images && item.images[0]) || '',
              subtitle: item.author || item.subtitle || item.desc || '',
              likes: typeof item.likes === 'number' ? item.likes : (parseInt(item.likes, 10) || undefined),
              type: isService ? 'service' : 'content'
            })
          }
        })
      })
      userLocations.value = result
    } catch (e) {
      console.warn('根据收藏数据构建位置标记点失败', e)
    }
  }

  return {
    userInfo,
    profileStats,
    scheduleData,
    favoriteData,
    userLocations,
    ensureRandomLocationForIndex,
    getRandomCoordinateInChengdu,
    getRandomAddress,
    buildUserLocationsFromFavorites
  }
}
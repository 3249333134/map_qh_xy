import { ROUTE_PLANNER } from './routePlanner.js'

const CATEGORY_PREFIX = {
  'repair': { prefix: '维修', address: '成都市锦江区' },
  'clean': { prefix: '清洁', address: '成都市高新区' },
  'delivery': { prefix: '配送', address: '成都市武侯区' }
}

const buildServiceTrackCard = async (index, prefix, centerLat, centerLng, latRange, lngRange, activeCategory, currentPage) => {
  let trackPoints = []
  let highEnergyPoints = []
  let distance = (Math.random() * 3 + 1).toFixed(1)

  try {
    const routeResult = await ROUTE_PLANNER.getFixedRoute()
    if (routeResult.success && routeResult.path.length > 0) {
      trackPoints = routeResult.path
      distance = (routeResult.distance / 1000).toFixed(2)
    }
  } catch (error) {
    console.warn('Mock服务路径规划失败，使用备用路线:', error)
  }

  if (trackPoints.length === 0) {
    const startLng = centerLng - 0.01
    const startLat = centerLat - 0.01
    const endLng = centerLng + 0.01
    const endLat = centerLat + 0.01
    const totalPoints = 30
    for (let j = 0; j < totalPoints; j++) {
      const progress = j / (totalPoints - 1)
      const lng = startLng + (endLng - startLng) * progress
      const lat = startLat + (endLat - startLat) * progress
      trackPoints.push([lng, lat])
    }
  }

  highEnergyPoints = []
  const pointCount = Math.floor(Math.random() * 3) + 3
  const labels = ['起点', '补给站', '观景台', '最高点', '终点']
  for (let k = 0; k < pointCount; k++) {
    const pointIndex = Math.floor((k / pointCount) * trackPoints.length)
    highEnergyPoints.push({
      coordinate: trackPoints[pointIndex],
      energy: Math.floor(Math.random() * 50) + 50,
      label: labels[k] || `关键点${k + 1}`
    })
  }

  return {
    _id: `track_${activeCategory}_${currentPage}_${index}_${Date.now()}`,
    type: 'track',
    name: `${prefix}跑步路线 ${Math.floor(index / 5) + 1}`,
    author: `跑者${Math.floor(Math.random() * 1000)}`,
    distance: distance,
    location: { type: 'LineString', coordinates: trackPoints },
    highEnergyPoints: highEnergyPoints,
    likes: Math.floor(Math.random() * 500)
  }
}

const buildServiceCard = (index, prefix, addressPrefix, centerLat, centerLng, latRange, lngRange, activeCategory, currentPage) => {
  return {
    _id: `${activeCategory}_${currentPage}_${index}_${Date.now()}`,
    type: 'service',
    name: `${prefix}服务 ${index + 1}`,
    author: `服务商${Math.floor(Math.random() * 1000)}`,
    address: `${addressPrefix}测试地址 ${index + 1}`,
    description: `这是一个${prefix}服务测试描述 ${index + 1}`,
    location: {
      type: 'Point',
      coordinates: [
        centerLng + (Math.random() - 0.5) * lngRange * 0.8,
        centerLat + (Math.random() - 0.5) * latRange * 0.8
      ]
    }
  }
}

export const generateServiceMockData = async (activeCategory, mapConfig, mapBounds, currentPage, existingCount, isLoadMore = false) => {
  const count = 10
  const startIndex = existingCount

  const catConfig = CATEGORY_PREFIX[activeCategory] || { prefix: '全部', address: '成都市' }
  const prefix = catConfig.prefix
  const addressPrefix = catConfig.address

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
    if ((index + 1) % 5 === 0) {
      const trackCard = await buildServiceTrackCard(
        index, prefix, centerLat, centerLng, latRange, lngRange, activeCategory, currentPage
      )
      result.push(trackCard)
    } else {
      result.push(buildServiceCard(
        index, prefix, addressPrefix, centerLat, centerLng, latRange, lngRange, activeCategory, currentPage
      ))
    }
  }

  return result
}

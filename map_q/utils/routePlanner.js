// 路径规划服务 - 使用腾讯地图方向API获取真实道路轨迹
const TENCENT_MAP_KEY = 'ISSBZ-BQA6T-J2SXF-VSDGE-A7NZ5-U4B3K'

// 默认起终点（武汉工程大学附近）
const DEFAULT_START = [114.3980, 30.5150]
const DEFAULT_END = [114.4120, 30.5280]

export const ROUTE_PLANNER = {
  // 获取真实驾车路线 - 使用腾讯地图方向API
  getFixedRoute: async (start, end) => {
    const startLng = start ? start[0] : DEFAULT_START[0]
    const startLat = start ? start[1] : DEFAULT_START[1]
    const endLng = end ? end[0] : DEFAULT_END[0]
    const endLat = end ? end[1] : DEFAULT_END[1]

    console.log('调用腾讯地图驾车路线规划API...')

    try {
      const url = `https://apis.map.qq.com/ws/direction/v1/driving/?from=${startLat},${startLng}&to=${endLat},${endLng}&key=${TENCENT_MAP_KEY}`

      const res = await uni.request({
        url: url,
        method: 'GET'
      })

      const data = res.data || res

      if (data.status !== 0 || !data.result || !data.result.routes || data.result.routes.length === 0) {
        console.warn('腾讯地图路线规划失败，使用备用方案:', data)
        return ROUTE_PLANNER.getFallbackRoute()
      }

      const route = data.result.routes[0]
      const polylineStr = route.polyline

      if (!polylineStr) {
        console.warn('路线数据中没有polyline字段')
        return ROUTE_PLANNER.getFallbackRoute()
      }

      // 解码polyline
      let path = ROUTE_PLANNER.decodePolyline(polylineStr)

      // 如果解码后为空，使用备用路线
      if (!path || path.length < 2) {
        console.warn('polyline解码失败或数据为空，使用备用方案')
        return ROUTE_PLANNER.getFallbackRoute()
      }

      console.log('获取真实驾车路线成功，点数:', path.length, '距离:', route.distance, '米, 时长:', route.duration, '秒')

      return {
        success: true,
        path: path,
        distance: Math.round(route.distance / 100) / 10,
        duration: route.duration || Math.round(route.distance / 80)
      }
    } catch (error) {
      console.error('调用腾讯地图路线规划API失败:', error)
      return ROUTE_PLANNER.getFallbackRoute()
    }
  },

  // 备用路线（当API调用失败时使用）
  getFallbackRoute: () => {
    console.log('使用备用路线数据')
    const waypoints = [
      [114.3980, 30.5150],
      [114.4020, 30.5152],
      [114.4035, 30.5170],
      [114.4030, 30.5195],
      [114.4005, 30.5210],
      [114.3985, 30.5230],
      [114.4010, 30.5250],
      [114.4050, 30.5255],
      [114.4075, 30.5235],
      [114.4070, 30.5200],
      [114.4045, 30.5180],
      [114.4060, 30.5155],
      [114.4100, 30.5160],
      [114.4120, 30.5185],
      [114.4115, 30.5220],
      [114.4090, 30.5245],
      [114.4060, 30.5270],
      [114.4020, 30.5280]
    ]

    const path = []
    const segmentsPerLeg = 15

    for (let i = 0; i < waypoints.length - 1; i++) {
      const start = waypoints[i]
      const end = waypoints[i + 1]
      for (let j = 0; j < segmentsPerLeg; j++) {
        const t = j / segmentsPerLeg
        const eased = 0.5 - 0.5 * Math.cos(t * Math.PI)
        const lng = start[0] + (end[0] - start[0]) * eased
        const lat = start[1] + (end[1] - start[1]) * eased
        path.push([lng, lat])
      }
    }
    path.push(waypoints[waypoints.length - 1])

    let totalDistance = 0
    for (let i = 1; i < path.length; i++) {
      const dx = (path[i][0] - path[i - 1][0]) * 111000 * Math.cos(path[i][1] * Math.PI / 180)
      const dy = (path[i][1] - path[i - 1][1]) * 111000
      totalDistance += Math.sqrt(dx * dx + dy * dy)
    }

    return {
      success: true,
      path: path,
      distance: Math.round(totalDistance / 100) / 10,
      duration: Math.round(totalDistance / 80)
    }
  },
  
  // 多点路径规划
  planRouteWithPoints: async (points) => {
    console.log('多点路径规划，点数:', points.length)
    
    if (!points || points.length < 2) {
      return {
        success: false,
        path: [],
        distance: 0,
        duration: 0
      }
    }
    
    try {
      const path = []
      let totalDistance = 0
      
      for (let i = 0; i < points.length - 1; i++) {
        const start = points[i]
        const end = points[i + 1]
        
        const segmentPoints = 20
        for (let j = 0; j < segmentPoints; j++) {
          const progress = j / (segmentPoints - 1)
          const lng = start[0] + (end[0] - start[0]) * progress
          const lat = start[1] + (end[1] - start[1]) * progress
          path.push([lng, lat])
        }
        
        const dx = (end[0] - start[0]) * 111000 * Math.cos(start[1] * Math.PI / 180)
        const dy = (end[1] - start[1]) * 111000
        totalDistance += Math.sqrt(dx * dx + dy * dy)
      }
      
      return {
        success: true,
        path: path,
        distance: totalDistance,
        duration: Math.round(totalDistance / 50) * 60
      }
    } catch (error) {
      console.error('多点路径规划失败:', error)
      return {
        success: false,
        path: [],
        distance: 0,
        duration: 0
      }
    }
  },
  
  // 解码polyline - 支持字符串和数组格式
  decodePolyline: (encoded) => {
    // 如果是数组，直接返回（已经是解码后的坐标点）
    if (Array.isArray(encoded)) {
      console.log('polyline已是数组格式，直接返回')
      return encoded
    }

    // 如果不是字符串，报错并返回空数组
    if (typeof encoded !== 'string') {
      console.error('polyline格式错误，既不是字符串也不是数组:', typeof encoded, encoded)
      return []
    }

    const points = []
    let index = 0
    const len = encoded.length
    let lat = 0
    let lng = 0

    while (index < len) {
      let b, shift = 0, result = 0
      do {
        b = encoded.charCodeAt(index++) - 63
        result |= (b & 0x1f) << shift
        shift += 5
      } while (b >= 0x20)
      const dlat = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1))
      lat += dlat

      shift = 0
      result = 0
      do {
        b = encoded.charCodeAt(index++) - 63
        result |= (b & 0x1f) << shift
        shift += 5
      } while (b >= 0x20)
      const dlng = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1))
      lng += dlng

      points.push([lng * 1e-5, lat * 1e-5])
    }

    return points
  }
}
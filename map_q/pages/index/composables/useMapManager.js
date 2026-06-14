import { ref, reactive } from 'vue'

// 首页专用前缀，用于隔离本地存储
const STORAGE_PREFIX = 'INDEX_'

export function useMapManager() {
  // 地图配置 - 使用武汉工程大学坐标（与GIS-Smart-campus-master一致）
  const mapConfig = reactive({
    latitude: 30.518937,
    longitude: 114.402672,
    scale: 16,
    markers: [],
    polyline: [],
    showLocation: true,
    enableOverlooking: false,
    enableZoom: true,
    enableScroll: true,
    enableRotate: false,
    showCompass: false
  })
  
  // 可视卡片索引
  const visibleCardIndices = ref([])
  
  // 更新地图标记
  const updateMapMarkers = (mapPoints) => {
    if (!mapPoints || mapPoints.length === 0) {
      mapConfig.markers = []
      return
    }
    
    // 过滤出有位置信息的点，排除轨迹类型
    const validPoints = mapPoints.filter(point => {
      return point.location && point.location.coordinates && point.type !== 'track'
    })
    
    // 创建标记点数组
    const markers = validPoints.map((point, index) => ({
      id: index,
      latitude: point.location.coordinates[1],
      longitude: point.location.coordinates[0],
      iconPath: '/static/map-marker.png',
      width: 30,
      height: 30,
      customData: {
        pointId: point._id,
        name: point.name || point.title
      }
    }))
    
    mapConfig.markers = markers
    console.log('地图标记已更新:', markers.length)
  }
  
  // 获取用户位置
  const getUserLocation = () => {
    return new Promise((resolve, reject) => {
      uni.getLocation({
        type: 'gcj02',
        success: (res) => {
          console.log('获取位置成功:', res)
          mapConfig.latitude = res.latitude
          mapConfig.longitude = res.longitude
          resolve(res)
        },
        fail: (error) => {
          console.warn('获取位置失败，使用默认位置:', error)
          reject(error)
        }
      })
    })
  }
  
  // 地图区域变化处理
  const onMapRegionChanged = (bounds) => {
    console.log('地图区域变化:', bounds)
    // 可以在这里添加更多区域变化相关的逻辑
  }
  
  // 可视卡片变化处理
  const handleVisibleCardsChange = (indices) => {
    visibleCardIndices.value = indices
  }
  
  // 保存地图状态到本地存储
  const saveMapState = () => {
    try {
      const state = {
        latitude: mapConfig.latitude,
        longitude: mapConfig.longitude,
        scale: mapConfig.scale
      }
      uni.setStorageSync(STORAGE_PREFIX + 'MAP_STATE', JSON.stringify(state))
      console.log('地图状态已保存')
    } catch (error) {
      console.error('保存地图状态失败:', error)
    }
  }
  
  // 从本地存储加载地图状态
  const loadMapState = () => {
    try {
      const stateStr = uni.getStorageSync(STORAGE_PREFIX + 'MAP_STATE')
      if (stateStr) {
        const state = JSON.parse(stateStr)
        mapConfig.latitude = state.latitude || mapConfig.latitude
        mapConfig.longitude = state.longitude || mapConfig.longitude
        mapConfig.scale = state.scale || mapConfig.scale
        console.log('地图状态已加载:', state)
      }
    } catch (error) {
      console.error('加载地图状态失败:', error)
    }
  }
  
  // 清除轨迹
  const clearTrack = () => {
    mapConfig.polyline = []
  }
  
  return {
    mapConfig,
    visibleCardIndices,
    updateMapMarkers,
    getUserLocation,
    onMapRegionChanged,
    handleVisibleCardsChange,
    saveMapState,
    loadMapState,
    clearTrack
  }
}
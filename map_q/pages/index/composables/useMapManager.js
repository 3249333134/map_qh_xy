import { ref, reactive } from 'vue'

// 首页专用前缀，用于隔离本地存储
const STORAGE_PREFIX = 'INDEX_'

export function useMapManager() {
  // 地图配置 - 添加完整配置，使用首页独立状态
  const mapConfig = reactive({
    latitude: 30.572815,
    longitude: 104.066801,
    scale: 18,
    markers: [],
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
    
    const markers = mapPoints.map((point, index) => {
      const isVisible = visibleCardIndices.value.includes(index)
      return {
        id: index,
        latitude: point.location.coordinates[1],
        longitude: point.location.coordinates[0],
        iconPath: '/static/marker.png',
        width: 24,
        height: 24,
        customData: {
          pointId: point._id,
          name: point.name,
          index: index,
          isVisible: isVisible
        },
        callout: {
          content: point.name,
          color: '#000000',
          fontSize: 12,
          borderRadius: 4,
          padding: 5,
          display: 'BYCLICK'
        }
      }
    })
    
    mapConfig.markers = markers
  }
  
  // 获取用户位置
  const getUserLocation = () => {
    return new Promise((resolve, reject) => {
      uni.getLocation({
        type: 'gcj02',
        success: (res) => {
          mapConfig.latitude = res.latitude
          mapConfig.longitude = res.longitude
          resolve(res)
        },
        fail: reject
      })
    })
  }
  
  // 处理地图区域变化
  const onMapRegionChanged = (e) => {
    // 处理地图区域变化逻辑
    console.log('地图区域变化:', e)
  }
  
  // 处理可视卡片变化
  const handleVisibleCardsChange = (indices) => {
    visibleCardIndices.value = indices
  }
  
  // 保存首页地图状态到本地存储
  const saveMapState = () => {
    try {
      const state = {
        latitude: mapConfig.latitude,
        longitude: mapConfig.longitude,
        scale: mapConfig.scale,
        visibleCardIndices: visibleCardIndices.value
      }
      uni.setStorageSync(STORAGE_PREFIX + 'MAP_STATE', state)
    } catch (e) {
      console.warn('保存首页地图状态失败:', e)
    }
  }
  
  // 从本地存储加载首页地图状态
  const loadMapState = () => {
    try {
      const state = uni.getStorageSync(STORAGE_PREFIX + 'MAP_STATE')
      if (state) {
        if (typeof state.latitude === 'number') mapConfig.latitude = state.latitude
        if (typeof state.longitude === 'number') mapConfig.longitude = state.longitude
        if (typeof state.scale === 'number') mapConfig.scale = state.scale
        if (Array.isArray(state.visibleCardIndices)) visibleCardIndices.value = state.visibleCardIndices
      }
    } catch (e) {
      console.warn('加载首页地图状态失败:', e)
    }
  }
  
  return {
    mapConfig,
    visibleCardIndices,
    updateMapMarkers,
    getUserLocation,
    onMapRegionChanged,
    handleVisibleCardsChange,
    saveMapState,
    loadMapState
  }
}
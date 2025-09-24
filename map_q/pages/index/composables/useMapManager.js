import { ref, reactive } from 'vue'

export function useMapManager() {
  // 地图配置 - 添加完整配置
  const mapConfig = reactive({
    latitude: 30.572815,
    longitude: 104.066801,
    scale: 18,  // 添加缺失的scale属性
    markers: [],
    // 添加其他可能需要的配置
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
  
  return {
    mapConfig,
    visibleCardIndices,
    updateMapMarkers,
    getUserLocation,
    onMapRegionChanged,
    handleVisibleCardsChange
  }
}
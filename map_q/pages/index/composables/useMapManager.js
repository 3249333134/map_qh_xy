import { ref, reactive } from 'vue'

// 首页专用前缀，用于隔离本地存储
const STORAGE_PREFIX = 'INDEX_'

// 标记点类型配置 - 低饱和浅红 + 白色描边
const MARKER_CONFIG = {
  normal: { bgColor: '#ffffff', color: '#333' },
  video: { bgColor: '#ffffff', color: '#333' },
  article: { bgColor: '#ffffff', color: '#333' },
  place: { bgColor: '#ffffff', color: '#333' },
  event: { bgColor: '#ffffff', color: '#333' },
  service: { bgColor: '#ffffff', color: '#333' },
  track: { bgColor: '#ffffff', color: '#333' }
}

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
    showCompass: false,
    selectedMarkerId: null
  })

  // 可视卡片索引
  const visibleCardIndices = ref([])

  // 更新地图标记
  const updateMapMarkers = (mapPoints) => {
    if (!mapPoints || mapPoints.length === 0) {
      mapConfig.markers = []
      return
    }

    const visibleSet = new Set((visibleCardIndices.value || []).map(index => Number(index)))
    const shouldLimitToVisible = visibleSet.size > 0

    // 过滤出有位置信息的点，排除轨迹类型
    const validPoints = mapPoints
      .map((point, sourceIndex) => ({ point, sourceIndex }))
      .filter(({ point, sourceIndex }) => {
        return point.location &&
          point.location.coordinates &&
          point.type !== 'track' &&
          (!shouldLimitToVisible || visibleSet.has(sourceIndex))
      })

    // 创建标记点数组
    const markers = validPoints.map(({ point, sourceIndex }) => {
      const type = point.type || 'normal'
      const config = MARKER_CONFIG[type] || MARKER_CONFIG.normal
      const isSelected = mapConfig.selectedMarkerId === sourceIndex

      return {
        id: sourceIndex,
        latitude: point.location.coordinates[1],
        longitude: point.location.coordinates[0],
        zIndex: isSelected ? 100 : sourceIndex,
        customData: {
          pointId: point._id,
          name: point.name || point.title,
          sourceIndex,
          type
        },
        callout: {
          content: point.name || point.title || '',
          fontSize: 11,
          borderRadius: 8,
          bgColor: 'rgba(255, 255, 255, 0.92)',
          color: '#555',
          padding: 6,
          display: 'BYCLICK',
          boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
        },
        label: {
          content: '',
          fontSize: 0
        }
      }
    })

    mapConfig.markers = markers
    console.log('地图标记已更新:', markers.length)
  }

  // 设置选中的标记点
  const selectMarker = (markerId) => {
    mapConfig.selectedMarkerId = markerId
    updateMapMarkers([])
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
    clearTrack,
    selectMarker,
    MARKER_CONFIG
  }
}

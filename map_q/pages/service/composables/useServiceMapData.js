import { ref, reactive } from 'vue'
import { MONGO_CONFIG } from '../../../utils/db.js'
import { CATEGORY_MAP, MARKER_CONFIG } from '../constants/layoutConfig.js'

export function useServiceMapData() {
  // 数据状态
  const mapPoints = ref([])
  const isLoading = ref(false)
  const hasMoreData = ref(true)
  const currentPage = ref(1)
  const pageSize = ref(10)
  
  // 地图相关
  const mapBounds = ref(null)
  const visibleCardIndices = ref([])
  
  // 地图配置
  const mapConfig = reactive({
    latitude: 30.572815,
    longitude: 104.066801,
    markers: [],
    scale: 18
  })
  // 读取启动阶段缓存的定位作为初始坐标
  const cachedLoc = uni.getStorageSync('USER_LOCATION')
  if (cachedLoc && typeof cachedLoc.latitude === 'number' && typeof cachedLoc.longitude === 'number') {
    mapConfig.latitude = cachedLoc.latitude
    mapConfig.longitude = cachedLoc.longitude
  }
  
  // 获取地图数据
  const fetchMapData = async (activeCategory, isLoadMore = false) => {
    isLoading.value = true
    
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      lat: mapConfig.latitude,
      lng: mapConfig.longitude,
      radius: 5000,
      type: 'service'
    }
    if (activeCategory !== 'all') {
      params.category = CATEGORY_MAP[activeCategory] || activeCategory
    }
    try {
      const res = await uni.request({
        url: MONGO_CONFIG.API_URL,
        method: 'GET',
        data: params
      })
      const responseData = res.data && res.data.data ? res.data.data : 
                          (Array.isArray(res.data) ? res.data : [])
      if (res.statusCode === 200 && responseData && responseData.length > 0) {
        const newData = responseData.map(item => ({
          ...item,
          _id: item._id || item.id || `id_${Date.now()}_${Math.random()}`,
          name: item.name || item.title || `服务 ${Math.floor(Math.random() * 1000)}`,
          author: item.author || '未知提供商',
        }))
        if (isLoadMore) {
          mapPoints.value = [...mapPoints.value, ...newData]
        } else {
          mapPoints.value = newData
        }
        const pagination = res.data && res.data.pagination ? res.data.pagination : {}
        hasMoreData.value = currentPage.value < (pagination.totalPages || 1)
        updateMapMarkers()
      } else {
        const pagination = res.data && res.data.pagination ? res.data.pagination : {}
        hasMoreData.value = currentPage.value < (pagination.totalPages || 1)
        if (isLoadMore) {
          console.log('无更多数据，停止加载更多')
          // 加载更多为空时，不追加测试数据
        } else {
          console.log('获取数据为空，使用测试数据')
          addTestData(activeCategory, isLoadMore)
        }
      }
    } catch (err) {
      console.error('请求失败:', err)
      if (isLoadMore) {
        console.log('加载更多请求失败，停止加载更多')
        // 加载更多异常时，不追加测试数据
      } else {
        addTestData(activeCategory, isLoadMore)
      }
    } finally {
      isLoading.value = false
    }
  }
  
  // 根据地图边界获取数据
  // 在 useServiceMapData.js 中的 fetchMapDataByBounds 函数
  const fetchMapDataByBounds = async (activeCategory, isLoadMore = false) => {
    if (!mapBounds.value) {
      return fetchMapData(activeCategory, isLoadMore)
    }
    isLoading.value = true
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      bounds: JSON.stringify({
        northeast: mapBounds.value.northeast,
        southwest: mapBounds.value.southwest
      }),
      type: 'service'
    }
    if (activeCategory !== 'all') {
      params.category = CATEGORY_MAP[activeCategory] || activeCategory
    }
    try {
      const res = await uni.request({
        url: MONGO_CONFIG.API_URL,
        method: 'GET',
        data: params
      })
      const responseData = res.data && res.data.data ? res.data.data : 
                          (Array.isArray(res.data) ? res.data : [])
      if (res.statusCode === 200 && responseData && responseData.length > 0) {
        const newData = responseData.map(item => ({
          ...item,
          _id: item._id || item.id || `id_${Date.now()}_${Math.random()}`,
          name: item.name || item.title || `服务 ${Math.floor(Math.random() * 1000)}`,
          author: item.author || '未知提供商',
        }))
        if (isLoadMore) {
          mapPoints.value = [...mapPoints.value, ...newData]
        } else {
          mapPoints.value = newData
        }
        const pagination = res.data && res.data.pagination ? res.data.pagination : {}
        hasMoreData.value = currentPage.value < (pagination.totalPages || 1)
        updateMapMarkers()
      } else {
        const pagination = res.data && res.data.pagination ? res.data.pagination : {}
        const densityInfo = res.data && res.data.densityInfo ? res.data.densityInfo : {}
        const totalInBounds = densityInfo.totalInBounds || 0
        hasMoreData.value = currentPage.value < (pagination.totalPages || 1)
        if (isLoadMore) {
          console.log('边界内数据已加载完毕，停止加载更多')
          // 加载更多为空时，不追加测试数据
        } else if (totalInBounds === 0) {
          console.log('边界内没有数据，使用测试数据')
          addTestData(activeCategory, isLoadMore)
        } else {
          console.log('当前页无数据，可能页码越界或已无更多数据')
          // 首屏但有数据计数却返回空，通常是页码越界；不追加测试数据
        }
      }
    } catch (err) {
      console.error('请求失败:', err)
      if (isLoadMore) {
        console.log('加载更多失败，停止加载更多')
      } else {
        addTestData(activeCategory, isLoadMore)
      }
    } finally {
      isLoading.value = false
    }
  }
  
  // 添加测试数据
  const addTestData = (activeCategory, isLoadMore = false) => {
    if (!isLoadMore && currentPage.value === 1) {
      mapPoints.value = []
    }
    
    const count = 10
    const startIndex = mapPoints.value.length
    
    let prefix = ''
    let addressPrefix = '成都市'
    
    switch (activeCategory) {
      case 'repair':
        prefix = '维修'
        addressPrefix = '成都市锦江区'
        break
      case 'clean':
        prefix = '清洁'
        addressPrefix = '成都市高新区'
        break
      case 'delivery':
        prefix = '配送'
        addressPrefix = '成都市武侯区'
        break
      default:
        prefix = '全部'
        addressPrefix = '成都市'
    }
    
    let centerLat, centerLng, latRange, lngRange
    
    if (mapBounds.value) {
      centerLat = (mapBounds.value.northeast.latitude + mapBounds.value.southwest.latitude) / 2
      centerLng = (mapBounds.value.northeast.longitude + mapBounds.value.southwest.longitude) / 2
      latRange = mapBounds.value.northeast.latitude - mapBounds.value.southwest.latitude
      lngRange = mapBounds.value.northeast.longitude - mapBounds.value.southwest.longitude
    } else {
      centerLat = mapConfig.latitude
      centerLng = mapConfig.longitude
      latRange = 0.02
      lngRange = 0.02
    }
    
    for (let i = 0; i < count; i++) {
      const index = startIndex + i
      mapPoints.value.push({
        _id: `${activeCategory}_${currentPage.value}_${i}_${Date.now()}`,
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
      })
    }
    
    hasMoreData.value = true
    
    uni.nextTick(() => {
      updateMapMarkers()
    })
  }
  
  // 更新地图标记点
  const updateMapMarkers = () => {
    if (!mapPoints.value || mapPoints.value.length === 0) {
      mapConfig.markers = []
      return
    }
    
    const markers = mapPoints.value.map((point, index) => ({
      id: index,
      latitude: point.location.coordinates[1],
      longitude: point.location.coordinates[0],
      iconPath: MARKER_CONFIG.DEFAULT_ICON,
      width: MARKER_CONFIG.SIZE.WIDTH,
      height: MARKER_CONFIG.SIZE.HEIGHT,
      customData: {
        pointId: point._id,
        name: point.name,
        index: index
      },
      callout: {
        content: point.name,
        color: '#000000',
        fontSize: 12,
        borderRadius: 4,
        padding: 5,
        display: 'BYCLICK'
      }
    }))
    
    mapConfig.markers = markers
  }
  
  // 获取用户位置
  // 方法：getUserLocation
  const getUserLocation = async () => {
    try {
      // 先检查并尝试授权
      const setting = await uni.getSetting()
      const hasAuth = setting?.authSetting?.['scope.userLocation'] === true
      if (!hasAuth) {
        try {
          await uni.authorize({ scope: 'scope.userLocation' })
        } catch (authErr) {
          console.warn('用户未授权地理位置，使用默认坐标', authErr)
          mapConfig.latitude = 30.572269
          mapConfig.longitude = 104.066541
          uni.setStorageSync('USER_LOCATION', { latitude: mapConfig.latitude, longitude: mapConfig.longitude })
          return { latitude: mapConfig.latitude, longitude: mapConfig.longitude }
        }
      }

      // 已授权或授权成功后，获取位置
      const res = await uni.getLocation({
        type: 'wgs84',
        isHighAccuracy: true
      })
      mapConfig.latitude = res.latitude
      mapConfig.longitude = res.longitude
      uni.setStorageSync('USER_LOCATION', { latitude: res.latitude, longitude: res.longitude })
      return res
    } catch (error) {
      console.error('定位失败，使用默认位置:', error)
      mapConfig.latitude = 30.572269
      mapConfig.longitude = 104.066541
      uni.setStorageSync('USER_LOCATION', { latitude: mapConfig.latitude, longitude: mapConfig.longitude })
      return { latitude: mapConfig.latitude, longitude: mapConfig.longitude }
    }
  }
  
  // 加载更多数据
  const loadMoreItems = (activeCategory) => {
    if (isLoading.value || !hasMoreData.value) {
      return
    }
    
    uni.showToast({
      title: '加载更多数据...',
      icon: 'loading',
      duration: 500
    })
    
    currentPage.value++
    
    if (mapBounds.value) {
      fetchMapDataByBounds(activeCategory, true)
    } else {
      fetchMapData(activeCategory, true)
    }
  }
  
  // 处理卡片点击：定位地图并打开详情
  const handleCardTap = (index) => {
    const item = mapPoints.value[index]
    if (!item) {
      uni.showToast({ title: '未找到服务数据', icon: 'none' })
      return
    }
    if (item.location && Array.isArray(item.location.coordinates)) {
      const [lng, lat] = item.location.coordinates
      mapConfig.latitude = lat
      mapConfig.longitude = lng
      mapConfig.scale = 16
    }
    openServiceDetail(item)
  }

  // 新增：统一打开服务详情（支持传索引或完整对象）
  const openServiceDetail = (itemOrIndex) => {
    let item = null
    if (typeof itemOrIndex === 'number') {
      item = mapPoints.value[itemOrIndex]
    } else if (itemOrIndex && typeof itemOrIndex === 'object') {
      item = itemOrIndex
    }
    if (!item) {
      uni.showToast({ title: '未找到服务数据', icon: 'none' })
      return
    }
    if (item.location && Array.isArray(item.location.coordinates)) {
      const [lng, lat] = item.location.coordinates
      mapConfig.latitude = lat
      mapConfig.longitude = lng
      mapConfig.scale = 16
    }
    uni.setStorageSync('LAST_SERVICE_ITEM', item)
    uni.navigateTo({
      url: '/pages/service/detail/index',
      success(res) {
        res.eventChannel && res.eventChannel.emit('service-item', { item })
      }
    })
  }
  
  // 处理可视卡片变化
  const handleVisibleCardsChange = (visibleIndices) => {
    visibleCardIndices.value = visibleIndices
  }
  
  // 地图区域变化事件处理
  const onMapRegionChanged = (bounds) => {
    mapBounds.value = bounds
  }
  
  // 搜索输入处理
  const onSearchInput = (e) => {
    const searchText = e.detail.value
    console.log('搜索:', searchText)
  }
  
  return {
    // 状态
    mapPoints,
    isLoading,
    hasMoreData,
    currentPage,
    pageSize,
    mapBounds,
    visibleCardIndices,
    mapConfig,
    
    // 方法
    fetchMapData,
    fetchMapDataByBounds,
    addTestData,
    updateMapMarkers,
    getUserLocation,
    loadMoreItems,
    handleCardTap,
    openServiceDetail,
    handleVisibleCardsChange,
    onMapRegionChanged,
    onSearchInput
  }
}
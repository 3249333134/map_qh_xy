import { ref, computed } from 'vue'
import { MONGO_CONFIG } from '../utils/db.js'

export function useServiceData() {
  const isLoading = ref(false)
  const mapPoints = ref([])
  const currentPage = ref(1)
  const pageSize = ref(10)
  const hasMoreData = ref(true)
  const categoryData = ref({})
  const categoryPages = ref({})
  const mapBounds = ref(null)
  
  // 地图配置
  const mapConfig = ref({
    latitude: 30.572815,
    longitude: 104.066801,
    markers: [],
    scale: 18
  })
  
  // 标记图标配置
  const markerIcons = {
    'all': '/static/marker.png',
    'repair': '/static/marker.png',
    'clean': '/static/marker.png',
    'delivery': '/static/marker.png'
  }

  // 从MongoDB获取数据
  const fetchMapData = async (isLoadMore = false, activeCategory = 'all') => {
    isLoading.value = true
    
    // 确保categoryData和categoryPages已初始化
    if (!categoryData.value) categoryData.value = {}
    if (!categoryPages.value) categoryPages.value = {}
    
    // 构建API请求参数
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      lat: mapConfig.value.latitude,
      lng: mapConfig.value.longitude,
      radius: 5000,
      type: 'service'
    }
    
    // 如果有分类筛选
    if (activeCategory !== 'all') {
      const categoryMap = {
        'repair': '维修服务',
        'clean': '清洁服务',
        'delivery': '配送服务'
      }
      params.category = categoryMap[activeCategory] || activeCategory
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
        
        categoryData.value[activeCategory] = [...mapPoints.value]
        categoryPages.value[activeCategory] = currentPage.value
        
        updateMapMarkers()
      } else {
        console.log('获取数据为空，使用测试数据')
        addTestData(isLoadMore, activeCategory)
      }
    } catch (err) {
      console.error('请求失败:', err)
      addTestData(isLoadMore, activeCategory)
    } finally {
      isLoading.value = false
    }
  }
  
  // 根据地图边界获取数据
  const fetchMapDataByBounds = async (isLoadMore = false, activeCategory = 'all') => {
    if (!mapBounds.value) {
      console.error('没有地图边界信息，无法获取数据')
      await fetchMapData(isLoadMore, activeCategory)
      return
    }
    
    isLoading.value = true
    
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      ne_lat: mapBounds.value.northeast.latitude,
      ne_lng: mapBounds.value.northeast.longitude,
      sw_lat: mapBounds.value.southwest.latitude,
      sw_lng: mapBounds.value.southwest.longitude,
      type: 'service'
    }
    
    if (activeCategory !== 'all') {
      const categoryMap = {
        'repair': '维修服务',
        'clean': '清洁服务',
        'delivery': '配送服务'
      }
      params.category = categoryMap[activeCategory] || activeCategory
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
        
        categoryData.value[activeCategory] = [...mapPoints.value]
        categoryPages.value[activeCategory] = currentPage.value
        
        updateMapMarkers()
      } else {
        console.log('获取数据为空，使用测试数据')
        addTestData(isLoadMore, activeCategory)
      }
    } catch (err) {
      console.error('请求失败:', err)
      addTestData(isLoadMore, activeCategory)
    } finally {
      isLoading.value = false
    }
  }
  
  // 添加测试数据
  const addTestData = (isLoadMore = false, activeCategory = 'all') => {
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
      centerLat = mapConfig.value.latitude
      centerLng = mapConfig.value.longitude
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
    categoryData.value[activeCategory] = [...mapPoints.value]
    categoryPages.value[activeCategory] = currentPage.value
    
    updateMapMarkers()
  }
  
  // 更新地图标记点
  const updateMapMarkers = () => {
    if (!mapPoints.value || mapPoints.value.length === 0) {
      mapConfig.value.markers = []
      return
    }
    
    const markers = mapPoints.value.map((point, index) => {
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
      }
    })
    
    mapConfig.value.markers = markers
  }
  
  // 获取用户位置
  const getUserLocation = async () => {
    try {
      const res = await uni.getLocation({ 
        type: 'wgs84',
        isHighAccuracy: true
      })
      
      mapConfig.value.latitude = res.latitude
      mapConfig.value.longitude = res.longitude
      
      return res
    } catch (error) {
      console.error('定位失败，使用默认位置:', error)
      mapConfig.value.latitude = 30.572269
      mapConfig.value.longitude = 104.066541
      throw error
    }
  }
  
  // 处理卡片点击
  const handleCardTap = (index) => {
    if (mapPoints.value[index] && mapPoints.value[index].location) {
      const point = mapPoints.value[index]
      const coordinates = point.location.coordinates
      
      mapConfig.value.latitude = coordinates[1]
      mapConfig.value.longitude = coordinates[0]
      
      uni.showToast({
        title: `定位到: ${point.name}`,
        icon: 'none',
        duration: 2000
      })
    }
  }
  
  // 地图区域变化事件处理
  const onMapRegionChanged = (bounds) => {
    mapBounds.value = bounds
  }
  
  // 加载更多内容
  const loadMoreItems = async (activeCategory = 'all') => {
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
      await fetchMapDataByBounds(true, activeCategory)
    } else {
      await fetchMapData(true, activeCategory)
    }
  }
  
  // 切换分类
  const switchCategory = async (categoryId) => {
    if (!categoryData.value) categoryData.value = {}
    if (!categoryPages.value) categoryPages.value = {}
    
    // 如果已有该分类的数据，则恢复
    if (categoryData.value[categoryId] && categoryData.value[categoryId].length > 0) {
      mapPoints.value = [...categoryData.value[categoryId]]
      currentPage.value = categoryPages.value[categoryId] || 1
      updateMapMarkers()
    } else {
      // 否则重新获取数据
      currentPage.value = 1
      await fetchMapData(false, categoryId)
    }
  }
  
  // 加载初始数据
  const loadInitialData = async (activeCategory = 'all') => {
    console.log('加载初始数据')
    currentPage.value = 1
    
    if (mapBounds.value) {
      await fetchMapDataByBounds(false, activeCategory)
    } else {
      await fetchMapData(false, activeCategory)
    }
  }

  return {
    // 状态
    isLoading,
    mapPoints,
    currentPage,
    hasMoreData,
    mapConfig,
    mapBounds,
    categoryData,
    categoryPages,
    
    // 方法
    fetchMapData,
    fetchMapDataByBounds,
    addTestData,
    updateMapMarkers,
    getUserLocation,
    handleCardTap,
    onMapRegionChanged,
    loadMoreItems,
    switchCategory,
    loadInitialData
  }
}
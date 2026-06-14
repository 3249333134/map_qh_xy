import { ref, reactive } from 'vue'
import { MONGO_CONFIG } from '../../../utils/db.js'
import { ROUTE_PLANNER } from '../../../utils/routePlanner.js'

export function useMapData() {
  // 数据状态
  const mapPoints = ref([])
  const isLoading = ref(false)
  const hasMoreData = ref(true)
  const currentPage = ref(1)
  const pageSize = ref(10)
  
  // 缓存相关
  const cachedMapPoints = ref([])
  const hasNewCachedData = ref(false)
  
  // 分类数据缓存
  const categoryData = reactive({})
  const categoryPages = reactive({})
  
  // 地图边界
  const mapBounds = ref(null)
  const searchExpansionFactor = ref(1.0)
  const maxExpansionFactor = ref(2.0)
  
  // 获取地图数据
  // 在fetchMapData函数中添加更好的错误处理
  const fetchMapData = async (activeCategory, mapConfig, isLoadMore = false) => {
    if (isLoading.value && !isLoadMore) {
      console.log('数据正在加载中，跳过重复请求')
      return
    }
    
    isLoading.value = true
    
    try {
      console.log('开始获取地图数据:', { activeCategory, isLoadMore })
      
      const params = {
        page: currentPage.value,
        pageSize: pageSize.value,
        lat: mapConfig.latitude,
        lng: mapConfig.longitude,
        radius: 5000
      }
      
      if (activeCategory !== 'all') {
        const categoryMap = {
          'hot': '热门资源',
          'exhibition': '展会活动',
          'personal': '个人活动'
        }
        params.category = categoryMap[activeCategory] || activeCategory
      }
      
      // 直接使用 uni.request 的 Promise，移除手动 setTimeout
      const res = await uni.request({
        url: MONGO_CONFIG.API_URL,
        method: 'GET',
        data: params
      })
      
      console.log('API响应:', res)
      const responseData = res.data && res.data.data ? res.data.data : 
                          (Array.isArray(res.data) ? res.data : [])
      
      if (res.statusCode === 200 && responseData && responseData.length > 0) {
        const newData = responseData.map(item => ({
          ...item,
          _id: item._id || item.id || `id_${Date.now()}_${Math.random()}`,
          name: item.name || item.title || `地点 ${Math.floor(Math.random() * 1000)}`,
          author: item.author || '未知作者'
        }))
        
        if (isLoadMore) {
          mapPoints.value = [...mapPoints.value, ...newData]
        } else {
          mapPoints.value = newData
        }
        
        const pagination = res.data && res.data.pagination ? res.data.pagination : {}
        hasMoreData.value = currentPage.value < (pagination.totalPages || 1)
        
        categoryData[activeCategory] = [...mapPoints.value]
        categoryPages[activeCategory] = currentPage.value
      } else {
        // 使用测试数据
        generateTestData(activeCategory, mapConfig, isLoadMore)
      }
    } catch (error) {
      console.error('请求失败:', error)
      generateTestData(activeCategory, mapConfig, isLoadMore)
    } finally {
      isLoading.value = false
    }
  }
  
  // 生成测试数据
  const generateTestData = (activeCategory, mapConfig, isLoadMore = false) => {
    // 完全清空所有旧数据，包括缓存
    if (!isLoadMore) {
      mapPoints.value = []
      categoryData[activeCategory] = []
    }
    
    const count = 10
    const startIndex = mapPoints.value.length
    
    const prefixMap = {
      'hot': '热门',
      'exhibition': '展会',
      'personal': '个人',
      'all': '推荐'
    }
    
    const addressMap = {
      'hot': '成都市锦江区',
      'exhibition': '成都市高新区',
      'personal': '成都市武侯区',
      'all': '成都市'
    }
    
    const prefix = prefixMap[activeCategory] || '推荐'
    const addressPrefix = addressMap[activeCategory] || '成都市'
    
    let centerLat, centerLng, latRange, lngRange
    
    // 使用成都坐标
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
      
      // 每5个卡片插入一个轨迹卡片
      if ((index + 1) % 5 === 0) {
        // 获取真实道路路线
        let trackPoints = []
        let highEnergyPoints = []
        let distanceKm = '0.00'
        let duration = '0分钟'
        
        try {
          console.log('正在调用路径规划API...')
          const routeResult = await ROUTE_PLANNER.getFixedRoute()
          
          if (routeResult.success && routeResult.path.length > 0) {
            trackPoints = routeResult.path
            distanceKm = (routeResult.distance / 1000).toFixed(2)
            const durationMinutes = Math.round(routeResult.duration / 60) || 30
            duration = `${durationMinutes}分钟`
            console.log('成功获取道路路线，点数:', trackPoints.length)
          }
        } catch (error) {
          console.error('路径规划失败:', error)
        }
        
        // 如果真实路径规划失败，使用成都的简单备用路线
        if (trackPoints.length === 0) {
          console.log('使用备用路线（成都）')
          const startLng = 104.056801
          const startLat = 30.562815
          const endLng = 104.076801
          const endLat = 30.582815
          
          const totalPoints = 30
          for (let j = 0; j < totalPoints; j++) {
            const progress = j / (totalPoints - 1)
            // 简单直线，不要圆圈
            const lng = startLng + (endLng - startLng) * progress
            const lat = startLat + (endLat - startLat) * progress
            trackPoints.push([lng, lat])
          }
          
          distanceKm = '2.50'
          duration = '20分钟'
        }
        
        // 生成起点、终点和途经点
        highEnergyPoints = []
        
        if (trackPoints.length > 0) {
          // 起点
          highEnergyPoints.push({
            coordinate: trackPoints[0],
            energy: 100,
            label: '起点'
          })
          
          // 途中关键点（3-4个）
          const pointCount = Math.floor(Math.random() * 2) + 3
          for (let k = 1; k <= pointCount; k++) {
            const pointIndex = Math.floor((k / (pointCount + 1)) * trackPoints.length)
            const labels = ['补给站', '观景台', '休息点', '打卡点', '特色点']
            highEnergyPoints.push({
              coordinate: trackPoints[Math.min(pointIndex, trackPoints.length - 1)],
              energy: Math.floor(Math.random() * 60) + 40,
              label: labels[(k - 1) % labels.length]
            })
          }
          
          // 终点
          highEnergyPoints.push({
            coordinate: trackPoints[trackPoints.length - 1],
            energy: 100,
            label: '终点'
          })
        }
        
        mapPoints.value.push({
          _id: `track_${activeCategory}_${currentPage.value}_${i}_${Date.now()}`,
          type: 'track',
          name: `${prefix}路线 ${Math.floor(index / 5) + 1}`,
          author: `用户${Math.floor(Math.random() * 1000)}`,
          distance: distanceKm,
          location: {
            type: 'LineString',
            coordinates: trackPoints
          },
          highEnergyPoints: highEnergyPoints,
          likes: Math.floor(Math.random() * 500),
          duration: duration
        })
      } else {
        mapPoints.value.push({
          _id: `${activeCategory}_${currentPage.value}_${i}_${Date.now()}`,
          name: `${prefix}地点 ${index + 1}`,
          author: `用户${Math.floor(Math.random() * 1000)}`,
          address: `${addressPrefix}测试地址 ${index + 1}`,
          description: `这是一个${prefix}测试描述 ${index + 1}`,
          location: {
            type: 'Point',
            coordinates: [
              centerLng + (Math.random() - 0.5) * lngRange * 0.8,
              centerLat + (Math.random() - 0.5) * latRange * 0.8
            ]
          },
          likes: Math.floor(Math.random() * 500)
        })
      }
    }
    
    hasMoreData.value = true
    // 不保存缓存数据，确保每次都重新生成
    // categoryData[activeCategory] = [...mapPoints.value]
    // categoryPages[activeCategory] = currentPage.value
  }
  
  // 加载更多数据
  const loadMoreItems = (activeCategory, mapConfig) => {
    if (isLoading.value || !hasMoreData.value) return
    
    currentPage.value++
    uni.showToast({
      title: '加载更多数据...',
      icon: 'loading',
      duration: 500
    })
    
    fetchMapData(activeCategory, mapConfig, true)
  }
  
  // 切换分类 - 禁用缓存，确保每次都重新生成数据
  const switchCategory = (newCategory) => {
    // 不使用缓存，强制重新生成数据
    currentPage.value = 1
    return false // 表示需要重新获取数据
  }
  
  return {
    // 状态
    mapPoints,
    isLoading,
    hasMoreData,
    currentPage,
    pageSize,
    cachedMapPoints,
    hasNewCachedData,
    categoryData,
    categoryPages,
    mapBounds,
    searchExpansionFactor,
    maxExpansionFactor,
    
    // 方法
    fetchMapData,
    generateTestData,
    loadMoreItems,
    switchCategory
  }
}
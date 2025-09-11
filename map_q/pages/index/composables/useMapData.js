import { ref, reactive } from 'vue'
import { MONGO_CONFIG } from '../../../utils/db.js'

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
      
      const res = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error('请求超时'))
        }, 10000) // 10秒超时
        
        uni.request({
          url: MONGO_CONFIG.API_URL,
          method: 'GET',
          data: params,
          success: (response) => {
            clearTimeout(timer)
            resolve(response)
          },
          fail: (error) => {
            clearTimeout(timer)
            reject(error)
          }
        })
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
    if (!isLoadMore) {
      mapPoints.value = []
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
        }
      })
    }
    
    hasMoreData.value = true
    categoryData[activeCategory] = [...mapPoints.value]
    categoryPages[activeCategory] = currentPage.value
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
  
  // 切换分类
  const switchCategory = (newCategory) => {
    // 保存当前分类数据
    const currentCategory = Object.keys(categoryData).find(key => categoryData[key] === mapPoints.value)
    if (currentCategory) {
      categoryPages[currentCategory] = currentPage.value
    }
    
    // 恢复新分类数据
    if (categoryData[newCategory] && categoryData[newCategory].length > 0) {
      mapPoints.value = [...categoryData[newCategory]]
      currentPage.value = categoryPages[newCategory] || 1
      return true // 表示有缓存数据
    }
    
    // 重置分页
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
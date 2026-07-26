import { ref, reactive } from 'vue'
import { MONGO_CONFIG } from '../../../utils/db.js'
import { generateMockMapData, isMockEnabled } from '../../../utils/mockMapData.js'

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
      } else if (isMockEnabled()) {
        await generateTestData(activeCategory, mapConfig, isLoadMore)
      } else {
        if (!isLoadMore) {
          mapPoints.value = []
        }
        hasMoreData.value = false
      }
    } catch (error) {
      console.error('请求失败:', error)
      if (isMockEnabled()) {
        await generateTestData(activeCategory, mapConfig, isLoadMore)
      } else {
        if (!isLoadMore) {
          mapPoints.value = []
        }
        hasMoreData.value = false
      }
    } finally {
      isLoading.value = false
    }
  }

  const generateTestData = async (activeCategory, mapConfig, isLoadMore = false) => {
    if (!isLoadMore) {
      mapPoints.value = []
      categoryData[activeCategory] = []
    }

    const newItems = await generateMockMapData(
      activeCategory,
      mapConfig,
      mapBounds.value,
      currentPage.value,
      mapPoints.value.length,
      isLoadMore
    )

    mapPoints.value = [...mapPoints.value, ...newItems]
    hasMoreData.value = true
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

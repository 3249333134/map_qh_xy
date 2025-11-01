<template>
  <view class="container">
    <!-- 地图区域 -->
    <map-background
      :height="mapHeight"
      :config="mapConfig"
      @refresh-location="getUserLocation"
      @region-changed="onMapRegionChanged"
      @move-to-location="handleMoveToLocation"
      ref="mapBackground"
    />
    <!-- 可滑动区域 -->
    <content-area
      :height="contentHeight"
      :search-box-height="searchBoxHeight"
      :min-content-height="minContentHeight"
      :bottom-offset="safeBottomOffset"
      :categories="categories"
      :active-category="activeCategory"
      :map-data="mapPoints"
      :is-loading="isLoading"
      :has-more-data="hasMoreData"
      :visible-card-indices="visibleCardIndices"
      :is-dragging="isDragging"
      @drag-start="handleDragStart"
      @drag="handleDrag"
      @drag-end="handleDragEnd"
      @category-change="handleCategoryChange"
      @search-input="onSearchInput"
      @load-more="loadMoreItems"
      @card-tap="handleCardTap"
      @visible-cards-change="handleVisibleCardsChange"
      card-component="ServiceCardItem"
      @media-tap="handleMediaTap"
      @content-tap="handleContentTap"
      @reserve="handleReserve"
    />
  </view>
</template>

<script>
import { onReady, onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'
import MapBackground from '../../components/map/MapBackground.vue'
import ContentArea from '../../components/content/ContentArea.vue'
import { useServiceLayout } from './composables/useServiceLayout.js'
import { useServiceCategory } from './composables/useServiceCategory.js'
import { useServiceMapData } from './composables/useServiceMapData.js'

export default {
  components: {
    MapBackground,
    ContentArea
  },
  
  setup() {
    // 使用布局管理
    const {
      screenHeight,
      contentHeight,
      searchBoxHeight,
      safeBottomOffset,
      isDragging,
      mapHeight,
      minContentHeight,
      minVisibleHeight,
      maxContentHeight,
      initLayout,
      handleDragStart,
      handleDrag,
      handleDragEnd
    } = useServiceLayout()
    
    // 使用分类管理
    const {
      categories,
      activeCategory,
      categoryData,
      categoryPages,
      handleCategoryChange: baseCategoryChange
    } = useServiceCategory()
    
    // 使用地图数据管理
    const {
      mapPoints,
      isLoading,
      hasMoreData,
      currentPage,
      mapConfig,
      visibleCardIndices,
      fetchMapData,
      fetchMapDataByBounds,
      getUserLocation,
      loadMoreItems: baseLoadMoreItems,
      handleCardTap,
      handleVisibleCardsChange,
      onMapRegionChanged,
      onSearchInput
    } = useServiceMapData()

    // 地图组件引用（用于调用 moveToLocation）
    const mapBackground = ref(null)

    // 新增：接收地图组件发出的定位事件，回写到 mapConfig 驱动地图移动
    const handleMoveToLocation = ({ latitude, longitude, scale }) => {
      if (typeof latitude === 'number' && typeof longitude === 'number') {
        mapConfig.latitude = latitude
        mapConfig.longitude = longitude
        if (typeof scale === 'number') {
          mapConfig.scale = scale
        }
      } else {
        console.warn('handleMoveToLocation 收到无效坐标:', { latitude, longitude, scale })
      }
    }

    // 新增：地图错误处理
    const handleMapError = (msg) => {
      console.error('地图错误：', msg)
      uni.showToast({ title: String(msg || '地图加载失败'), icon: 'none' })
    }

    // 处理上方媒体区域点击：跳转详情页并定位
    const handleMediaTap = async ({ cardData, index }) => {
      // 将媒体区域点击统一委托给 handleCardTap（内部负责定位与跳转服务详情页）
      return handleCardTap(index)
    }

    // 处理下方内容区域点击：只定位到地图
    const handleContentTap = async ({ cardData, index }) => {
      // 只定位到地图，不跳转详情
      const item = typeof index === 'number' ? mapPoints.value[index] : cardData
      if (!item) {
        uni.showToast({ title: '未找到服务数据', icon: 'none' })
        return
      }
      // 支持两种坐标结构：item.location.coordinates 或 item.coordinates
      let coords = null
      if (item.location && Array.isArray(item.location.coordinates)) {
        coords = item.location.coordinates
      } else if (Array.isArray(item.coordinates)) {
        coords = item.coordinates
      }
      if (coords) {
        const [lng, lat] = coords
        mapConfig.latitude = lat
        mapConfig.longitude = lng
        mapConfig.scale = 16
      } else {
        uni.showToast({ title: '未找到位置信息', icon: 'none' })
      }
    }

    // 处理“预”按钮：最小实现，不改变其他逻辑
    const handleReserve = ({ cardData, index }) => {
      console.log('点击预约:', { cardData, index })
      uni.showToast({ title: '预约', icon: 'none' })
      // 如需跳转预约详情页，请在此处替换为实际路径：
      // uni.navigateTo({ url: `/pages/reserve/index?id=${cardData._id}` })
    }

    // 加载初始数据
    const loadInitialData = () => {
      console.log('加载初始数据')
      currentPage.value = 1
      
      if (mapConfig.mapBounds) {
        fetchMapDataByBounds(activeCategory.value)
      } else {
        fetchMapData(activeCategory.value)
      }
    }
    
    // 处理分类切换
    const handleCategoryChange = (categoryId) => {
      const { cachedData, cachedPage } = baseCategoryChange(categoryId, mapPoints, currentPage)
      
      if (cachedData && cachedData.length > 0) {
        mapPoints.value = [...cachedData]
        currentPage.value = cachedPage
      } else {
        currentPage.value = 1
        fetchMapData(activeCategory.value)
      }
    }
    
    // 加载更多数据
    const loadMoreItems = () => {
      baseLoadMoreItems(activeCategory.value)
    }
    
    // 页面就绪时初始化
    onReady(() => {
      getUserLocation().then(() => {
        initLayout()
        // 与首页一致：统一搜索框高度为 60
        searchBoxHeight.value = 60
        loadInitialData()
      }).catch(() => {
        initLayout()
        searchBoxHeight.value = 60
        loadInitialData()
      })
    })
    
    // 页面展示时同步底部 TabBar 高亮为“服务”
    onShow(() => {
      try {
        const pages = getCurrentPages()
        const page = pages[pages.length - 1]
        if (page && typeof page.getTabBar === 'function' && page.getTabBar()) {
          page.getTabBar().setData({ selected: 1 })
        }
      } catch (e) {}
    })
    
    return {
      // 组件引用
      mapBackground,
      // 布局相关/分类/数据相关
      screenHeight,
      contentHeight,
      searchBoxHeight,
      safeBottomOffset,
      isDragging,
      mapHeight,
      minContentHeight,
      minVisibleHeight,
      maxContentHeight,
      // 分类相关
      categories,
      activeCategory,
      // 数据相关
      mapPoints,
      isLoading,
      hasMoreData,
      mapConfig,
      visibleCardIndices,
      // 方法
      // 事件处理函数，全部导出
      handleDragStart,
      handleDrag,
      handleDragEnd,
      handleMoveToLocation,
      onMapRegionChanged,
      handleMediaTap,
      handleContentTap,
      handleReserve,
      handleCategoryChange,
      onSearchInput,
      loadMoreItems,
      handleCardTap,
      handleVisibleCardsChange,
      getUserLocation,
      
    }
  }
}
</script>

<style scoped>
.container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
</style>

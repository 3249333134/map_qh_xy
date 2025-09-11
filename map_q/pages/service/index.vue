<template>
  <view class="container">
    <!-- 地图区域 -->    
    <map-background 
      :height="mapHeight"
      :config="mapConfig"
      @refresh-location="getUserLocation"
      @region-changed="onMapRegionChanged"
    />
    
    <!-- 可滑动区域 -->
    <content-area 
      :height="contentHeight"
      :search-box-height="searchBoxHeight"
      :min-content-height="minVisibleHeight"
      :categories="categories"
      :active-category="activeCategory"
      :map-data="mapPoints"
      :is-loading="isLoading"
      :has-more-data="hasMoreData"
      @drag-start="handleDragStart"
      @drag="handleDrag"
      @drag-end="handleDragEnd"
      @category-change="handleCategoryChange"
      @search-input="onSearchInput"
      @load-more="loadMoreItems"
      @card-tap="handleCardTap"
      @visible-cards-change="handleVisibleCardsChange"
    />
  </view>
</template>

<script>
import { onReady } from '@dcloudio/uni-app'
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
        loadInitialData()
      }).catch(() => {
        initLayout()
        loadInitialData()
      })
    })
    
    return {
      // 布局相关
      screenHeight,
      contentHeight,
      searchBoxHeight,
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
      handleDragStart,
      handleDrag,
      handleDragEnd,
      handleCategoryChange,
      onSearchInput,
      loadMoreItems,
      handleCardTap,
      handleVisibleCardsChange,
      getUserLocation,
      onMapRegionChanged
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
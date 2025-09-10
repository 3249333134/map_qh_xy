<template>
  <view class="container">
    <!-- 地图背景 -->
    <map-background 
      :map-config="mapConfig"
      :map-height="mapHeight"
      @regionchange="onMapRegionChanged"
    />
    
    <!-- 内容区域 -->
    <content-area
      :content-height="contentHeight"
      :is-dragging="isDragging"
      :map-points="mapPoints"
      :categories="categories"
      :active-category="activeCategory"
      :is-loading="isLoading"
      :has-more-data="hasMoreData"
      :visible-card-indices="visibleCardIndices"
      @dragstart="handleDragStart"
      @drag="handleDrag"
      @dragend="handleDragEnd"
      @category-change="handleCategoryChange"
      @search-input="onSearchInput"
      @load-more="loadMoreItems"
      @card-tap="handleCardTap"
      @visible-cards-change="handleVisibleCardsChange"
    />
  </view>
</template>

<script>
import MapBackground from '../../components/map/MapBackground.vue'
import ContentArea from '../../components/content/ContentArea.vue'
import { useMapData } from '../../composables/useMapData.js'
import { useLayout } from '../../composables/useLayout.js'
import { useCategory } from '../../composables/useCategory.js'
import { useMapManager } from '../../composables/useMapManager.js'

export default {
  name: 'IndexPage',
  components: {
    MapBackground,
    ContentArea
  },
  
  setup() {
    // 使用 composables
    const {
      mapPoints,
      isLoading,
      hasMoreData,
      fetchMapData,
      loadMoreItems: loadMore,
      switchCategory
    } = useMapData()
    
    const {
      contentHeight,
      mapHeight,
      isDragging,
      initLayout,
      handleDragStart,
      handleDrag,
      handleDragEnd
    } = useLayout()
    
    const {
      categories,
      activeCategory,
      handleCategoryChange: changeCategoryHandler
    } = useCategory()
    
    const {
      mapConfig,
      visibleCardIndices,
      updateMapMarkers,
      getUserLocation,
      onMapRegionChanged,
      handleVisibleCardsChange
    } = useMapManager()
    
    // 组合方法
    const handleCategoryChange = async (categoryId) => {
      changeCategoryHandler(categoryId)
      const hasCache = switchCategory(categoryId)
      
      if (!hasCache) {
        await fetchMapData(categoryId, mapConfig)
      }
      
      updateMapMarkers(mapPoints.value)
    }
    
    const loadMoreItems = () => {
      loadMore(activeCategory.value, mapConfig)
    }
    
    const onSearchInput = (searchText) => {
      // 搜索逻辑保持简单
      console.log('搜索:', searchText)
    }
    
    const handleCardTap = (cardData) => {
      // 卡片点击逻辑
      console.log('卡片点击:', cardData)
    }
    
    // 初始化
    const init = async () => {
      initLayout()
      
      try {
        await getUserLocation()
      } catch (error) {
        console.log('获取位置失败，使用默认位置')
      }
      
      await fetchMapData(activeCategory.value, mapConfig)
      updateMapMarkers(mapPoints.value)
    }
    
    // 生命周期
    uni.$on('onLoad', init)
    
    return {
      // 状态
      mapPoints,
      isLoading,
      hasMoreData,
      contentHeight,
      mapHeight,
      isDragging,
      categories,
      activeCategory,
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
      onMapRegionChanged,
      handleVisibleCardsChange
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
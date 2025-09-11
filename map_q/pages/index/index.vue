<template>
  <view class="container">
    <!-- 错误提示 -->
    <view v-if="showError" class="error-toast">
      {{ errorMessage }}
    </view>
    
    <!-- 地图背景 -->
    <map-background 
      :config="mapConfig"
      :height="mapHeight"
      @regionchange="onMapRegionChanged"
      @map-error="handleMapError"
    />
    
    <!-- 内容区域 -->
    <content-area
      :height="contentHeight"
      :search-box-height="60"
      :min-content-height="200"
      :is-dragging="isDragging"
      :map-data="mapPoints"
      :categories="categories"
      :active-category="activeCategory"
      :is-loading="isLoading"
      :has-more-data="hasMoreData"
      :visible-card-indices="visibleCardIndices"
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
import { onMounted, ref } from 'vue'
import MapBackground from '../../components/map/MapBackground.vue'
import ContentArea from '../../components/content/ContentArea.vue'
import { useMapData } from './composables/useMapData.js'
import { useLayout } from './composables/useLayout.js'
import { useCategory } from './composables/useCategory.js'
import { useMapManager } from './composables/useMapManager.js'

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
    // 在setup函数中添加错误状态
    const errorMessage = ref('')
    const showError = ref(false)
    
    // 错误处理函数
    const handleError = (error, context = '') => {
      console.error(`${context}错误:`, error)
      errorMessage.value = `${context}失败，请稍后重试`
      showError.value = true
      
      // 3秒后自动隐藏错误提示
      setTimeout(() => {
        showError.value = false
      }, 3000)
    }
    
    // 优化分类切换
    const handleCategoryChange = async (categoryId) => {
      try {
        changeCategoryHandler(categoryId)
        const hasCache = switchCategory(categoryId)
        
        if (!hasCache) {
          await fetchMapData(categoryId, mapConfig)
        }
        
        updateMapMarkers(mapPoints.value)
      } catch (error) {
        handleError(error, '切换分类')
      }
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
    
    // 初始化函数优化
    const init = async () => {
      try {
        console.log('开始初始化首页...')
        
        // 1. 初始化布局
        initLayout()
        
        // 2. 获取用户位置（可选）
        try {
          await getUserLocation()
          console.log('位置获取成功')
        } catch (error) {
          console.log('获取位置失败，使用默认位置:', error)
        }
        
        // 3. 获取地图数据
        await fetchMapData(activeCategory.value, mapConfig)
        
        // 4. 更新地图标记
        updateMapMarkers(mapPoints.value)
        
        console.log('首页初始化完成')
      } catch (error) {
        console.error('首页初始化失败:', error)
        // 可以在这里添加用户提示
      }
    }
    
    // 修复生命周期 - 使用正确的onMounted
    onMounted(() => {
      init()
    })
    
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
      errorMessage,
      showError,
      
      // 方法
      handleDragStart,
      handleDrag,
      handleDragEnd,
      handleCategoryChange,
      onSearchInput,
      loadMoreItems,
      handleCardTap,
      onMapRegionChanged,
      handleVisibleCardsChange,
      handleMapError
    }
  }
}

// 添加地图错误处理
const handleMapError = (errorMsg) => {
  handleError(new Error(errorMsg), '地图加载')
}
</script>

<style scoped>
.container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.error-toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #ff4757;
  color: white;
  padding: 12px 20px;
  border-radius: 6px;
  font-size: 14px;
  z-index: 9999;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
</style>
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
      @move-to-location="handleMoveToLocation"
      ref="mapBackground"
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
      @media-tap="handleMediaTap"
      @content-tap="handleContentTap"
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
    // 获取地图背景组件的引用
    const mapBackground = ref(null)
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

    // 处理地图定位事件
    const handleMoveToLocation = (locationData) => {
      const { latitude, longitude, scale } = locationData
      mapConfig.latitude = latitude
      mapConfig.longitude = longitude
      mapConfig.scale = scale
      console.log('地图配置已更新:', locationData)
    }

    // 处理上方媒体区域点击：跳转详情页并定位
    const handleMediaTap = async (data) => {
      console.log('媒体区域点击，准备跳转详情页并定位:', data)
      
      const { cardData } = data
      
      // 调用地图组件的定位方法
      if (cardData && cardData.location && cardData.location.coordinates && mapBackground.value) {
        const [longitude, latitude] = cardData.location.coordinates
        try {
          await mapBackground.value.moveToLocation(latitude, longitude, 16)
          console.log('地图定位成功')
        } catch (error) {
          console.error('地图定位失败:', error)
        }
      }
      
      // TODO: 这里可以添加跳转到详情页的逻辑
      // uni.navigateTo({
      //   url: `/pages/detail/detail?id=${cardData._id}`
      // })
    }
    
    // 处理下方内容区域点击：只定位到地图
    const handleContentTap = async (data) => {
      console.log('内容区域点击，准备定位到地图:', data)
      
      const { cardData } = data
      
      // 调用地图组件的定位方法
      if (cardData && cardData.location && cardData.location.coordinates && mapBackground.value) {
        const [longitude, latitude] = cardData.location.coordinates
        try {
          await mapBackground.value.moveToLocation(latitude, longitude, 16)
          console.log('地图定位成功')
        } catch (error) {
          console.error('地图定位失败:', error)
        }
      } else {
        console.warn('卡片数据中缺少位置信息或地图组件未加载')
      }
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
      // 组件引用
      mapBackground,
      
      // 布局相关
      contentHeight,
      mapHeight,
      isDragging,
      handleDragStart,
      handleDrag,
      handleDragEnd,
      initLayout,
      
      // 地图相关
      mapConfig,
      visibleCardIndices,
      updateMapMarkers,
      getUserLocation,
      onMapRegionChanged,
      handleVisibleCardsChange,
      handleMoveToLocation,
      
      // 数据相关
      mapPoints,
      isLoading,
      hasMoreData,
      fetchMapData,
      loadMore,
      
      // 分类相关
      categories,
      activeCategory,
      handleCategoryChange,
      
      // 事件处理
      loadMoreItems,
      onSearchInput,
      handleCardTap,
      handleMediaTap,
      handleContentTap,
      
      // 错误处理
      showError,
      errorMessage,
      handleError,
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
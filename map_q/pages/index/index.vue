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
      @region-changed="onMapRegionChanged"
      @map-error="handleMapError"
      @move-to-location="handleMoveToLocation"
      @refresh-location="getUserLocation"
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
      @visible-cards-change="onVisibleCardsChange"
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
    // 地图组件引用
    const mapBackground = ref(null)
    // 数据 composables
    const {
      mapPoints,
      isLoading,
      hasMoreData,
      fetchMapData,
      loadMoreItems: loadMore,
      switchCategory,
      mapBounds
    } = useMapData()
    
    // 布局 composables
    const {
      contentHeight,
      mapHeight,
      isDragging,
      initLayout,
      handleDragStart,
      handleDrag,
      handleDragEnd
    } = useLayout()
    
    // 分类 composables
    const {
      categories,
      activeCategory,
      handleCategoryChange: changeCategoryHandler
    } = useCategory()
    
    // 地图管理 composables（对方法重命名，便于自定义包装）
    const {
      mapConfig,
      visibleCardIndices,
      updateMapMarkers,
      getUserLocation,
      onMapRegionChanged: mapMgrRegionChanged,
      handleVisibleCardsChange: mapMgrVisibleCardsChange
    } = useMapManager()
    
    // 错误状态
    const errorMessage = ref('')
    const showError = ref(false)
    
    const handleError = (error, context = '') => {
      console.error(`${context}错误:`, error)
      errorMessage.value = `${context}失败，请稍后重试`
      showError.value = true
      setTimeout(() => { showError.value = false }, 3000)
    }
    
    // 地图错误处理（确保在 setup 中定义并返回）
    const handleMapError = (msg) => {
      handleError(new Error(msg), '地图加载')
    }
    
    // 分类切换
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
    
    // 加载更多
    const loadMoreItems = () => {
      loadMore(activeCategory.value, mapConfig)
    }
    
    // 搜索输入
    const onSearchInput = (searchText) => {
      console.log('搜索:', searchText)
    }
    
    // 卡片点击
    const handleCardTap = (cardData) => {
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
 
    // 上方媒体区域点击：跳转详情页并定位
    const handleMediaTap = async (data) => {
      console.log('媒体区域点击，准备跳转详情页并定位:', data)
      const { cardData } = data
      if (cardData && cardData.location && cardData.location.coordinates && mapBackground.value) {
        const [longitude, latitude] = cardData.location.coordinates
        try {
          await mapBackground.value.moveToLocation(latitude, longitude, 16)
          console.log('地图定位成功')
        } catch (error) {
          console.error('地图定位失败:', error)
        }
      }
      if (cardData && cardData._id) {
        try {
          await uni.navigateTo({
            url: `/pages/detail/index?id=${cardData._id}&title=${encodeURIComponent(cardData.name || cardData.title || '')}&author=${encodeURIComponent(cardData.author || '')}&likes=${cardData.likes || 0}`
          })
        } catch (error) {
          console.error('跳转详情页失败:', error)
          handleError(error, '跳转详情页')
        }
      } else {
        console.warn('卡片数据不完整，无法跳转详情页')
      }
    }
    
    // 下方内容区域点击：只定位到地图
    const handleContentTap = async (data) => {
      console.log('内容区域点击，准备定位到地图:', data)
      const { cardData } = data
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
    
    // 包装：地图区域变化（同步到 useMapData 的 mapBounds）
    const onMapRegionChanged = (bounds) => {
      try {
        mapBounds.value = bounds
        // 保留原管理器的处理（日志等）
        mapMgrRegionChanged(bounds)
      } catch (error) {
        handleError(error, '处理地图区域变化')
      }
    }
    
    // 包装：可视卡片索引变化 -> 更新地图标记
    const onVisibleCardsChange = (indices) => {
      mapMgrVisibleCardsChange(indices)
      updateMapMarkers(mapPoints.value)
    }
    
    // 初始化
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
      }
    }
    
    onMounted(() => { init() })
    
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
      onVisibleCardsChange,
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
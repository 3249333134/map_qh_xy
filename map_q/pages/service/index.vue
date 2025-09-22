<template>
  <view class="container">
    <!-- 地图区域 -->    
    <map-background 
      :height="mapHeight"
      :config="mapConfig"
      @refresh-location="getUserLocation"
      @region-changed="onMapRegionChanged"
      ref="mapBackground"
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
      card-component="ServiceCardItem"
      @media-tap="handleMediaTap"
      @content-tap="handleContentTap"
      @reserve="handleReserve"
    />
  </view>
</template>

<script>
import { onReady } from '@dcloudio/uni-app'
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

    // 处理上方媒体区域点击：跳转详情页并定位
    const handleMediaTap = async ({ cardData, index }) => {
      console.log('媒体区域点击，准备跳转详情页并定位:', { cardData, index })
      if (cardData?.location?.coordinates) {
        const [longitude, latitude] = cardData.location.coordinates
        try {
          if (mapBackground.value?.moveToLocation) {
            await mapBackground.value.moveToLocation(latitude, longitude, 16)
          } else {
            // 兜底：直接更新地图配置
            mapConfig.latitude = latitude
            mapConfig.longitude = longitude
            mapConfig.scale = 16
          }
          console.log('地图定位成功')
        } catch (err) {
          console.error('地图定位失败:', err)
        }
      }

      // 跳转详情页（与首页保持一致）
      if (cardData && cardData._id) {
        try {
          await uni.navigateTo({
            url: `/pages/detail/index?id=${cardData._id}&title=${encodeURIComponent(cardData.name || cardData.title || '')}&author=${encodeURIComponent(cardData.author || '')}&likes=${cardData.likes || 0}`
          })
        } catch (error) {
          console.error('跳转详情页失败:', error)
        }
      } else {
        console.warn('卡片数据不完整，无法跳转详情页')
      }
    }

    // 处理下方内容区域点击：只定位到地图
    const handleContentTap = async ({ cardData, index }) => {
      console.log('内容区域点击，准备定位到地图:', { cardData, index })
      if (cardData?.location?.coordinates) {
        const [longitude, latitude] = cardData.location.coordinates
        try {
          if (mapBackground.value?.moveToLocation) {
            await mapBackground.value.moveToLocation(latitude, longitude, 16)
          } else {
            mapConfig.latitude = latitude
            mapConfig.longitude = longitude
            mapConfig.scale = 16
          }
          console.log('地图定位成功')
        } catch (error) {
          console.error('地图定位失败:', error)
        }
      } else {
        console.warn('卡片数据中缺少位置信息或地图组件未加载')
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
        loadInitialData()
      }).catch(() => {
        initLayout()
        loadInitialData()
      })
    })
    
    return {
      // 组件引用
      mapBackground,
      // 布局相关/分类/数据相关
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
      onMapRegionChanged,
      // 新增：事件处理（与首页保持一致）
      handleMediaTap,
      handleContentTap,
      handleReserve
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
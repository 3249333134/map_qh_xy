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
      @markertap="onMarkerTap"
      @poi-tap="onPoiTap"
      @poitap="onPoiTap"
      ref="mapBackground"
    />
    
    <!-- 内容区域 -->
    <content-area
      :height="contentHeight"
      :search-box-height="searchBoxHeight"
      :min-content-height="minContentHeight"
      :bottom-offset="safeBottomOffset"
      :is-dragging="isDragging"
      :map-data="mapPoints"
      :categories="categories"
      :active-category="activeCategory"
      :is-loading="isLoading"
      :has-more-data="hasMoreData"
      :visible-card-indices="visibleCardIndices"
      :selected-point="selectedPoint"
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
      @close-point-detail="closePointDetail"
      @navigate-to-point="navigateToPoint"
      @right-action-tap="openCenterPointDetail"
      @lock-content-max="lockContentMax"
      @restore-content-height="restoreContentHeight"
    />
    <!-- 全局发布弹窗挂载点 -->
    <GlobalOverlayHost />
  </view>
 </template>
 
<script>
import { onMounted, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import MapBackground from '../../components/map/MapBackground.vue'
import ContentArea from '../../components/content/ContentArea.vue'
import GlobalOverlayHost from '../../components/common/GlobalOverlayHost.vue'
import { useMapData } from './composables/useMapData.js'
import { useLayout } from './composables/useLayout.js'
import { LAYOUT_CONFIG } from './constants/layoutConfig.js'
import { useCategory } from './composables/useCategory.js'
import { useMapManager } from './composables/useMapManager.js'
 
export default {
  name: 'IndexPage',
  components: {
    MapBackground,
    ContentArea,
    GlobalOverlayHost
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
      searchBoxHeight,
      minContentHeight,
      safeBottomOffset,
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
    
    const selectedPoint = ref(null)

    const onMarkerTap = (payload) => {
      try {
        const id = payload && (payload.markerId ?? (payload.detail && payload.detail.markerId))
        let marker = payload && payload.marker
        if (!marker && Array.isArray(mapConfig.markers)) {
          marker = mapConfig.markers.find(m => String(m.id) === String(id)) || null
        }
        let point = null
        if (marker && marker.customData && marker.customData.pointId) {
          point = mapPoints.value.find(p => p._id === marker.customData.pointId) || null
        }
        if (!point && marker) {
          point = { _id: `marker_${id}`, name: (marker.customData && marker.customData.name) || '位置', address: '', description: '', location: { type: 'Point', coordinates: [marker.longitude, marker.latitude] } }
        }
        selectedPoint.value = { point, marker }
        resolveAddressByCoords(lat, lng).then(addr => { if (addr && selectedPoint.value && selectedPoint.value.point) selectedPoint.value.point.address = addr })
        resolveAddressByCoords(marker.latitude, marker.longitude).then(addr => { if (addr && selectedPoint.value && selectedPoint.value.point) selectedPoint.value.point.address = addr })
      } catch (err) {}
    }

    const onPoiTap = (payload) => {
      try {
        const m = payload && payload.marker
        if (!m) return
        const point = { _id: `poi_${Date.now()}`, name: (m.customData && m.customData.name) || '位置', address: '', description: '', location: { type: 'Point', coordinates: [m.longitude, m.latitude] } }
        selectedPoint.value = { point, marker: m }
        resolveAddressByCoords(m.latitude, m.longitude).then(addr => { if (addr && selectedPoint.value && selectedPoint.value.point) selectedPoint.value.point.address = addr })
      } catch (e) {}
    }

    const closePointDetail = () => { selectedPoint.value = null }

    const getQqMapKey = () => {
      try {
        const app = typeof getApp === 'function' ? getApp() : null
        const envKey = (app && app.globalData && app.globalData.QQ_MAP_KEY) || uni.getStorageSync('QQ_MAP_KEY') || (typeof process !== 'undefined' && process.env && process.env.QQ_MAP_KEY) || ''
        const fallbackKey = 'ISSBZ-BQA6T-J2SXF-VSDGE-A7NZ5-U4B3K'
        return envKey || fallbackKey
      } catch (e) { return 'ISSBZ-BQA6T-J2SXF-VSDGE-A7NZ5-U4B3K' }
    }
    const resolveAddressByCoords = (lat, lng) => {
      const key = getQqMapKey()
      if (key) {
        return new Promise((resolve) => {
          uni.request({
            url: `https://apis.map.qq.com/ws/geocoder/v1/?location=${lat},${lng}&key=${key}&get_poi=0`,
            method: 'GET',
            success: (res) => {
              const c = res && res.data && res.data.result && res.data.result.address_component
              const addr = res && res.data && res.data.result && res.data.result.address
              const txt = [c && c.province, c && c.city, c && c.district, c && c.street, c && c.street_number].filter(Boolean).join('')
              resolve(txt || addr || '')
            },
            fail: () => {
              uni.request({
                url: `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
                method: 'GET',
                header: { 'Accept-Language': 'zh-CN' },
                success: (res) => {
                  const a = res && res.data && res.data.address
                  const txt = [a && (a.province || a.state), a && (a.city || a.town || a.village), a && (a.county || a.state_district), a && a.road, a && (a.residential || a.suburb || a.neighbourhood), a && a.house_number].filter(Boolean).join('')
                  resolve(txt || (res && res.data && res.data.display_name) || '')
                },
                fail: () => resolve('')
              })
            }
          })
        })
      }
      return new Promise((resolve) => {
        uni.request({
          url: `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          method: 'GET',
          header: { 'Accept-Language': 'zh-CN' },
          success: (res) => {
            const a = res && res.data && res.data.address
            const txt = [a && (a.province || a.state), a && (a.city || a.town || a.village), a && (a.county || a.state_district), a && a.road, a && (a.residential || a.suburb || a.neighbourhood), a && a.house_number].filter(Boolean).join('')
            resolve(txt || (res && res.data && res.data.display_name) || '')
          },
          fail: () => resolve('')
        })
      })
    }

    const navigateToPoint = () => {
      try {
        const m = selectedPoint.value && selectedPoint.value.marker
        if (!m) return
        uni.openLocation({ latitude: m.latitude, longitude: m.longitude, name: (selectedPoint.value.point && selectedPoint.value.point.name) || '位置' })
      } catch (e) {}
    }

    const openCenterPointDetail = () => {
      try {
        const lat = mapConfig.latitude
        const lng = mapConfig.longitude
        if (typeof lat !== 'number' || typeof lng !== 'number') return
        const marker = { latitude: lat, longitude: lng, customData: { name: '当前位置' } }
        const point = { _id: `center_${Date.now()}`, name: '当前位置', address: '', description: '', location: { type: 'Point', coordinates: [lng, lat] } }
        selectedPoint.value = { point, marker }
      } catch (e) {}
    }

    const lastContentHeightBeforeExpand = ref(0)
    const lockContentMax = () => {
      try {
        lastContentHeightBeforeExpand.value = contentHeight.value
        const sys = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
        const screenH = sys.windowHeight
        const maxH = screenH * (LAYOUT_CONFIG && LAYOUT_CONFIG.MAX_CONTENT_RATIO ? LAYOUT_CONFIG.MAX_CONTENT_RATIO : 0.67)
        contentHeight.value = Math.max(minContentHeight.value, Math.min(maxH, screenH))
      } catch (e) {}
    }
    const restoreContentHeight = () => {
      if (lastContentHeightBeforeExpand.value) {
        contentHeight.value = lastContentHeightBeforeExpand.value
      }
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
    
    onMounted(() => { 
      // 统一搜索框高度为 60，确保折叠态仅保留搜索框
      searchBoxHeight.value = 60
      init()
    })
    
    // 页面展示时同步底部 TabBar 高亮为“首页”
    onShow(() => {
      try {
        const pages = getCurrentPages()
        const page = pages[pages.length - 1]
        if (page && typeof page.getTabBar === 'function' && page.getTabBar()) {
          page.getTabBar().setData({ selected: 0 })
        }
      } catch (e) {}
    })
    
    return {
      // 组件引用
      mapBackground,
      
      // 布局相关
      contentHeight,
      mapHeight,
      searchBoxHeight,
      minContentHeight,
      safeBottomOffset,
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
      lockContentMax,
      restoreContentHeight,
      // 选中点详情
      selectedPoint,
      onMarkerTap,
      onPoiTap,
      closePointDetail,
      navigateToPoint,
      openCenterPointDetail,
      
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
  overscroll-behavior-y: none;
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
    const lastContentHeightBeforeExpand = ref(0)
    const { maxContentHeight } = useLayout()

    const lockContentMax = () => {
      try {
        lastContentHeightBeforeExpand.value = contentHeight.value
        // 锁定到最大内容高度比例
        const systemInfo = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
        const screenH = systemInfo.windowHeight
        const maxH = screenH * (LAYOUT_CONFIG && LAYOUT_CONFIG.MAX_CONTENT_RATIO ? LAYOUT_CONFIG.MAX_CONTENT_RATIO : 0.67)
        contentHeight.value = Math.max(minContentHeight.value, Math.min(maxH, screenH))
      } catch (e) {}
    }

    const restoreContentHeight = () => {
      if (lastContentHeightBeforeExpand.value) {
        contentHeight.value = lastContentHeightBeforeExpand.value
      }
    }
      lockContentMax,
      restoreContentHeight,
      lastContentHeightBeforeExpand,

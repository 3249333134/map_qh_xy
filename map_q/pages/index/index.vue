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
      @show-track="onShowTrack"
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
      storage-key-prefix="indexContentArea"
      @drag-start="handleDragStart"
      @drag="handleDrag"
      @drag-end="handleDragEnd"
      @category-change="handleCategoryChange"
      @search-input="onSearchInput"
      @load-more="loadMoreItems"
      @card-tap="handleCardTap"
      @media-tap="handleMediaTap"
      @content-tap="handleContentTap"
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
import { onShow, onHide } from '@dcloudio/uni-app'
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
    const mapBackground = ref(null)
    
    const {
      mapPoints,
      isLoading,
      hasMoreData,
      fetchMapData,
      loadMoreItems: loadMore,
      switchCategory,
      mapBounds
    } = useMapData()
    
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
      onMapRegionChanged: mapMgrRegionChanged,
      handleVisibleCardsChange: mapMgrVisibleCardsChange,
      saveMapState,
      loadMapState
    } = useMapManager()
    
    const errorMessage = ref('')
    const showError = ref(false)
    
    const handleError = (error, context = '') => {
      console.error(`${context}错误:`, error)
      errorMessage.value = `${context}失败，请稍后重试`
      showError.value = true
      setTimeout(() => { showError.value = false }, 3000)
    }
    
    const handleMapError = (msg) => {
      handleError(new Error(msg), '地图加载')
    }
    
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
      console.log('搜索:', searchText)
    }
    
    const handleCardTap = (cardData) => {
      console.log('卡片点击:', cardData)
    }

    const handleMoveToLocation = (locationData) => {
      const { latitude, longitude, scale } = locationData
      mapConfig.latitude = latitude
      mapConfig.longitude = longitude
      mapConfig.scale = scale
      console.log('地图配置已更新:', locationData)
    }

    const handleMediaTap = async (data) => {
      console.log('媒体区域点击:', data)
      const { cardData } = data
      
      if (cardData && cardData.type === 'track') {
        console.log('点击轨迹卡片，准备在地图上显示轨迹')
        if (cardData.location && cardData.location.coordinates && mapBackground.value) {
          mapBackground.value.showTrack(cardData.location.coordinates, cardData.highEnergyPoints || [])
        }
        return
      }
      
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
          uni.setStorageSync('INDEX_LAST_ITEM', cardData)
          await uni.navigateTo({
            url: `/pages/detail/index?id=${cardData._id}&title=${encodeURIComponent(cardData.name || cardData.title || '')}&author=${encodeURIComponent(cardData.author || '')}&likes=${cardData.likes || 0}&source=index`
          })
        } catch (error) {
          console.error('跳转首页详情页失败:', error)
          handleError(error, '跳转首页详情页')
        }
      } else {
        console.warn('卡片数据不完整，无法跳转首页详情页')
      }
    }
    
    const handleContentTap = async (data) => {
      console.log('内容区域点击:', data)
      const { cardData } = data
      
      if (cardData && cardData.type === 'track') {
        console.log('点击轨迹卡片内容区域，准备在地图上显示轨迹')
        if (cardData.location && cardData.location.coordinates && mapBackground.value) {
          mapBackground.value.showTrack(cardData.location.coordinates, cardData.highEnergyPoints || [])
        }
        return
      }
      
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
    
    const onShowTrack = (polyline) => {
      console.log('收到显示轨迹事件:', polyline)
      if (!mapConfig.polyline || !Array.isArray(mapConfig.polyline)) {
        mapConfig.polyline = []
      }
      mapConfig.polyline.length = 0
      mapConfig.polyline.push(...polyline)
      console.log('轨迹已设置到mapConfig:', mapConfig.polyline)
    }
    
    const onMapRegionChanged = (bounds) => {
      try {
        mapBounds.value = bounds
        mapMgrRegionChanged(bounds)
      } catch (error) {
        handleError(error, '处理地图区域变化')
      }
    }
    
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
        if (marker) {
          resolveAddressByCoords(marker.latitude, marker.longitude).then(addr => { if (addr && selectedPoint.value && selectedPoint.value.point) selectedPoint.value.point.address = addr })
        }
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

    const init = async () => {
      try {
        console.log('开始初始化首页...')
        initLayout()
        loadMapState()
        try {
          await getUserLocation()
          console.log('位置获取成功')
        } catch (error) {
          console.log('获取位置失败，使用默认位置:', error)
        }
        await fetchMapData(activeCategory.value, mapConfig)
        updateMapMarkers(mapPoints.value)
        console.log('首页初始化完成')
      } catch (error) {
        console.error('首页初始化失败:', error)
      }
    }
    
    onMounted(() => { 
      searchBoxHeight.value = 60
      init()
    })
    
    onShow(() => {
      try {
        const pages = getCurrentPages()
        const page = pages[pages.length - 1]
        if (page && typeof page.getTabBar === 'function' && page.getTabBar()) {
          page.getTabBar().setData({ selected: 0 })
        }
      } catch (e) {}
    })
    
    onHide(() => {
      saveMapState()
    })
    
    return {
      mapBackground,
      
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
      
      mapConfig,
      visibleCardIndices,
      updateMapMarkers,
      getUserLocation,
      onMapRegionChanged,
      onVisibleCardsChange,
      handleMoveToLocation,
      
      mapPoints,
      isLoading,
      hasMoreData,
      fetchMapData,
      loadMore,
      
      categories,
      activeCategory,
      handleCategoryChange,
      
      loadMoreItems,
      onSearchInput,
      handleCardTap,
      handleMediaTap,
      handleContentTap,
      lockContentMax,
      restoreContentHeight,
      selectedPoint,
      onMarkerTap,
      onPoiTap,
      closePointDetail,
      navigateToPoint,
      openCenterPointDetail,
      
      showError,
      errorMessage,
      handleError,
      handleMapError,
      onShowTrack
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
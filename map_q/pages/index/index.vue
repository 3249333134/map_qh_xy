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
      :highlighted-card-id="highlightedCardId"
      storage-key-prefix="indexContentArea"
      @drag-start="handleDragStart"
      @drag="handleDrag"
      @drag-end="handleDragEnd"
      @category-change="handleCategoryChange"
      @search-input="onSearchInput"
      @search-tap="onSearchTap"
      @left-outline-tap="onLeftOutlineTap"
      @load-more="loadMoreItems"
      @visible-cards-change="onVisibleCardsChange"
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
import { ROUTE_PLANNER } from '../../utils/routePlanner.js'
import { resolveAddressByCoords, fetchPointNameByCoords } from '../../utils/geocoder.js'
import { getQqMapKey } from '../../utils/mapKey.js'

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
      maxContentHeight,
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

    const activateCardOnMap = async (cardData) => {
      if (!cardData) return cardData
      let updatedCard = cardData
      if (cardData.type === 'track') {
        console.log('重新规划真实道路路线')
        try {
          let start = null
          let end = null
          if (cardData.location &&
              cardData.location.type === 'LineString' &&
              cardData.location.coordinates &&
              cardData.location.coordinates.length >= 2) {
            const coords = cardData.location.coordinates
            start = coords[0]
            end = coords[coords.length - 1]
          }
          const routeResult = await ROUTE_PLANNER.getFixedRoute(start, end)
          if (routeResult.success && routeResult.path.length > 0) {
            console.log('获取到真实道路路线，点数:', routeResult.path.length)
            updatedCard = {
              ...cardData,
              location: {
                ...cardData.location,
                coordinates: routeResult.path
              },
              distance: routeResult.distance,
              duration: Math.round(routeResult.duration / 60) + '分钟'
            }
            if (mapBackground.value) {
              mapBackground.value.showTrack(routeResult.path, cardData.highEnergyPoints || [])
            }
          } else if (cardData.location && cardData.location.coordinates && mapBackground.value) {
            mapBackground.value.showTrack(cardData.location.coordinates, cardData.highEnergyPoints || [])
          }
        } catch (error) {
          console.error('获取真实道路路线失败:', error)
          if (cardData.location && cardData.location.coordinates && mapBackground.value) {
            mapBackground.value.showTrack(cardData.location.coordinates, cardData.highEnergyPoints || [])
          }
        }
      } else if (cardData.location && cardData.location.coordinates && mapBackground.value) {
        const [longitude, latitude] = cardData.location.coordinates
        try {
          await mapBackground.value.moveToLocation(latitude, longitude, 16)
          console.log('地图定位成功')
        } catch (error) {
          console.error('地图定位失败:', error)
        }
      }
      return updatedCard
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

    const onSearchTap = () => {
      console.log('在当前地图面板内搜索')
      if (maxContentHeight.value > 0) {
        contentHeight.value = maxContentHeight.value
      }
    }

    const onLeftOutlineTap = () => {
      uni.navigateTo({ url: '/pages/anchor-layer/index' })
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
      let { cardData } = data

      const updatedCard = await activateCardOnMap(cardData)
      if (updatedCard) {
        cardData = updatedCard
      }

      if (cardData && cardData._id) {
        try {
          uni.setStorageSync('INDEX_LAST_ITEM', cardData)
          await uni.navigateTo({
            url: `/pages/detail/index?id=${cardData._id}&title=${encodeURIComponent(cardData.name || cardData.title || '')}&author=${encodeURIComponent(cardData.author || '')}&likes=${cardData.likes || 0}&source=index&type=${cardData.type || ''}`
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
      let { cardData } = data

      const updatedCard = await activateCardOnMap(cardData)
      if (updatedCard) {
        cardData = updatedCard
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

    const highlightedCardId = ref(null)

    const onMarkerTap = (payload) => {
      try {
        const id = payload && (payload.markerId ?? (payload.detail && payload.detail.markerId))
        let marker = payload && payload.marker
        if (!marker && Array.isArray(mapConfig.markers)) {
          marker = mapConfig.markers.find(m => String(m.id) === String(id)) || null
        }
        let point = null
        let cardId = null
        if (marker && marker.customData && marker.customData.pointId) {
          point = mapPoints.value.find(p => p._id === marker.customData.pointId) || null
          cardId = marker.customData.pointId
        }
        if (!point && marker) {
          point = { _id: `marker_${id}`, name: (marker.customData && marker.customData.name) || '位置', address: '', description: '', location: { type: 'Point', coordinates: [marker.longitude, marker.latitude] } }
        }
        selectedPoint.value = { point, marker }
        if (marker) {
          resolveAddressByCoords(marker.latitude, marker.longitude).then(addr => { if (addr && selectedPoint.value && selectedPoint.value.point) selectedPoint.value.point.address = addr })
        }
        if (cardId) {
          highlightedCardId.value = cardId
          setTimeout(() => {
            highlightedCardId.value = null
          }, 3000)
          try {
            const sys = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
            const screenH = sys.windowHeight
            const midH = screenH * (LAYOUT_CONFIG && LAYOUT_CONFIG.INITIAL_CONTENT_RATIO ? LAYOUT_CONFIG.INITIAL_CONTENT_RATIO : 0.55)
            if (contentHeight.value < midH) {
              contentHeight.value = midH
            }
          } catch (e) {}
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
      } catch (e) {
        console.warn('处理POI点击失败:', e)
      }
    }

    const closePointDetail = () => { selectedPoint.value = null }

    const navigateToPoint = () => {
      try {
        const m = selectedPoint.value && selectedPoint.value.marker
        if (!m) return
        uni.openLocation({ latitude: m.latitude, longitude: m.longitude, name: (selectedPoint.value.point && selectedPoint.value.point.name) || '位置' })
      } catch (e) {
        console.warn('打开位置失败:', e)
      }
    }

    const getNearestPointToMapCenter = () => {
      const centerLat = Number(mapConfig.latitude)
      const centerLng = Number(mapConfig.longitude)
      if (!Number.isFinite(centerLat) || !Number.isFinite(centerLng)) return null

      return mapPoints.value.reduce((nearest, candidate) => {
        const coordinates = candidate && candidate.location && candidate.location.type === 'Point'
          ? candidate.location.coordinates
          : null
        if (!Array.isArray(coordinates) || coordinates.length < 2) return nearest

        const lng = Number(coordinates[0])
        const lat = Number(coordinates[1])
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return nearest

        const longitudeScale = Math.cos(centerLat * Math.PI / 180)
        const distance = Math.pow((lng - centerLng) * longitudeScale, 2) + Math.pow(lat - centerLat, 2)
        return !nearest || distance < nearest.distance
          ? { point: candidate, latitude: lat, longitude: lng, distance }
          : nearest
      }, null)
    }

    // 右侧“地点”按钮直接在当前页展开地点详情，不进入图层或锚点页面。
    const openCenterPointDetail = () => {
      try {
        const nearest = getNearestPointToMapCenter()
        const lat = nearest ? nearest.latitude : Number(mapConfig.latitude)
        const lng = nearest ? nearest.longitude : Number(mapConfig.longitude)
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return

        const point = nearest
          ? nearest.point
          : { _id: `center_${Date.now()}`, name: '当前位置', address: '', description: '', location: { type: 'Point', coordinates: [lng, lat] } }
        const pointName = point.name || point.title || '当前位置'
        const existingMarker = Array.isArray(mapConfig.markers)
          ? mapConfig.markers.find(item => item && item.customData && String(item.customData.pointId) === String(point._id))
          : null
        const marker = existingMarker || {
          latitude: lat,
          longitude: lng,
          customData: { name: pointName, pointId: point._id }
        }

        selectedPoint.value = { point, marker }
        if (!point.address) {
          resolveAddressByCoords(lat, lng).then(addr => {
            if (addr && selectedPoint.value && selectedPoint.value.point === point) {
              selectedPoint.value.point.address = addr
            }
          })
        }
      } catch (e) {
        console.warn('打开地点详情失败:', e)
      }
    }

    const lastContentHeightBeforeExpand = ref(0)
    const lockContentMax = () => {
      try {
        lastContentHeightBeforeExpand.value = contentHeight.value
        const sys = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
        const screenH = sys.windowHeight
        const maxH = screenH * (LAYOUT_CONFIG && LAYOUT_CONFIG.MAX_CONTENT_RATIO ? LAYOUT_CONFIG.MAX_CONTENT_RATIO : 0.67)
        contentHeight.value = Math.max(minContentHeight.value, Math.min(maxH, screenH))
      } catch (e) {
        console.warn('锁定内容高度失败:', e)
      }
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

        // 清除旧的地图轨迹数据
        console.log('清除旧的地图轨迹...')
        mapConfig.polyline = []

        // 清除本地存储的旧数据
        try {
          uni.removeStorageSync('INDEX_MAPPING_STATE')
          uni.removeStorageSync('INDEX_LAST_ITEM')
          // 清除所有以INDEX_开头的本地存储数据
          const info = uni.getStorageInfoSync()
          info.keys.forEach(key => {
            if (key.startsWith('INDEX_')) {
              uni.removeStorageSync(key)
            }
          })
          console.log('旧的本地存储已清除')
        } catch (e) {
          console.warn('清除本地存储失败:', e)
        }

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
      onSearchTap,
      onLeftOutlineTap,
      handleCardTap,
      handleMediaTap,
      handleContentTap,
      lockContentMax,
      restoreContentHeight,
      selectedPoint,
      highlightedCardId,
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

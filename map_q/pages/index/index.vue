<template>
  <view class="container">
    <view v-if="showError" class="error-toast" role="alert">{{ errorMessage }}</view>

    <map-background
      ref="mapBackground"
      :config="mapConfig"
      :height="mapHeight"
      @region-changed="onMapRegionChanged"
      @map-error="handleMapError"
      @move-to-location="handleMoveToLocation"
      @refresh-location="requestCurrentLocation"
      @markertap="onMarkerTap"
      @poi-tap="onPoiTap"
      @map-longpress="onMapLongPress"
      @show-track="onShowTrack"
    />

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
      :city-name="exploreState.center.cityName"
      :location-state="locationState"
      :time-range="exploreState.timeRange"
      :spatial-filter="exploreState.spatialFilter"
      :is-refreshing="isRefreshing"
      :data-error="dataError"
      :explore-tool-mode="exploreToolMode"
      :layers="exploreState.layers"
      :explore-snapshot="exploreState"
      show-explore-controls
      storage-key-prefix="indexContentArea"
      @drag-start="handleDragStart"
      @drag="handleDrag"
      @drag-end="onPanelDragEnd"
      @category-change="handleCategoryChange"
      @search-input="onSearchInput"
      @search-tap="onSearchTap"
      @search-exit="onSearchExit"
      @city-select="handleCitySelect"
      @time-change="handleTimeChange"
      @space-change="handleSpaceChange"
      @layer-tap="openLayers"
      @share-tap="openShare"
      @close-explore-tool="closeExploreTool"
      @layers-change="handleLayersChange"
      @request-location="requestCurrentLocation"
      @retry="retryData"
      @left-outline-tap="openLayers"
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
      @empty-recovery="handleEmptyRecovery"
    />
    <GlobalOverlayHost />
  </view>
</template>

<script>
import { onMounted, ref } from 'vue'
import { onHide, onLoad, onShareAppMessage, onShow } from '@dcloudio/uni-app'
import MapBackground from '../../components/map/MapBackground.vue'
import ContentArea from '../../components/content/ContentArea.vue'
import GlobalOverlayHost from '../../components/common/GlobalOverlayHost.vue'
import { useMapData } from './composables/useMapData.js'
import { useLayout } from './composables/useLayout.js'
import { useCategory } from './composables/useCategory.js'
import { useMapManager } from './composables/useMapManager.js'
import { ROUTE_PLANNER } from '../../utils/routePlanner.js'
import { resolveAddressByCoords } from '../../utils/geocoder.js'
import {
  consumeMapExploreCommand,
  decodeShareSnapshot,
  encodeShareSnapshot
} from '../../utils/mapExploreState.js'
import { setCreationCommand } from '../../utils/creationCommand.js'

const endOfDay = date => date ? `${date}T23:59:59` : ''

export default {
  name: 'IndexPage',
  components: { MapBackground, ContentArea, GlobalOverlayHost },
  setup() {
    const mapBackground = ref(null)
    const selectedPoint = ref(null)
    const highlightedCardId = ref('')
    const locationState = ref('idle')
    const errorMessage = ref('')
    const showError = ref(false)
    const initialized = ref(false)
    const pendingShareState = ref(null)
    const exploreToolMode = ref('')
    const contentHeightBeforeTool = ref(0)

    const {
      mapPoints,
      isLoading,
      isRefreshing,
      error: dataError,
      hasMoreData,
      mapBounds,
      restorePreview,
      fetchMapData,
      loadMoreItems: loadMore,
      switchCategory,
      retry: retryData
    } = useMapData()

    const {
      contentHeight,
      mapHeight,
      searchBoxHeight,
      minContentHeight,
      maxContentHeight,
      safeBottomOffset,
      isDragging,
      currentMode,
      initLayout,
      handleDragStart,
      handleDrag,
      handleDragEnd,
      setContentMode,
      canActivateContent
    } = useLayout()

    const {
      categories,
      activeCategory,
      handleCategoryChange: changeCategoryHandler
    } = useCategory()

    const {
      exploreState,
      mapConfig,
      visibleCardIndices,
      updateMapMarkers,
      requestLocationPermission,
      handleVisibleCardsChange: mapMgrVisibleCardsChange,
      saveMapState,
      loadMapState,
      applyState,
      setCenter,
      selectPoint
    } = useMapManager()

    const filters = () => ({
      timeRange: {
        ...exploreState.timeRange,
        start: exploreState.timeRange.start,
        end: endOfDay(exploreState.timeRange.end)
      },
      spatialFilter: exploreState.spatialFilter,
      layers: exploreState.layers
    })

    const showTransientError = (error, context) => {
      console.error(`${context}:`, error)
      errorMessage.value = `${context}失败，请稍后重试`
      showError.value = true
      setTimeout(() => { showError.value = false }, 3200)
    }

    const handleMapError = message => showTransientError(new Error(message), '地图加载')

    const refreshData = async ({ force = false } = {}) => {
      await fetchMapData(activeCategory.value, mapConfig, { filters: filters(), force })
      updateMapMarkers(mapPoints.value)
    }

    const requestCurrentLocation = async () => {
      if (locationState.value === 'loading') return
      locationState.value = 'loading'
      try {
        await requestLocationPermission()
        locationState.value = 'granted'
        selectedPoint.value = null
        visibleCardIndices.value = []
        await refreshData({ force: true })
      } catch (error) {
        locationState.value = 'denied'
        showTransientError(error, '定位')
        await refreshData()
      }
    }

    const handleCitySelect = async city => {
      locationState.value = 'manual'
      setCenter(city.latitude, city.longitude, 14, city)
      visibleCardIndices.value = []
      selectedPoint.value = null
      await refreshData({ force: true })
    }

    const handleTimeChange = async value => {
      exploreState.timeRange = { ...value }
      saveMapState()
      await refreshData({ force: true })
    }

    const handleSpaceChange = async value => {
      exploreState.spatialFilter = { ...value }
      saveMapState()
      await refreshData({ force: true })
    }

    const handleEmptyRecovery = type => {
      if (type === 'space') return handleSpaceChange({ mode: 'radius', radiusKm: 10 })
      if (type === 'time') return handleTimeChange({ preset: 'all', start: '', end: '' })
      return handleCategoryChange('all')
    }

    const handleCategoryChange = async categoryId => {
      changeCategoryHandler(categoryId)
      exploreState.category = categoryId
      switchCategory(categoryId)
      saveMapState()
      visibleCardIndices.value = []
      await refreshData({ force: true })
    }

    const openLayers = () => {
      selectedPoint.value = null
      selectPoint('')
      updateMapMarkers(mapPoints.value)
      if (!exploreToolMode.value) contentHeightBeforeTool.value = contentHeight.value
      exploreToolMode.value = 'layers'
      setContentMode('max')
    }
    const openShare = () => {
      saveMapState()
      selectedPoint.value = null
      selectPoint('')
      updateMapMarkers(mapPoints.value)
      if (!exploreToolMode.value) contentHeightBeforeTool.value = contentHeight.value
      exploreToolMode.value = 'share'
      setContentMode('max')
    }
    const closeExploreTool = () => {
      exploreToolMode.value = ''
      if (contentHeightBeforeTool.value > 0) {
        contentHeight.value = contentHeightBeforeTool.value
      } else {
        setContentMode('mid')
      }
      contentHeightBeforeTool.value = 0
    }
    const handleLayersChange = async layers => {
      exploreState.layers = [...layers]
      saveMapState()
      await refreshData({ force: true })
    }

    const loadMoreItems = () => loadMore(activeCategory.value, mapConfig, filters()).then(() => {
      updateMapMarkers(mapPoints.value)
    })

    const onSearchInput = () => {}
    const onSearchTap = () => {
      exploreToolMode.value = ''
      setContentMode('max')
    }
    const onSearchExit = () => setContentMode('mid')
    const handleCardTap = () => {}

    const handleMoveToLocation = ({ latitude, longitude, scale }) => {
      mapConfig.latitude = Number(latitude)
      mapConfig.longitude = Number(longitude)
      mapConfig.scale = Number(scale)
      exploreState.center.latitude = mapConfig.latitude
      exploreState.center.longitude = mapConfig.longitude
      exploreState.scale = mapConfig.scale
      saveMapState()
    }

    const activateCardOnMap = async cardData => {
      if (!cardData) return
      if (cardData.type === 'track') {
        let path = cardData.location?.coordinates || []
        try {
          if (path.length >= 2) {
            const result = await ROUTE_PLANNER.getFixedRoute(path[0], path[path.length - 1])
            if (result.success && result.path.length) path = result.path
          }
        } catch (error) {
          console.info('道路路线不可用，展示内容原始轨迹')
        }
        if (path.length && mapBackground.value) {
          mapBackground.value.showTrack(path, cardData.highEnergyPoints || [])
        }
        return
      }
      const coords = cardData.location?.coordinates
      if (!Array.isArray(coords)) return
      selectPoint(cardData._id)
      setCenter(coords[1], coords[0], 16)
      updateMapMarkers(mapPoints.value)
    }

    const handleMediaTap = async ({ cardData } = {}) => {
      if (!canActivateContent() || !cardData?._id) return
      try {
        uni.setStorageSync('INDEX_LAST_ITEM', cardData)
        if (['place', 'service', 'track'].includes(cardData.type)) {
          await activateCardOnMap(cardData)
          const coords = cardData.location?.type === 'LineString'
            ? cardData.location.coordinates?.[0]
            : cardData.location?.coordinates
          selectedPoint.value = {
            point: cardData,
            marker: {
              latitude: Number(coords?.[1] || mapConfig.latitude),
              longitude: Number(coords?.[0] || mapConfig.longitude),
              customData: { pointId: cardData._id, name: cardData.name || cardData.title }
            }
          }
          highlightedCardId.value = cardData._id
          setContentMode('mid')
          return
        }
        await uni.navigateTo({
          url: `/pages/detail/index?id=${encodeURIComponent(cardData._id)}&title=${encodeURIComponent(cardData.name || cardData.title || '')}&source=index&type=${encodeURIComponent(cardData.type || 'normal')}`
        })
      } catch (error) {
        showTransientError(error, '打开详情')
      }
    }

    const handleContentTap = async ({ cardData } = {}) => {
      if (!canActivateContent() || !cardData) return
      await activateCardOnMap(cardData)
    }

    const onShowTrack = polyline => {
      mapConfig.polyline = Array.isArray(polyline) ? [...polyline] : []
    }

    const onMapRegionChanged = async bounds => {
      mapBounds.value = bounds
      mapConfig.scale = Number(bounds.scale || mapConfig.scale)
      if (bounds?.northeast && bounds?.southwest) {
        mapConfig.latitude = (Number(bounds.northeast.latitude) + Number(bounds.southwest.latitude)) / 2
        mapConfig.longitude = (Number(bounds.northeast.longitude) + Number(bounds.southwest.longitude)) / 2
      }
      exploreState.center.latitude = Number(mapConfig.latitude)
      exploreState.center.longitude = Number(mapConfig.longitude)
      exploreState.scale = mapConfig.scale
      saveMapState()
      await refreshData()
    }

    let visibleTimer = null
    const onVisibleCardsChange = indices => {
      clearTimeout(visibleTimer)
      visibleTimer = setTimeout(() => {
        mapMgrVisibleCardsChange(indices)
        updateMapMarkers(mapPoints.value)
      }, 120)
    }

    const onMarkerTap = payload => {
      exploreToolMode.value = ''
      const marker = payload?.marker || mapConfig.markers.find(item => String(item.id) === String(payload?.markerId))
      if (!marker) return
      const custom = marker.customData || {}
      if (custom.anchorKind === 'cluster') {
        visibleCardIndices.value = []
        setCenter(marker.latitude, marker.longitude, Math.min(20, mapConfig.scale + 2))
        return
      }
      const point = mapPoints.value.find(item => String(item._id) === String(custom.pointId))
      if (!point) return
      if (custom.anchorKind === 'replica') {
        uni.navigateTo({ url: `/pages/anchor-action/index?id=${encodeURIComponent(point._id)}` })
        return
      }
      selectPoint(point._id)
      selectedPoint.value = { point, marker }
      highlightedCardId.value = point._id
      setContentMode('mid')
      updateMapMarkers(mapPoints.value)
      resolveAddressByCoords(marker.latitude, marker.longitude).then(address => {
        if (address && selectedPoint.value?.point === point) point.address = address
      })
      setTimeout(() => { highlightedCardId.value = '' }, 3000)
    }

    const onPoiTap = payload => {
      exploreToolMode.value = ''
      const marker = payload?.marker
      if (!marker) return
      selectedPoint.value = {
        marker,
        point: {
          _id: `poi_${Date.now()}`,
          name: marker.customData?.name || '位置',
          address: '',
          location: { type: 'Point', coordinates: [marker.longitude, marker.latitude] }
        }
      }
    }

    let lastMapLongPressAt = 0
    const onMapLongPress = payload => {
      if (Date.now() - lastMapLongPressAt < 800) return
      lastMapLongPressAt = Date.now()
      const latitude = Number(payload?.latitude)
      const longitude = Number(payload?.longitude)
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return
      try {
        const existing = mapPoints.value
          .filter(item => item.location?.type === 'Point' && Array.isArray(item.location.coordinates))
          .map(item => ({
            id: item._id || item.id,
            name: item.name || item.title || '地图地点',
            latitude: Number(item.location.coordinates[1]),
            longitude: Number(item.location.coordinates[0])
          }))
        uni.setStorageSync('BEACON_EXISTING_POINTS_V1', existing)
      } catch (error) {
        console.warn('保存信标重复检查数据失败', error)
      }
      setCreationCommand({ createBeacon: { latitude, longitude, source: 'map_longpress' } })
      if (typeof uni.vibrateShort === 'function') {
        try { uni.vibrateShort({ type: 'light' }) } catch (error) {}
      }
      uni.navigateTo({ url: '/pages/publish-cocreate/index?source=map-longpress' })
    }

    const closePointDetail = () => {
      selectedPoint.value = null
      selectPoint('')
      updateMapMarkers(mapPoints.value)
    }

    const navigateToPoint = () => {
      const marker = selectedPoint.value?.marker
      if (!marker) return
      uni.openLocation({
        latitude: marker.latitude,
        longitude: marker.longitude,
        name: selectedPoint.value?.point?.name || '位置'
      })
    }

    const openCenterPointDetail = () => {
      const points = mapPoints.value.filter(item => item.location?.type === 'Point')
      const point = points[0]
      if (!point) return
      const coords = point.location.coordinates
      onMarkerTap({
        marker: {
          latitude: coords[1],
          longitude: coords[0],
          customData: { pointId: point._id, name: point.name, anchorKind: point.anchorKind || 'normal' }
        }
      })
    }

    const lastContentHeightBeforeExpand = ref(0)
    const lockContentMax = () => {
      lastContentHeightBeforeExpand.value = contentHeight.value
      contentHeight.value = maxContentHeight.value
    }
    const restoreContentHeight = () => {
      if (lastContentHeightBeforeExpand.value) contentHeight.value = lastContentHeightBeforeExpand.value
    }

    const onPanelDragEnd = event => {
      handleDragEnd(event)
      exploreState.panelMode = currentMode.value
      saveMapState()
    }

    const applyCommand = async command => {
      if (!command) return false
      if (command.restoreSnapshot) applyState(command.restoreSnapshot)
      if (command.applyFilters) {
        if (command.applyFilters.category) {
          changeCategoryHandler(command.applyFilters.category)
          exploreState.category = command.applyFilters.category
        }
        if (command.applyFilters.timeRange) exploreState.timeRange = { ...command.applyFilters.timeRange }
        if (command.applyFilters.spatialFilter) exploreState.spatialFilter = { ...command.applyFilters.spatialFilter }
        if (command.applyFilters.layers) exploreState.layers = [...command.applyFilters.layers]
      }
      const focus = command.focusPoint
      if (focus?.location?.type === 'Point') {
        const [longitude, latitude] = focus.location.coordinates
        setCenter(latitude, longitude, command.scale || 16, focus.city || {})
        selectPoint(focus._id || focus.id)
      }
      if (command.showRoute?.location?.coordinates) {
        const route = command.showRoute
        if (mapBackground.value) mapBackground.value.showTrack(route.location.coordinates, route.highEnergyPoints || [])
      }
      activeCategory.value = exploreState.category
      categories.value.forEach(item => { item.active = item.id === activeCategory.value })
      saveMapState()
      await refreshData({ force: true })
      const detailPoint = command.openDetail || focus
      if (detailPoint) {
        const point = mapPoints.value.find(item => String(item._id) === String(detailPoint._id || detailPoint.id)) || detailPoint
        const coords = point.location?.coordinates
        const first = point.location?.type === 'LineString' ? coords?.[0] : coords
        if (first?.length >= 2) {
          selectedPoint.value = {
            point,
            marker: { latitude: first[1], longitude: first[0], customData: { pointId: point._id || point.id, name: point.name || point.title } }
          }
          highlightedCardId.value = point._id || point.id
          setContentMode('mid')
        }
      }
      return true
    }

    const init = async () => {
      initLayout()
      mapConfig.polyline = []
      const restored = loadMapState()
      if (pendingShareState.value) {
        applyState(pendingShareState.value)
        activeCategory.value = exploreState.category
      } else {
        activeCategory.value = exploreState.category
      }
      categories.value.forEach(item => { item.active = item.id === activeCategory.value })
      setContentMode(exploreState.panelMode)
      restorePreview()
      updateMapMarkers(mapPoints.value)
      if (!restored.restored && !pendingShareState.value) {
        await requestCurrentLocation()
      } else {
        await refreshData()
      }
      initialized.value = true
    }

    onLoad(options => {
      pendingShareState.value = decodeShareSnapshot(options?.map)
    })

    onMounted(() => {
      searchBoxHeight.value = 60
      init()
    })

    onShow(async () => {
      try {
        const pages = getCurrentPages()
        const page = pages[pages.length - 1]
        if (page?.getTabBar?.()) page.getTabBar().setData({ selected: 0 })
      } catch (error) {}
      if (initialized.value) await applyCommand(consumeMapExploreCommand())
    })

    onHide(saveMapState)

    onShareAppMessage(() => ({
      title: `${exploreState.center.cityName}地图探索 · 足迹`,
      path: `/pages/index/index?map=${encodeShareSnapshot(exploreState)}`
    }))

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
      onPanelDragEnd,
      exploreState,
      mapConfig,
      visibleCardIndices,
      locationState,
      requestCurrentLocation,
      handleCitySelect,
      handleTimeChange,
      handleSpaceChange,
      handleEmptyRecovery,
      openLayers,
      openShare,
      closeExploreTool,
      handleLayersChange,
      exploreToolMode,
      onMapRegionChanged,
      onVisibleCardsChange,
      handleMoveToLocation,
      mapPoints,
      isLoading,
      isRefreshing,
      dataError,
      hasMoreData,
      retryData,
      categories,
      activeCategory,
      handleCategoryChange,
      loadMoreItems,
      onSearchInput,
      onSearchTap,
      onSearchExit,
      handleCardTap,
      handleMediaTap,
      handleContentTap,
      lockContentMax,
      restoreContentHeight,
      selectedPoint,
      highlightedCardId,
      onMarkerTap,
      onPoiTap,
      onMapLongPress,
      closePointDetail,
      navigateToPoint,
      openCenterPointDetail,
      showError,
      errorMessage,
      handleMapError,
      onShowTrack
    }
  }
}
</script>

<style scoped>
.container { position: relative; width: 100%; height: 100vh; overflow: hidden; overscroll-behavior-y: none; }
.error-toast { position: fixed; top: calc(env(safe-area-inset-top) + 108px); left: 50%; transform: translateX(-50%); max-width: calc(100% - 40px); padding: 11px 16px; border-radius: 18px; background: rgba(127,29,29,.94); color: #fff; font-size: 13px; z-index: 120; box-shadow: 0 8px 24px rgba(127,29,29,.24); animation: slideDown .22s ease-out; }
@keyframes slideDown { from { opacity: 0; transform: translateX(-50%) translateY(-10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
@media (prefers-reduced-motion: reduce) { .error-toast { animation: none; } }
</style>

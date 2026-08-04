<template>
  <view class="container">
    <!-- 地图区域 -->
    <map-background
      :height="mapHeight"
      :config="mapConfig"
      @refresh-location="requestCurrentLocation"
      @region-changed="onMapRegionChanged"
      @move-to-location="handleMoveToLocation"
      @markertap="onMarkerTap"
      @poi-tap="onPoiTap"
      @poitap="onPoiTap"
      ref="mapBackground"
    />
    <!-- 可滑动区域 -->
    <content-area
      :height="contentHeight"
      :search-box-height="searchBoxHeight"
      :min-content-height="minContentHeight"
      :bottom-offset="safeBottomOffset"
      :categories="categories"
      :active-category="activeCategory"
      :map-data="mapPoints"
      :is-loading="isLoading"
      :has-more-data="hasMoreData"
      :visible-card-indices="visibleCardIndices"
      :is-dragging="isDragging"
      :selected-point="selectedPoint"
      :city-name="exploreState.center.cityName"
      :location-state="locationState"
      :time-range="exploreState.timeRange"
      :spatial-filter="exploreState.spatialFilter"
      :explore-tool-mode="exploreToolMode"
      :layers="exploreState.layers"
      :explore-snapshot="exploreState"
      show-explore-controls
      storage-key-prefix="serviceContentArea"
      @drag-start="handleDragStart"
      @drag="handleDrag"
      @drag-end="handleDragEnd"
      @category-change="handleCategoryChange"
      @search-input="onSearchInput"
      @search-tap="onSearchTap"
      @load-more="loadMoreItems"
      @card-tap="handleCardTap"
      @visible-cards-change="handleVisibleCardsChange"
      
      @media-tap="handleMediaTap"
      @content-tap="handleContentTap"
      @reserve="handleReserve"
      @close-point-detail="closePointDetail"
      @navigate-to-point="navigateToPoint"
      @right-action-tap="openCenterPointDetail"
      @city-select="handleCitySelect"
      @time-change="handleTimeChange"
      @space-change="handleSpaceChange"
      @layer-tap="openLayers"
      @share-tap="openShare"
      @close-explore-tool="closeExploreTool"
      @layers-change="handleLayersChange"
      @request-location="requestCurrentLocation"
    />
    <!-- 全局发布弹窗挂载点 -->
    <GlobalOverlayHost />
  </view>
</template>

<script>
import { onReady, onShow, onHide, onShareAppMessage } from '@dcloudio/uni-app'
import { reactive, ref, watch } from 'vue'
import MapBackground from '../../components/map/MapBackground.vue'
import ContentArea from '../../components/content/ContentArea.vue'
import GlobalOverlayHost from '../../components/common/GlobalOverlayHost.vue'
import { useServiceLayout } from './composables/useServiceLayout.js'
import { useServiceCategory } from './composables/useServiceCategory.js'
import { useServiceMapData } from './composables/useServiceMapData.js'
import { resolveAddressByCoords } from '../../utils/geocoder.js'
import { getQqMapKey } from '../../utils/mapKey.js'
import {
  consumeMapExploreCommand,
  encodeShareSnapshot,
  loadMapExploreState,
  saveMapExploreState
} from '../../utils/mapExploreState.js'

console.log('=== 服务页脚本加载 ===')

export default {
  components: {
    MapBackground,
    ContentArea,
    GlobalOverlayHost
  },
  
  setup() {
    // 使用布局管理
    const {
      screenHeight,
      contentHeight,
      searchBoxHeight,
      safeBottomOffset,
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
      updateMapMarkers,
      setExploreFilters,
      handleCardTap: baseHandleCardTap,
      handleVisibleCardsChange,
      onMapRegionChanged,
      onSearchInput,
      saveMapState,
      loadMapState
    } = useServiceMapData()

    // 地图组件引用（用于调用 moveToLocation）
    const mapBackground = ref(null)
    const pendingMapCommand = ref(null)
    const restoredExploreState = loadMapExploreState().state
    const exploreState = reactive({
      ...restoredExploreState,
      center: {
        ...restoredExploreState.center,
        latitude: mapConfig.latitude,
        longitude: mapConfig.longitude
      },
      layers: [...restoredExploreState.layers]
    })
    const exploreToolMode = ref('')
    const locationState = ref('idle')
    const contentHeightBeforeTool = ref(0)

    const persistExploreState = () => {
      exploreState.center.latitude = mapConfig.latitude
      exploreState.center.longitude = mapConfig.longitude
      exploreState.scale = mapConfig.scale
      const saved = saveMapExploreState(exploreState)
      Object.assign(exploreState, saved)
      setExploreFilters(exploreState)
    }

    const onSearchTap = () => {
      exploreToolMode.value = ''
      if (maxContentHeight.value > 0) {
        contentHeight.value = maxContentHeight.value
      }
    }

    const requestCurrentLocation = async () => {
      if (locationState.value === 'loading') return
      locationState.value = 'loading'
      try {
        await getUserLocation()
        locationState.value = 'granted'
        exploreState.center.cityName = '当前位置'
        persistExploreState()
        currentPage.value = 1
        await fetchMapData(activeCategory.value)
      } catch (error) {
        locationState.value = 'denied'
        uni.showToast({ title: '定位失败，已保留当前城市', icon: 'none' })
      }
    }

    const handleCitySelect = async city => {
      locationState.value = 'manual'
      mapConfig.latitude = Number(city.latitude)
      mapConfig.longitude = Number(city.longitude)
      mapConfig.scale = 14
      exploreState.center = { ...city }
      persistExploreState()
      currentPage.value = 1
      await fetchMapData(activeCategory.value)
    }

    const handleTimeChange = async value => {
      exploreState.timeRange = { ...value }
      persistExploreState()
      currentPage.value = 1
      await fetchMapData(activeCategory.value)
    }

    const handleSpaceChange = async value => {
      exploreState.spatialFilter = { ...value }
      persistExploreState()
      currentPage.value = 1
      await fetchMapData(activeCategory.value)
    }

    const openLayers = () => {
      selectedPoint.value = null
      if (!exploreToolMode.value) contentHeightBeforeTool.value = contentHeight.value
      exploreToolMode.value = 'layers'
      contentHeight.value = maxContentHeight.value
    }

    const openShare = () => {
      selectedPoint.value = null
      persistExploreState()
      if (!exploreToolMode.value) contentHeightBeforeTool.value = contentHeight.value
      exploreToolMode.value = 'share'
      contentHeight.value = maxContentHeight.value
    }

    const closeExploreTool = () => {
      exploreToolMode.value = ''
      contentHeight.value = contentHeightBeforeTool.value || (screenHeight.value * 0.55)
      contentHeightBeforeTool.value = 0
    }

    const handleLayersChange = async layers => {
      exploreState.layers = [...layers]
      persistExploreState()
      currentPage.value = 1
      await fetchMapData(activeCategory.value)
    }

    // 新增：接收地图组件发出的定位事件，回写到 mapConfig 驱动地图移动
    const handleMoveToLocation = ({ latitude, longitude, scale }) => {
      if (typeof latitude === 'number' && typeof longitude === 'number') {
        mapConfig.latitude = latitude
        mapConfig.longitude = longitude
        if (typeof scale === 'number') {
          mapConfig.scale = scale
        }
        persistExploreState()
      } else {
        console.warn('handleMoveToLocation 收到无效坐标:', { latitude, longitude, scale })
      }
    }

    // 新增：地图错误处理
    const handleMapError = (msg) => {
      console.error('地图错误：', msg)
      uni.showToast({ title: String(msg || '地图加载失败'), icon: 'none' })
    }

    const showInlineServiceDetail = item => {
      if (!item) return
      const coords = item.location?.coordinates || item.coordinates
      selectedPoint.value = {
        point: { ...item, type: item.type || 'service' },
        marker: {
          latitude: Number(coords?.[1] || mapConfig.latitude),
          longitude: Number(coords?.[0] || mapConfig.longitude),
          customData: { pointId: item._id || item.id, name: item.name || item.title }
        }
      }
      contentHeight.value = Math.min(maxContentHeight.value, screenHeight.value * 0.7)
    }

    const handleCardTap = index => {
      const item = baseHandleCardTap(index)
      if (item) showInlineServiceDetail(item)
      return item
    }

    // 处理上方媒体区域点击：在当前地图中替换内容区域
    const handleMediaTap = async ({ cardData, index }) => {
      const item = typeof index === 'number' ? baseHandleCardTap(index) : cardData
      if (item) showInlineServiceDetail(item)
      return item
    }

    // 处理下方内容区域点击：只定位到地图
    const handleContentTap = async ({ cardData, index }) => {
      // 只定位到地图，不跳转详情
      const item = typeof index === 'number' ? mapPoints.value[index] : cardData
      if (!item) {
        uni.showToast({ title: '未找到服务数据', icon: 'none' })
        return
      }
      // 支持两种坐标结构：item.location.coordinates 或 item.coordinates
      let coords = null
      if (item.location && Array.isArray(item.location.coordinates)) {
        coords = item.location.coordinates
      } else if (Array.isArray(item.coordinates)) {
        coords = item.coordinates
      }
      if (coords) {
        const [lng, lat] = coords
        mapConfig.latitude = lat
        mapConfig.longitude = lng
        mapConfig.scale = 16
      } else {
        uni.showToast({ title: '未找到位置信息', icon: 'none' })
      }
    }

    const handleReserve = ({ cardData, index, slot } = {}) => {
      const item = cardData || (typeof index === 'number' ? mapPoints.value[index] : null) || selectedPoint.value?.point
      if (!item) return uni.showToast({ title: '未找到服务数据', icon: 'none' })
      uni.setStorageSync('BOOKING_ITEM', { ...item, type: 'service', selectedSlot: slot || null })
      uni.navigateTo({ url: `/pages/booking/index?source=service&id=${encodeURIComponent(item._id || item.id || '')}` })
    }

    // 选中点详情状态
    const selectedPoint = ref(null)
    // 页面是否已完成初始化（用于防止地图初始化时误触 POI 点击事件）
    const isPageReady = ref(false)
    
    // 监听 selectedPoint 变化，追踪是谁设置的
    watch(selectedPoint, (newVal, oldVal) => {
      console.log('=== selectedPoint 变化 ===')
      console.log('旧值:', oldVal)
      console.log('新值:', newVal)
      console.log('调用栈:', new Error().stack)
    }, { immediate: true, deep: true })

    // 标记点点击处理
    const onMarkerTap = (payload) => {
      exploreToolMode.value = ''
      // 页面未初始化完成时不处理点击事件
      if (!isPageReady.value) {
        console.log('服务页未就绪，忽略标记点点击')
        return
      }
      try {
        console.log('=== 服务页标记点点击开始 ===')
        console.log('payload:', payload)
        
        const id = payload && (payload.markerId ?? (payload.detail && payload.detail.markerId))
        console.log('markerId:', id)
        
        let marker = payload && payload.marker
        console.log('payload中的marker:', marker)
        
        if (!marker && Array.isArray(mapConfig.markers)) {
          console.log('mapConfig.markers:', mapConfig.markers)
          marker = mapConfig.markers.find(m => String(m.id) === String(id)) || null
          console.log('从mapConfig.markers中找到的marker:', marker)
        }
        
        let point = null
        if (marker && marker.customData && marker.customData.pointId) {
          console.log('marker.customData:', marker.customData)
          console.log('mapPoints.value:', mapPoints.value)
          point = mapPoints.value.find(p => p._id === marker.customData.pointId) || null
          console.log('根据pointId找到的point:', point)
        }
        
        if (!point && marker) {
          point = { _id: `marker_${id}`, name: (marker.customData && marker.customData.name) || '位置', address: '', description: '', location: { type: 'Point', coordinates: [marker.longitude, marker.latitude] } }
          console.log('创建的默认point:', point)
        }
        
        console.log('最终的point:', point)
        selectedPoint.value = { point, marker }
        console.log('selectedPoint已设置:', selectedPoint.value)
        console.log('selectedPoint.value === null:', selectedPoint.value === null)
        
        if (marker) {
          resolveAddressByCoords(marker.latitude, marker.longitude).then(addr => { 
            if (addr && selectedPoint.value && selectedPoint.value.point) {
              selectedPoint.value.point.address = addr 
              console.log('地址解析完成:', addr)
            }
          })
        }
        console.log('=== 服务页标记点点击结束 ===')
      } catch (err) {
        console.error('标记点点击处理失败:', err)
      }
    }

    // POI点击处理
    const onPoiTap = (payload) => {
      exploreToolMode.value = ''
      // 页面未初始化完成时不处理点击事件
      if (!isPageReady.value) {
        console.log('服务页未就绪，忽略POI点击')
        return
      }
      try {
        const m = payload && payload.marker
        if (!m) return
        const point = { _id: `poi_${Date.now()}`, name: (m.customData && m.customData.name) || '位置', address: '', description: '', location: { type: 'Point', coordinates: [m.longitude, m.latitude] } }
        selectedPoint.value = { point, marker: m }
        resolveAddressByCoords(m.latitude, m.longitude).then(addr => { 
          if (addr && selectedPoint.value && selectedPoint.value.point) {
            selectedPoint.value.point.address = addr 
          }
        })
      } catch (e) {
        console.error('POI点击处理失败:', e)
      }
    }

    // 关闭点详情
    const closePointDetail = () => { 
      selectedPoint.value = null 
    }

    // 导航到点
    const navigateToPoint = () => {
      try {
        const m = selectedPoint.value && selectedPoint.value.marker
        if (!m) return
        uni.openLocation({ 
          latitude: m.latitude, 
          longitude: m.longitude, 
          name: (selectedPoint.value.point && selectedPoint.value.point.name) || '位置' 
        })
      } catch (e) {
        console.error('导航失败:', e)
      }
    }

    // 打开中心点详情
    const openCenterPointDetail = () => {
      // 页面未初始化完成时不处理
      if (!isPageReady.value) {
        console.log('服务页未就绪，忽略打开中心点详情')
        return
      }
      try {
        const lat = mapConfig.latitude
        const lng = mapConfig.longitude
        if (typeof lat !== 'number' || typeof lng !== 'number') return
        const marker = { latitude: lat, longitude: lng, customData: { name: '当前位置' } }
        const point = { _id: `center_${Date.now()}`, name: '当前位置', address: '', description: '', location: { type: 'Point', coordinates: [lng, lat] } }
        selectedPoint.value = { point, marker }
      } catch (e) {
        console.error('打开中心点详情失败:', e)
      }
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
      console.log('服务页 onReady 触发')
      // 强制重置 selectedPoint，确保页面打开时不显示详情弹窗
      selectedPoint.value = null
      console.log('服务页初始化 - 强制重置 selectedPoint:', selectedPoint.value)
      getUserLocation().then(() => {
        initLayout()
        loadMapState()
        persistExploreState()
        searchBoxHeight.value = 60
        loadInitialData()
        console.log('服务页初始化完成')
        console.log('mapPoints 数据:', mapPoints.value)
        console.log('mapConfig.markers:', mapConfig.markers)
        console.log('初始化完成时 selectedPoint:', selectedPoint.value)
        // 标记页面初始化完成，允许处理点击事件
        setTimeout(() => {
          // 再次强制重置 selectedPoint，防止地图初始化过程中被设置
          selectedPoint.value = null
          console.log('服务页就绪前再次重置 selectedPoint:', selectedPoint.value)
          isPageReady.value = true
          if (pendingMapCommand.value?.openDetail) {
            showInlineServiceDetail(pendingMapCommand.value.openDetail)
            pendingMapCommand.value = null
          }
          console.log('服务页已就绪，开始接收点击事件')
          console.log('就绪时 selectedPoint:', selectedPoint.value)
        }, 2000) // 延长延迟时间，确保地图完全初始化
      }).catch((err) => {
        console.error('服务页初始化失败:', err)
        initLayout()
        loadMapState()
        persistExploreState()
        searchBoxHeight.value = 60
        loadInitialData()
        // 即使初始化失败也标记页面就绪（延迟后）
        setTimeout(() => {
          selectedPoint.value = null
          isPageReady.value = true
          if (pendingMapCommand.value?.openDetail) {
            showInlineServiceDetail(pendingMapCommand.value.openDetail)
            pendingMapCommand.value = null
          }
          console.log('服务页已就绪（异常路径），开始接收点击事件')
        }, 2000)
      })
    })
    
    // 页面展示时同步底部 TabBar 高亮为“服务”
    onShow(() => {
      try {
        const pages = getCurrentPages()
        const page = pages[pages.length - 1]
        if (page && typeof page.getTabBar === 'function' && page.getTabBar()) {
          page.getTabBar().setData({ selected: 1 })
        }
      } catch (e) {}
      const command = consumeMapExploreCommand()
      if (command) {
        pendingMapCommand.value = command
        if (isPageReady.value && command.openDetail) {
          showInlineServiceDetail(command.openDetail)
          pendingMapCommand.value = null
        }
      }
    })
    
    // 页面隐藏时保存服务页状态
    onHide(() => {
      saveMapState()
      persistExploreState()
    })

    onShareAppMessage(() => ({
      title: `${exploreState.center.cityName}服务地图 · 足迹`,
      path: `/pages/service/index?map=${encodeShareSnapshot(exploreState)}`
    }))
    
    return {
      // 组件引用
      mapBackground,
      // 布局相关/分类/数据相关
      screenHeight,
      contentHeight,
      searchBoxHeight,
      safeBottomOffset,
      isDragging,
      mapHeight,
      minContentHeight,
      minVisibleHeight,
      maxContentHeight,
      initLayout,
      // 分类相关
      categories,
      activeCategory,
      // 数据相关
      mapPoints,
      isLoading,
      hasMoreData,
      mapConfig,
      visibleCardIndices,
      exploreState,
      exploreToolMode,
      locationState,
      // 选中点详情
      selectedPoint,
      // 方法
      // 事件处理函数，全部导出
      handleDragStart,
      handleDrag,
      handleDragEnd,
      handleMoveToLocation,
      onMapRegionChanged,
      handleMediaTap,
      handleContentTap,
      handleReserve,
      handleCategoryChange,
      onSearchInput,
      onSearchTap,
      requestCurrentLocation,
      handleCitySelect,
      handleTimeChange,
      handleSpaceChange,
      openLayers,
      openShare,
      closeExploreTool,
      handleLayersChange,
      loadMoreItems,
      handleCardTap,
      handleVisibleCardsChange,
      getUserLocation,
      loadMapState,
      saveMapState,
      // 标记点点击处理
      onMarkerTap,
      onPoiTap,
      closePointDetail,
      navigateToPoint,
      openCenterPointDetail,
      loadInitialData,
      
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
</style>

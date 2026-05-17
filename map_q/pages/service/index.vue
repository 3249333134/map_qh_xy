<template>
  <view class="container">
    <!-- 地图区域 -->
    <map-background
      :height="mapHeight"
      :config="mapConfig"
      @refresh-location="getUserLocation"
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
      storage-key-prefix="serviceContentArea"
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
      @close-point-detail="closePointDetail"
      @navigate-to-point="navigateToPoint"
      @right-action-tap="openCenterPointDetail"
    />
    <!-- 全局发布弹窗挂载点 -->
    <GlobalOverlayHost />
  </view>
</template>

<script>
import { onReady, onShow, onHide } from '@dcloudio/uni-app'
import { ref } from 'vue'
import MapBackground from '../../components/map/MapBackground.vue'
import ContentArea from '../../components/content/ContentArea.vue'
import GlobalOverlayHost from '../../components/common/GlobalOverlayHost.vue'
import { useServiceLayout } from './composables/useServiceLayout.js'
import { useServiceCategory } from './composables/useServiceCategory.js'
import { useServiceMapData } from './composables/useServiceMapData.js'

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
      handleCardTap,
      handleVisibleCardsChange,
      onMapRegionChanged,
      onSearchInput,
      saveMapState,
      loadMapState
    } = useServiceMapData()

    // 地图组件引用（用于调用 moveToLocation）
    const mapBackground = ref(null)

    // 新增：接收地图组件发出的定位事件，回写到 mapConfig 驱动地图移动
    const handleMoveToLocation = ({ latitude, longitude, scale }) => {
      if (typeof latitude === 'number' && typeof longitude === 'number') {
        mapConfig.latitude = latitude
        mapConfig.longitude = longitude
        if (typeof scale === 'number') {
          mapConfig.scale = scale
        }
      } else {
        console.warn('handleMoveToLocation 收到无效坐标:', { latitude, longitude, scale })
      }
    }

    // 新增：地图错误处理
    const handleMapError = (msg) => {
      console.error('地图错误：', msg)
      uni.showToast({ title: String(msg || '地图加载失败'), icon: 'none' })
    }

    // 处理上方媒体区域点击：跳转详情页并定位
    const handleMediaTap = async ({ cardData, index }) => {
      // 将媒体区域点击统一委托给 handleCardTap（内部负责定位与跳转服务详情页）
      return handleCardTap(index)
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

    // 处理“预”按钮：最小实现，不改变其他逻辑
    const handleReserve = ({ cardData, index }) => {
      console.log('点击预约:', { cardData, index })
      uni.showToast({ title: '预约', icon: 'none' })
      // 如需跳转预约详情页，请在此处替换为实际路径：
      // uni.navigateTo({ url: `/pages/reserve/index?id=${cardData._id}` })
    }

    // 选中点详情状态
    const selectedPoint = ref(null)

    // 标记点点击处理
    const onMarkerTap = (payload) => {
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

    // 获取QQ地图Key
    const getQqMapKey = () => {
      try {
        const app = typeof getApp === 'function' ? getApp() : null
        const envKey = (app && app.globalData && app.globalData.QQ_MAP_KEY) || uni.getStorageSync('QQ_MAP_KEY') || ''
        const fallbackKey = 'ISSBZ-BQA6T-J2SXF-VSDGE-A7NZ5-U4B3K'
        return envKey || fallbackKey
      } catch (e) { 
        return 'ISSBZ-BQA6T-J2SXF-VSDGE-A7NZ5-U4B3K' 
      }
    }

    // 根据坐标解析地址
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
      getUserLocation().then(() => {
        initLayout()
        loadMapState()
        searchBoxHeight.value = 60
        loadInitialData()
        console.log('服务页初始化完成')
        console.log('mapPoints 数据:', mapPoints.value)
        console.log('mapConfig.markers:', mapConfig.markers)
      }).catch((err) => {
        console.error('服务页初始化失败:', err)
        initLayout()
        loadMapState()
        searchBoxHeight.value = 60
        loadInitialData()
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
      // 页面显示时重置详情弹窗状态
      selectedPoint.value = null
      console.log('服务页 onShow - 清除详情弹窗状态')
    })
    
    // 页面隐藏时保存服务页状态
    onHide(() => {
      saveMapState()
      // 页面隐藏时清除详情弹窗状态
      selectedPoint.value = null
      console.log('服务页 onHide - 清除详情弹窗状态')
    })
    
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

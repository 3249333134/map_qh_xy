<template>
  <view class="container">
    <!-- 地图区域 -->    
    <map-background 
      :height="mapHeight"
      :config="mapConfig"
    />
    
    <!-- 可滑动区域 -->
    <content-area 
      :height="contentHeight"
      :search-box-height="searchBoxHeight"
      :min-content-height="minContentHeight"
      :categories="categories"
      :active-category="activeCategory"
      :left-column-heights="leftColumnHeights"
      :right-column-heights="rightColumnHeights"
      :left-column-data="leftColumnData"
      :right-column-data="rightColumnData"
      :is-loading="isLoading"
      @drag-start="handleDragStart"
      @drag="handleDrag"
      @drag-end="handleDragEnd"
      @waterfall-scroll="handleWaterfallScroll"
      @category-change="handleCategoryChange"
      @search-input="onSearchInput"
      @load-more="loadMoreItems"
    />
  </view>
</template>

<script>
// 导入工具函数和常量
import { LAYOUT_CONFIG } from './constants/layoutConfig.js'
// 导入MongoDB配置
import { MONGO_CONFIG } from '../../utils/db.js'
// 导入组件
import MapBackground from './components/MapBackground.vue'
import ContentArea from './components/ContentArea.vue'

export default {
  components: {
    MapBackground,
    ContentArea
  },
  data() {
    return {
      // 地图配置
      mapConfig: {
        latitude: 30.572815,
        longitude: 104.066801,
        markers: []
      },
      
      // 分类数据
      categories: [
        { id: 'all', name: '全部', active: true },
        { id: 'hot', name: '热门资源', active: false },
        { id: 'exhibition', name: '展会活动', active: false },
        { id: 'personal', name: '个人活动', active: false }
      ],
      activeCategory: 'all',
      
      // 布局相关
      screenHeight: 0,
      contentHeight: 0,
      searchBoxHeight: 0,
      
      // 拖拽相关
      isDragging: false,
      dragStartY: 0,
      dragStartHeight: 0,
      
      // 滚动相关
      lastScrollTop: 0,
      isScrollLocked: false,
      
      // 瀑布流数据
      leftColumnHeights: [],
      rightColumnHeights: [],
      isLoading: false,
      
      // MongoDB数据
      mapPoints: [],
      leftColumnData: [],
      rightColumnData: [],
      
      // 添加分页相关数据
      currentPage: 1,
      pageSize: 10,
      hasMoreData: true
    }
  },
  
  computed: {
    // 计算地图高度
    mapHeight() {
      return this.screenHeight - this.contentHeight
    },
    
    // 最小内容高度（只显示搜索框）
    minContentHeight() {
      return this.searchBoxHeight + LAYOUT_CONFIG.MARGIN
    },
    
    // 最大内容高度
    maxContentHeight() {
      return this.screenHeight * LAYOUT_CONFIG.MAX_CONTENT_RATIO
    }
  },
  
  onReady() {
    this.initLayout()
    this.fetchMapData()
  },
  
  methods: {
    // 初始化布局
    initLayout() {
      const systemInfo = uni.getSystemInfoSync()
      this.screenHeight = systemInfo.windowHeight
      
      // 设置初始内容高度
      this.contentHeight = this.screenHeight * LAYOUT_CONFIG.INITIAL_CONTENT_RATIO
      
      // 设置搜索框高度（固定值）
      this.searchBoxHeight = 80 // 包含拖动条和搜索框的高度
    },
    
    // 从MongoDB获取数据
    // 从MongoDB获取数据
    fetchMapData() {
      this.isLoading = true
      
      // 使用较小的pageSize
      uni.request({
        url: 'http://47.115.220.98:3000/api/map-data',
        method: 'GET',
        data: {
          page: 1,  // 始终获取第一页
          pageSize: 100  // 限制为100条数据
        },
        success: (res) => {
          if (res.statusCode === 200 && res.data) {
            // 在前端过滤数据，只保留距离初始坐标较近的点
            const filteredData = this.filterDataByDistance(res.data, 100);
            this.mapPoints = filteredData;
            
            this.distributeDataToColumns();
            this.updateMapMarkers();
          } else {
            console.error('获取数据失败:', res);
            this.generateRandomData();
          }
        },
        fail: (err) => {
          console.error('请求失败:', err);
          this.generateRandomData();
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    },
    
    // 添加一个方法，根据距离过滤数据
    filterDataByDistance(data, maxCount) {
      if (!data || data.length === 0) return [];
      
      // 计算每个点到初始坐标的距离
      const pointsWithDistance = data.map(point => {
        const distance = this.calculateDistance(
          this.mapConfig.latitude,
          this.mapConfig.longitude,
          point.location.coordinates[1],
          point.location.coordinates[0]
        );
        return { ...point, distance };
      });
      
      // 按距离排序
      pointsWithDistance.sort((a, b) => a.distance - b.distance);
      
      // 只返回最近的maxCount个点
      return pointsWithDistance.slice(0, maxCount);
    },
    
    // 计算两点之间的距离（使用Haversine公式）
    calculateDistance(lat1, lon1, lat2, lon2) {
      const R = 6371000; // 地球半径，单位：米
      const dLat = this.deg2rad(lat2 - lat1);
      const dLon = this.deg2rad(lon2 - lon1);
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      return distance;
    },
    
    deg2rad(deg) {
      return deg * (Math.PI/180);
    },
    // 将数据分配到左右两列
    distributeDataToColumns() {
      if (!this.mapPoints || this.mapPoints.length === 0) {
        return
      }
      
      this.leftColumnData = []
      this.rightColumnData = []
      this.leftColumnHeights = []
      this.rightColumnHeights = []
      
      // 限制最大显示数量，例如每列最多显示10个
      const maxItemsPerColumn = 10
      const totalItems = Math.min(this.mapPoints.length, maxItemsPerColumn * 2)
      
      // 将数据平均分配到左右两列
      for (let index = 0; index < totalItems; index++) {
        const point = this.mapPoints[index]
        // 根据索引交替分配到左右列
        if (index % 2 === 0 && this.leftColumnData.length < maxItemsPerColumn) {
          this.leftColumnData.push(point)
          // 生成随机高度，实际项目中可能需要根据内容动态计算
          this.leftColumnHeights.push(Math.floor(Math.random() * (300 - 150 + 1)) + 150)
        } else if (this.rightColumnData.length < maxItemsPerColumn) {
          this.rightColumnData.push(point)
          this.rightColumnHeights.push(Math.floor(Math.random() * (300 - 150 + 1)) + 150)
        }
      }
    },
    
    data() {
      return {
        // 其他数据...
        markerIcon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAACXBIWXMAAAsTAAALEwEAmpwYAAABYUlEQVR4nO2WTU7DMBCFn1MWLFjAgiVwAXpAuQFIlQBxCm7AFVBvAKdAIIEQl+AG3IBFJdh0gdjAJKpjOXE6tuNIeNJIkezzm/GMx07TlFJKCTgGboEp8AK8Am/ANzADHoEBcAKsNQYFjoA7/3FRfAD3wEkdyB7w5AP9AkNgF9gGVoCWf7YJdIBz4AT48nMegH3gIIQsA8bAErj0L1+PmNcCzv28JXBVFboLvPuAgyqgOYCBn/8GdIvAu8DCTx5UBcwBDX3OBbBTBL31k0YxkDmgkc+7zYMe+kmPdUBzQGOf+5QFPfeTbuqEZkBvs6Cz/4AWgU6KQP/jqkeBTouKqwx0XgV6HgOdVYGeRkGBTQNHLQp0JxYa7eoYaK8KtB8LHRSBDmOggxjosAg0z1UPgfZioP0i0H4MtFcG2jNwVKKgHQNHLQraMXDUoqAdA0fNwFGLgnYMHLUoaMfAUfsF9Qx5K6QhOhIAAAAASUVORK5CYII='
      }
    },
    
    // 更新地图标记点
    updateMapMarkers() {
      if (!this.mapPoints || this.mapPoints.length === 0) {
        return
      }
      
      const markers = this.mapPoints.map((point, index) => {
        return {
          id: index,
          latitude: point.location.coordinates[1],
          longitude: point.location.coordinates[0],
          // 使用Base64编码的图片
          iconPath: this.markerIcon,
          width: 30,
          height: 30,
          callout: {
            content: point.title,
            color: '#000000',
            fontSize: 12,
            borderRadius: 4,
            padding: 5,
            display: 'BYCLICK'
          }
        }
      })
      
      this.mapConfig.markers = markers
      
      // 如果有数据，将地图中心设置为第一个点的位置
      if (markers.length > 0) {
        this.mapConfig.latitude = markers[0].latitude
        this.mapConfig.longitude = markers[0].longitude
      }
    },
    
    // 生成随机数据（作为备用方案）
    // 修改 generateRandomData 函数
    generateRandomData() {
      // 限制随机生成的数据量
      const maxRandomItems = 10
      this.leftColumnHeights = this.generateRandomHeightsArray(maxRandomItems)
      this.rightColumnHeights = this.generateRandomHeightsArray(maxRandomItems)
    },
    
    // 生成随机高度数据
    generateRandomHeights() {
      this.leftColumnHeights = this.generateRandomHeightsArray(10)
      this.rightColumnHeights = this.generateRandomHeightsArray(10)
    },
    
    // 生成随机高度数组
    generateRandomHeightsArray(count) {
      const heights = []
      for (let i = 0; i < count; i++) {
        // 生成150到300之间的随机高度
        const min = 150
        const max = 300
        const height = Math.floor(Math.random() * (max - min + 1)) + min
        heights.push(height)
      }
      return heights
    },
    
    // 处理拖拽开始
    handleDragStart(e) {
      this.isDragging = true
      this.dragStartY = e.touches[0].clientY
      this.dragStartHeight = this.contentHeight
    },
    
    // 处理拖拽中
    handleDrag(e) {
      if (!this.isDragging) return
      
      const currentY = e.touches[0].clientY
      const deltaY = this.dragStartY - currentY
      
      // 计算新的内容区域高度
      let newHeight = this.dragStartHeight + deltaY
      
      // 限制高度范围
      newHeight = Math.max(
        this.minContentHeight, 
        Math.min(this.maxContentHeight, newHeight)
      )
      
      this.contentHeight = newHeight
    },
    
    // 处理拖拽结束
    handleDragEnd() {
      this.isDragging = false
      
      // 添加边界吸附效果，三个状态：只显示搜索框、中间状态、最大高度
      const range = this.maxContentHeight - this.minContentHeight
      const snapThresholds = {
        min: this.minContentHeight + range * LAYOUT_CONFIG.SNAP_THRESHOLD_LOW,
        max: this.minContentHeight + range * LAYOUT_CONFIG.SNAP_THRESHOLD_HIGH
      }
      
      let newHeight
      if (this.contentHeight < snapThresholds.min) {
        // 靠近最小高度，吸附到只显示搜索框的状态
        newHeight = this.minContentHeight
      } else if (this.contentHeight < snapThresholds.max) {
        // 中间状态，吸附到屏幕的1/3
        newHeight = this.screenHeight * LAYOUT_CONFIG.INITIAL_CONTENT_RATIO
      } else {
        // 靠近最大高度，吸附到最大高度
        newHeight = this.maxContentHeight
      }
      
      // 设置高度
      this.contentHeight = newHeight
    },
    
    // 处理瀑布流滚动
    handleWaterfallScroll(e) {
      if (this.isDragging || this.isScrollLocked) return
      
      const currentScrollTop = e.detail.scrollTop
      const deltaY = currentScrollTop - this.lastScrollTop
      
      // 下拉（deltaY > 0）时改变布局
      if (deltaY > 0 && this.contentHeight < this.maxContentHeight) {
        this.handleWaterfallScrollDown(deltaY, currentScrollTop)
      }
      
      this.lastScrollTop = currentScrollTop
    },
    
    // 处理瀑布流向下滚动
    handleWaterfallScrollDown(deltaY, currentScrollTop) {
      // 瀑布流滚动距离与内容区域高度变化比例
      const heightChange = Math.abs(deltaY) / LAYOUT_CONFIG.SCROLL_HEIGHT_RATIO
      
      // 计算新的内容区域高度
      let newHeight = this.contentHeight + heightChange
      newHeight = Math.min(this.maxContentHeight, newHeight)
      
      if (newHeight !== this.contentHeight) {
        // 设置新的内容区域高度
        this.contentHeight = newHeight
        
        // 重置滚动位置，防止瀑布流继续滚动
        this.resetScrollPosition(currentScrollTop, deltaY)
        
        // 暂时锁定滚动，防止连续触发
        this.lockScrollTemporarily()
        
        // 确保内容区域高度是屏幕高度的整数倍数
        if (this.contentHeight > this.screenHeight * 0.5) {
          this.contentHeight = Math.min(
            this.maxContentHeight, 
            Math.ceil(this.contentHeight / (this.screenHeight * 0.25)) * (this.screenHeight * 0.25)
          )
        }
      }
    },
    
    // 重置滚动位置
    resetScrollPosition(currentScrollTop, deltaY) {
      // 减少滚动量，保持相对位置
      const newScrollTop = Math.max(0, currentScrollTop + deltaY / LAYOUT_CONFIG.SCROLL_HEIGHT_RATIO)
      
      setTimeout(() => {
        uni.pageScrollTo({
          scrollTop: newScrollTop,
          duration: 0
        })
      }, 0)
    },
    
    // 暂时锁定滚动
    lockScrollTemporarily() {
      this.isScrollLocked = true
      setTimeout(() => {
        this.isScrollLocked = false
      }, LAYOUT_CONFIG.SCROLL_LOCK_DURATION)
    },
    
    // 处理分类切换
    handleCategoryChange(categoryId) {
      this.activeCategory = categoryId
      // 这里可以添加分类切换后的逻辑，如加载对应分类的数据等
    },
    
    // 搜索输入处理
    onSearchInput(e) {
      const searchText = e.detail.value
      // 处理搜索逻辑
    },
    
    // 加载更多内容
    loadMoreItems() {
      if (this.isLoading) return
      
      this.isLoading = true
      
      // 这里可以添加分页加载MongoDB数据的逻辑
      // 示例中使用随机数据模拟
      setTimeout(() => {
        // 为两列各添加5个新卡片
        const newLeftItems = this.generateRandomHeightsArray(5)
        const newRightItems = this.generateRandomHeightsArray(5)
        
        this.leftColumnHeights = [...this.leftColumnHeights, ...newLeftItems]
        this.rightColumnHeights = [...this.rightColumnHeights, ...newRightItems]
        
        this.isLoading = false
      }, 500)
    },
    
    // 获取卡片数据
    getCardData(columnType, index) {
      if (columnType === 'left' && this.leftColumnData[index]) {
        return this.leftColumnData[index]
      } else if (columnType === 'right' && this.rightColumnData[index]) {
        return this.rightColumnData[index]
      }
      return null
    }
  }
}
</script>

<style>
/* 全局样式 */
.container {
  position: relative;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background-color: #f0f0f0;
}
</style>
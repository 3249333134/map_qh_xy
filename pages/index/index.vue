<template>
  <view class="container">
    <!-- 地图区域 -->    
    <map class="map" 
      :style="{ height: mapHeight + 'px' }" 
      :latitude="mapConfig.latitude" 
      :longitude="mapConfig.longitude" 
      :markers="mapConfig.markers">
    </map>
    
    <!-- 可滑动区域 -->
    <view class="content-area" :style="{ height: contentHeight + 'px' }">
      <!-- 拖动条和搜索框 -->
      <view class="fixed-content"
            @touchstart.stop="handleDragStart"
            @touchmove.stop="handleDrag"
            @touchend.stop="handleDragEnd">
        <view class="drag-handle">
          <view class="drag-bar"></view>
        </view>
        
        <!-- 搜索框 -->
        <view class="search-box">
          <view class="search-input">
            <text class="iconfont icon-search"></text>
            <input type="text" placeholder="搜索目的地、景点、攻略" @input="onSearchInput" />
          </view>
        </view>
        
        <!-- 分类标签 -->
        <scroll-view v-if="showCategoryTabs" class="category-tabs" scroll-x>
          <text 
            v-for="category in categories" 
            :key="category.id"
            :class="['tab', { active: category.id === activeCategory }]"
            @tap="handleCategoryChange(category.id)">
            {{ category.name }}
          </text>
        </scroll-view>
      </view>
      
      <!-- 瀑布流卡片列表 -->
      <scroll-view 
        v-if="showWaterfall"
        class="waterfall-container" 
        :style="{ height: waterfallHeight + 'px' }"
        scroll-y
        @scroll="handleWaterfallScroll"
        @scrolltolower="loadMoreItems">
        <view class="waterfall">
          <view class="waterfall-column">
            <view 
              v-for="(height, index) in leftColumnHeights" 
              :key="'left' + index"
              class="card"
              :style="{ '--card-height': height + 'rpx' }">
              <!-- 卡片内容 -->
              <view class="card-media"></view>
              <view class="card-content">
                <view class="card-title"></view>
                <view class="card-author"></view>
                <view class="card-footer">
                  <view class="card-stats"></view>
                  <view class="card-location"></view>
                </view>
              </view>
            </view>
          </view>
          <view class="waterfall-column">
            <view 
              v-for="(height, index) in rightColumnHeights" 
              :key="'right' + index"
              class="card"
              :style="{ '--card-height': height + 'rpx' }">
              <!-- 卡片内容 -->
              <view class="card-media"></view>
              <view class="card-content">
                <view class="card-title"></view>
                <view class="card-author"></view>
                <view class="card-footer">
                  <view class="card-stats"></view>
                  <view class="card-location"></view>
                </view>
              </view>
            </view>
          </view>
        </view>
        <view v-if="isLoading" class="loading">加载中...</view>
      </scroll-view>
    </view>
  </view>
</template>

<script>
// 导入工具函数和常量
import { LAYOUT_CONFIG } from './constants/layoutConfig.js'

export default {
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
      isLoading: false
    }
  },
  
  computed: {
    // 计算地图高度
    mapHeight() {
      return this.screenHeight - this.contentHeight
    },
    
    // 计算瀑布流容器高度
    waterfallHeight() {
      return this.contentHeight - this.searchBoxHeight - (this.showCategoryTabs ? 80 : 0)
    },
    
    // 是否显示分类标签
    showCategoryTabs() {
      return this.contentHeight > this.minContentHeight
    },
    
    // 是否显示瀑布流
    showWaterfall() {
      return this.contentHeight > this.minContentHeight
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
    this.generateRandomHeights()
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
      
      // 模拟异步加载
      setTimeout(() => {
        // 为两列各添加5个新卡片
        const newLeftItems = this.generateRandomHeightsArray(5)
        const newRightItems = this.generateRandomHeightsArray(5)
        
        this.leftColumnHeights = [...this.leftColumnHeights, ...newLeftItems]
        this.rightColumnHeights = [...this.rightColumnHeights, ...newRightItems]
        
        this.isLoading = false
      }, 500)
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

/* 地图样式 */
.map {
  width: 100%;
  transition: height 0.3s ease;
}

/* 内容区域样式 */
.content-area {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background-color: #f0f0f0;
  border-radius: 20px 20px 0 0;
  transition: height 0.3s ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
  box-shadow: 0 -3px 10px rgba(0,0,0,0.1);
}

/* 固定内容区域 */
.fixed-content {
  background-color: #fff;
  z-index: 10;
  border-radius: 20px 20px 0 0;
}

/* 拖动条样式 */
.drag-handle {
  height: 40rpx;
  display: flex;
  justify-content: center;
  align-items: center;
}

.drag-bar {
  width: 60rpx;
  height: 6rpx;
  background: #ddd;
  border-radius: 3rpx;
}

/* 搜索框样式 */
.search-box {
  padding: 20rpx;
}

.search-input {
  background-color: #f5f5f5;
  border-radius: 30rpx;
  padding: 15rpx 30rpx;
  display: flex;
  align-items: center;
}

.iconfont.icon-search {
  margin-right: 10rpx;
  font-size: 28rpx;
  color: #999;
}

.search-input input {
  flex: 1;
  height: 40rpx;
  font-size: 28rpx;
  color: #333;
  width: 100%;
}

/* 分类标签样式 */
.category-tabs {
  white-space: nowrap;
  padding: 0 20rpx 20rpx;
  transition: opacity 0.3s ease;
}

.tab {
  display: inline-block;
  padding: 10rpx 30rpx;
  margin-right: 20rpx;
  border-radius: 30rpx;
  background-color: #f5f5f5;
  font-size: 28rpx;
}

.tab.active {
  background-color: #ffcc00;
  color: #fff;
}

/* 瀑布流样式 */
.waterfall-container {
  flex: 1;
  overflow-y: scroll;
  -webkit-overflow-scrolling: touch;
  transition: opacity 0.3s ease;
  background-color: #f0f0f0;
}

.waterfall {
  padding: 20rpx;
  padding-bottom: 100rpx;
  display: flex;
  justify-content: space-between;
  background-color: #f0f0f0;
}

.waterfall-column {
  width: 48%;
  display: flex;
  flex-direction: column;
}

/* 卡片样式 */
.card {
  margin-bottom: 20rpx;
  border-radius: 12rpx;
  background-color: #fff;
  overflow: hidden;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.1);
}

.card-media {
  background-color: #a0c4ff;
  height: var(--card-height, 200rpx);
  width: 100%;
}

.card-content {
  padding: 16rpx;
}

.card-title {
  height: 40rpx;
  background-color: #ffadad;
  margin-bottom: 12rpx;
  border-radius: 4rpx;
}

.card-author {
  height: 30rpx;
  background-color: #caffbf;
  margin-bottom: 12rpx;
  border-radius: 4rpx;
  width: 60%;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-stats {
  height: 30rpx;
  width: 40%;
  background-color: #d3d3d3;
  border-radius: 4rpx;
}

.card-location {
  height: 30rpx;
  width: 30%;
  background-color: #fdffb6;
  border-radius: 4rpx;
}

.loading {
  text-align: center;
  padding: 20rpx 0;
  color: #999;
  font-size: 24rpx;
}
</style>
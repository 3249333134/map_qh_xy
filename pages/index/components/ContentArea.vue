<template>
  <view class="content-area" :style="{ height: height + 'px' }">
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
          <card-item 
            v-for="(height, index) in leftColumnHeights" 
            :key="'left' + index"
            :height="height"
            column-type="left"
            :index="index"
            :card-data="getCardData('left', index)"
          />
        </view>
        <view class="waterfall-column">
          <card-item 
            v-for="(height, index) in rightColumnHeights" 
            :key="'right' + index"
            :height="height"
            column-type="right"
            :index="index"
            :card-data="getCardData('right', index)"
          />
        </view>
      </view>
      <view v-if="isLoading" class="loading">加载中...</view>
    </scroll-view>
  </view>
</template>

<script>
import CardItem from './CardItem.vue'

export default {
  name: 'ContentArea',
  components: {
    CardItem
  },
  props: {
    height: {
      type: Number,
      required: true
    },
    searchBoxHeight: {
      type: Number,
      required: true
    },
    minContentHeight: {
      type: Number,
      required: true
    },
    categories: {
      type: Array,
      required: true
    },
    activeCategory: {
      type: String,
      required: true
    },
    leftColumnHeights: {
      type: Array,
      required: true
    },
    rightColumnHeights: {
      type: Array,
      required: true
    },
    // 添加这两个 props 来接收数据
    leftColumnData: {
      type: Array,
      default: () => []
    },
    rightColumnData: {
      type: Array,
      default: () => []
    },
    isLoading: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    // 计算瀑布流容器高度
    waterfallHeight() {
      return this.height - this.searchBoxHeight - (this.showCategoryTabs ? 80 : 0)
    },
    
    // 是否显示分类标签
    showCategoryTabs() {
      return this.height > this.minContentHeight
    },
    
    // 是否显示瀑布流
    showWaterfall() {
      return this.height > this.minContentHeight
    }
  },
  methods: {
    // 处理拖拽开始
    handleDragStart(e) {
      this.$emit('drag-start', e)
    },
    
    // 处理拖拽中
    handleDrag(e) {
      this.$emit('drag', e)
    },
    
    // 处理拖拽结束
    handleDragEnd(e) {
      this.$emit('drag-end', e)
    },
    
    // 处理瀑布流滚动
    handleWaterfallScroll(e) {
      this.$emit('waterfall-scroll', e)
    },
    
    // 处理分类切换
    handleCategoryChange(categoryId) {
      this.$emit('category-change', categoryId)
    },
    
    // 搜索输入处理
    onSearchInput(e) {
      this.$emit('search-input', e)
    },
    
    // 加载更多内容
    loadMoreItems() {
      this.$emit('load-more')
    },
    
    // 获取卡片数据
    // 在 ContentArea.vue 中修改 props
    props: {
      // ... 其他 props
      leftColumnData: {
        type: Array,
        required: true
      },
      rightColumnData: {
        type: Array,
        required: true
      }
    },
    
    // 修改 getCardData 方法
    // 删除 inject: ['getCardData'] 行
    
    // getCardData 方法保持不变
    getCardData(columnType, index) {
      if (columnType === 'left' && this.leftColumnData && this.leftColumnData[index]) {
        return this.leftColumnData[index]
      } else if (columnType === 'right' && this.rightColumnData && this.rightColumnData[index]) {
        return this.rightColumnData[index]
      }
      return null
    }
  }
}
</script>

<style>
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

.loading {
  text-align: center;
  padding: 20rpx 0;
  color: #999;
  font-size: 24rpx;
}
</style>
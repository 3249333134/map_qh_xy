<template>
  <scroll-view 
    class="waterfall-container"
    scroll-y
    @scrolltolower="onLoadMore"
    @scroll="onScroll"
    :scroll-top="scrollTop"
    :scroll-with-animation="scrollWithAnimation"
  >
    <view class="cards-grid">
      <!-- 左列卡片 -->
      <view class="cards-column">
        <slot 
          name="item" 
          v-for="(item, index) in leftColumnData" 
          :key="'left-' + (item._id || '') + '-' + index"
          :item="item"
          :index="index"
          :column="'left'"
          :height="getColumnItemHeight('left', index)"
        ></slot>
      </view>
      
      <!-- 右列卡片 -->
      <view class="cards-column">
        <slot 
          name="item" 
          v-for="(item, index) in rightColumnData" 
          :key="'right-' + (item._id || '') + '-' + index"
          :item="item"
          :index="leftColumnData.length + index"
          :column="'right'"
          :height="getColumnItemHeight('right', index)"
        ></slot>
      </view>
    </view>
    
    <!-- 加载更多 -->
    <view class="loading-more" v-if="isLoading">
      <text>加载中...</text>
    </view>
    
    <!-- 加载完成提示 -->
    <view class="loading-done" v-if="!hasMoreData && data.length > 0">
      <text>已加载全部内容</text>
    </view>
  </scroll-view>
</template>

<script>
export default {
  name: 'WaterfallLayout',
  props: {
    data: {
      type: Array,
      required: true
    },
    isLoading: {
      type: Boolean,
      default: false
    },
    hasMoreData: {
      type: Boolean,
      default: true
    },
    scrollTop: {
      type: Number,
      default: 0
    },
    scrollWithAnimation: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      leftColumnHeights: {},
      rightColumnHeights: {}
    }
  },
  computed: {
    leftColumnData() {
      return this.data.filter((_, index) => index % 2 === 0)
    },
    rightColumnData() {
      return this.data.filter((_, index) => index % 2 === 1)
    }
  },
  methods: {
    getColumnItemHeight(column, index) {
      const heights = column === 'left' ? this.leftColumnHeights : this.rightColumnHeights
      return heights[index] || 200
    },
    onLoadMore() {
      this.$emit('load-more')
    },
    onScroll(e) {
      this.$emit('scroll', e)
    }
  }
}
</script>

<style scoped>
.waterfall-container {
  height: 100%;
}

.cards-grid {
  display: flex;
  padding: 20rpx;
  gap: 20rpx;
}

.cards-column {
  flex: 1;
}

.loading-more,
.loading-done {
  text-align: center;
  padding: 40rpx;
  color: #999;
  font-size: 28rpx;
}
</style>
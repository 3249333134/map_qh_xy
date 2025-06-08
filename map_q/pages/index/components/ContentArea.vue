<template>
  <view 
    class="content-area" 
    :style="{ height: height + 'px', bottom: 0 }"
  >
    <!-- 拖动区域（包含拖动条和搜索框） -->
    <view 
      class="drag-area"
      @touchstart="onDragStart"
      @touchmove="onDrag"
      @touchend="onDragEnd"
    >
      <!-- 拖动条 -->
      <view class="drag-handle">
        <view class="drag-indicator"></view>
      </view>
      
      <!-- 搜索框 -->
      <view class="search-box">
        <view class="search-input-wrapper">
          <text class="search-icon">🔍</text>
          <input 
            class="search-input" 
            placeholder="搜索" 
            confirm-type="search"
            @input="onSearchInput"
          />
        </view>
      </view>
    </view>
    
    <!-- 分类选项卡 -->
    <scroll-view 
      class="category-tabs" 
      scroll-x 
      show-scrollbar="false"
    >
      <view 
        v-for="category in categories" 
        :key="category.id"
        :class="['category-tab', { active: category.id === activeCategory }]"
        @tap="onCategoryChange(category.id)"
      >
        {{ category.name }}
      </view>
    </scroll-view>
    
    <!-- 卡片内容区 -->
    <scroll-view 
      class="cards-container"
      scroll-y
      @scrolltolower="onLoadMore"
      @scroll="onScroll"
      :scroll-top="scrollTop"
      :scroll-with-animation="true"
    >
      <view class="cards-grid">
        <!-- 左列卡片 -->
        <view class="cards-column">
          <card-item 
            v-for="(item, index) in leftColumnData" 
            :key="'left-' + (item._id || '') + '-' + index"
            :index="index"
            :card-data="item"
            :height="getColumnItemHeight('left', index)"
            column-type="left"
            @card-tap="onCardTap"
          />
        </view>
        
        <!-- 右列卡片 -->
        <view class="cards-column">
          <card-item 
            v-for="(item, index) in rightColumnData" 
            :key="'right-' + (item._id || '') + '-' + index"
            :index="leftColumnData.length + index"
            :card-data="item"
            :height="getColumnItemHeight('right', index)"
            column-type="right"
            @card-tap="onCardTap"
          />
        </view>
      </view>
      
      <!-- 加载更多 -->
      <view class="loading-more" v-if="isLoading">
        <text>加载中...</text>
      </view>
      
      <!-- 加载完成提示 -->
      <view class="loading-done" v-if="!hasMoreData && mapData.length > 0">
        <text>已加载全部内容</text>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import CardItem from './CardItem.vue'

export default {
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
    mapData: {
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
    }
  },
  data() {
    return {
      leftColumnHeights: {},
      rightColumnHeights: {},
      scrollTop: 0,
      isScrollLocked: false,
      // 为每个分类保存滚动位置
      categoryScrollPositions: {}
    }
  },
  watch: {
    // 监听数据变化，更新卡片高度缓存
    mapData: {
      handler(newData, oldData) {
        this.$nextTick(() => {
          // 只为新卡片生成高度
          this.generateHeightsForNewItems(newData, oldData)
        })
      },
      deep: true
    },
    // 监听分类变化，恢复该分类的滚动位置
    activeCategory(newCategory, oldCategory) {
      // 保存上一个分类的滚动位置
      if (oldCategory) {
        this.categoryScrollPositions[oldCategory] = this.getCurrentScrollPosition()
      }
      
      // 延迟执行，确保DOM已更新
      this.$nextTick(() => {
        // 恢复当前分类的滚动位置，如果没有则设为0
        this.scrollTop = this.categoryScrollPositions[newCategory] || 0
      })
    }
  },
  methods: {
    // 获取当前滚动位置
    getCurrentScrollPosition() {
      // 获取scroll-view的滚动位置
      return this.scrollTop
    },
    
    // 分类切换事件
    onCategoryChange(categoryId) {
      // 保存当前分类的滚动位置
      this.categoryScrollPositions[this.activeCategory] = this.getCurrentScrollPosition()
      
      // 触发分类切换事件
      this.$emit('category-change', categoryId)
    },
    
    // 拖拽事件处理
    onDragStart(e) {
      this.$emit('drag-start', e)
    },
    onDrag(e) {
      this.$emit('drag', e)
    },
    onDragEnd(e) {
      this.$emit('drag-end', e)
    },
    
    // 分类切换事件
    onCategoryChange(categoryId) {
      this.$emit('category-change', categoryId)
    },
    
    // 搜索输入事件
    onSearchInput(e) {
      this.$emit('search-input', e)
    },
    
    // 加载更多事件
    onLoadMore() {
      if (!this.isLoading && !this.isScrollLocked && this.hasMoreData) {
        this.$emit('load-more')
        // 锁定滚动，防止重复触发，但缩短锁定时间
        this.lockScroll()
      }
    },
    
    // 临时锁定滚动，防止重复加载
    lockScroll() {
      this.isScrollLocked = true
      setTimeout(() => {
        this.isScrollLocked = false
      }, 500) // 将锁定时间从1000毫秒减少到500毫秒，提高响应速度
    },
    
    // 卡片点击事件
    onCardTap(index) {
      this.$emit('card-tap', index)
    },
    
    // 为新卡片生成高度
    generateHeightsForNewItems(newData, oldData) {
      // 确保数据存在
      if (!this.mapData) return;
      
      const oldLength = oldData ? oldData.length : 0;
      const newLength = newData ? newData.length : 0;
      
      // 只为新增的卡片生成高度
      if (newLength > oldLength) {
        // 为左列新卡片生成高度
        if (this.leftColumnData && this.leftColumnData.length > 0) {
          this.leftColumnData.forEach((item, index) => {
            const dataIndex = index * 2;
            if (dataIndex >= oldLength && !this.leftColumnHeights[item._id]) {
              this.leftColumnHeights[item._id] = this.getRandomHeight();
            }
          });
        }
        
        // 为右列新卡片生成高度
        if (this.rightColumnData && this.rightColumnData.length > 0) {
          this.rightColumnData.forEach((item, index) => {
            const dataIndex = index * 2 + 1;
            if (dataIndex >= oldLength && !this.rightColumnHeights[item._id]) {
              this.rightColumnHeights[item._id] = this.getRandomHeight();
            }
          });
        }
      } else if (oldLength === 0 || newLength === 0) {
        // 如果是全新数据或清空数据，重置高度缓存
        this.leftColumnHeights = {};
        this.rightColumnHeights = {};
        
        // 为所有卡片生成高度
        if (this.leftColumnData && this.leftColumnData.length > 0) {
          this.leftColumnData.forEach((item) => {
            this.leftColumnHeights[item._id] = this.getRandomHeight();
          });
        }
        
        if (this.rightColumnData && this.rightColumnData.length > 0) {
          this.rightColumnData.forEach((item) => {
            this.rightColumnHeights[item._id] = this.getRandomHeight();
          });
        }
      }
    },
    
    // 获取指定列和索引的卡片高度
    getColumnItemHeight(column, index) {
      const item = column === 'left' ? this.leftColumnData[index] : this.rightColumnData[index]
      if (!item) return 200
      
      const itemId = item._id
      if (column === 'left') {
        if (!this.leftColumnHeights[itemId]) {
          this.leftColumnHeights[itemId] = this.getRandomHeight()
        }
        return this.leftColumnHeights[itemId]
      } else {
        if (!this.rightColumnHeights[itemId]) {
          this.rightColumnHeights[itemId] = this.getRandomHeight()
        }
        return this.rightColumnHeights[itemId]
      }
    },
    
    // 生成随机高度
    getRandomHeight() {
      // 生成180-280之间的随机高度
      return Math.floor(Math.random() * (280 - 180 + 1)) + 180
    }
  },
  computed: {
    // 将数据分为左右两列
    leftColumnData() {
      return this.mapData ? this.mapData.filter((_, index) => index % 2 === 0) : [];
    },
    rightColumnData() {
      return this.mapData ? this.mapData.filter((_, index) => index % 2 === 1) : [];
    }
  },
}
</script>

<style>
.content-area {
  position: absolute;
  left: 0;
  width: 100%;
  z-index: 10;
  background-color: #f8f8f8;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  overflow: hidden;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.drag-area {
  padding: 10px 15px;
}

.drag-handle {
  display: flex;
  justify-content: center;
  padding: 5px 0;
}

.drag-indicator {
  width: 40px;
  height: 5px;
  background-color: #ddd;
  border-radius: 3px;
}

.search-box {
  margin-top: 5px;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  background-color: #fff;
  border-radius: 20px;
  padding: 0 15px;
  height: 40px;
}

.search-icon {
  margin-right: 10px;
  font-size: 16px;
  color: #999;
}

.search-input {
  flex: 1;
  height: 40px;
  font-size: 14px;
}

.category-tabs {
  display: flex;
  white-space: nowrap;
  padding: 10px 15px;
  border-bottom: 1px solid #eee;
}

.category-tab {
  display: inline-block;
  padding: 8px 15px;
  margin-right: 10px;
  font-size: 14px;
  border-radius: 20px;
  background-color: #f0f0f0;
  color: #666;
}

.category-tab.active {
  background-color: #2196F3;
  color: #fff;
}

.cards-container {
  flex: 1;
  height: calc(100% - 120px);
  overflow: hidden;
}

/* 瀑布流网格布局 */
.cards-grid {
  display: flex;
  padding: 10px;
  width: 100%;
  box-sizing: border-box;
}

.cards-column {
  flex: 0 0 50%; /* 修改为固定宽度 */
  padding: 0 5px;
  width: 50%; /* 确保每列宽度为50% */
  box-sizing: border-box;
}

/* 加载更多样式 */
.loading-more {
  text-align: center;
  padding: 15px 0;
  color: #666;
}

/* 加载完成提示 */
.loading-done {
  text-align: center;
  padding: 15px 0;
  color: #999;
  font-size: 12px;
}
</style>
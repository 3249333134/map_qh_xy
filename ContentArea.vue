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
            :key="'left-' + index"
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
            :key="'right-' + index"
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
      categoryScrollPositions: {} // 新增：保存每个分类的滚动位置
    }
  },
  computed: {
    // 将数据分为左右两列
    leftColumnData() {
      return this.mapData.filter((_, index) => index % 2 === 0)
    },
    rightColumnData() {
      return this.mapData.filter((_, index) => index % 2 === 1)
    }
  },
  watch: {
    // 监听数据变化，更新卡片高度缓存
    mapData: {
      handler() {
        this.$nextTick(() => {
          // 只为新卡片生成高度
          this.generateHeightsForNewItems();
        });
      },
      deep: true
    },
    // 监听分类变化，恢复滚动位置
    activeCategory(newCategory, oldCategory) {
      // 保存旧分类的滚动位置
      if (oldCategory) {
        this.categoryScrollPositions[oldCategory] = this.getCurrentScrollPosition();
      }
      
      // 在下一个渲染周期恢复新分类的滚动位置
      this.$nextTick(() => {
        // 如果有保存的滚动位置，则恢复
        if (this.categoryScrollPositions[newCategory] !== undefined) {
          this.scrollTop = this.categoryScrollPositions[newCategory];
        } else {
          // 否则滚动到顶部
          this.scrollTop = 0;
        }
      });
    }
  },
  methods: {
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
      // 保存当前分类的滚动位置
      if (this.activeCategory) {
        this.categoryScrollPositions[this.activeCategory] = this.getCurrentScrollPosition();
      }
      
      // 重置高度缓存
      this.leftColumnHeights = {};
      this.rightColumnHeights = {};
      
      // 触发分类切换事件
      this.$emit('category-change', categoryId);
      
      // 在下一个渲染周期恢复新分类的滚动位置
      this.$nextTick(() => {
        // 如果有保存的滚动位置，则恢复
        if (this.categoryScrollPositions[categoryId] !== undefined) {
          this.scrollTop = this.categoryScrollPositions[categoryId];
        } else {
          // 否则滚动到顶部
          this.scrollTop = 0;
        }
      });
    },
    
    // 搜索输入事件
    onSearchInput(e) {
      this.$emit('search-input', e)
    },
    
    // 滚动事件处理
    onScroll(e) {
      // 保存当前分类的滚动位置
      if (this.activeCategory) {
        this.categoryScrollPositions[this.activeCategory] = e.detail.scrollTop;
      }
    },
    
    // 加载更多事件
    onLoadMore() {
      if (!this.isLoading && !this.isScrollLocked) {
        this.$emit('load-more')
        // 锁定滚动，防止重复触发
        this.lockScroll()
      }
    },
    
    // 临时锁定滚动，防止重复加载
    lockScroll() {
      this.isScrollLocked = true
      setTimeout(() => {
        this.isScrollLocked = false
      }, 1000) // 1秒后解锁
    },
    
    // 卡片点击事件
    onCardTap(index) {
      this.$emit('card-tap', index)
    },
    
    // 为新卡片生成高度
    generateHeightsForNewItems() {
      // 添加安全检查，确保 leftColumnData 和 rightColumnData 存在
      if (this.leftColumnData && this.leftColumnData.length > 0) {
        // 为左列新卡片生成高度
        this.leftColumnData.forEach((_, index) => {
          if (!this.leftColumnHeights[index]) {
            this.leftColumnHeights[index] = this.getRandomHeight()
          }
        })
      }
      
      if (this.rightColumnData && this.rightColumnData.length > 0) {
        // 为右列新卡片生成高度
        this.rightColumnData.forEach((_, index) => {
          if (!this.rightColumnHeights[index]) {
            this.rightColumnHeights[index] = this.getRandomHeight()
          }
        })
      }
    },
    
    // 获取指定列和索引的卡片高度
    getColumnItemHeight(column, index) {
      if (column === 'left') {
        return this.leftColumnHeights[index] || this.getRandomHeight()
      } else {
        return this.rightColumnHeights[index] || this.getRandomHeight()
      }
    },
    
    // 生成随机高度
    getRandomHeight() {
      // 生成180-280之间的随机高度
      return Math.floor(Math.random() * (280 - 180 + 1)) + 180
    },
    
    // 获取当前滚动位置
    getCurrentScrollPosition() {
      // 获取滚动视图元素
      const scrollView = this.$el.querySelector('.cards-container');
      if (scrollView) {
        return scrollView.scrollTop;
      }
      return 0;
    },
  }
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
}

.cards-column {
  flex: 1;
  padding: 0 5px;
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
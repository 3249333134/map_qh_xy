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
      :scroll-with-animation="scrollWithAnimation"
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
            @media-tap="onMediaTap"
            @content-tap="onContentTap"
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
            @media-tap="onMediaTap"
            @content-tap="onContentTap"
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
import CardItem from '../card/CardItem.vue'

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
  // 在 data 中初始化为 false
  data() {
    return {
      leftColumnHeights: {},
      rightColumnHeights: {},
      scrollTop: 0,
      isScrollLocked: false,
      // 为每个分类保存滚动位置
      categoryScrollPositions: {},
      scrollWithAnimation: true,
      // 添加一个对象来跟踪哪些分类已经被访问过
      visitedCategories: {},
      // 添加加载更多的防抖定时器
      loadMoreTimer: null
    }
  },
  created() {
    // 假设默认分类是'all'，将其标记为已访问
    this.visitedCategories['all'] = true;
    this.categoryScrollPositions['all'] = 0; // 确保'all'分类初始在顶部
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
    activeCategory(newCategory, oldCategory) { // 添加 oldCategory 参数
      // 1. 保存旧分类的滚动位置 (如果需要更精确，可以在 onScroll 中实时保存)
      //    在 onScroll 中已经有了: this.categoryScrollPositions[this.activeCategory] = scrollTop;
      //    所以这里可以不重复保存，或者作为一种补充
      // if (oldCategory) {
      //   this.categoryScrollPositions[oldCategory] = this.scrollTop; // 保存的是切换前的scrollTop
      // }

      this.scrollWithAnimation = false;
      this.$nextTick(() => {
        if (!this.visitedCategories[newCategory]) {
          // 首次访问新分类
          this.scrollTop = 0;
          this.visitedCategories[newCategory] = true;
          // 可选: 同时将此新分类的初始滚动位置记录为0
          this.categoryScrollPositions[newCategory] = 0; 
        } else {
          // 非首次访问，恢复保存的滚动位置
          this.scrollTop = this.categoryScrollPositions[newCategory] || 0;
        }
        
        setTimeout(() => {
          this.scrollWithAnimation = true;
        }, 50); // 稍微缩短延迟，看是否改善体验
      });
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
      // 使用当前实际滚动位置，而不是 this.scrollTop
      const currentScrollView = uni.createSelectorQuery().in(this).select('.cards-container');
      currentScrollView.scrollOffset(data => {
        // 保存当前分类的实际滚动位置
        this.categoryScrollPositions[this.activeCategory] = data.scrollTop;
        
        // 触发分类切换事件前检查是否是首次访问新分类
        if (!this.visitedCategories[categoryId]) {
          // 如果是首次访问，不使用当前的滚动位置
          this.visitedCategories[categoryId] = true;
        }
        
        // 触发分类切换事件
        this.$emit('category-change', categoryId);
      }).exec();
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
    
    // 搜索输入事件
    onSearchInput(e) {
      this.$emit('search-input', e)
    },
    
    // 加载更多事件
    // 优化加载更多事件
    onLoadMore() {
    // 只检查是否正在加载和是否有更多数据
    if (!this.isLoading && this.hasMoreData) {
    // 添加防抖，避免频繁触发
    if (this.loadMoreTimer) {
    clearTimeout(this.loadMoreTimer);
    }
    
    this.loadMoreTimer = setTimeout(() => {
    console.log('触发加载更多事件');
    this.$emit('load-more');
    }, 300);
    }
    },
    
    // 上方媒体区域点击：进入详情页并定位
    onMediaTap(data) {
      this.$emit('media-tap', data)
    },
    
    // 下方内容区域点击：只定位到地图
    onContentTap(data) {
      this.$emit('content-tap', data)
    },
    
    // 卡片点击事件（保留兼容性）
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
    },
    
    // 滚动事件处理
    onScroll(e) {
      // 获取当前滚动位置
      const scrollTop = e.detail.scrollTop;
      // 实时保存当前激活分类的滚动位置
      if (this.activeCategory) { // 确保 activeCategory 有值
        this.categoryScrollPositions[this.activeCategory] = scrollTop;
      }
      
      // 检测可视区域内的卡片
      this.checkVisibleCards(scrollTop);
      // 注意：这里不要直接设置 this.scrollTop = scrollTop;
      // scrollTop 的变化应该由 watch.activeCategory 控制，以避免冲突
    },
    
    // 检测可视区域内的卡片
    checkVisibleCards(scrollTop) {
      // 获取可视区域的高度
      const visibleHeight = this.height - this.searchBoxHeight - 50; // 减去搜索框和分类选项卡的高度
      const visibleBottom = scrollTop + visibleHeight;
      
      // 创建一个数组来存储可视区域内的卡片索引
      const visibleCardIndices = [];
      
      // 检查左列卡片
      let currentTop = 0;
      this.leftColumnData.forEach((item, index) => {
        const cardHeight = this.getColumnItemHeight('left', index);
        const cardBottom = currentTop + cardHeight;
        
        // 如果卡片在可视区域内
        if ((currentTop >= scrollTop && currentTop <= visibleBottom) || 
            (cardBottom >= scrollTop && cardBottom <= visibleBottom) ||
            (currentTop <= scrollTop && cardBottom >= visibleBottom)) {
          visibleCardIndices.push(index * 2); // 左列卡片在原始数据中的索引是 index * 2
        }
        
        currentTop += cardHeight + 20; // 加上卡片间距
      });
      
      // 检查右列卡片
      currentTop = 0;
      this.rightColumnData.forEach((item, index) => {
        const cardHeight = this.getColumnItemHeight('right', index);
        const cardBottom = currentTop + cardHeight;
        
        // 如果卡片在可视区域内
        if ((currentTop >= scrollTop && currentTop <= visibleBottom) || 
            (cardBottom >= scrollTop && cardBottom <= visibleBottom) ||
            (currentTop <= scrollTop && cardBottom >= visibleBottom)) {
          visibleCardIndices.push(index * 2 + 1); // 右列卡片在原始数据中的索引是 index * 2 + 1
        }
        
        currentTop += cardHeight + 20; // 加上卡片间距
      });
      
      // 触发事件，通知父组件更新地图标记点
      this.$emit('visible-cards-change', visibleCardIndices);
    },
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
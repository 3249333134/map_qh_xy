<template>
  <view 
    class="content-area" 
    :class="{ collapsed: isCollapsed, 'has-overlay': !!selectedPoint }"
    :style="{ height: height + 'px', bottom: (bottomOffset || 0) + 'px' }"
  >
    <!-- 拖动区域（包含拖动条和搜索框） -->
    <drag-search-bar
      :is-collapsed="isCollapsed"
      :collapsed-search-style="collapsedSearchStyle"
      :category-action-expanded="categoryActionExpanded"
      :collapsed-search-width="collapsedSearchWidth"
      :collapsed-gap="collapsedGap"
      :selected-point="selectedPoint"
      @drag-start="onDragStart"
      @drag="onDrag"
      @drag-end="onDragEnd"
      @search-input="onSearchInput"
      @search-focus="onSearchFocus"
      @search-tap="onSearchTap"
      @right-action-tap="onRightActionTap"
    />
    
    <!-- 分类选项卡（右侧按钮固定，可展开覆盖除“全部”外的区域） -->
    <category-tabs-bar
      v-if="!isCollapsed"
      :categories="categories"
      :active-category="activeCategory"
      :category-action-expanded="categoryActionExpanded"
      :expanded-left="expandedLeft"
      :selected-point="selectedPoint"
      @drag-start="onDragStart"
      @drag="onDrag"
      @drag-end="onDragEnd"
      @category-change="onCategoryChange"
      @right-action-tap="onRightActionTap"
    />

    <view v-if="selectedPoint" class="point-detail-overlay" :style="{ top: topAreaHeight + 'px' }">
      <point-detail :point="selectedPoint.point" :marker="selectedPoint.marker" @close="onPointDetailClose" @navigate="onPointNavigate" />
    </view>
    
    <!-- 卡片内容区 -->
    <cards-container
      v-if="!isCollapsed && !selectedPoint"
      :scroll-top="scrollTop"
      :scroll-with-animation="scrollWithAnimation"
      :cards-container-height="cardsContainerHeight"
      :is-loading="isLoading"
      :has-more-data="hasMoreData"
      :left-column-data="leftColumnData"
      :right-column-data="rightColumnData"
      :use-service-card="useServiceCard"
      :get-column-item-height="getColumnItemHeight"
      @load-more="onLoadMore"
      @scroll="onScroll"
      @media-tap="onMediaTap"
      @content-tap="onContentTap"
      @reserve="onReserve"
    />
  </view>
</template>

<script>
import PointDetail from '../detail/PointDetail.vue'
import DragSearchBar from './DragSearchBar.vue'
import CategoryTabsBar from './CategoryTabsBar.vue'
import CardsContainer from './CardsContainer.vue'

export default {
  components: {
    PointDetail,
    DragSearchBar,
    CategoryTabsBar,
    CardsContainer
  },
  props: {
    height: {
      type: Number,
      required: true
    },
    bottomOffset: {
      type: Number,
      default: 0
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
    },
    // 新增：控制使用哪种卡片组件（服务页传递 "ServiceCardItem"）
    cardComponent: {
      type: String,
      default: ''
    },
    selectedPoint: {
      type: Object,
      default: null
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
      loadMoreTimer: null,
      // 分类右侧按钮展开态（覆盖除“全部”外的区域）
      categoryActionExpanded: false,
      // 展开时的左起始位置（紧贴“全部”按钮右缘）
      expandedLeft: 0,
      collapsedSearchWidth: 76,
      collapsedGap: 8,
      collapsedButtonWidth: 48,
      userToggledAction: false,
      resetExpandOnExitCollapse: false,
      storageKeyCategoryAction: 'contentArea.categoryActionExpanded',
      // 分类栏近似高度（含上下间距），用于计算内容区高度
      tabsHeightApprox: 50,
      // 顶部区域实际高度（拖动区 + 分类栏），更精确计算内容区高度
      topAreaHeight: 0,
      // 为避免测量误差造成底部细缝，增加少量补偿
      fillCompensation: 10
    }
  },
  mounted() {
    // 挂载后测量分类栏的高度，提高卡片容器高度计算的准确度
    this.$nextTick(() => {
      this.updateTabsHeightApprox()
      this.updateTopAreaHeight()
    })

    try {
      const persisted = uni.getStorageSync(this.storageKeyCategoryAction)
      if (typeof persisted === 'boolean') {
        this.categoryActionExpanded = persisted
        if (persisted) {
          this.$nextTick(() => {
            this.updateExpandedLeft()
          })
        }
      }
    } catch (e) {}
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
    // 组件高度变化时，重新测量顶部区域，避免出现底部空隙
    height() {
      this.$nextTick(() => {
        this.updateTabsHeightApprox()
        this.updateTopAreaHeight()
        if (!this.isCollapsed && this.categoryActionExpanded) {
          this.updateExpandedLeft()
        }
      })
    },
    // 折叠态切换时重新测量顶部区域
    isCollapsed() {
      this.$nextTick(() => {
        this.updateTopAreaHeight()
        if (!this.isCollapsed && this.categoryActionExpanded) {
          this.updateExpandedLeft()
        }
      })
    },
    // 分类按钮展开/收起时也重新测量
    categoryActionExpanded() {
      this.$nextTick(() => {
        this.updateTopAreaHeight()
      })
      try {
        uni.setStorageSync(this.storageKeyCategoryAction, this.categoryActionExpanded)
      } catch (e) {}
      if (!this.categoryActionExpanded && this.selectedPoint) {
        this.$emit('close-point-detail')
      }
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
    },
    // 联动：选中点时自动展开橙红按钮；取消选中时收起
    selectedPoint(newVal) {
      if (newVal) {
        this.categoryActionExpanded = true
        this.$nextTick(() => { this.updateExpandedLeft() })
      } else {
        this.categoryActionExpanded = false
      }
    }
  },
  methods: {
    onLeftOutlineTap() {
      // 左侧线框点击占位：可在此触发筛选或自定义行为
      this.$emit('left-outline-tap')
    },
    onRightActionTap() {
      // 切换展开态，并在展开时计算左起始位置以避开“全部”按钮
      const next = !this.categoryActionExpanded
      this.categoryActionExpanded = next
      if (next) {
        this.$nextTick(() => {
          this.updateExpandedLeft()
        })
      }
      // 仍向父组件透传点击事件（如需外部处理）
      this.userToggledAction = true
      this.$emit('right-action-tap')
      if (!next && this.selectedPoint) {
        this.$emit('close-point-detail')
      }
    },

    // 计算展开时的 left，使覆盖区域从“全部”按钮右侧开始
    updateExpandedLeft() {
      try {
        const q = uni.createSelectorQuery().in(this)
        q.select('.category-tabs-wrap').boundingClientRect()
        q.select('.category-tabs .category-tab').boundingClientRect()
        q.exec(res => {
          const wrapRect = res && res[0]
          const firstTabRect = res && res[1]
          if (wrapRect && firstTabRect) {
            // wrap 的左内边距为 15px，tabs 的水平内边距为 9px
            // 以第一项右缘为基准，再略加 4px 间距
            const left = Math.max(0, (firstTabRect.right - wrapRect.left) + 4)
            this.expandedLeft = left
          }
        })
      } catch (e) {
        // 兜底：如果测量失败，使用一个保守值
        this.expandedLeft = 90
      }
    },
    // 测量分类栏实际高度（含内边距、边框），用于更精确计算内容滚动区的高度
    updateTabsHeightApprox() {
      try {
        const q = uni.createSelectorQuery().in(this)
        q.select('.category-tabs-wrap').boundingClientRect()
        q.exec(res => {
          const wrapRect = res && res[0]
          if (wrapRect && wrapRect.height) {
            // 额外加少量缓冲，避免计算误差造成截断
            this.tabsHeightApprox = Math.round(wrapRect.height + 6)
          }
        })
      } catch (e) {
        this.tabsHeightApprox = 50
      }
    },
    // 测量顶部区域（拖动区 + 分类栏）的实际高度
    updateTopAreaHeight() {
      try {
        const q = uni.createSelectorQuery().in(this)
        q.select('.drag-area').boundingClientRect()
        if (!this.isCollapsed) {
          q.select('.category-tabs-wrap').boundingClientRect()
        }
        q.exec(res => {
          const dragRect = res && res[0]
          const tabsRect = (!this.isCollapsed) ? res && res[1] : null
          const dragH = (dragRect && dragRect.height) ? dragRect.height : 0
          const tabsH = (tabsRect && tabsRect.height) ? tabsRect.height : 0
          this.topAreaHeight = Math.round(dragH + tabsH)
        })
      } catch (e) {
        this.topAreaHeight = 0
      }
    },
    // 获取当前滚动位置
    getCurrentScrollPosition() {
      // 获取scroll-view的滚动位置
      return this.scrollTop
    },
    
    // 分类切换事件
    onCategoryChange(categoryId) {
      const st = this.categoryScrollPositions[this.activeCategory] || 0
      this.categoryScrollPositions[this.activeCategory] = st

      if (!this.visitedCategories[categoryId]) {
        this.visitedCategories[categoryId] = true
      }

      if (categoryId === 'all') {
        this.categoryActionExpanded = false
      }
      this.$emit('category-change', categoryId)
    },
    
    // 拖拽事件处理
    onDragStart(e) {
      const y = (e && (e.touches && e.touches[0] && e.touches[0].clientY))
        || (e && (e.changedTouches && e.changedTouches[0] && e.changedTouches[0].clientY))
        || (e && e.detail && e.detail.clientY)
        || (e && e.clientY)
        || 0
      const ev = {
        clientY: y,
        touches: [{ clientY: y }],
        changedTouches: [{ clientY: y }],
        detail: { clientY: y },
        originalEvent: e
      }
      this.$emit('drag-start', ev)
    },
    onDrag(e) {
      const y = (e && (e.touches && e.touches[0] && e.touches[0].clientY))
        || (e && (e.changedTouches && e.changedTouches[0] && e.changedTouches[0].clientY))
        || (e && e.detail && e.detail.clientY)
        || (e && e.clientY)
        || 0
      const ev = {
        clientY: y,
        touches: [{ clientY: y }],
        changedTouches: [{ clientY: y }],
        detail: { clientY: y },
        originalEvent: e
      }
      this.$emit('drag', ev)
    },
    onDragEnd(e) {
      const y = (e && (e.touches && e.touches[0] && e.touches[0].clientY))
        || (e && (e.changedTouches && e.changedTouches[0] && e.changedTouches[0].clientY))
        || (e && e.detail && e.detail.clientY)
        || (e && e.clientY)
        || 0
      const ev = {
        clientY: y,
        touches: [{ clientY: y }],
        changedTouches: [{ clientY: y }],
        detail: { clientY: y },
        originalEvent: e
      }
      this.$emit('drag-end', ev)
    },
    
    // 搜索输入事件
    onSearchInput(e) {
      this.$emit('search-input', e)
    },
    onSearchFocus(e) {
      this.categoryActionExpanded = false
      this.$emit('search-focus', e)
    },
    onSearchTap() {
      this.categoryActionExpanded = false
      this.$emit('search-tap')
    },
    onPointDetailClose() {
      this.$emit('close-point-detail')
    },
    onPointNavigate() {
      this.$emit('navigate-to-point')
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

    // 新增：预约事件透传（修复 onReserve 未定义）
    onReserve(payload) {
      // payload 形如 { cardData, index }
      this.$emit('reserve', payload)
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
    },
    // 新增：是否使用服务卡片
    useServiceCard() {
      return this.cardComponent === 'ServiceCardItem'
    },
    // 卡片滚动容器的动态高度：总高度 - 顶部区域（测量优先）
    cardsContainerHeight() {
      const H = Number(this.height || 0)
      const searchH = Number(this.searchBoxHeight || 0)
      const tabsApprox = Number(this.tabsHeightApprox || 50)
      const measuredTop = Number(this.topAreaHeight || 0)
      const topUsed = measuredTop > 0 ? measuredTop : (searchH + tabsApprox)
      const val = H - topUsed + Number(this.fillCompensation || 0)
      return val > 0 ? val : 0
    },
    // 折叠态：当容器高度接近最小高度，仅显示搜索框
    isCollapsed() {
      const minH = Number(this.minContentHeight || 0)
      return Number(this.height || 0) <= (minH + 1)
    }
    ,
    collapsedSearchStyle() {
      if (!this.isCollapsed) return {}
      if (this.categoryActionExpanded) {
        return { width: this.collapsedSearchWidth + 'px' }
      } else {
        const w = (this.collapsedButtonWidth || 48) + (this.collapsedGap || 8)
        return { width: `calc(100% - ${w}px)` }
      }
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

/* 折叠态：容器高度自适应，仅包裹搜索区，去掉下方空白 */
.content-area.collapsed {
  height: auto !important;
}

.drag-area {
  padding: 6px 15px; /* 压缩上下内边距，让区域更紧凑 */
}

.drag-handle {
  display: flex;
  justify-content: center;
  padding: 2px 0; /* 缩小拖动条上下留白 */
}

.drag-indicator {
  width: 40px;
  height: 5px;
  background-color: #ddd;
  border-radius: 3px;
}

.search-box {
  margin-top: 2px; /* 减少拖动条与搜索框之间的距离 */
  position: relative; /* 让折叠态的右侧按钮可绝对定位到容器内 */
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  background-color: #fff;
  border-radius: 17px; /* 与分类按钮高度匹配的圆角 */
  padding: 0 15px;
  height: 34px; /* 降低高度以与分类按钮一致 */
}

/* 折叠态：右侧为按钮预留空间，左侧保持原位置 */
.search-input-wrapper.collapsed {
  width: calc(100% - 56px); /* 预留按钮宽48 + 约8px间距 */
  margin: 0; /* 不居中，贴左对齐 */
}

.search-icon {
  margin-right: 10px;
  font-size: 16px;
  color: #999;
}

.search-input {
  flex: 1;
  height: 34px; /* 与搜索框容器高度一致 */
  font-size: 14px;
}

/* 折叠态：搜索框容器右侧的橙红色按钮（保持当前位置） */
.search-action-fixed {
  position: absolute;
  right: 0; /* 与正常模式的外侧间距对齐（drag-area已有15px padding） */
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 34px;
  border-radius: 10px;
  background: radial-gradient(circle at 50% 40%, #ff8a3d 0%, #ff6b35 60%, #ff4757 100%);
  border: 2px solid #ffffff;
  box-shadow: 0 4px 12px rgba(255, 71, 87, 0.25), 0 2px 8px rgba(255, 107, 53, 0.2);
  box-sizing: border-box;
  transition: left 200ms ease, right 200ms ease, width 200ms ease;
}

.search-action-fixed.expanded {
  left: 0;
  right: 0;
  width: auto;
}

.category-tabs {
  display: flex;
  flex-wrap: nowrap;
  white-space: nowrap;
  padding: 2px 9px;
  align-items: center; /* 垂直居中，统一行内高度感受 */
  border-bottom: 1px solid #eee;
}

/* 包裹层用于固定右侧按钮 */
.category-tabs-wrap {
  position: relative;
  margin-top: -10px; /* 整体下移一点，拉开与搜索框的间距 */
}

/* 展开态：隐藏除第一项外的其他tab，仅保留“全部”可见 */
.category-tabs-wrap.expanded .category-tabs .category-tab:not(:first-child) {
  opacity: 0;
  pointer-events: none;
}

.category-action-fixed {
  transition: left 200ms ease, right 200ms ease, width 200ms ease;
}

/* 展开态：按钮从“全部”右侧起始，延伸到容器右侧，宽度自动跟随 */
.category-tabs-wrap.expanded .category-action-fixed {
  width: auto;
}

/* 右侧预留空间，避免内容被固定按钮覆盖 */
.category-tabs-spacer {
  display: inline-block;
  width: 52px; /* 与固定按钮宽度+间距一致 */
  height: 34px; /* 与右侧固定按钮保持一致高度 */
}

.category-tab {
  display: inline-flex; /* 使内容垂直居中并可设定固定高度 */
  align-items: center;
  height: 34px; /* 与右侧固定按钮一致 */
  padding: 0 15px; /* 保持原横向留白，去除垂直内边距影响高度 */
  margin-right: 10px;
  font-size: 14px; /* 保持字号不变 */
  border-radius: 17px; /* 与高度匹配的圆角 */
  background-color: #f0f0f0;
  color: #666;
}

.category-tab.active {
  background-color: #2196F3;
  color: #fff;
}

.cards-container {
  overflow: hidden; /* 高度由模板中的动态 style 控制 */
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

/* 右侧橙红色按钮样式（与底部“+”按钮统一色系） */
.category-action-fixed {
  position: absolute;
  right: 15px; /* 与 tabs 的内边距右侧一致 */
  top: calc(50% + 6px); /* 稍微下移以贴合视觉中心 */
  transform: translateY(-50%);
  width: 48px;
  height: 34px;
  border-radius: 10px;
  background: radial-gradient(circle at 50% 40%, #ff8a3d 0%, #ff6b35 60%, #ff4757 100%);
  border: 2px solid #ffffff;
  box-shadow: 0 4px 12px rgba(255, 71, 87, 0.25), 0 2px 8px rgba(255, 107, 53, 0.2);
  box-sizing: border-box;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.category-action-text {
  max-width: 100%;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding: 0 12px;
}
</style>

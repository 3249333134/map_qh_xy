<template>
  <view 
    class="content-area" 
    :class="{ collapsed: isCollapsed, 'has-overlay': !!selectedPoint, 'is-dragging': isDragging, 'has-filter-sheet': filterSheetOpen }"
    :style="{ height: contentAreaHeight + 'px', bottom: (bottomOffset || 0) + 'px' }"
  >
    <!-- 白色背景容器 -->
    <view class="content-inner">
      <!-- 拖动区域（包含拖动条和搜索框） -->
      <drag-search-bar
        :is-collapsed="isCollapsed"
        :collapsed-search-style="collapsedSearchStyle"
        :category-action-expanded="categoryActionExpanded"
        :collapsed-search-width="collapsedSearchWidth"
        :collapsed-gap="collapsedGap"
        :selected-point="selectedPoint"
        :value="searchText"
        :has-filter-button="showExploreControls && !categoryActionExpanded && !exploreToolMode"
        @drag-start="onDragStart"
        @drag="onDrag"
        @drag-end="onDragEnd"
        @search-input="onSearchInput"
        @search-focus="onSearchFocus"
        @search-tap="onSearchTap"
        @right-action-tap="onRightActionTap"
      />

      <view
        v-if="showExploreControls && !categoryActionExpanded"
        v-show="!exploreToolMode"
        class="explore-controls-slot"
        :class="{ 'is-collapsed': isCollapsed }"
      >
        <explore-controls
          inline
          compact
          :city-name="cityName"
          :location-state="locationState"
          :time-range="timeRange"
          :spatial-filter="spatialFilter"
          :is-refreshing="isRefreshing"
          :error="dataError"
          @city-select="$emit('city-select', $event)"
          @time-change="$emit('time-change', $event)"
          @space-change="$emit('space-change', $event)"
          @layer-tap="$emit('layer-tap')"
          @share-tap="$emit('share-tap')"
          @request-location="$emit('request-location')"
          @retry="$emit('retry')"
          @sheet-state="filterSheetOpen = $event"
        />
      </view>
      
      <!-- 分类选项卡（右侧按钮固定，可展开覆盖除“全部”外的区域） -->
      <category-tabs-bar
        v-if="(!isCollapsed || categoryActionExpanded) && !isSearchMode && !exploreToolMode"
        :categories="categories"
        :active-category="activeCategory"
        :category-action-expanded="categoryActionExpanded"
        :expanded-left="expandedLeft"
        :selected-point="selectedPoint"
        :show-action-button="!selectedPoint"
        @drag-start="onDragStart"
        @drag="onDrag"
        @drag-end="onDragEnd"
      @category-change="onCategoryChange"
      @right-action-tap="onRightActionTap"
      @close-point-detail="onClosePointDetail"
      />

      <inline-search-results
        v-if="!isCollapsed && isSearchMode && !exploreToolMode"
        :height="cardsContainerHeight"
        :keyword="searchText"
        @exit="clearSearch"
        @result-tap="onInlineSearchResultTap"
      />

      <!-- 卡片内容区 -->
      <cards-container
      v-if="!isCollapsed && !categoryActionExpanded && !isSearchMode && !exploreToolMode"
      :scroll-top="scrollTop"
      :scroll-with-animation="scrollWithAnimation"
      :cards-container-height="cardsContainerHeight"
      :is-loading="isLoading"
      :has-more-data="hasMoreData"
      :left-column-data="leftColumnData"
      :right-column-data="rightColumnData"
      :use-service-card="useServiceCard"
      :get-column-item-height="getColumnItemHeight"
      :highlighted-card-id="highlightedCardId"
      :empty-title="isSearchMode ? '没有找到相关内容' : '暂无内容'"
      :empty-desc="isSearchMode ? '换个关键词试试' : '去发布第一条动态吧'"
      :show-empty-action="!isSearchMode"
      @load-more="onLoadMore"
      @scroll="onScroll"
      @media-tap="onMediaTap"
      @content-tap="onContentTap"
      @reserve="onReserve"
      @scroll-to-card="onScrollToCard"
      @empty-recovery="$emit('empty-recovery', $event)"
      ref="cardsContainerRef"
    />
    <map-explore-tool-panel
      v-if="!isCollapsed && exploreToolMode"
      :mode="exploreToolMode"
      :height="cardsContainerHeight"
      :layers="layers"
      :snapshot="exploreSnapshot"
      @close="$emit('close-explore-tool')"
      @layers-change="$emit('layers-change', $event)"
    />
    <expanded-modules 
      v-if="categoryActionExpanded && !exploreToolMode"
      :height="cardsContainerHeight"
      :selected-point="selectedPoint"
      @navigate="onPointNavigate"
      @reserve="onReserve"
      @item-tap="onItemTap"
    />
    </view>
  </view>
</template>

<script>
import DragSearchBar from './DragSearchBar.vue'
import CategoryTabsBar from './CategoryTabsBar.vue'
import CardsContainer from './CardsContainer.vue'
import ExpandedModules from './ExpandedModules.vue'
import InlineSearchResults from './InlineSearchResults.vue'
import ExploreControls from '../map/ExploreControls.vue'
import MapExploreToolPanel from './MapExploreToolPanel.vue'

export default {
  components: {
    DragSearchBar,
    CategoryTabsBar,
    CardsContainer,
    ExpandedModules,
    InlineSearchResults,
    ExploreControls,
    MapExploreToolPanel
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
    isDragging: {
      type: Boolean,
      default: false
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
    cardComponent: {
      type: String,
      default: ''
    },
    selectedPoint: {
      type: Object,
      default: null
    },
    storageKeyPrefix: {
      type: String,
      default: 'contentArea'
    },
    highlightedCardId: {
      type: [String, Number],
      default: null
    },
    cityName: { type: String, default: '成都' },
    locationState: { type: String, default: 'idle' },
    timeRange: { type: Object, default: () => ({ preset: 'all', start: '', end: '' }) },
    spatialFilter: { type: Object, default: () => ({ mode: 'bounds', radiusKm: 5 }) },
    isRefreshing: { type: Boolean, default: false },
    dataError: { type: Object, default: null }
    ,
    showExploreControls: { type: Boolean, default: false },
    exploreToolMode: { type: String, default: '' },
    layers: { type: Array, default: () => [] },
    exploreSnapshot: { type: Object, default: () => ({}) }
  },
  // 在 data 中初始化为 false
  data() {
    return {
      leftColumnHeights: {},
      rightColumnHeights: {},
      scrollTop: 0,
      isScrollLocked: false,
      categoryScrollPositions: {},
      scrollWithAnimation: true,
      visitedCategories: {},
      loadMoreTimer: null,
      categoryActionExpanded: false,
      expandedLeft: 0,
      collapsedSearchWidth: 76,
      collapsedGap: 8,
      collapsedButtonWidth: 48,
      userToggledAction: false,
      resetExpandOnExitCollapse: false,
      tabsHeightApprox: 50,
      topAreaHeight: 0,
      fillCompensation: 10,
      isContentLocked: false,
      lockedContentHeight: 0,
      cardsContainerRef: null,
      highlightTimer: null,
      searchText: '',
      searchFocused: false,
      filterSheetOpen: false
    }
  },
  mounted() {
    // 挂载后测量分类栏的高度，提高卡片容器高度计算的准确度
    this.$nextTick(() => {
      this.updateTabsHeightApprox()
      this.updateTopAreaHeight()
    })

    // 初始化时不读取 categoryActionExpanded，避免首页和服务页状态混淆
    // 详情弹窗的显示完全由 selectedPoint prop 控制，不依赖存储状态
    
    try {
      if (uni && uni.$on) {
        uni.$on('collapseExpandableBars', () => { this.categoryActionExpanded = false })
      }
    } catch (e2) {}
  },
  beforeDestroy() {
    try { if (uni && uni.$off) uni.$off('collapseExpandableBars') } catch (e) {}
  },
  beforeUnmount() {
    try { if (uni && uni.$off) uni.$off('collapseExpandableBars') } catch (e) {}
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
        if (this.categoryActionExpanded) {
          this.updateExpandedLeft()
        }
      })
    },
    // 折叠态切换时重新测量顶部区域
    isCollapsed() {
      this.$nextTick(() => {
        this.updateTopAreaHeight()
        if (this.categoryActionExpanded) {
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
        const storageKeyCategoryAction = this.storageKeyPrefix + '.categoryActionExpanded'
        uni.setStorageSync(storageKeyCategoryAction, this.categoryActionExpanded)
      } catch (e) {}
      if (this.categoryActionExpanded) {
        this.isContentLocked = true
        try {
          const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
          const wh = Number((info && info.windowHeight) || 0)
          const maxH = wh > 0 ? wh * 0.70 : Number(this.height || 0)
          this.lockedContentHeight = Math.max(Number(this.minContentHeight || 0), Math.floor(maxH))
        } catch (e) {
          this.lockedContentHeight = Number(this.height || 0)
        }
      } else {
        this.isContentLocked = false
        this.lockedContentHeight = 0
      }
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
    selectedPoint(newVal) {
      console.log('ContentArea selectedPoint 变化:', newVal, 'useServiceCard:', this.useServiceCard)
      if (newVal) {
        this.categoryActionExpanded = true
        this.$nextTick(() => {
          this.updateExpandedLeft()
          this.updateTopAreaHeight()
        })
      } else {
        this.categoryActionExpanded = false
      }
    },
    highlightedCardId(newVal) {
      if (newVal && this.highlightTimer) clearTimeout(this.highlightTimer)
      if (newVal) {
        this.$nextTick(() => {
          const cards = this.$refs.cardsContainerRef
          if (cards && typeof cards.scrollToCard === 'function') cards.scrollToCard(newVal)
        })
      }
    },
    isSearchMode() {
      this.$nextTick(() => {
        this.updateTabsHeightApprox()
        this.updateTopAreaHeight()
      })
    },
    exploreToolMode(value) {
      if (value) {
        this.searchFocused = false
        this.categoryActionExpanded = false
      }
      this.$nextTick(() => {
        this.updateTabsHeightApprox()
        this.updateTopAreaHeight()
      })
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
    onClosePointDetail() {
      this.userToggledAction = false
      this.categoryActionExpanded = false
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
            // 以第一项右缘为基准，并补上第一项的 margin-right（10px）
            // 折叠/详情展开场景再额外增加间距，避免遮挡“全部”按钮
            const baseGap = (this.isCollapsed || !!this.selectedPoint) ? 12 : 4
            const marginRight = 10
            const left = Math.max(0, (firstTabRect.right - wrapRect.left) + marginRight + baseGap)
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
      if (this.isSearchMode || this.exploreToolMode) {
        this.tabsHeightApprox = 0
        return
      }
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
        const hasSecondaryBar = !this.isSearchMode && !this.exploreToolMode && (!this.isCollapsed || this.categoryActionExpanded)
        if (hasSecondaryBar) {
          q.select('.category-tabs-wrap').boundingClientRect()
        }
        q.exec(res => {
          const dragRect = res && res[0]
          const tabsRect = hasSecondaryBar ? res && res[1] : null
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
      if (this.isContentLocked) return
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
      if (this.isContentLocked) return
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
      if (this.isContentLocked) return
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
      const value = typeof e === 'string'
        ? e
        : String((e && e.detail && e.detail.value) || '')
      this.searchText = value
      this.searchFocused = true
      this.$emit('search-input', value)
    },
    onSearchFocus(e) {
      this.categoryActionExpanded = false
      this.searchFocused = true
      this.$emit('search-focus', e)
    },
    onSearchTap() {
      this.categoryActionExpanded = false
      this.searchFocused = true
      this.$emit('search-tap')
    },
    clearSearch() {
      this.searchText = ''
      this.searchFocused = false
      this.$emit('search-input', '')
      this.$emit('search-exit')
    },
    onInlineSearchResultTap(item) {
      const source = Array.isArray(this.mapData) ? this.mapData : []
      let cardData = null
      if (item && item.type === 'poi') {
        cardData = source.find(card => card && card.type === 'place') || source[0]
      } else if (item && item.type === 'track') {
        cardData = source.find(card => card && card.type === 'track') || source[0]
      } else {
        cardData = source.find(card => card && card.type !== 'track' && card.type !== 'place') || source[0]
      }
      if (!cardData) {
        uni.showToast({ title: '暂无可联动内容', icon: 'none' })
        return
      }
      if (item && item.type === 'content') {
        this.$emit('media-tap', { cardData })
      } else {
        this.$emit('content-tap', { cardData })
      }
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
    onItemTap(item) {
      this.$emit('content-tap', { cardData: item })
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
    onScrollToCard(payload) {
      const target = Number(payload && payload.scrollTop)
      if (!Number.isFinite(target)) return
      this.scrollWithAnimation = true
      if (Math.abs(Number(this.scrollTop || 0) - target) < 1) {
        this.scrollTop = target + 1
        this.$nextTick(() => { this.scrollTop = target })
      } else {
        this.scrollTop = target
      }
      this.$emit('scroll-to-card', payload)
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
    contentAreaHeight() {
      const H = Number(this.height || 0)
      if (this.isContentLocked && this.lockedContentHeight) {
        return Number(this.lockedContentHeight)
      }
      return H
    },
    // 将数据分为左右两列
    leftColumnData() {
      return this.filteredMapData.filter((_, index) => index % 2 === 0);
    },
    rightColumnData() {
      return this.filteredMapData.filter((_, index) => index % 2 === 1);
    },
    filteredMapData() {
      const source = Array.isArray(this.mapData) ? this.mapData : []
      const keyword = String(this.searchText || '').trim().toLowerCase()
      if (!keyword) return source
      return source.filter(item => {
        const searchable = [
          item && item.name,
          item && item.title,
          item && item.description,
          item && item.address,
          item && item.author,
          item && item.category,
          item && item.type
        ].filter(Boolean).join(' ').toLowerCase()
        return searchable.includes(keyword)
      })
    },
    searchResultCount() {
      return this.filteredMapData.length
    },
    isSearchMode() {
      return this.searchFocused
    },
    // 新增：是否使用服务卡片
    useServiceCard() {
      return this.cardComponent === 'ServiceCardItem'
    },
    // 卡片滚动容器的动态高度：总高度 - 顶部区域（测量优先）
    cardsContainerHeight() {
      const H = Number(this.contentAreaHeight || 0)
      const searchH = Number(this.searchBoxHeight || 0)
      const tabsApprox = (this.isSearchMode || this.exploreToolMode) ? 0 : Number(this.tabsHeightApprox || 50)
      const measuredTop = Number(this.topAreaHeight || 0)
      const topUsed = measuredTop > 0 ? measuredTop : (searchH + tabsApprox)
      const val = H - topUsed + Number(this.fillCompensation || 0)
      return val > 0 ? val : 0
    },
    // 折叠态：当容器高度接近最小高度，仅显示搜索框
    isCollapsed() {
      const minH = Number(this.minContentHeight || 0)
      return Number(this.contentAreaHeight || 0) <= (minH + 1)
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

<style scoped>
.content-area {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  z-index: 10;
  overflow: hidden;
  border-radius: 26px 26px 0 0;
  background: transparent;
  transition: height 260ms cubic-bezier(.2,.8,.2,1);
}

/* 拖动时高度必须紧跟手指，避免外层动画滞后于内部滚动区而露出白色块。 */
.content-area.is-dragging {
  transition: none;
}

.content-inner {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,.82);
  border-bottom: 0;
  border-radius: 26px 26px 0 0;
  background: rgba(255,255,255,.97);
  box-shadow: 0 -12px 40px rgba(15,23,42,.12);
  backdrop-filter: blur(18px) saturate(135%);
}

.explore-controls-slot {
  position: absolute;
  /* 8px 顶部留白 + border-box 下 16px 拖拽把手，与 48px 搜索框严格齐平。 */
  top: 24px;
  right: 16px;
  z-index: 8;
  width: 48px;
  height: 48px;
}

.explore-controls-slot.is-collapsed {
  top: 8px;
}

.content-area.has-filter-sheet {
  /* 现有自定义底栏使用 9999；筛选抽屉需要覆盖它，形成完整连续的浮层。 */
  z-index: 10020;
  overflow: visible;
}

.content-area.has-filter-sheet .content-inner {
  overflow: visible;
}

.content-area::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  z-index: 2;
  width: 64px;
  height: 1px;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, rgba(234,88,12,.48), transparent);
  transform: translateX(-50%);
  pointer-events: none;
}

.content-area.collapsed { height: auto !important; overflow: visible; }
.content-area.collapsed::before { display: none; }
.content-area.collapsed .content-inner {
  overflow: visible;
  border: 0;
  background: transparent;
  box-shadow: none;
  backdrop-filter: none;
}

@media (prefers-reduced-motion: reduce) { .content-area { transition: none; } }
</style>

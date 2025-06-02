"use strict";
const common_vendor = require("../../common/vendor.js");
const pages_index_constants_layoutConfig = require("./constants/layoutConfig.js");
const MapBackground = () => "./components/MapBackground.js";
const ContentArea = () => "./components/ContentArea.js";
const _sfc_main = {
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
        { id: "all", name: "全部", active: true },
        { id: "hot", name: "热门资源", active: false },
        { id: "exhibition", name: "展会活动", active: false },
        { id: "personal", name: "个人活动", active: false }
      ],
      activeCategory: "all",
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
    };
  },
  computed: {
    // 计算地图高度
    mapHeight() {
      return this.screenHeight - this.contentHeight;
    },
    // 最小内容高度（只显示搜索框）
    minContentHeight() {
      return this.searchBoxHeight + pages_index_constants_layoutConfig.LAYOUT_CONFIG.MARGIN;
    },
    // 最大内容高度
    maxContentHeight() {
      return this.screenHeight * pages_index_constants_layoutConfig.LAYOUT_CONFIG.MAX_CONTENT_RATIO;
    }
  },
  onReady() {
    this.initLayout();
    this.generateRandomHeights();
  },
  methods: {
    // 初始化布局
    initLayout() {
      const systemInfo = common_vendor.index.getSystemInfoSync();
      this.screenHeight = systemInfo.windowHeight;
      this.contentHeight = this.screenHeight * pages_index_constants_layoutConfig.LAYOUT_CONFIG.INITIAL_CONTENT_RATIO;
      this.searchBoxHeight = 80;
    },
    // 生成随机高度数据
    generateRandomHeights() {
      this.leftColumnHeights = this.generateRandomHeightsArray(10);
      this.rightColumnHeights = this.generateRandomHeightsArray(10);
    },
    // 生成随机高度数组
    generateRandomHeightsArray(count) {
      const heights = [];
      for (let i = 0; i < count; i++) {
        const min = 150;
        const max = 300;
        const height = Math.floor(Math.random() * (max - min + 1)) + min;
        heights.push(height);
      }
      return heights;
    },
    // 处理拖拽开始
    handleDragStart(e) {
      this.isDragging = true;
      this.dragStartY = e.touches[0].clientY;
      this.dragStartHeight = this.contentHeight;
    },
    // 处理拖拽中
    handleDrag(e) {
      if (!this.isDragging)
        return;
      const currentY = e.touches[0].clientY;
      const deltaY = this.dragStartY - currentY;
      let newHeight = this.dragStartHeight + deltaY;
      newHeight = Math.max(
        this.minContentHeight,
        Math.min(this.maxContentHeight, newHeight)
      );
      this.contentHeight = newHeight;
    },
    // 处理拖拽结束
    handleDragEnd() {
      this.isDragging = false;
      const range = this.maxContentHeight - this.minContentHeight;
      const snapThresholds = {
        min: this.minContentHeight + range * pages_index_constants_layoutConfig.LAYOUT_CONFIG.SNAP_THRESHOLD_LOW,
        max: this.minContentHeight + range * pages_index_constants_layoutConfig.LAYOUT_CONFIG.SNAP_THRESHOLD_HIGH
      };
      let newHeight;
      if (this.contentHeight < snapThresholds.min) {
        newHeight = this.minContentHeight;
      } else if (this.contentHeight < snapThresholds.max) {
        newHeight = this.screenHeight * pages_index_constants_layoutConfig.LAYOUT_CONFIG.INITIAL_CONTENT_RATIO;
      } else {
        newHeight = this.maxContentHeight;
      }
      this.contentHeight = newHeight;
    },
    // 处理瀑布流滚动
    handleWaterfallScroll(e) {
      if (this.isDragging || this.isScrollLocked)
        return;
      const currentScrollTop = e.detail.scrollTop;
      const deltaY = currentScrollTop - this.lastScrollTop;
      if (deltaY > 0 && this.contentHeight < this.maxContentHeight) {
        this.handleWaterfallScrollDown(deltaY, currentScrollTop);
      }
      this.lastScrollTop = currentScrollTop;
    },
    // 处理瀑布流向下滚动
    handleWaterfallScrollDown(deltaY, currentScrollTop) {
      const heightChange = Math.abs(deltaY) / pages_index_constants_layoutConfig.LAYOUT_CONFIG.SCROLL_HEIGHT_RATIO;
      let newHeight = this.contentHeight + heightChange;
      newHeight = Math.min(this.maxContentHeight, newHeight);
      if (newHeight !== this.contentHeight) {
        this.contentHeight = newHeight;
        this.resetScrollPosition(currentScrollTop, deltaY);
        this.lockScrollTemporarily();
        if (this.contentHeight > this.screenHeight * 0.5) {
          this.contentHeight = Math.min(
            this.maxContentHeight,
            Math.ceil(this.contentHeight / (this.screenHeight * 0.25)) * (this.screenHeight * 0.25)
          );
        }
      }
    },
    // 重置滚动位置
    resetScrollPosition(currentScrollTop, deltaY) {
      const newScrollTop = Math.max(0, currentScrollTop + deltaY / pages_index_constants_layoutConfig.LAYOUT_CONFIG.SCROLL_HEIGHT_RATIO);
      setTimeout(() => {
        common_vendor.index.pageScrollTo({
          scrollTop: newScrollTop,
          duration: 0
        });
      }, 0);
    },
    // 暂时锁定滚动
    lockScrollTemporarily() {
      this.isScrollLocked = true;
      setTimeout(() => {
        this.isScrollLocked = false;
      }, pages_index_constants_layoutConfig.LAYOUT_CONFIG.SCROLL_LOCK_DURATION);
    },
    // 处理分类切换
    handleCategoryChange(categoryId) {
      this.activeCategory = categoryId;
    },
    // 搜索输入处理
    onSearchInput(e) {
      e.detail.value;
    },
    // 加载更多内容
    loadMoreItems() {
      if (this.isLoading)
        return;
      this.isLoading = true;
      setTimeout(() => {
        const newLeftItems = this.generateRandomHeightsArray(5);
        const newRightItems = this.generateRandomHeightsArray(5);
        this.leftColumnHeights = [...this.leftColumnHeights, ...newLeftItems];
        this.rightColumnHeights = [...this.rightColumnHeights, ...newRightItems];
        this.isLoading = false;
      }, 500);
    }
  }
};
if (!Array) {
  const _component_map_background = common_vendor.resolveComponent("map-background");
  const _component_content_area = common_vendor.resolveComponent("content-area");
  (_component_map_background + _component_content_area)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.p({
      height: $options.mapHeight,
      config: $data.mapConfig
    }),
    b: common_vendor.o($options.handleDragStart),
    c: common_vendor.o($options.handleDrag),
    d: common_vendor.o($options.handleDragEnd),
    e: common_vendor.o($options.handleWaterfallScroll),
    f: common_vendor.o($options.handleCategoryChange),
    g: common_vendor.o($options.onSearchInput),
    h: common_vendor.o($options.loadMoreItems),
    i: common_vendor.p({
      height: $data.contentHeight,
      ["search-box-height"]: $data.searchBoxHeight,
      ["min-content-height"]: $options.minContentHeight,
      categories: $data.categories,
      ["active-category"]: $data.activeCategory,
      ["left-column-heights"]: $data.leftColumnHeights,
      ["right-column-heights"]: $data.rightColumnHeights,
      ["is-loading"]: $data.isLoading
    })
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map

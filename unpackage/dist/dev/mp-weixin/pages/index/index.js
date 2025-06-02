"use strict";
const common_vendor = require("../../common/vendor.js");
const pages_index_constants_layoutConfig = require("./constants/layoutConfig.js");
const _sfc_main = {
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
    // 计算瀑布流容器高度
    waterfallHeight() {
      return this.contentHeight - this.searchBoxHeight - (this.showCategoryTabs ? 80 : 0);
    },
    // 是否显示分类标签
    showCategoryTabs() {
      return this.contentHeight > this.minContentHeight;
    },
    // 是否显示瀑布流
    showWaterfall() {
      return this.contentHeight > this.minContentHeight;
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
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $options.mapHeight + "px",
    b: $data.mapConfig.latitude,
    c: $data.mapConfig.longitude,
    d: $data.mapConfig.markers,
    e: common_vendor.o((...args) => $options.onSearchInput && $options.onSearchInput(...args)),
    f: $options.showCategoryTabs
  }, $options.showCategoryTabs ? {
    g: common_vendor.f($data.categories, (category, k0, i0) => {
      return {
        a: common_vendor.t(category.name),
        b: category.id,
        c: common_vendor.n({
          active: category.id === $data.activeCategory
        }),
        d: common_vendor.o(($event) => $options.handleCategoryChange(category.id), category.id)
      };
    })
  } : {}, {
    h: common_vendor.o((...args) => $options.handleDragStart && $options.handleDragStart(...args)),
    i: common_vendor.o((...args) => $options.handleDrag && $options.handleDrag(...args)),
    j: common_vendor.o((...args) => $options.handleDragEnd && $options.handleDragEnd(...args)),
    k: $options.showWaterfall
  }, $options.showWaterfall ? common_vendor.e({
    l: common_vendor.f($data.leftColumnHeights, (height, index, i0) => {
      return {
        a: "left" + index,
        b: height + "rpx"
      };
    }),
    m: common_vendor.f($data.rightColumnHeights, (height, index, i0) => {
      return {
        a: "right" + index,
        b: height + "rpx"
      };
    }),
    n: $data.isLoading
  }, $data.isLoading ? {} : {}, {
    o: $options.waterfallHeight + "px",
    p: common_vendor.o((...args) => $options.handleWaterfallScroll && $options.handleWaterfallScroll(...args)),
    q: common_vendor.o((...args) => $options.loadMoreItems && $options.loadMoreItems(...args))
  }) : {}, {
    r: $data.contentHeight + "px"
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map

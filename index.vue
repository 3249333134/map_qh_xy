// 将数据分配到左右两列
distributeDataToColumns() {
  // 无论是否有数据，都先初始化数组
  this.leftColumnData = [];
  this.rightColumnData = [];
  this.leftColumnHeights = [];
  this.rightColumnHeights = [];
  
  if (!this.mapPoints || this.mapPoints.length === 0) {
    return;
  }
  
  // 限制最大显示数量
  const maxItemsPerColumn = 10;
  const totalItems = Math.min(this.mapPoints.length, maxItemsPerColumn * 2);
  
  // 将数据平均分配到左右两列
  for (let index = 0; index < totalItems; index++) {
    // ... 现有代码 ...
  }
}

<!-- 在 content-area 组件中添加 :has-more-data 属性 -->
<content-area 
  :height="contentHeight"
  :search-box-height="searchBoxHeight"
  :min-content-height="minContentHeight"
  :categories="categories"
  :active-category="activeCategory"
  :map-data="mapPoints"
  :is-loading="isLoading"
  :has-more-data="hasMoreData"
  @drag-start="handleDragStart"
  @drag="handleDrag"
  @drag-end="handleDragEnd"
  @category-change="handleCategoryChange"
  @search-input="onSearchInput"
  @load-more="loadMoreItems"
  @card-tap="handleCardTap"
/>
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

// 如果是加载更多，追加数据；否则替换数据
if (isLoadMore) {
  // 检查是否有重复数据
  const existingIds = new Set(this.mapPoints.map(p => p._id));
  const uniqueNewData = newData.filter(item => !existingIds.has(item._id));
  
  if (uniqueNewData.length > 0) {
    this.mapPoints = [...this.mapPoints, ...uniqueNewData];
    console.log(`边界查询加载更多成功，新增 ${uniqueNewData.length} 个点位`);
  } else {
    console.log('没有新的点位数据，可能已到达末尾');
    // 如果没有新数据，强制设置hasMoreData为false
    this.hasMoreData = false;
  }
} else {
  this.mapPoints = newData;
  console.log(`边界查询成功，获取到 ${newData.length} 个点位`);
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
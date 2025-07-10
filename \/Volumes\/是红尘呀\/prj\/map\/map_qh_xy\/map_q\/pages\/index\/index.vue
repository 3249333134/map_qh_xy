fetchMapDataByBounds(isLoadMore = false) {
  // 检查是否有边界信息
  if (!this.mapBounds) {
    console.error('没有地图边界信息，无法获取数据');
    return;
  }
  
  this.isLoading = true;
  
  // 构建API请求参数
  const params = {
    page: this.currentPage,
    pageSize: this.pageSize,
    bounds: JSON.stringify({
      northeast: this.mapBounds.northeast,
      southwest: this.mapBounds.southwest
    })
  };
  
  // 如果有分类筛选
  if (this.activeCategory !== 'all') {
    const categoryMap = {
      'hot': '热门资源',
      'exhibition': '展会活动',
      'personal': '个人活动'
    };
    params.category = categoryMap[this.activeCategory] || this.activeCategory;
  }
  
  console.log('边界查询参数：', params);
  
  // 添加超时设置
  uni.request({
    url: MONGO_CONFIG.API_URL,
    method: 'GET',
    data: params,
    timeout: 10000, // 10秒超时
    success: (res) => {
      const responseData = res.data && res.data.data ? res.data.data : 
                      (Array.isArray(res.data) ? res.data : []);
      
      if (res.statusCode === 200 && responseData && responseData.length > 0) {
        // 成功获取数据，重置扩大范围计数器
        this.expansionCount = 0;

        // 处理数据
        const newData = responseData.map(item => ({
          ...item,
          _id: item._id || item.id || `id_${Date.now()}_${Math.random()}`,
          name: item.name || item.title || `地点 ${Math.floor(Math.random() * 1000)}`,
          author: item.author || '未知作者',
        }));
        
        // 检查是否有重复数据
        const existingIds = new Set(this.mapPoints.map(p => p._id));
        const uniqueNewData = newData.filter(item => !existingIds.has(item._id));
        
        if (isLoadMore) {
          // 如果是加载更多，追加数据
          if (uniqueNewData.length > 0) {
            this.mapPoints = [...this.mapPoints, ...uniqueNewData];
            console.log(`边界查询加载更多成功，新增 ${uniqueNewData.length} 个点位`);
          } else {
            console.log('没有新的点位数据，尝试扩大搜索范围');
            this.expandSearchBounds();
            return; // 提前返回
          }
        } else {
          // 初始加载或地图拖动，直接替换数据
          this.mapPoints = uniqueNewData;
          console.log(`边界查询成功，获取到 ${uniqueNewData.length} 个新点位`);
        }
        
        // 统一更新地图标记
        this.updateMapMarkers();

      } else {
        console.log('没有获取到点位数据，尝试扩大搜索范围');
        if (isLoadMore) {
          // 扩大搜索范围
          this.expandSearchBounds();
        } else {
          // 初始加载时，如果没有数据，生成测试数据
          this.addTestData();
          this.$nextTick(() => {
            this.updateMapMarkers();
          });
        }
      }
    },
    fail: (err) => {
      console.error('获取数据失败:', err);
      
      // 检查是否是网络错误或服务器错误
      if (err.errMsg && (err.errMsg.includes('request:fail') || err.errMsg.includes('timeout'))) {
        // 网络错误，尝试使用本地测试数据
        console.log('网络错误或后端服务不可用，使用本地测试数据');
        this.addTestData(isLoadMore);
        this.$nextTick(() => {
          this.updateMapMarkers();
        });
        
        // 显示错误提示
        uni.showToast({
          title: '网络连接失败，已加载测试数据',
          icon: 'none',
          duration: 2000
        });
      } else {
        // 其他错误
        uni.showToast({
          title: '获取数据失败',
          icon: 'none'
        });
      }
    },
    complete: () => {
      this.isLoading = false;
    }
  });
}

expandSearchBounds() {
  // 检查是否已达到最大扩展次数
  if (this.expansionCount >= this.maxExpansionCount) {
    console.log('已达到最大搜索范围扩展次数，停止扩展');
    
    // 如果多次扩展后仍无数据，则使用测试数据
    this.addTestData(true);
    this.$nextTick(() => {
      this.updateMapMarkers();
    });
    
    // 显示提示
    uni.showToast({
      title: '未找到更多数据，已加载示例数据',
      icon: 'none',
      duration: 2000
    });
    
    return;
  }
  
  // 增加扩展计数
  this.expansionCount++;
  
  // 计算当前边界的宽度和高度
  const latDiff = this.mapBounds.northeast.latitude - this.mapBounds.southwest.latitude;
  const lngDiff = this.mapBounds.northeast.longitude - this.mapBounds.southwest.longitude;
  
  // 扩大搜索范围的系数
  const expandFactor = this.searchExpansionFactor;
  
  // 扩大边界
  this.mapBounds = {
    northeast: {
      latitude: this.mapBounds.northeast.latitude + latDiff * expandFactor,
      longitude: this.mapBounds.northeast.longitude + lngDiff * expandFactor
    },
    southwest: {
      latitude: this.mapBounds.southwest.latitude - latDiff * expandFactor,
      longitude: this.mapBounds.southwest.longitude - lngDiff * expandFactor
    }
  };
  
  console.log(`扩大搜索范围 ${this.expansionCount}/${this.maxExpansionCount}，新边界:`, this.mapBounds);
  
  // 重置当前页码
  this.currentPage = 1;
  
  // 使用扩大后的边界重新获取数据
  this.fetchMapDataByBounds(true);
}

data() {
  return {
    networkStatus: true,  // 网络状态
    retryCount: 0,        // 重试计数
    maxRetryCount: 3,     // 最大重试次数
    retryDelay: 1000,     // 重试延迟（毫秒）
  }
}

onReady() {
  // 初始化布局
  this.initLayout();
  
  // 检查网络状态
  this.checkNetworkStatus();
  
  // 加载初始数据
  this.loadInitialData();
}

// 检查网络状态
checkNetworkStatus() {
  uni.getNetworkType({
    success: (res) => {
      this.networkStatus = res.networkType !== 'none';
      console.log('网络状态:', this.networkStatus ? '在线' : '离线');
    }
  });
  
  // 监听网络状态变化
  uni.onNetworkStatusChange((res) => {
    this.networkStatus = res.isConnected;
    console.log('网络状态变化:', this.networkStatus ? '在线' : '离线');
    
    // 如果网络恢复，尝试重新加载数据
    if (this.networkStatus && this.mapPoints.length === 0) {
      this.retryCount = 0;
      this.fetchMapData();
    }
  });
}

// 添加测试数据
addTestData(isLoadMore = false) {
  console.log('添加测试数据，isLoadMore:', isLoadMore);
  
  // 确保categoryData和categoryPages已初始化
  if (!this.categoryData) this.categoryData = {};
  if (!this.categoryPages) this.categoryPages = {};
  
  // 如果不是加载更多且是第一页，重置数据；否则保留现有数据
  if (!isLoadMore && this.currentPage === 1) {
    this.mapPoints = [];
  }
  
  const count = 10; // 每次添加10个测试点
  const startIndex = this.mapPoints.length;
  
  // 根据当前分类生成不同的测试数据
  let prefix = ''
  let addressPrefix = '成都市'
  
  switch (this.activeCategory) {
    case 'hot':
      prefix = '热门'
      addressPrefix = '成都市锦江区'
      break
    case 'exhibition':
      prefix = '展会'
      addressPrefix = '成都市高新区'
      break
    case 'personal':
      prefix = '个人'
      addressPrefix = '成都市武侯区'
      break
    default:
      prefix = '推荐'
      addressPrefix = '成都市'
  }
  
  // 使用地图边界或地图配置中心点生成测试数据
  let centerLat, centerLng, latRange, lngRange;
  
  if (this.mapBounds) {
    // 如果有边界信息，使用边界中心点
    centerLat = (this.mapBounds.northeast.latitude + this.mapBounds.southwest.latitude) / 2;
    centerLng = (this.mapBounds.northeast.longitude + this.mapBounds.southwest.longitude) / 2;
    latRange = this.mapBounds.northeast.latitude - this.mapBounds.southwest.latitude;
    lngRange = this.mapBounds.northeast.longitude - this.mapBounds.southwest.longitude;
  } else {
    // 否则使用地图配置中心点
    centerLat = this.mapConfig.latitude;
    centerLng = this.mapConfig.longitude;
    // 默认范围
    latRange = 0.02;
    lngRange = 0.02;
  }
  
  // 生成测试数据
  const testData = [];
  for (let i = 0; i < count; i++) {
    const index = startIndex + i;
    testData.push({
      _id: `${this.activeCategory}_${this.currentPage}_${i}_${Date.now()}`,
      name: `${prefix}地点 ${index + 1}`,
      author: `用户${Math.floor(Math.random() * 1000)}`,
      address: `${addressPrefix}测试地址 ${index + 1}`,
      description: `这是一个${prefix}测试描述 ${index + 1}`,
      location: {
        type: 'Point',
        coordinates: [
          centerLng + (Math.random() - 0.5) * lngRange * 0.8, // 在边界范围内随机分布
          centerLat + (Math.random() - 0.5) * latRange * 0.8   // 在边界范围内随机分布
        ]
      }
    });
  }
  
  // 如果是加载更多，追加数据；否则替换数据
  if (isLoadMore) {
    this.mapPoints = [...this.mapPoints, ...testData];
  } else {
    this.mapPoints = testData;
  }
  
  console.log(`生成了 ${testData.length} 个测试数据点`);
  
  // 模拟分页，设置hasMoreData为true，允许持续加载
  this.hasMoreData = true;
  
  // 保存当前分类的数据
  this.categoryData[this.activeCategory] = [...this.mapPoints];
  this.categoryPages[this.activeCategory] = this.currentPage;
  
  // 确保更新地图标记
  this.$nextTick(() => {
    this.updateMapMarkers();
  });
}
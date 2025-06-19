<template>
  <view class="container">
    <!-- 地图区域 -->    
    <map-background 
      :height="mapHeight"
      :config="mapConfig"
      @refresh-location="getUserLocation"
      @region-changed="onMapRegionChanged"
    />
    
    <!-- 可滑动区域 -->
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
      @visible-cards-change="handleVisibleCardsChange"
    />
  </view>
</template>

<script>
// 导入工具函数和常量
import { LAYOUT_CONFIG } from './constants/layoutConfig.js'
// 导入MongoDB配置
import { MONGO_CONFIG } from '../../utils/db.js'
// 导入组件
import MapBackground from './components/MapBackground.vue'
import ContentArea from './components/ContentArea.vue'

export default {
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
        { id: 'all', name: '全部', active: true },
        { id: 'hot', name: '热门资源', active: false },
        { id: 'exhibition', name: '展会活动', active: false },
        { id: 'personal', name: '个人活动', active: false }
      ],
      activeCategory: 'all',
      
      // 布局相关
      screenHeight: 0,
      contentHeight: 0,
      searchBoxHeight: 0,
      
      // 拖拽相关
      isDragging: false,
      dragStartY: 0,
      dragStartHeight: 0,
      
      // 数据相关
      isLoading: false,
      mapPoints: [],
      
      // 添加分页相关数据
      currentPage: 1,
      pageSize: 10,
      hasMoreData: true,
      
      // 为每个分类保存数据和分页状态
      categoryData: {},
      categoryPages: {},
      
      // 地图标记图标 - 使用静态图片
      markerIcon: '/static/marker-triangle.png', // 使用静态图片文件
      
      // 不同分类的标记图标
      markerIcons: {
        'all': '/static/marker-triangle-green.png',
        'hot': '/static/marker-triangle-red.png', 
        'exhibition': '/static/marker-triangle-blue.png',
        'personal': '/static/marker-triangle-orange.png'
      },
      
      // 添加密度控制相关数据
      densityConfig: {
        // 不同缩放级别对应的最大点数和网格大小
        levels: {
          5: { maxPoints: 20, gridSize: 0.1 },    // 很远视角，显示少量重要点
          8: { maxPoints: 50, gridSize: 0.05 },   // 远视角
          10: { maxPoints: 100, gridSize: 0.02 }, // 中等视角
          13: { maxPoints: 200, gridSize: 0.01 }, // 近视角
          16: { maxPoints: 500, gridSize: 0.005 }, // 很近视角
          18: { maxPoints: 1000, gridSize: 0.002 } // 最近视角
        }
      },
      currentMapScale: 16,
      allPointsInBounds: [], // 存储区域内所有点
      displayPoints: [], // 存储经过密度控制后要显示的点
      
      // 缓存相关
      cachedMapPoints: [], // 缓存的地图点位
      hasNewCachedData: false, // 是否有新的缓存数据
      
      // 搜索范围扩展相关
      searchExpansionFactor: 1.0, // 搜索范围扩展因子，初始为1.0（不扩展）
      maxExpansionFactor: 2.0, // 最大扩展因子
      
      // 存储可视区域内的卡片索引
      visibleCardIndices: []
    }
  },
  
  computed: {
    // 计算地图高度
    mapHeight() {
      return this.screenHeight - this.contentHeight
    },
    
    // 最小内容高度（只显示搜索框）
    minContentHeight() {
      return this.searchBoxHeight + LAYOUT_CONFIG.MARGIN
    },
    
    // 最大内容高度
    maxContentHeight() {
      return this.screenHeight * LAYOUT_CONFIG.MAX_CONTENT_RATIO
    }
  },
  
  onReady() {
    // 优先获取用户位置，并立即获取初始数据
    this.getUserLocation().then(() => {
      this.initLayout();
      // 立即加载初始数据
      this.loadInitialData();
    }).catch(() => {
      // 定位失败时使用默认位置
      this.initLayout();
      // 即使定位失败，也加载初始数据
      this.loadInitialData();
    });
  },
  
  methods: {
    // 扩大搜索范围
    expandSearchBounds() {
      if (!this.mapBounds) {
        console.error('没有地图边界信息，无法扩大搜索范围');
        return;
      }
      
      console.log('扩大搜索范围获取更远的数据');
      
      // 扩大搜索范围的系数，每次扩大 20%
      const expandFactor = 0.2;
      
      // 计算当前边界的宽度和高度
      const latDiff = this.mapBounds.northeast.latitude - this.mapBounds.southwest.latitude;
      const lngDiff = this.mapBounds.northeast.longitude - this.mapBounds.southwest.longitude;
      
      // 扩大边界
      const expandedBounds = {
        northeast: {
          latitude: this.mapBounds.northeast.latitude + latDiff * expandFactor,
          longitude: this.mapBounds.northeast.longitude + lngDiff * expandFactor
        },
        southwest: {
          latitude: this.mapBounds.southwest.latitude - latDiff * expandFactor,
          longitude: this.mapBounds.southwest.longitude - lngDiff * expandFactor
        }
      };
      
      // 保存原始边界用于显示
      this.originalMapBounds = this.mapBounds;
      
      // 更新边界并重新获取数据
      this.mapBounds = expandedBounds;
      console.log('扩大后的边界:', this.mapBounds);
      
      // 重置页码并获取新数据
      this.currentPage = 1;
      this.fetchMapDataByBounds(true);
    },
    
    // 加载初始数据
    loadInitialData() {
      console.log('加载初始数据');
      this.currentPage = 1;
      
      // 如果有地图边界信息，使用边界查询
      if (this.mapBounds) {
        // 使用特殊标志表示这是初始加载
        this.fetchInitialMapDataByBounds();
      } else {
        // 否则使用普通查询
        this.fetchInitialMapData();
      }
    },
    
    // 初始化布局
    initLayout() {
      // 使用推荐的新API替换已弃用的uni.getSystemInfoSync
      const systemInfo = uni.getWindowInfo()
      this.screenHeight = systemInfo.windowHeight
      
      // 设置初始内容高度
      this.contentHeight = this.screenHeight * LAYOUT_CONFIG.INITIAL_CONTENT_RATIO
      
      // 设置搜索框高度（固定值）
      this.searchBoxHeight = 50
    },
    
    // 从MongoDB获取数据 (修改后的方法)
    fetchMapData() {
      this.isLoading = true;
      
      // 确保categoryData和categoryPages已初始化
      if (!this.categoryData) this.categoryData = {};
      if (!this.categoryPages) this.categoryPages = {};
      
      // 构建API请求参数，使用当前地图中心点（用户位置或默认位置）
      const params = {
        page: this.currentPage,
        pageSize: this.pageSize,
        lat: this.mapConfig.latitude, // 使用地图当前纬度
        lng: this.mapConfig.longitude, // 使用地图当前经度
        radius: 5000 // 5公里范围内的点
      };
      
      // 如果有分类筛选
      if (this.activeCategory !== 'all') {
        // 映射前端分类ID到后端分类名称
        const categoryMap = {
          'hot': '热门资源',
          'exhibition': '展会活动',
          'personal': '个人活动'
        };
        params.category = categoryMap[this.activeCategory] || this.activeCategory;
      }
      
      uni.request({
        url: MONGO_CONFIG.API_URL,
        method: 'GET',
        data: params,
        success: (res) => {
          // 更加健壮的数据检查
          const responseData = res.data && res.data.data ? res.data.data : 
                              (Array.isArray(res.data) ? res.data : []);
          
          if (res.statusCode === 200 && responseData && responseData.length > 0) {
            // 处理数据，确保字段名称一致
            const newData = responseData.map(item => ({
              ...item,
              _id: item._id || item.id || `id_${Date.now()}_${Math.random()}`,
              name: item.name || item.title || `地点 ${Math.floor(Math.random() * 1000)}`,
              author: item.author || '未知作者',
              // 其他字段映射...
            }));
            
            // 如果是第一页，替换数据；否则追加数据
            if (this.currentPage === 1) {
              this.mapPoints = newData;
            } else {
              this.mapPoints = [...this.mapPoints, ...newData];
            }
            
            // 安全地更新分页信息
            const pagination = res.data && res.data.pagination ? res.data.pagination : {};
            this.hasMoreData = this.currentPage < (pagination.totalPages || 1);
            
            // 如果是第一页，替换数据；否则追加数据
            if (this.currentPage === 1) {
              this.mapPoints = newData;
            } else {
              this.mapPoints = [...this.mapPoints, ...newData];
            }
            
            // 保存当前分类的数据
            this.categoryData[this.activeCategory] = [...this.mapPoints];
            this.categoryPages[this.activeCategory] = this.currentPage;
            
            this.updateMapMarkers();
          } else {
            console.log('获取数据为空，使用测试数据:', res);
            // 添加测试数据
            this.addTestData();
            
            // 确保在添加测试数据后更新地图标记
            this.$nextTick(() => {
              this.updateMapMarkers();
            });
          }
        },
        fail: (err) => {
          console.error('请求失败:', err);
          // 添加测试数据
          this.addTestData();
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    },
    
    // 添加测试数据 (修改后的方法)
    // 修改addTestData方法，基于地图边界生成数据
    addTestData() {
      // 如果是第一页，重置数据；否则保留现有数据
      if (this.currentPage === 1) {
        this.mapPoints = []
      }
      
      const count = 10
      const startIndex = this.mapPoints.length
      
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
      
      // 使用地图边界范围生成测试数据
      let centerLat, centerLng, latRange, lngRange;
      
      if (this.mapBounds) {
        // 如果有地图边界，在边界范围内生成数据
        centerLat = (this.mapBounds.northeast.latitude + this.mapBounds.southwest.latitude) / 2;
        centerLng = (this.mapBounds.northeast.longitude + this.mapBounds.southwest.longitude) / 2;
        latRange = this.mapBounds.northeast.latitude - this.mapBounds.southwest.latitude;
        lngRange = this.mapBounds.northeast.longitude - this.mapBounds.southwest.longitude;
      } else {
        // 如果没有边界信息，使用地图中心点
        centerLat = this.mapConfig.latitude;
        centerLng = this.mapConfig.longitude;
        latRange = 0.02;
        lngRange = 0.02;
      }
      
      for (let i = 0; i < count; i++) {
        const index = startIndex + i
        this.mapPoints.push({
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
        })
      }
      
      // 模拟分页，设置hasMoreData为true，允许持续加载
      this.hasMoreData = true
      
      // 保存当前分类的数据
      this.categoryData[this.activeCategory] = [...this.mapPoints];
      this.categoryPages[this.activeCategory] = this.currentPage;
      
      // 确保更新地图标记
      this.$nextTick(() => {
        this.updateMapMarkers();
      });
    },
    
    // 根据分类获取标记图标
    getMarkerIconByCategory(category) {
      // 使用相对路径，确保图片能正确加载
      const iconMap = {
        'all': '/static/marker.png',
        'hot': '/static/marker.png', // 如果有不同的图标
        'exhibition': '/static/marker.png',
        'personal': '/static/marker.png'
      };
      return iconMap[category] || '/static/marker.png';
    },
    
    // 更新地图标记点
    updateMapMarkers() {
      if (!this.mapPoints || this.mapPoints.length === 0) {
        this.mapConfig.markers = [];
        return;
      }
      
      const markers = this.mapPoints.map((point, index) => {
        // 检查该点是否在可视区域内
        const isVisible = this.visibleCardIndices.includes(index);
        
        return {
          id: index,
          latitude: point.location.coordinates[1],
          longitude: point.location.coordinates[0],
          // 根据是否在可视区域内设置不同的图标颜色
          iconPath: isVisible ? '/static/marker-green.png' : '/static/marker-red.png',
          width: 24,
          height: 24,
          customData: {
            pointId: point._id,
            name: point.name,
            index: index,
            isVisible: isVisible
          },
          callout: {
            content: point.name,
            color: '#000000',
            fontSize: 12,
            borderRadius: 4,
            padding: 5,
            display: 'BYCLICK'
          }
        }
      });
      
      this.mapConfig.markers = markers;
      console.log(`已更新 ${markers.length} 个标记点，其中 ${this.visibleCardIndices.length} 个在可视区域内`);
    },
    
    // 处理拖拽开始
    handleDragStart(e) {
      this.isDragging = true
      this.dragStartY = e.touches[0].clientY
      this.dragStartHeight = this.contentHeight
    },
    
    // 处理拖拽中
    handleDrag(e) {
      if (!this.isDragging) return
      
      const currentY = e.touches[0].clientY
      const deltaY = this.dragStartY - currentY
      
      // 计算新的内容区域高度
      let newHeight = this.dragStartHeight + deltaY
      
      // 限制高度范围
      newHeight = Math.max(
        this.minContentHeight, 
        Math.min(this.maxContentHeight, newHeight)
      )
      
      this.contentHeight = newHeight
    },
    
    // 处理拖拽结束
    handleDragEnd() {
      this.isDragging = false
      
      // 添加边界吸附效果，三个状态：只显示搜索框、中间状态、最大高度
      const range = this.maxContentHeight - this.minContentHeight
      const snapThresholds = {
        min: this.minContentHeight + range * LAYOUT_CONFIG.SNAP_THRESHOLD_LOW,
        max: this.minContentHeight + range * LAYOUT_CONFIG.SNAP_THRESHOLD_HIGH
      }
      
      let newHeight
      if (this.contentHeight < snapThresholds.min) {
        // 靠近最小高度，吸附到只显示搜索框的状态
        newHeight = this.minContentHeight
      } else if (this.contentHeight < snapThresholds.max) {
        // 中间状态，吸附到屏幕的1/3
        newHeight = this.screenHeight * LAYOUT_CONFIG.INITIAL_CONTENT_RATIO
      } else {
        // 靠近最大高度，吸附到最大高度
        newHeight = this.maxContentHeight
      }
      
      // 设置高度
      this.contentHeight = newHeight
    },
    
    // 处理分类切换
    handleCategoryChange(categoryId) {
      // 确保categoryData和categoryPages已初始化
      if (!this.categoryData) this.categoryData = {};
      if (!this.categoryPages) this.categoryPages = {};
      
      // 保存当前分类的数据和分页状态
      this.categoryData[this.activeCategory] = [...this.mapPoints];
      this.categoryPages[this.activeCategory] = this.currentPage;
      
      // 更新活跃分类
      this.activeCategory = categoryId;
      
      // 如果已有该分类的数据，则恢复
      if (this.categoryData[categoryId] && this.categoryData[categoryId].length > 0) {
        this.mapPoints = [...this.categoryData[categoryId]];
        this.currentPage = this.categoryPages[categoryId] || 1;
        this.updateMapMarkers();
      } else {
        // 否则重新获取数据
        this.currentPage = 1;
        this.fetchMapData();
      }
    },
    
    // 搜索输入处理
    onShow() {
      // 如果没有数据，重新获取
      if (this.mapPoints.length === 0) {
        this.currentPage = 1
        this.fetchMapData()
      }
    },
    onSearchInput(e) {
      const searchText = e.detail.value
      // 处理搜索逻辑
      console.log('搜索:', searchText)
    },
    
    // 加载更多内容
    loadMoreItems() {
      if (this.isLoading || !this.hasMoreData) return
      
      this.currentPage++
      console.log('加载更多数据，当前页码：', this.currentPage)
      
      // 显示加载提示
      uni.showToast({
        title: '加载更多数据...',
        icon: 'loading',
        duration: 500
      })
      
      // 优先使用边界查询
      if (this.mapBounds) {
        this.fetchMapDataByBounds(true); // 传入 true 表示这是加载更多操作
      } else {
        this.fetchMapData(true); // 传入 true 表示这是加载更多操作
      }
    },
    
    // 修改 fetchMapData 方法，添加 isLoadMore 参数
    fetchMapData(isLoadMore = false) {
      this.isLoading = true;
      
      // 确保categoryData和categoryPages已初始化
      if (!this.categoryData) this.categoryData = {};
      if (!this.categoryPages) this.categoryPages = {};
      
      // 构建API请求参数
      const params = {
        page: this.currentPage,
        pageSize: this.pageSize,
        lat: this.mapConfig.latitude,
        lng: this.mapConfig.longitude,
        radius: 5000
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
      
      console.log('请求参数：', params);
      
      uni.request({
        url: MONGO_CONFIG.API_URL,
        method: 'GET',
        data: params,
        success: (res) => {
          const responseData = res.data && res.data.data ? res.data.data : 
                          (Array.isArray(res.data) ? res.data : []);
          
          if (res.statusCode === 200 && responseData && responseData.length > 0) {
            // 处理数据
            const newData = responseData.map(item => ({
              ...item,
              _id: item._id || item.id || `id_${Date.now()}_${Math.random()}`,
              name: item.name || item.title || `地点 ${Math.floor(Math.random() * 1000)}`,
              author: item.author || '未知作者',
            }));
            
            // 如果是加载更多，追加数据；否则替换数据
            if (isLoadMore) {
              this.mapPoints = [...this.mapPoints, ...newData];
              console.log(`加载更多成功，新增 ${newData.length} 条数据`);
            } else {
              this.mapPoints = newData;
              console.log(`加载数据成功，共 ${newData.length} 条数据`);
            }
            
            // 安全地更新分页信息
            const pagination = res.data && res.data.pagination ? res.data.pagination : {};
            this.hasMoreData = this.currentPage < (pagination.totalPages || 1);
            
            // 保存当前分类的数据
            this.categoryData[this.activeCategory] = [...this.mapPoints];
            this.categoryPages[this.activeCategory] = this.currentPage;
            
            this.updateMapMarkers();
          } else {
            console.log('获取数据为空，使用测试数据');
            // 添加测试数据
            this.addTestData(isLoadMore);
          }
        },
        fail: (err) => {
          console.error('请求失败:', err);
          // 添加测试数据
          this.addTestData(isLoadMore);
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    },
    
    // 修改 addTestData 方法，添加 isLoadMore 参数
    addTestData(isLoadMore = false) {
      // 如果不是加载更多且是第一页，重置数据；否则保留现有数据
      if (!isLoadMore && this.currentPage === 1) {
        this.mapPoints = [];
      }
      
      const count = 10;
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
      
      // 使用地图边界范围生成测试数据
      let centerLat, centerLng, latRange, lngRange;
      
      if (this.mapBounds) {
        // 如果有地图边界，在边界范围内生成数据
        centerLat = (this.mapBounds.northeast.latitude + this.mapBounds.southwest.latitude) / 2;
        centerLng = (this.mapBounds.northeast.longitude + this.mapBounds.southwest.longitude) / 2;
        latRange = this.mapBounds.northeast.latitude - this.mapBounds.southwest.latitude;
        lngRange = this.mapBounds.northeast.longitude - this.mapBounds.southwest.longitude;
      } else {
        // 如果没有边界信息，使用地图中心点
        centerLat = this.mapConfig.latitude;
        centerLng = this.mapConfig.longitude;
        latRange = 0.02;
        lngRange = 0.02;
      }
      
      for (let i = 0; i < count; i++) {
        const index = startIndex + i
        this.mapPoints.push({
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
        })
      }
      
      // 模拟分页，设置hasMoreData为true，允许持续加载
      this.hasMoreData = true
      
      // 保存当前分类的数据
      this.categoryData[this.activeCategory] = [...this.mapPoints];
      this.categoryPages[this.activeCategory] = this.currentPage;
      
      // 确保更新地图标记
      this.$nextTick(() => {
        this.updateMapMarkers();
      });
    },
    
    // 根据分类获取标记图标
    getMarkerIconByCategory(category) {
      // 使用相对路径，确保图片能正确加载
      const iconMap = {
        'all': '/static/marker.png',
        'hot': '/static/marker.png', // 如果有不同的图标
        'exhibition': '/static/marker.png',
        'personal': '/static/marker.png'
      };
      return iconMap[category] || '/static/marker.png';
    },
    
    // 更新地图标记点
    updateMapMarkers() {
      if (!this.mapPoints || this.mapPoints.length === 0) {
        this.mapConfig.markers = [];
        return;
      }
      
      const markers = this.mapPoints.map((point, index) => {
        return {
          id: index,
          latitude: point.location.coordinates[1],
          longitude: point.location.coordinates[0],
          // 根据当前分类使用不同颜色的三角形图标
          iconPath: this.getMarkerIconByCategory(this.activeCategory),
          width: 24,
          height: 24,
          customData: {
            pointId: point._id,
            name: point.name,
            index: index
          },
          callout: {
            content: point.name,
            color: '#000000',
            fontSize: 12,
            borderRadius: 4,
            padding: 5,
            display: 'BYCLICK'
          }
        }
      });
      
      this.mapConfig.markers = markers;
      console.log(`已更新 ${markers.length} 个三角形标记点`);
    },
    
    // 处理拖拽开始
    handleDragStart(e) {
      this.isDragging = true
      this.dragStartY = e.touches[0].clientY
      this.dragStartHeight = this.contentHeight
    },
    
    // 处理拖拽中
    handleDrag(e) {
      if (!this.isDragging) return
      
      const currentY = e.touches[0].clientY
      const deltaY = this.dragStartY - currentY
      
      // 计算新的内容区域高度
      let newHeight = this.dragStartHeight + deltaY
      
      // 限制高度范围
      newHeight = Math.max(
        this.minContentHeight, 
        Math.min(this.maxContentHeight, newHeight)
      )
      
      this.contentHeight = newHeight
    },
    
    // 处理拖拽结束
    handleDragEnd() {
      this.isDragging = false
      
      // 添加边界吸附效果，三个状态：只显示搜索框、中间状态、最大高度
      const range = this.maxContentHeight - this.minContentHeight
      const snapThresholds = {
        min: this.minContentHeight + range * LAYOUT_CONFIG.SNAP_THRESHOLD_LOW,
        max: this.minContentHeight + range * LAYOUT_CONFIG.SNAP_THRESHOLD_HIGH
      }
      
      let newHeight
      if (this.contentHeight < snapThresholds.min) {
        // 靠近最小高度，吸附到只显示搜索框的状态
        newHeight = this.minContentHeight
      } else if (this.contentHeight < snapThresholds.max) {
        // 中间状态，吸附到屏幕的1/3
        newHeight = this.screenHeight * LAYOUT_CONFIG.INITIAL_CONTENT_RATIO
      } else {
        // 靠近最大高度，吸附到最大高度
        newHeight = this.maxContentHeight
      }
      
      // 设置高度
      this.contentHeight = newHeight
    },
    
    // 处理分类切换
    handleCategoryChange(categoryId) {
      // 确保categoryData和categoryPages已初始化
      if (!this.categoryData) this.categoryData = {};
      if (!this.categoryPages) this.categoryPages = {};
      
      // 保存当前分类的数据和分页状态
      this.categoryData[this.activeCategory] = [...this.mapPoints];
      this.categoryPages[this.activeCategory] = this.currentPage;
      
      // 更新活跃分类
      this.activeCategory = categoryId;
      
      // 如果已有该分类的数据，则恢复
      if (this.categoryData[categoryId] && this.categoryData[categoryId].length > 0) {
        this.mapPoints = [...this.categoryData[categoryId]];
        this.currentPage = this.categoryPages[categoryId] || 1;
        this.updateMapMarkers();
      } else {
        // 否则重新获取数据
        this.currentPage = 1;
        this.fetchMapData();
      }
    },
    
    // 搜索输入处理
    onShow() {
      // 如果没有数据，重新获取
      if (this.mapPoints.length === 0) {
        this.currentPage = 1
        this.fetchMapData()
      }
    },
    onSearchInput(e) {
      const searchText = e.detail.value
      // 处理搜索逻辑
      console.log('搜索:', searchText)
    },
    
    // 加载更多内容
    loadMoreItems() {
      if (this.isLoading || !this.hasMoreData) {
        console.log('跳过加载更多: isLoading =', this.isLoading, 'hasMoreData =', this.hasMoreData);
        return;
      }
      
      // 显示加载提示
      uni.showToast({
        title: '加载更多数据...',
        icon: 'loading',
        duration: 500
      });
      
      // 检查是否有缓存的数据
      if (this.hasNewCachedData && this.cachedMapPoints.length > 0) {
        console.log('使用缓存的数据');
        this.isLoading = true;
        
        // 检查是否有重复数据
        const existingIds = new Set(this.mapPoints.map(p => p._id));
        const uniqueNewData = this.cachedMapPoints.filter(item => !existingIds.has(item._id));
        
        if (uniqueNewData.length > 0) {
          // 将缓存的数据添加到显示的数据中
          this.mapPoints = [...this.mapPoints, ...uniqueNewData];
          console.log(`从缓存加载了 ${uniqueNewData.length} 个新点位`);
          
          // 清空缓存
          this.cachedMapPoints = [];
          this.hasNewCachedData = false;
          
          // 更新地图标记
          this.updateMapMarkers();
        } else {
          console.log('缓存中没有新的点位数据，尝试获取更多数据');
          
          // 缓存中没有新数据，尝试获取更多数据而不是直接设置 hasMoreData = false
          this.currentPage++;
          console.log('加载更多数据，当前页码：', this.currentPage);
          
          // 优先使用地图边界数据加载
          if (this.mapBounds) {
            console.log('使用边界查询加载更多数据');
            this.fetchMapDataByBounds(true); // 传入 true 表示这是加载更多操作
            return; // 提前返回，避免执行下面的 isLoading = false
          } else {
            console.log('使用普通查询加载更多数据');
            this.fetchMapData(true); // 传入 true 表示这是加载更多操作
            return; // 提前返回，避免执行下面的 isLoading = false
          }
        }
        
        this.isLoading = false;
      } else {
        // 如果没有缓存的数据，则正常加载更多
        this.currentPage++;
        console.log('加载更多数据，当前页码：', this.currentPage);
        
        // 优先使用地图边界数据加载
        if (this.mapBounds) {
          console.log('使用边界查询加载更多数据');
          this.fetchMapDataByBounds(true); // 传入 true 表示这是加载更多操作
        } else {
          console.log('使用普通查询加载更多数据');
          this.fetchMapData(true); // 传入 true 表示这是加载更多操作
        }
      }
    },
    
    // 处理卡片点击
    handleCardTap(index) {
      console.log('卡片点击:', index);
      
      if (this.mapPoints[index] && this.mapPoints[index].location) {
        const point = this.mapPoints[index];
        const coordinates = point.location.coordinates;
        
        // 将地图中心移动到对应的标记点
        this.mapConfig.latitude = coordinates[1];
        this.mapConfig.longitude = coordinates[0];
        
        // 显示提示信息
        uni.showToast({
          title: `定位到: ${point.name}`,
          icon: 'none',
          duration: 2000
        });
        
        // 可选：触发地图标记的callout显示
        this.$nextTick(() => {
          // 这里可以添加额外的地图交互逻辑
          console.log(`地图已定位到: ${point.name}`);
        });
      }
    },
    
    // 处理可视卡片变化
    handleVisibleCardsChange(visibleIndices) {
      this.visibleCardIndices = visibleIndices;
      this.updateMapMarkers(); // 更新地图标记点
    },
    
    // 获取用户位置
    // 修改getUserLocation方法
    async getUserLocation() {
      try {
        const res = await uni.getLocation({ 
          type: 'wgs84',
          isHighAccuracy: true
        });
        
        // 更新地图中心点
        this.mapConfig.latitude = res.latitude;
        this.mapConfig.longitude = res.longitude;
        
        console.log('定位成功:', res.latitude, res.longitude);
        
        // 不在这里调用fetchMapData，等待地图区域变化事件
        
        return res;
      } catch (error) {
        console.error('定位失败，使用默认位置:', error);
        // 使用成都市中心作为默认位置
        this.mapConfig.latitude = 30.572269;
        this.mapConfig.longitude = 104.066541;
        // 不在这里调用fetchMapData
        throw error;
      }
    },
    
    // 修改fetchMapData方法
    fetchMapData() {
      // 优先使用边界查询
      if (this.mapBounds) {
        console.log('有边界信息，使用边界查询');
        this.fetchMapDataByBounds();
        return;
      }
      
      console.log('没有边界信息，生成边界内测试数据');
      // 如果没有边界信息，生成基于当前地图中心的测试数据
      this.addTestData();
    },
    
    // 初始加载数据 - 使用边界查询
    fetchInitialMapDataByBounds() {
      // 检查是否有边界信息
      if (!this.mapBounds) {
        console.error('没有地图边界信息，使用普通查询');
        this.fetchInitialMapData();
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
      
      uni.request({
        url: MONGO_CONFIG.API_URL,
        method: 'GET',
        data: params,
        success: (res) => {
          const responseData = res.data && res.data.data ? res.data.data : 
                          (Array.isArray(res.data) ? res.data : []);
          
          if (res.statusCode === 200 && responseData && responseData.length > 0) {
            // 处理数据
            const newData = responseData.map(item => ({
              ...item,
              _id: item._id || item.id || `id_${Date.now()}_${Math.random()}`,
              name: item.name || item.title || `地点 ${Math.floor(Math.random() * 1000)}`,
              author: item.author || '未知作者',
            }));
            
            // 直接替换现有数据，并更新地图标记
            this.mapPoints = newData;
            console.log(`初始加载成功，获取到 ${newData.length} 个点位`);
            
            // 确保更新地图标记
            this.$nextTick(() => {
              this.updateMapMarkers();
            });
          } else {
            console.log('没有获取到点位数据，尝试添加测试数据');
            this.addTestData();
          }
        },
        fail: (err) => {
          console.error('初始边界查询失败:', err);
          this.addTestData();
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    },
    
    // 初始加载数据（不使用边界）
    fetchInitialMapData() {
      this.isLoading = true;
      
      // 构建API请求参数，使用当前地图中心点
      const params = {
        page: this.currentPage,
        pageSize: this.pageSize,
        lat: this.mapConfig.latitude,
        lng: this.mapConfig.longitude,
        radius: 5000 // 5公里范围内的点
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
      
      uni.request({
        url: MONGO_CONFIG.API_URL,
        method: 'GET',
        data: params,
        success: (res) => {
          const responseData = res.data && res.data.data ? res.data.data : 
                          (Array.isArray(res.data) ? res.data : []);
          
          if (res.statusCode === 200 && responseData && responseData.length > 0) {
            // 处理数据
            const newData = responseData.map(item => ({
              ...item,
              _id: item._id || item.id || `id_${Date.now()}_${Math.random()}`,
              name: item.name || item.title || `地点 ${Math.floor(Math.random() * 1000)}`,
              author: item.author || '未知作者',
            }));
            
            // 这是初始加载，直接替换数据
            this.mapPoints = newData;
            
            // 保存当前分类的数据
            if (!this.categoryData) this.categoryData = {};
            if (!this.categoryPages) this.categoryPages = {};
            this.categoryData[this.activeCategory] = [...this.mapPoints];
            this.categoryPages[this.activeCategory] = this.currentPage;
            
            // 更新地图标记
            this.updateMapMarkers();
            
            console.log(`初始加载成功，显示 ${newData.length} 个点位`);
          } else {
            console.log('初始加载数据为空，使用测试数据');
            this.addTestData();
            
            this.$nextTick(() => {
              this.updateMapMarkers();
            });
          }
        },
        fail: (err) => {
          console.error('初始加载失败:', err);
          this.addTestData();
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    },
    
    // 地图区域变化处理
    onMapRegionChanged(bounds) {
      console.log('接收到地图区域变化:', bounds);
      
      // 验证边界数据
      if (!bounds || !bounds.northeast || !bounds.southwest) {
        console.error('无效的边界数据:', bounds);
        return;
      }
      
      this.mapBounds = bounds;
      this.currentMapScale = bounds.scale || 16;
      
      // 清除之前的定时器
      if (this.regionChangeTimer) {
        clearTimeout(this.regionChangeTimer);
      }
      
      // 使用单一定时器，确保只在用户停止操作后执行一次
      this.regionChangeTimer = setTimeout(() => {
        console.log('开始根据新区域获取数据');
        this.currentPage = 1; // 重置页码
        // 只获取数据到缓存，不立即显示
        this.fetchMapDataToCache();
      }, 1000); // 增加延迟时间到1000ms
    },
    
    // 根据地图边界获取数据
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
      
      // 添加更详细的日志
      console.log('边界查询参数详情：', {
        northeast: this.mapBounds.northeast,
        southwest: this.mapBounds.southwest,
        page: this.currentPage,
        pageSize: this.pageSize,
        category: this.activeCategory !== 'all' ? params.category : 'all'
      });
      
      uni.request({
        url: MONGO_CONFIG.API_URL,
        method: 'GET',
        data: params,
        success: (res) => {
          const responseData = res.data && res.data.data ? res.data.data : 
                          (Array.isArray(res.data) ? res.data : []);
          
          if (res.statusCode === 200 && responseData && responseData.length > 0) {
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
                // 扩大搜索范围，而不是设置 hasMoreData = false
                this.expandSearchBounds();
                return; // 提前返回，避免更新地图标记
              }
            } else {
              // 如果不是加载更多，则不更新地图点位
              console.log(`边界查询成功，但不立即显示，等待瀑布流下滑加载`);
            }
            
            // 打印采样信息（如果有）
            if (res.data.densityInfo) {
              console.log('密度信息:', res.data.densityInfo);
            }
            if (res.data.queryType === 'grid_sample') {
              console.log('使用了网格采样方法获取均匀分布的点位');
            }
          } else {
            console.log('没有获取到点位数据，尝试扩大搜索范围');
            if (isLoadMore) {
              // 扩大搜索范围，而不是设置 hasMoreData = false
              this.expandSearchBounds();
              return; // 提前返回，避免更新地图标记
            }
          }
          
          // 更新地图标记
          if (isLoadMore) {
            this.updateMapMarkers();
          }
        },
        fail: (err) => {
          console.error('获取数据失败:', err);
          uni.showToast({
            title: '获取数据失败',
            icon: 'none'
          });
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    },
    
    // 获取数据到缓存，但不立即显示
    fetchMapDataToCache() {
      // 检查是否有边界信息
      if (!this.mapBounds) {
        console.error('没有地图边界信息，无法获取数据');
        return;
      }
      
      // 先清空缓存数据
      this.cachedMapPoints = [];
      this.hasNewCachedData = false;
      console.log('地图视线变化，已清空缓存数据');
      
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
      
      // 添加更详细的日志
      console.log('边界查询参数详情：', {
        northeast: this.mapBounds.northeast,
        southwest: this.mapBounds.southwest,
        page: this.currentPage,
        pageSize: this.pageSize,
        category: this.activeCategory !== 'all' ? params.category : 'all'
      });
      
      uni.request({
        url: MONGO_CONFIG.API_URL,
        method: 'GET',
        data: params,
        success: (res) => {
          const responseData = res.data && res.data.data ? res.data.data : 
                          (Array.isArray(res.data) ? res.data : []);
          
          if (res.statusCode === 200 && responseData && responseData.length > 0) {
            // 处理数据
            const newData = responseData.map(item => ({
              ...item,
              _id: item._id || item.id || `id_${Date.now()}_${Math.random()}`,
              name: item.name || item.title || `地点 ${Math.floor(Math.random() * 1000)}`,
              author: item.author || '未知作者',
            }));
            
            // 将新数据存储到缓存中，但不立即显示
            this.cachedMapPoints = newData;
            console.log(`已缓存 ${newData.length} 个新点位，等待瀑布流下滑加载`);
            
            // 设置标志，表示有新数据可以加载
            this.hasNewCachedData = true;
          } else {
            console.log('当前视图内没有获取到新的点位数据，尝试获取更远位置的数据');
            
            // 尝试扩大搜索范围获取更远位置的数据
            this.tryFetchDataWithExpandedBounds();
          }
        },
        fail: (err) => {
          console.error('获取数据失败:', err);
          uni.showToast({
            title: '获取数据失败',
            icon: 'none'
          });
        },
        complete: () => {
          // 不设置 isLoading = false，因为我们不想触发UI更新
        }
      });
    },
    
    // 尝试使用扩大的边界获取数据到缓存
    tryFetchDataWithExpandedBounds() {
      if (!this.mapBounds) {
        console.error('没有地图边界信息，无法扩大搜索范围');
        return;
      }
      
      console.log('尝试扩大搜索范围获取更远位置的数据到缓存');
      
      // 扩大搜索范围的系数，每次扩大 20%
      const expandFactor = 0.2;
      
      // 计算当前边界的宽度和高度
      const latDiff = this.mapBounds.northeast.latitude - this.mapBounds.southwest.latitude;
      const lngDiff = this.mapBounds.northeast.longitude - this.mapBounds.southwest.longitude;
      
      // 扩大边界
      const expandedBounds = {
        northeast: {
          latitude: this.mapBounds.northeast.latitude + latDiff * expandFactor,
          longitude: this.mapBounds.northeast.longitude + lngDiff * expandFactor
        },
        southwest: {
          latitude: this.mapBounds.southwest.latitude - latDiff * expandFactor,
          longitude: this.mapBounds.southwest.longitude - lngDiff * expandFactor
        }
      };
      
      // 保存原始边界
      const originalBounds = this.mapBounds;
      
      // 临时更新边界
      this.mapBounds = expandedBounds;
      
      // 构建API请求参数
      const params = {
        page: 1, // 从第一页开始
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
      
      console.log('扩大边界查询参数：', params);
      
      uni.request({
        url: MONGO_CONFIG.API_URL,
        method: 'GET',
        data: params,
        success: (res) => {
          // 恢复原始边界
          this.mapBounds = originalBounds;
          
          const responseData = res.data && res.data.data ? res.data.data : 
                          (Array.isArray(res.data) ? res.data : []);
          
          if (res.statusCode === 200 && responseData && responseData.length > 0) {
            // 处理数据
            const newData = responseData.map(item => ({
              ...item,
              _id: item._id || item.id || `id_${Date.now()}_${Math.random()}`,
              name: item.name || item.title || `地点 ${Math.floor(Math.random() * 1000)}`,
              author: item.author || '未知作者',
            }));
            
            // 检查是否有重复数据（与当前显示的数据比较）
            const existingIds = new Set(this.mapPoints.map(p => p._id));
            const uniqueNewData = newData.filter(item => !existingIds.has(item._id));
            
            if (uniqueNewData.length > 0) {
              // 将新数据存储到缓存中，但不立即显示
              this.cachedMapPoints = uniqueNewData;
              console.log(`已缓存 ${uniqueNewData.length} 个更远位置的点位，等待瀑布流下滑加载`);
              
              // 设置标志，表示有新数据可以加载
              this.hasNewCachedData = true;
            } else {
              console.log('扩大搜索范围后仍未获取到新的点位数据');
              this.hasNewCachedData = false;
            }
          } else {
            console.log('扩大搜索范围后仍未获取到点位数据');
            this.hasNewCachedData = false;
          }
        },
        fail: (err) => {
          // 恢复原始边界
          this.mapBounds = originalBounds;
          
          console.error('获取扩大范围数据失败:', err);
        },
        complete: () => {
          // 不设置 isLoading = false，因为我们不想触发UI更新
        }
      });
    },
    
    // 添加在边界内生成测试数据的方法
    generateTestDataInBounds(isLoadMore = false) {
      if (!this.mapBounds) {
        console.log('没有边界信息，无法生成测试数据');
        return;
      }
      
      console.log('在边界内生成测试数据');
      
      // 如果不是加载更多且是第一页，重置数据；否则保留现有数据
      if (!isLoadMore && this.currentPage === 1) {
        this.mapPoints = [];
      }
      
      const count = 10;
      const startIndex = this.mapPoints.length;
      const { northeast, southwest } = this.mapBounds;
      
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
      
      // 计算边界中心点和范围
      const centerLat = (northeast.latitude + southwest.latitude) / 2;
      const centerLng = (northeast.longitude + southwest.longitude) / 2;
      const latRange = northeast.latitude - southwest.latitude;
      const lngRange = northeast.longitude - southwest.longitude;
      
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
  }
}
</script>

<style>
/* 全局样式 */
.container {
  position: relative;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background-color: #f0f0f0;
}
</style>
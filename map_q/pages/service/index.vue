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
      :min-content-height="minVisibleHeight"
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
import { LAYOUT_CONFIG } from '../index/constants/layoutConfig.js'
// 导入MongoDB配置
import { MONGO_CONFIG } from '../../utils/db.js'
// 导入组件
import MapBackground from '../../components/map/MapBackground.vue'
import ContentArea from '../../components/content/ContentArea.vue'

// 服务页面布局配置常量
const SERVICE_LAYOUT_CONFIG = {
  // 内容区域初始高度比例（屏幕高度的2/3）
  INITIAL_CONTENT_RATIO: 0.67,
  
  // 内容区域最大高度比例（屏幕高度的2/3）
  MAX_CONTENT_RATIO: 0.67,
  
  // 内容区域最小高度比例（屏幕高度的1/3）
  MIN_CONTENT_RATIO: 0.33,
  
  // 内容区域最小显示高度（只显示搜索框）
  MIN_VISIBLE_RATIO: 0.08,
  
  // 边距
  MARGIN: 10,
  
  // 吸附阈值（低）
  SNAP_THRESHOLD_LOW: 0.2,
  
  // 吸附阈值（中）
  SNAP_THRESHOLD_MID: 0.5,
  
  // 吸附阈值（高）
  SNAP_THRESHOLD_HIGH: 0.7
}

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
        markers: [],
        scale: 18  // 添加初始缩放级别，设置为18以显示更详细的街区
      },
      
      // 分类数据
      categories: [
        { id: 'all', name: '全部服务', active: true },
        { id: 'repair', name: '维修服务', active: false },
        { id: 'clean', name: '清洁服务', active: false },
        { id: 'delivery', name: '配送服务', active: false }
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
      mapBounds: null,
      
      // 添加分页相关数据
      currentPage: 1,
      pageSize: 10,
      hasMoreData: true,
      
      // 为每个分类保存数据和分页状态
      categoryData: {},
      categoryPages: {},
      
      // 地图标记图标
      markerIcon: '/static/marker.png',
      
      // 不同分类的标记图标
      markerIcons: {
        'all': '/static/marker.png',
        'repair': '/static/marker.png',
        'clean': '/static/marker.png',
        'delivery': '/static/marker.png'
      },
      
      // 存储可视区域内的卡片索引
      visibleCardIndices: []
    }
  },
  
  computed: {
    // 计算地图高度
    mapHeight() {
      return this.screenHeight - this.contentHeight
    },
    
    // 最小内容高度（屏幕的1/3）
    minContentHeight() {
      return this.screenHeight * SERVICE_LAYOUT_CONFIG.MIN_CONTENT_RATIO
    },
    
    // 最小可见高度（只显示搜索框）
    minVisibleHeight() {
      return this.screenHeight * SERVICE_LAYOUT_CONFIG.MIN_VISIBLE_RATIO
    },
    
    // 最大内容高度（屏幕的2/3）
    maxContentHeight() {
      return this.screenHeight * SERVICE_LAYOUT_CONFIG.MAX_CONTENT_RATIO
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
    // 加载初始数据
    loadInitialData() {
      console.log('加载初始数据');
      this.currentPage = 1;
      
      // 如果有地图边界信息，使用边界查询
      if (this.mapBounds) {
        this.fetchMapDataByBounds();
      } else {
        // 否则使用普通查询
        this.fetchMapData();
      }
    },
    
    // 初始化布局
    initLayout() {
      // 使用推荐的新API替换已弃用的uni.getSystemInfoSync
      const systemInfo = uni.getWindowInfo()
      this.screenHeight = systemInfo.windowHeight
      
      // 设置初始内容高度为屏幕的2/3
      this.contentHeight = this.screenHeight * SERVICE_LAYOUT_CONFIG.INITIAL_CONTENT_RATIO
      
      // 设置搜索框高度（固定值）
      this.searchBoxHeight = 50
    },
    
    // 从MongoDB获取数据
    fetchMapData(isLoadMore = false) {
      this.isLoading = true;
      
      // 确保categoryData和categoryPages已初始化
      if (!this.categoryData) this.categoryData = {};
      if (!this.categoryPages) this.categoryPages = {};
      
      // 构建API请求参数，使用当前地图中心点
      const params = {
        page: this.currentPage,
        pageSize: this.pageSize,
        lat: this.mapConfig.latitude,
        lng: this.mapConfig.longitude,
        radius: 5000, // 5公里范围内的点
        type: 'service' // 指定获取服务类型的数据
      };
      
      // 如果有分类筛选
      if (this.activeCategory !== 'all') {
        // 映射前端分类ID到后端分类名称
        const categoryMap = {
          'repair': '维修服务',
          'clean': '清洁服务',
          'delivery': '配送服务'
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
              name: item.name || item.title || `服务 ${Math.floor(Math.random() * 1000)}`,
              author: item.author || '未知提供商',
            }));
            
            // 如果是加载更多，追加数据；否则替换数据
            if (isLoadMore) {
              this.mapPoints = [...this.mapPoints, ...newData];
            } else {
              this.mapPoints = newData;
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
    
    // 根据地图边界获取数据
    fetchMapDataByBounds(isLoadMore = false) {
      if (!this.mapBounds) {
        console.error('没有地图边界信息，无法获取数据');
        this.fetchMapData(isLoadMore);
        return;
      }
      
      this.isLoading = true;
      
      // 构建API请求参数
      const params = {
        page: this.currentPage,
        pageSize: this.pageSize,
        ne_lat: this.mapBounds.northeast.latitude,
        ne_lng: this.mapBounds.northeast.longitude,
        sw_lat: this.mapBounds.southwest.latitude,
        sw_lng: this.mapBounds.southwest.longitude,
        type: 'service' // 指定获取服务类型的数据
      };
      
      // 如果有分类筛选
      if (this.activeCategory !== 'all') {
        // 映射前端分类ID到后端分类名称
        const categoryMap = {
          'repair': '维修服务',
          'clean': '清洁服务',
          'delivery': '配送服务'
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
              name: item.name || item.title || `服务 ${Math.floor(Math.random() * 1000)}`,
              author: item.author || '未知提供商',
            }));
            
            // 如果是加载更多，追加数据；否则替换数据
            if (isLoadMore) {
              this.mapPoints = [...this.mapPoints, ...newData];
            } else {
              this.mapPoints = newData;
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
    
    // 添加测试数据
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
        case 'repair':
          prefix = '维修'
          addressPrefix = '成都市锦江区'
          break
        case 'clean':
          prefix = '清洁'
          addressPrefix = '成都市高新区'
          break
        case 'delivery':
          prefix = '配送'
          addressPrefix = '成都市武侯区'
          break
        default:
          prefix = '全部'
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
          name: `${prefix}服务 ${index + 1}`,
          author: `服务商${Math.floor(Math.random() * 1000)}`,
          address: `${addressPrefix}测试地址 ${index + 1}`,
          description: `这是一个${prefix}服务测试描述 ${index + 1}`,
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
          iconPath: this.markerIcon,
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
        this.minVisibleHeight, // 修改这里，使用minVisibleHeight而不是minContentHeight
        Math.min(this.maxContentHeight, newHeight)
      )
      
      this.contentHeight = newHeight
    },
    
    // 处理拖拽结束
    handleDragEnd() {
      this.isDragging = false
      
      // 添加边界吸附效果，三个状态：只显示搜索框、1/3高度和2/3高度
      const range = this.maxContentHeight - this.minVisibleHeight
      const snapThresholds = {
        min: this.minVisibleHeight + range * SERVICE_LAYOUT_CONFIG.SNAP_THRESHOLD_LOW,
        mid: this.minVisibleHeight + range * SERVICE_LAYOUT_CONFIG.SNAP_THRESHOLD_MID,
        max: this.minVisibleHeight + range * SERVICE_LAYOUT_CONFIG.SNAP_THRESHOLD_HIGH
      }
      
      let newHeight
      if (this.contentHeight < snapThresholds.min) {
        // 靠近最小高度，吸附到只显示搜索框的状态
        newHeight = this.minVisibleHeight
      } else if (this.contentHeight < snapThresholds.mid) {
        // 靠近1/3高度，吸附到1/3
        newHeight = this.minContentHeight
      } else {
        // 靠近最大高度，吸附到2/3
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
    onSearchInput(e) {
      const searchText = e.detail.value
      // 处理搜索逻辑
      console.log('搜索:', searchText)
    },
    
    // 加载更多内容
    loadMoreItems() {
      if (this.isLoading || !this.hasMoreData) {
        return;
      }
      
      // 显示加载提示
      uni.showToast({
        title: '加载更多数据...',
        icon: 'loading',
        duration: 500
      });
      
      // 加载更多数据
      this.currentPage++;
      
      // 优先使用地图边界数据加载
      if (this.mapBounds) {
        this.fetchMapDataByBounds(true);
      } else {
        this.fetchMapData(true);
      }
    },
    
    // 处理卡片点击
    handleCardTap(index) {
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
      }
    },
    
    // 处理可视卡片变化
    handleVisibleCardsChange(visibleIndices) {
      this.visibleCardIndices = visibleIndices;
    },
    
    // 获取用户位置
    async getUserLocation() {
      try {
        const res = await uni.getLocation({ 
          type: 'wgs84',
          isHighAccuracy: true
        });
        
        // 更新地图中心点
        this.mapConfig.latitude = res.latitude;
        this.mapConfig.longitude = res.longitude;
        
        return res;
      } catch (error) {
        console.error('定位失败，使用默认位置:', error);
        // 使用成都市中心作为默认位置
        this.mapConfig.latitude = 30.572269;
        this.mapConfig.longitude = 104.066541;
        throw error;
      }
    },
    
    // 地图区域变化事件处理
    onMapRegionChanged(bounds) {
      this.mapBounds = bounds;
    }
  }
}
</script>

<style>
.container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
</style>
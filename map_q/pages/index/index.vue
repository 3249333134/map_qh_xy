<template>
  <view class="container">
    <!-- 地图区域 -->    
    <map-background 
      :height="mapHeight"
      :config="mapConfig"
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
      
      // 地图标记图标
      markerIcon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAACXBIWXMAAAsTAAALEwEAmpwYAAABYUlEQVR4nO2WTU7DMBCFn1MWLFjAgiVwAXpAuQFIlQBxCm7AFVBvAKdAIIEQl+AG3IBFJdh0gdjAJKpjOXE6tuNIeNJIkezzm/GMx07TlFJKCTgGboEp8AK8Am/ANzADHoEBcAKsNQYFjoA7/3FRfAD3wEkdyB7w5AP9AkNgF9gGVoCWf7YJdIBz4AT48nMegH3gIIQsA8bAErj0L1+PmNcCzv28JXBVFboLvPuAgyqgOYCBn/8GdIvAu8DCTx5UBcwBDX3OBbBTBL31k0YxkDmgkc+7zYMe+kmPdUBzQGOf+5QFPfeTbuqEZkBvs6Cz/4AWgU6KQP/jqkeBTouKqwx0XgV6HgOdVYGeRkGBTQNHLQp0JxYa7eoYaK8KtB8LHRSBDmOggxjosAg0z1UPgfZioP0i0H4MtFcG2jNwVKKgHQNHLQraMXDUoqAdA0fNwFGLgnYMHLUoaMfAUfsF9Qx5K6QhOhIAAAAASUVORK5CYII='
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
    this.initLayout()
    this.fetchMapData()
  },
  
  methods: {
    // 初始化布局
    initLayout() {
      const systemInfo = uni.getSystemInfoSync()
      this.screenHeight = systemInfo.windowHeight
      
      // 设置初始内容高度
      this.contentHeight = this.screenHeight * LAYOUT_CONFIG.INITIAL_CONTENT_RATIO
      
      // 设置搜索框高度（固定值）
      this.searchBoxHeight = 50
    },
    
    // 从MongoDB获取数据
    fetchMapData() {
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
        radius: 5000 // 5公里范围内的点
      };
      
      // 如果有分类筛选
      if (this.activeCategory !== 'all') {
        params.category = this.activeCategory;
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
            // 使用处理后的数据
            const newData = responseData;
            
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
    
    // 添加测试数据
    addTestData() {
      // 如果是第一页，重置数据；否则保留现有数据
      if (this.currentPage === 1) {
        this.mapPoints = []
      }
      
      const count = 10 // 每个分类10条数据
      const startIndex = this.mapPoints.length // 从当前数据长度开始
      
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
      
      for (let i = 0; i < count; i++) {
        const index = startIndex + i
        this.mapPoints.push({
          _id: `${this.activeCategory}_${this.currentPage}_${i}_${Date.now()}`, // 确保ID唯一
          name: `${prefix}地点 ${index + 1}`,
          author: `用户${Math.floor(Math.random() * 1000)}`,
          address: `${addressPrefix}测试地址 ${index + 1}`,
          description: `这是一个${prefix}测试描述 ${index + 1}`,
          location: {
            type: 'Point',
            coordinates: [104.066801 + (Math.random() * 0.1 - 0.05), 30.572815 + (Math.random() * 0.1 - 0.05)]
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
        return
      }
      
      const markers = this.mapPoints.map((point, index) => {
        return {
          id: index,
          latitude: point.location.coordinates[1],
          longitude: point.location.coordinates[0],
          // 使用Base64编码的图片
          iconPath: this.markerIcon,
          width: 30,
          height: 30,
          callout: {
            content: point.title,
            color: '#000000',
            fontSize: 12,
            borderRadius: 4,
            padding: 5,
            display: 'BYCLICK'
          }
        }
      })
      
      this.mapConfig.markers = markers
      
      // 如果有数据，将地图中心设置为第一个点的位置
      if (markers.length > 0) {
        this.mapConfig.latitude = markers[0].latitude
        this.mapConfig.longitude = markers[0].longitude
      }
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
      if (this.isLoading) return
      
      this.currentPage++
      
      // 显示加载提示
      uni.showToast({
        title: '加载更多数据...',
        icon: 'loading',
        duration: 500 // 减少提示时间
      })
      
      // 延迟一点执行，让加载动画有时间显示
      setTimeout(() => {
        this.fetchMapData()
      }, 300)
    },
    
    // 处理卡片点击
    handleCardTap(index) {
      console.log('卡片点击:', index)
      // 这里可以添加导航到详情页的逻辑
      uni.showToast({
        title: `点击了卡片 ${index + 1}`,
        icon: 'none'
      })
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
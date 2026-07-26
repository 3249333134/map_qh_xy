<template>
  <view class="favorite-module">
    <!-- 顶部占位白框 -->
    <view class="top-spacer"></view>
    
    <!-- 分类选择器 -->
    <view class="category-tabs">
      <view 
        v-for="category in categories" 
        :key="category.key"
        class="category-item"
        :class="{ active: activeCategory === category.key }"
        @click="switchCategory(category.key)"
      >
        <text class="category-icon">{{ category.icon }}</text>
        <text class="category-name">{{ category.name }}</text>
      </view>
    </view>
    
    <!-- 瀑布流收藏列表 -->
    <scroll-view class="favorite-list" scroll-y @scrolltolower="onLoadMore" @scroll="onScroll">
      <view v-if="currentCategoryItems.length === 0" class="no-items">
        <text class="no-items-text">暂无{{ getCurrentCategoryName() }}内容</text>
      </view>
      
      <!-- 瀑布流网格布局 -->
      <view v-else class="cards-grid">
        <!-- 左列卡片 -->
        <view class="cards-column">
          <view v-for="(item, index) in leftColumnItems" :key="index" class="card-wrapper">
            <ServiceCardItem
              v-if="isServiceItem(item)"
              :height="getCardHeight(item, index)"
              column-type="left"
              :index="index"
              :card-data="item"
              @media-tap="openServiceDetail"
              @content-tap="openServiceDetail"
              @reserve="handleReserveService"
            />
            <CardItem
              v-else
              :height="getCardHeight(item, index)"
              column-type="left"
              :index="index"
              :card-data="item"
              @media-tap="openDetail"
              @content-tap="openDetail"
            />
          </view>
        </view>
        
        <!-- 右列卡片 -->
        <view class="cards-column">
          <view v-for="(item, index) in rightColumnItems" :key="index" class="card-wrapper">
            <ServiceCardItem
              v-if="isServiceItem(item)"
              :height="getCardHeight(item, index)"
              column-type="right"
              :index="index"
              :card-data="item"
              @media-tap="openServiceDetail"
              @content-tap="openServiceDetail"
              @reserve="handleReserveService"
            />
            <CardItem
              v-else
              :height="getCardHeight(item, index)"
              column-type="right"
              :index="index"
              :card-data="item"
              @media-tap="openDetail"
              @content-tap="openDetail"
            />
          </view>
        </view>
      </view>
      
      <!-- 加载更多提示 -->
      <view class="loading-more" v-if="isLoading">
        <text>加载中...</text>
      </view>

      <!-- 底部安全占位，避免被自定义 TabBar 遮挡 -->
      <view class="scroll-bottom-spacer"></view>
    </scroll-view>
  </view>
</template>

<script>
import CardItem from '../../../components/card/CardItem.vue'
import ServiceCardItem from '../../../components/card/ServiceCardItem.vue'
 export default {
   name: 'FavoriteModule',
  components: { CardItem, ServiceCardItem },
   props: {
     favoriteData: {
       type: Object,
       default: () => ({})
     }
   },
   data() {
     return {
       activeCategory: 'all',
       isLoading: false,
       cardHeights: {}, // 存储每个卡片的高度
       categories: [
         { key: 'all', name: '全部', icon: '📋' },
         { key: 'photos', name: '照片', icon: '📷' },
         { key: 'videos', name: '视频', icon: '🎬' },
         { key: 'articles', name: '文章', icon: '📚' },
         { key: 'music', name: '音乐', icon: '🎵' },
         { key: 'locations', name: '地点', icon: '📍' },
         { key: 'services', name: '服务', icon: '🛠️' }
       ],
       // 新增：为每个卡片缓存一次生成的随机位置，确保切换/重渲染后位置稳定
       randomLocations: {}
     }
   },
   computed: {
    // 添加一个计算属性来确保数据格式正确
    normalizedFavoriteData() {
    // 如果 favoriteData 是数组或无效，返回空对象（包含 services）
    if (!this.favoriteData || Array.isArray(this.favoriteData) || typeof this.favoriteData !== 'object') {
      return {
        photos: [],
        videos: [],
        articles: [],
        music: [],
        locations: [],
        services: []
      }
    }
    // 确保缺失的类别存在（包含 services）
    const data = { services: [], photos: [], videos: [], articles: [], music: [], locations: [], ...this.favoriteData }
    return data
  },
  
  currentCategoryItems() {
    const data = this.normalizedFavoriteData
    console.log('normalized favoriteData:', data)
    
    if (this.activeCategory === 'all') {
      const allItems = []
      Object.keys(data).forEach(key => {
        if (Array.isArray(data[key])) {
          allItems.push(...data[key])
        }
      })
      console.log('allItems:', allItems)
      const sorted = allItems.sort((a, b) => {
        const dateA = this.parseDate(a.time)
        const dateB = this.parseDate(b.time)
        return dateB - dateA
      })
      // 新增：为缺少坐标的非服务卡片补充随机位置
      return sorted.map((item, index) => this.ensureRandomLocation(item, index))
    }
    const list = data[this.activeCategory] || []
    // 新增：为缺少坐标的非服务卡片补充随机位置
    return list.map((item, index) => this.ensureRandomLocation(item, index))
  },
    // 左列数据（偶数索引）
    leftColumnItems() {
      return this.currentCategoryItems.filter((_, index) => index % 2 === 0)
    },
    // 右列数据（奇数索引）
    rightColumnItems() {
      return this.currentCategoryItems.filter((_, index) => index % 2 === 1)
    }
  },
  methods: {
    parseDate(dateString) {
      if (!dateString || typeof dateString !== 'string') return new Date(0)
      const normalizedDate = dateString.replace(/-/g, '/')
      return new Date(normalizedDate)
    },
    
    switchCategory(category) {
      this.activeCategory = category
    },
    
    getCurrentCategoryName() {
      const category = this.categories.find(cat => cat.key === this.activeCategory)
      return category ? category.name : ''
    },
    
    // 打开详情页（收藏模块中，点击卡片任意区域都进入详情）
    openDetail({ cardData, index }) {
      try {
        const id = (cardData && (cardData._id || cardData.id)) ? (cardData._id || cardData.id) : ''
        const title = encodeURIComponent((cardData && (cardData.name || cardData.title)) ? (cardData.name || cardData.title) : '')
        const author = encodeURIComponent(cardData && cardData.author ? cardData.author : '')
        const likes = cardData && typeof cardData.likes === 'number' ? cardData.likes : 0
        if (!id) {
          console.warn('收藏卡片缺少 id，仍尝试跳转详情（可能无法加载数据）', cardData)
        }
        uni.navigateTo({
          url: `/pages/detail/index?id=${id}&title=${title}&author=${author}&likes=${likes}`
        })
      } catch (e) {
        console.error('打开详情失败', e)
        uni.showToast({ title: '打开详情失败', icon: 'none' })
      }
    },
    
    // 获取卡片高度（瀑布流效果，单位 rpx）
    getCardHeight(itemId) {
      if (!this.cardHeights[itemId]) {
        // 生成 180~280 rpx 之间的随机高度
        this.cardHeights[itemId] = Math.floor(Math.random() * (280 - 180 + 1)) + 180
      }
      return this.cardHeights[itemId]
    },
     
     // 获取随机颜色
     getRandomColor() {
       const colors = ['#a0c4ff', '#ffb3ba', '#bae1ff', '#ffffba', '#baffc9', '#ffdfba']
       return colors[Math.floor(Math.random() * colors.length)]
     },
     
     // 加载更多
     onLoadMore() {
       if (!this.isLoading) {
         this.isLoading = true
         // 模拟加载更多数据
         setTimeout(() => {
           this.isLoading = false
         }, 1000)
       }
     },

     // 新增：滚动事件，向父组件广播是否在顶部
     onScroll(e) {
       const scrollTop = e && e.detail && typeof e.detail.scrollTop === 'number' ? e.detail.scrollTop : 0
       const isAtTop = scrollTop <= 2
       this.$emit('scroll-state-change', { isAtTop })
     },

     // 判断是否为服务类型收藏项
     isServiceItem(item) {
       if (!item || typeof item !== 'object') return false
       // 仅按显式服务标识判断，避免随机坐标导致误判内容卡片
       if (item.type === 'service') return true
       if (item.category === 'services' || item.category === 'service') return true
       // 如果当前分类就是“服务”，也视为服务卡片
       if (this.activeCategory === 'services') return true
       return false
     },

     // 新增：生成成都区域内的随机坐标（lng, lat）
     getRandomCoordinateInChengdu() {
       const minLat = 30.55, maxLat = 30.75
       const minLng = 104.03, maxLng = 104.15
       const lat = +(minLat + Math.random() * (maxLat - minLat)).toFixed(6)
       const lng = +(minLng + Math.random() * (maxLng - minLng)).toFixed(6)
       return [lng, lat]
     },

     // 新增：随机地址文案（用于展示更友好位置文本）
     getRandomAddress() {
       const addresses = [
         '成都市锦江区春熙路',
         '成都市武侯区科华北路',
         '成都市青羊区顺城大街',
         '成都市高新区天府大道',
         '成都市金牛区一环路北一段'
       ]
       return addresses[Math.floor(Math.random() * addresses.length)]
     },

     // 新增：为卡片补充随机位置（仅在缺少坐标且非服务卡片时生效）
     ensureRandomLocation(item, index) {
       try {
         if (!item || typeof item !== 'object') return item
         // 服务卡片或已有坐标的卡片保持不变
         const isService = this.isServiceItem && this.isServiceItem(item)
         const hasCoords = !!(item.location && Array.isArray(item.location.coordinates) && item.location.coordinates.length === 2)
         if (isService || hasCoords) return item
         // 使用 id 作为稳定键，若无 id 则使用当前分类+索引
         const key = (item._id || item.id) ? (item._id || item.id) : `${this.activeCategory}-${index}`
         if (!this.randomLocations[key]) {
           const coordinates = this.getRandomCoordinateInChengdu()
           this.randomLocations[key] = {
             coordinates,
             address: item.address || this.getRandomAddress()
           }
         }
         const { coordinates, address } = this.randomLocations[key]
         return {
           ...item,
           location: { coordinates },
           address: address
         }
       } catch (e) {
         console.warn('为卡片生成随机位置失败', e, item)
         return item
       }
     },

     // 收藏模块中的服务卡片：点击进入服务详情页（不定位）
      openServiceDetail({ cardData, index }) {
        try {
          const item = cardData || null
          if (!item) {
            uni.showToast({ title: '未找到服务数据', icon: 'none' })
            return
          }
          // 将服务对象写入缓存并通过 eventChannel 传递
          uni.setStorageSync('LAST_SERVICE_ITEM', item)
          uni.navigateTo({
            url: '/pages/service/detail/index',
            success(res) {
              res.eventChannel && res.eventChannel.emit('service-item', { item })
            }
          })
        } catch (e) {
          console.error('打开服务详情失败', e)
          uni.showToast({ title: '打开服务详情失败', icon: 'none' })
        }
      },

     // 保留服务卡片的“预”按钮功能
     handleReserveService({ cardData, index }) {
       const target = cardData || this.allItems[index] || {}
       try { uni.setStorageSync('BOOKING_ITEM', target) } catch (e) {}
       uni.navigateTo({ url: '/pages/booking/index?source=favorites' })
     },

     // 获取卡片高度（瀑布流效果，单位 rpx）- 修正签名
     getCardHeight(item, index) {
       const key = (item && (item._id || item.id)) ? (item._id || item.id) : `${this.activeCategory}-${index}`
       if (!this.cardHeights[key]) {
         // 生成 180~280 rpx 之间的随机高度
         this.cardHeights[key] = Math.floor(Math.random() * (280 - 180 + 1)) + 180
       }
       return this.cardHeights[key]
     }
   }
 }
</script>

<style scoped>
.favorite-module {
  height: 100%;
  background: #f8f8f8;
  touch-action: pan-y;
  user-select: none;
}

/* 顶部占位白框 */
.top-spacer {
  height: 8px; /* 更薄的顶部占位 */
  background: transparent;
  width: 100%;
}

/* 分类选择器样式 - 更紧凑 */
.category-tabs {
  display: flex;
  padding: 2px 10px 4px 10px; /* 压缩上下内边距，使整体更扁 */
  gap: 3px; /* 更紧凑的间距 */
  overflow-x: auto;
  border-bottom: 1px solid #eee;
  background: #fff;
  position: relative;
  z-index: 6;
  min-height: 36px; /* 降低最小高度 */
  margin-bottom: 6px; /* 下方留白更少 */
}

.category-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 2px 6px; /* 更薄的标签 */
  border-radius: 12px; /* 略微减小圆角 */
  background: #f5f5f5;
  min-width: 44px; /* 更紧凑的最小宽度 */
  transition: all 0.2s ease; /* 更轻微的动效 */
  flex-shrink: 0;
  white-space: nowrap;
}

.category-icon {
  font-size: 12px; /* 更小的图标字号 */
  margin-right: 3px;
  margin-bottom: 0;
}

.category-name {
  font-size: 10px; /* 更小的文案字号 */
  color: #666;
  font-weight: 500;
  line-height: 1;
}

.category-item.active {
  background: #007AFF;
  transform: scale(1.02);
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
}

.category-icon {
  font-size: 14px;
  margin-right: 4px;
  margin-bottom: 0;
}

.category-name {
  font-size: 11px;
  color: #666;
  font-weight: 500;
  line-height: 1;
}

.category-item.active .category-icon,
.category-item.active .category-name {
  color: #fff;
}

/* 瀑布流布局样式 */
.favorite-list {
  position: absolute;
  top: 42px; /* 以新的分类栏高度重新对齐 */
  left: 0;
  right: 0;
  bottom: 0;
  overflow-y: auto;
}

.cards-grid {
  display: flex;
  padding: 10px;
  width: 100%;
  box-sizing: border-box;
}

.cards-column {
  flex: 0 0 50%;
  padding: 0 5px;
  width: 50%;
  box-sizing: border-box;
}

/* 卡片样式 */
.favorite-card {
  margin-bottom: 10px;
  border-radius: 12px;
  background-color: #fff;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  width: 100%;
  box-sizing: border-box;
  transition: transform 0.2s ease;
}

.favorite-card:active {
  transform: scale(0.98);
}

.card-media {
  height: 120px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.media-icon {
  font-size: 32px;
  color: rgba(255, 255, 255, 0.8);
}

.card-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0; /* 填满容器到底，避免出现灰色空白条 */
  overflow: auto;
}

.card-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  color: #333;
}

.card-author {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.card-location {
  font-size: 11px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 60%;
}

.card-stats {
  font-size: 11px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 无内容提示 */
.no-items {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.no-items-text {
  color: #999;
  font-size: 14px;
}

/* 加载更多样式 */
.loading-more {
  text-align: center;
  padding: 15px 0;
  color: #666;
  font-size: 14px;
}

/* 底部安全占位（与 ContentSection 中的 --safe-bottom-px 保持一致） */
.scroll-bottom-spacer {
  height: var(--safe-bottom-px, 86px);
  width: 100%;
}
</style>

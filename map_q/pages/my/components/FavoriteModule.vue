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
    <scroll-view class="favorite-list" scroll-y @scrolltolower="onLoadMore">
      <view v-if="currentCategoryItems.length === 0" class="no-items">
        <text class="no-items-text">暂无{{ getCurrentCategoryName() }}内容</text>
      </view>
      
      <!-- 瀑布流网格布局 -->
      <view v-else class="cards-grid">
        <!-- 左列卡片 -->
        <view class="cards-column">
          <view 
            v-for="(item, index) in leftColumnItems" 
            :key="'left-' + item.id"
            class="favorite-card"
            :style="{ height: getCardHeight(item.id) + 'px' }"
            @click="handleItemClick(item)"
          >
            <view class="card-media" :style="{ backgroundColor: getRandomColor() }">
              <text class="media-icon">{{ item.icon }}</text>
            </view>
            <view class="card-content">
              <view class="card-title">{{ item.title }}</view>
              <view class="card-author">{{ item.author || '未知作者' }}</view>
              <view class="card-footer">
                <view class="card-location">{{ item.location || '未知位置' }}</view>
                <view class="card-stats">{{ item.likes || 0 }} 赞</view>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 右列卡片 -->
        <view class="cards-column">
          <view 
            v-for="(item, index) in rightColumnItems" 
            :key="'right-' + item.id"
            class="favorite-card"
            :style="{ height: getCardHeight(item.id) + 'px' }"
            @click="handleItemClick(item)"
          >
            <view class="card-media" :style="{ backgroundColor: getRandomColor() }">
              <text class="media-icon">{{ item.icon }}</text>
            </view>
            <view class="card-content">
              <view class="card-title">{{ item.title }}</view>
              <view class="card-author">{{ item.author || '未知作者' }}</view>
              <view class="card-footer">
                <view class="card-location">{{ item.location || '未知位置' }}</view>
                <view class="card-stats">{{ item.likes || 0 }} 赞</view>
              </view>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 加载更多提示 -->
      <view class="loading-more" v-if="isLoading">
        <text>加载中...</text>
      </view>
    </scroll-view>
  </view>
</template>

<script>
export default {
  name: 'FavoriteModule',
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
        { key: 'locations', name: '地点', icon: '📍' }
      ]
    }
  },
  computed: {
    // 添加一个计算属性来确保数据格式正确
    normalizedFavoriteData() {
    // 如果 favoriteData 是数组或无效，返回空对象
    if (!this.favoriteData || Array.isArray(this.favoriteData) || typeof this.favoriteData !== 'object') {
      return {
        photos: [],
        videos: [],
        articles: [],
        music: [],
        locations: []
      }
    }
    return this.favoriteData
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
      return allItems.sort((a, b) => {
        const dateA = this.parseDate(a.time)
        const dateB = this.parseDate(b.time)
        return dateB - dateA
      })
    }
    return data[this.activeCategory] || []
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
    
    handleItemClick(item) {
      this.$emit('item-click', item)
    },
    
    // 获取卡片高度（瀑布流效果）
    getCardHeight(itemId) {
      if (!this.cardHeights[itemId]) {
        // 生成180-280之间的随机高度
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
  height: 54px;
  background: #fff;
  width: 100%;
}

/* 分类选择器样式 - 更紧凑 */
.category-tabs {
  display: flex;
  padding: 4px 12px 6px 12px;
  gap: 4px;
  overflow-x: auto;
  border-bottom: 1px solid #eee;
  background: #fff;
}

.category-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 4px 8px;
  border-radius: 14px;
  background: #f5f5f5;
  min-width: 50px;
  transition: all 0.3s ease;
  flex-shrink: 0;
  white-space: nowrap;
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
  flex: 1;
  height: calc(100% - 60px);
  overflow: hidden;
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
  padding: 12px;
  width: 100%;
  box-sizing: border-box;
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
</style>
<template>
  <view class="detail-page normal-detail">
    <!-- 封面图（延伸到顶部） -->
    <view class="cover-section">
      <image v-if="cardData.cover" class="cover-image" :src="cardData.cover" mode="aspectFill" />
      <view v-else class="cover-placeholder">
        <text class="cover-text">暂无封面</text>
      </view>
      <view class="cover-badge">{{ categoryText }}</view>
    </view>

    <!-- 顶部导航（透明覆盖在图片上） -->
    <view class="detail-nav">
      <view class="nav-back" @tap="back">
        <view class="back-btn">
          <text class="back-icon">‹</text>
        </view>
      </view>
      <text class="nav-title">详情</text>
      <view class="nav-actions">
        <view class="share-btn" @tap="shareContent">
          <text class="action-icon">↗</text>
        </view>
      </view>
    </view>

    <!-- 基本信息 -->
    <view class="info-section">
      <text class="card-title">{{ cardData.name || cardData.title || '标题' }}</text>
      <view class="author-row">
        <image class="author-avatar" :src="cardData.avatar || '/static/logo.png'" mode="aspectFill" />
        <text class="author-name">{{ cardData.author }}</text>
        <text class="publish-time">{{ cardData.publishTime || '刚刚' }}</text>
      </view>
    </view>

    <!-- 数据统计 -->
    <view class="stats-section">
      <view class="stat-item">
        <text class="stat-value">{{ formattedLikes }}</text>
        <text class="stat-label">点赞</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-value">{{ formattedCollects }}</text>
        <text class="stat-label">收藏</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-value">{{ formattedViews }}</text>
        <text class="stat-label">浏览</text>
      </view>
    </view>

    <!-- 内容描述 -->
    <view class="desc-section">
      <text class="section-title">内容介绍</text>
      <text class="desc-text">{{ cardData.description || '暂无详细介绍' }}</text>
    </view>

    <!-- 标签 -->
    <view class="tags-section" v-if="cardData.tags && cardData.tags.length">
      <view class="tag" v-for="(tag, index) in cardData.tags" :key="index">
        <text>#{{ tag }}</text>
      </view>
    </view>

    <!-- 位置信息 -->
    <view class="location-section" v-if="locationText">
      <view class="section-header">
        <text class="section-title">位置信息</text>
        <view class="nav-btn" @tap="navigateTo">
          <text>导航</text>
        </view>
      </view>
      <view class="location-card" @tap="navigateTo">
        <text class="location-icon">📍</text>
        <view class="location-info">
          <text class="location-address">{{ locationText }}</text>
          <text class="location-hint">点击查看地图</text>
        </view>
      </view>
    </view>

    <!-- 评论区域 -->
    <view class="comments-section">
      <text class="section-title">评论 ({{ comments.length }})</text>
      <view class="comments-list">
        <view class="comment-item" v-for="comment in comments" :key="comment.id">
          <image class="comment-avatar" :src="comment.avatar || '/static/logo.png'" mode="aspectFill" />
          <view class="comment-body">
            <text class="comment-name">{{ comment.name }}</text>
            <text class="comment-content">{{ comment.content }}</text>
            <view class="comment-footer">
              <text class="comment-time">{{ comment.time }}</text>
              <view class="comment-like" @tap="likeComment(comment.id)">
                <text :class="{ active: comment.isLiked }">{{ comment.isLiked ? '♥' : '♡' }}</text>
                <text>{{ comment.likeCount }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部占位 -->
    <view :style="{ height: bottomHeight + 'px' }"></view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <view class="bar-input" @tap="showCommentInput">
        <text>说点什么...</text>
      </view>
      <view class="bar-actions">
        <view class="bar-action" @tap="toggleLike">
          <text :class="{ active: isLiked }">{{ isLiked ? '♥' : '♡' }}</text>
          <text>{{ cardData.likes || 0 }}</text>
        </view>
        <view class="bar-action" @tap="toggleCollect">
          <text :class="{ active: isCollected }">{{ isCollected ? '★' : '☆' }}</text>
          <text>收藏</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useInteraction } from '../../../utils/interaction.js'

export default {
  name: 'NormalDetail',
  setup() {
    const cardData = ref({
      name: '',
      title: '',
      author: '',
      description: '',
      cover: '',
      likes: 0,
      collects: 0,
      views: 0,
      tags: [],
      location: null,
      type: 'normal'
    })

    const isLiked = ref(false)
    const isCollected = ref(false)
    const comments = ref([])
    const bottomHeight = ref(80)

    const interaction = useInteraction()

    const categoryText = computed(() => {
      const typeMap = {
        normal: '打卡',
        video: '视频',
        article: '文章',
        place: '地点',
        event: '活动',
        track: '轨迹'
      }
      return typeMap[cardData.value.type] || '打卡'
    })

    const locationText = computed(() => {
      if (cardData.value.location && cardData.value.location.coordinates) {
        const [lng, lat] = cardData.value.location.coordinates
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
      }
      return cardData.value.address || ''
    })

    const formattedLikes = computed(() => {
      const n = cardData.value.likes || 0
      return n >= 10000 ? (n / 10000).toFixed(1) + '万' : n.toString()
    })

    const formattedCollects = computed(() => {
      const n = cardData.value.collects || 0
      return n >= 10000 ? (n / 10000).toFixed(1) + '万' : n.toString()
    })

    const formattedViews = computed(() => {
      const n = cardData.value.views || 0
      return n >= 10000 ? (n / 10000).toFixed(1) + '万' : n.toString()
    })

    const toggleLike = () => {
      const cardId = cardData.value._id || cardData.value.id
      isLiked.value = interaction.toggleLike(cardId, cardData.value)
      cardData.value.likes = (cardData.value.likes || 0) + (isLiked.value ? 1 : -1)
    }

    const toggleCollect = () => {
      const cardId = cardData.value._id || cardData.value.id
      isCollected.value = interaction.toggleFavorite(cardId, cardData.value)
    }

    const shareContent = () => {
      uni.showToast({ title: '分享功能待实现', icon: 'none' })
    }

    const navigateTo = () => {
      if (cardData.value.location && cardData.value.location.coordinates) {
        const [lng, lat] = cardData.value.location.coordinates
        uni.openLocation({
          latitude: lat,
          longitude: lng,
          name: cardData.value.name || cardData.value.title || '位置',
          fail: () => {
            uni.showToast({ title: '导航失败', icon: 'none' })
          }
        })
      }
    }

    const likeComment = (commentId) => {
      const comment = comments.value.find(c => c.id === commentId)
      if (comment) {
        comment.isLiked = !comment.isLiked
        comment.likeCount += comment.isLiked ? 1 : -1
      }
    }

    const showCommentInput = () => {
      uni.showToast({ title: '评论功能待实现', icon: 'none' })
    }

    const back = () => {
      uni.navigateBack()
    }

    const loadData = () => {
      try {
        const item = uni.getStorageSync('INDEX_LAST_ITEM')
        if (item && item._id) {
          cardData.value = { ...cardData.value, ...item }
          const cardId = item._id || item.id
          isLiked.value = interaction.isLiked(cardId)
          isCollected.value = interaction.isFavorited(cardId)
        }
      } catch (e) {
        console.warn('加载数据失败:', e)
      }

      comments.value = generateMockComments()
    }

    const generateMockComments = () => {
      const names = ['小明', '小红', '小刚', '小丽', '小王', '小张']
      const contents = [
        '太棒了，支持！',
        '打卡成功~',
        '已收藏',
        '不错的分享',
        '666',
        '厉害了'
      ]
      return names.map((name, i) => ({
        id: i + 1,
        name,
        avatar: '/static/logo.png',
        content: contents[i],
        time: `${i + 1}小时前`,
        isLiked: false,
        likeCount: Math.floor(Math.random() * 50)
      }))
    }

    onMounted(() => {
      loadData()
    })

    return {
      cardData,
      isLiked,
      isCollected,
      comments,
      bottomHeight,
      categoryText,
      locationText,
      formattedLikes,
      formattedCollects,
      formattedViews,
      toggleLike,
      toggleCollect,
      shareContent,
      navigateTo,
      likeComment,
      showCommentInput,
      back
    }
  }
}
</script>

<style scoped>
.detail-page {
  min-height: 100vh;
  background: #f8f8f8;
}

.detail-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--status-bar-height) 24rpx 16rpx;
  background: transparent;
  z-index: 100;
}

.nav-back {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
}

.back-icon {
  font-size: 48rpx;
  font-weight: 300;
  color: #ffffff;
  position: relative;
  top: -4rpx;
}

.nav-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #ffffff;
}

.nav-actions {
  width: 80rpx;
  display: flex;
  justify-content: flex-end;
}

.share-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
}

.action-icon {
  font-size: 28rpx;
  color: #ffffff;
}

.cover-section {
  position: relative;
  width: 100%;
  height: 800rpx;
  background: #e8e8e8;
}

.cover-image {
  width: 100%;
  height: 100%;
}

.cover-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8fafc 0%, #eef2f7 100%);
}

.cover-text {
  font-size: 28rpx;
  color: #94a3b8;
}

.cover-badge {
  position: absolute;
  top: 120rpx;
  left: 24rpx;
  padding: 8rpx 20rpx;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20rpx;
  font-size: 24rpx;
  font-weight: 600;
  color: #333;
}

.info-section {
  padding: 32rpx;
  background: #fff;
  margin-top: -40rpx;
  border-top-left-radius: 32rpx;
  border-top-right-radius: 32rpx;
  position: relative;
  z-index: 10;
}

.card-title {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1.4;
  margin-bottom: 12px;
}

.author-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.author-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.author-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.publish-time {
  font-size: 12px;
  color: #999;
}

.stats-section {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 16px;
  background: #fff;
  border-top: 1px solid #f5f5f5;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

.stat-label {
  font-size: 12px;
  color: #999;
}

.stat-divider {
  width: 1px;
  height: 30px;
  background: #eee;
}

.desc-section {
  padding: 20px 16px;
  background: #fff;
  margin-top: 8px;
}

.section-title {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.desc-text {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.tags-section {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 16px 20px;
  background: #fff;
}

.tag {
  padding: 6px 14px;
  background: #f0f0f0;
  border-radius: 16px;
}

.tag text {
  font-size: 13px;
  color: #666;
}

.location-section {
  padding: 20px 16px;
  background: #fff;
  margin-top: 8px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.nav-btn {
  padding: 6px 16px;
  background: #07c160;
  border-radius: 14px;
}

.nav-btn text {
  font-size: 12px;
  color: #fff;
}

.location-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 12px;
}

.location-icon {
  font-size: 24px;
}

.location-info {
  flex: 1;
}

.location-address {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.location-hint {
  font-size: 12px;
  color: #999;
}

.comments-section {
  padding: 20px 16px;
  background: #fff;
  margin-top: 8px;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-item {
  display: flex;
  gap: 12px;
}

.comment-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
}

.comment-body {
  flex: 1;
}

.comment-name {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
}

.comment-content {
  display: block;
  font-size: 14px;
  color: #333;
  line-height: 1.5;
  margin-bottom: 8px;
}

.comment-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.comment-time {
  font-size: 11px;
  color: #999;
}

.comment-like {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #999;
}

.comment-like .active {
  color: #ff4757;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 10px 16px;
  padding-bottom: calc(10px + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -1px 8px rgba(0, 0, 0, 0.05);
}

.bar-input {
  flex: 1;
  height: 38px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  background: #f5f5f5;
  border-radius: 19px;
  margin-right: 16px;
}

.bar-input text {
  font-size: 14px;
  color: #999;
}

.bar-actions {
  display: flex;
  gap: 20px;
}

.bar-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.bar-action text:first-child {
  font-size: 22px;
  color: #999;
}

.bar-action text:first-child.active {
  color: #ff4757;
}

.bar-action text:last-child {
  font-size: 10px;
  color: #999;
}
</style>

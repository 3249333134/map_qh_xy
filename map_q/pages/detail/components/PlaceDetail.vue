<template>
  <view class="detail-page place-detail">
    <!-- 地点地图预览 -->
    <view class="place-map" @tap="openMap">
      <view class="map-overlay">
        <view class="map-center-marker">
          <view class="marker-dot"></view>
          <view class="marker-pulse"></view>
        </view>
      </view>
      <view class="map-info">
        <text class="map-hint">点击查看完整地图</text>
      </view>
    </view>

    <!-- 顶部导航 -->
    <view class="detail-nav">
      <view class="nav-back" @tap="back">
        <view class="back-btn">
          <text class="back-icon">‹</text>
        </view>
      </view>
      <text class="nav-title">地点详情</text>
      <view class="nav-actions">
        <view class="share-btn" @tap="shareContent">
          <text class="action-icon">↗</text>
        </view>
      </view>
    </view>

    <!-- 地点基本信息 -->
    <view class="place-header">
      <view class="place-title-row">
        <text class="place-title">{{ placeData.name }}</text>
        <view class="distance-badge" v-if="distance">
          <text>{{ distance }}</text>
        </view>
      </view>
      <view class="place-rating">
        <view class="rating-stars">
          <text v-for="i in 5" :key="i" :class="{ filled: i <= rating }">★</text>
        </view>
        <text class="rating-score">{{ placeData.rating }}</text>
      </view>
      <view class="place-address">
        <text class="address-icon">📍</text>
        <text class="address-text">{{ placeData.address }}</text>
      </view>
    </view>

    <!-- 标签 -->
    <view class="tags-section" v-if="placeData.tags && placeData.tags.length">
      <view class="tag" v-for="(tag, index) in placeData.tags" :key="index">
        <text>{{ tag }}</text>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="action-buttons">
      <view class="action-btn primary" @tap="navigateTo">
        <text class="btn-icon">🧭</text>
        <text class="btn-text">导航前往</text>
      </view>
      <view class="action-btn" @tap="callPhone">
        <text class="btn-icon">📞</text>
        <text class="btn-text">联系商家</text>
      </view>
      <view class="action-btn" @tap="saveFavorite">
        <text class="btn-icon">{{ isFavorited ? '★' : '☆' }}</text>
        <text class="btn-text">{{ isFavorited ? '已收藏' : '收藏' }}</text>
      </view>
    </view>

    <!-- 分割线 -->
    <view class="section-divider"></view>

    <!-- 地点介绍 -->
    <view class="place-intro" v-if="placeData.description">
      <text class="section-title">地点介绍</text>
      <text class="intro-text">{{ placeData.description }}</text>
    </view>

    <!-- 开放时间 -->
    <view class="info-card">
      <view class="info-row">
        <text class="info-icon">🕐</text>
        <text class="info-label">营业时间</text>
        <text class="info-value">09:00 - 22:00</text>
      </view>
      <view class="info-row">
        <text class="info-icon">📋</text>
        <text class="info-label">人均消费</text>
        <text class="info-value">¥50</text>
      </view>
    </view>

    <!-- 用户评价 -->
    <view class="reviews-section">
      <view class="reviews-header">
        <text class="section-title">用户评价</text>
        <text class="reviews-count">({{ reviewCount }})</text>
      </view>

      <view class="reviews-list">
        <view class="review-item" v-for="review in reviews" :key="review.id">
          <image class="review-avatar" :src="review.avatar || '/static/logo.png'" mode="aspectFill" />
          <view class="review-content">
            <view class="review-header">
              <text class="review-name">{{ review.name }}</text>
              <view class="review-rating">
                <text v-for="i in 5" :key="i" :class="{ filled: i <= review.rating }">★</text>
              </view>
            </view>
            <text class="review-text">{{ review.content }}</text>
            <text class="review-time">{{ review.time }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部占位 -->
    <view :style="{ height: bottomHeight + 'px' }"></view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <view class="bar-left">
        <view class="bar-action" @tap="toggleLike">
          <text :class="{ active: isLiked }">{{ isLiked ? '♥' : '♡' }}</text>
          <text>{{ placeData.likes || 0 }}</text>
        </view>
        <view class="bar-action" @tap="shareContent">
          <text>↗</text>
          <text>分享</text>
        </view>
      </view>
      <view class="bar-right" @tap="navigateTo">
        <text>到这里去</text>
      </view>
    </view>
  </view>
</template>

<script>
import { ref, computed, onMounted } from 'vue'

export default {
  name: 'PlaceDetail',
  setup() {
    const placeData = ref({
      name: '地点名称',
      address: '地点地址',
      rating: 4.5,
      likes: 0,
      tags: [],
      description: '',
      latitude: 0,
      longitude: 0
    })

    const isLiked = ref(false)
    const isFavorited = ref(false)
    const distance = ref('')
    const reviews = ref([])
    const reviewCount = ref(0)
    const bottomHeight = ref(80)

    const rating = computed(() => {
      return Math.round(placeData.value.rating)
    })

    const toggleLike = () => {
      isLiked.value = !isLiked.value
      placeData.value.likes = (placeData.value.likes || 0) + (isLiked.value ? 1 : -1)
    }

    const saveFavorite = () => {
      isFavorited.value = !isFavorited.value
      uni.showToast({
        title: isFavorited.value ? '已收藏' : '取消收藏',
        icon: 'none'
      })
    }

    const navigateTo = () => {
      if (placeData.value.latitude && placeData.value.longitude) {
        uni.openLocation({
          latitude: placeData.value.latitude,
          longitude: placeData.value.longitude,
          name: placeData.value.name,
          address: placeData.value.address,
          fail: () => {
            uni.showToast({
              title: '导航功能暂不可用',
              icon: 'none'
            })
          }
        })
      } else {
        uni.showToast({
          title: '位置信息不可用',
          icon: 'none'
        })
      }
    }

    const openMap = () => {
      navigateTo()
    }

    const callPhone = () => {
      uni.showToast({
        title: '电话功能待实现',
        icon: 'none'
      })
    }

    const shareContent = () => {
      uni.showToast({
        title: '分享功能待实现',
        icon: 'none'
      })
    }

    const back = () => {
      uni.navigateBack()
    }

    const loadData = () => {
      try {
        const item = uni.getStorageSync('INDEX_LAST_ITEM')
        if (item && item._id) {
          placeData.value.name = item.name || item.title || '地点名称'
          placeData.value.address = item.address || '地址信息'
          placeData.value.rating = item.rating || 4.5
          placeData.value.likes = item.likes || 0
          placeData.value.tags = item.tags || []
          placeData.value.description = item.description || ''

          if (item.location && item.location.coordinates) {
            placeData.value.latitude = item.location.coordinates[1]
            placeData.value.longitude = item.location.coordinates[0]
          }
        }
      } catch (e) {
        console.warn('加载地点数据失败:', e)
      }

      reviews.value = generateMockReviews()
      reviewCount.value = reviews.value.length
    }

    const generateMockReviews = () => {
      const usernames = ['用户A', '用户B', '用户C', '用户D']
      const contents = [
        '环境很好，值得推荐！',
        '服务态度不错，下次还来',
        '性价比很高，推荐',
        '总体满意，五星好评'
      ]
      const reviews = []
      for (let i = 0; i < 4; i++) {
        reviews.push({
          id: i + 1,
          name: usernames[i],
          avatar: '/static/logo.png',
          content: contents[i],
          rating: Math.floor(Math.random() * 2) + 4,
          time: `${i + 1}天前`
        })
      }
      return reviews
    }

    onMounted(() => {
      loadData()
    })

    return {
      placeData,
      isLiked,
      isFavorited,
      distance,
      reviews,
      reviewCount,
      bottomHeight,
      rating,
      toggleLike,
      saveFavorite,
      navigateTo,
      openMap,
      callPhone,
      shareContent,
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

.place-map {
  height: 800rpx;
  background: linear-gradient(135deg, #e8f4ea 0%, #d4e8d1 100%);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.map-overlay {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(90deg, rgba(100, 116, 139, 0.1) 1px, transparent 1px),
    linear-gradient(rgba(100, 116, 139, 0.1) 1px, transparent 1px);
  background-size: 20px 20px;
}

.map-center-marker {
  position: relative;
  width: 24px;
  height: 24px;
}

.marker-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #ff8a65;
  border: 3px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  position: relative;
  z-index: 2;
}

.marker-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 138, 101, 0.3);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: translate(-50%, -50%) scale(0.8); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
}

.map-info {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.95);
  padding: 6px 14px;
  border-radius: 16px;
}

.map-hint {
  font-size: 12px;
  color: #666;
}

.place-header {
  padding: 32rpx;
  background: #fff;
  margin-top: -40rpx;
  border-top-left-radius: 32rpx;
  border-top-right-radius: 32rpx;
  position: relative;
  z-index: 10;
}

.place-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 8px;
}

.place-title {
  flex: 1;
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1.3;
}

.distance-badge {
  padding: 4px 10px;
  background: #f0f0f0;
  border-radius: 12px;
  margin-left: 12px;
}

.distance-badge text {
  font-size: 12px;
  color: #666;
}

.place-rating {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.rating-stars {
  display: flex;
  gap: 2px;
}

.rating-stars text {
  font-size: 14px;
  color: #ddd;
}

.rating-stars text.filled {
  color: #ffc107;
}

.rating-score {
  font-size: 14px;
  font-weight: 600;
  color: #ff9500;
}

.place-address {
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

.address-icon {
  font-size: 14px;
  margin-top: 2px;
}

.address-text {
  flex: 1;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.tags-section {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 20px 16px;
  background: #fff;
}

.tag {
  padding: 6px 14px;
  background: #fff0f0;
  border-radius: 16px;
}

.tag text {
  font-size: 13px;
  color: #ff6b6b;
}

.action-buttons {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  background: #fff;
}

.action-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px;
  background: #f8f8f8;
  border-radius: 12px;
}

.action-btn.primary {
  background: #07c160;
}

.action-btn .btn-icon {
  font-size: 20px;
}

.action-btn .btn-text {
  font-size: 12px;
  color: #666;
}

.action-btn.primary .btn-text {
  color: #fff;
}

.section-divider {
  height: 8px;
  background: #f5f5f5;
}

.place-intro {
  padding: 20px;
  background: #fff;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.intro-text {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.info-card {
  margin: 0 20px 16px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 12px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
}

.info-row:not(:last-child) {
  border-bottom: 1px solid #eee;
}

.info-icon {
  font-size: 16px;
}

.info-label {
  flex: 1;
  font-size: 14px;
  color: #666;
}

.info-value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.reviews-section {
  padding: 20px;
  background: #fff;
}

.reviews-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;
}

.reviews-count {
  font-size: 13px;
  color: #999;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-item {
  display: flex;
  gap: 12px;
}

.review-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
}

.review-content {
  flex: 1;
}

.review-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.review-name {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.review-rating {
  display: flex;
  gap: 2px;
}

.review-rating text {
  font-size: 11px;
  color: #ddd;
}

.review-rating text.filled {
  color: #ffc107;
}

.review-text {
  display: block;
  font-size: 14px;
  color: #333;
  line-height: 1.5;
  margin-bottom: 6px;
}

.review-time {
  font-size: 11px;
  color: #999;
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

.bar-left {
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
  font-size: 20px;
  color: #999;
}

.bar-action text:first-child.active {
  color: #ff4757;
}

.bar-action text:last-child {
  font-size: 10px;
  color: #999;
}

.bar-right {
  margin-left: auto;
  padding: 10px 28px;
  background: #07c160;
  border-radius: 20px;
}

.bar-right text {
  font-size: 14px;
  color: #fff;
  font-weight: 500;
}
</style>

<template>
  <view
    class="card place-card"
    :style="{ '--card-height': height + 'rpx' }">
    <view
      class="card-media"
      @tap="handleMediaTap"
      @click="handleMediaTap">
      <view class="place-map-bg">
        <view class="map-grid"></view>
      </view>
      <view class="center-marker">
        <view class="marker-dot"></view>
        <view class="marker-pulse"></view>
        <view class="marker-pulse-delay"></view>
      </view>
      <view class="place-badge">
        <text class="badge-icon">地</text>
      </view>
    </view>

    <view
      class="card-content"
      @tap="handleContentTap"
      @click="handleContentTap">
      <view class="card-title">{{ cardTitle }}</view>
      <view class="card-address">{{ addressText }}</view>
      <view class="card-meta">
        <view class="card-tags">
          <text v-for="(tag, idx) in displayTags" :key="idx" class="tag-item">{{ tag }}</text>
        </view>
        <view class="card-stats">
          <text class="stat-icon">★</text>
          <text class="stat-text">{{ ratingText }}</text>
        </view>
      </view>
      <view class="card-footer">
        <view class="quick-actions">
          <view class="quick-btn nav-btn" @tap.stop="handleNavigate">
            <text class="quick-icon">🧭</text>
            <text class="quick-text">导航</text>
          </view>
          <view class="quick-btn reserve-btn" @tap.stop="handleReserve">
            <text class="quick-icon">📅</text>
            <text class="quick-text">预约</text>
          </view>
        </view>
        <view class="card-actions" @tap.stop="preventBubble" @click.stop="preventBubble">
          <view class="action-btn" :class="{ active: isLiked }" @tap.stop="handleLike" @click.stop="handleLike">
            <text class="action-icon">{{ isLiked ? '♥' : '♡' }}</text>
            <text class="action-text">{{ likesCount }}</text>
          </view>
          <view class="action-btn" :class="{ active: isFavorited }" @tap.stop="handleFavorite" @click.stop="handleFavorite">
            <text class="action-icon">{{ isFavorited ? '★' : '☆' }}</text>
            <text class="action-text">{{ favoritesCount }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { useInteraction } from '../../utils/interaction.js'

export default {
  name: 'PlaceCard',
  props: {
    height: {
      type: Number,
      default: 200
    },
    columnType: {
      type: String,
      default: 'left'
    },
    index: {
      type: Number,
      required: true
    },
    cardData: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      isLiked: false,
      isFavorited: false
    }
  },
  computed: {
    cardId() {
      return this.cardData && (this.cardData._id || this.cardData.id || this.index)
    },
    cardTitle() {
      return this.cardData && (this.cardData.name || this.cardData.title) ?
        (this.cardData.name || this.cardData.title) : '地点名称'
    },
    addressText() {
      if (this.cardData && this.cardData.address) {
        return this.cardData.address
      }
      if (this.cardData && this.cardData.location && this.cardData.location.coordinates) {
        const [lng, lat] = this.cardData.location.coordinates
        return `${lat.toFixed(2)}, ${lng.toFixed(2)}`
      }
      return '暂无地址信息'
    },
    ratingText() {
      const rating = Number(this.cardData && this.cardData.rating || 4.5)
      return rating.toFixed(1)
    },
    displayTags() {
      const tags = this.cardData && this.cardData.tags
      if (Array.isArray(tags) && tags.length > 0) {
        return tags.slice(0, 2)
      }
      const defaultTags = ['热门', '推荐']
      return defaultTags
    },
    likesCount() {
      const likes = Number(this.cardData && this.cardData.likes)
      return Number.isFinite(likes) && likes > 0 ? likes : ''
    },
    favoritesCount() {
      const favorites = Number(this.cardData && this.cardData.favorites) || Number(this.cardData && this.cardData.collects)
      return Number.isFinite(favorites) && favorites > 0 ? favorites : ''
    }
  },
  created() {
    this.checkInteractionStatus()
  },
  methods: {
    checkInteractionStatus() {
      const interaction = useInteraction()
      this.isLiked = interaction.isLiked(this.cardId)
      this.isFavorited = interaction.isFavorited(this.cardId)
    },
    handleLike() {
      const interaction = useInteraction()
      this.isLiked = interaction.toggleLike(this.cardId, this.cardData)
    },
    handleFavorite() {
      const interaction = useInteraction()
      this.isFavorited = interaction.toggleFavorite(this.cardId, this.cardData)
    },
    preventBubble() {},
    handleNavigate() {
      if (this.cardData && this.cardData.location && this.cardData.location.coordinates) {
        const [lng, lat] = this.cardData.location.coordinates
        uni.showActionSheet({
          itemList: ['使用APP导航', '复制地址'],
          success: (res) => {
            if (res.tapIndex === 0) {
              uni.openLocation({
                latitude: lat,
                longitude: lng,
                name: this.cardTitle,
                address: this.addressText,
                fail: () => {
                  uni.showToast({ title: '导航失败', icon: 'none' })
                }
              })
            } else {
              uni.setClipboardData({
                data: this.addressText,
                success: () => {
                  uni.showToast({ title: '地址已复制', icon: 'success' })
                }
              })
            }
          }
        })
      } else {
        uni.showToast({ title: '暂无位置信息', icon: 'none' })
      }
    },
    handleReserve() {
      this.$emit('reserve', {
        cardData: this.cardData,
        index: this.index
      })
    },
    handleMediaTap() {
      this.$emit('media-tap', {
        cardData: this.cardData,
        index: this.index
      })
    },
    handleContentTap() {
      this.$emit('content-tap', {
        cardData: this.cardData,
        index: this.index
      })
    }
  }
}
</script>

<style>
.place-card {
  margin-bottom: 8rpx;
  border-radius: 12rpx;
  background-color: transparent;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
}

.place-card .card-media {
  position: relative;
  height: var(--card-height, 220rpx);
  width: 100%;
  cursor: pointer;
  overflow: hidden;
  background: #f8f8f8;
}

.place-map-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.map-grid {
  width: 100%;
  height: 100%;
  background-image:
    linear-gradient(90deg, rgba(150, 150, 150, 0.06) 1rpx, transparent 1rpx),
    linear-gradient(rgba(150, 150, 150, 0.05) 1rpx, transparent 1rpx);
  background-size: 24rpx 24rpx, 24rpx 24rpx;
}

.center-marker {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.marker-dot {
  width: 28rpx;
  height: 28rpx;
  border-radius: 50%;
  background: #ff8a65;
  border: 4rpx solid #fff;
  box-shadow: 0 2rpx 8rpx rgba(255, 138, 101, 0.3);
  z-index: 2;
}

.marker-pulse {
  position: absolute;
  width: 52rpx;
  height: 52rpx;
  border-radius: 50%;
  background: rgba(255, 138, 101, 0.2);
  animation: pulse 2s ease-out infinite;
}

.marker-pulse-delay {
  position: absolute;
  width: 52rpx;
  height: 52rpx;
  border-radius: 50%;
  background: rgba(255, 138, 101, 0.2);
  animation: pulse 2s ease-out infinite;
  animation-delay: 1s;
}

@keyframes pulse {
  0% {
    transform: scale(0.5);
    opacity: 1;
  }
  100% {
    transform: scale(1.8);
    opacity: 0;
  }
}

.place-badge {
  position: absolute;
  bottom: 8rpx;
  right: 8rpx;
  padding: 0 10rpx;
  height: 30rpx;
  border-radius: 12rpx;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.badge-icon {
  color: #fff;
  font-size: 18rpx;
  font-weight: 400;
  line-height: 30rpx;
}

.place-card .card-content {
  padding: 10rpx;
  width: 100%;
  box-sizing: border-box;
  cursor: pointer;
}

.place-card .card-title {
  width: 100%;
  color: #000;
  font-size: 26rpx;
  font-weight: 400;
  line-height: 32rpx;
  margin-bottom: 6rpx;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.place-card .card-address {
  width: 100%;
  color: #999;
  font-size: 20rpx;
  line-height: 26rpx;
  margin-bottom: 6rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.place-card .card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}

.place-card .card-tags {
  display: flex;
  gap: 6rpx;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.tag-item {
  padding: 2rpx 8rpx;
  border-radius: 6rpx;
  background: #f5f5f5;
  color: #999;
  font-size: 18rpx;
  flex-shrink: 0;
}

.place-card .card-stats {
  display: flex;
  align-items: center;
  gap: 2rpx;
  flex-shrink: 0;
}

.stat-icon {
  color: #ffb700;
  font-size: 20rpx;
}

.stat-text {
  color: #999;
  font-size: 20rpx;
}

.place-card .card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.quick-actions {
  display: flex;
  gap: 12rpx;
}

.quick-btn {
  display: flex;
  align-items: center;
  gap: 4rpx;
  padding: 6rpx 12rpx;
  border-radius: 16rpx;
  transition: all 0.2s;
}

.quick-btn:active {
  opacity: 0.7;
}

.nav-btn {
  background: transparent;
}

.nav-btn .quick-icon {
  font-size: 18rpx;
}

.nav-btn .quick-text {
  font-size: 20rpx;
  color: #999;
}

.reserve-btn {
  background: transparent;
}

.reserve-btn .quick-icon {
  font-size: 18rpx;
}

.reserve-btn .quick-text {
  font-size: 20rpx;
  color: #999;
}

.place-card .card-actions {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex-shrink: 0;
}

.place-card .action-btn {
  display: flex;
  align-items: center;
  gap: 4rpx;
  transition: all 0.2s;
}

.place-card .action-btn:active {
  opacity: 0.7;
}

.place-card .action-icon {
  font-size: 24rpx;
  color: #999;
  line-height: 1;
}

.place-card .action-text {
  font-size: 20rpx;
  color: #999;
}

.place-card .action-btn.active .action-icon {
  color: #ff2442;
}

.place-card .action-btn.active .action-text {
  color: #ff2442;
}

.place-card .action-btn.active {
  animation: popIn 0.3s ease;
}

@keyframes popIn {
  0% { transform: scale(0.8); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}
</style>

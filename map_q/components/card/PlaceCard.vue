<template>
  <view
    class="card place-card app-card content-card refined-card"
    :style="{ '--card-height': height + 'rpx' }">
    <view
      class="card-media"
      @tap="handleMediaTap"
      @click="handleMediaTap">
      <image v-if="coverImage" class="card-cover" :src="coverImage" mode="aspectFill" @error="failedCover = coverImage" />
      <view v-else class="place-map-bg">
        <view class="map-grid"></view>
        <view class="place-placeholder-text">
          <text class="placeholder-label">地点</text>
        </view>
      </view>
      <view v-if="!coverImage" class="center-marker">
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
      <view class="card-footer">
        <view class="card-author">
          <text v-for="(tag, idx) in displayTags" :key="idx" class="tag-item">{{ tag }}</text>
          <text class="footer-text">★ {{ ratingText }}</text>
        </view>
        <view class="card-actions" @tap.stop="preventBubble" @click.stop="preventBubble">
          <view class="action-btn" :class="{ active: isLiked }" @tap.stop="handleLike" @click.stop="handleLike">
            <text class="action-icon">{{ isLiked ? '♥' : '♡' }}</text>
            <text class="action-text">{{ likesCount }}</text>
          </view>
          <view class="action-btn" :class="{ active: isFavorited }" @tap.stop="handleFavorite" @click.stop="handleFavorite">
            <text class="action-icon">{{ isFavorited ? '★' : '☆' }}</text>
          </view>
          <view class="quick-btn nav-btn card-cta" @tap.stop="handleNavigate">
            <text class="quick-text cta-face">导航</text>
          </view>
          <view class="quick-btn reserve-btn card-cta" @tap.stop="handleReserve">
            <text class="quick-text cta-face">预约</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { getContentCover } from '../../utils/contentResolver.js'
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
      failedCover: '',
      isLiked: false,
      isFavorited: false
    }
  },
  computed: {
    coverImage() { const cover = getContentCover(this.cardData); return cover === this.failedCover ? '' : cover },
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
      if (!Number.isFinite(likes) || likes <= 0) return ''
      if (likes >= 10000) return (likes / 10000).toFixed(1) + '万'
      return String(likes)
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
  margin-bottom: 12rpx;
  border-radius: 0;
  background-color: transparent;
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
  --card-media-height: 144px;
  border: none;
  box-shadow: none;
}

.place-card .card-media {
  position: relative;
  height: var(--card-height, 240rpx);
  width: 100%;
  cursor: pointer;
  overflow: hidden;
  background: var(--color-page);
  border-radius: 8px;
}

.place-map-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #e0f2ec 0%, #f3f8f5 100%);
}

.map-grid {
  width: 100%;
  height: 100%;
  background-image:
    linear-gradient(90deg, rgba(42, 108, 92, 0.07) 1rpx, transparent 1rpx),
    linear-gradient(rgba(42, 108, 92, 0.05) 1rpx, transparent 1rpx);
  background-size: 24rpx 24rpx, 24rpx 24rpx;
}

.place-placeholder-text {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-label {
  font-size: 22px;
  font-weight: 700;
  color: rgba(40, 108, 92, 0.12);
  letter-spacing: 4px;
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
  background: #22c55e;
  border: 4rpx solid #fff;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  z-index: 2;
}

.marker-pulse {
  position: absolute;
  width: 52rpx;
  height: 52rpx;
  border-radius: 50%;
  background: rgba(34, 197, 94, 0.25);
  animation: pulse 2s ease-out infinite;
}

.marker-pulse-delay {
  position: absolute;
  width: 52rpx;
  height: 52rpx;
  border-radius: 50%;
  background: rgba(34, 197, 94, 0.15);
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
  top: 10rpx;
  right: 10rpx;
  width: 36rpx;
  height: 36rpx;
  border-radius: 8rpx;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.badge-icon {
  color: #fff;
  font-size: 20rpx;
  font-weight: 600;
}

.place-card .card-content {
  padding: 6px 8px;
  width: 100%;
  box-sizing: border-box;
  cursor: pointer;
}

.place-card .card-title {
  width: 100%;
  color: #333;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.place-card .card-author {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  gap: 4px;
  overflow: hidden;
}

.place-card .card-author::before {
  content: '';
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #e0f2ec;
  margin-right: 4px;
  flex-shrink: 0;
  display: inline-block;
}

.place-card .footer-text {
  color: #999;
  font-size: 11px;
  line-height: 14px;
  flex-shrink: 0;
}

.tag-item {
  padding: 1px 5px;
  border-radius: 4px;
  background: #e0f2ec;
  color: #286c5c;
  font-size: 10px;
  flex-shrink: 0;
  margin-right: 2px;
}

.place-card .card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  flex-wrap: nowrap;
  gap: 4px;
  overflow: hidden;
}

.quick-actions {
  display: flex;
  gap: 4px;
  flex: 0 0 auto;
  margin: 0;
}

.quick-btn {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 0;
  transition: all 0.2s;
  min-height: 32px;
  border-radius: 0;
  flex: 0 0 auto;
  justify-content: center;
}

.quick-btn:active {
  opacity: 0.7;
}

.nav-btn {
  background: transparent;
  color: #286c5c;
}

.nav-btn .quick-icon {
  font-size: 18rpx;
}

.nav-btn .quick-text {
  font-size: 12px;
  color: #286c5c;
  font-weight: 500;
}

.reserve-btn {
  background: transparent;
  color: #286c5c;
}

.reserve-btn .quick-icon {
  font-size: 18rpx;
}

.reserve-btn .quick-text {
  font-size: 12px;
  color: #286c5c;
  font-weight: 500;
}

.place-card .card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}

.place-card .action-btn {
  display: flex;
  align-items: center;
  gap: 4rpx;
  transition: all 0.2s;
  min-width: 32px;
  min-height: 32px;
  justify-content: center;
}

.place-card .action-btn:active {
  opacity: 0.7;
}

.place-card .action-icon {
  font-size: 14px;
  color: #999;
  line-height: 1;
}

.place-card .action-text {
  font-size: 11px;
  color: #999;
}

.place-card .action-btn.active .action-icon {
  color: #286c5c;
}

.place-card .action-btn.active .action-text {
  color: #286c5c;
}

.place-card .action-btn.active {
  animation: popIn 0.3s ease;
}

@keyframes popIn {
  0% { transform: scale(0.8); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.place-card .card-cover {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.quick-icon {
  display: none;
}
</style>

<template>
  <view
    class="card service-map-card app-card content-card"
    :style="{ '--card-height': height + 'rpx' }">
    <!-- 上半：媒体位（点击进入详情并定位） -->
    <view
      class="card-media"
      @tap="handleMediaTap">
      <image v-if="coverImage" class="card-cover" :src="coverImage" mode="aspectFill" @error="failedCover = coverImage" />
      <view v-else class="service-cover-empty"><text>服务</text><text>查看时段与预约</text></view>
      <view class="service-badge">服务</view>
      <view class="service-rating">{{ ratingText }}</view>
    </view>

    <!-- 下半：基础信息（点击只定位到地图） -->
    <view
      class="card-content"
      @tap="handleContentTap">
      <view v-if="priceLabel" class="service-price-label">{{ priceLabel }}</view>
      <view class="card-title">{{ cardTitle }}</view>
      <view class="card-info">
        <view class="business-status" :class="businessStatusClass">
          <text class="status-dot"></text>
          <text class="status-text">{{ businessStatusText }}</text>
        </view>
        <view class="card-distance">{{ distanceText }}</view>
      </view>
      <view class="card-footer">
        <view class="card-location">{{ locationText }}</view>
        <view class="card-actions" @tap.stop="preventBubble">
          <view class="action-btn" :class="{ active: isLiked }" @tap.stop="handleLike">
            <text class="action-icon">{{ isLiked ? '♥' : '♡' }}</text>
            <text class="action-text">{{ likesCount }}</text>
          </view>
          <view class="action-btn" :class="{ active: isFavorited }" @tap.stop="handleFavorite">
            <text class="action-icon">{{ isFavorited ? '★' : '☆' }}</text>
            <text class="action-text">{{ favoritesCount }}</text>
          </view>
        </view>
        <view class="reserve-big" @tap.stop="onReserve">预约</view>
      </view>
    </view>
  </view>
</template>

<script>
import { getContentCover } from '../../utils/contentResolver.js'
import { useInteraction } from '../../utils/interaction.js'

export default {
  name: 'ServiceCardItem',
  props: {
    height: { type: Number, default: 200 },
    columnType: { type: String, default: 'left' },
    index: { type: Number, required: true },
    cardData: { type: Object, default: () => ({}) }
  },
  data() {
    return {
      failedCover: '',
      isLiked: false,
      isFavorited: false
    }
  },
  computed: {
    priceLabel() { const n = this.cardData?.pricing?.amount ?? this.cardData?.price; return n !== null && n !== undefined && n !== '' && Number.isFinite(Number(n)) ? '¥' + Number(n) : '' },
    coverImage() { const cover = getContentCover(this.cardData); return cover === this.failedCover ? '' : cover },
    cardId() {
      return this.cardData && (this.cardData._id || this.cardData.id || this.index)
    },
    cardTitle() {
      return this.cardData && (this.cardData.name || this.cardData.title)
        ? (this.cardData.name || this.cardData.title)
        : '标题占位符'
    },
    cardAuthor() {
      return this.cardData && this.cardData.author ? this.cardData.author : '作者占位符'
    },
    locationText() {
      if (this.cardData && typeof this.cardData.location === 'string' && this.cardData.location) {
        return this.cardData.location
      }
      if (this.cardData && typeof this.cardData.address === 'string' && this.cardData.address) {
        return this.cardData.address
      }
      if (this.cardData && this.cardData.location && this.cardData.location.coordinates) {
        const [lng, lat] = this.cardData.location.coordinates
        return `${lat.toFixed(2)}, ${lng.toFixed(2)}`
      }
      return '未知位置'
    },
    ratingValue() {
      const raw = this.cardData?.rating ?? this.cardData?.score
      const n = Number(raw)
      return raw !== null && raw !== undefined && raw !== '' && Number.isFinite(n) ? n : null
    },
    ratingText() {
      return this.ratingValue === null ? '暂无评分' : `${this.ratingValue.toFixed(1)} 分`
    },
    businessStatusText() {
      const status = this.cardData && this.cardData.businessStatus
      if (status === 'closed') return '已打烊'
      if (status === 'busy') return '繁忙'
      if (status === 'full') return '已满'
      return '营业中'
    },
    businessStatusClass() {
      const status = this.cardData && this.cardData.businessStatus
      if (status === 'closed') return 'status-closed'
      if (status === 'busy') return 'status-busy'
      if (status === 'full') return 'status-full'
      return 'status-open'
    },
    distanceText() {
      const raw = this.cardData?.distance
      const distance = Number(raw)
      if (raw !== null && raw !== undefined && raw !== '' && Number.isFinite(distance) && distance >= 0) {
        return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`
      }
      return ''
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
    handleMediaTap() {
      console.log('上方媒体区域被点击，准备跳转详情页并定位')
      this.$emit('media-tap', { cardData: this.cardData, index: this.index })
    },
    handleContentTap() {
      console.log('下方内容区域被点击，准备定位到地图')
      this.$emit('content-tap', { cardData: this.cardData, index: this.index })
    },
    onReserve() {
      uni.showToast({ title: '预约', icon: 'none' })
      this.$emit('reserve', { cardData: this.cardData, index: this.index })
    }
  },
  created() {
    this.checkInteractionStatus()
  }
}
</script>

<style>
.service-map-card {
  margin-bottom: 16rpx;
  border-radius: 18rpx;
  background-color: #ffffff;
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
  border: 1rpx solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 4rpx 18rpx rgba(0, 0, 0, 0.04);
  --card-media-height: 144px;
}

.service-map-card .card-media {
  height: var(--card-height, 220rpx);
  width: 100%;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  background: #e6efea;
}

.service-badge,
.service-rating {
  position: absolute;
  top: 12rpx;
  height: 32rpx;
  display: flex;
  align-items: center;
  font-weight: 500;
  line-height: 32rpx;
  background: rgba(255,255,255,.9);
  color: #365747;
  border-radius: 999px;
  font-size: 10px;
  padding: 4px 7px;
  box-shadow: none;
}

.service-badge {
  left: 12rpx;
  color: var(--color-text);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
}

.service-rating {
  right: 12rpx;
  color: #111827;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
}

.service-map-card .card-content {
  padding: 20rpx 20rpx 18rpx;
  width: 100%;
  box-sizing: border-box;
  cursor: pointer;
}

.service-map-card .card-title {
  color: var(--color-text);
  font-size: 28rpx;
  line-height: 40rpx;
  font-weight: 600;
  margin-bottom: 10rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  letter-spacing: 0.5rpx;
}

.service-map-card .card-info {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 14rpx;
}

.business-status {
  display: flex;
  align-items: center;
  gap: 5rpx;
  padding: 3rpx 10rpx;
  border-radius: 8rpx;
}

.business-status .status-dot {
  width: 6rpx;
  height: 6rpx;
  border-radius: 3rpx;
}

.business-status .status-text {
  font-size: 19rpx;
  font-weight: 500;
}

.status-open .status-dot { background: #111827; }
.status-open .status-text { color: #111827; }
.status-open { background: #f3f4f6; }

.status-busy .status-dot { background: #d97706; }
.status-busy .status-text { color: #d97706; }
.status-busy { background: #fef3c7; }

.status-full .status-dot { background: #dc2626; }
.status-full .status-text { color: #dc2626; }
.status-full { background: #fee2e2; }

.status-closed .status-dot { background: #9ca3af; }
.status-closed .status-text { color: #6b7280; }
.status-closed { background: #f3f4f6; }

.card-distance {
  color: var(--color-text-muted);
  font-size: 20rpx;
  font-variant-numeric: tabular-nums;
}

.service-map-card .card-author {
  display: none;
}

.service-map-card .card-footer {
  display: flex;
  align-items: center;
  width: 100%;
  padding-top: 12rpx;
  border-top: 1rpx solid var(--color-surface-muted);
  flex-wrap: wrap;
  gap: 8px;
}

.service-map-card .card-location {
  min-width: 0;
  flex: 1;
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  flex-basis: 100%;
  font-size: 11px;
}

.service-map-card .card-actions {
  display: flex;
  align-items: center;
  gap: 18rpx;
  flex-shrink: 0;
}

.service-map-card .action-btn {
  display: flex;
  align-items: center;
  gap: 4rpx;
  transition: opacity 0.15s ease;
}

.service-map-card .action-btn:active {
  opacity: 0.6;
}

.service-map-card .action-icon {
  font-size: 24rpx;
  color: var(--color-text-muted);
  line-height: 1;
}

.service-map-card .action-text {
  font-size: 20rpx;
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}

.service-map-card .action-btn.active .action-icon {
  color: var(--color-text);
}

.service-map-card .action-btn.active .action-text {
  color: var(--color-text);
}

.service-map-card .action-btn.active {
  animation: popIn 0.25s ease;
}

@keyframes popIn {
  0% { transform: scale(0.85); }
  50% { transform: scale(1.08); }
  100% { transform: scale(1); }
}

.reserve-big {
  flex: 0 0 auto;
  padding: 0 20rpx;
  font-weight: 500;
  line-height: 44rpx;
  letter-spacing: 1rpx;
  height: 40px;
  min-height: 40px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: #263d32;
  color: #fff;
  font-size: 13px;
  box-shadow: none;
}

.service-map-card .card-cover {
  width: 100%;
  height: 100%;
  display: block;
}

.service-cover-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 18px;
  gap: 6px;
  color: #456356;
}

.service-cover-empty text:first-child {
  font-size: 24px;
  font-weight: 600;
}

.service-cover-empty text:last-child {
  font-size: 11px;
}

.service-price-label {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 6px;
}
</style>

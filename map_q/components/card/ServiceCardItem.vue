<template>
  <view
    class="card service-map-card app-card content-card refined-card"
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
      <view class="card-title">{{ cardTitle }}</view>
      <view class="card-footer">
        <view class="card-author">
          <view class="business-status" :class="businessStatusClass">
            <text class="status-dot"></text>
            <text class="status-text">{{ businessStatusText }}</text>
          </view>
          <text v-if="distanceText" class="footer-text">{{ distanceText }}</text>
          <text v-if="locationText" class="footer-text">· {{ locationText }}</text>
        </view>
        <view class="card-actions" @tap.stop="preventBubble">
          <view class="action-btn" :class="{ active: isLiked }" @tap.stop="handleLike">
            <text class="action-icon">{{ isLiked ? '♥' : '♡' }}</text>
            <text class="action-text">{{ likesCount }}</text>
          </view>
          <view class="action-btn" :class="{ active: isFavorited }" @tap.stop="handleFavorite">
            <text class="action-icon">{{ isFavorited ? '★' : '☆' }}</text>
          </view>
          <view v-if="priceLabel" class="service-price-label">{{ priceLabel }}</view>
          <view class="reserve-big card-cta" @tap.stop="onReserve"><text class="cta-face">预约</text></view>
        </view>
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
      return ''
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
      if (!Number.isFinite(likes) || likes <= 0) return ''
      if (likes >= 10000) return (likes / 10000).toFixed(1) + '万'
      return String(likes)
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
  margin-bottom: 12rpx;
  border-radius: 0;
  background-color: transparent;
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
  border: none;
  box-shadow: none;
  --card-media-height: 144px;
}

.service-map-card .card-media {
  height: var(--card-height, 220rpx);
  width: 100%;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  background: #e6efea;
  border-radius: 8px;
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
  padding: 6px 8px;
  width: 100%;
  box-sizing: border-box;
  cursor: pointer;
}

.service-map-card .card-title {
  color: #333;
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.service-map-card .card-author {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  gap: 4px;
  overflow: hidden;
}

.service-map-card .card-author::before {
  content: '';
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #e0f2ec;
  margin-right: 4px;
  flex-shrink: 0;
  display: inline-block;
}

.service-map-card .footer-text {
  color: #999;
  font-size: 11px;
  line-height: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 0;
}

.service-map-card .card-info {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0;
  overflow: hidden;
}

.business-status {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 1px 4px;
  border-radius: 4px;
  flex-shrink: 0;
}

.business-status .status-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
}

.business-status .status-text {
  font-size: 10px;
  font-weight: 500;
  white-space: nowrap;
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
  font-size: 11px;
  line-height: 14px;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
  white-space: nowrap;
}

.service-map-card .card-location {
  flex: 1;
  min-width: 0;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  line-height: 14px;
  margin: 0;
}

.service-map-card .card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  flex-wrap: nowrap;
  gap: 4px;
  overflow: hidden;
}

.service-map-card .card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}

.service-map-card .action-btn {
  display: flex;
  align-items: center;
  gap: 4rpx;
  transition: opacity 0.15s ease;
  min-width: 32px;
  min-height: 32px;
  justify-content: center;
}

.service-map-card .action-btn:active {
  opacity: 0.6;
}

.service-map-card .action-icon {
  font-size: 14px;
  color: #999;
  line-height: 1;
}

.service-map-card .action-text {
  font-size: 11px;
  color: #999;
  font-variant-numeric: tabular-nums;
}

.service-map-card .action-btn.active .action-icon {
  color: #286c5c;
}

.service-map-card .action-btn.active .action-text {
  color: #286c5c;
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
  padding: 0;
  font-weight: 500;
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--card-action-text);
  font-size: 12px;
  box-shadow: none;
  margin: 0;
}

.service-map-card .card-cover {
  width: 100%;
  height: 100%;
  display: block;
}

.service-cover-empty {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #bcc6c0;
  font-size: 11px;
}

.service-cover-empty text:first-child {
  font-size: 11px;
  font-weight: 400;
}

.service-cover-empty text:last-child {
  font-size: 11px;
}

.service-price-label {
  font-size: 15px;
  font-weight: 600;
  color: var(--card-action-text);
  margin: 0;
  white-space: nowrap;
}
</style>

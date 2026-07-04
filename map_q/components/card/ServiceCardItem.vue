<template>
  <view
    class="card service-map-card"
    :style="{ '--card-height': height + 'rpx' }">
    <!-- 上半：媒体位（点击进入详情并定位） -->
    <view
      class="card-media"
      @tap="handleMediaTap"
      @click="handleMediaTap">
      <view class="service-map-grid"></view>
      <view class="service-badge">服务</view>
      <view class="service-rating">{{ ratingText }}</view>
      <view class="service-spot">
        <view class="service-spot-core"></view>
        <view class="service-spot-pulse"></view>
        <view class="service-spot-pulse-delay"></view>
      </view>
    </view>

    <!-- 下半：基础信息（点击只定位到地图） -->
    <view
      class="card-content"
      @tap="handleContentTap"
      @click="handleContentTap">
      <view class="card-title">{{ cardTitle }}</view>
      <!-- 时段状态条 -->
      <view class="availability-bar" @tap.stop="onBarTap" @click.stop="onBarTap">
        <view class="bar-row">
          <text class="bar-label bar-left">现在</text>
          <view class="bar-track">
            <view 
              v-for="(seg, i) in firstRowSegments" 
              :key="i" 
              class="bar-seg"
              :class="'seg-' + seg.status"
              :style="{ width: seg.width + '%' }"
            ></view>
          </view>
          <text class="bar-label bar-right">+6h</text>
        </view>
        <view class="bar-row">
          <text class="bar-label bar-left"></text>
          <view class="bar-track">
            <view 
              v-for="(seg, i) in secondRowSegments" 
              :key="i" 
              class="bar-seg"
              :class="'seg-' + seg.status"
              :style="{ width: seg.width + '%' }"
            ></view>
          </view>
          <text class="bar-label bar-right">+12h</text>
        </view>
      </view>
      <view class="card-info">
        <view class="business-status" :class="businessStatusClass">
          <text class="status-dot"></text>
          <text class="status-text">{{ businessStatusText }}</text>
        </view>
        <view class="card-distance">{{ distanceText }}</view>
      </view>
      <view class="card-footer">
        <view class="card-location">{{ locationText }}</view>
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
        <view class="reserve-big" @tap.stop="onReserve" @click.stop="onReserve">预约</view>
      </view>
    </view>
  </view>
</template>

<script>
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
      randomRating: null,
      isLiked: false,
      isFavorited: false
    }
  },
  computed: {
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
      if (this.randomRating != null) return this.randomRating
      const raw = this.cardData?.rating ?? this.cardData?.score
      const n = Number(raw)
      return Number.isFinite(n) ? n : 4.6
    },
    ratingText() {
      return `${this.ratingValue.toFixed(1)} 分`
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
      const distance = Number(this.cardData && this.cardData.distance)
      if (Number.isFinite(distance)) {
        if (distance < 1000) return `${Math.round(distance)}m`
        return `${(distance / 1000).toFixed(1)}km`
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
    },
    timeSlots() {
      const slots = this.cardData && this.cardData.timeSlots
      if (Array.isArray(slots) && slots.length > 0) return slots
      return this.generateMockSlots()
    },
    firstRowSegments() {
      return this.buildSegments(0, 12)
    },
    secondRowSegments() {
      return this.buildSegments(12, 24)
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
    },
    onBarTap() {
      this.$emit('reserve', { cardData: this.cardData, index: this.index, scrollToTime: true })
    },
    generateMockSlots() {
      const slots = []
      const now = new Date()
      const seed = (this.cardId || 0).toString().charCodeAt(0) || 5
      for (let i = 0; i < 24; i++) {
        const hour = now.getHours() + i * 0.5
        const normalizedHour = hour % 24
        let status = 'available'
        if (normalizedHour >= 22 || normalizedHour < 9) {
          status = 'closed'
        } else if (normalizedHour >= 18 && normalizedHour < 20) {
          status = 'busy'
        } else if (normalizedHour >= 12 && normalizedHour < 13.5) {
          status = 'busy'
        }
        const pseudo = Math.sin(seed + i * 1.7) * 0.5 + 0.5
        if (status === 'available' && pseudo > 0.85) status = 'busy'
        if (status === 'busy' && pseudo > 0.9) status = 'closed'
        slots.push({ index: i, status })
      }
      return slots
    },
    buildSegments(start, end) {
      const slots = this.timeSlots.slice(start, end)
      if (slots.length === 0) return []
      const segWidth = 100 / slots.length
      const result = []
      let currentStatus = slots[0].status
      let count = 1
      for (let i = 1; i < slots.length; i++) {
        if (slots[i].status === currentStatus) {
          count++
        } else {
          result.push({ status: currentStatus, width: count * segWidth })
          currentStatus = slots[i].status
          count = 1
        }
      }
      result.push({ status: currentStatus, width: count * segWidth })
      return result
    },
    makeRandomRating(min, max, step) {
      const steps = Math.round((max - min) / step)
      const idx = Math.floor(Math.random() * (steps + 1))
      return Number((min + idx * step).toFixed(1))
    }
  },
  created() {
    this.randomRating = this.makeRandomRating(2.0, 5.0, 0.1)
    this.checkInteractionStatus()
  }
}
</script>

<style>
.service-map-card {
  margin-bottom: 8rpx;
  border-radius: 12rpx;
  background-color: transparent;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
}

.service-map-card .card-media {
  position: relative;
  height: var(--card-height, 220rpx);
  width: 100%;
  cursor: pointer;
  overflow: hidden;
  background: #f8f8f8;
}

.service-map-grid {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  opacity: 0.5;
  background-image:
    linear-gradient(90deg, rgba(150, 150, 150, 0.06) 1rpx, transparent 1rpx),
    linear-gradient(rgba(150, 150, 150, 0.05) 1rpx, transparent 1rpx);
  background-size: 24rpx 24rpx, 24rpx 24rpx;
}

.service-badge,
.service-rating {
  position: absolute;
  height: 30rpx;
  padding: 0 10rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  font-size: 18rpx;
  font-weight: 400;
  line-height: 30rpx;
}

.service-badge {
  bottom: 8rpx;
  right: 8rpx;
  color: #fff;
  background: rgba(0, 0, 0, 0.5);
}

.service-rating {
  top: 8rpx;
  right: 8rpx;
  color: #fff;
  background: rgba(0, 0, 0, 0.5);
}

.service-spot {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 52rpx;
  height: 52rpx;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: rgba(92, 107, 192, 0.15);
  border: 2rpx solid rgba(255, 255, 255, 0.8);
}

.service-spot-core {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 24rpx;
  height: 24rpx;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: #5c6bc0;
  border: 4rpx solid #fff;
}

.service-spot-pulse {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 100%;
  height: 100%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: rgba(92, 107, 192, 0.2);
  animation: servicePulse 2s ease-out infinite;
}

.service-spot-pulse-delay {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 100%;
  height: 100%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: rgba(92, 107, 192, 0.2);
  animation: servicePulse 2s ease-out infinite;
  animation-delay: 1s;
}

@keyframes servicePulse {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.6;
  }
  100% {
    transform: translate(-50%, -50%) scale(2);
    opacity: 0;
  }
}

.service-map-card .card-content {
  padding: 10rpx;
  width: 100%;
  box-sizing: border-box;
  cursor: pointer;
}

.service-map-card .card-title {
  color: #000;
  font-size: 26rpx;
  line-height: 32rpx;
  font-weight: 400;
  margin-bottom: 8rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.availability-bar {
  margin-bottom: 8rpx;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.availability-bar .bar-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.availability-bar .bar-label {
  font-size: 18rpx;
  color: #ccc;
  flex-shrink: 0;
  width: 48rpx;
}

.availability-bar .bar-label.bar-right {
  text-align: right;
}

.availability-bar .bar-track {
  flex: 1;
  height: 6rpx;
  border-radius: 3rpx;
  background: #f0f0f0;
  overflow: hidden;
  display: flex;
  align-items: center;
}

.availability-bar .bar-seg {
  height: 100%;
  flex-shrink: 0;
}

.availability-bar .bar-seg.seg-available {
  background: #22c55e;
}

.availability-bar .bar-seg.seg-busy {
  background: #f59e0b;
}

.availability-bar .bar-seg.seg-closed {
  background: #ef4444;
}

.service-map-card .card-info {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 6rpx;
}

.business-status {
  display: flex;
  align-items: center;
  gap: 4rpx;
  padding: 2rpx 8rpx;
  border-radius: 6rpx;
}

.business-status .status-dot {
  width: 6rpx;
  height: 6rpx;
  border-radius: 3rpx;
}

.business-status .status-text {
  font-size: 18rpx;
}

.status-open .status-dot { background: #22c55e; }
.status-open .status-text { color: #22c55e; }
.status-open { background: rgba(34, 197, 94, 0.1); }

.status-busy .status-dot { background: #f59e0b; }
.status-busy .status-text { color: #f59e0b; }
.status-busy { background: rgba(245, 158, 11, 0.1); }

.status-full .status-dot { background: #ef4444; }
.status-full .status-text { color: #ef4444; }
.status-full { background: rgba(239, 68, 68, 0.1); }

.status-closed .status-dot { background: #999; }
.status-closed .status-text { color: #999; }
.status-closed { background: #f5f5f5; }

.card-distance {
  color: #999;
  font-size: 20rpx;
}

.service-map-card .card-author {
  display: none;
}

.service-map-card .card-footer {
  display: flex;
  align-items: center;
  gap: 10rpx;
  width: 100%;
}

.service-map-card .card-location {
  min-width: 0;
  flex: 1;
  color: #999;
  font-size: 20rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.service-map-card .card-actions {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex-shrink: 0;
}

.service-map-card .action-btn {
  display: flex;
  align-items: center;
  gap: 4rpx;
  transition: all 0.2s;
}

.service-map-card .action-btn:active {
  opacity: 0.7;
}

.service-map-card .action-icon {
  font-size: 24rpx;
  color: #999;
  line-height: 1;
}

.service-map-card .action-text {
  font-size: 20rpx;
  color: #999;
}

.service-map-card .action-btn.active .action-icon {
  color: #ff2442;
}

.service-map-card .action-btn.active .action-text {
  color: #ff2442;
}

.service-map-card .action-btn.active {
  animation: popIn 0.3s ease;
}

@keyframes popIn {
  0% { transform: scale(0.8); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.reserve-big {
  flex: 0 0 auto;
  height: 40rpx;
  padding: 0 16rpx;
  border-radius: 20rpx;
  color: #fff;
  font-size: 20rpx;
  font-weight: 500;
  line-height: 40rpx;
  background: #ff8a65;
}
</style>

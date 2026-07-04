<template>
  <view
    class="card event-card"
    :style="{ '--card-height': height + 'rpx' }">
    <!-- 上半部分：活动封面 -->
    <view
      class="card-media"
      @tap="handleMediaTap"
      @click="handleMediaTap">
      <image
        v-if="coverImage"
        class="card-cover"
        :src="coverImage"
        mode="aspectFill"
        @error="onCoverError"
      />
      <view v-else class="cover-placeholder">
        <view class="placeholder-icon">🎯</view>
        <text class="placeholder-text">活动</text>
      </view>
      <view class="event-status-bar" :class="statusClass"></view>
      <view class="event-time">
        <text class="time-text">{{ timeText }}</text>
      </view>
      <view class="event-badge">活动</view>
    </view>

    <!-- 下半部分：活动信息 -->
    <view
      class="card-content"
      @tap="handleContentTap"
      @click="handleContentTap">
      <view class="card-title">{{ cardTitle }}</view>
      <view class="card-info">
        <text class="info-text">{{ participantText }}</text>
        <view class="dot"></view>
        <text class="info-text location">{{ locationText }}</text>
      </view>
      <view v-if="maxParticipants > 0" class="registration-progress">
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
        </view>
        <text class="progress-text">报名进度 {{ progressPercent }}%</text>
      </view>
      <view class="card-footer">
        <view class="status-tag" :class="statusClass">{{ statusText }}</view>
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
        <view v-if="canRegister" class="register-btn" @tap.stop="handleRegister" @click.stop="handleRegister">
          {{ isRegistered ? '已报名' : '报名' }}
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { useInteraction } from '../../utils/interaction.js'

export default {
  name: 'EventCard',
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
      isFavorited: false,
      isRegistered: false,
      coverLoadFailed: false
    }
  },
  computed: {
    cardId() {
      return this.cardData && (this.cardData._id || this.cardData.id || this.index)
    },
    cardTitle() {
      return this.cardData && (this.cardData.name || this.cardData.title) ?
        (this.cardData.name || this.cardData.title) : '活动名称'
    },
    coverImage() {
      if (this.coverLoadFailed) return ''
      const data = this.cardData || {}
      const candidates = [
        data.cover,
        data.coverUrl,
        data.thumbnail,
        data.thumb,
        data.poster
      ]
      if (Array.isArray(data.images)) candidates.push(data.images[0])
      const found = candidates.find(item => typeof item === 'string' && item.trim())
      return found || ''
    },
    statusText() {
      const status = this.cardData && this.cardData.status
      if (status === 'ended') return '已结束'
      if (status === 'ongoing') return '进行中'
      const startTime = this.cardData && this.cardData.startTime
      if (startTime) {
        const now = Date.now()
        const start = new Date(startTime).getTime()
        const end = this.cardData.endTime ? new Date(this.cardData.endTime).getTime() : start + 86400000
        if (now > end) return '已结束'
        if (now >= start) return '进行中'
        return '即将开始'
      }
      return '报名中'
    },
    statusClass() {
      const status = this.cardData && this.cardData.status
      if (status === 'ended') return 'status-ended'
      if (status === 'ongoing') return 'status-ongoing'
      return 'status-upcoming'
    },
    timeText() {
      const startTime = this.cardData && this.cardData.startTime
      if (startTime) {
        const date = new Date(startTime)
        const month = date.getMonth() + 1
        const day = date.getDate()
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        return `${month}/${day} ${hours}:${minutes}`
      }
      const time = this.cardData && this.cardData.time
      return time ? String(time) : '时间待定'
    },
    currentParticipants() {
      return Number(this.cardData && this.cardData.participants || this.cardData && this.cardData.joined || 0)
    },
    maxParticipants() {
      return Number(this.cardData && this.cardData.maxParticipants || this.cardData && this.cardData.capacity || 0)
    },
    participantText() {
      if (this.maxParticipants > 0) {
        return `${this.currentParticipants}/${this.maxParticipants}人`
      }
      return `${this.currentParticipants}人参与`
    },
    progressPercent() {
      if (this.maxParticipants <= 0) return 0
      return Math.min(100, Math.round((this.currentParticipants / this.maxParticipants) * 100))
    },
    canRegister() {
      if (this.statusText === '已结束') return false
      if (this.maxParticipants > 0 && this.currentParticipants >= this.maxParticipants) return false
      return true
    },
    locationText() {
      if (this.cardData && typeof this.cardData.location === 'string' && this.cardData.location) {
        return this.cardData.location
      }
      if (this.cardData && typeof this.cardData.address === 'string' && this.cardData.address) {
        return this.cardData.address
      }
      if (this.cardData && this.cardData.location && this.cardData.location.type === 'Point') {
        const coords = this.cardData.location.coordinates
        if (Array.isArray(coords) && coords.length >= 2) {
          return `${coords[1].toFixed(2)}, ${coords[0].toFixed(2)}`
        }
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
  created() {
    this.checkInteractionStatus()
    this.checkRegistrationStatus()
  },
  methods: {
    checkInteractionStatus() {
      const interaction = useInteraction()
      this.isLiked = interaction.isLiked(this.cardId)
      this.isFavorited = interaction.isFavorited(this.cardId)
    },
    checkRegistrationStatus() {
      try {
        const registeredIds = uni.getStorageSync('REGISTERED_EVENTS') || []
        this.isRegistered = registeredIds.includes(this.cardId)
      } catch (e) {
        this.isRegistered = false
      }
    },
    onCoverError() {
      this.coverLoadFailed = true
    },
    handleLike() {
      const interaction = useInteraction()
      this.isLiked = interaction.toggleLike(this.cardId, this.cardData)
    },
    handleFavorite() {
      const interaction = useInteraction()
      this.isFavorited = interaction.toggleFavorite(this.cardId, this.cardData)
    },
    handleRegister() {
      if (this.isRegistered) {
        uni.showToast({ title: '您已报名', icon: 'none' })
        return
      }
      uni.showModal({
        title: '确认报名',
        content: `确定报名「${this.cardTitle}」吗？`,
        success: (res) => {
          if (res.confirm) {
            try {
              const registeredIds = uni.getStorageSync('REGISTERED_EVENTS') || []
              if (!registeredIds.includes(this.cardId)) {
                registeredIds.push(this.cardId)
                uni.setStorageSync('REGISTERED_EVENTS', registeredIds)
              }
              this.isRegistered = true
              uni.showToast({ title: '报名成功', icon: 'success' })
              this.$emit('register', { cardData: this.cardData, index: this.index })
            } catch (e) {
              uni.showToast({ title: '报名失败', icon: 'none' })
            }
          }
        }
      })
    },
    preventBubble() {},
    handleMediaTap() {
      console.log('活动卡片媒体区域被点击')
      this.$emit('media-tap', {
        cardData: this.cardData,
        index: this.index
      })
    },
    handleContentTap() {
      console.log('活动卡片内容区域被点击')
      this.$emit('content-tap', {
        cardData: this.cardData,
        index: this.index
      })
    }
  }
}
</script>

<style>
.event-card {
  margin-bottom: 8rpx;
  border-radius: 12rpx;
  background-color: transparent;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
}

.event-card .card-media {
  position: relative;
  height: var(--card-height, 280rpx);
  width: 100%;
  cursor: pointer;
  overflow: hidden;
  background: #f8f8f8;
}

.event-card .card-cover {
  width: 100%;
  height: 100%;
  display: block;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f8f8f8;
}

.placeholder-icon {
  font-size: 52rpx;
  margin-bottom: 8rpx;
  opacity: 0.3;
  color: #ccc;
  filter: grayscale(1);
}

.cover-placeholder-text {
  color: #ccc;
  font-size: 22rpx;
}

.event-badge {
  position: absolute;
  bottom: 8rpx;
  right: 8rpx;
  height: 30rpx;
  padding: 0 10rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  font-size: 18rpx;
  font-weight: 400;
  line-height: 30rpx;
  color: #fff;
  background: rgba(0, 0, 0, 0.5);
}

.event-status-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4rpx;
}

.status-upcoming {
  background: #ffb700;
}

.status-ongoing {
  background: #22c55e;
}

.status-ended {
  background: #999;
}

.event-time {
  position: absolute;
  left: 8rpx;
  bottom: 8rpx;
  padding: 0 10rpx;
  border-radius: 12rpx;
  background: rgba(0, 0, 0, 0.5);
  height: 30rpx;
  display: flex;
  align-items: center;
}

.time-text {
  color: #fff;
  font-size: 18rpx;
  font-weight: 400;
  line-height: 30rpx;
}

.event-card .card-content {
  padding: 10rpx;
  width: 100%;
  box-sizing: border-box;
  cursor: pointer;
}

.event-card .card-title {
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

.event-card .card-info {
  display: flex;
  align-items: center;
  width: 100%;
  margin-bottom: 8rpx;
}

.info-text {
  color: #999;
  font-size: 20rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.info-text.location {
  flex: 1;
  min-width: 0;
}

.dot {
  width: 4rpx;
  height: 4rpx;
  border-radius: 2rpx;
  background: #ccc;
  margin: 0 8rpx;
  flex-shrink: 0;
}

.registration-progress {
  margin-bottom: 8rpx;
}

.progress-bar {
  height: 6rpx;
  border-radius: 3rpx;
  background: #eee;
  overflow: hidden;
  margin-bottom: 4rpx;
}

.progress-fill {
  height: 100%;
  border-radius: 3rpx;
  background: #ff8a65;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 18rpx;
  color: #999;
}

.event-card .card-footer {
  display: flex;
  align-items: center;
  gap: 10rpx;
  width: 100%;
}

.status-tag {
  padding: 2rpx 8rpx;
  border-radius: 6rpx;
  font-size: 18rpx;
  flex-shrink: 0;
}

.status-tag.status-upcoming {
  background: rgba(251, 191, 36, 0.15);
  color: #b45309;
}

.status-tag.status-ongoing {
  background: rgba(34, 197, 94, 0.15);
  color: #15803d;
}

.status-tag.status-ended {
  background: #f5f5f5;
  color: #999;
}

.event-card .card-actions {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex-shrink: 0;
}

.event-card .action-btn {
  display: flex;
  align-items: center;
  gap: 4rpx;
  transition: all 0.2s;
}

.event-card .action-btn:active {
  opacity: 0.7;
}

.event-card .action-icon {
  font-size: 24rpx;
  color: #999;
  line-height: 1;
}

.event-card .action-text {
  font-size: 20rpx;
  color: #999;
}

.event-card .action-btn.active .action-icon {
  color: #ff2442;
}

.event-card .action-btn.active .action-text {
  color: #ff2442;
}

.event-card .action-btn.active {
  animation: popIn 0.3s ease;
}

@keyframes popIn {
  0% { transform: scale(0.8); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.register-btn {
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

.register-btn.registered {
  background: #eee;
  color: #999;
}
</style>

<template>
  <view
    class="card video-card"
    :style="{ '--card-height': height + 'rpx' }">
    <view
      class="card-media"
      @tap="handleMediaTap"
      @click="handleMediaTap">
      <image
        v-if="coverImage && !isPlaying"
        class="card-cover"
        :src="coverImage"
        mode="aspectFill"
      />
      <video
        v-if="isPlaying"
        class="video-player"
        :src="videoUrl"
        autoplay
        loop
        muted
        controls
        object-fit="cover"
        @play="onVideoPlay"
        @pause="onVideoPause"
        @ended="onVideoEnded"
      />
      <view v-else class="cover-placeholder">
        <text class="cover-placeholder-text">暂无封面</text>
      </view>
      <view v-if="!isPlaying" class="play-btn" @tap.stop="togglePlay">
        <view class="play-icon"></view>
      </view>
      <view v-if="!isPlaying && durationText" class="video-duration">{{ durationText }}</view>
      <view v-if="isPlaying" class="video-overlay">
        <view class="pause-btn" @tap.stop="togglePlay">
          <view class="pause-icon"></view>
        </view>
      </view>
    </view>

    <view
      class="card-content"
      @tap="handleContentTap"
      @click="handleContentTap">
      <view class="card-title">{{ cardTitle }}</view>
      <view class="card-footer">
        <view class="card-author">
          <text class="author-name">{{ cardAuthor }}</text>
        </view>
        <view class="card-stats">
          <text class="stat-icon">▶</text>
          <text class="stat-text">{{ playCountText }}</text>
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
import { ref } from 'vue'
import { useInteraction } from '../../utils/interaction.js'

export default {
  name: 'VideoCard',
  props: {
    height: {
      type: Number,
      default: 240
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
      isPlaying: false
    }
  },
  computed: {
    cardId() {
      return this.cardData && (this.cardData._id || this.cardData.id || this.index)
    },
    cardTitle() {
      return this.cardData && (this.cardData.name || this.cardData.title) ?
        (this.cardData.name || this.cardData.title) : '视频标题'
    },
    cardAuthor() {
      return this.cardData && this.cardData.author ? this.cardData.author : '作者'
    },
    coverImage() {
      const data = this.cardData || {}
      const candidates = [
        data.cover,
        data.coverUrl,
        data.thumbnail,
        data.thumb,
        data.poster
      ]
      if (Array.isArray(data.images)) candidates.push(data.images[0])
      if (Array.isArray(data.media)) {
        const first = data.media[0]
        candidates.push(typeof first === 'string' ? first : first && (first.url || first.src))
      }
      const found = candidates.find(item => typeof item === 'string' && item.trim())
      return found || ''
    },
    videoUrl() {
      const data = this.cardData || {}
      const candidates = [
        data.videoUrl,
        data.video,
        data.src,
        data.url
      ]
      if (Array.isArray(data.media)) {
        const video = data.media.find(m => m && m.type === 'video')
        if (video) candidates.push(typeof video === 'string' ? video : video.url || video.src)
      }
      return candidates.find(item => typeof item === 'string' && item.trim()) || ''
    },
    durationText() {
      const duration = this.cardData && this.cardData.duration
      if (duration) {
        if (typeof duration === 'number') {
          const mins = Math.floor(duration / 60)
          const secs = duration % 60
          return `${mins}:${String(secs).padStart(2, '0')}`
        }
        return String(duration)
      }
      return ''
    },
    playCountText() {
      const count = Number(this.cardData && this.cardData.plays || this.cardData && this.cardData.views || 0)
      if (count >= 10000) {
        return (count / 10000).toFixed(1) + '万'
      }
      return count.toString()
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
  beforeDestroy() {
    this.isPlaying = false
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
    togglePlay() {
      this.isPlaying = !this.isPlaying
      if (this.isPlaying) {
        this.$emit('video-play', { cardData: this.cardData, index: this.index })
      }
    },
    onVideoPlay() {
      this.isPlaying = true
    },
    onVideoPause() {
      this.isPlaying = false
    },
    onVideoEnded() {
      this.isPlaying = false
    },
    handleMediaTap() {
      if (!this.isPlaying) {
        this.togglePlay()
      } else {
        this.$emit('media-tap', {
          cardData: this.cardData,
          index: this.index
        })
      }
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
.video-card {
  margin-bottom: 8rpx;
  border-radius: 12rpx;
  background-color: transparent;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
}

.video-card .card-media {
  position: relative;
  height: var(--card-height, 280rpx);
  width: 100%;
  cursor: pointer;
  overflow: hidden;
  background: #f8f8f8;
}

.video-card .card-cover {
  width: 100%;
  height: 100%;
  display: block;
}

.video-player {
  width: 100%;
  height: 100%;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f8f8;
}

.cover-placeholder-text {
  color: #ccc;
  font-size: 22rpx;
}

.play-btn {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.play-btn:active {
  transform: translate(-50%, -50%) scale(0.9);
  background: rgba(255, 255, 255, 0.95);
}

.play-icon {
  width: 0;
  height: 0;
  margin-left: 6rpx;
  border-style: solid;
  border-width: 12rpx 0 12rpx 20rpx;
  border-color: transparent transparent transparent #ffffff;
}

.video-duration {
  position: absolute;
  right: 8rpx;
  bottom: 8rpx;
  padding: 0 10rpx;
  border-radius: 12rpx;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 18rpx;
  font-weight: 400;
  line-height: 30rpx;
  display: flex;
  align-items: center;
}

.video-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.2);
  opacity: 0;
  transition: opacity 0.2s;
}

.video-card .card-media:active .video-overlay {
  opacity: 1;
}

.pause-btn {
  width: 52rpx;
  height: 52rpx;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid rgba(255, 255, 255, 0.5);
}

.pause-icon {
  width: 18rpx;
  height: 18rpx;
  display: flex;
  gap: 4rpx;
}

.pause-icon::before,
.pause-icon::after {
  content: '';
  width: 5rpx;
  height: 100%;
  background: #ffffff;
  border-radius: 2rpx;
}

.video-card .card-content {
  padding: 10rpx;
  width: 100%;
  box-sizing: border-box;
  cursor: pointer;
}

.video-card .card-title {
  width: 100%;
  color: #000;
  font-size: 26rpx;
  font-weight: 400;
  line-height: 32rpx;
  margin-bottom: 6rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-card .card-footer {
  display: flex;
  align-items: center;
  width: 100%;
}

.video-card .card-author {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.video-card .card-author::before {
  content: '';
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  background: #eee;
  margin-right: 6rpx;
  flex-shrink: 0;
}

.author-name {
  color: #999;
  font-size: 20rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.video-card .card-stats {
  display: flex;
  align-items: center;
  gap: 4rpx;
  flex-shrink: 0;
}

.stat-icon {
  font-size: 18rpx;
  color: #999;
}

.stat-text {
  font-size: 20rpx;
  color: #999;
}

.video-card .card-actions {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex-shrink: 0;
}

.video-card .action-btn {
  display: flex;
  align-items: center;
  gap: 4rpx;
  transition: all 0.2s;
}

.video-card .action-btn:active {
  opacity: 0.7;
}

.video-card .action-icon {
  font-size: 24rpx;
  color: #999;
  line-height: 1;
}

.video-card .action-text {
  font-size: 20rpx;
  color: #999;
}

.video-card .action-btn.active .action-icon {
  color: #ff2442;
}

.video-card .action-btn.active .action-text {
  color: #ff2442;
}

.video-card .action-btn.active {
  animation: popIn 0.3s ease;
}

@keyframes popIn {
  0% { transform: scale(0.8); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}
</style>

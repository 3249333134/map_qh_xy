<template>
  <view
    class="card map-card app-card content-card refined-card"
    :style="{ '--card-height': height + 'rpx' }">
    <!-- 卡片上半部分：点击进入详情页并定位 -->
    <view
      class="card-media"
      @tap="handleMediaTap"
      @click="handleMediaTap">
      <image
        v-if="coverImage"
        class="card-cover"
        :src="coverImage"
        mode="aspectFill"
      />
      <view v-else class="cover-placeholder">
        <text class="cover-placeholder-text">暂无封面</text>
      </view>
      <view class="media-heat">{{ heatText }}</view>
    </view>
    <!-- 卡片下半部分：点击只定位到地图 -->
    <view
      class="card-content"
      @tap="handleContentTap"
      @click="handleContentTap">
      <view class="card-title">{{ cardTitle }}</view>
      <view class="card-footer">
        <view class="card-author">
          <text class="author-name">{{ cardAuthor }}</text>
          <text v-if="distanceText" class="card-location">{{ distanceText }}</text>
        </view>
        <view class="card-actions" @tap.stop="preventBubble" @click.stop="preventBubble">
          <view class="action-btn" :class="{ active: isLiked }" @tap.stop="handleLike" @click.stop="handleLike">
            <text class="action-icon">{{ isLiked ? '♥' : '♡' }}</text>
            <text class="action-text">{{ likesCount }}</text>
          </view>
          <view class="action-btn" :class="{ active: isFavorited }" @tap.stop="handleFavorite" @click.stop="handleFavorite">
            <text class="action-icon">{{ isFavorited ? '★' : '☆' }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { useInteraction } from '../../utils/interaction.js'

export default {
  name: 'CardItem',
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
    cardTitle() {
      return this.cardData && (this.cardData.name || this.cardData.title) ?
        (this.cardData.name || this.cardData.title) : '标题占位符'
    },
    cardAuthor() {
      return this.cardData && this.cardData.author ? this.cardData.author : '作者占位符'
    },
    locationText() {
      if (this.cardData && this.cardData.location && this.cardData.location.coordinates) {
        const [lng, lat] = this.cardData.location.coordinates
        return `${lat.toFixed(2)}, ${lng.toFixed(2)}`
      }
      return this.cardData && this.cardData.address ? this.cardData.address : '未知位置'
    },
    distanceText() {
      const raw = this.cardData && this.cardData.distance
      const distance = Number(raw)
      if (raw !== null && raw !== undefined && raw !== '' && Number.isFinite(distance) && distance >= 0) {
        return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`
      }
      return ''
    },
    coverImage() {
      const data = this.cardData || {}
      const candidates = [
        data.cover,
        data.coverUrl,
        data.coverImage,
        data.thumbnail,
        data.thumb,
        data.image,
        data.imageUrl,
        data.photo,
        data.picture
      ]
      if (Array.isArray(data.images)) candidates.push(data.images[0])
      if (Array.isArray(data.photos)) candidates.push(data.photos[0])
      if (Array.isArray(data.media)) {
        const first = data.media[0]
        candidates.push(typeof first === 'string' ? first : first && (first.url || first.src))
      }
      const found = candidates.find(item => typeof item === 'string' && item.trim() && !/\/static\/logo\.png(?:\?|$)/i.test(item))
      return found || ''
    },
    heatText() {
      const likes = Number(this.cardData && this.cardData.likes)
      if (Number.isFinite(likes) && likes > 300) return '高热'
      if (Number.isFinite(likes) && likes > 120) return '推荐'
      return '附近'
    },
    descriptionText() {
      const text = this.cardData && this.cardData.description
      return text ? String(text) : ''
    },
    cardId() {
      return this.cardData && (this.cardData._id || this.cardData.id || this.index)
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
    preventBubble() {
      // 阻止事件冒泡
    },
    // 上方媒体区域点击：进入详情页并定位
    handleMediaTap() {
      console.log('上方媒体区域被点击，准备跳转详情页并定位')
      this.$emit('media-tap', {
        cardData: this.cardData,
        index: this.index
      })
    },

    // 下方内容区域点击：只定位到地图
    handleContentTap() {
      console.log('下方内容区域被点击，准备定位到地图')
      this.$emit('content-tap', {
        cardData: this.cardData,
        index: this.index
      })
    }
  }
}
</script>

<style>
.card.map-card {
  margin-bottom: 12rpx;
  border-radius: 0;
  background-color: transparent;
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
  position: relative;
  border: none;
  box-shadow: none;
}

.card.map-card .card-media {
  position: relative;
  height: var(--card-height, 280rpx);
  width: 100%;
  cursor: pointer;
  overflow: hidden;
  background: var(--color-surface-raised);
  border-radius: 8px;
}

.card-cover {
  width: 100%;
  height: 100%;
  display: block;
}

.media-heat {
  position: absolute;
  top: 12rpx;
  right: 12rpx;
  height: 32rpx;
  padding: 0 12rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  font-size: 18rpx;
  font-weight: 500;
  line-height: 32rpx;
  color: #111827;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface-raised);
}

.cover-placeholder-text {
  color: #b0b0b0;
  font-size: 22rpx;
  letter-spacing: 1rpx;
}

.card.map-card .card-content {
  padding: 6px 8px;
  width: 100%;
  box-sizing: border-box;
  cursor: pointer;
}

.card.map-card .card-title {
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

.card.map-card .card-info {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0;
  overflow: hidden;
}

.card.map-card .card-author {
  display: flex;
  align-items: center;
  color: #999;
  font-size: 11px;
  line-height: 14px;
  flex: 1;
  min-width: 0;
  gap: 4px;
  overflow: hidden;
}

.card.map-card .card-author::before {
  content: '';
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #e0f2ec;
  margin-right: 4px;
  flex-shrink: 0;
  display: inline-block;
}

.card.map-card .author-name {
  color: #999;
  font-size: 11px;
  line-height: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.card.map-card .card-location {
  flex-shrink: 0;
  font-size: 11px;
  line-height: 14px;
  color: #999;
}

.card.map-card .footer-text {
  font-size: 11px;
  line-height: 14px;
  color: #999;
}

.card-description {
  display: none;
}

.card.map-card .card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  flex-wrap: nowrap;
  gap: 4px;
  overflow: hidden;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4rpx;
  transition: opacity 0.15s ease;
  min-width: 32px;
  min-height: 32px;
  justify-content: center;
}

.action-btn:active {
  opacity: 0.6;
}

.action-icon {
  font-size: 14px;
  color: #999;
  line-height: 1;
}

.action-btn.active .action-icon {
  color: #286c5c;
}

.action-text {
  font-size: 11px;
  color: #999;
  font-variant-numeric: tabular-nums;
}

.action-btn.active .action-text {
  color: #286c5c;
}

.action-btn.active {
  animation: popIn 0.25s ease;
}

@keyframes popIn {
  0% {
    transform: scale(0.85);
  }
  50% {
    transform: scale(1.08);
  }
  100% {
    transform: scale(1);
  }
}
</style>

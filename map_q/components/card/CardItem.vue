<template>
  <view
    class="card map-card"
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
      <view class="card-author">{{ cardAuthor }}</view>
      <view v-if="descriptionText" class="card-description">{{ descriptionText }}</view>
      <view class="card-footer">
        <view class="card-location">
          <text class="footer-label">距</text>
          <text class="footer-text">{{ locationText }}</text>
        </view>
        <!-- 交互按钮区域 -->
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
      const found = candidates.find(item => typeof item === 'string' && item.trim())
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
  margin-bottom: 20rpx;
  border-radius: 24rpx;
  background-color: #fff;
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
  position: relative;
}

.card.map-card .card-media {
  position: relative;
  height: var(--card-height, 280rpx);
  width: 100%;
  cursor: pointer;
  overflow: hidden;
  background: #f8f8f8;
}

.card-cover {
  width: 100%;
  height: 100%;
  display: block;
}

.media-heat {
  position: absolute;
  bottom: 10rpx;
  right: 10rpx;
  height: 30rpx;
  padding: 0 10rpx;
  border-radius: 15rpx;
  display: flex;
  align-items: center;
  font-size: 18rpx;
  font-weight: 600;
  line-height: 30rpx;
  color: #fff;
  background: rgba(0, 0, 0, 0.5);
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

.card.map-card .card-content {
  padding: 18rpx 18rpx 16rpx;
  width: 100%;
  box-sizing: border-box;
  cursor: pointer;
}

.card.map-card .card-title {
  width: 100%;
  color: #000;
  font-size: 28rpx;
  font-weight: 650;
  line-height: 38rpx;
  margin-bottom: 10rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card.map-card .card-author {
  display: flex;
  align-items: center;
  color: #64748b;
  font-size: 22rpx;
  line-height: 26rpx;
  margin-bottom: 4rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-author::before {
  content: '';
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  background: linear-gradient(135deg,#ffedd5,#fed7aa);
  border: 2rpx solid #fff;
  box-shadow: 0 0 0 1rpx rgba(234,88,12,.12);
  margin-right: 6rpx;
  flex-shrink: 0;
}

.card-description {
  display: none;
}

.card.map-card .card-footer {
  display: flex;
  align-items: center;
  width: 100%;
}

.card.map-card .card-location {
  display: none;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 20rpx;
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4rpx;
  transition: all 0.2s;
  min-width: 44rpx;
  min-height: 44rpx;
  justify-content: center;
}

.action-btn:active {
  opacity: 0.7;
}

.action-icon {
  font-size: 24rpx;
  color: #999;
  line-height: 1;
}

.action-btn.active .action-icon {
  color: #ff2442;
}

.action-text {
  font-size: 20rpx;
  color: #999;
}

.action-btn.active .action-text {
  color: #ff2442;
}

.action-btn.active {
  animation: popIn 0.3s ease;
}

@keyframes popIn {
  0% {
    transform: scale(0.8);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}
</style>

<template>
  <view
    class="card article-card app-card content-card refined-card"
    :style="{ '--card-height': height + 'rpx' }">
    <!-- 上半部分：文章封面（横向长图） -->
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
        <view class="placeholder-icon">📝</view>
        <text class="placeholder-text">文章</text>
      </view>
      <!-- 文章标识 -->
      <view class="article-badge">
        <text class="badge-icon">文</text>
      </view>
      <!-- 已读标记 -->
      <view v-if="isRead" class="read-mark">已读</view>
    </view>

    <!-- 下半部分：文章信息 -->
    <view
      class="card-content"
      @tap="handleContentTap"
      @click="handleContentTap">
      <view class="card-title">{{ cardTitle }}</view>
      <view class="card-footer">
        <view class="card-author">
          <text class="author-name">{{ cardAuthor }}</text>
          <text v-if="readCountText" class="footer-text">· {{ readCountText }}</text>
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
  name: 'ArticleCard',
  props: {
    height: {
      type: Number,
      default: 280
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
      isRead: false,
      coverLoadFailed: false
    }
  },
  computed: {
    cardId() {
      return this.cardData && (this.cardData._id || this.cardData.id || this.index)
    },
    cardTitle() {
      return this.cardData && (this.cardData.name || this.cardData.title) ?
        (this.cardData.name || this.cardData.title) : '文章标题'
    },
    cardAuthor() {
      return this.cardData && this.cardData.author ? this.cardData.author : '作者'
    },
    excerptText() {
      const text = this.cardData && (this.cardData.description || this.cardData.excerpt || this.cardData.summary)
      return text ? String(text) : ''
    },
    coverImage() {
      if (this.coverLoadFailed) return ''
      const data = this.cardData || {}
      const candidates = [
        data.cover,
        data.coverUrl,
        data.thumbnail,
        data.thumb,
        data.image
      ]
      if (Array.isArray(data.images)) candidates.push(data.images[0])
      const found = candidates.find(item => typeof item === 'string' && item.trim() && !/\/static\/logo\.png(?:\?|$)/i.test(item))
      return found || ''
    },
    readCountText() {
      const count = Number(this.cardData && this.cardData.reads || this.cardData && this.cardData.views || 0)
      if (count >= 10000) {
        return (count / 10000).toFixed(1) + '万阅读'
      }
      return count + '阅读'
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
    this.checkReadStatus()
  },
  methods: {
    checkInteractionStatus() {
      const interaction = useInteraction()
      this.isLiked = interaction.isLiked(this.cardId)
      this.isFavorited = interaction.isFavorited(this.cardId)
    },
    checkReadStatus() {
      try {
        const readIds = uni.getStorageSync('READ_ARTICLES') || []
        this.isRead = readIds.includes(this.cardId)
      } catch (e) {
        this.isRead = false
      }
    },
    onCoverError() {
      this.coverLoadFailed = true
    },
    markAsRead() {
      try {
        const readIds = uni.getStorageSync('READ_ARTICLES') || []
        if (!readIds.includes(this.cardId)) {
          readIds.push(this.cardId)
          uni.setStorageSync('READ_ARTICLES', readIds)
        }
        this.isRead = true
      } catch (e) {
        console.error('标记已读失败:', e)
      }
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
      console.log('文章卡片媒体区域被点击')
      this.markAsRead()
      this.$emit('media-tap', {
        cardData: this.cardData,
        index: this.index
      })
    },
    handleContentTap() {
      console.log('文章卡片内容区域被点击')
      this.$emit('content-tap', {
        cardData: this.cardData,
        index: this.index
      })
    }
  }
}
</script>

<style>
.article-card {
  margin-bottom: 12rpx;
  border-radius: 0;
  background-color: transparent;
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
  --card-media-height: 104px;
  border: none;
  box-shadow: none;
}

.article-card .card-media {
  position: relative;
  height: var(--card-height, 240rpx);
  width: 100%;
  cursor: pointer;
  overflow: hidden;
  background: var(--color-page);
  border-radius: 8px;
}

.article-card .card-cover {
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
  background: var(--color-page);
}

.placeholder-icon {
  font-size: 52rpx;
  margin-bottom: 8rpx;
  opacity: 0.5;
}

.placeholder-text {
  color: #ccc;
  font-size: 20rpx;
}

.read-mark {
  position: absolute;
  top: 10rpx;
  right: 10rpx;
  padding: 4rpx 10rpx;
  border-radius: 6rpx;
  background: rgba(255, 255, 255, 0.95);
  color: var(--color-text-muted);
  font-size: 18rpx;
}

.article-badge {
  position: absolute;
  top: 10rpx;
  left: 10rpx;
  width: 36rpx;
  height: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgba(255,255,255,.92);
  color: #3f5650;
  box-shadow: none;
}

.badge-icon {
  color: #fff;
  font-size: 20rpx;
  font-weight: 600;
}

.article-card .card-content {
  padding: 6px 8px;
  width: 100%;
  box-sizing: border-box;
  cursor: pointer;
}

.article-card .card-title {
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

.article-card .card-excerpt {
  display: none;
}

.article-card .card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  flex-wrap: nowrap;
  gap: 4px;
  overflow: hidden;
}

.article-card .card-author {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  gap: 4px;
}

.article-card .card-author::before {
  content: '';
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #e0f2ec;
  margin-right: 4px;
  flex-shrink: 0;
  display: inline-block;
}

.author-name {
  color: #999;
  font-size: 11px;
  line-height: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.footer-text {
  color: #999;
  font-size: 11px;
  line-height: 14px;
  flex-shrink: 0;
}

.article-card .card-stats {
  flex-shrink: 0;
}

.stat-text {
  font-size: 11px;
  line-height: 14px;
  color: #999;
}

.article-card .card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}

.article-card .action-btn {
  display: flex;
  align-items: center;
  gap: 4rpx;
  transition: all 0.2s;
  min-width: 32px;
  min-height: 32px;
  justify-content: center;
}

.article-card .action-btn:active {
  opacity: 0.7;
}

.article-card .action-icon {
  font-size: 14px;
  color: #999;
  line-height: 1;
}

.article-card .action-text {
  font-size: 11px;
  color: #999;
}

.article-card .action-btn.active .action-icon {
  color: #286c5c;
}

.article-card .action-btn.active .action-text {
  color: #286c5c;
}

.article-card .action-btn.active {
  animation: popIn 0.3s ease;
}

@keyframes popIn {
  0% { transform: scale(0.8); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}
</style>

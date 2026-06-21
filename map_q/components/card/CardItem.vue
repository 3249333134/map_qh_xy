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
        <view class="card-stats">{{ cardStats }}</view>
      </view>
    </view>
  </view>
</template>

<script>
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
  computed: {
    cardTitle() {
      return this.cardData && (this.cardData.name || this.cardData.title) ?
        (this.cardData.name || this.cardData.title) : '标题占位符'
    },
    cardAuthor() {
      return this.cardData && this.cardData.author ? this.cardData.author : '作者占位符'
    },
    cardStats() {
      if (this.cardData && this.cardData.likes) {
        return `${this.cardData.likes} 赞`
      }
      return '0 赞'
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
    }
  },
  methods: {
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
.map-card {
  margin-bottom: 20rpx;
  border-radius: 16rpx;
  background-color: #fff;
  overflow: hidden;
  box-shadow: 0 8rpx 24rpx rgba(31, 41, 55, 0.08);
  width: 100%;
  box-sizing: border-box;
  border: 1rpx solid rgba(226, 232, 240, 0.9);
}

.map-card .card-media {
  position: relative;
  height: var(--card-height, 200rpx);
  width: 100%;
  cursor: pointer;
  overflow: hidden;
  background: #eef2f7;
}

.card-cover {
  width: 100%;
  height: 100%;
  display: block;
}

.media-heat {
  position: absolute;
  top: 14rpx;
  height: 36rpx;
  padding: 0 14rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  font-size: 22rpx;
  font-weight: 600;
  line-height: 36rpx;
}

.media-heat {
  right: 14rpx;
  color: #ef6c2f;
  background: rgba(255, 247, 237, 0.92);
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    linear-gradient(135deg, #f8fafc 0%, #eef2f7 100%);
}

.cover-placeholder-text {
  color: #94a3b8;
  font-size: 24rpx;
  font-weight: 600;
}

.map-card .card-content {
  padding: 18rpx 18rpx 16rpx;
  width: 100%;
  box-sizing: border-box;
  cursor: pointer;
}

.map-card .card-title {
  width: 100%;
  color: #1f2937;
  font-size: 29rpx;
  font-weight: 700;
  line-height: 38rpx;
  margin-bottom: 8rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.map-card .card-author {
  color: #64748b;
  font-size: 23rpx;
  line-height: 30rpx;
  margin-bottom: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-description {
  color: #94a3b8;
  font-size: 22rpx;
  line-height: 30rpx;
  margin-bottom: 10rpx;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.map-card .card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10rpx;
  width: 100%;
}

.map-card .card-location {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
  color: #94a3b8;
  font-size: 22rpx;
  overflow: hidden;
  white-space: nowrap;
}

.footer-label {
  flex: 0 0 auto;
  margin-right: 6rpx;
  color: #38bdf8;
  font-size: 20rpx;
  font-weight: 700;
}

.footer-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.map-card .card-stats {
  flex: 0 0 auto;
  color: #64748b;
  font-size: 22rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

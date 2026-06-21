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
      </view>
    </view>

    <!-- 下半：基础信息（点击只定位到地图） -->
    <view
      class="card-content"
      @tap="handleContentTap"
      @click="handleContentTap">
      <view class="card-title">{{ cardTitle }}</view>
      <view class="card-author">{{ cardAuthor }}</view>
      <view class="card-footer">
        <view class="card-location">{{ locationText }}</view>
        <view class="reserve-big" @tap.stop="onReserve" @click.stop="onReserve">预约</view>
      </view>
    </view>
  </view>
</template>

<script>
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
      randomRating: null
    }
  },
  computed: {
    cardTitle() {
      return this.cardData && (this.cardData.name || this.cardData.title)
        ? (this.cardData.name || this.cardData.title)
        : '标题占位符'
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
    ratingValue() {
      if (this.randomRating != null) return this.randomRating
      const raw = this.cardData?.rating ?? this.cardData?.score
      const n = Number(raw)
      return Number.isFinite(n) ? n : 4.6
    },
    ratingText() {
      return `${this.ratingValue.toFixed(1)} 分`
    }
  },
  methods: {
    // 上方媒体区域点击：进入详情页并定位
    handleMediaTap() {
      console.log('上方媒体区域被点击，准备跳转详情页并定位')
      this.$emit('media-tap', { cardData: this.cardData, index: this.index })
    },
    // 下方内容区域点击：只定位到地图
    handleContentTap() {
      console.log('下方内容区域被点击，准备定位到地图')
      this.$emit('content-tap', { cardData: this.cardData, index: this.index })
    },
    onReserve() {
      uni.showToast({ title: '预约', icon: 'none' })
      this.$emit('reserve', { cardData: this.cardData, index: this.index })
    },
    makeRandomRating(min, max, step) {
      const steps = Math.round((max - min) / step)
      const idx = Math.floor(Math.random() * (steps + 1))
      return Number((min + idx * step).toFixed(1))
    }
  },
  created() {
    // 每个卡片实例仅生成一次随机评分（2.0~5.0，步进 0.1）
    this.randomRating = this.makeRandomRating(2.0, 5.0, 0.1)
  }
}
</script>

<style>
.service-map-card {
  margin-bottom: 20rpx;
  border-radius: 16rpx;
  background-color: #fff;
  overflow: hidden;
  box-shadow: 0 8rpx 24rpx rgba(31, 41, 55, 0.08);
  width: 100%;
  box-sizing: border-box;
  border: 1rpx solid rgba(226, 232, 240, 0.9);
}

.service-map-card .card-media {
  position: relative;
  height: var(--card-height, 200rpx);
  width: 100%;
  cursor: pointer;
  overflow: hidden;
  background:
    radial-gradient(circle at 72% 28%, rgba(253, 186, 116, 0.52), transparent 34%),
    linear-gradient(135deg, #e0f2fe 0%, #f0fdf4 54%, #fff7ed 100%);
}

.service-map-grid {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  opacity: 0.75;
  background-image:
    linear-gradient(90deg, rgba(100, 116, 139, 0.14) 1rpx, transparent 1rpx),
    linear-gradient(rgba(100, 116, 139, 0.12) 1rpx, transparent 1rpx),
    linear-gradient(145deg, transparent 0 44%, rgba(14, 165, 233, 0.22) 44% 49%, transparent 49% 100%);
  background-size: 34rpx 34rpx, 34rpx 34rpx, 100% 100%;
}

.service-badge,
.service-rating {
  position: absolute;
  top: 14rpx;
  height: 36rpx;
  padding: 0 14rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  font-size: 22rpx;
  font-weight: 600;
}

.service-badge {
  left: 14rpx;
  color: #0369a1;
  background: rgba(255, 255, 255, 0.86);
}

.service-rating {
  right: 14rpx;
  color: #b45309;
  background: rgba(255, 251, 235, 0.92);
}

.service-spot {
  position: absolute;
  left: 50%;
  top: 52%;
  width: 58rpx;
  height: 58rpx;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: rgba(14, 165, 233, 0.18);
  border: 2rpx solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 10rpx 22rpx rgba(14, 165, 233, 0.18);
}

.service-spot-core {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 26rpx;
  height: 26rpx;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: #0ea5e9;
  border: 6rpx solid #fff;
}

.service-map-card .card-content {
  padding: 18rpx;
  width: 100%;
  box-sizing: border-box;
  cursor: pointer;
}

.service-map-card .card-title {
  color: #1f2937;
  font-size: 29rpx;
  line-height: 38rpx;
  font-weight: 700;
  margin-bottom: 8rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.service-map-card .card-author {
  color: #64748b;
  font-size: 23rpx;
  line-height: 30rpx;
  margin-bottom: 12rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.service-map-card .card-footer {
  display: flex;
  align-items: center;
  gap: 12rpx;
  width: 100%;
}

.service-map-card .card-location {
  min-width: 0;
  flex: 1;
  color: #94a3b8;
  font-size: 22rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reserve-big {
  flex: 0 0 auto;
  height: 46rpx;
  padding: 0 18rpx;
  border-radius: 23rpx;
  color: #fff;
  font-size: 23rpx;
  font-weight: 700;
  line-height: 46rpx;
  background: linear-gradient(135deg, #0ea5e9 0%, #22c55e 100%);
  box-shadow: 0 6rpx 14rpx rgba(14, 165, 233, 0.22);
}
</style>

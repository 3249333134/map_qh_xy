<template> 
  <view 
    class="card" 
    :style="{ '--card-height': height + 'rpx' }"> 
    <!-- 上半：媒体位（点击进入详情并定位） --> 
    <view 
      class="card-media"
      @tap="handleMediaTap"
      @click="handleMediaTap">
      <!-- 保持媒体区不再有覆盖元素 -->
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
        <!-- 这里不再放右侧内容，避免影响左侧布局 -->
      </view> 

      <!-- 新增：右侧悬浮的评分 + 预（不改变左侧间距与布局） -->
      <view class="cta-float" @tap.stop @click.stop>
        <text class="rating-float">{{ ratingText }}</text>
        <view class="reserve-big" @tap.stop="onReserve" @click.stop="onReserve">预</view>
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
  mounted() {
    uni.showToast({ title: 'ServiceCardItem', icon: 'none', duration: 600 });
  },
  created() {
    // 每个卡片实例仅生成一次随机评分（2.0~5.0，步进 0.1）
    this.randomRating = this.makeRandomRating(2.0, 5.0, 0.1)
  }
}
</script>

<style>
.card {
  margin-bottom: 20rpx;
  border-radius: 12rpx;
  background-color: #fff;
  overflow: hidden;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.1);
  width: 100%;
  box-sizing: border-box;
}
.card-media {
  background-color: #a0c4ff;
  height: var(--card-height, 200rpx);
  width: 100%;
  cursor: pointer;
}
/* 下方信息区保持原尺寸与排布 */
.card-content {
  padding: 16rpx;
  width: 100%;
  box-sizing: border-box;
  cursor: pointer;
  position: relative; /* 悬浮容器定位参考 */
}
.card-title {
  font-size: 28rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-author {
  font-size: 24rpx;
  color: #666;
  margin-bottom: 12rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
.card-location {
  font-size: 24rpx;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 60%; /* 保持左侧不变 */
}

/* 新增：右侧悬浮容器（不占据布局空间） */
.cta-float {
  position: absolute;
  right: 9rpx;
  bottom: 9rpx; /* 原 16rpx -> 下移一点 */
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10rpx;
  z-index: 1;
}

/* 悬浮评分文本 */
.rating-float {
  font-size: 24rpx;
  color: #999;
  line-height: 28rpx;
  background: transparent;
  white-space: nowrap;
}

/* 放大的“预”按钮（更醒目，但不挤压左侧） */
.reserve-big {
  width: 104rpx;      /* 原 120rpx -> 缩小 */
  height: 54rpx;      /* 原 88rpx -> 缩小 */
  background: #FFC400;
  border-radius: 12rpx;
  color: #333;
  font-size: 30rpx;   /* 原 34rpx -> 略小 */
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.12);
}

/* 保留其他样式不变 */
</style>
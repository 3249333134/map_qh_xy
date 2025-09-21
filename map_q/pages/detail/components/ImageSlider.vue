<template>
  <view class="image-slider">
    <swiper
      :indicator-dots="true"
      :autoplay="isAutoplay"
      :interval="5000"
      :duration="500"
      class="swiper"
      circular
      @change="onSwiperChange"
      @touchstart="handleTouchStart"
      @touchend="handleTouchEnd"
      @touchcancel="handleTouchEnd"
    >
      <swiper-item v-for="(image, index) in slides" :key="index">
        <image
          :src="image"
          mode="aspectFit"
          class="slide-image"
          @click="previewImage(index)"
        ></image>
      </swiper-item>
    </swiper>
    <view class="image-count">{{ currentIndex + 1 }}/{{ slides.length }}</view>
  </view>
</template>

<script>
export default {
  name: 'ImageSlider',
  props: {
    images: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      currentIndex: 0,
      isAutoplay: true,     // 控制是否自动播放
      resumeTimer: null     // 恢复自动播放的计时器
    }
  },
  computed: {
    // 只有一张图时复制为三张，支持滑动
    slides() {
      if (!this.images || this.images.length === 0) return [];
      if (this.images.length === 1) return [this.images[0], this.images[0], this.images[0]];
      return this.images;
    }
  },
  methods: {
    onSwiperChange(e) {
      this.currentIndex = e.detail?.current || 0;
    },
    previewImage(index) {
      uni.previewImage({
        current: index,
        urls: this.slides
      })
    },
    clearResumeTimer() {
      if (this.resumeTimer) {
        clearTimeout(this.resumeTimer);
        this.resumeTimer = null;
      }
    },
    handleTouchStart() {
      // 用户开始操作：暂停自动播放
      this.clearResumeTimer();
      this.isAutoplay = false;
    },
    handleTouchEnd() {
      // 操作结束：延时恢复自动播放，避免刚松手立刻切换
      this.clearResumeTimer();
      this.resumeTimer = setTimeout(() => {
        this.isAutoplay = true;
      }, 3000); // 可按需调整为 800~2000ms
    }
  },
  beforeUnmount() {
    this.clearResumeTimer();
  }
}
</script>

<style scoped>
.image-slider {
  position: relative;
  width: 100%;
  height: 720rpx; /* 放大展示区域，如需更大/更小可调整 */
  background-color: #f5f5f5;
}
.swiper {
  width: 100%;
  height: 100%;
}
.slide-image {
  width: 100%;
  height: 100%;
  /* aspectFit 会在容器内完整展示图片，不裁剪；两侧或上下可能留空 */
}
.image-count {
  position: absolute;
  bottom: 20rpx;
  right: 20rpx;
  background-color: rgba(0, 0, 0, 0.5);
  color: #fff;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
}
</style>
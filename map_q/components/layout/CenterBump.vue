<template>
  <view v-if="show" class="center-bump" :style="rootStyle">
    <view class="center-bump__bg" :style="bgStyle" />
    <text class="center-bump__icon" :style="iconStyle">{{ icon }}</text>
  </view>
</template>

<script>
export default {
  name: 'CenterBump',
  props: {
    show: { type: Boolean, default: true },
    // 圆的直径（rpx）
    size: { type: Number, default: 120 },
    // 向下偏移（rpx），越大越“藏”，只露出更小弧形
    offset: { type: Number, default: 0 },
    // 背景（可以是颜色或渐变字符串）
    background: { type: String, default: 'linear-gradient(180deg,#ff6b6b 0%, #ff4d4f 100%)' },
    // 图标字符（默认全角＋，更居中）
    icon: { type: String, default: '＋' },
    iconColor: { type: String, default: '#FFFFFF' },
    iconSize: { type: Number, default: 48 }, // rpx
    // 阴影深浅（0-1）
    shadowOpacity: { type: Number, default: 0.14 }
  },
  computed: {
    rootStyle() {
      const r = this.size / 2
      return `
        width:${this.size}rpx;
        height:${this.size}rpx;
        border-radius:${r}rpx;
        bottom:-${this.offset}rpx; /* 向下藏一部分，只露出更小的上弧 */
        transform:translateX(-50%);
        left:50%;
      `
    },
    bgStyle() {
      return `
        background:${this.background};
        border-radius:inherit;
        box-shadow: 0 -8rpx 24rpx rgba(0,0,0,${this.shadowOpacity});
      `
    },
    iconStyle() {
      return `
        color:${this.iconColor};
        font-size:${this.iconSize}rpx;
        font-weight:700;
      `
    }
  }
}
</script>

<style scoped>
.center-bump {
  position: fixed;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  z-index: 9;
  display: flex;
  align-items: center;
  justify-content: center;
  /* 避免覆盖原生tabBar的点击 */
  pointer-events: none;
}
.center-bump__bg {
  position: absolute;
  inset: 0;
}
.center-bump__icon {
  line-height: 1;
}
</style>
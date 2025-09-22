<template>
  <view class="plus-page">
    <!-- 你的页面内容 -->
    <text class="tip">这里是中间“服务/发布”页</text>
    <!-- 中间凸起半圆按钮 -->
    <view class="center-protrude" @click="toggleCenter">
      <view class="center-protrude__inner">
        <text class="center-protrude__icon">{{ isOpen ? '✖️' : '➕' }}</text>
      </view>
    </view>

    <!-- 可选：打开状态下展示的功能面板（示例占位） -->
    <view v-if="isOpen" class="multi-actions">
      <view class="action">功能A</view>
      <view class="action">功能B</view>
      <view class="action">功能C</view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'PlusPage',
  data() {
    return {
      isOpen: false
    }
  },
  methods: {
    toggleCenter() {
      this.isOpen = !this.isOpen
    }
  }
}
</script>

<style scoped>
.plus-page {
  min-height: 100vh;
}

/* 中间凸起半圆：下半部分被原生 tabBar 遮挡，上半部分露出 */
.center-protrude {
  position: fixed;
  left: 50%;
  bottom: 0; /* 关键：贴底，让原生tabBar遮住下半部分，形成“半圆” */
  transform: translateX(-50%);
  width: 110rpx;
  height: 110rpx;
  border-radius: 55rpx;
  background: #fff;
  box-shadow: 0 -6rpx 16rpx rgba(0,0,0,0.08);
  z-index: 9; /* 高于页面内容，但低于原生tabBar并不重要，因为我们就是要让其下半被遮住 */
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 视觉上再向上“突出一点点”，可以用向上阴影与边线增强层次 */
.center-protrude__inner {
  width: 100%;
  height: 100%;
  border-radius: 55rpx;
  border: 2rpx solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 加号/关闭号 */
.center-protrude__icon {
  font-size: 44rpx;
  line-height: 1;
  color: #d81e06; /* 你图里的红色，可按品牌色调整 */
  font-weight: 600;
}

/* 可选：展开面板的示例样式（放在半圆上方） */
.multi-actions {
  position: fixed;
  left: 50%;
  bottom: 130rpx; /* 在半圆之上 */
  transform: translateX(-50%);
  background: #ffffff;
  border-radius: 16rpx;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.12);
  padding: 20rpx 24rpx;
  display: flex;
  gap: 20rpx;
  z-index: 8;
}
.multi-actions .action {
  padding: 12rpx 20rpx;
  border-radius: 12rpx;
  background: #f7f7f7;
  color: #333;
  font-size: 26rpx;
}

/* 隐藏之前的半圆悬浮按钮/面板，避免与圆弧重复 */
.center-protrude { display: none !important; }
.multi-actions { display: none !important; }
</style>
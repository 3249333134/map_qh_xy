<template>
  <view class="fog-unlock-page">
    <view class="status-spacer" :style="{ height: statusBarHeight + 'px' }"></view>

    <view class="nav-bar">
      <view class="nav-back" @tap="goBack">‹</view>
      <text class="nav-title">迷雾解锁</text>
      <view class="nav-right" @tap="goBack">完成</view>
    </view>

    <view class="map-bg">
      <view class="map-grid"></view>
      <view class="map-road h1"></view>
      <view class="map-road v1"></view>
      <view class="map-road h2"></view>
      <view class="map-marker m1">
        <view class="marker-dot"></view>
      </view>
      <view class="map-marker m2">
        <view class="marker-dot"></view>
      </view>
      <view class="map-marker m3">
        <view class="marker-dot"></view>
      </view>
    </view>

    <view class="fog-mask"></view>

    <view class="unlock-spot">
      <view class="spot-pulse"></view>
      <view class="spot-core"></view>
    </view>

    <view class="unlock-card">
      <text class="unlock-title">解锁普通定位锚点</text>
      <text class="unlock-desc">你已探索该区域，可解锁当前定位锚点。解锁后该区域从迷雾中显现，可收藏、导航并发布内容。</text>

      <view class="info-row">
        <view class="info-item">
          <text class="info-label">探索距离</text>
          <text class="info-value">120m</text>
        </view>
        <view class="info-divider"></view>
        <view class="info-item">
          <text class="info-label">解锁奖励</text>
          <text class="info-value highlight">+20 积分</text>
        </view>
        <view class="info-divider"></view>
        <view class="info-item">
          <text class="info-label">共建状态</text>
          <text class="info-value">待提交</text>
        </view>
      </view>

      <view class="chip-row">
        <view class="chip">
          <text class="chip-text">收藏</text>
        </view>
        <view class="chip">
          <text class="chip-text">导航</text>
        </view>
        <view class="chip">
          <text class="chip-text">发布内容</text>
        </view>
      </view>
    </view>

    <view class="action-bar" :style="{ paddingBottom: 20 + 'px' }">
      <view class="btn-secondary" @tap="onLater">稍后</view>
      <view class="btn-primary" @tap="onBuild">修建锚点</view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const statusBarHeight = ref(20)

onMounted(() => {
  try {
    const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
    statusBarHeight.value = info.statusBarHeight || 20
  } catch (e) {}
})

function goBack() {
  uni.navigateBack({ fail: () => uni.switchTab({ url: '/pages/index/index' }) })
}

function onLater() {
  uni.navigateBack({ fail: () => uni.switchTab({ url: '/pages/index/index' }) })
}

function onBuild() {
  uni.showToast({ title: '已进入修建锚点', icon: 'none' })
}
</script>

<style scoped>
.fog-unlock-page {
  min-height: 100vh;
  background: #2b2f36;
  color: #222;
  position: relative;
  overflow: hidden;
}

.status-spacer {
  position: relative;
  z-index: 40;
  background: transparent;
}

.nav-bar {
  height: 88rpx;
  padding: 0 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 40;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.08);
}

.nav-back {
  position: absolute;
  left: 20rpx;
  width: 88rpx;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
  font-size: 56rpx;
  line-height: 56rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.2);
  transition: transform 160ms ease, background-color 160ms ease;
}

.nav-back:active {
  transform: scale(.92);
  background: rgba(255, 255, 255, 0.2);
}

.nav-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #ffffff;
}

.nav-right {
  position: absolute;
  right: 28rpx;
  height: 60rpx;
  padding: 0 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
  color: #ffffff;
}

.map-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #d8dde3 0%, #c8ced6 100%);
  overflow: hidden;
  filter: grayscale(0.9) brightness(0.7);
}

.map-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(90, 100, 115, 0.18) 1rpx, transparent 1rpx),
    linear-gradient(90deg, rgba(90, 100, 115, 0.18) 1rpx, transparent 1rpx);
  background-size: 80rpx 80rpx;
}

.map-road {
  position: absolute;
  background: #ffffff;
  opacity: 0.55;
}

.map-road.h1 {
  height: 14rpx;
  left: 0;
  right: 0;
  top: 35%;
}

.map-road.v1 {
  width: 14rpx;
  top: 0;
  bottom: 0;
  left: 38%;
}

.map-road.h2 {
  height: 10rpx;
  left: 0;
  right: 0;
  top: 66%;
  opacity: 0.4;
}

.map-marker {
  position: absolute;
}

.map-marker.m1 {
  top: 24%;
  left: 22%;
}

.map-marker.m2 {
  top: 54%;
  left: 68%;
}

.map-marker.m3 {
  top: 72%;
  left: 30%;
}

.marker-dot {
  width: 28rpx;
  height: 28rpx;
  border-radius: 50%;
  background: #8a8f98;
  border: 4rpx solid #ffffff;
  opacity: 0.7;
}

.fog-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(
    circle at 50% 42%,
    rgba(120, 128, 140, 0.15) 0%,
    rgba(80, 88, 100, 0.55) 50%,
    rgba(40, 46, 56, 0.85) 100%
  );
}

.unlock-spot {
  position: absolute;
  top: 42%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spot-pulse {
  position: absolute;
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: rgba(255, 212, 0, 0.4);
  animation: spot-pulse 1.8s ease-out infinite;
}

@keyframes spot-pulse {
  0% { transform: scale(0.5); opacity: 1; }
  100% { transform: scale(2.6); opacity: 0; }
}

.spot-core {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: #ffd400;
  border: 6rpx solid #ffffff;
  box-shadow: 0 4rpx 16rpx rgba(255, 212, 0, 0.6);
}

.unlock-card {
  position: absolute;
  left: 28rpx;
  right: 28rpx;
  top: calc(42% + 100rpx);
  padding: 32rpx 28rpx 28rpx;
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 12rpx 40rpx rgba(0, 0, 0, 0.22);
}

.unlock-title {
  display: block;
  font-size: 34rpx;
  font-weight: 800;
  color: #222;
  line-height: 46rpx;
}

.unlock-desc {
  display: block;
  margin-top: 14rpx;
  font-size: 26rpx;
  line-height: 40rpx;
  color: #5f646d;
}

.info-row {
  margin-top: 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.info-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.info-label {
  font-size: 22rpx;
  color: #8a8f98;
}

.info-value {
  font-size: 28rpx;
  font-weight: 700;
  color: #222;
}

.info-value.highlight {
  color: #ff7043;
}

.info-divider {
  width: 1rpx;
  height: 56rpx;
  background: #f0f1f3;
}

.chip-row {
  margin-top: 24rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.chip {
  height: 56rpx;
  padding: 0 28rpx;
  display: flex;
  align-items: center;
  border-radius: 999rpx;
  background: #f0f1f3;
}

.chip-text {
  font-size: 24rpx;
  font-weight: 600;
  color: #5f646d;
}

.action-bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20rpx 28rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  display: flex;
  gap: 20rpx;
  background: rgba(255, 255, 255, 0.96);
  border-top: 1rpx solid rgba(0, 0, 0, 0.05);
  box-sizing: border-box;
}

.btn-secondary,
.btn-primary {
  flex: 1;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  font-size: 30rpx;
  font-weight: 700;
}

.btn-secondary {
  color: #5f646d;
  background: #f0f1f3;
}

.btn-primary {
  color: #ffffff;
  background: linear-gradient(135deg, #ff8a4a 0%, #ff5b35 100%);
  box-shadow: 0 8rpx 20rpx rgba(255, 91, 53, 0.28);
}
</style>

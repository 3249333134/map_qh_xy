<template>
  <view class="map-share-page">
    <view class="status-spacer" :style="{ height: statusBarHeight + 'px' }"></view>

    <view class="nav-bar">
      <view class="nav-back" @tap="goBack">‹</view>
      <text class="nav-title">地图分享</text>
      <view class="nav-right" @tap="onSend">发送</view>
    </view>

    <scroll-view class="share-content" scroll-y>
      <view class="share-card">
        <view class="map-preview">
          <view class="map-grid"></view>
          <view class="map-road h1"></view>
          <view class="map-road v1"></view>
          <view class="map-road v2"></view>
          <view class="map-route"></view>
          <view class="map-marker m1">
            <view class="marker-dot gold"></view>
          </view>
          <view class="map-marker m2">
            <view class="marker-dot green"></view>
          </view>
          <view class="map-marker m3">
            <view class="marker-dot purple"></view>
          </view>
          <view class="map-marker m4">
            <view class="marker-dot blue"></view>
          </view>
          <view class="map-cover-overlay"></view>
        </view>

        <view class="card-body">
          <text class="card-title">春熙路周末足迹</text>
          <text class="card-desc">4 个锚点 · 8.6km · 涵盖兴趣 POI、活动与轨迹</text>

          <view class="chip-row">
            <view class="chip gold">
              <text class="chip-text">3 个锚点</text>
            </view>
            <view class="chip orange">
              <text class="chip-text">2 条路线</text>
            </view>
            <view class="chip purple">
              <text class="chip-text">1 个活动</text>
            </view>
          </view>
        </view>
      </view>

      <view class="section-title">分享方式</view>

      <view class="option-list">
        <view
          v-for="opt in options"
          :key="opt.key"
          class="option-row"
          :class="{ last: opt.last }"
          @tap="onOptionTap(opt)"
        >
          <view class="option-icon" :style="{ background: opt.color }">
            <text class="option-icon-text">{{ opt.icon }}</text>
          </view>
          <view class="option-main">
            <text class="option-name">{{ opt.name }}</text>
            <text class="option-desc">{{ opt.desc }}</text>
          </view>
          <view class="option-arrow">›</view>
        </view>
      </view>

      <view class="bottom-spacer"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const statusBarHeight = ref(20)

const options = ref([
  { key: 'friend', last: false, name: '分享给好友', desc: '微信好友 / 群聊', icon: '友', color: '#24d06c' },
  { key: 'poster', last: false, name: '生成海报', desc: '保存图片到本地相册', icon: '图', color: '#ff7043' },
  { key: 'link', last: true, name: '复制地图链接', desc: '粘贴即可打开足迹地图', icon: '链', color: '#248cf5' }
])

onMounted(() => {
  try {
    const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
    statusBarHeight.value = info.statusBarHeight || 20
  } catch (e) {}
})

function goBack() {
  uni.navigateBack({ fail: () => uni.switchTab({ url: '/pages/index/index' }) })
}

function onSend() {
  uni.showToast({ title: '已发送给好友', icon: 'none' })
}

function onOptionTap(opt) {
  uni.showToast({ title: opt.name, icon: 'none' })
}
</script>

<style scoped>
.map-share-page {
  min-height: 100vh;
  background: #f7f7f8;
  color: #222;
}

.status-spacer {
  background: #ffffff;
}

.nav-bar {
  height: 88rpx;
  padding: 0 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: #ffffff;
  border-bottom: 1rpx solid #f0f1f3;
}

.nav-back {
  position: absolute;
  left: 28rpx;
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #f0f1f3;
  color: #222;
  font-size: 56rpx;
  line-height: 56rpx;
}

.nav-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #222;
}

.nav-right {
  position: absolute;
  right: 28rpx;
  height: 64rpx;
  padding: 0 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #ff8a4a 0%, #ff5b35 100%);
  color: #ffffff;
  font-size: 26rpx;
  font-weight: 700;
  box-shadow: 0 6rpx 18rpx rgba(255, 91, 53, 0.28);
}

.share-content {
  height: calc(100vh - 88rpx - env(safe-area-inset-top));
  padding: 28rpx;
  box-sizing: border-box;
}

.share-card {
  background: #ffffff;
  border-radius: 14rpx;
  box-shadow: 0 1px 8px rgba(18, 24, 38, 0.06);
  overflow: hidden;
}

.map-preview {
  position: relative;
  height: 360rpx;
  background: linear-gradient(135deg, #e4e7ec 0%, #dde1e7 100%);
  overflow: hidden;
}

.map-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(120, 130, 145, 0.12) 1rpx, transparent 1rpx),
    linear-gradient(90deg, rgba(120, 130, 145, 0.12) 1rpx, transparent 1rpx);
  background-size: 80rpx 80rpx;
}

.map-road {
  position: absolute;
  background: #ffffff;
  opacity: 0.7;
}

.map-road.h1 {
  height: 12rpx;
  left: 0;
  right: 0;
  top: 40%;
}

.map-road.v1 {
  width: 12rpx;
  top: 0;
  bottom: 0;
  left: 30%;
}

.map-road.v2 {
  width: 10rpx;
  top: 0;
  bottom: 0;
  left: 70%;
  opacity: 0.5;
}

.map-route {
  position: absolute;
  top: 22%;
  left: 18%;
  width: 64%;
  height: 6rpx;
  background: linear-gradient(90deg, #ff7043 0%, #248cf5 100%);
  border-radius: 3rpx;
  transform: rotate(-12deg);
  transform-origin: left center;
  opacity: 0.85;
}

.map-marker {
  position: absolute;
}

.map-marker.m1 {
  top: 24%;
  left: 20%;
}

.map-marker.m2 {
  top: 60%;
  left: 38%;
}

.map-marker.m3 {
  top: 30%;
  left: 66%;
}

.map-marker.m4 {
  top: 68%;
  left: 76%;
}

.marker-dot {
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  border: 4rpx solid #ffffff;
  box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.18);
}

.marker-dot.gold {
  background: #f6b33b;
}

.marker-dot.green {
  background: #24d06c;
}

.marker-dot.purple {
  background: #7650c8;
}

.marker-dot.blue {
  background: #248cf5;
}

.map-cover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 60%, rgba(255, 255, 255, 0.4) 100%);
}

.card-body {
  padding: 28rpx;
}

.card-title {
  display: block;
  font-size: 34rpx;
  font-weight: 800;
  color: #222;
  line-height: 46rpx;
}

.card-desc {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #8a8f98;
  line-height: 34rpx;
}

.chip-row {
  margin-top: 20rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.chip {
  height: 52rpx;
  padding: 0 24rpx;
  display: flex;
  align-items: center;
  border-radius: 999rpx;
}

.chip.gold {
  background: rgba(246, 179, 59, 0.15);
}

.chip.gold .chip-text {
  color: #c87f0a;
}

.chip.orange {
  background: rgba(255, 112, 67, 0.12);
}

.chip.orange .chip-text {
  color: #ff5b35;
}

.chip.purple {
  background: rgba(118, 80, 200, 0.12);
}

.chip.purple .chip-text {
  color: #7650c8;
}

.chip-text {
  font-size: 24rpx;
  font-weight: 700;
}

.section-title {
  margin: 36rpx 0 24rpx;
  font-size: 32rpx;
  line-height: 44rpx;
  font-weight: 700;
  color: #222;
}

.option-list {
  background: #ffffff;
  border-radius: 14rpx;
  box-shadow: 0 1px 8px rgba(18, 24, 38, 0.06);
  overflow: hidden;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 28rpx;
  border-bottom: 1rpx solid #f0f1f3;
}

.option-row.last {
  border-bottom: 0;
}

.option-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.option-icon-text {
  color: #ffffff;
  font-size: 28rpx;
  font-weight: 800;
}

.option-main {
  flex: 1;
  min-width: 0;
}

.option-name {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #222;
}

.option-desc {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #8a8f98;
}

.option-arrow {
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c5c9d0;
  font-size: 40rpx;
  line-height: 40rpx;
  flex-shrink: 0;
}

.bottom-spacer {
  height: 60rpx;
}
</style>

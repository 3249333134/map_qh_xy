<template>
  <view class="page">
    <!-- 全屏地图背景 -->
    <view class="map-bg">
      <view class="map-grid"></view>
      <view class="map-road road-1"></view>
      <view class="map-road road-2"></view>
      <view class="map-pin pin-1">📍</view>
      <view class="map-pin pin-2">📍</view>
      <view class="map-center">
        <view class="map-center-dot"></view>
        <view class="map-center-ring"></view>
      </view>
    </view>

    <!-- 顶部导航栏（透明覆盖在地图上） -->
    <view class="status-spacer" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="nav-bar">
      <view class="nav-back" @tap="goBack">‹</view>
      <text class="nav-title">添加位置</text>
      <view class="nav-right cta" @tap="onDone">完成</view>
    </view>

    <!-- 底部sheet -->
    <view class="bottom-sheet">
      <view class="sheet-handle"></view>
      <view class="search-bar">
        <view class="search-input">
          <text class="search-icon">🔍</text>
          <input
            v-model="keyword"
            class="search-field"
            placeholder="搜索地点、商家、地标"
          />
        </view>
      </view>

      <scroll-view class="result-scroll" scroll-y>
        <view class="result-list">
          <view
            v-for="(r, i) in results"
            :key="r.key"
            class="result-row"
            :class="{ last: i === results.length - 1, selected: r.selected }"
            @tap="onPick(r)"
          >
            <view class="result-left">
              <text class="result-title">{{ r.title }}</text>
              <text class="result-sub">距离{{ r.distance }}</text>
            </view>
            <view class="result-action" :class="{ selected: r.selected }">
              {{ r.selected ? '已选' : '选择' }}
            </view>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const statusBarHeight = ref(20)
const keyword = ref('')
const results = ref([
  { key: 'yaxin', title: '亚新大厦', distance: '120m', selected: false },
  { key: 'free', title: '自由天地', distance: '360m', selected: false }
])

onMounted(() => {
  try {
    const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
    statusBarHeight.value = info.statusBarHeight || 20
  } catch (e) {}
})

const goBack = () => uni.navigateBack()
const onDone = () => {
  uni.showToast({ title: '已添加位置', icon: 'success' })
  setTimeout(goBack, 800)
}
const onPick = (r) => {
  results.value.forEach(item => { item.selected = false })
  r.selected = true
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #e8edf2;
  position: relative;
}

.map-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 360rpx;
  background: linear-gradient(180deg, #dde7ee 0%, #eef3f7 100%);
  overflow: hidden;
}

.map-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right, rgba(36, 140, 245, 0.08) 1rpx, transparent 1rpx),
    linear-gradient(to bottom, rgba(36, 140, 245, 0.08) 1rpx, transparent 1rpx);
  background-size: 80rpx 80rpx;
}

.map-road {
  position: absolute;
  background: #ffffff;
  box-shadow: 0 0 0 1rpx rgba(36, 140, 245, 0.12);
}

.road-1 {
  left: 0;
  right: 0;
  top: 38%;
  height: 24rpx;
}

.road-2 {
  top: 0;
  bottom: 0;
  left: 56%;
  width: 24rpx;
}

.map-pin {
  position: absolute;
  font-size: 40rpx;
}

.pin-1 {
  top: 28%;
  left: 32%;
}

.pin-2 {
  top: 62%;
  right: 24%;
}

.map-center {
  position: absolute;
  top: 48%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.map-center-dot {
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  background: #248cf5;
  border: 6rpx solid #ffffff;
  box-shadow: 0 4rpx 12rpx rgba(36, 140, 245, 0.4);
}

.map-center-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(36, 140, 245, 0.3);
  transform: translate(-50%, -50%);
}

.status-spacer {
  background: transparent;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: 0 24rpx;
  position: relative;
  z-index: 10;
}

.nav-back {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  color: #222;
  font-size: 44rpx;
  line-height: 44rpx;
  box-shadow: 0 1px 8px rgba(18, 24, 38, 0.06);
}

.nav-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #222;
  padding: 8rpx 24rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 1px 8px rgba(18, 24, 38, 0.06);
}

.nav-right {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-right.cta {
  width: auto;
  padding: 0 28rpx;
  height: 56rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #ff8a4a 0%, #ff5b35 100%);
  color: #ffffff;
  font-size: 26rpx;
  font-weight: 700;
}

.bottom-sheet {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 720rpx;
  background: #ffffff;
  border-top-left-radius: 28rpx;
  border-top-right-radius: 28rpx;
  box-shadow: 0 -4rpx 24rpx rgba(18, 24, 38, 0.1);
  display: flex;
  flex-direction: column;
  padding-bottom: env(safe-area-inset-bottom);
}

.sheet-handle {
  width: 72rpx;
  height: 8rpx;
  border-radius: 999rpx;
  background: #e0e2e6;
  margin: 16rpx auto 8rpx;
}

.search-bar {
  padding: 16rpx 24rpx;
}

.search-input {
  display: flex;
  align-items: center;
  height: 72rpx;
  padding: 0 24rpx;
  border-radius: 999rpx;
  background: #f0f1f3;
}

.search-icon {
  margin-right: 12rpx;
  font-size: 28rpx;
}

.search-field {
  flex: 1;
  font-size: 28rpx;
  color: #222;
}

.result-scroll {
  flex: 1;
}

.result-list {
  padding: 0 24rpx;
}

.result-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 0;
  border-bottom: 1rpx solid #f0f1f3;
}

.result-row.last {
  border-bottom: 0;
}

.result-row.selected {
  background: rgba(36, 140, 245, 0.04);
}

.result-left {
  display: flex;
  flex-direction: column;
}

.result-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #222;
}

.result-sub {
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #8a8f98;
}

.result-action {
  padding: 12rpx 28rpx;
  border-radius: 999rpx;
  background: #f0f1f3;
  color: #5f646d;
  font-size: 26rpx;
  font-weight: 600;
}

.result-action.selected {
  background: #248cf5;
  color: #ffffff;
}
</style>

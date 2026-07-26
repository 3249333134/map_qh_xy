<template>
  <view class="anchor-layer-page">
    <view class="status-spacer" :style="{ height: statusBarHeight + 'px' }"></view>

    <view class="nav-bar">
      <view class="nav-back" @tap="goBack">‹</view>
      <text class="nav-title">锚点与图层</text>
      <view class="nav-right" @tap="toggleLayerPanel">层</view>
    </view>

    <scroll-view class="layer-content" scroll-y>
      <view class="radar-zone">
        <view class="radar">
          <view class="radar-ring r1"></view>
          <view class="radar-ring r2"></view>
          <view class="radar-ring r3"></view>
          <view class="radar-cross h"></view>
          <view class="radar-cross v"></view>
          <view class="radar-sweep"></view>
          <view class="radar-center"></view>
          <view class="radar-dot d1"></view>
          <view class="radar-dot d2"></view>
          <view class="radar-dot d3"></view>
          <view class="radar-dot d4"></view>
        </view>
        <text class="radar-hint">兴趣雷达 · 实时扫描周边锚点</text>
      </view>

      <text class="section-title">智能图层</text>

      <view class="layer-card">
        <view
          v-for="layer in layers"
          :key="layer.key"
          class="layer-row"
          :class="{ last: layer.last }"
        >
          <view class="layer-icon" :style="{ background: layer.color }">
            <text class="layer-icon-text">{{ layer.icon }}</text>
          </view>
          <view class="layer-main">
            <text class="layer-name">{{ layer.name }}</text>
            <text class="layer-desc">{{ layer.desc }}</text>
          </view>
          <view
            class="toggle"
            :class="{ on: layer.active }"
            @tap="toggleLayer(layer)"
          >
            <view class="toggle-thumb"></view>
          </view>
        </view>
      </view>

      <view class="section-title">锚点类型</view>

      <view class="anchor-grid">
        <view
          v-for="anchor in anchorTypes"
          :key="anchor.key"
          class="anchor-card"
          @tap="onAnchorTap(anchor)"
        >
          <view class="anchor-icon" :style="{ background: anchor.color }">
            <text class="anchor-icon-text">{{ anchor.icon }}</text>
          </view>
          <text class="anchor-name">{{ anchor.name }}</text>
          <text class="anchor-desc">{{ anchor.desc }}</text>
        </view>
      </view>

      <view class="bottom-spacer"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const statusBarHeight = ref(20)

const layers = ref([
  { key: 'radar', last: false, name: '兴趣雷达', desc: '周边兴趣 POI 高亮推荐', icon: '雷', color: '#24d06c', active: true },
  { key: 'countdown', last: false, name: '活动倒计时', desc: '即将开始的活动锚点提醒', icon: '时', color: '#7650c8', active: true },
  { key: 'exposure', last: false, name: '服务曝光', desc: '可预约服务就近曝光', icon: '服', color: '#248cf5', active: false },
  { key: 'fog', last: true, name: '未探索迷雾', desc: '标记未探索区域并提示解锁', icon: '雾', color: '#8a8f98', active: false }
])

const anchorTypes = ref([
  { key: 'landmark', name: '互动地标', desc: '导览/活动/频道', icon: '360', color: '#f6b33b' },
  { key: 'poi', name: '兴趣POI', desc: '雷达高亮推荐', icon: 'POI', color: '#24d06c' },
  { key: 'activity', name: '活动锚点', desc: '倒计时/报名', icon: '24h', color: '#7650c8' },
  { key: 'content', name: '内容锚点', desc: '评论红点/内容流', icon: '评', color: '#248cf5' }
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

function toggleLayerPanel() {
  uni.showToast({ title: '已展开图层管理', icon: 'none' })
}

function toggleLayer(layer) {
  layer.active = !layer.active
}

function onAnchorTap(anchor) {
  uni.showToast({ title: `选择 ${anchor.name}`, icon: 'none' })
}
</script>

<style scoped>
.anchor-layer-page {
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
  height: 60rpx;
  padding: 0 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  background: rgba(36, 140, 245, 0.1);
  color: #248cf5;
  font-size: 26rpx;
  font-weight: 700;
}

.layer-content {
  height: calc(100vh - 88rpx - env(safe-area-inset-top));
  padding: 28rpx;
  box-sizing: border-box;
}

.radar-zone {
  padding: 40rpx 0 36rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.radar {
  width: 440rpx;
  height: 440rpx;
  position: relative;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(36, 208, 108, 0.08) 0%, rgba(36, 208, 108, 0.02) 70%, transparent 100%);
  overflow: hidden;
}

.radar-ring {
  position: absolute;
  border-radius: 50%;
  border: 2rpx solid rgba(36, 208, 108, 0.25);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.radar-ring.r1 {
  width: 200rpx;
  height: 200rpx;
}

.radar-ring.r2 {
  width: 320rpx;
  height: 320rpx;
}

.radar-ring.r3 {
  width: 440rpx;
  height: 440rpx;
}

.radar-cross {
  position: absolute;
  background: rgba(36, 208, 108, 0.18);
}

.radar-cross.h {
  width: 440rpx;
  height: 2rpx;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
}

.radar-cross.v {
  width: 2rpx;
  height: 440rpx;
  left: 50%;
  top: 0;
  transform: translateX(-50%);
}

.radar-sweep {
  position: absolute;
  width: 220rpx;
  height: 220rpx;
  top: 50%;
  left: 50%;
  transform-origin: 0 0;
  background: conic-gradient(from 0deg, rgba(36, 208, 108, 0.45) 0deg, rgba(36, 208, 108, 0) 60deg);
  border-radius: 0 0 0 100%;
  animation: radar-spin 4s linear infinite;
}

@keyframes radar-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.radar-center {
  position: absolute;
  width: 28rpx;
  height: 28rpx;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: #24d06c;
  box-shadow: 0 0 0 8rpx rgba(36, 208, 108, 0.2);
}

.radar-dot {
  position: absolute;
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  background: #24d06c;
  box-shadow: 0 0 0 6rpx rgba(36, 208, 108, 0.25);
}

.radar-dot.d1 {
  top: 32%;
  left: 60%;
}

.radar-dot.d2 {
  top: 64%;
  left: 36%;
  background: #7650c8;
  box-shadow: 0 0 0 6rpx rgba(118, 80, 200, 0.25);
}

.radar-dot.d3 {
  top: 50%;
  left: 78%;
  background: #f6b33b;
  box-shadow: 0 0 0 6rpx rgba(246, 179, 59, 0.25);
}

.radar-dot.d4 {
  top: 70%;
  left: 60%;
  background: #248cf5;
  box-shadow: 0 0 0 6rpx rgba(36, 140, 245, 0.25);
}

.radar-hint {
  margin-top: 28rpx;
  font-size: 24rpx;
  color: #8a8f98;
}

.section-title {
  margin: 12rpx 0 24rpx;
  font-size: 32rpx;
  line-height: 44rpx;
  font-weight: 700;
  color: #222;
}

.layer-card {
  background: #ffffff;
  border-radius: 14rpx;
  box-shadow: 0 1px 8px rgba(18, 24, 38, 0.06);
  overflow: hidden;
}

.layer-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 28rpx;
  border-bottom: 1rpx solid #f0f1f3;
}

.layer-row.last {
  border-bottom: 0;
}

.layer-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.layer-icon-text {
  color: #ffffff;
  font-size: 26rpx;
  font-weight: 800;
}

.layer-main {
  flex: 1;
  min-width: 0;
}

.layer-name {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #222;
}

.layer-desc {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #8a8f98;
}

.toggle {
  width: 88rpx;
  height: 52rpx;
  border-radius: 999rpx;
  background: #e6e8eb;
  position: relative;
  transition: background 0.2s;
  flex-shrink: 0;
}

.toggle.on {
  background: #24d06c;
}

.toggle-thumb {
  position: absolute;
  top: 4rpx;
  left: 4rpx;
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.15);
  transition: left 0.2s;
}

.toggle.on .toggle-thumb {
  left: 40rpx;
}

.anchor-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}

.anchor-card {
  padding: 28rpx 24rpx;
  background: #ffffff;
  border-radius: 14rpx;
  box-shadow: 0 1px 8px rgba(18, 24, 38, 0.06);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.anchor-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.anchor-icon-text {
  color: #ffffff;
  font-size: 28rpx;
  font-weight: 800;
}

.anchor-name {
  margin-top: 18rpx;
  font-size: 30rpx;
  font-weight: 700;
  color: #222;
}

.anchor-desc {
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #8a8f98;
}

.bottom-spacer {
  height: 60rpx;
}
</style>

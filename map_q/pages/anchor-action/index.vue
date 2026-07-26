<template>
  <view class="anchor-action-page">
    <view class="status-spacer" :style="{ height: statusBarHeight + 'px' }"></view>

    <view class="nav-bar">
      <view class="nav-back" @tap="goBack">‹</view>
      <text class="nav-title">锚点操作</text>
      <view class="nav-right" @tap="goBack">关闭</view>
    </view>

    <view class="map-bg">
      <view class="map-grid"></view>
      <view class="map-road h1"></view>
      <view class="map-road v1"></view>
      <view class="map-road h2"></view>
      <view class="map-road v2"></view>
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
      <view class="map-focal">
        <view class="focal-pulse"></view>
        <view class="focal-core"></view>
      </view>
    </view>

    <view
      class="action-sheet"
      :class="{ dragging: isSheetDragging, compact: isCompact }"
      :style="{ height: sheetHeight + 'px' }"
    >
      <view
        class="sheet-drag-zone"
        @touchstart="onSheetDragStart"
        @touchmove.stop.prevent="onSheetDragMove"
        @touchend="onSheetDragEnd"
        @touchcancel="onSheetDragEnd"
      >
        <view class="sheet-handle"></view>
      </view>

      <scroll-view v-if="!isCompact" class="sheet-scroll" scroll-y :style="{ height: sheetContentHeight + 'px' }">
      <view class="detail-card">
        <view class="detail-head">
          <view class="detail-title-wrap">
            <text class="detail-title">自由天地 · 地标锚点</text>
            <view class="detail-tag">
              <text class="tag-text">360 导览</text>
            </view>
          </view>
        </view>
        <view class="detail-meta">
          <view class="meta-item">
            <text class="meta-icon hot">热</text>
            <text class="meta-text">热度 9650</text>
          </view>
          <view class="meta-item">
            <text class="meta-icon friend">友</text>
            <text class="meta-text">好友 3 人来过</text>
          </view>
        </view>
        <text class="detail-desc">城市互动地标锚点，支持 360° 全景导览、发起区域活动、加入本地频道与共建编辑。</text>
      </view>

      <view class="action-grid">
        <view
          v-for="action in actions"
          :key="action.key"
          class="action-item"
          @tap="onActionTap(action)"
        >
          <view class="action-icon" :style="{ background: action.color }">
            <text class="action-icon-text">{{ action.icon }}</text>
          </view>
          <text class="action-name">{{ action.name }}</text>
          <text class="action-desc">{{ action.desc }}</text>
        </view>
      </view>
      </scroll-view>

      <view v-else class="compact-actions">
        <view
          v-for="action in actions"
          :key="'compact-' + action.key"
          class="compact-action"
          @tap="onActionTap(action)"
        >
          <view class="compact-action-icon" :style="{ background: action.color }">
            <text>{{ action.icon }}</text>
          </view>
          <text class="compact-action-name">{{ action.name }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const statusBarHeight = ref(20)
const sheetHeight = ref(520)
const minSheetHeight = ref(138)
const maxSheetHeight = ref(520)
const isSheetDragging = ref(false)
const dragStartY = ref(0)
const dragStartHeight = ref(0)
const dragDelta = ref(0)
const safeBottomInset = ref(0)
const dragZoneHeight = 36

const isCompact = computed(() => sheetHeight.value <= minSheetHeight.value + 24)
const sheetContentHeight = computed(() => Math.max(0, sheetHeight.value - dragZoneHeight - safeBottomInset.value))

const actions = ref([
  { key: 'guide', name: '地标导览', desc: '历史沿革与路线', icon: '导', color: '#f6b33b' },
  { key: 'activity', name: '发起活动', desc: '报名与日历', icon: '活', color: '#7650c8' },
  { key: 'channel', name: '进入频道', desc: '区域讨论', icon: '频', color: '#248cf5' },
  { key: 'share', name: '地图分享', desc: '快照与导览', icon: '享', color: '#ff7043' },
  { key: 'build', name: '修建锚点', desc: '共建编辑', icon: '修', color: '#24d06c' },
  { key: 'fog', name: '迷雾解锁', desc: '探索未知区域', icon: '雾', color: '#8a8f98' }
])

onMounted(() => {
  try {
    const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
    statusBarHeight.value = info.statusBarHeight || 20
    const windowHeight = Number(info.windowHeight || info.screenHeight || 760)
    const safeBottom = Number((info.safeAreaInsets && info.safeAreaInsets.bottom) || 0)
    safeBottomInset.value = safeBottom
    minSheetHeight.value = dragZoneHeight + 82 + safeBottom
    maxSheetHeight.value = Math.max(380, Math.round(windowHeight * 0.67))
    sheetHeight.value = maxSheetHeight.value
  } catch (e) {}
})

function getTouchY(event) {
  return Number(
    (event && event.touches && event.touches[0] && event.touches[0].clientY) ||
    (event && event.changedTouches && event.changedTouches[0] && event.changedTouches[0].clientY) ||
    0
  )
}

function onSheetDragStart(event) {
  isSheetDragging.value = true
  dragStartY.value = getTouchY(event)
  dragStartHeight.value = sheetHeight.value
  dragDelta.value = 0
}

function onSheetDragMove(event) {
  if (!isSheetDragging.value) return
  dragDelta.value = dragStartY.value - getTouchY(event)
  sheetHeight.value = Math.max(
    minSheetHeight.value,
    Math.min(maxSheetHeight.value, dragStartHeight.value + dragDelta.value)
  )
}

function onSheetDragEnd() {
  if (!isSheetDragging.value) return
  isSheetDragging.value = false
  const collapse = dragDelta.value < -36 ||
    (Math.abs(dragDelta.value) <= 36 && sheetHeight.value < (minSheetHeight.value + maxSheetHeight.value) / 2)
  sheetHeight.value = collapse ? minSheetHeight.value : maxSheetHeight.value
  dragDelta.value = 0
}

function goBack() {
  uni.navigateBack({ fail: () => uni.switchTab({ url: '/pages/index/index' }) })
}

function onActionTap(action) {
  if (action.key === 'share') {
    uni.navigateTo({ url: '/pages/map-share/index' })
  } else if (action.key === 'build' || action.key === 'fog') {
    uni.navigateTo({ url: '/pages/fog-unlock/index' })
  } else {
    uni.showToast({ title: `${action.name}`, icon: 'none' })
  }
}
</script>

<style scoped>
.anchor-action-page {
  min-height: 100vh;
  background: #e9ecf0;
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
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.04);
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
  background: rgba(0, 0, 0, 0.06);
  color: #222;
  font-size: 56rpx;
  line-height: 56rpx;
  box-shadow: 0 8rpx 24rpx rgba(15, 23, 42, 0.12);
  transition: transform 160ms ease, background-color 160ms ease;
}

.nav-back:active {
  transform: scale(.92);
  background: rgba(0, 0, 0, 0.12);
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
  font-size: 26rpx;
  color: #5f646d;
}

.map-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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
  height: 14rpx;
  left: 0;
  right: 0;
  top: 28%;
}

.map-road.v1 {
  width: 14rpx;
  top: 0;
  bottom: 0;
  left: 35%;
}

.map-road.h2 {
  height: 10rpx;
  left: 0;
  right: 0;
  top: 62%;
  opacity: 0.5;
}

.map-road.v2 {
  width: 10rpx;
  top: 0;
  bottom: 0;
  left: 72%;
  opacity: 0.5;
}

.map-marker {
  position: absolute;
}

.map-marker.m1 {
  top: 22%;
  left: 22%;
}

.map-marker.m2 {
  top: 50%;
  left: 64%;
}

.map-marker.m3 {
  top: 70%;
  left: 28%;
}

.map-marker.m4 {
  top: 38%;
  left: 80%;
}

.marker-dot {
  width: 32rpx;
  height: 32rpx;
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

.map-focal {
  position: absolute;
  top: 44%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.focal-pulse {
  position: absolute;
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background: rgba(246, 179, 59, 0.3);
  animation: pulse 1.8s ease-out infinite;
}

@keyframes pulse {
  0% { transform: scale(0.6); opacity: 0.9; }
  100% { transform: scale(2.4); opacity: 0; }
}

.focal-core {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  background: #f6b33b;
  border: 4rpx solid #ffffff;
  box-shadow: 0 4rpx 12rpx rgba(246, 179, 59, 0.5);
}

.action-sheet {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding-bottom: env(safe-area-inset-bottom);
  background: #ffffff;
  border-radius: 32rpx 32rpx 0 0;
  box-shadow: 0 -8rpx 30rpx rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
  transition: height 260ms cubic-bezier(.2, .8, .2, 1);
}

.action-sheet.dragging { transition: none; }
.sheet-drag-zone {
  flex: 0 0 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
}
.sheet-handle {
  width: 72rpx;
  height: 8rpx;
  border-radius: 4rpx;
  background: #e0e2e6;
  margin: 0 auto;
  box-shadow: inset 0 1rpx 2rpx rgba(15, 23, 42, 0.08);
}

.sheet-scroll { width: 100%; }
.compact-actions {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-around;
  gap: 4px;
  padding: 6px 10px 0;
}
.compact-action {
  flex: 1;
  min-width: 0;
  max-width: 58px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}
.compact-action-icon {
  width: 42px;
  height: 42px;
  border-radius: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 5px 14px rgba(15, 23, 42, 0.12);
}
.compact-action-icon text { color: #fff; font-size: 17px; font-weight: 800; }
.compact-action-name {
  width: 100%;
  margin-top: 6px;
  overflow: hidden;
  color: #475569;
  font-size: 10px;
  font-weight: 600;
  line-height: 14px;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-card {
  padding: 28rpx 28rpx 20rpx;
}

.detail-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
}

.detail-title-wrap {
  flex: 1;
  min-width: 0;
}

.detail-title {
  display: block;
  font-size: 34rpx;
  font-weight: 800;
  color: #222;
  line-height: 46rpx;
}

.detail-tag {
  margin-top: 14rpx;
  display: inline-flex;
  align-items: center;
  height: 44rpx;
  padding: 0 20rpx;
  border-radius: 999rpx;
  background: rgba(246, 179, 59, 0.15);
}

.tag-text {
  color: #c87f0a;
  font-size: 22rpx;
  font-weight: 700;
}

.detail-meta {
  margin-top: 20rpx;
  display: flex;
  gap: 32rpx;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.meta-icon {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 20rpx;
  font-weight: 800;
}

.meta-icon.hot {
  background: #ff7043;
}

.meta-icon.friend {
  background: #248cf5;
}

.meta-text {
  font-size: 24rpx;
  color: #5f646d;
}

.detail-desc {
  margin-top: 18rpx;
  display: block;
  font-size: 26rpx;
  line-height: 40rpx;
  color: #5f646d;
}

.action-grid {
  margin: 8rpx 28rpx 28rpx;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}

.action-item {
  padding: 24rpx;
  background: #f7f7f8;
  border-radius: 14rpx;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.action-icon {
  width: 76rpx;
  height: 76rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-icon-text {
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 800;
}

.action-name {
  margin-top: 16rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: #222;
}

.action-desc {
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #8a8f98;
}
</style>

<template>
  <view class="map-share-page">
    <view class="status-spacer" :style="{ height: statusBarHeight + 'px' }"></view>

    <view class="nav-bar">
      <view class="nav-back" @tap="goBack">‹</view>
      <text class="nav-title">地图分享</text>
      <button class="nav-right" open-type="share" @tap="onSend">发送</button>
    </view>

    <scroll-view class="share-content" scroll-y>
      <view class="share-card">
        <view class="map-preview">
          <map
            class="preview-map"
            :latitude="snapshot.center.latitude"
            :longitude="snapshot.center.longitude"
            :scale="snapshot.scale"
            :markers="previewMarkers"
            :polyline="previewPolyline"
            :subkey="mapKey"
            show-location
          ></map>
        </view>

        <view class="card-body">
          <text class="card-title">{{ snapshot.center.cityName }}地图探索</text>
          <text class="card-desc">{{ timeLabel }} · {{ spaceLabel }} · {{ snapshot.layers.length }} 个图层</text>

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
    <canvas canvas-id="sharePoster" class="poster-canvas"></canvas>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onShareAppMessage } from '@dcloudio/uni-app'
import { encodeShareSnapshot, loadMapExploreState } from '../../utils/mapExploreState.js'
import { APP_CONFIG } from '../../utils/config.js'

const statusBarHeight = ref(20)
const snapshot = ref(loadMapExploreState().state)
const encodedSnapshot = ref('')
const mapKey = APP_CONFIG.TENCENT_MAP.KEY
const previewMarkers = ref([])
const previewPolyline = ref([])
const timeLabel = ref('不限时间')
const spaceLabel = ref('当前可视区域')

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
  snapshot.value = loadMapExploreState().state
  syncMapPreview(snapshot.value)
  encodedSnapshot.value = encodeShareSnapshot(snapshot.value)
  const labels = { all: '不限时间', today: '今天', week: '本周', custom: '自定义日期' }
  timeLabel.value = labels[snapshot.value.timeRange.preset] || '不限时间'
  spaceLabel.value = snapshot.value.spatialFilter.mode === 'bounds'
    ? '当前可视区域'
    : `附近 ${snapshot.value.spatialFilter.radiusKm}km`
})

function syncMapPreview(state) {
  const center = state.center
  const points = [
    [0.0018, -0.0022, '/static/marker-orange.png'],
    [0.0024, 0.0017, '/static/marker-purple.png'],
    [-0.0014, -0.0011, '/static/marker-green.png'],
    [-0.0022, 0.0023, '/static/marker-blue.png']
  ]
  previewMarkers.value = points.map((item, index) => ({
    id: index + 1,
    latitude: Number(center.latitude) + item[0],
    longitude: Number(center.longitude) + item[1],
    iconPath: item[2],
    width: 28,
    height: 34
  }))
  previewPolyline.value = [{
    points: points.slice(0, 3).map(item => ({
      latitude: Number(center.latitude) + item[0],
      longitude: Number(center.longitude) + item[1]
    })),
    color: '#f97316',
    width: 5,
    dottedLine: false,
    arrowLine: true
  }]
}

onShareAppMessage(() => ({
  title: `${snapshot.value.center.cityName}地图探索 · 足迹`,
  path: `/pages/index/index?map=${encodedSnapshot.value}`
}))

function goBack() {
  uni.navigateBack({ fail: () => uni.switchTab({ url: '/pages/index/index' }) })
}

function onSend() {
  // 微信由 open-type="share" 打开分享面板；H5 同时提供可复制链接。
  // #ifdef H5
  copyLink()
  // #endif
}

function onOptionTap(opt) {
  if (opt.key === 'poster') return generatePoster()
  copyLink()
}

function sharePath() {
  return `/pages/index/index?map=${encodedSnapshot.value}`
}

function copyLink() {
  const path = sharePath()
  uni.setClipboardData({
    data: path,
    success: () => uni.showToast({ title: '地图链接已复制', icon: 'success' }),
    fail: () => uni.showToast({ title: '复制失败，请重试', icon: 'none' })
  })
}

function generatePoster() {
  try {
    const context = uni.createCanvasContext('sharePoster')
    context.setFillStyle('#fff7ed')
    context.fillRect(0, 0, 320, 500)
    context.setFillStyle('#ea580c')
    context.fillRect(0, 0, 320, 12)
    context.setFillStyle('#0f172a')
    context.setFontSize(24)
    context.fillText(`${snapshot.value.center.cityName}地图探索`, 24, 64)
    context.setFillStyle('#64748b')
    context.setFontSize(14)
    context.fillText(`${timeLabel.value} · ${spaceLabel.value}`, 24, 94)
    context.setFillStyle('#e2e8f0')
    context.fillRect(24, 126, 272, 260)
    context.setFillStyle('#f97316')
    ;[[72,190],[164,248],[240,176],[214,330]].forEach(([x,y]) => {
      context.beginPath()
      context.arc(x, y, 8, 0, Math.PI * 2)
      context.fill()
    })
    context.setFillStyle('#334155')
    context.setFontSize(14)
    context.fillText('打开足迹，继续探索这张地图', 24, 430)
    context.draw(false, () => {
      uni.canvasToTempFilePath({
        canvasId: 'sharePoster',
        success: result => {
          uni.saveImageToPhotosAlbum({
            filePath: result.tempFilePath,
            success: () => uni.showToast({ title: '海报已保存', icon: 'success' }),
            fail: () => uni.showToast({ title: '保存失败，请检查相册权限', icon: 'none' })
          })
        },
        fail: () => uni.showToast({ title: '海报生成失败，请重试', icon: 'none' })
      })
    })
  } catch (error) {
    uni.showToast({ title: '当前平台暂不支持生成海报', icon: 'none' })
  }
}
</script>

<style scoped>
.map-share-page {
  min-height: 100vh;
  background: #f7f7f8;
  color: #222;
}

.status-spacer {
  background: #fff;
}

.nav-bar {
  height: 88rpx;
  padding: 0 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: #fff;
  border-bottom: 1rpx solid #f1f5f9;
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
  color: #fff;
  font-size: 26rpx;
  font-weight: 700;
  box-shadow: 0 6rpx 18rpx rgba(255, 91, 53, 0.28);
  border: 0;
  line-height: 64rpx;
}
.nav-right::after { border: 0; }

.share-content {
  height: calc(100vh - 88rpx - env(safe-area-inset-top));
  padding: 28rpx;
  box-sizing: border-box;
}

.share-card {
  background: #fff;
  border-radius: 14rpx;
  box-shadow: 0 1px 8px rgba(18, 24, 38, 0.06);
  overflow: hidden;
}

.map-preview {
  position: relative;
  height: 30vh;
  min-height: 440rpx;
  max-height: 560rpx;
  background: #e2e8f0;
  overflow: hidden;
}

.preview-map { width: 100%; height: 100%; }

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
  background: #fff;
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
  background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-info) 100%);
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
  background: var(--color-info);
}

.marker-dot.blue {
  background: var(--color-info);
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
  color: var(--color-info);
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
  background: #fff;
  border-radius: 14rpx;
  box-shadow: 0 1px 8px rgba(18, 24, 38, 0.06);
  overflow: hidden;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 28rpx;
  border-bottom: 1rpx solid #f1f5f9;
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
  color: #fff;
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

.poster-canvas {
  position: fixed;
  left: -9999px;
  top: -9999px;
  width: 320px;
  height: 500px;
}
</style>

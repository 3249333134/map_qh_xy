<template>
  <view class="anchor-layer-page">
    <view class="status-spacer" :style="{ height: statusBarHeight + 'px' }"></view>

    <view class="nav-bar">
      <view class="nav-back" @tap="goBack">‹</view>
      <text class="nav-title">锚点与图层</text>
      <view class="nav-right" @tap="toggleLayerPanel">层</view>
    </view>

    <scroll-view class="layer-content" scroll-y>
      <view class="map-context">
        <map
          class="context-map"
          :latitude="mapCenter.latitude"
          :longitude="mapCenter.longitude"
          :scale="mapScale"
          :markers="previewMarkers"
          :subkey="mapKey"
          show-location
        ></map>
        <cover-view class="map-context-caption">
          <cover-view class="caption-pulse"></cover-view>
          <cover-view class="caption-text">{{ mapCenter.cityName }} · {{ enabledLayerCount }} 个图层正在显示</cover-view>
        </cover-view>
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
import { loadMapExploreState, saveMapExploreState, setMapExploreCommand } from '../../utils/mapExploreState.js'
import { APP_CONFIG } from '../../utils/config.js'

const statusBarHeight = ref(20)
const mapKey = APP_CONFIG.TENCENT_MAP.KEY
const mapCenter = ref({ cityName: '成都', latitude: 30.572269, longitude: 104.066541 })
const mapScale = ref(14)
const previewMarkers = ref([])
const enabledLayerCount = ref(6)

const layers = ref([
  { key: 'content', name: '内容', desc: '图片、视频与文章锚点', icon: '文', color: '#248cf5', active: true },
  { key: 'place', name: '地点', desc: '地点百科与兴趣 POI', icon: '地', color: '#24d06c', active: true },
  { key: 'service', name: '服务', desc: '可预约服务与商家', icon: '服', color: '#0d9488', active: true },
  { key: 'event', name: '活动', desc: '正在进行与即将开始', icon: '活', color: '#7650c8', active: true },
  { key: 'route', name: '路线', desc: '步行、骑行和主题轨迹', icon: '线', color: '#ff7043', active: true },
  { key: 'replica', last: true, name: '地图副本', desc: '景区、展会与沉浸空间', icon: '副', color: '#f6b33b', active: true }
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
  const { state } = loadMapExploreState()
  mapCenter.value = { ...state.center }
  mapScale.value = state.scale
  const enabled = new Set(state.layers)
  layers.value.forEach(layer => { layer.active = enabled.has(layer.key) })
  enabledLayerCount.value = enabled.size
  previewMarkers.value = buildPreviewMarkers(state.center)
})

function buildPreviewMarkers(center, enabledKeys = layers.value.filter(layer => layer.active).map(layer => layer.key)) {
  const enabled = new Set(enabledKeys)
  const points = [
    ['place', 0, 0, '/static/marker-green.png'],
    ['content', 0.0022, 0.0015, '/static/marker-blue.png'],
    ['event', -0.0019, 0.0024, '/static/marker-orange.png'],
    ['route', 0.0013, -0.0021, '/static/marker-purple.png'],
    ['service', -0.0025, -0.0014, '/static/marker-green.png']
  ]
  return points.filter(item => enabled.has(item[0])).map((item, index) => ({
    id: index + 1,
    latitude: Number(center.latitude) + item[1],
    longitude: Number(center.longitude) + item[2],
    iconPath: item[3],
    width: 28,
    height: 34
  }))
}

function goBack() {
  uni.navigateBack({ fail: () => uni.switchTab({ url: '/pages/index/index' }) })
}

function toggleLayerPanel() {
  const next = layers.value.some(layer => !layer.active)
  layers.value.forEach(layer => { layer.active = next })
  persistLayers()
}

function toggleLayer(layer) {
  layer.active = !layer.active
  persistLayers()
}

function persistLayers() {
  const { state } = loadMapExploreState()
  const enabledLayers = layers.value.filter(layer => layer.active).map(layer => layer.key)
  const nextState = saveMapExploreState({ ...state, layers: enabledLayers })
  enabledLayerCount.value = enabledLayers.length
  previewMarkers.value = buildPreviewMarkers(mapCenter.value, enabledLayers)
  setMapExploreCommand({ applyFilters: { layers: nextState.layers } })
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
  height: 60rpx;
  padding: 0 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  background: rgba(36, 140, 245, 0.1);
  color: var(--color-info);
  font-size: 26rpx;
  font-weight: 700;
}

.layer-content {
  height: calc(100vh - 88rpx - env(safe-area-inset-top));
  padding: 28rpx;
  box-sizing: border-box;
}

.map-context {
  position: relative;
  width: 100%;
  height: 30vh;
  min-height: 440rpx;
  max-height: 560rpx;
  margin-bottom: 28rpx;
  overflow: hidden;
  border-radius: 28rpx;
  background: #e2e8f0;
  box-shadow: 0 12rpx 34rpx rgba(15,23,42,.12);
}

.context-map {
  width: 100%;
  height: 100%;
}

.map-context-caption {
  position: absolute;
  left: 20rpx;
  bottom: 18rpx;
  min-height: 56rpx;
  padding: 0 22rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
  border: 1rpx solid rgba(255,255,255,.88);
  border-radius: 28rpx;
  background: rgba(255,255,255,.94);
  color: #334155;
  box-shadow: 0 8rpx 24rpx rgba(15,23,42,.14);
  backdrop-filter: blur(14px);
}

.caption-text { font-size: 23rpx; font-weight: 700; }
.caption-pulse { width: 14rpx; height: 14rpx; border-radius: 50%; background: #22c55e; box-shadow: 0 0 0 7rpx rgba(34,197,94,.16); }

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
  background: var(--color-info);
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
  background: var(--color-info);
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
  background: #fff;
  border-radius: 14rpx;
  box-shadow: 0 1px 8px rgba(18, 24, 38, 0.06);
  overflow: hidden;
}

.layer-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 28rpx;
  border-bottom: 1rpx solid #f1f5f9;
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
  color: #fff;
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
  background: #fff;
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
  background: #fff;
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
  color: #fff;
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

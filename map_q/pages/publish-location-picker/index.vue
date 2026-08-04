<template>
  <view class="page">
    <map class="map" :latitude="location.latitude" :longitude="location.longitude" :markers="markers" :scale="16" show-location @tap="onMapTap" />
    <view class="nav" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="back" @tap="goBack"><view></view></view><text>添加位置</text><view class="done" @tap="done">完成</view>
    </view>
    <view class="sheet">
      <view class="handle"></view>
      <text class="title">位置展示精度</text>
      <text class="hint">精确与模糊位置会生成对应权限的地图锚点；隐藏位置不会生成锚点。</text>
      <view class="precision-list">
        <view v-for="item in modes" :key="item.id" :class="{ active: location.precision === item.id }" @tap="location.precision = item.id">
          <view class="mode-icon" :class="item.id"><view></view></view>
          <view class="mode-copy"><text>{{ item.name }}</text><text>{{ item.desc }}</text></view>
          <view class="radio"><view v-if="location.precision === item.id"></view></view>
        </view>
      </view>
      <view v-if="location.precision !== 'hidden'" class="place-card">
        <view><text>{{ location.name }}</text><text>{{ displayAddress }}</text></view>
        <view class="locate" @tap="useCurrentLocation">重新定位</view>
      </view>
      <text v-if="error" class="error">{{ error }}</text>
    </view>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { setCreationCommand } from '../../utils/creationCommand.js'

const statusBarHeight = ref(20)
const error = ref('')
const location = reactive({ precision: 'exact', name: '当前位置', address: '四川省成都市锦江区', latitude: 30.572269, longitude: 104.066541 })
const modes = [
  { id: 'exact', name: '精确位置', desc: '显示准确地点与地图锚点' },
  { id: 'fuzzy', name: '模糊位置', desc: '仅显示约 1 公里范围和城区' },
  { id: 'hidden', name: '隐藏位置', desc: '不保存坐标，也不生成地图锚点' }
]
const markers = computed(() => location.precision === 'hidden' ? [] : [{ id: 1, latitude: location.latitude, longitude: location.longitude, width: 28, height: 36, iconPath: '/static/marker.png' }])
const displayAddress = computed(() => location.precision === 'fuzzy' ? '成都市锦江区 · 约 1 公里范围' : location.address)
function onMapTap(event) {
  const value = event?.detail || event || {}
  if (!Number.isFinite(Number(value.latitude)) || !Number.isFinite(Number(value.longitude))) return
  location.latitude = Number(value.latitude)
  location.longitude = Number(value.longitude)
  location.name = '地图选点'
  location.address = `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
}
function useCurrentLocation() {
  error.value = ''
  uni.getLocation({
    type: 'gcj02',
    success: result => Object.assign(location, { latitude: result.latitude, longitude: result.longitude, name: '当前位置', address: `${Number(result.latitude).toFixed(5)}, ${Number(result.longitude).toFixed(5)}` }),
    fail: () => { error.value = '定位失败，请在地图上手动选点或检查定位权限' }
  })
}
function done() {
  const value = { ...location }
  if (value.precision === 'fuzzy') {
    value.latitude = Number(Number(value.latitude).toFixed(2))
    value.longitude = Number(Number(value.longitude).toFixed(2))
    value.name = '成都市锦江区'
    value.address = displayAddress.value
  }
  if (value.precision === 'hidden') Object.assign(value, { name: '', address: '', latitude: null, longitude: null })
  setCreationCommand({ applyLocation: value })
  uni.navigateBack()
}
function goBack() { uni.navigateBack() }
onLoad(() => {
  try {
    const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
    statusBarHeight.value = info.statusBarHeight || 20
  } catch (error) {}
})
</script>

<style scoped>
.page { position: relative; height: 100vh; overflow: hidden; background: #e2e8f0; }.map { width: 100%; height: 42vh; }.nav { position: absolute; z-index: 10; top: 0; left: 0; right: 0; height: 44px; padding-left: 14px; padding-right: 14px; display: flex; align-items: center; justify-content: space-between; box-sizing: content-box; background: rgba(255,255,255,.9); backdrop-filter: blur(14px); }.nav>text { font-size: 17px; font-weight: 800; }.back,.done { min-width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 14px; }.back { background: #f1f5f9; }.back view { width: 10px; height: 10px; border-left: 2px solid #334155; border-bottom: 2px solid #334155; transform: rotate(45deg); }.done { padding: 0 10px; color: #fff; background: #ea580c; font-size: 13px; font-weight: 700; }.sheet { position: absolute; z-index: 8; left: 0; right: 0; bottom: 0; min-height: 62vh; padding: 10px 16px calc(22px + env(safe-area-inset-bottom)); border-radius: 26px 26px 0 0; background: var(--color-page); box-sizing: border-box; box-shadow: 0 -12px 30px rgba(15,23,42,.12); }.handle { width: 42px; height: 5px; margin: 0 auto 15px; border-radius: 3px; background: #cbd5e1; }.title,.hint,.mode-copy text,.place-card text,.error { display: block; }.title { font-size: 19px; font-weight: 800; }.hint { margin-top: 6px; color: #64748b; font-size: 12px; line-height: 1.55; }.precision-list { margin-top: 14px; overflow: hidden; border-radius: 18px; background: #fff; }.precision-list>view { min-height: 72px; padding: 10px 12px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #f1f5f9; }.precision-list>view:last-child { border-bottom: 0; }.precision-list>view.active { background: #fff7ed; }.mode-icon { width: 42px; height: 42px; border-radius: 13px; display: flex; align-items: center; justify-content: center; background: #eff6ff; }.mode-icon view { width: 15px; height: 15px; border: 2px solid #2563eb; border-radius: 50%; }.mode-icon.fuzzy { background: #fff7ed; }.mode-icon.fuzzy view { border-style: dashed; border-color: #ea580c; }.mode-icon.hidden { background: #f1f5f9; }.mode-icon.hidden view { border-radius: 3px; border-color: #64748b; transform: rotate(45deg); }.mode-copy { flex: 1; }.mode-copy text:first-child { font-size: 14px; font-weight: 700; }.mode-copy text:last-child { margin-top: 4px; color: #64748b; font-size: 11px; }.radio { width: 22px; height: 22px; border: 2px solid #cbd5e1; border-radius: 50%; display: flex; align-items: center; justify-content: center; }.active .radio { border-color: #ea580c; }.radio view { width: 12px; height: 12px; border-radius: 50%; background: #ea580c; }.place-card { min-height: 66px; margin-top: 12px; padding: 10px 12px; display: flex; align-items: center; justify-content: space-between; gap: 12px; border-radius: 17px; background: #fff; }.place-card text:first-child { font-size: 14px; font-weight: 700; }.place-card text:last-child { margin-top: 3px; color: #64748b; font-size: 11px; }.locate { min-width: 76px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 13px; color: #2563eb; background: #eff6ff; font-size: 12px; font-weight: 700; }.error { margin-top: 8px; color: #b91c1c; font-size: 12px; }
</style>


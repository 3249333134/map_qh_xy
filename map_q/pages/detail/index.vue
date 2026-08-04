<template>
  <view class="detail-page-wrapper">
    <view v-if="loading" class="loading-state"><view class="loading-card"></view><view class="loading-line wide"></view><view class="loading-line"></view></view>
    <view v-else-if="error" class="error-state"><view class="error-mark">!</view><text class="error-title">详情加载失败</text><text class="error-copy">{{ error }}</text><view class="retry-button" @tap="loadDetail(true)">重新加载</view></view>
    <template v-else-if="detail">
      <NormalDetail v-if="cardType === 'normal'" />
      <VideoDetail v-else-if="cardType === 'video'" />
      <ArticleDetail v-else-if="cardType === 'article'" />
      <EventDetail v-else-if="cardType === 'event'" />
      <ServiceDetail v-else-if="cardType === 'service'" />
      <PlaceDetail v-else-if="cardType === 'place'" />
      <TrackDetail v-else-if="cardType === 'track'" />
      <NormalDetail v-else />
      <DetailCommonOverlay :detail="detail" @state-change="actionState = $event" />
    </template>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad, onShareAppMessage } from '@dcloudio/uni-app'
import NormalDetail from './components/NormalDetail.vue'
import ServiceDetail from './components/ServiceDetail.vue'
import VideoDetail from './components/VideoDetail.vue'
import ArticleDetail from './components/ArticleDetail.vue'
import PlaceDetail from './components/PlaceDetail.vue'
import EventDetail from './components/EventDetail.vue'
import TrackDetail from './components/TrackDetail.vue'
import DetailCommonOverlay from './components/DetailCommonOverlay.vue'
import { contentDetailApi } from '../../utils/api/contentDetail.js'
import { contentInteractionApi } from '../../utils/api/contentInteraction.js'
import { setMapExploreCommand } from '../../utils/mapExploreState.js'

const cardType = ref('')
const detail = ref(null)
const loading = ref(true)
const error = ref('')
const actionState = ref(null)
const optionsRef = ref({})

function openMapContext(value) {
  const location = value.location
  const point = {
    _id: value.id, id: value.id, type: value.type, name: value.title,
    description: value.description, address: location?.address || '',
    location: location ? { type: 'Point', coordinates: [location.longitude, location.latitude] } : value.track?.coordinates?.length ? { type: 'LineString', coordinates: value.track.coordinates } : null,
    highEnergyPoints: value.track?.nodes?.map(node => ({ coordinate: node.coordinate, label: node.name })) || []
  }
  setMapExploreCommand({ focusPoint: point.location?.type === 'Point' ? point : null, showRoute: point.location?.type === 'LineString' ? point : null, openDetail: point, scale: 16 })
  uni.switchTab({ url: value.type === 'service' ? '/pages/service/index' : '/pages/index/index' })
}

async function loadDetail(force = false) {
  loading.value = true
  error.value = ''
  try {
    const options = optionsRef.value
    const last = uni.getStorageSync('INDEX_LAST_ITEM') || {}
    const type = options.type || last.type || 'normal'
    const id = options.id || last._id || last.id || `${type}_preview`
    cardType.value = type
    const value = await contentDetailApi.fetchById(id, type, { force })
    detail.value = value
    actionState.value = contentInteractionApi.getState(value.id)
    if (['place', 'service', 'track'].includes(value.type) && options.inline !== '0') openMapContext(value)
  } catch (cause) {
    error.value = cause?.message || '请检查网络后重试'
  } finally {
    loading.value = false
  }
}

onLoad(options => { optionsRef.value = options || {}; loadDetail(false) })
onShareAppMessage(() => ({ title: detail.value?.title || '足迹内容', path: detail.value ? contentInteractionApi.buildSharePath(detail.value) : '/pages/index/index' }))
</script>

<style>
.detail-page-wrapper { min-height: 100vh; background: var(--color-page); }.loading-state { padding: calc(env(safe-area-inset-top) + 72px) 16px 24px; min-height: 100vh; box-sizing: border-box; }
.loading-card,.loading-line { position: relative; overflow: hidden; border-radius: 18px; background: #e9edf2; }.loading-card { height: 280px; }.loading-line { width: 68%; height: 20px; margin-top: 18px; }.loading-line.wide { width: 92%; height: 28px; }.loading-card::after,.loading-line::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg,transparent,rgba(255,255,255,.7),transparent); animation: shimmer 1.2s infinite; }
.error-state { min-height: 100vh; padding: 140px 28px 40px; display: flex; flex-direction: column; align-items: center; box-sizing: border-box; text-align: center; }.error-mark { width: 58px; height: 58px; display: flex; align-items: center; justify-content: center; border-radius: 18px; color: #b91c1c; background: #fef2f2; font-size: 28px; font-weight: 800; }.error-title { margin-top: 18px; color: #0f172a; font-size: 20px; font-weight: 750; }.error-copy { margin-top: 8px; color: #64748b; font-size: 14px; line-height: 1.6; }.retry-button { min-width: 132px; min-height: 46px; margin-top: 24px; display: flex; align-items: center; justify-content: center; border-radius: 15px; color: #fff; background: #ea580c; font-size: 14px; font-weight: 700; }
@keyframes shimmer { from { transform: translateX(-100%); } to { transform: translateX(100%); } }@media (prefers-reduced-motion: reduce) { .loading-card::after,.loading-line::after { animation: none; } }
</style>

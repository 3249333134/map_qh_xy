<template>
  <view class="redirect-page">
    <view v-if="!error" class="loader"><view></view><text>正在打开服务地图详情</text></view>
    <view v-else class="error-state"><text>{{ error }}</text><view @tap="openAgain">重试</view></view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { contentDetailApi } from '../../../utils/api/contentDetail.js'
import { setMapExploreCommand } from '../../../utils/mapExploreState.js'
const error = ref('')
const optionsRef = ref({})
async function openAgain() {
  error.value = ''
  try {
    const raw = uni.getStorageSync('SERVICE_LAST_ITEM') || uni.getStorageSync('BOOKING_ITEM') || {}
    const detail = await contentDetailApi.fetchById(optionsRef.value.id || raw._id || raw.id || 'service_preview', 'service', { force: Boolean(error.value) })
    const location = detail.location
    const point = {
      _id: detail.id, id: detail.id, type: 'service', name: detail.title, description: detail.description,
      author: detail.author?.name, address: location?.address || '', price: detail.service.pricing.amount,
      provider: detail.service.provider, verification: detail.service.verification, pricing: detail.service.pricing,
      serviceArea: detail.service.serviceArea, availableSlots: detail.service.availableSlots, reviews: detail.service.reviews, policies: detail.service.policies,
      location: location ? { type: 'Point', coordinates: [location.longitude, location.latitude] } : null
    }
    setMapExploreCommand({ focusPoint: point, openDetail: point, scale: 16 })
    uni.switchTab({ url: '/pages/service/index' })
  } catch (cause) { error.value = cause?.message || '服务详情加载失败' }
}
onLoad(options => { optionsRef.value = options || {}; openAgain() })
</script>

<style scoped>
.redirect-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--color-page); }.loader,.error-state { display: flex; flex-direction: column; align-items: center; color: #64748b; font-size: 13px; }.loader view { width: 34px; height: 34px; margin-bottom: 14px; border: 3px solid #fed7aa; border-top-color: #ea580c; border-radius: 50%; animation: spin .8s linear infinite; }.error-state view { min-width: 120px; min-height: 46px; margin-top: 18px; border-radius: 15px; display: flex; align-items: center; justify-content: center; color: #fff; background: #ea580c; font-weight: 700; }@keyframes spin { to { transform: rotate(360deg); } }@media (prefers-reduced-motion: reduce) { .loader view { animation: none; } }
</style>

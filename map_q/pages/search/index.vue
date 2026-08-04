<template>
  <view class="search-page">
    <view class="status-spacer" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="search-header">
      <view class="search-field">
        <view class="search-glyph" aria-hidden="true"></view>
        <input v-model="keyword" class="search-input" confirm-type="search" placeholder="搜索地点、内容、服务、活动或路线" focus />
        <view v-if="keyword" class="clear-btn" role="button" aria-label="清除关键词" @tap="keyword = ''">×</view>
      </view>
      <view class="cancel-btn" role="button" aria-label="返回地图" @tap="goBack">取消</view>
    </view>

    <scroll-view class="search-content" scroll-y>
      <view v-if="showAiEntry" class="ai-entry" @tap="openAiSearch">
        <view class="ai-mark">AI</view>
        <view class="ai-copy">
          <text class="ai-title">用 AI 理解“{{ keyword }}”</text>
          <text class="ai-desc">可组合地点、时间、活动和路线条件</text>
        </view>
        <text class="arrow">›</text>
      </view>

      <template v-if="groupedResults.length">
        <view v-for="group in groupedResults" :key="group.type" class="result-group">
          <view class="group-head"><text>{{ group.label }}</text><text class="group-count">{{ group.items.length }}</text></view>
          <view class="result-list">
            <view v-for="item in group.items" :key="item.id" class="result-row" @tap="openResult(item)">
              <view class="result-thumb" :class="item.type"><text>{{ item.icon }}</text></view>
              <view class="result-main">
                <text class="result-title">{{ item.title }}</text>
                <text class="result-desc">{{ item.description }}</text>
              </view>
              <view class="result-action">{{ item.action }}</view>
            </view>
          </view>
        </view>
      </template>

      <view v-else class="empty-state">
        <view class="empty-search" aria-hidden="true"></view>
        <text class="empty-title">当前条件下没有结果</text>
        <text class="empty-desc">可以扩大地图范围、调整时间或清除分类标签</text>
        <view class="recovery-actions">
          <view class="recovery-btn primary" @tap="recover('space')">扩大范围</view>
          <view class="recovery-btn" @tap="recover('time')">不限时间</view>
          <view class="recovery-btn" @tap="recover('category')">清除标签</view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { setMapExploreCommand } from '../../utils/mapExploreState.js'

const keyword = ref('')
const statusBarHeight = ref(24)

const results = ref([
  { id: 'place-1', type: 'place', icon: '地', title: '春熙路', description: '成都热门商圈 · 1.2km', action: '定位', location: { type: 'Point', coordinates: [104.0809, 30.6572] } },
  { id: 'content-1', type: 'content', contentType: 'normal', icon: '图', title: '春熙路街拍灵感', description: '用户495 · 464 赞', action: '查看', location: { type: 'Point', coordinates: [104.0818, 30.6566] } },
  { id: 'service-1', type: 'service', icon: '服', title: '城市旅拍服务', description: '营业中 · 30分钟响应 · 可预约', action: '预约', location: { type: 'Point', coordinates: [104.0788, 30.6582] } },
  { id: 'event-1', type: 'event', icon: '活', title: '周末城市摄影漫步', description: '本周六 15:00 · 余 8 位', action: '详情', location: { type: 'Point', coordinates: [104.084, 30.655] } },
  { id: 'track-1', type: 'track', icon: '线', title: '春熙路夜景路线', description: '8.6km · 52分钟', action: '路线', location: { type: 'LineString', coordinates: [[104.073,30.653],[104.081,30.657],[104.089,30.661]] } }
])

const groupMeta = [
  { type: 'place', label: '地点' },
  { type: 'content', label: '内容' },
  { type: 'service', label: '服务' },
  { type: 'event', label: '活动' },
  { type: 'track', label: '路线' }
]

const filtered = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  if (!query) return results.value
  return results.value.filter(item => `${item.title} ${item.description}`.toLowerCase().includes(query))
})

const groupedResults = computed(() => groupMeta.map(group => ({
  ...group,
  items: filtered.value.filter(item => item.type === group.type)
})).filter(group => group.items.length))

const showAiEntry = computed(() => {
  const value = keyword.value.trim()
  return value.length >= 4 && (/[？?]/.test(value) || /(附近|适合|帮我|路线|安排|有没有|想去)/.test(value))
})

onLoad(options => {
  keyword.value = options?.q ? decodeURIComponent(options.q) : ''
  try {
    const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
    statusBarHeight.value = info.statusBarHeight || info.safeAreaInsets?.top || 24
  } catch (error) {}
})

const goBack = () => uni.navigateBack({ fail: () => uni.switchTab({ url: '/pages/index/index' }) })

const focusMap = item => {
  setMapExploreCommand({ focusPoint: { ...item, _id: item.id, name: item.title } })
  uni.switchTab({ url: '/pages/index/index' })
}

function openResult(item) {
  if (item.type === 'place') return focusMap(item)
  if (item.type === 'service') {
    uni.setStorageSync('BOOKING_ITEM', item)
    uni.navigateTo({ url: '/pages/service/detail/index?id=service-1&source=search' })
    return
  }
  if (item.type === 'track') {
    setMapExploreCommand({ showRoute: { ...item, _id: item.id, name: item.title }, focusPoint: { ...item, location: { type: 'Point', coordinates: item.location.coordinates[0] } } })
    uni.switchTab({ url: '/pages/index/index' })
    return
  }
  uni.setStorageSync('INDEX_LAST_ITEM', { ...item, _id: item.id, type: item.contentType || item.type, name: item.title })
  uni.navigateTo({ url: `/pages/detail/index?id=${encodeURIComponent(item.id)}&source=search&type=${encodeURIComponent(item.contentType || item.type)}` })
}

function openAiSearch() {
  uni.navigateTo({ url: `/pages/ai-search/index?q=${encodeURIComponent(keyword.value)}` })
}

function recover(type) {
  const applyFilters = {}
  if (type === 'space') applyFilters.spatialFilter = { mode: 'radius', radiusKm: 10 }
  if (type === 'time') applyFilters.timeRange = { preset: 'all', start: '', end: '' }
  if (type === 'category') applyFilters.category = 'all'
  setMapExploreCommand({ applyFilters })
  uni.switchTab({ url: '/pages/index/index' })
}
</script>

<style scoped>
.search-page { min-height: 100vh; background: var(--color-page); color: #0f172a; }
.status-spacer,.search-header { background: rgba(255,255,255,.98); }
.search-header { min-height: 58px; padding: 10px 14px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid #e2e8f0; box-sizing: border-box; }
.search-field { flex: 1; height: 44px; padding: 0 14px; display: flex; align-items: center; border-radius: 22px; background: #f1f5f9; }
.search-glyph { position: relative; width: 15px; height: 15px; margin-right: 10px; border: 2px solid #64748b; border-radius: 50%; box-sizing: border-box; }
.search-glyph::after { content: ''; position: absolute; width: 6px; height: 2px; right: -5px; bottom: -2px; background: #64748b; transform: rotate(45deg); }
.search-input { flex: 1; height: 44px; font-size: 16px; color: #0f172a; }
.clear-btn,.cancel-btn { min-width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; color: #64748b; }
.clear-btn { min-width: 32px; font-size: 22px; }
.search-content { height: calc(100vh - 58px - env(safe-area-inset-top)); padding: 14px; box-sizing: border-box; }
.ai-entry { min-height: 76px; margin-bottom: 18px; padding: 12px 14px; border: 1px solid rgba(234,88,12,.15); border-radius: 18px; background: linear-gradient(135deg,#fff7ed,#fff); display: flex; align-items: center; gap: 12px; box-shadow: 0 8px 24px rgba(15,23,42,.06); }
.ai-mark { width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg,#f97316,var(--color-info)); color: #fff; font-size: 13px; font-weight: 800; }
.ai-copy,.result-main { flex: 1; min-width: 0; }
.ai-title,.ai-desc,.result-title,.result-desc { display: block; }
.ai-title { font-size: 15px; font-weight: 750; }
.ai-desc { margin-top: 4px; color: #64748b; font-size: 12px; }
.arrow { color: #94a3b8; font-size: 26px; }
.result-group { margin-bottom: 22px; }
.group-head { margin: 0 2px 8px; display: flex; align-items: center; justify-content: space-between; font-size: 16px; font-weight: 800; }
.group-count { color: #94a3b8; font-size: 12px; font-weight: 500; }
.result-list { overflow: hidden; border: 1px solid rgba(148,163,184,.16); border-radius: 18px; background: #fff; box-shadow: 0 8px 24px rgba(15,23,42,.05); }
.result-row { min-height: 82px; padding: 10px 12px; display: flex; align-items: center; gap: 11px; border-bottom: 1px solid #f1f5f9; }
.result-row:last-child { border-bottom: 0; }
.result-thumb { width: 52px; height: 52px; flex-shrink: 0; border-radius: 15px; display: flex; align-items: center; justify-content: center; background: #2563eb; color: #fff; font-size: 13px; font-weight: 800; }
.result-thumb.place { background: #059669; }.result-thumb.service { background: #0d9488; }.result-thumb.event { background: var(--color-info); }.result-thumb.track { background: #ea580c; }
.result-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 15px; font-weight: 750; }
.result-desc { margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #64748b; font-size: 12px; }
.result-action { min-width: 52px; height: 34px; padding: 0 10px; border-radius: 17px; display: flex; align-items: center; justify-content: center; background: #eff6ff; color: #2563eb; font-size: 12px; font-weight: 700; }
.empty-state { padding: 70px 12px; display: flex; flex-direction: column; align-items: center; text-align: center; }
.empty-search { position: relative; width: 52px; height: 52px; border: 5px solid #cbd5e1; border-radius: 50%; box-sizing: border-box; }
.empty-search::after { content: ''; position: absolute; width: 22px; height: 5px; right: -17px; bottom: -8px; border-radius: 3px; background: #cbd5e1; transform: rotate(45deg); }
.empty-title { margin-top: 28px; font-size: 17px; font-weight: 800; }
.empty-desc { margin-top: 8px; color: #64748b; font-size: 13px; }
.recovery-actions { margin-top: 24px; display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; }
.recovery-btn { min-height: 44px; padding: 0 16px; border: 1px solid #e2e8f0; border-radius: 22px; display: flex; align-items: center; background: #fff; color: #475569; font-size: 13px; font-weight: 700; }
.recovery-btn.primary { border-color: #f97316; background: #f97316; color: #fff; }
</style>

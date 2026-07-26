<template>
  <view class="search-page">
    <view class="status-spacer" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="search-header">
      <view class="search-field">
        <view class="search-glyph" aria-hidden="true"></view>
        <input
          v-model="keyword"
          class="search-input"
          confirm-type="search"
          placeholder="搜索内容、地点或服务"
          focus
        />
        <view v-if="keyword" class="clear-btn" @tap="keyword = ''">×</view>
      </view>
      <view class="cancel-btn" @tap="goBack">取消</view>
    </view>

    <scroll-view class="search-content" scroll-y>
      <view class="section-title">热门搜索</view>
      <view class="chips">
        <view
          v-for="item in filters"
          :key="item.key"
          class="chip"
          :class="{ active: activeFilter === item.key }"
          @tap="activeFilter = item.key"
        >{{ item.label }}</view>
      </view>

      <view class="section-title result-heading">
        <text>搜索结果</text>
        <text class="result-count">{{ visibleResults.length }} 条</text>
      </view>

      <view v-if="visibleResults.length" class="result-list">
        <view v-for="item in visibleResults" :key="item.id" class="result-row">
          <image v-if="item.cover" class="result-thumb" :src="item.cover" mode="aspectFill" />
          <view v-else class="result-thumb fallback" :class="item.type"><text>{{ item.icon }}</text></view>
          <view class="result-main">
            <text class="result-title">{{ item.title }}</text>
            <text class="result-desc">{{ item.description }}</text>
          </view>
          <view class="result-action" @tap="openResult(item)">{{ item.action }}</view>
        </view>
      </view>

      <view v-else class="empty-state">
        <view class="empty-search" aria-hidden="true"></view>
        <text class="empty-title">没有找到相关内容</text>
        <text class="empty-desc">换个关键词，或切换上方分类试试</text>
      </view>

      <view class="map-hint">
        <text class="hint-title">地图联动状态</text>
        <text class="hint-copy">地点结果可回填并高亮首页地图；普通内容仍进入对应详情页。</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getContentCover, getItemId, getLocationText } from '../../utils/contentResolver.js'

const keyword = ref('')
const activeFilter = ref('all')
const source = ref('index')
const statusBarHeight = ref(24)
const storedItem = ref(null)

const filters = [
  { key: 'all', label: '全部' },
  { key: 'place', label: '地点' },
  { key: 'normal', label: '图片' },
  { key: 'video', label: '视频' },
  { key: 'service', label: '服务' },
  { key: 'nearby', label: '附近' }
]

const fallbackResults = [
  { id: 'normal-1', type: 'normal', icon: '图', title: '推荐打卡 1', description: '用户495 · 图片内容 · 464 赞', action: '查看' },
  { id: 'place-1', type: 'place', icon: '地', title: '推荐地点 4', description: '成都市春熙路4号 · 1.2km', action: '定位', location: { type: 'Point', coordinates: [104.0809, 30.6572] } },
  { id: 'video-1', type: 'video', icon: '播', title: '精彩视频 2', description: '1.0万播放 · 426 赞 · 2:02', action: '播放' },
  { id: 'article-1', type: 'article', icon: '文', title: '精选文章 3', description: '5805 阅读 · 城市路线攻略', action: '阅读' },
  { id: 'service-1', type: 'service', icon: '服', title: '春熙路便民服务', description: '营业中 · 30分钟响应 · 可预约', action: '预约' }
]

const results = computed(() => {
  const item = storedItem.value
  if (!item) return fallbackResults
  const type = item.type || (source.value === 'service' ? 'service' : 'normal')
  const locationText = getLocationText(item)
  return [{
    ...item,
    id: getItemId(item) || 'stored-result',
    type,
    icon: type === 'service' ? '服' : type === 'place' ? '地' : '图',
    title: item.name || item.title || '最近浏览内容',
    description: locationText || item.description || '最近浏览',
    cover: getContentCover(item),
    action: type === 'place' ? '定位' : type === 'service' ? '预约' : '查看'
  }, ...fallbackResults]
})

const visibleResults = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  return results.value.filter(item => {
    const filterMatch = activeFilter.value === 'all' || activeFilter.value === 'nearby' || item.type === activeFilter.value
    const keywordMatch = !q || `${item.title} ${item.description}`.toLowerCase().includes(q)
    return filterMatch && keywordMatch
  })
})

onLoad(options => {
  source.value = options?.source || 'index'
  keyword.value = options?.q ? decodeURIComponent(options.q) : ''
  try {
    const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
    statusBarHeight.value = info.statusBarHeight || info.safeAreaInsets?.top || 24
    storedItem.value = uni.getStorageSync(source.value === 'service' ? 'SERVICE_LAST_ITEM' : 'INDEX_LAST_ITEM') || null
  } catch (e) {}
})

function goBack() {
  uni.navigateBack({ fail: () => uni.switchTab({ url: source.value === 'service' ? '/pages/service/index' : '/pages/index/index' }) })
}

function openResult(item) {
  if (item.type === 'place') {
    try { uni.setStorageSync('PENDING_MAP_FOCUS', item) } catch (e) {}
    uni.switchTab({ url: '/pages/index/index' })
    return
  }
  if (item.type === 'service') {
    try { uni.setStorageSync('BOOKING_ITEM', item) } catch (e) {}
    uni.navigateTo({ url: '/pages/booking/index?source=search' })
    return
  }
  try { uni.setStorageSync('INDEX_LAST_ITEM', item) } catch (e) {}
  const id = encodeURIComponent(item.id || '')
  uni.navigateTo({ url: `/pages/detail/index?id=${id}&source=index&type=${encodeURIComponent(item.type || 'normal')}` })
}
</script>

<style scoped>
.search-page { min-height: 100vh; background: #fff; color: #222; }
.status-spacer { background: #fff; }
.search-header { height: 58px; padding: 10px 14px 12px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid #eee; background: rgba(255,255,255,.98); }
.search-field { flex: 1; height: 36px; padding: 0 13px; display: flex; align-items: center; border-radius: 18px; background: #f2f4f7; }
.search-glyph { width: 14px; height: 14px; margin-right: 9px; border: 2px solid #8a8f98; border-radius: 50%; position: relative; }
.search-glyph::after { content: ''; position: absolute; width: 6px; height: 2px; right: -5px; bottom: -2px; border-radius: 2px; background: #8a8f98; transform: rotate(45deg); }
.search-input { flex: 1; height: 36px; font-size: 14px; color: #222; }
.clear-btn { width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; color: #9aa1aa; font-size: 20px; }
.cancel-btn { width: 42px; height: 36px; display: flex; align-items: center; justify-content: center; color: #747b85; font-size: 14px; }
.search-content { height: calc(100vh - 90px); padding: 14px; box-sizing: border-box; }
.section-title { margin: 2px 0 10px; font-size: 16px; line-height: 22px; font-weight: 700; }
.result-heading { margin-top: 18px; display: flex; justify-content: space-between; align-items: center; }
.result-count { color: #9aa1aa; font-size: 12px; font-weight: 400; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip { min-height: 30px; padding: 0 14px; display: flex; align-items: center; border-radius: 999px; background: #eff1f4; color: #5f646d; font-size: 13px; }
.chip.active { background: #248cf5; color: #fff; }
.result-list { padding-bottom: 8px; }
.result-row { min-height: 78px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid #eee; }
.result-thumb { width: 58px; height: 58px; flex-shrink: 0; border-radius: 8px; background: #edf0f3; }
.result-thumb.fallback { display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; background: linear-gradient(135deg,#69c8ff,#7650c8); }
.result-thumb.place { background: linear-gradient(135deg,#32c5a6,#248cf5); }
.result-thumb.service { background: linear-gradient(135deg,#24d06c,#32c5a6); }
.result-main { flex: 1; min-width: 0; }
.result-title,.result-desc { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.result-title { color: #252a31; font-size: 15px; line-height: 20px; font-weight: 700; }
.result-desc { margin-top: 3px; color: #89919c; font-size: 12px; line-height: 17px; }
.result-action { min-width: 52px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 15px; color: #248cf5; background: rgba(36,140,245,.1); font-size: 12px; font-weight: 700; }
.map-hint { margin: 18px 0 36px; padding: 14px; border-radius: 12px; background: #fff; box-shadow: 0 1px 8px rgba(18,24,38,.06); }
.hint-title,.hint-copy { display: block; }
.hint-title { font-size: 15px; font-weight: 700; }
.hint-copy { margin-top: 8px; color: #68707b; font-size: 13px; line-height: 21px; }
.empty-state { padding: 70px 24px; display: flex; flex-direction: column; align-items: center; }
.empty-search { width: 48px; height: 48px; border: 5px solid #d5d8dd; border-radius: 50%; position: relative; }
.empty-search::after { content: ''; position: absolute; width: 22px; height: 5px; right: -17px; bottom: -8px; border-radius: 4px; background: #d5d8dd; transform: rotate(45deg); }
.empty-title { margin-top: 28px; font-size: 16px; font-weight: 700; }
.empty-desc { margin-top: 8px; color: #9aa1aa; font-size: 13px; }
</style>

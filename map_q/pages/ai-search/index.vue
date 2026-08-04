<template>
  <view class="ai-search-page">
    <view class="status-spacer" :style="{ height: statusBarHeight + 'px' }"></view>

    <view class="search-header">
      <view class="search-field">
        <view class="search-glyph" aria-hidden="true"></view>
        <input
          v-model="keyword"
          class="search-input"
          confirm-type="search"
          placeholder="附近有猫咖和适合拍照的路线吗？"
          focus
        />
        <view v-if="keyword" class="clear-btn" @tap="keyword = ''">×</view>
      </view>
      <view class="cancel-btn" @tap="goBack">取消</view>
    </view>

    <scroll-view class="ai-content" scroll-y>
      <view class="ai-summary-card">
        <view class="ai-badge">
          <text class="ai-badge-text">AI</text>
        </view>
        <view class="ai-summary-body">
          <text class="ai-summary-title">为你找到 {{ summary.poi }} 个兴趣 POI、{{ summary.track }} 条轨迹和 {{ summary.content }} 条用户内容。</text>
          <text class="ai-summary-copy">结果会同步高亮地图锚点。</text>
        </view>
      </view>

      <view class="section-title">搜索结果</view>

      <view class="result-list">
        <view v-for="item in results" :key="item.id" class="result-row">
          <view class="result-thumb" :class="item.type">
            <text class="thumb-text">{{ item.icon }}</text>
          </view>
          <view class="result-main">
            <text class="result-title">{{ item.title }}</text>
            <text class="result-desc">{{ item.description }}</text>
          </view>
          <view class="result-action" @tap="openResult(item)">{{ item.action }}</view>
        </view>
      </view>

      <view class="map-hint">
        <text class="hint-title">地图联动状态</text>
        <text class="hint-copy">兴趣 POI 与轨迹结果会同步高亮首页地图锚点，用户内容进入对应详情页。</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { setMapExploreCommand } from '../../utils/mapExploreState.js'

const statusBarHeight = ref(20)
const keyword = ref('')

const summary = ref({
  poi: 2,
  track: 1,
  content: 3
})

const results = ref([
  {
    id: 'poi-1',
    type: 'poi',
    icon: 'POI',
    title: '猫咖兴趣 POI',
    description: '距离 820m · 服务可预约',
    action: '定位',
    location: { type: 'Point', coordinates: [104.0809, 30.6572] }
  },
  {
    id: 'track-1',
    type: 'track',
    icon: '轨迹',
    title: '城市夜景摄影路线',
    description: '8.6km · 52分钟 · 轨迹',
    action: '路线',
    location: { type: 'LineString', coordinates: [[104.072,30.653],[104.081,30.657],[104.09,30.661]] }
  },
  {
    id: 'content-1',
    type: 'content',
    icon: '图',
    title: '用户上传图片内容',
    description: '同频道 24 条相关内容',
    action: '查看'
  }
])

onLoad(options => {
  keyword.value = options?.q ? decodeURIComponent(options.q) : ''
})

onMounted(() => {
  try {
    const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
    statusBarHeight.value = info.statusBarHeight || 20
  } catch (e) {}
})

function goBack() {
  uni.navigateBack({ fail: () => uni.switchTab({ url: '/pages/index/index' }) })
}

function openResult(item) {
  if (item.type === 'poi') {
    setMapExploreCommand({
      focusPoint: { ...item, _id: item.id, type: 'place', name: item.title },
      applyFilters: { category: 'all' }
    })
    uni.switchTab({ url: '/pages/index/index' })
    return
  }
  if (item.type === 'track') {
    const firstPoint = item.location.coordinates[0]
    setMapExploreCommand({
      showRoute: { ...item, _id: item.id, type: 'track', name: item.title },
      focusPoint: { ...item, _id: item.id, type: 'place', name: item.title, location: { type: 'Point', coordinates: firstPoint } }
    })
    uni.switchTab({ url: '/pages/index/index' })
    return
  }
  const content = { ...item, _id: item.id, type: 'normal', name: item.title }
  uni.setStorageSync('INDEX_LAST_ITEM', content)
  uni.navigateTo({ url: `/pages/detail/index?id=${encodeURIComponent(item.id)}&source=ai-search&type=normal` })
}
</script>

<style scoped>
.ai-search-page {
  min-height: 100vh;
  background: #f7f7f8;
  color: #222;
}

.status-spacer {
  background: #fff;
}

.search-header {
  height: 116rpx;
  padding: 20rpx 28rpx 24rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  border-bottom: 1rpx solid #f1f5f9;
  background: rgba(255, 255, 255, 0.98);
}

.search-field {
  flex: 1;
  height: 72rpx;
  padding: 0 26rpx;
  display: flex;
  align-items: center;
  border-radius: 999rpx;
  background: #f0f1f3;
}

.search-glyph {
  width: 28rpx;
  height: 28rpx;
  margin-right: 18rpx;
  border: 4rpx solid #8a8f98;
  border-radius: 50%;
  position: relative;
  flex-shrink: 0;
}

.search-glyph::after {
  content: '';
  position: absolute;
  width: 12rpx;
  height: 4rpx;
  right: -10rpx;
  bottom: -4rpx;
  border-radius: 4rpx;
  background: #8a8f98;
  transform: rotate(45deg);
}

.search-input {
  flex: 1;
  height: 72rpx;
  font-size: 28rpx;
  color: #222;
}

.clear-btn {
  width: 52rpx;
  height: 52rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9aa1aa;
  font-size: 40rpx;
}

.cancel-btn {
  width: 84rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #5f646d;
  font-size: 28rpx;
}

.ai-content {
  height: calc(100vh - 116rpx - env(safe-area-inset-top));
  padding: 28rpx;
  box-sizing: border-box;
}

.ai-summary-card {
  margin-bottom: 36rpx;
  padding: 28rpx;
  border-radius: 14rpx;
  background: #fff;
  box-shadow: 0 1px 8px rgba(18, 24, 38, 0.06);
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
}

.ai-badge {
  width: 64rpx;
  height: 64rpx;
  border-radius: 16rpx;
  background: linear-gradient(135deg, var(--color-info) 0%, var(--color-info) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ai-badge-text {
  color: #fff;
  font-size: 26rpx;
  font-weight: 800;
}

.ai-summary-body {
  flex: 1;
  min-width: 0;
}

.ai-summary-title {
  display: block;
  color: #222;
  font-size: 28rpx;
  line-height: 42rpx;
  font-weight: 600;
}

.ai-summary-copy {
  display: block;
  margin-top: 10rpx;
  color: #8a8f98;
  font-size: 24rpx;
  line-height: 34rpx;
}

.section-title {
  margin: 0 0 24rpx;
  font-size: 32rpx;
  line-height: 44rpx;
  font-weight: 700;
  color: #222;
}

.result-list {
  padding-bottom: 20rpx;
}

.result-row {
  min-height: 156rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  border-radius: 14rpx;
  background: #fff;
  box-shadow: 0 1px 8px rgba(18, 24, 38, 0.06);
}

.result-thumb {
  width: 116rpx;
  height: 116rpx;
  flex-shrink: 0;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 26rpx;
  font-weight: 700;
}

.result-thumb.poi {
  background: linear-gradient(135deg, #24d06c 0%, #32c5a6 100%);
}

.result-thumb.track {
  background: linear-gradient(135deg, #ff8a4a 0%, #ff5b35 100%);
}

.result-thumb.content {
  background: linear-gradient(135deg,#69c8ff 0%,var(--color-info) 100%);
}

.thumb-text {
  color: #fff;
  font-size: 28rpx;
  font-weight: 800;
}

.result-main {
  flex: 1;
  min-width: 0;
}

.result-title,
.result-desc {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-title {
  color: #222;
  font-size: 30rpx;
  line-height: 40rpx;
  font-weight: 700;
}

.result-desc {
  margin-top: 6rpx;
  color: #8a8f98;
  font-size: 24rpx;
  line-height: 34rpx;
}

.result-action {
  min-width: 104rpx;
  height: 60rpx;
  padding: 0 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  color: var(--color-info);
  background: rgba(36, 140, 245, 0.1);
  font-size: 24rpx;
  font-weight: 700;
  flex-shrink: 0;
}

.map-hint {
  margin: 20rpx 0 60rpx;
  padding: 28rpx;
  border-radius: 14rpx;
  background: #fff;
  box-shadow: 0 1px 8px rgba(18, 24, 38, 0.06);
}

.hint-title,
.hint-copy {
  display: block;
}

.hint-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #222;
}

.hint-copy {
  margin-top: 16rpx;
  color: #5f646d;
  font-size: 26rpx;
  line-height: 42rpx;
}
</style>

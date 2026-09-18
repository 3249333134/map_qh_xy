<template>
  <view class="page">
    <view class="status-spacer" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="nav-bar">
      <view class="nav-back" @tap="goBack">‹</view>
      <text class="nav-title">选择创作类型</text>
      <view class="nav-right"></view>
    </view>

    <view class="content">
      <view class="page-header">
        <text class="page-title">开始你的创作</text>
        <text class="page-sub">选择适合本次内容的创作类型</text>
      </view>

      <view class="type-grid">
        <view
          v-for="item in types"
          :key="item.key"
          class="type-card"
          @tap="onPickType(item)"
        >
          <view class="type-icon" :style="{ background: item.bg, color: item.color }">
            <text class="type-icon-text">{{ item.icon }}</text>
          </view>
          <text class="type-name">{{ item.name }}</text>
          <text class="type-desc">{{ item.desc }}</text>
        </view>
      </view>

      <view class="note-card">
        <text class="note-title">支持的内容形式</text>
        <text class="note-desc">内容支持图片、视频、文章、地点、服务、轨迹，并允许从频道发言升级为内容卡片。</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { setCreationCommand } from '../../utils/creationCommand.js'

const statusBarHeight = ref(20)
const pickerMode = ref(false)
const entryTypes = [
  { key: 'feed', name: '图文动态', icon: '图', desc: '图片 / 视频 / 文章', bg: 'rgba(36, 140, 245, 0.12)', color: '#248cf5', url: '/pages/publish/index' },
  { key: 'track', name: '轨迹内容', icon: '轨', desc: '路径 + 多媒体节点', bg: 'rgba(36, 208, 108, 0.12)', color: '#24d06c', url: '/pages/publish-track-editor/index' },
  { key: 'cocreate', name: '地图共创', icon: '协', desc: '锚点 / Wiki / 审核', bg: 'rgba(118, 80, 200, 0.12)', color: '#7650c8', url: '/pages/publish-cocreate/index' },
  { key: 'ai', name: 'AI模板', icon: 'AI', desc: '摘要 / 标题 / 模板', bg: 'rgba(255, 112, 67, 0.12)', color: '#ff7043', url: '/pages/publish-ai-template/index' }
]
const pickerTypes = [
  { key: 'normal', name: '普通动态', icon: '文', desc: '图文与位置动态', bg: 'rgba(234,88,12,.1)', color: '#f56f64' },
  { key: 'video', name: '视频', icon: '播', desc: '单个视频内容', bg: 'rgba(49,130,246,.1)', color: '#3182F6' },
  { key: 'article', name: '文章', icon: '章', desc: '长文与目录', bg: 'rgba(37,99,235,.1)', color: '#16b8a7' },
  { key: 'event', name: '活动', icon: '活', desc: '时间、地点与报名', bg: 'rgba(22,163,74,.1)', color: '#16a34a' }
]
const types = computed(() => pickerMode.value ? pickerTypes : entryTypes)

onMounted(() => {
  try {
    const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
    statusBarHeight.value = info.statusBarHeight || 20
  } catch (e) {}
})

const goBack = () => uni.navigateBack()
const onPickType = (item) => {
  if (pickerMode.value) {
    setCreationCommand({ applyType: item.key || 'normal' })
    uni.navigateBack()
    return
  }
  uni.navigateTo({
    url: item.url,
    fail: () => {
      uni.showToast({ title: '即将进入' + item.name, icon: 'none' })
    }
  })
}
onLoad(options => { pickerMode.value = options?.picker === '1' })
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--color-page);
}

.status-spacer {
  background: #fff;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: 0 24rpx;
  background: #fff;
  border-bottom: 1rpx solid var(--color-surface-muted);
}

.nav-back {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--color-surface-muted);
  color: var(--color-text);
  font-size: 44rpx;
  line-height: 44rpx;
}

.nav-title {
  font-size: 32rpx;
  font-weight: 700;
  color: var(--color-text);
}

.nav-right {
  width: 64rpx;
}

.content {
  padding: 32rpx 24rpx 48rpx;
}

.page-header {
  margin-bottom: 32rpx;
}

.page-title {
  display: block;
  font-size: 40rpx;
  font-weight: 800;
  color: var(--color-text);
}

.page-sub {
  display: block;
  margin-top: 12rpx;
  font-size: 26rpx;
  color: var(--color-text-muted);
}

.type-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}

.type-card {
  padding: 32rpx 24rpx;
  border-radius: 14rpx;
  background: #fff;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.type-icon {
  width: 88rpx;
  height: 88rpx;
  border-radius: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.type-icon-text {
  font-size: 36rpx;
  font-weight: 800;
}

.type-name {
  display: block;
  margin-top: 20rpx;
  font-size: 30rpx;
  font-weight: 700;
  color: var(--color-text);
}

.type-desc {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: var(--color-text-muted);
}

.note-card {
  margin-top: 32rpx;
  padding: 28rpx 24rpx;
  border-radius: 14rpx;
  background: var(--color-surface-muted);
}

.note-title {
  display: block;
  font-size: 26rpx;
  font-weight: 700;
  color: var(--color-text-body);
}

.note-desc {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: var(--color-text-muted);
  line-height: 1.6;
}
</style>

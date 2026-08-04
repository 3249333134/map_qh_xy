<template>
  <view class="page">
    <view class="status-spacer" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="nav-bar">
      <view class="nav-back" @tap="goBack">‹</view>
      <text class="nav-title">AI模板助手</text>
      <view class="nav-right cta" @tap="onApply">应用</view>
    </view>

    <view class="content">
      <view class="note-card">
        <view class="note-icon">AI</view>
        <view class="note-body">
          <text class="note-title">AI 智能识别</text>
          <text class="note-desc">AI自动识别地点、提取摘要、生成标题和标签，适配节日/地点/类型模板。</text>
        </view>
      </view>

      <view class="section-title">AI 生成结果</view>
      <view class="result-card">
        <view v-for="(r, i) in results" :key="r.key" class="result-row" :class="{ last: i === results.length - 1 }">
          <view class="result-left">
            <text class="result-label">{{ r.label }}</text>
            <text class="result-value">{{ r.value }}</text>
          </view>
          <view class="result-action" @tap="onResult(r)">重生成</view>
        </view>
      </view>

      <view class="section-title">选择模板</view>
      <view class="chips">
        <view
          v-for="c in templates"
          :key="c.key"
          class="chip"
          :class="{ active: c.active }"
          @tap="onChip(c)"
        >{{ c.name }}</view>
      </view>

      <view class="preview-card">
        <text class="preview-tag">预览</text>
        <text class="preview-title">春熙路的傍晚光影</text>
        <text class="preview-desc">城市漫游系列 · 探店模板 · 含 3 个推荐标签</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const statusBarHeight = ref(20)
const results = [
  { key: 'title', label: '标题建议', value: '春熙路的傍晚光影' },
  { key: 'place', label: '地点识别', value: '亚新大厦附近' },
  { key: 'tag', label: '推荐标签', value: '#城市漫游  #摄影' }
]
const templates = ref([
  { key: 'shop', name: '探店', active: true },
  { key: 'route', name: '路线', active: false },
  { key: 'event', name: '活动', active: false },
  { key: 'year', name: '年终回顾', active: false }
])

onMounted(() => {
  try {
    const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
    statusBarHeight.value = info.statusBarHeight || 20
  } catch (e) {}
})

const goBack = () => uni.navigateBack()
const onApply = () => {
  uni.showToast({ title: '已应用模板', icon: 'success' })
  setTimeout(goBack, 800)
}
const onResult = (r) => uni.showToast({ title: '重新生成' + r.label, icon: 'none' })
const onChip = (c) => {
  templates.value.forEach(item => { item.active = item.key === c.key })
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f7f7f8;
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
  border-bottom: 1rpx solid #f1f5f9;
}

.nav-back {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #f0f1f3;
  color: #222;
  font-size: 44rpx;
  line-height: 44rpx;
}

.nav-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #222;
}

.nav-right {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-right.cta {
  width: auto;
  padding: 0 28rpx;
  height: 56rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #ff8a4a 0%, #ff5b35 100%);
  color: #fff;
  font-size: 26rpx;
  font-weight: 700;
}

.content {
  padding: 24rpx 24rpx 48rpx;
}

.note-card {
  display: flex;
  align-items: center;
  padding: 28rpx 24rpx;
  border-radius: 14rpx;
  background: rgba(255, 112, 67, 0.1);
}

.note-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 18rpx;
  background: var(--color-primary);
  color: #fff;
  font-size: 26rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}

.note-body {
  flex: 1;
  margin-left: 20rpx;
}

.note-title {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #222;
}

.note-desc {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #5f646d;
  line-height: 1.6;
}

.section-title {
  display: block;
  margin: 36rpx 8rpx 16rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: #222;
}

.result-card {
  background: #fff;
  border-radius: 14rpx;
  box-shadow: 0 1px 8px rgba(18, 24, 38, 0.06);
  padding: 0 24rpx;
}

.result-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 0;
  border-bottom: 1rpx solid #f1f5f9;
}

.result-row.last {
  border-bottom: 0;
}

.result-left {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.result-label {
  font-size: 24rpx;
  color: #8a8f98;
}

.result-value {
  margin-top: 8rpx;
  font-size: 28rpx;
  font-weight: 600;
  color: #222;
}

.result-action {
  padding: 8rpx 20rpx;
  border-radius: 999rpx;
  background: #f0f1f3;
  color: #5f646d;
  font-size: 24rpx;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.chip {
  padding: 14rpx 28rpx;
  border-radius: 999rpx;
  background: #fff;
  color: #5f646d;
  font-size: 26rpx;
  box-shadow: 0 1px 8px rgba(18, 24, 38, 0.06);
}

.chip.active {
  background: var(--color-info);
  color: #fff;
}

.preview-card {
  margin-top: 32rpx;
  padding: 28rpx 24rpx;
  border-radius: 14rpx;
  background: #fff;
  box-shadow: 0 1px 8px rgba(18, 24, 38, 0.06);
}

.preview-tag {
  display: inline-block;
  padding: 4rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(36, 140, 245, 0.12);
  color: var(--color-info);
  font-size: 22rpx;
  font-weight: 600;
}

.preview-title {
  display: block;
  margin-top: 16rpx;
  font-size: 32rpx;
  font-weight: 700;
  color: #222;
}

.preview-desc {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #8a8f98;
}
</style>

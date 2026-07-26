<template>
  <view class="page">
    <view class="status-spacer" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="nav-bar">
      <view class="nav-back" @tap="goBack">‹</view>
      <text class="nav-title">时间轴回顾</text>
      <view class="nav-right nav-btn" @tap="onGenerate">生成</view>
    </view>

    <scroll-view class="content" scroll-y show-scrollbar="false">
      <!-- 标题卡片 -->
      <view class="title-card">
        <text class="title-main">2026 城市足迹</text>
        <text class="title-desc">按时间维度生成事件列表，支持动态插入内容、编辑节点和年终回顾。</text>
      </view>

      <!-- 时间轴 -->
      <view class="timeline">
        <view v-for="(node, idx) in nodes" :key="idx" class="timeline-item">
          <view class="timeline-left">
            <view class="timeline-dot" :class="{ first: idx === 0 }"></view>
            <view v-if="idx !== nodes.length - 1" class="timeline-line"></view>
          </view>
          <view class="timeline-card">
            <text class="timeline-date">{{ node.date }}</text>
            <text class="timeline-action">{{ node.action }}</text>
            <text class="timeline-count" v-if="node.count">· {{ node.count }}</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const statusBarHeight = ref(20)
onMounted(() => {
  try {
    const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
    statusBarHeight.value = info.statusBarHeight || 20
  } catch (e) {}
})

const goBack = () => uni.navigateBack()
const onGenerate = () => uni.showToast({ title: '生成时间轴', icon: 'none' })

const nodes = ref([
  { date: '07/07', action: '预约全部服务', count: '1' },
  { date: '07/06', action: '收藏城市夜景地点', count: '' },
  { date: '07/03', action: '发布推荐打卡内容', count: '' },
  { date: '06/28', action: '加入春熙路频道', count: '' }
])
</script>

<style scoped>
.page {
  --brand-blue: #248cf5;
  --brand-orange: #ff7043;
  --brand-purple: #7650c8;
  --success: #24d06c;
  --text-primary: #222;
  --text-body: #5f646d;
  --text-secondary: #8a8f98;
  --surface-app: #f7f7f8;
  --surface-card: #ffffff;
  --surface-muted: #f0f1f3;
  --card-shadow: 0 1px 8px rgba(18, 24, 38, 0.06);
  min-height: 100vh;
  background: var(--surface-app);
  display: flex;
  flex-direction: column;
}

.status-spacer { width: 100%; }

.nav-bar {
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: var(--surface-card);
  border-bottom: 1rpx solid #f0f1f3;
}

.nav-back {
  position: absolute;
  left: 24rpx;
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44rpx;
  color: var(--text-primary);
  line-height: 44rpx;
}

.nav-title {
  font-size: 32rpx;
  font-weight: 700;
  color: var(--text-primary);
}

.nav-right {
  position: absolute;
  right: 24rpx;
}

.nav-btn {
  padding: 10rpx 28rpx;
  border-radius: 28rpx;
  color: #fff;
  font-size: 26rpx;
  font-weight: 600;
  background: linear-gradient(135deg, #ff8a4a 0%, #ff5b35 100%);
  line-height: 40rpx;
}

.content { flex: 1; }

.title-card {
  margin: 24rpx;
  padding: 32rpx 28rpx;
  background: linear-gradient(135deg, #eaf2ff 0%, #f3ecff 100%);
  border-radius: 20rpx;
  box-shadow: var(--card-shadow);
}

.title-main {
  display: block;
  font-size: 38rpx;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 48rpx;
}

.title-desc {
  display: block;
  margin-top: 16rpx;
  font-size: 26rpx;
  color: var(--text-body);
  line-height: 1.6;
}

.timeline {
  margin: 0 24rpx 24rpx;
  padding: 12rpx 0 8rpx;
}

.timeline-item {
  display: flex;
  align-items: stretch;
}

.timeline-left {
  width: 48rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.timeline-dot {
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  background: #d6dae0;
  margin-top: 28rpx;
  border: 4rpx solid #fff;
  box-shadow: 0 0 0 2rpx #d6dae0;
}

.timeline-dot.first {
  background: var(--brand-orange);
  box-shadow: 0 0 0 2rpx var(--brand-orange);
}

.timeline-line {
  flex: 1;
  width: 2rpx;
  background: #e3e6ea;
  margin: 4rpx 0;
}

.timeline-card {
  flex: 1;
  margin: 12rpx 0 24rpx 20rpx;
  padding: 24rpx 28rpx;
  background: var(--surface-card);
  border-radius: 16rpx;
  box-shadow: var(--card-shadow);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.timeline-date {
  font-size: 30rpx;
  font-weight: 800;
  color: var(--brand-orange);
  margin-right: 20rpx;
}

.timeline-action {
  flex: 1;
  font-size: 28rpx;
  color: var(--text-primary);
  font-weight: 500;
}

.timeline-count {
  font-size: 24rpx;
  color: var(--text-secondary);
}
</style>

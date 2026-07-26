<template>
  <view class="page">
    <view class="status-spacer" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="nav-bar">
      <view class="nav-back" @tap="goBack">‹</view>
      <text class="nav-title">创作者中心</text>
      <view class="nav-right" @tap="onMore">⋯</view>
    </view>

    <view class="content">
      <view class="profile-card">
        <view class="avatar">用</view>
        <view class="profile-info">
          <text class="profile-name">用户495</text>
          <text class="profile-sub">Lv.3 · 见习创作者</text>
        </view>
      </view>

      <view class="metric-grid">
        <view v-for="m in metrics" :key="m.key" class="metric-item">
          <text class="metric-value">{{ m.value }}</text>
          <text class="metric-label">{{ m.label }}</text>
        </view>
      </view>

      <view class="section-title">激励任务</view>
      <view class="task-card">
        <view v-for="(task, i) in tasks" :key="task.key" class="task-row" :class="{ last: i === tasks.length - 1 }">
          <view class="task-left">
            <text class="task-name">{{ task.name }}</text>
            <text class="task-sub">{{ task.sub }}</text>
          </view>
          <view class="task-action" :class="task.status" @tap="onTask(task)">{{ task.action }}</view>
        </view>
      </view>

      <view class="section-title">收益入口</view>
      <view class="income-card">
        <view class="income-icon">
          <text class="income-icon-text">¥</text>
        </view>
        <view class="income-body">
          <text class="income-title">创作者成长权益</text>
          <text class="income-desc">创作者可通过服务预约、频道运营、内容推广和地图共创积分获得成长权益。</text>
        </view>
        <text class="income-arrow">›</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const statusBarHeight = ref(20)
const metrics = [
  { key: 'exposure', label: '内容曝光', value: '12.8k' },
  { key: 'interact', label: '互动', value: '426' },
  { key: 'point', label: '积分', value: '86' }
]
const tasks = [
  { key: 'wiki', name: '补充地点Wiki', sub: '+20积分', action: '去完成', status: 'todo' },
  { key: 'track', name: '发布轨迹内容', sub: '+50积分', action: '去完成', status: 'todo' },
  { key: 'top', name: '频道内容置顶', sub: '待审核', action: '查看', status: 'pending' }
]

onMounted(() => {
  try {
    const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
    statusBarHeight.value = info.statusBarHeight || 20
  } catch (e) {}
})

const goBack = () => uni.navigateBack()
const onMore = () => uni.showToast({ title: '更多', icon: 'none' })
const onTask = (task) => uni.showToast({ title: task.name, icon: 'none' })
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f7f7f8;
}

.status-spacer {
  background: #ffffff;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: 0 24rpx;
  background: #ffffff;
  border-bottom: 1rpx solid #f0f1f3;
}

.nav-back,
.nav-right {
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

.nav-right {
  font-size: 36rpx;
  line-height: 36rpx;
}

.nav-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #222;
}

.content {
  padding: 24rpx 24rpx 48rpx;
}

.profile-card {
  display: flex;
  align-items: center;
  padding: 28rpx 24rpx;
  border-radius: 14rpx;
  background: linear-gradient(135deg, #248cf5 0%, #7650c8 100%);
  box-shadow: 0 1px 8px rgba(18, 24, 38, 0.06);
}

.avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
  font-size: 36rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-info {
  margin-left: 24rpx;
}

.profile-name {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: #ffffff;
}

.profile-sub {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

.metric-grid {
  margin-top: 20rpx;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  background: #ffffff;
  border-radius: 14rpx;
  box-shadow: 0 1px 8px rgba(18, 24, 38, 0.06);
  overflow: hidden;
}

.metric-item {
  padding: 28rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-right: 1rpx solid #f0f1f3;
}

.metric-item:last-child {
  border-right: 0;
}

.metric-value {
  font-size: 38rpx;
  font-weight: 800;
  color: #222;
}

.metric-label {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #8a8f98;
}

.section-title {
  display: block;
  margin: 36rpx 8rpx 16rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: #222;
}

.task-card {
  background: #ffffff;
  border-radius: 14rpx;
  box-shadow: 0 1px 8px rgba(18, 24, 38, 0.06);
  padding: 0 24rpx;
}

.task-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 0;
  border-bottom: 1rpx solid #f0f1f3;
}

.task-row.last {
  border-bottom: 0;
}

.task-left {
  display: flex;
  flex-direction: column;
}

.task-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #222;
}

.task-sub {
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #ff7043;
}

.task-action {
  padding: 10rpx 24rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  font-weight: 600;
}

.task-action.todo {
  color: #ffffff;
  background: linear-gradient(135deg, #ff8a4a 0%, #ff5b35 100%);
}

.task-action.pending {
  color: #5f646d;
  background: #f0f1f3;
}

.income-card {
  display: flex;
  align-items: center;
  padding: 28rpx 24rpx;
  border-radius: 14rpx;
  background: #ffffff;
  box-shadow: 0 1px 8px rgba(18, 24, 38, 0.06);
}

.income-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 20rpx;
  background: rgba(36, 208, 108, 0.12);
  color: #24d06c;
  display: flex;
  align-items: center;
  justify-content: center;
}

.income-icon-text {
  font-size: 36rpx;
  font-weight: 800;
}

.income-body {
  flex: 1;
  margin-left: 20rpx;
}

.income-title {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #222;
}

.income-desc {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #8a8f98;
  line-height: 1.6;
}

.income-arrow {
  font-size: 36rpx;
  color: #8a8f98;
}
</style>

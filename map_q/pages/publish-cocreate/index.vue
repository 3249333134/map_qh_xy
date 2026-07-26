<template>
  <view class="page">
    <view class="status-spacer" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="nav-bar">
      <view class="nav-back" @tap="goBack">‹</view>
      <text class="nav-title">地图共创</text>
      <view class="nav-right cta" @tap="onSubmit">提交</view>
    </view>

    <view class="content">
      <view class="note-card">
        <view class="note-tag">修建新锚点</view>
        <text class="note-title">把普通定位点升级为内容锚点 / 频道锚点</text>
        <text class="note-desc">提交后进入自动审核与人工审核队列。通过后该锚点将出现在地图上，并支持频道挂载与内容聚合。</text>
      </view>

      <view class="section-title">锚点信息</view>
      <view class="info-card">
        <view v-for="(r, i) in infoList" :key="r.key" class="info-row" :class="{ last: i === infoList.length - 1 }">
          <text class="info-label">{{ r.label }}</text>
          <view class="info-right">
            <text class="info-value">{{ r.value }}</text>
            <text v-if="r.arrow" class="info-arrow">›</text>
          </view>
        </view>
      </view>

      <view class="section-title">审核状态</view>
      <view class="status-card">
        <view v-for="(s, i) in statusFlow" :key="s.key" class="status-item">
          <view class="status-rail">
            <view class="status-dot" :class="s.state"></view>
            <view v-if="i !== statusFlow.length - 1" class="status-line" :class="{ done: s.state === 'done' }"></view>
          </view>
          <view class="status-body">
            <view class="status-head">
              <text class="status-name">{{ s.name }}</text>
              <text class="status-state" :class="s.state">{{ s.stateText }}</text>
            </view>
            <text class="status-desc">{{ s.desc }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const statusBarHeight = ref(20)
const infoList = [
  { key: 'name', label: '锚点名称', value: '天台观景点', arrow: true },
  { key: 'type', label: '锚点类型', value: '互动地标', arrow: true },
  { key: 'pos', label: '坐标位置', value: '已绑定', arrow: true },
  { key: 'collab', label: '协作者', value: '3人', arrow: true }
]
const statusFlow = [
  { key: 'ai', name: 'AI审核', state: 'done', stateText: '已通过', desc: '图片通过：未发现违规内容。' },
  { key: 'community', name: '社区审核', state: 'doing', stateText: '进行中', desc: '2/3 点赞，还需 1 人确认。' },
  { key: 'platform', name: '平台审核', state: 'todo', stateText: '等待确认', desc: '社区通过后进入平台终审。' }
]

onMounted(() => {
  try {
    const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
    statusBarHeight.value = info.statusBarHeight || 20
  } catch (e) {}
})

const goBack = () => uni.navigateBack()
const onSubmit = () => {
  uni.showToast({ title: '已提交审核', icon: 'success' })
  setTimeout(goBack, 800)
}
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
  padding: 0 36rpx;
  height: 56rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #ff8a4a 0%, #ff5b35 100%);
  color: #ffffff;
  font-size: 26rpx;
  font-weight: 700;
}

.content {
  padding: 24rpx;
}

.note-card {
  padding: 28rpx 24rpx;
  border-radius: 14rpx;
  background: rgba(118, 80, 200, 0.1);
}

.note-tag {
  display: inline-block;
  padding: 6rpx 18rpx;
  border-radius: 999rpx;
  background: #7650c8;
  color: #ffffff;
  font-size: 22rpx;
  font-weight: 600;
}

.note-title {
  display: block;
  margin-top: 16rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: #222;
}

.note-desc {
  display: block;
  margin-top: 10rpx;
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

.info-card {
  background: #ffffff;
  border-radius: 14rpx;
  box-shadow: 0 1px 8px rgba(18, 24, 38, 0.06);
  padding: 0 24rpx;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 0;
  border-bottom: 1rpx solid #f0f1f3;
}

.info-row.last {
  border-bottom: 0;
}

.info-label {
  font-size: 28rpx;
  color: #5f646d;
}

.info-right {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.info-value {
  font-size: 28rpx;
  font-weight: 600;
  color: #222;
}

.info-arrow {
  font-size: 32rpx;
  color: #8a8f98;
}

.status-card {
  background: #ffffff;
  border-radius: 14rpx;
  box-shadow: 0 1px 8px rgba(18, 24, 38, 0.06);
  padding: 24rpx;
}

.status-item {
  display: flex;
}

.status-rail {
  width: 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.status-dot {
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  margin-top: 8rpx;
  border: 6rpx solid #ffffff;
  box-shadow: 0 0 0 2rpx #f0f1f3;
}

.status-dot.done {
  background: #24d06c;
}

.status-dot.doing {
  background: #ff7043;
  box-shadow: 0 0 0 2rpx #ff7043;
}

.status-dot.todo {
  background: #ffffff;
  border: 6rpx solid #ffffff;
  box-shadow: 0 0 0 2rpx #d0d3d9;
}

.status-line {
  flex: 1;
  width: 4rpx;
  background: #f0f1f3;
  margin: 8rpx 0;
}

.status-line.done {
  background: #24d06c;
}

.status-body {
  flex: 1;
  margin-left: 16rpx;
  padding-bottom: 24rpx;
}

.status-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.status-name {
  font-size: 28rpx;
  font-weight: 700;
  color: #222;
}

.status-state {
  padding: 4rpx 14rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 600;
}

.status-state.done {
  background: rgba(36, 208, 108, 0.12);
  color: #24d06c;
}

.status-state.doing {
  background: rgba(255, 112, 67, 0.12);
  color: #ff7043;
}

.status-state.todo {
  background: #f0f1f3;
  color: #8a8f98;
}

.status-desc {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #5f646d;
  line-height: 1.6;
}
</style>

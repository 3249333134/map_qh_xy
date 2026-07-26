<template>
  <view class="page">
    <view class="status-spacer" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="nav-bar">
      <view class="nav-back" @tap="goBack">‹</view>
      <text class="nav-title">选择IP</text>
      <view class="nav-right cta" @tap="onDone">完成</view>
    </view>

    <view class="content">
      <view class="section-title">我的 IP</view>
      <view class="list-card">
        <view
          v-for="(r, i) in ipList"
          :key="r.key"
          class="ip-row"
          :class="{ last: i === ipList.length - 1 }"
          @tap="onRow(r)"
        >
          <view class="avatar" :style="{ background: r.bg }">{{ r.emoji }}</view>
          <view class="ip-info">
            <text class="ip-name">{{ r.name }}</text>
            <text class="ip-sub">{{ r.sub }}</text>
          </view>
          <view v-if="r.type === 'toggle'" class="toggle" :class="{ active: r.on }" @tap.stop="onToggle(r)">
            <view class="toggle-dot"></view>
          </view>
          <text v-else class="ip-arrow">›</text>
        </view>
      </view>

      <view class="note-card">
        <text class="note-title">IP 系列说明</text>
        <text class="note-desc">同一 IP 下的内容会聚合到系列页，便于粉丝持续追更。默认 IP 将作为新内容的首选归属。</text>
      </view>
    </view>

    <view class="footer-bar">
      <view class="footer-btn" @tap="onCreate">+ 创建新IP</view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const statusBarHeight = ref(20)
const ipList = ref([
  { key: 'monster', name: '治愈系小怪兽', sub: '默认IP · 42条内容', emoji: '怪', bg: 'linear-gradient(135deg, #7650c8 0%, #248cf5 100%)', type: 'toggle', on: true },
  { key: 'watcher', name: '城市观察员', sub: '12条内容', emoji: '观', bg: 'linear-gradient(135deg, #24d06c 0%, #248cf5 100%)', type: 'arrow' }
])

onMounted(() => {
  try {
    const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
    statusBarHeight.value = info.statusBarHeight || 20
  } catch (e) {}
})

const goBack = () => uni.navigateBack()
const onDone = () => {
  uni.showToast({ title: '已选择IP', icon: 'success' })
  setTimeout(goBack, 800)
}
const onRow = (r) => uni.showToast({ title: r.name, icon: 'none' })
const onToggle = (r) => {
  ipList.value.forEach(item => {
    if (item.type === 'toggle') item.on = false
  })
  r.on = true
}
const onCreate = () => uni.showToast({ title: '创建新IP', icon: 'none' })
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f7f7f8;
  padding-bottom: 160rpx;
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
  padding: 16rpx 24rpx 48rpx;
}

.section-title {
  display: block;
  margin: 16rpx 8rpx 16rpx;
  font-size: 26rpx;
  font-weight: 700;
  color: #5f646d;
}

.list-card {
  background: #ffffff;
  border-radius: 14rpx;
  box-shadow: 0 1px 8px rgba(18, 24, 38, 0.06);
  padding: 0 24rpx;
}

.ip-row {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f0f1f3;
}

.ip-row.last {
  border-bottom: 0;
}

.avatar {
  width: 88rpx;
  height: 88rpx;
  border-radius: 24rpx;
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ip-info {
  flex: 1;
  margin-left: 20rpx;
}

.ip-name {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #222;
}

.ip-sub {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #8a8f98;
}

.ip-arrow {
  font-size: 36rpx;
  color: #8a8f98;
}

.toggle {
  width: 80rpx;
  height: 44rpx;
  border-radius: 999rpx;
  background: #e5e7eb;
  position: relative;
  transition: background 0.2s;
  flex-shrink: 0;
}

.toggle.active {
  background: linear-gradient(135deg, #7650c8 0%, #248cf5 100%);
}

.toggle-dot {
  position: absolute;
  top: 4rpx;
  right: 4rpx;
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.15);
  transition: transform 0.2s;
}

.toggle.active .toggle-dot {
  transform: translateX(-36rpx);
}

.note-card {
  margin-top: 24rpx;
  padding: 28rpx 24rpx;
  border-radius: 14rpx;
  background: #f0f1f3;
}

.note-title {
  display: block;
  font-size: 26rpx;
  font-weight: 700;
  color: #5f646d;
}

.note-desc {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #8a8f98;
  line-height: 1.6;
}

.footer-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 16rpx 24rpx calc(env(safe-area-inset-bottom) + 16rpx);
  background: rgba(255, 255, 255, 0.98);
  border-top: 1rpx solid #f0f1f3;
}

.footer-btn {
  height: 92rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #7650c8 0%, #248cf5 100%);
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 700;
}
</style>

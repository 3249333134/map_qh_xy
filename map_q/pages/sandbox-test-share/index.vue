<template>
  <view class="page">
    <view class="status-spacer" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="nav-bar">
      <view class="nav-back" @tap="goBack">‹</view>
      <text class="nav-title">选择好友</text>
      <view class="nav-right cta" @tap="onSend">发送</view>
    </view>

    <view class="search-bar">
      <view class="search-input">
        <text class="search-icon">🔍</text>
        <input
          v-model="keyword"
          class="search-field"
          placeholder="搜索好友或群聊"
        />
      </view>
    </view>

    <view class="content">
      <view class="section-title">最近</view>
      <view class="list-card">
        <view
          v-for="(r, i) in friends"
          :key="r.key"
          class="friend-row"
          :class="{ last: i === friends.length - 1 }"
          @tap="onRow(r)"
        >
          <view class="avatar" :style="{ background: r.bg }">{{ r.emoji }}</view>
          <view class="friend-info">
            <text class="friend-name">{{ r.name }}</text>
            <text class="friend-sub">{{ r.sub }}</text>
          </view>
          <view v-if="r.type === 'toggle'" class="toggle" :class="{ active: r.on }" @tap.stop="onToggle(r)">
            <view class="toggle-dot"></view>
          </view>
          <text v-else class="friend-arrow">›</text>
        </view>
      </view>

      <view class="note-card">
        <text class="note-title">仅指定对象可见</text>
        <text class="note-desc">测试分享仅指定对象可见，不进入公开首页信息流。可随时收回，对方阅读后将保留阅读记录。</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const statusBarHeight = ref(20)
const keyword = ref('')
const friends = ref([
  { key: 'wang', name: '小王', sub: '最近聊天', emoji: '王', bg: 'linear-gradient(135deg, #248cf5 0%, #7650c8 100%)', type: 'toggle', on: true },
  { key: 'food', name: '美食探店群', sub: '群聊 · 免打扰', emoji: '食', bg: 'linear-gradient(135deg, #ff8a4a 0%, #ff5b35 100%)', type: 'arrow' },
  { key: 'event', name: '活动通知群', sub: '群聊', emoji: '活', bg: 'linear-gradient(135deg, #24d06c 0%, #248cf5 100%)', type: 'arrow' }
])

onMounted(() => {
  try {
    const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
    statusBarHeight.value = info.statusBarHeight || 20
  } catch (e) {}
})

const goBack = () => uni.navigateBack()
const onSend = () => {
  uni.showToast({ title: '已发送测试分享', icon: 'success' })
  setTimeout(goBack, 800)
}
const onRow = (r) => uni.showToast({ title: r.name, icon: 'none' })
const onToggle = (r) => { r.on = !r.on }
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

.search-bar {
  padding: 16rpx 24rpx;
  background: #ffffff;
}

.search-input {
  display: flex;
  align-items: center;
  height: 72rpx;
  padding: 0 24rpx;
  border-radius: 999rpx;
  background: #f0f1f3;
}

.search-icon {
  margin-right: 12rpx;
  font-size: 28rpx;
}

.search-field {
  flex: 1;
  font-size: 28rpx;
  color: #222;
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

.friend-row {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f0f1f3;
}

.friend-row.last {
  border-bottom: 0;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  color: #ffffff;
  font-size: 28rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.friend-info {
  flex: 1;
  margin-left: 20rpx;
}

.friend-name {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #222;
}

.friend-sub {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #8a8f98;
}

.friend-arrow {
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
  background: linear-gradient(135deg, #ff8a4a 0%, #ff5b35 100%);
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
</style>

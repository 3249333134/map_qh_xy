<template>
  <view class="page">
    <view class="status-spacer" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="nav-bar">
      <view class="nav-back" @tap="goBack">‹</view>
      <text class="nav-title">设置</text>
      <view class="nav-right"></view>
    </view>

    <scroll-view class="content" scroll-y show-scrollbar="false">
      <!-- 选项列表 -->
      <view class="list-card">
        <view class="list-row" @tap="goProfileEdit">
          <text class="row-label">编辑资料</text>
          <text class="row-arrow">›</text>
        </view>
        <view class="list-row" @tap="onAccount">
          <text class="row-label">账号与安全</text>
          <text class="row-arrow">›</text>
        </view>
        <view class="list-row">
          <view class="row-left">
            <text class="row-label">消息通知</text>
            <text class="row-sub">接收推送与提醒</text>
          </view>
          <view class="toggle" :class="{ on: notifyOn }" @tap="notifyOn = !notifyOn">
            <view class="toggle-knob"></view>
          </view>
        </view>
        <view class="list-row" @tap="onPrivacy">
          <text class="row-label">隐私设置</text>
          <text class="row-arrow">›</text>
        </view>
        <view class="list-row last" @tap="onClearCache">
          <text class="row-label">清理缓存</text>
          <text class="row-value">{{ cacheSize }} MB</text>
        </view>
      </view>

      <!-- 退出登录 -->
      <view class="logout-btn" @tap="onLogout">退出登录</view>
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

const notifyOn = ref(true)
const cacheSize = ref('12.8')

const goProfileEdit = () => uni.navigateTo({ url: '/pages/my-profile-edit/index', fail: () => uni.showToast({ title: '编辑资料', icon: 'none' }) })
const onAccount = () => uni.showToast({ title: '账号与安全', icon: 'none' })
const onPrivacy = () => uni.navigateTo({ url: '/pages/my-privacy/index', fail: () => uni.showToast({ title: '隐私设置', icon: 'none' }) })
const onClearCache = () => {
  cacheSize.value = '0.0'
  uni.showToast({ title: '缓存已清理', icon: 'none' })
}
const onLogout = () => {
  uni.showModal({
    title: '退出登录',
    content: '确认退出当前账号？',
    success: (res) => {
      if (res.confirm) uni.showToast({ title: '已退出', icon: 'none' })
    }
  })
}
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
  width: 56rpx;
}

.content { flex: 1; }

.list-card {
  margin: 24rpx;
  background: var(--surface-card);
  border-radius: 20rpx;
  box-shadow: var(--card-shadow);
  overflow: hidden;
}

.list-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 28rpx;
  border-bottom: 1rpx solid #f4f5f6;
  min-height: 48rpx;
}

.list-row.last { border-bottom: none; }

.row-left {
  display: flex;
  flex-direction: column;
}

.row-label {
  font-size: 30rpx;
  color: var(--text-primary);
  font-weight: 500;
}

.row-sub {
  font-size: 24rpx;
  color: var(--text-secondary);
  margin-top: 6rpx;
}

.row-arrow {
  font-size: 36rpx;
  color: var(--text-secondary);
  line-height: 36rpx;
}

.row-value {
  font-size: 28rpx;
  color: var(--text-secondary);
}

.toggle {
  width: 88rpx;
  height: 52rpx;
  border-radius: 26rpx;
  background: #e4e6e9;
  position: relative;
  transition: background 0.2s;
}

.toggle.on { background: var(--success); }

.toggle-knob {
  position: absolute;
  top: 4rpx;
  left: 4rpx;
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.15);
  transition: transform 0.2s;
}

.toggle.on .toggle-knob { transform: translateX(36rpx); }

.logout-btn {
  margin: 40rpx 24rpx 48rpx;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-card);
  border-radius: 20rpx;
  box-shadow: var(--card-shadow);
  color: #f5333d;
  font-size: 30rpx;
  font-weight: 600;
}
</style>

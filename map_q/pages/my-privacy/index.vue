<template>
  <view class="page">
    <view class="status-spacer" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="nav-bar">
      <view class="nav-back" @tap="goBack">‹</view>
      <text class="nav-title">隐私控制</text>
      <view class="nav-right nav-btn" @tap="onSave">保存</view>
    </view>

    <scroll-view class="content" scroll-y show-scrollbar="false">
      <!-- 隐私选项列表 -->
      <view class="list-card">
        <view class="list-row">
          <view class="row-left">
            <text class="row-label">公开我的足迹地图</text>
            <text class="row-sub">允许别人查看打卡点</text>
          </view>
          <view class="toggle" :class="{ on: mapOpen }" @tap="mapOpen = !mapOpen">
            <view class="toggle-knob"></view>
          </view>
        </view>
        <view class="list-row" @tap="onFollowers">
          <view class="row-left">
            <text class="row-label">公开收藏列表</text>
            <text class="row-sub">仅关注者可见</text>
          </view>
          <view class="row-right-text">关注者<text class="row-arrow">›</text></view>
        </view>
        <view class="list-row">
          <view class="row-left">
            <text class="row-label">服务是否可预约</text>
            <text class="row-sub">关闭后隐藏预约我入口</text>
          </view>
          <view class="toggle" :class="{ on: bookable }" @tap="bookable = !bookable">
            <view class="toggle-knob"></view>
          </view>
        </view>
        <view class="list-row last" @tap="onPrivate">
          <view class="row-left">
            <text class="row-label">频道参与记录</text>
            <text class="row-sub">只自己可见</text>
          </view>
          <view class="row-right-text">私密<text class="row-arrow">›</text></view>
        </view>
      </view>

      <!-- 说明卡片 -->
      <view class="info-card">
        <text class="info-title">字段级权限说明</text>
        <text class="info-desc">DDS要求字段级权限控制：可视范围、是否公开、是否可预约。</text>
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

const mapOpen = ref(true)
const bookable = ref(true)

const onSave = () => uni.showToast({ title: '隐私设置已保存', icon: 'none' })
const onFollowers = () => uni.showToast({ title: '关注者可见范围', icon: 'none' })
const onPrivate = () => uni.showToast({ title: '私密设置', icon: 'none' })
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
  flex: 1;
}

.row-label {
  font-size: 30rpx;
  color: var(--text-primary);
  font-weight: 500;
}

.row-sub {
  font-size: 24rpx;
  color: var(--text-secondary);
  margin-top: 8rpx;
}

.row-right-text {
  display: flex;
  align-items: center;
  font-size: 28rpx;
  color: var(--text-secondary);
}

.row-arrow {
  font-size: 36rpx;
  color: var(--text-secondary);
  line-height: 36rpx;
  margin-left: 8rpx;
}

.toggle {
  width: 88rpx;
  height: 52rpx;
  border-radius: 26rpx;
  background: #e4e6e9;
  position: relative;
  transition: background 0.2s;
  flex-shrink: 0;
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

.info-card {
  margin: 24rpx;
  padding: 28rpx;
  background: var(--surface-card);
  border-radius: 20rpx;
  box-shadow: var(--card-shadow);
}

.info-title {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 12rpx;
}

.info-desc {
  display: block;
  font-size: 26rpx;
  color: var(--text-body);
  line-height: 1.6;
}
</style>

<template>
  <view class="page">
    <view class="status-spacer" :style="{ height: statusBarHeight + 'px' }"></view>

    <view class="success-area">
      <view class="success-mark">✓</view>
      <text class="success-title">发布成功</text>
      <text class="success-desc">内容已进入首页信息流，并可通过地点定位在地图上被发现。</text>

      <view class="success-actions">
        <view class="secondary-btn" @tap="onView">查看内容</view>
        <view class="primary-btn" @tap="onHome">返回首页</view>
      </view>
    </view>
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

const onView = () => uni.navigateTo({ url: '/pages/detail/index', fail: () => uni.switchTab({ url: '/pages/index/index' }) })
const onHome = () => uni.switchTab({ url: '/pages/index/index' })
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f7f7f8;
}

.success-area {
  padding: 200rpx 48rpx 48rpx;
  text-align: center;
}

.success-mark {
  width: 160rpx;
  height: 160rpx;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #24d06c;
  color: #ffffff;
  font-size: 88rpx;
  font-weight: 800;
  box-shadow: 0 16rpx 40rpx rgba(36, 208, 108, 0.32);
}

.success-title {
  display: block;
  margin-top: 40rpx;
  font-size: 44rpx;
  font-weight: 800;
  color: #222;
}

.success-desc {
  display: block;
  margin: 20rpx 32rpx 0;
  font-size: 28rpx;
  color: #5f646d;
  line-height: 1.7;
}

.success-actions {
  margin-top: 72rpx;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24rpx;
}

.secondary-btn,
.primary-btn {
  height: 92rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  font-size: 30rpx;
  font-weight: 700;
}

.secondary-btn {
  color: #5f646d;
  background: #ffffff;
  box-shadow: 0 1px 8px rgba(18, 24, 38, 0.06);
}

.primary-btn {
  color: #ffffff;
  background: linear-gradient(135deg, #ff8a4a 0%, #ff5b35 100%);
  box-shadow: 0 8rpx 24rpx rgba(255, 91, 53, 0.32);
}
</style>

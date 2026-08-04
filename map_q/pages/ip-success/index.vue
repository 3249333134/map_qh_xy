<template>
  <view class="page">
    <view class="status-spacer" :style="{ height: statusBarHeight + 'px' }"></view>

    <view class="success-area">
      <view class="success-mark">✓</view>
      <text class="success-title">IP内容已发布</text>
      <text class="success-desc">内容将进入IP系列页，同时可在首页信息流展示。</text>

      <view class="success-actions">
        <view class="secondary-btn" @tap="onView">查看IP</view>
        <view class="primary-btn" @tap="onContinue">继续创作</view>
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

const onView = () => uni.navigateTo({ url: '/pages/detail/index', fail: () => uni.switchTab({ url: '/pages/index/index' }) }
)
const onContinue = () => uni.redirectTo({ url: '/pages/publish-type/index' })
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
  background: linear-gradient(135deg, var(--color-info) 0%, var(--color-info) 100%);
  color: #fff;
  font-size: 88rpx;
  font-weight: 800;
  box-shadow: 0 16rpx 40rpx rgba(118, 80, 200, 0.32);
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
  background: #fff;
  box-shadow: 0 1px 8px rgba(18, 24, 38, 0.06);
}

.primary-btn {
  color: #fff;
  background: linear-gradient(135deg, var(--color-info) 0%, var(--color-info) 100%);
  box-shadow: 0 8rpx 24rpx rgba(118, 80, 200, 0.32);
}
</style>

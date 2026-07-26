<template>
  <view class="page">
    <view class="status-spacer" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="nav-bar">
      <view class="nav-back" @tap="goBack">‹</view>
      <text class="nav-title">授权方式</text>
      <view class="nav-right cta" @tap="onSave">保存</view>
    </view>

    <view class="content">
      <view class="section-title">授权选项</view>
      <view class="list-card">
        <view
          v-for="(r, i) in authOptions"
          :key="r.key"
          class="auth-row"
          :class="{ last: i === authOptions.length - 1 }"
          @tap="onRow(r)"
        >
          <view class="auth-left">
            <text class="auth-name">{{ r.name }}</text>
            <text class="auth-sub">{{ r.sub }}</text>
          </view>
          <view v-if="r.type === 'toggle'" class="toggle" :class="{ active: r.on }" @tap.stop="onToggle(r)">
            <view class="toggle-dot"></view>
          </view>
          <text v-else class="auth-arrow">›</text>
        </view>
      </view>

      <view class="copyright-card">
        <view class="copyright-icon">©</view>
        <view class="copyright-body">
          <text class="copyright-title">版权保护标识</text>
          <text class="copyright-desc">开启后，IP内容详情页和分享页会显示版权保护标识。</text>
        </view>
        <view class="toggle" :class="{ active: hasCopyright }" @tap="hasCopyright = !hasCopyright">
          <view class="toggle-dot"></view>
        </view>
      </view>

      <view class="note-card">
        <text class="note-title">授权说明</text>
        <text class="note-desc">授权设置将同步至所有系列内容。商业授权需在内容发布后单独联系平台完成签约登记。</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const statusBarHeight = ref(20)
const hasCopyright = ref(true)
const authOptions = ref([
  { key: 'forbid', name: '禁止转载', sub: '仅平台内浏览', type: 'toggle', on: true },
  { key: 'sign', name: '署名转载', sub: '允许转发但需署名', type: 'arrow' },
  { key: 'commercial', name: '商业授权', sub: '需联系作者授权', type: 'arrow' }
])

onMounted(() => {
  try {
    const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
    statusBarHeight.value = info.statusBarHeight || 20
  } catch (e) {}
})

const goBack = () => uni.navigateBack()
const onSave = () => {
  uni.showToast({ title: '已保存授权设置', icon: 'success' })
  setTimeout(goBack, 800)
}
const onRow = (r) => uni.showToast({ title: r.name, icon: 'none' })
const onToggle = (r) => {
  authOptions.value.forEach(item => {
    if (item.type === 'toggle') item.on = false
  })
  r.on = true
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

.auth-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 0;
  border-bottom: 1rpx solid #f0f1f3;
}

.auth-row.last {
  border-bottom: 0;
}

.auth-left {
  display: flex;
  flex-direction: column;
}

.auth-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #222;
}

.auth-sub {
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #8a8f98;
}

.auth-arrow {
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

.copyright-card {
  margin-top: 24rpx;
  display: flex;
  align-items: center;
  padding: 28rpx 24rpx;
  border-radius: 14rpx;
  background: rgba(118, 80, 200, 0.08);
}

.copyright-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 18rpx;
  background: linear-gradient(135deg, #7650c8 0%, #248cf5 100%);
  color: #ffffff;
  font-size: 36rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.copyright-body {
  flex: 1;
  margin-left: 20rpx;
}

.copyright-title {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #222;
}

.copyright-desc {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #5f646d;
  line-height: 1.6;
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

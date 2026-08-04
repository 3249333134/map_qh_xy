<template>
  <view class="page">
    <view class="status-spacer" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="nav-bar">
      <view class="nav-back" @tap="goBack">‹</view>
      <text class="nav-title">足迹数据</text>
      <view class="nav-right" @tap="onExport">导</view>
    </view>

    <scroll-view class="content" scroll-y show-scrollbar="false">
      <!-- 雷达可视化区域 -->
      <view class="radar-card">
        <view class="radar">
          <view class="radar-ring r1"></view>
          <view class="radar-ring r2"></view>
          <view class="radar-ring r3"></view>
          <view class="radar-cross-h"></view>
          <view class="radar-cross-v"></view>
          <view class="radar-sweep"></view>
          <view class="radar-dot d1"></view>
          <view class="radar-dot d2"></view>
          <view class="radar-dot d3"></view>
          <view class="radar-dot d4"></view>
          <view class="radar-dot d5"></view>
          <view class="radar-center"></view>
        </view>
        <text class="radar-label">活跃足迹分布</text>
      </view>

      <!-- 数据指标网格 -->
      <view class="stats-card">
        <view class="stats-grid">
          <view class="stat-cell">
            <text class="stat-num">128</text>
            <text class="stat-label">打卡点</text>
          </view>
          <view class="stat-divider"></view>
          <view class="stat-cell">
            <text class="stat-num">32</text>
            <text class="stat-label">动态</text>
          </view>
          <view class="stat-divider"></view>
          <view class="stat-cell">
            <text class="stat-num">9</text>
            <text class="stat-label">频道</text>
          </view>
        </view>
      </view>

      <!-- 行为统计卡片 -->
      <view class="behavior-card">
        <text class="section-title">行为统计</text>
        <view class="behavior-grid">
          <view class="behavior-cell">
            <view class="behavior-icon icon-purple">藏</view>
            <text class="behavior-num">256</text>
            <text class="behavior-label">收藏</text>
          </view>
          <view class="behavior-cell">
            <view class="behavior-icon icon-blue">览</view>
            <text class="behavior-num">5805</text>
            <text class="behavior-label">浏览</text>
          </view>
          <view class="behavior-cell">
            <view class="behavior-icon icon-orange">动</view>
            <text class="behavior-num">489</text>
            <text class="behavior-label">互动</text>
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
const onExport = () => uni.showToast({ title: '导出足迹数据', icon: 'none' })
</script>

<style scoped>
.page {
  --brand-blue: var(--color-info);
  --brand-orange: var(--color-primary);
  --brand-purple: var(--color-info);
  --success: #24d06c;
  --text-primary: #222;
  --text-body: #5f646d;
  --text-secondary: #8a8f98;
  --surface-app: #f7f7f8;
  --surface-card: #fff;
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
  border-bottom: 1rpx solid #f1f5f9;
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
  text-align: center;
  font-size: 30rpx;
  color: var(--brand-orange);
  line-height: 56rpx;
  font-weight: 600;
}

.content { flex: 1; }

.radar-card {
  margin: 24rpx;
  padding: 36rpx 24rpx 28rpx;
  background: var(--surface-card);
  border-radius: 20rpx;
  box-shadow: var(--card-shadow);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.radar {
  width: 420rpx;
  height: 420rpx;
  position: relative;
  border-radius: 50%;
  background: radial-gradient(circle,#eaf6ff,#f7fbff 70%,#fff);
  overflow: hidden;
}

.radar-ring {
  position: absolute;
  border-radius: 50%;
  border: 1rpx solid rgba(36, 140, 245, 0.18);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.radar-ring.r1 { width: 140rpx; height: 140rpx; }
.radar-ring.r2 { width: 280rpx; height: 280rpx; }
.radar-ring.r3 { width: 420rpx; height: 420rpx; }

.radar-cross-h,
.radar-cross-v {
  position: absolute;
  background: rgba(36, 140, 245, 0.12);
  top: 50%;
  left: 50%;
}

.radar-cross-h {
  width: 420rpx;
  height: 1rpx;
  transform: translate(-50%, -50%);
}

.radar-cross-v {
  width: 1rpx;
  height: 420rpx;
  transform: translate(-50%, -50%);
}

.radar-sweep {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 210rpx;
  height: 210rpx;
  transform-origin: 0 0;
  background: conic-gradient(from 0deg, rgba(36, 140, 245, 0.28) 0deg, rgba(36, 140, 245, 0) 60deg);
  border-radius: 0 210rpx 0 0;
  animation: sweep 4s linear infinite;
}

@keyframes sweep {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.radar-dot {
  position: absolute;
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  background: var(--brand-blue);
  box-shadow: 0 0 12rpx rgba(36, 140, 245, 0.6);
}

.radar-dot.d1 { top: 30%; left: 62%; background: var(--brand-orange); }
.radar-dot.d2 { top: 55%; left: 28%; background: var(--brand-purple); }
.radar-dot.d3 { top: 70%; left: 60%; background: var(--success); }
.radar-dot.d4 { top: 22%; left: 40%; background: var(--brand-blue); }
.radar-dot.d5 { top: 48%; left: 70%; background: var(--brand-orange); }

.radar-center {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  background: var(--brand-blue);
  transform: translate(-50%, -50%);
  box-shadow: 0 0 16rpx rgba(36, 140, 245, 0.8);
}

.radar-label {
  margin-top: 24rpx;
  font-size: 26rpx;
  color: var(--text-secondary);
}

.stats-card {
  margin: 0 24rpx;
  padding: 32rpx 0;
  background: var(--surface-card);
  border-radius: 20rpx;
  box-shadow: var(--card-shadow);
}

.stats-grid {
  display: flex;
  align-items: center;
}

.stat-cell {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-num {
  font-size: 44rpx;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 56rpx;
}

.stat-label {
  font-size: 24rpx;
  color: var(--text-secondary);
  margin-top: 8rpx;
}

.stat-divider {
  width: 1rpx;
  height: 56rpx;
  background: #eef0f2;
}

.behavior-card {
  margin: 24rpx;
  padding: 28rpx;
  background: var(--surface-card);
  border-radius: 20rpx;
  box-shadow: var(--card-shadow);
}

.section-title {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 24rpx;
}

.behavior-grid {
  display: flex;
  justify-content: space-between;
}

.behavior-cell {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.behavior-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 28rpx;
  font-weight: 700;
  margin-bottom: 16rpx;
}

.icon-purple { background: var(--brand-purple); }
.icon-blue { background: var(--brand-blue); }

.behavior-num {
  font-size: 36rpx;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 44rpx;
}

.behavior-label {
  font-size: 24rpx;
  color: var(--text-secondary);
  margin-top: 6rpx;
}
</style>

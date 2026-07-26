<template>
  <view class="page">
    <view class="status-spacer" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="nav-bar">
      <view class="nav-back" @tap="goBack">‹</view>
      <text class="nav-title">服务类型</text>
      <view class="nav-right" @tap="onFilter">筛</view>
    </view>

    <scroll-view class="content" scroll-y show-scrollbar="false">
      <!-- 说明卡片 -->
      <view class="intro-card">
        <text class="intro-title">三类服务卡</text>
        <text class="intro-desc">来自策划书：个人兴趣服务、商家场景服务、活动协作服务。三类都与地图锚点绑定，并可进入频道或预约闭环。</text>
      </view>

      <!-- 服务类型网格 -->
      <view class="type-grid">
        <view class="type-card" v-for="t in types" :key="t.name" @tap="onTypeTap(t)">
          <view class="type-icon" :style="{ background: t.color }">{{ t.char }}</view>
          <text class="type-name">{{ t.name }}</text>
          <text class="type-desc">{{ t.desc }}</text>
        </view>
      </view>

      <!-- 解锁机制卡片 -->
      <view class="unlock-card">
        <text class="section-title">解锁机制</text>
        <view class="unlock-row">
          <view class="unlock-dot dot-gold"></view>
          <view class="unlock-text">
            <text class="unlock-name">个人服务</text>
            <text class="unlock-action">→ 加入私信频道</text>
          </view>
        </view>
        <view class="unlock-row">
          <view class="unlock-dot dot-blue"></view>
          <view class="unlock-text">
            <text class="unlock-name">商家服务</text>
            <text class="unlock-action">→ 关注商家频道</text>
          </view>
        </view>
        <view class="unlock-row last">
          <view class="unlock-dot dot-orange"></view>
          <view class="unlock-text">
            <text class="unlock-name">活动服务</text>
            <text class="unlock-action">→ 加入活动频道</text>
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
const onFilter = () => uni.showToast({ title: '筛选服务类型', icon: 'none' })

const types = ref([
  { name: '个人兴趣服务', char: '技', color: '#f6b33b', desc: '1v1定制/作品展示' },
  { name: '商家场景服务', char: '店', color: '#248cf5', desc: '预约/会员/优惠' },
  { name: '活动协作服务', char: '组', color: '#ff7043', desc: '组队/行前资料' },
  { name: '服务频道', char: '频', color: '#24d06c', desc: '售后/评价/通知' }
])

const onTypeTap = (t) => uni.showToast({ title: t.name, icon: 'none' })
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
  text-align: center;
  font-size: 30rpx;
  color: var(--brand-orange);
  line-height: 56rpx;
  font-weight: 600;
}

.content { flex: 1; }

.intro-card {
  margin: 24rpx;
  padding: 32rpx 28rpx;
  background: linear-gradient(135deg, #fff5e8 0%, #eaf2ff 100%);
  border-radius: 20rpx;
  box-shadow: var(--card-shadow);
}

.intro-title {
  display: block;
  font-size: 34rpx;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 44rpx;
}

.intro-desc {
  display: block;
  margin-top: 16rpx;
  font-size: 26rpx;
  color: var(--text-body);
  line-height: 1.6;
}

.type-grid {
  margin: 0 24rpx;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}

.type-card {
  padding: 32rpx 24rpx;
  background: var(--surface-card);
  border-radius: 20rpx;
  box-shadow: var(--card-shadow);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.type-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 32rpx;
  font-weight: 700;
  margin-bottom: 20rpx;
}

.type-name {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--text-primary);
}

.type-desc {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: var(--text-secondary);
}

.unlock-card {
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

.unlock-row {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f4f5f6;
}

.unlock-row.last { border-bottom: none; }

.unlock-dot {
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.dot-gold { background: #f6b33b; }
.dot-blue { background: var(--brand-blue); }
.dot-orange { background: var(--brand-orange); }

.unlock-text {
  display: flex;
  align-items: center;
  flex: 1;
}

.unlock-name {
  font-size: 28rpx;
  color: var(--text-primary);
  font-weight: 500;
  margin-right: 16rpx;
}

.unlock-action {
  font-size: 26rpx;
  color: var(--text-secondary);
}
</style>

<template>
  <view class="page">
    <view class="status-spacer" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="nav-bar">
      <view class="nav-back" @tap="goBack">‹</view>
      <text class="nav-title">我的服务</text>
      <view class="nav-right" @tap="onAdd">＋</view>
    </view>

    <scroll-view class="content" scroll-y show-scrollbar="false">
      <!-- 数据指标网格 -->
      <view class="stats-card">
        <view class="stats-grid">
          <view class="stat-cell">
            <text class="stat-num">6</text>
            <text class="stat-label">服务项目</text>
          </view>
          <view class="stat-divider"></view>
          <view class="stat-cell">
            <text class="stat-num">18</text>
            <text class="stat-label">预约</text>
          </view>
          <view class="stat-divider"></view>
          <view class="stat-cell">
            <text class="stat-num">4.9</text>
            <text class="stat-label">评价</text>
          </view>
        </view>
      </view>

      <!-- 服务列表 -->
      <view class="service-card">
        <view class="service-row">
          <view class="service-info">
            <view class="service-icon icon-blue">摄</view>
            <view class="service-text">
              <text class="service-name">摄影跟拍</text>
              <text class="service-tag">个人兴趣服务·可预约</text>
            </view>
          </view>
          <view class="service-action" @tap="onManage">管理</view>
        </view>
        <view class="service-row">
          <view class="service-info">
            <view class="service-icon icon-orange">路</view>
            <view class="service-text">
              <text class="service-name">路线策划</text>
              <text class="service-tag tag-audit">活动协作服务·审核中</text>
            </view>
          </view>
          <view class="service-action" @tap="onEdit">编辑</view>
        </view>
        <view class="service-row last">
          <view class="service-info">
            <view class="service-icon icon-green">频</view>
            <view class="service-text">
              <text class="service-name">服务频道</text>
              <text class="service-tag">售后/评价/私信</text>
            </view>
          </view>
          <view class="service-action" @tap="onEnter">进入</view>
        </view>
      </view>

      <!-- 底部说明卡片 -->
      <view class="info-card">
        <text class="info-title">服务说明</text>
        <text class="info-desc">所有服务均与地图锚点绑定，可进入对应频道或预约闭环。审核中的服务在通过前不会展示给其他用户。</text>
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

const onAdd = () => uni.showToast({ title: '新增服务', icon: 'none' })
const onManage = () => uni.showToast({ title: '管理服务', icon: 'none' })
const onEdit = () => uni.showToast({ title: '编辑服务', icon: 'none' })
const onEnter = () => uni.showToast({ title: '进入频道', icon: 'none' })
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
  font-size: 40rpx;
  color: var(--brand-orange);
  line-height: 56rpx;
}

.content { flex: 1; }

.stats-card {
  margin: 24rpx 24rpx 0;
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

.service-card {
  margin: 24rpx;
  background: var(--surface-card);
  border-radius: 20rpx;
  box-shadow: var(--card-shadow);
  overflow: hidden;
}

.service-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx;
  border-bottom: 1rpx solid #f4f5f6;
}

.service-row.last { border-bottom: none; }

.service-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.service-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 32rpx;
  font-weight: 700;
  margin-right: 20rpx;
}

.icon-blue { background: var(--brand-blue); }
.icon-orange { background: var(--brand-orange); }
.icon-green { background: var(--success); }

.service-text { display: flex; flex-direction: column; }

.service-name {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--text-primary);
}

.service-tag {
  font-size: 24rpx;
  color: var(--text-secondary);
  margin-top: 8rpx;
}

.service-tag.tag-audit { color: var(--brand-orange); }

.service-action {
  padding: 12rpx 28rpx;
  border-radius: 28rpx;
  background: var(--surface-muted);
  color: var(--text-body);
  font-size: 26rpx;
}

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

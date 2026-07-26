<template>
  <view class="profile-page">
    <view class="status-spacer" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="nav-bar">
      <view class="nav-back" @tap="goBack">‹</view>
      <text class="nav-title">联系人资料</text>
      <view class="nav-right" @tap="openMore">⋯</view>
    </view>

    <scroll-view class="profile-scroll" scroll-y show-scrollbar="false">
      <!-- 头部英雄区 -->
      <view class="hero">
        <view class="hero-bg"></view>
        <view class="hero-deco deco-1"></view>
        <view class="hero-deco deco-2"></view>

        <view class="hero-inner">
          <view class="hero-avatar">
            <text class="avatar-text">{{ profile.avatar }}</text>
            <view class="avatar-ring"></view>
          </view>
          <text class="hero-name">{{ profile.name }}</text>
          <text class="hero-desc">{{ profile.desc }}</text>

          <view class="hero-tags">
            <view class="hero-tag">
              <text class="hero-tag-text">城市漫游</text>
            </view>
            <view class="hero-tag">
              <text class="hero-tag-text">摄影</text>
            </view>
            <view class="hero-tag">
              <text class="hero-tag-text">徒步</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 信息卡片 -->
      <view class="info-card">
        <view class="info-row" @tap="openSource">
          <view class="info-icon icon-blue">
            <text class="info-icon-text">源</text>
          </view>
          <view class="info-main">
            <text class="info-label">来源</text>
            <text class="info-value">{{ profile.source }}</text>
          </view>
          <text class="info-arrow">›</text>
        </view>

        <view class="info-divider"></view>

        <view class="info-row" @tap="openActivities">
          <view class="info-icon icon-orange">
            <text class="info-icon-text">动</text>
          </view>
          <view class="info-main">
            <text class="info-label">共同活动</text>
            <text class="info-value">{{ profile.activities }}</text>
          </view>
          <text class="info-arrow">›</text>
        </view>

        <view class="info-divider"></view>

        <view class="info-row" @tap="editRemark">
          <view class="info-icon icon-purple">
            <text class="info-icon-text">注</text>
          </view>
          <view class="info-main">
            <text class="info-label">备注</text>
            <text class="info-value muted">{{ profile.remark }}</text>
          </view>
          <text class="info-arrow">›</text>
        </view>
      </view>

      <!-- 共同频道 -->
      <view class="shared-card">
        <view class="shared-head">
          <text class="shared-title">共同频道</text>
          <text class="shared-count">{{ sharedChannels.length }}</text>
        </view>
        <view class="shared-list">
          <view
            v-for="ch in sharedChannels"
            :key="ch.id"
            class="shared-item"
          >
            <view class="shared-avatar" :class="ch.color">
              <text class="shared-avatar-text">{{ ch.short }}</text>
            </view>
            <text class="shared-name">{{ ch.name }}</text>
          </view>
        </view>
      </view>

      <view class="scroll-tail"></view>
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view class="bottom-actions">
      <view class="bottom-btn follow-btn" :class="{ following: isFollowing }" @tap="toggleFollow">
        <text class="follow-text">{{ isFollowing ? '已关注' : '设为关注' }}</text>
      </view>
      <view class="bottom-btn message-btn" @tap="sendMessage">
        <text class="message-text">发消息</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const statusBarHeight = ref(20)
const isFollowing = ref(false)

const profile = ref({
  avatar: '王',
  name: '小王',
  desc: '城市漫游爱好者',
  source: '频道与朋友',
  activities: '3 个共同活动',
  remark: '未设置'
})

const sharedChannels = ref([
  { id: 'c1', short: '春', name: '春熙路频道', color: 'orange' },
  { id: 'c2', short: '夜', name: '夜景摄影', color: 'purple' },
  { id: 'c3', short: '徒', name: '城市徒步', color: 'blue' }
])

onMounted(() => {
  try {
    const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
    statusBarHeight.value = info.statusBarHeight || 20
  } catch (e) {}
})

const goBack = () => uni.navigateBack()

const openMore = () => {
  uni.showActionSheet({
    itemList: ['设为星标', '屏蔽消息', '举报'],
    success: () => {}
  })
}

const openSource = () => {
  uni.showToast({ title: '查看来源', icon: 'none' })
}

const openActivities = () => {
  uni.showToast({ title: '查看共同活动', icon: 'none' })
}

const editRemark = () => {
  uni.showToast({ title: '编辑备注', icon: 'none' })
}

const toggleFollow = () => {
  isFollowing.value = !isFollowing.value
  uni.showToast({
    title: isFollowing.value ? '已关注' : '已取消关注',
    icon: 'none'
  })
}

const sendMessage = () => {
  uni.showToast({ title: '打开会话', icon: 'none' })
}
</script>

<style scoped>
.profile-page {
  height: 100vh;
  background: #f7f7f8;
  display: flex;
  flex-direction: column;
}

.status-spacer {
  background: transparent;
}

.nav-bar {
  position: relative;
  z-index: 10;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
}
.nav-back {
  position: absolute;
  left: 24rpx;
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 52rpx;
  color: #ffffff;
  font-weight: 300;
  line-height: 1;
}
.nav-title {
  font-size: 34rpx;
  font-weight: 800;
  color: #ffffff;
}
.nav-right {
  position: absolute;
  right: 28rpx;
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44rpx;
  color: #ffffff;
  line-height: 1;
}

.profile-scroll {
  flex: 1;
}

/* 头部英雄区 */
.hero {
  position: relative;
  height: 620rpx;
  overflow: hidden;
  margin-top: -88rpx;
}

.hero-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(150deg, #24d06c 0%, #1fae58 55%, #159048 100%);
}

.hero-deco {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
}
.deco-1 {
  width: 320rpx;
  height: 320rpx;
  top: -120rpx;
  right: -80rpx;
}
.deco-2 {
  width: 200rpx;
  height: 200rpx;
  bottom: -60rpx;
  left: -40rpx;
  background: rgba(255, 255, 255, 0.08);
}

.hero-inner {
  position: relative;
  z-index: 2;
  padding-top: 140rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.hero-avatar {
  position: relative;
  width: 168rpx;
  height: 168rpx;
  border-radius: 50%;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.18);
}
.avatar-ring {
  position: absolute;
  inset: -10rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
}
.avatar-text {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #24d06c 0%, #1fae58 100%);
  color: #ffffff;
  font-size: 64rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-name {
  margin-top: 24rpx;
  font-size: 42rpx;
  font-weight: 800;
  color: #ffffff;
}

.hero-desc {
  margin-top: 8rpx;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.85);
}

.hero-tags {
  margin-top: 24rpx;
  display: flex;
  gap: 14rpx;
}
.hero-tag {
  padding: 8rpx 22rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.18);
  border: 1rpx solid rgba(255, 255, 255, 0.3);
}
.hero-tag-text {
  font-size: 22rpx;
  color: #ffffff;
}

/* 信息卡片 */
.info-card {
  margin: -40rpx 28rpx 0;
  position: relative;
  z-index: 5;
  background: #ffffff;
  border-radius: 24rpx;
  padding: 8rpx 28rpx;
  box-shadow: 0 1px 8px rgba(18, 24, 38, 0.06);
}

.info-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 28rpx 0;
}

.info-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.info-icon.icon-blue {
  background: rgba(36, 140, 245, 0.12);
}
.info-icon.icon-blue .info-icon-text { color: #248cf5; }
.info-icon.icon-orange {
  background: rgba(255, 112, 67, 0.12);
}
.info-icon.icon-orange .info-icon-text { color: #ff5b35; }
.info-icon.icon-purple {
  background: rgba(118, 80, 200, 0.12);
}
.info-icon.icon-purple .info-icon-text { color: #7650c8; }

.info-icon-text {
  font-size: 28rpx;
  font-weight: 800;
}

.info-main {
  flex: 1;
  min-width: 0;
}
.info-label {
  display: block;
  font-size: 22rpx;
  color: #8a8f98;
}
.info-value {
  display: block;
  margin-top: 6rpx;
  font-size: 30rpx;
  font-weight: 700;
  color: #222;
}
.info-value.muted {
  color: #b3b8c0;
  font-weight: 600;
}

.info-arrow {
  font-size: 40rpx;
  color: #c4c9d2;
  line-height: 1;
}

.info-divider {
  height: 1rpx;
  background: #f4f5f7;
  margin-left: 92rpx;
}

/* 共同频道 */
.shared-card {
  margin: 28rpx 28rpx 0;
  padding: 28rpx;
  background: #ffffff;
  border-radius: 24rpx;
  box-shadow: 0 1px 8px rgba(18, 24, 38, 0.06);
}

.shared-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}
.shared-title {
  font-size: 30rpx;
  font-weight: 800;
  color: #222;
}
.shared-count {
  font-size: 24rpx;
  color: #8a8f98;
}

.shared-list {
  display: flex;
  gap: 36rpx;
}
.shared-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  width: 120rpx;
}
.shared-avatar {
  width: 88rpx;
  height: 88rpx;
  border-radius: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.shared-avatar.orange {
  background: linear-gradient(135deg, #ff8a4a 0%, #ff5b35 100%);
}
.shared-avatar.purple {
  background: linear-gradient(135deg, #7650c8 0%, #9b6fe0 100%);
}
.shared-avatar.blue {
  background: linear-gradient(135deg, #248cf5 0%, #4aa6ff 100%);
}
.shared-avatar-text {
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 800;
}
.shared-name {
  font-size: 22rpx;
  color: #5f646d;
  text-align: center;
}

.scroll-tail {
  height: 40rpx;
}

/* 底部操作按钮 */
.bottom-actions {
  display: flex;
  gap: 20rpx;
  padding: 20rpx 28rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #ffffff;
  border-top: 1rpx solid #f0f1f3;
}

.bottom-btn {
  height: 92rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20rpx;
}

.follow-btn {
  flex: 1;
  background: #f0f1f3;
  border: 2rpx solid transparent;
}
.follow-btn.following {
  background: rgba(36, 208, 108, 0.1);
  border-color: #24d06c;
}
.follow-text {
  font-size: 28rpx;
  font-weight: 700;
  color: #5f646d;
}
.follow-btn.following .follow-text {
  color: #1fae58;
}

.message-btn {
  flex: 1.4;
  background: linear-gradient(135deg, #ff8a4a 0%, #ff5b35 100%);
  box-shadow: 0 6rpx 16rpx rgba(255, 91, 53, 0.3);
}
.message-text {
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 700;
}
</style>

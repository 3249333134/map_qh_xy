<template>
  <view class="detail-page">
    <view class="status-spacer" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="nav-bar">
      <view class="nav-back" @tap="goBack">‹</view>
      <text class="nav-title">频道详情</text>
      <view class="nav-right" @tap="openManage">管</view>
    </view>

    <scroll-view class="detail-scroll" scroll-y show-scrollbar="false">
      <!-- 频道信息卡片 -->
      <view class="channel-card">
        <view class="channel-cover">
          <view class="cover-bg"></view>
          <view class="cover-emoji">春</view>
          <view class="cover-badge">公开</view>
        </view>

        <view class="channel-info">
          <view class="channel-title-row">
            <text class="channel-title">{{ channel.name }}</text>
            <view class="channel-tag tag-geo">
              <text class="tag-text">{{ channel.type }}</text>
            </view>
          </view>

          <view class="channel-stats">
            <view class="stat-item">
              <text class="stat-num">{{ channel.members }}</text>
              <text class="stat-label">成员</text>
            </view>
            <view class="stat-divider"></view>
            <view class="stat-item">
              <text class="stat-num">{{ channel.subs }}</text>
              <text class="stat-label">子频道</text>
            </view>
            <view class="stat-divider"></view>
            <view class="stat-item">
              <text class="stat-num">{{ channel.online }}</text>
              <text class="stat-label">在线</text>
            </view>
          </view>

          <text class="channel-desc">{{ channel.desc }}</text>

          <view class="channel-actions">
            <view class="cta-btn" @tap="joinChannel">加入频道</view>
            <view class="ghost-btn" @tap="shareChannel">分享</view>
          </view>
        </view>
      </view>

      <!-- 选项列表 -->
      <view class="option-group">
        <view class="group-label">频道功能</view>
        <view class="option-list">
          <view
            v-for="opt in options"
            :key="opt.id"
            class="option-row"
            @tap="openOption(opt)"
          >
            <view class="option-icon" :class="opt.color">
              <text class="option-icon-text">{{ opt.icon }}</text>
            </view>
            <view class="option-main">
              <text class="option-title">{{ opt.title }}</text>
              <text class="option-sub">{{ opt.sub }}</text>
            </view>
            <view v-if="opt.value" class="option-value" :class="{ building: opt.building }">
              <text class="value-text">{{ opt.value }}</text>
            </view>
            <text class="option-arrow">›</text>
          </view>
        </view>
      </view>

      <view class="footer-hint">
        <text class="footer-text">频道由主理人维护，内容接入自动审核与举报机制。</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const statusBarHeight = ref(20)

const channel = ref({
  name: '春熙路频道',
  type: '地理位置类',
  members: '1280',
  subs: '6',
  online: '128',
  desc: '区域热点讨论、地理围栏通知、活动直播、商铺优惠推送都聚合在频道内。'
})

const options = ref([
  {
    id: 'sub',
    icon: '频',
    color: 'blue',
    title: '子频道',
    sub: '活动 / 商铺 / 地标',
    value: '6 个',
    building: false
  },
  {
    id: 'wiki',
    icon: '维',
    color: 'purple',
    title: '频道Wiki',
    sub: '主理人与贡献者共建',
    value: '共建中',
    building: true
  },
  {
    id: 'map',
    icon: '图',
    color: 'orange',
    title: '地图副本',
    sub: '春熙路地理围栏',
    value: '已绑定',
    building: false
  },
  {
    id: 'perm',
    icon: '权',
    color: 'green',
    title: '成员权限',
    sub: '所有者 / 管理员 / 成员 / 访客',
    value: '4 类角色',
    building: false
  }
])

onMounted(() => {
  try {
    const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
    statusBarHeight.value = info.statusBarHeight || 20
  } catch (e) {}
})

const goBack = () => uni.navigateBack()

const joinChannel = () => {
  uni.showToast({ title: '已加入频道', icon: 'none' })
}

const shareChannel = () => {
  uni.showToast({ title: '已复制频道链接', icon: 'none' })
}

const openManage = () => {
  uni.showToast({ title: '打开管理面板', icon: 'none' })
}

const openOption = (opt) => {
  if (opt.id === 'perm') {
    uni.navigateTo({ url: '/pages/channel-permissions/index' })
    return
  }
  if (opt.id === 'map') {
    uni.navigateTo({ url: '/pages/channel-map/index' })
    return
  }
  uni.showToast({ title: '打开 ' + opt.title, icon: 'none' })
}
</script>

<style scoped>
.detail-page {
  min-height: 100vh;
  background: #f7f7f8;
  display: flex;
  flex-direction: column;
}

.status-spacer {
  background: #ffffff;
}

.nav-bar {
  position: relative;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border-bottom: 1rpx solid #f0f1f3;
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
  color: #222;
  font-weight: 300;
  line-height: 1;
}

.nav-title {
  font-size: 34rpx;
  font-weight: 800;
  color: #222;
}

.nav-right {
  position: absolute;
  right: 28rpx;
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #5f646d;
  font-weight: 700;
}

.detail-scroll {
  flex: 1;
  padding: 28rpx;
  box-sizing: border-box;
}

/* 频道信息卡片 */
.channel-card {
  background: #ffffff;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 1px 8px rgba(18, 24, 38, 0.06);
  margin-bottom: 36rpx;
}

.channel-cover {
  position: relative;
  height: 220rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.cover-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #248cf5 0%, #7650c8 100%);
}

.cover-emoji {
  position: relative;
  z-index: 2;
  width: 120rpx;
  height: 120rpx;
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.18);
  border: 2rpx solid rgba(255, 255, 255, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 56rpx;
  font-weight: 800;
}

.cover-badge {
  position: absolute;
  top: 24rpx;
  right: 24rpx;
  z-index: 2;
  padding: 6rpx 20rpx;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 999rpx;
  font-size: 22rpx;
  color: #248cf5;
  font-weight: 700;
}

.channel-info {
  padding: 32rpx 28rpx 28rpx;
}

.channel-title-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.channel-title {
  font-size: 38rpx;
  font-weight: 800;
  color: #222;
}

.channel-tag {
  padding: 6rpx 18rpx;
  border-radius: 999rpx;
}
.tag-geo {
  background: rgba(36, 140, 245, 0.1);
}
.tag-text {
  font-size: 22rpx;
  color: #248cf5;
  font-weight: 600;
}

.channel-stats {
  display: flex;
  align-items: center;
  background: #f7f7f8;
  border-radius: 18rpx;
  padding: 24rpx 0;
  margin-bottom: 24rpx;
}
.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.stat-num {
  font-size: 34rpx;
  font-weight: 800;
  color: #222;
  line-height: 1;
}
.stat-label {
  margin-top: 10rpx;
  font-size: 22rpx;
  color: #8a8f98;
}
.stat-divider {
  width: 1rpx;
  height: 48rpx;
  background: #e8eaee;
}

.channel-desc {
  font-size: 26rpx;
  color: #5f646d;
  line-height: 42rpx;
}

.channel-actions {
  margin-top: 28rpx;
  display: flex;
  gap: 18rpx;
}

.cta-btn {
  flex: 1;
  height: 84rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18rpx;
  background: linear-gradient(135deg, #ff8a4a 0%, #ff5b35 100%);
  color: #ffffff;
  font-size: 28rpx;
  font-weight: 700;
  box-shadow: 0 6rpx 16rpx rgba(255, 91, 53, 0.3);
}

.ghost-btn {
  width: 160rpx;
  height: 84rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18rpx;
  background: #f0f1f3;
  color: #5f646d;
  font-size: 28rpx;
  font-weight: 700;
}

/* 选项列表 */
.option-group {
  margin-bottom: 20rpx;
}

.group-label {
  font-size: 26rpx;
  color: #8a8f98;
  font-weight: 700;
  margin: 0 8rpx 18rpx;
}

.option-list {
  background: #ffffff;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 1px 8px rgba(18, 24, 38, 0.06);
}

.option-row {
  display: flex;
  align-items: center;
  gap: 22rpx;
  padding: 28rpx 24rpx;
  border-bottom: 1rpx solid #f4f5f7;
}
.option-row:last-child {
  border-bottom: none;
}

.option-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.option-icon.blue {
  background: rgba(36, 140, 245, 0.12);
}
.option-icon.blue .option-icon-text {
  color: #248cf5;
}
.option-icon.purple {
  background: rgba(118, 80, 200, 0.12);
}
.option-icon.purple .option-icon-text {
  color: #7650c8;
}
.option-icon.orange {
  background: rgba(255, 112, 67, 0.12);
}
.option-icon.orange .option-icon-text {
  color: #ff5b35;
}
.option-icon.green {
  background: rgba(36, 208, 108, 0.12);
}
.option-icon.green .option-icon-text {
  color: #1fae58;
}

.option-icon-text {
  font-size: 30rpx;
  font-weight: 800;
}

.option-main {
  flex: 1;
  min-width: 0;
}
.option-title {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #222;
}
.option-sub {
  display: block;
  margin-top: 6rpx;
  font-size: 23rpx;
  color: #8a8f98;
}

.option-value {
  padding: 6rpx 18rpx;
  border-radius: 999rpx;
  background: #f0f1f3;
}
.option-value.building {
  background: rgba(118, 80, 200, 0.1);
}
.value-text {
  font-size: 22rpx;
  color: #8a8f98;
  font-weight: 600;
}
.option-value.building .value-text {
  color: #7650c8;
}

.option-arrow {
  font-size: 40rpx;
  color: #c4c9d2;
  line-height: 1;
}

.footer-hint {
  padding: 12rpx 8rpx 40rpx;
}
.footer-text {
  font-size: 22rpx;
  color: #a8adb6;
  line-height: 36rpx;
}
</style>

<template>
  <view class="page">
    <view class="status-spacer" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="nav-bar">
      <view class="nav-back" @tap="goBack">‹</view>
      <text class="nav-title">预览</text>
      <view class="nav-right cta" @tap="onPublish">发布</view>
    </view>

    <view class="content">
      <view class="hero-area">
        <view class="hero-tag">预览</view>
        <text class="hero-title">发布前预览</text>
        <text class="hero-sub">此为内容在首页信息流中的展示效果</text>
      </view>

      <view class="preview-card">
        <view class="card-head">
          <view class="avatar">用</view>
          <view class="card-head-info">
            <text class="card-author">用户495</text>
            <text class="card-status">即将发布</text>
          </view>
        </view>

        <text class="card-title">城市漫游记录</text>
        <text class="card-desc">从自由天地出发，沿着夜景路线一路拍摄到春熙路，记录下城市最迷人的傍晚光影与街角细节。</text>

        <view class="card-media">
          <view class="media-block"></view>
          <view class="media-row">
            <view class="media-block small"></view>
            <view class="media-block small"></view>
          </view>
        </view>

        <view class="card-chips">
          <text v-for="c in chips" :key="c.key" class="card-chip">{{ c.name }}</text>
        </view>

        <view class="card-footer">
          <text class="footer-text">📍 亚新大厦</text>
          <text class="footer-time">刚刚</text>
        </view>
      </view>

      <view class="note-card">
        <text class="note-title">发布后</text>
        <text class="note-desc">内容将进入首页信息流，并可通过地点定位在地图上被发现。可在「发布成功」页查看传播数据。</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const statusBarHeight = ref(20)
const chips = [
  { key: 'topic', name: '#城市漫游' },
  { key: 'place', name: '亚新大厦' },
  { key: 'vis', name: '公开' }
]

onMounted(() => {
  try {
    const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
    statusBarHeight.value = info.statusBarHeight || 20
  } catch (e) {}
})

const goBack = () => uni.navigateBack()
const onPublish = () => uni.navigateTo({ url: '/pages/publish-success/index' })
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
  padding: 24rpx;
}

.hero-area {
  padding: 36rpx 24rpx;
  border-radius: 14rpx;
  background: linear-gradient(135deg, #248cf5 0%, #7650c8 100%);
  text-align: center;
}

.hero-tag {
  display: inline-block;
  padding: 6rpx 20rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
  font-size: 22rpx;
  font-weight: 600;
}

.hero-title {
  display: block;
  margin-top: 16rpx;
  font-size: 36rpx;
  font-weight: 800;
  color: #ffffff;
}

.hero-sub {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

.preview-card {
  margin-top: 20rpx;
  padding: 28rpx 24rpx;
  border-radius: 14rpx;
  background: #ffffff;
  box-shadow: 0 1px 8px rgba(18, 24, 38, 0.06);
}

.card-head {
  display: flex;
  align-items: center;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #248cf5 0%, #7650c8 100%);
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-head-info {
  margin-left: 20rpx;
}

.card-author {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #222;
}

.card-status {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #ff7043;
}

.card-title {
  display: block;
  margin-top: 20rpx;
  font-size: 32rpx;
  font-weight: 700;
  color: #222;
}

.card-desc {
  display: block;
  margin-top: 12rpx;
  font-size: 26rpx;
  color: #5f646d;
  line-height: 1.7;
}

.card-media {
  margin-top: 20rpx;
}

.media-block {
  width: 100%;
  height: 280rpx;
  border-radius: 12rpx;
  background: linear-gradient(135deg, #ffd400 0%, #ff7043 100%);
}

.media-row {
  margin-top: 12rpx;
  display: flex;
  gap: 12rpx;
}

.media-block.small {
  flex: 1;
  height: 160rpx;
  background: linear-gradient(135deg, #7650c8 0%, #248cf5 100%);
}

.card-chips {
  margin-top: 20rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.card-chip {
  padding: 8rpx 20rpx;
  border-radius: 999rpx;
  background: rgba(36, 140, 245, 0.12);
  color: #248cf5;
  font-size: 24rpx;
}

.card-footer {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f1f3;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.footer-text {
  font-size: 24rpx;
  color: #5f646d;
}

.footer-time {
  font-size: 24rpx;
  color: #8a8f98;
}

.note-card {
  margin-top: 20rpx;
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

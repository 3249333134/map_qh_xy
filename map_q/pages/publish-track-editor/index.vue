<template>
  <view class="page">
    <view class="status-spacer" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="nav-bar">
      <view class="nav-back" @tap="goBack">‹</view>
      <text class="nav-title">轨迹编辑</text>
      <view class="nav-right cta" @tap="onSave">保存</view>
    </view>

    <view class="content">
      <view class="route-card">
        <text class="route-name">城市夜景摄影路线</text>
        <view class="route-preview">
          <view class="route-dot start"></view>
          <view class="route-line"></view>
          <view class="route-dot mid"></view>
          <view class="route-line"></view>
          <view class="route-dot end"></view>
        </view>
        <view class="route-labels">
          <text class="route-label">自由天地</text>
          <text class="route-label">亚新大厦</text>
          <text class="route-label">春熙路</text>
        </view>
      </view>

      <view class="note-card">
        <text class="note-title">城市夜景摄影路线</text>
        <text class="note-desc">支持在线编辑轨迹路径，插入照片、音频、视频节点，也可多人非实时共创。</text>
      </view>

      <view class="section-title">时间轴节点</view>
      <view class="timeline">
        <view v-for="(node, i) in nodes" :key="node.key" class="timeline-item">
          <view class="timeline-rail">
            <view class="timeline-dot" :class="node.type"></view>
            <view v-if="i !== nodes.length - 1" class="timeline-line"></view>
          </view>
          <view class="timeline-body">
            <view class="timeline-head">
              <text class="timeline-tag">{{ node.tag }}</text>
              <text class="timeline-title">{{ node.title }}</text>
            </view>
            <text class="timeline-desc">{{ node.desc }}</text>
            <view class="timeline-media" @tap="onNode(node)">
              <text class="media-action">{{ node.action }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="footer-bar">
      <view class="footer-btn" @tap="onInsert">插入节点</view>
      <view class="footer-btn" @tap="onCollab">协作</view>
      <view class="footer-btn primary" @tap="onPublish">发布</view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const statusBarHeight = ref(20)
const nodes = [
  { key: 'start', type: 'start', tag: '起点', title: '自由天地', desc: '插入封面照片，作为轨迹起始节点。', action: '+ 插入封面照片' },
  { key: 'mid', type: 'mid', tag: '节点2', title: '亚新大厦', desc: '插入语音备注，记录拍摄背景。', action: '+ 插入语音备注' },
  { key: 'end', type: 'end', tag: '终点', title: '春熙路', desc: '生成路线摘要，自动汇总整段轨迹。', action: '生成路线摘要' }
]

onMounted(() => {
  try {
    const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
    statusBarHeight.value = info.statusBarHeight || 20
  } catch (e) {}
})

const goBack = () => uni.navigateBack()
const onSave = () => {
  uni.showToast({ title: '已保存轨迹', icon: 'success' })
  setTimeout(goBack, 800)
}
const onNode = (node) => uni.showToast({ title: node.action, icon: 'none' })
const onInsert = () => uni.showToast({ title: '插入节点', icon: 'none' })
const onCollab = () => uni.showToast({ title: '邀请协作', icon: 'none' })
const onPublish = () => uni.navigateTo({ url: '/pages/publish-preview/index' })
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f7f7f8;
  padding-bottom: 140rpx;
}

.status-spacer {
  background: #fff;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: 0 24rpx;
  background: #fff;
  border-bottom: 1rpx solid #f1f5f9;
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
  padding: 0 28rpx;
  height: 56rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #ff8a4a 0%, #ff5b35 100%);
  color: #fff;
  font-size: 26rpx;
  font-weight: 700;
}

.content {
  padding: 24rpx;
}

.route-card {
  padding: 28rpx 24rpx;
  border-radius: 14rpx;
  background: #fff;
  box-shadow: 0 1px 8px rgba(18, 24, 38, 0.06);
}

.route-name {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #222;
}

.route-preview {
  margin-top: 32rpx;
  display: flex;
  align-items: center;
  padding: 0 8rpx;
}

.route-dot {
  width: 28rpx;
  height: 28rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.route-dot.start {
  background: #24d06c;
}

.route-dot.mid {
  background: var(--color-info);
}

.route-dot.end {
  background: var(--color-primary);
}

.route-line {
  flex: 1;
  height: 6rpx;
  background: linear-gradient(90deg,#24d06c 0%,var(--color-info) 50%,var(--color-primary) 100%);
  border-radius: 999rpx;
}

.route-labels {
  margin-top: 14rpx;
  display: flex;
  justify-content: space-between;
}

.route-label {
  font-size: 22rpx;
  color: #8a8f98;
}

.route-label:first-child {
  text-align: left;
}

.route-label:last-child {
  text-align: right;
}

.note-card {
  margin-top: 20rpx;
  padding: 28rpx 24rpx;
  border-radius: 14rpx;
  background: #f0f1f3;
}

.note-title {
  display: block;
  font-size: 28rpx;
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

.section-title {
  display: block;
  margin: 36rpx 8rpx 16rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: #222;
}

.timeline {
  padding-left: 8rpx;
}

.timeline-item {
  display: flex;
}

.timeline-rail {
  width: 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.timeline-dot {
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  margin-top: 8rpx;
  border: 6rpx solid #ffffff;
  box-shadow: 0 0 0 2rpx #f0f1f3;
}

.timeline-dot.start {
  background: #24d06c;
}

.timeline-dot.mid {
  background: var(--color-info);
}

.timeline-dot.end {
  background: var(--color-primary);
}

.timeline-line {
  flex: 1;
  width: 4rpx;
  background: #f0f1f3;
  margin: 8rpx 0;
}

.timeline-body {
  flex: 1;
  margin-left: 16rpx;
  padding-bottom: 32rpx;
  background: #fff;
  border-radius: 14rpx;
  box-shadow: 0 1px 8px rgba(18, 24, 38, 0.06);
  padding: 24rpx;
}

.timeline-head {
  display: flex;
  align-items: center;
}

.timeline-tag {
  padding: 4rpx 14rpx;
  border-radius: 999rpx;
  background: rgba(36, 140, 245, 0.12);
  color: var(--color-info);
  font-size: 22rpx;
  font-weight: 600;
}

.timeline-title {
  margin-left: 12rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: #222;
}

.timeline-desc {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #5f646d;
  line-height: 1.6;
}

.timeline-media {
  margin-top: 16rpx;
  padding: 16rpx 20rpx;
  border-radius: 12rpx;
  border: 2rpx dashed #f1f5f9;
  background: #f7f7f8;
}

.media-action {
  font-size: 24rpx;
  color: var(--color-info);
  font-weight: 600;
}

.footer-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  gap: 16rpx;
  padding: 16rpx 24rpx calc(env(safe-area-inset-bottom) + 16rpx);
  background: rgba(255, 255, 255, 0.98);
  border-top: 1rpx solid #f1f5f9;
}

.footer-btn {
  flex: 1;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  background: #f0f1f3;
  color: #5f646d;
  font-size: 28rpx;
  font-weight: 600;
}

.footer-btn.primary {
  background: linear-gradient(135deg, #ff8a4a 0%, #ff5b35 100%);
  color: #fff;
}
</style>

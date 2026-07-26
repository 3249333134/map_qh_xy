<template>
  <view class="thread-page">
    <view class="status-spacer" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="nav-bar">
      <view class="nav-back" @tap="goBack">‹</view>
      <text class="nav-title">频道线程</text>
      <view class="nav-right" @tap="openMore">⋯</view>
    </view>

    <scroll-view class="thread-scroll" scroll-y show-scrollbar="false">
      <!-- 置顶线程卡片 -->
      <view class="thread-card">
        <view class="thread-head">
          <view class="owner-avatar">
            <text class="avatar-text">理</text>
          </view>
          <view class="head-meta">
            <view class="head-meta-row">
              <text class="owner-name">频道主理人</text>
              <view class="pin-tag">
                <text class="pin-text">置顶</text>
              </view>
            </view>
            <text class="thread-time">2 小时前 · 春熙路频道</text>
          </view>
          <view class="activity-tag">
            <text class="activity-tag-text">活动</text>
          </view>
        </view>

        <text class="thread-title">{{ thread.title }}</text>
        <text class="thread-desc">{{ thread.desc }}</text>

        <view class="chip-row">
          <view class="chip chip-orange">
            <text class="chip-num">{{ thread.chips.signup }}</text>
            <text class="chip-label">报名</text>
          </view>
          <view class="chip chip-blue">
            <text class="chip-num">{{ thread.chips.friends }}</text>
            <text class="chip-label">好友</text>
          </view>
          <view class="chip chip-purple">
            <text class="chip-num">{{ thread.chips.countdown }}</text>
            <text class="chip-label">倒计时</text>
          </view>
        </view>

        <view class="thread-actions">
          <view class="thread-action cta" @tap="signup">
            <text class="action-cta-text">立即报名</text>
          </view>
          <view class="thread-action" @tap="addCalendar">
            <text class="action-icon">日</text>
            <text class="action-text">日历</text>
          </view>
          <view class="thread-action" @tap="shareToMap">
            <text class="action-icon">图</text>
            <text class="action-text">地图锚点</text>
          </view>
        </view>
      </view>

      <!-- 线程回复分隔 -->
      <view class="reply-divider">
        <view class="divider-line"></view>
        <text class="divider-text">线程回复 {{ messages.length }}</text>
        <view class="divider-line"></view>
      </view>

      <!-- 聊天气泡区域 -->
      <view class="bubble-area">
        <view
          v-for="msg in messages"
          :key="msg.id"
          class="bubble-row"
          :class="{ self: msg.self }"
        >
          <view class="bubble-avatar" :class="msg.color">
            <text class="bubble-avatar-text">{{ msg.avatar }}</text>
          </view>
          <view class="bubble-content">
            <view class="bubble-meta">
              <text class="bubble-name">{{ msg.name }}</text>
              <text class="bubble-time">{{ msg.time }}</text>
            </view>
            <view class="bubble">
              <text class="bubble-text">{{ msg.text }}</text>
            </view>
          </view>
        </view>

        <view class="reply-end">
          <text class="reply-end-text">已加载全部回复</text>
        </view>
      </view>
    </scroll-view>

    <!-- 底部输入栏 -->
    <view class="input-bar">
      <view class="input-plus" @tap="openPlus">+</view>
      <view class="input-field">
        <input
          v-model="draft"
          class="input-text"
          placeholder="回复线程"
          confirm-type="send"
          @confirm="send"
        />
      </view>
      <view class="send-btn" :class="{ active: draft.length > 0 }" @tap="send">
        <text class="send-arrow">↑</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const statusBarHeight = ref(20)
const draft = ref('')

const thread = ref({
  title: '周末夜景摄影集合',
  desc: '集合点：自由天地东门。可报名、添加日历、分享到地图锚点。',
  chips: {
    signup: '36',
    friends: '3',
    countdown: '24h'
  }
})

const messages = ref([
  {
    id: 'm1',
    name: '小林',
    avatar: '林',
    color: 'blue',
    time: '1 小时前',
    text: '我可以带三脚架。',
    self: false
  },
  {
    id: 'm2',
    name: '我',
    avatar: '我',
    color: 'orange',
    time: '46 分钟前',
    text: '已添加到日程。',
    self: true
  }
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
    itemList: ['置顶', '复制链接', '举报线程'],
    success: () => {}
  })
}

const signup = () => {
  uni.showToast({ title: '报名成功', icon: 'none' })
}

const addCalendar = () => {
  uni.showToast({ title: '已添加到日历', icon: 'none' })
}

const shareToMap = () => {
  uni.showToast({ title: '已分享到地图锚点', icon: 'none' })
}

const openPlus = () => {
  uni.showActionSheet({
    itemList: ['图片', '位置', '名片'],
    success: () => {}
  })
}

const send = () => {
  const text = draft.value.trim()
  if (!text) return
  messages.value.push({
    id: 'm' + (messages.value.length + 1),
    name: '我',
    avatar: '我',
    color: 'orange',
    time: '刚刚',
    text,
    self: true
  })
  draft.value = ''
}
</script>

<style scoped>
.thread-page {
  height: 100vh;
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
  font-size: 44rpx;
  color: #5f646d;
  line-height: 1;
}

.thread-scroll {
  flex: 1;
  padding: 28rpx 28rpx 24rpx;
  box-sizing: border-box;
}

/* 置顶线程卡片 */
.thread-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: 0 1px 8px rgba(18, 24, 38, 0.06);
}

.thread-head {
  display: flex;
  align-items: center;
  gap: 18rpx;
  margin-bottom: 22rpx;
}

.owner-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 22rpx;
  background: linear-gradient(135deg, #7650c8 0%, #9b6fe0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.avatar-text {
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 800;
}

.head-meta {
  flex: 1;
  min-width: 0;
}
.head-meta-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.owner-name {
  font-size: 28rpx;
  font-weight: 800;
  color: #222;
}
.pin-tag {
  padding: 2rpx 14rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #ff8a4a 0%, #ff5b35 100%);
}
.pin-text {
  font-size: 20rpx;
  color: #ffffff;
  font-weight: 700;
}
.thread-time {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #8a8f98;
}

.activity-tag {
  padding: 6rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(36, 140, 245, 0.1);
  flex-shrink: 0;
}
.activity-tag-text {
  font-size: 22rpx;
  color: #248cf5;
  font-weight: 700;
}

.thread-title {
  display: block;
  font-size: 34rpx;
  font-weight: 800;
  color: #222;
  line-height: 46rpx;
  margin-bottom: 12rpx;
}

.thread-desc {
  display: block;
  font-size: 26rpx;
  color: #5f646d;
  line-height: 42rpx;
  margin-bottom: 24rpx;
}

.chip-row {
  display: flex;
  gap: 16rpx;
  margin-bottom: 26rpx;
}

.chip {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 18rpx 0;
  border-radius: 16rpx;
  background: #f7f7f8;
}
.chip-orange {
  background: rgba(255, 112, 67, 0.1);
}
.chip-blue {
  background: rgba(36, 140, 245, 0.1);
}
.chip-purple {
  background: rgba(118, 80, 200, 0.1);
}

.chip-num {
  font-size: 32rpx;
  font-weight: 800;
  line-height: 1;
}
.chip-orange .chip-num { color: #ff5b35; }
.chip-blue .chip-num { color: #248cf5; }
.chip-purple .chip-num { color: #7650c8; }

.chip-label {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #8a8f98;
}

.thread-actions {
  display: flex;
  gap: 16rpx;
}

.thread-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
  height: 92rpx;
  border-radius: 18rpx;
  background: #f7f7f8;
}
.thread-action.cta {
  flex: 1;
  background: linear-gradient(135deg, #ff8a4a 0%, #ff5b35 100%);
  flex-direction: row;
  gap: 8rpx;
  box-shadow: 0 6rpx 16rpx rgba(255, 91, 53, 0.3);
}
.thread-action:not(.cta) {
  width: 140rpx;
}

.action-cta-text {
  color: #ffffff;
  font-size: 28rpx;
  font-weight: 700;
}
.action-icon {
  width: 40rpx;
  height: 40rpx;
  border-radius: 12rpx;
  background: #ffffff;
  color: #5f646d;
  font-size: 22rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}
.action-text {
  font-size: 22rpx;
  color: #5f646d;
}

/* 回复分隔 */
.reply-divider {
  display: flex;
  align-items: center;
  gap: 18rpx;
  margin: 36rpx 0 24rpx;
}
.divider-line {
  flex: 1;
  height: 1rpx;
  background: #e8eaee;
}
.divider-text {
  font-size: 22rpx;
  color: #8a8f98;
}

/* 聊天气泡区域 */
.bubble-area {
  display: flex;
  flex-direction: column;
  gap: 28rpx;
  padding-bottom: 20rpx;
}

.bubble-row {
  display: flex;
  gap: 16rpx;
  align-items: flex-start;
}
.bubble-row.self {
  flex-direction: row-reverse;
}

.bubble-avatar {
  width: 68rpx;
  height: 68rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.bubble-avatar.blue {
  background: linear-gradient(135deg, #248cf5 0%, #4aa6ff 100%);
}
.bubble-avatar.orange {
  background: linear-gradient(135deg, #ff8a4a 0%, #ff5b35 100%);
}
.bubble-avatar-text {
  color: #ffffff;
  font-size: 28rpx;
  font-weight: 800;
}

.bubble-content {
  max-width: 540rpx;
  min-width: 0;
}
.bubble-row.self .bubble-content {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.bubble-meta {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin-bottom: 8rpx;
  padding: 0 8rpx;
}
.bubble-row.self .bubble-meta {
  flex-direction: row-reverse;
}
.bubble-name {
  font-size: 24rpx;
  color: #8a8f98;
  font-weight: 600;
}
.bubble-time {
  font-size: 20rpx;
  color: #b3b8c0;
}

.bubble {
  padding: 20rpx 24rpx;
  border-radius: 22rpx;
  background: #ffffff;
  box-shadow: 0 1px 8px rgba(18, 24, 38, 0.06);
}
.bubble-row.self .bubble {
  background: linear-gradient(135deg, #ff8a4a 0%, #ff5b35 100%);
}
.bubble-text {
  font-size: 28rpx;
  color: #222;
  line-height: 42rpx;
}
.bubble-row.self .bubble-text {
  color: #ffffff;
}

.reply-end {
  margin-top: 8rpx;
  text-align: center;
}
.reply-end-text {
  font-size: 22rpx;
  color: #b3b8c0;
}

/* 底部输入栏 */
.input-bar {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 16rpx 24rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: #ffffff;
  border-top: 1rpx solid #f0f1f3;
}

.input-plus {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: #f0f1f3;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #5f646d;
  font-size: 44rpx;
  line-height: 1;
  flex-shrink: 0;
}

.input-field {
  flex: 1;
  height: 72rpx;
  padding: 0 26rpx;
  border-radius: 999rpx;
  background: #f0f1f3;
  display: flex;
  align-items: center;
}
.input-text {
  flex: 1;
  height: 72rpx;
  font-size: 28rpx;
  color: #222;
}

.send-btn {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: #d9dde3;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}
.send-btn.active {
  background: linear-gradient(135deg, #ff8a4a 0%, #ff5b35 100%);
  box-shadow: 0 4rpx 14rpx rgba(255, 91, 53, 0.32);
}
.send-arrow {
  color: #ffffff;
  font-size: 36rpx;
  font-weight: 700;
  line-height: 1;
}
</style>

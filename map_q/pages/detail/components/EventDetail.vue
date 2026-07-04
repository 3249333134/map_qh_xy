<template>
  <view class="detail-page event-detail">
    <!-- 活动封面 -->
    <view class="event-cover">
      <view class="cover-gradient"></view>
      <view class="cover-status" :class="statusClass">
        <text>{{ statusText }}</text>
      </view>
    </view>

    <!-- 顶部导航 -->
    <view class="detail-nav">
      <view class="nav-back" @tap="back">
        <view class="back-btn">
          <text class="back-icon">‹</text>
        </view>
      </view>
      <text class="nav-title">活动详情</text>
      <view class="nav-actions">
        <view class="share-btn" @tap="shareContent">
          <text class="action-icon">↗</text>
        </view>
      </view>
    </view>

    <!-- 活动基本信息 -->
    <view class="event-header">
      <text class="event-title">{{ eventData.name }}</text>
      <view class="event-organizer">
        <image class="organizer-avatar" :src="eventData.avatar || '/static/logo.png'" mode="aspectFill" />
        <text class="organizer-name">主办方：{{ eventData.author }}</text>
      </view>
    </view>

    <!-- 时间信息 -->
    <view class="time-card">
      <view class="time-row">
        <view class="time-icon">
          <text>🗓</text>
        </view>
        <view class="time-info">
          <text class="time-label">活动时间</text>
          <text class="time-value">{{ formattedTime }}</text>
        </view>
      </view>
      <view class="time-divider"></view>
      <view class="time-row">
        <view class="time-icon">
          <text>📍</text>
        </view>
        <view class="time-info">
          <text class="time-label">活动地点</text>
          <text class="time-value">{{ eventData.address || '待定' }}</text>
        </view>
      </view>
    </view>

    <!-- 参与情况 -->
    <view class="participants-card">
      <view class="participants-header">
        <text class="participants-title">报名情况</text>
        <text class="participants-count">{{ eventData.participants }} / {{ eventData.maxParticipants }} 人</text>
      </view>
      <view class="participants-bar">
        <view class="bar-fill" :style="{ width: participantPercent + '%' }"></view>
      </view>
      <view class="participants-avatars">
        <view class="avatar-item" v-for="i in Math.min(6, participantAvatars)" :key="i">
          <image :src="'/static/logo.png'" mode="aspectFill" />
        </view>
        <view class="avatar-more" v-if="eventData.participants > 6">
          <text>+{{ eventData.participants - 6 }}</text>
        </view>
      </view>
    </view>

    <!-- 活动详情 -->
    <view class="event-desc">
      <text class="section-title">活动详情</text>
      <text class="desc-text">{{ eventData.description || '暂无活动详情介绍' }}</text>
    </view>

    <!-- 注意事项 -->
    <view class="notice-card">
      <text class="notice-title">注意事项</text>
      <view class="notice-item">
        <text class="notice-icon">1</text>
        <text class="notice-text">请准时参加活动，迟到超过15分钟将取消报名资格</text>
      </view>
      <view class="notice-item">
        <text class="notice-icon">2</text>
        <text class="notice-text">活动开始前24小时可免费取消报名</text>
      </view>
      <view class="notice-item">
        <text class="notice-icon">3</text>
        <text class="notice-text">活动期间请遵守相关规定</text>
      </view>
    </view>

    <!-- 底部占位 -->
    <view :style="{ height: bottomHeight + 'px' }"></view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <view class="bar-left">
        <view class="bar-action" @tap="toggleLike">
          <text :class="{ active: isLiked }">{{ isLiked ? '♥' : '♡' }}</text>
          <text>{{ eventData.likes || 0 }}</text>
        </view>
        <view class="bar-action" @tap="shareContent">
          <text>↗</text>
          <text>分享</text>
        </view>
      </view>
      <view class="bar-right" :class="{ disabled: !canRegister }" @tap="handleRegister">
        <text>{{ canRegister ? (isRegistered ? '已报名' : '立即报名') : '报名已截止' }}</text>
      </view>
    </view>
  </view>
</template>

<script>
import { ref, computed, onMounted } from 'vue'

export default {
  name: 'EventDetail',
  setup() {
    const eventData = ref({
      name: '活动名称',
      author: '主办方',
      avatar: '',
      description: '',
      address: '',
      startTime: '',
      endTime: '',
      participants: 0,
      maxParticipants: 100,
      likes: 0,
      status: 'upcoming'
    })

    const isLiked = ref(false)
    const isRegistered = ref(false)
    const bottomHeight = ref(80)

    const statusClass = computed(() => {
      return eventData.value.status === 'ongoing' ? 'active' : 'pending'
    })

    const statusText = computed(() => {
      return eventData.value.status === 'ongoing' ? '进行中' : '即将开始'
    })

    const formattedTime = computed(() => {
      if (!eventData.value.startTime) return '待定'
      try {
        const start = new Date(eventData.value.startTime)
        const end = new Date(eventData.value.endTime)
        const dateStr = `${start.getMonth() + 1}月${start.getDate()}日`
        const startTime = `${start.getHours()}:${start.getMinutes().toString().padStart(2, '0')}`
        const endTime = `${end.getHours()}:${end.getMinutes().toString().padStart(2, '0')}`
        return `${dateStr} ${startTime} - ${endTime}`
      } catch (e) {
        return '待定'
      }
    })

    const participantPercent = computed(() => {
      if (!eventData.value.maxParticipants) return 0
      return Math.min(100, (eventData.value.participants / eventData.value.maxParticipants) * 100)
    })

    const participantAvatars = computed(() => {
      return Math.min(6, eventData.value.participants)
    })

    const canRegister = computed(() => {
      return eventData.value.status === 'upcoming' &&
             eventData.value.participants < eventData.value.maxParticipants
    })

    const toggleLike = () => {
      isLiked.value = !isLiked.value
      eventData.value.likes = (eventData.value.likes || 0) + (isLiked.value ? 1 : -1)
    }

    const handleRegister = () => {
      if (!canRegister.value) {
        uni.showToast({
          title: '报名已截止',
          icon: 'none'
        })
        return
      }

      if (isRegistered.value) {
        uni.showModal({
          title: '取消报名',
          content: '确定要取消报名吗？',
          success: (res) => {
            if (res.confirm) {
              isRegistered.value = false
              eventData.value.participants--
              uni.showToast({
                title: '已取消报名',
                icon: 'none'
              })
            }
          }
        })
      } else {
        uni.showModal({
          title: '确认报名',
          content: '确定要报名参加此活动吗？',
          success: (res) => {
            if (res.confirm) {
              isRegistered.value = true
              eventData.value.participants++
              uni.showToast({
                title: '报名成功',
                icon: 'success'
              })
            }
          }
        })
      }
    }

    const shareContent = () => {
      uni.showToast({
        title: '分享功能待实现',
        icon: 'none'
      })
    }

    const back = () => {
      uni.navigateBack()
    }

    const loadData = () => {
      try {
        const item = uni.getStorageSync('INDEX_LAST_ITEM')
        if (item && item._id) {
          eventData.value.name = item.name || item.title || '活动名称'
          eventData.value.author = item.author || '主办方'
          eventData.value.description = item.description || ''
          eventData.value.address = item.address || ''
          eventData.value.startTime = item.startTime || ''
          eventData.value.endTime = item.endTime || ''
          eventData.value.participants = item.participants || 0
          eventData.value.maxParticipants = item.maxParticipants || 100
          eventData.value.likes = item.likes || 0
          eventData.value.status = item.status || 'upcoming'
        }
      } catch (e) {
        console.warn('加载活动数据失败:', e)
      }
    }

    onMounted(() => {
      loadData()
    })

    return {
      eventData,
      isLiked,
      isRegistered,
      bottomHeight,
      statusClass,
      statusText,
      formattedTime,
      participantPercent,
      participantAvatars,
      canRegister,
      toggleLike,
      handleRegister,
      shareContent,
      back
    }
  }
}
</script>

<style scoped>
.detail-page {
  min-height: 100vh;
  background: #f8f8f8;
}

.detail-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--status-bar-height) 24rpx 16rpx;
  background: transparent;
  z-index: 100;
}

.nav-back {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
}

.back-icon {
  font-size: 48rpx;
  font-weight: 300;
  color: #ffffff;
  position: relative;
  top: -4rpx;
}

.nav-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #ffffff;
}

.nav-actions {
  width: 80rpx;
  display: flex;
  justify-content: flex-end;
}

.share-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
}

.action-icon {
  font-size: 28rpx;
  color: #ffffff;
}

.event-cover {
  height: 800rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-gradient {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 30% 70%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
}

.cover-status {
  padding: 8px 20px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}

.cover-status text {
  font-size: 14px;
  color: #fff;
  font-weight: 500;
}

.event-header {
  padding: 32rpx;
  background: #fff;
  margin-top: -40rpx;
  border-top-left-radius: 32rpx;
  border-top-right-radius: 32rpx;
  position: relative;
  z-index: 10;
}

.event-title {
  display: block;
  font-size: 22px;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1.4;
  margin-bottom: 12px;
}

.event-organizer {
  display: flex;
  align-items: center;
  gap: 8px;
}

.organizer-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.organizer-name {
  font-size: 13px;
  color: #666;
}

.time-card {
  margin: 0 20px 16px;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.time-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 0;
}

.time-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f5ff;
  border-radius: 8px;
}

.time-icon text {
  font-size: 16px;
}

.time-info {
  flex: 1;
}

.time-label {
  display: block;
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.time-value {
  display: block;
  font-size: 15px;
  color: #333;
  font-weight: 500;
}

.time-divider {
  height: 1px;
  background: #f0f0f0;
  margin: 8px 0;
}

.participants-card {
  margin: 0 20px 16px;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.participants-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.participants-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.participants-count {
  font-size: 13px;
  color: #666;
}

.participants-bar {
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  margin-bottom: 12px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.participants-avatars {
  display: flex;
  align-items: center;
}

.avatar-item {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid #fff;
  margin-left: -8px;
  overflow: hidden;
}

.avatar-item:first-child {
  margin-left: 0;
}

.avatar-item image {
  width: 100%;
  height: 100%;
}

.avatar-more {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: -8px;
}

.avatar-more text {
  font-size: 10px;
  color: #666;
}

.event-desc {
  padding: 20px;
  background: #fff;
}

.section-title {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.desc-text {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.notice-card {
  margin: 0 20px 16px;
  padding: 16px;
  background: #fff9e6;
  border-radius: 12px;
}

.notice-title {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #b8860b;
  margin-bottom: 12px;
}

.notice-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 6px 0;
}

.notice-icon {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #b8860b;
  color: #fff;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.notice-text {
  flex: 1;
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 10px 16px;
  padding-bottom: calc(10px + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -1px 8px rgba(0, 0, 0, 0.05);
}

.bar-left {
  display: flex;
  gap: 20px;
}

.bar-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.bar-action text:first-child {
  font-size: 20px;
  color: #999;
}

.bar-action text:first-child.active {
  color: #ff4757;
}

.bar-action text:last-child {
  font-size: 10px;
  color: #999;
}

.bar-right {
  margin-left: auto;
  padding: 12px 32px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 24px;
}

.bar-right text {
  font-size: 15px;
  color: #fff;
  font-weight: 600;
}

.bar-right.disabled {
  background: #ccc;
}

.bar-right.disabled text {
  font-weight: 400;
}
</style>

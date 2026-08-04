<template>
  <view class="detail-page event-detail">
    <!-- 顶部导航（沉浸式） -->
    <view class="detail-nav immersive">
      <view class="status-spacer" :style="{ height: statusBarHeight + 'px' }"></view>
      <view class="nav-row">
        <view class="nav-back" @tap="back">
          <text class="back-icon">‹</text>
        </view>
        <text class="nav-title">活动详情</text>
        <view class="nav-actions">
          <text class="action-icon" @tap="shareContent">↗</text>
        </view>
      </view>
    </view>

    <!-- 活动封面（顶到状态栏） -->
    <view class="event-cover" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="cover-gradient"></view>
      <view class="cover-status" :class="statusClass">
        <text>{{ statusText }}</text>
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
        <view class="bar-action" @tap="toggleReminder">
          <text :class="{ active: isReminded }">◷</text>
          <text>{{ isReminded ? '已提醒' : '提醒' }}</text>
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
import { contentInteractionApi } from '../../../utils/api/contentInteraction.js'
import { merchantEventApi } from '../../../utils/api/merchantEvent.js'

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
    const isReminded = ref(false)
    const contentId = ref('')
    const bottomHeight = ref(80)
    const statusBarHeight = ref(20)

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
      const state = contentInteractionApi.toggle(contentId.value, 'liked')
      isLiked.value = state.liked
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
              const registered = (uni.getStorageSync('REGISTERED_EVENTS') || []).filter(id => id !== contentId.value)
              uni.setStorageSync('REGISTERED_EVENTS', registered)
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
              try {
                const merchantEvent = merchantEventApi.list().find(item => item.id === contentId.value)
                if (merchantEvent) merchantEventApi.register(contentId.value)
                const registered = uni.getStorageSync('REGISTERED_EVENTS') || []
                if (!registered.includes(contentId.value)) uni.setStorageSync('REGISTERED_EVENTS', [contentId.value, ...registered])
                isRegistered.value = true
                eventData.value.participants++
                uni.showToast({ title: '报名成功', icon: 'success' })
              } catch (cause) {
                uni.showToast({ title: cause.message || '报名失败', icon: 'none' })
              }
            }
          }
        })
      }
    }

    const shareContent = () => {
      const path = `/pages/detail/index?id=${encodeURIComponent(contentId.value)}&type=event&source=share`
      // #ifdef H5
      uni.setClipboardData({ data: `${location.origin}${location.pathname}#${path}` })
      // #endif
      // #ifndef H5
      uni.showShareMenu({ withShareTicket: true })
      // #endif
    }

    const toggleReminder = () => {
      const reminders = uni.getStorageSync('EVENT_REMINDERS_V1') || {}
      isReminded.value = !isReminded.value
      if (isReminded.value) reminders[contentId.value] = { id: contentId.value, title: eventData.value.name, remindAt: Math.max(Date.now(), new Date(eventData.value.startTime).getTime() - 3600000) }
      else delete reminders[contentId.value]
      uni.setStorageSync('EVENT_REMINDERS_V1', reminders)
      uni.showToast({ title: isReminded.value ? '已添加应用内提醒' : '已取消提醒', icon: 'none' })
    }

    const back = () => {
      uni.navigateBack()
    }

    const loadData = () => {
      try {
      const item = uni.getStorageSync('CONTENT_DETAIL_ACTIVE_V1') || uni.getStorageSync('INDEX_LAST_ITEM')
        if (item && item._id) {
          contentId.value = item.id || item._id
          eventData.value.name = item.name || item.title || '活动名称'
          eventData.value.author = item.author?.name || item.author || '主办方'
          eventData.value.description = item.description || ''
          eventData.value.address = item.address || ''
          eventData.value.startTime = item.startTime || ''
          eventData.value.endTime = item.endTime || ''
          eventData.value.participants = item.participants || 0
          eventData.value.maxParticipants = item.maxParticipants || 100
          eventData.value.likes = item.likes || 0
          eventData.value.status = item.status || 'upcoming'
          const actionState = contentInteractionApi.getState(contentId.value)
          isLiked.value = actionState.liked
          isRegistered.value = (uni.getStorageSync('REGISTERED_EVENTS') || []).includes(contentId.value)
          isReminded.value = Boolean((uni.getStorageSync('EVENT_REMINDERS_V1') || {})[contentId.value])
        }
      } catch (e) {
        console.warn('加载活动数据失败:', e)
      }
    }

    onMounted(() => {
      loadData()
      try {
        const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
        statusBarHeight.value = info.statusBarHeight || 20
      } catch (e) {}
    })

    return {
      eventData,
      isLiked,
      isRegistered,
      isReminded,
      bottomHeight,
      statusBarHeight,
      statusClass,
      statusText,
      formattedTime,
      participantPercent,
      participantAvatars,
      canRegister,
      toggleLike,
      handleRegister,
      toggleReminder,
      shareContent,
      back
    }
  }
}
</script>

<style scoped>
.detail-page {
  min-height: 100vh;
  background: var(--color-page);
}

.detail-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.detail-nav.immersive {
  background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 100%);
}

.nav-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
}

.nav-back {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-icon {
  font-size: 32px;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 1px 3px rgba(0,0,0,0.3);
}

.nav-title {
  font-size: 17px;
  font-weight: 600;
  color: #fff;
  text-shadow: 0 1px 3px rgba(0,0,0,0.3);
}

.nav-actions {
  width: 40px;
  display: flex;
  justify-content: flex-end;
}

.action-icon {
  font-size: 20px;
  color: #fff;
  text-shadow: 0 1px 3px rgba(0,0,0,0.3);
}

.event-cover {
  height: 200px;
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
  padding: 20px;
  background: #fff;
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
  color: var(--color-danger);
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

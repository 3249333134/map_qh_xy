<template>
  <view class="detail-page event-detail-livehouse">
    <!-- 沉浸式导航 -->
    <view class="detail-nav immersive">
      <view class="status-spacer" :style="{ height: statusBarHeight + 'px' }"></view>
      <view class="nav-row">
        <view class="nav-back" @tap="back">
          <text class="back-icon">‹</text>
        </view>
        <text class="nav-title">活动详情</text>
        <image class="nav-avatar" :src="eventData.avatar || '/static/logo.png'" mode="aspectFill" />
      </view>
    </view>

    <!-- 封面背景区 -->
    <view class="cover-bg" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="cover-bg-img"></view>
      <view class="cover-overlay"></view>

      <!-- 居中票卡 -->
      <view class="ticket-card">
        <view class="ticket-cover">
          <view class="ticket-cover-gradient"></view>
          <text class="ticket-band-name">{{ bandName }}</text>
          <view class="ticket-band-logo"></view>
          <view class="ticket-meta">
            <text class="ticket-place">{{ placeName }}</text>
            <text class="ticket-year">{{ tourYear }}</text>
            <text class="ticket-tour-label">CANVAS TOWNLET</text>
          </view>
        </view>
        <view class="ticket-torn-edge"></view>
        <view class="ticket-info">
          <view class="info-line">
            <text class="info-icon">🕒</text>
            <text class="info-text">{{ performTimeText }}</text>
          </view>
          <view class="info-line">
            <text class="info-icon">📍</text>
            <text class="info-text">{{ venueText }}</text>
          </view>
          <view class="info-line">
            <text class="info-icon">♡</text>
            <text class="info-text">{{ wantSeeCount }}人想看</text>
          </view>
          <view class="info-line price-line">
            <text class="info-icon">🎟</text>
            <text class="info-text price">¥ {{ ticketPrice }}</text>
          </view>
          <view class="ticket-divider"></view>
          <view class="ticket-title">
            <text class="ticket-city">【武汉】帆布小镇</text>
            <text class="ticket-show-name">{{ eventData.name }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 翻页指示 -->
    <view class="page-dots">
      <view class="dot active"></view>
      <view class="dot"></view>
      <view class="dot"></view>
    </view>

    <!-- 详情内容 -->
    <view class="detail-content">
      <!-- 演出信息大卡 -->
      <view class="show-info-card">
        <text class="card-header">{{ eventData.name }}</text>
        <view class="card-info-row">
          <text class="card-info-icon">🕒</text>
          <view class="card-info-body">
            <text class="card-info-main">{{ performTimeText }}</text>
            <text class="card-info-sub">约90分钟（以现场为准）</text>
          </view>
        </view>
        <view class="card-info-row">
          <text class="card-info-icon">📍</text>
          <view class="card-info-body">
            <text class="card-info-main">{{ venueText }}</text>
            <text class="card-info-sub">铭新街88号通城印巷7号楼L3L4 ›</text>
          </view>
        </view>
        <view class="card-price-row">
          <text class="card-price-label">票价</text>
          <text class="card-price-value">¥ {{ ticketPrice }}</text>
        </view>
      </view>

      <!-- 日期票选择器 -->
      <view class="date-picker-section">
        <view class="date-tabs">
          <view class="date-tab" v-for="d in dateList" :key="d.day" :class="{ active: selectedDay === d.day, booked: d.booked }" @tap="selectDay(d)">
            <text class="tab-month">3月</text>
            <text class="tab-day">{{ d.day }}</text>
          </view>
        </view>
      </view>

      <!-- 想看模块 -->
      <view class="want-see-card">
        <view class="ws-title">
          <text class="ws-icon">👁</text>
          <text class="ws-text">想看</text>
        </view>
        <view class="ws-row">
          <text class="ws-count">{{ wantSeeCount }}</text>
          <text class="ws-unit">人想看</text>
          <view class="ws-btn" :class="{ added: isWantSee }" @tap="toggleWantSee">
            <text class="ws-btn-icon">♥</text>
            <text class="ws-btn-text">{{ isWantSee ? '已添加' : '想看' }}</text>
          </view>
        </view>
      </view>

      <!-- 乐队信息 -->
      <view class="band-card">
        <image class="band-avatar" :src="eventData.avatar || '/static/logo.png'" mode="aspectFill" />
        <view class="band-info">
          <text class="band-name">帆布小镇乐队</text>
          <text class="band-meta">29.8万粉丝&nbsp;&nbsp;|&nbsp;&nbsp;12场在售演出</text>
        </view>
        <view class="band-follow-btn" @tap="toggleFollow">
          <text>{{ isFollowed ? '已关注' : '+关注' }}</text>
        </view>
      </view>

      <!-- 演出详情 -->
      <view class="show-detail-section">
        <view class="section-header-line">
          <view class="hl-line"></view>
          <text class="hl-text">演出详情</text>
          <view class="hl-line"></view>
        </view>
        <image class="detail-banner" :src="'/static/logo.png'" mode="aspectFill" />
        <text class="section-title">{{ eventData.name }}</text>
        <text class="desc-text">{{ eventData.description || '暂无演出详情介绍，敬请期待。' }}</text>
      </view>

      <!-- 底部占位 -->
      <view :style="{ height: (bottomHeight + 40) + 'px' }"></view>
    </view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <view class="bar-left">
        <view class="bar-action" @tap="toggleLike">
          <text class="bar-icon" :class="{ active: isLiked }">{{ isLiked ? '♥' : '♡' }}</text>
          <text class="bar-text">{{ eventData.likes || 0 }}</text>
        </view>
        <view class="bar-action" @tap="shareContent">
          <text class="bar-icon">↗</text>
          <text class="bar-text">分享</text>
        </view>
      </view>
      <view class="bar-right" :class="{ disabled: !canBook }" @tap="handleBook">
        <text class="bar-cta-text">{{ canBook ? '一键预约' : '已约满' }}</text>
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
      name: '心生炙热 2026巡演-武汉站',
      author: '帆布小镇乐队',
      avatar: '',
      description: '',
      address: '武汉市·MAOLivehouse',
      startTime: '2026-03-15T20:00:00',
      endTime: '2026-03-15T21:30:00',
      participants: 154,
      maxParticipants: 500,
      likes: 0,
      status: 'upcoming'
    })

    const isLiked = ref(false)
    const isRegistered = ref(false)
    const isReminded = ref(false)
    const isWantSee = ref(true)
    const isFollowed = ref(false)
    const contentId = ref('')
    const bottomHeight = ref(80)
    const statusBarHeight = ref(20)
    const selectedDay = ref(15)

    const dateList = ref([
      { day: 1, booked: true },
      { day: 8, booked: false },
      { day: 15, booked: false },
      { day: 20, booked: false },
      { day: 27, booked: true }
    ])

    const bandName = ref('帆布小镇')
    const placeName = ref('帆布小镇')
    const tourYear = ref('2026巡演')
    const ticketPrice = ref('120')
    const wantSeeCount = ref(154)

    const performTimeText = computed(() => {
      return '2026.3.15 周日 20：00'
    })

    const venueText = computed(() => {
      return eventData.value.address || '武汉市·MAOLivehouse'
    })

    const canBook = computed(() => {
      return eventData.value.status === 'upcoming' && !dateList.value.find(d => d.day === selectedDay.value)?.booked
    })

    const selectDay = (d) => {
      if (d.booked) {
        uni.showToast({ title: '该日期已售罄', icon: 'none' })
        return
      }
      selectedDay.value = d.day
    }

    const toggleWantSee = () => {
      isWantSee.value = !isWantSee.value
      if (isWantSee.value) wantSeeCount.value++
      else wantSeeCount.value--
      uni.showToast({ title: isWantSee.value ? '已添加想看' : '已取消', icon: 'none' })
    }

    const toggleFollow = () => {
      isFollowed.value = !isFollowed.value
      uni.showToast({ title: isFollowed.value ? '关注成功' : '已取消关注', icon: 'none' })
    }

    const toggleLike = () => {
      const state = contentInteractionApi.toggle(contentId.value, 'liked')
      isLiked.value = state.liked
      eventData.value.likes = (eventData.value.likes || 0) + (isLiked.value ? 1 : -1)
    }

    const handleBook = () => {
      if (!canBook.value) {
        uni.showToast({ title: '已约满', icon: 'none' })
        return
      }
      if (isRegistered.value) {
        uni.showModal({
          title: '取消预约',
          content: '确定要取消预约吗？',
          success: (res) => {
            if (res.confirm) {
              isRegistered.value = false
              eventData.value.participants--
              uni.showToast({ title: '已取消', icon: 'none' })
            }
          }
        })
      } else {
        uni.showModal({
          title: '确认预约',
          content: '确定预约此场演出吗？',
          success: (res) => {
            if (res.confirm) {
              try {
                isRegistered.value = true
                eventData.value.participants++
                uni.showToast({ title: '预约成功', icon: 'success' })
              } catch (e) {
                uni.showToast({ title: '预约失败', icon: 'none' })
              }
            }
          }
        })
      }
    }

    const shareContent = () => {
      uni.showToast({ title: '分享功能待实现', icon: 'none' })
    }

    const back = () => {
      uni.navigateBack()
    }

    const loadData = () => {
      try {
        const item = uni.getStorageSync('CONTENT_DETAIL_ACTIVE_V1') || uni.getStorageSync('INDEX_LAST_ITEM')
        if (item && item._id) {
          contentId.value = item.id || item._id
          eventData.value.name = item.name || item.title || '心生炙热 2026巡演-武汉站'
          eventData.value.author = item.author?.name || item.author || '帆布小镇乐队'
          eventData.value.avatar = item.avatar || ''
          eventData.value.description = item.description || ''
          eventData.value.address = item.address || '武汉市·MAOLivehouse'
          eventData.value.participants = item.participants || 154
          eventData.value.likes = item.likes || 0
          const actionState = contentInteractionApi.getState(contentId.value)
          isLiked.value = actionState.liked
          wantSeeCount.value = item.participants || 154
        }
      } catch (e) {
        console.warn('加载演出数据失败:', e)
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
      isWantSee,
      isFollowed,
      bottomHeight,
      statusBarHeight,
      dateList,
      selectedDay,
      bandName,
      placeName,
      tourYear,
      ticketPrice,
      wantSeeCount,
      performTimeText,
      venueText,
      canBook,
      selectDay,
      toggleWantSee,
      toggleFollow,
      toggleLike,
      handleBook,
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

/* ========= 沉浸式导航 ========= */
.detail-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.detail-nav.immersive {
  background: linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 100%);
}

.nav-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
}

.nav-back {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(10px);
}

.back-icon {
  font-size: 30px;
  font-weight: bold;
  color: var(--color-text);
  line-height: 30px;
}

.nav-title {
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 2px 8px rgba(0,0,0,0.3);
  letter-spacing: 1px;
}

.nav-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.9);
  overflow: hidden;
}

/* ========= 封面背景 ========= */
.cover-bg {
  min-height: 680rpx;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.cover-bg-img {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 30%, #86efac 0%, transparent 40%),
    radial-gradient(circle at 80% 70%, #fcd34d 0%, transparent 45%),
    linear-gradient(180deg, var(--color-text-body) 0%, var(--color-text) 100%);
}

.cover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.1) 50%, rgba(243,244,246,1) 100%);
}

/* ========= 票卡 ========= */
.ticket-card {
  width: 560rpx;
  position: relative;
  z-index: 10;
  background: linear-gradient(160deg, #ef4444 0%, #dc2626 60%, #b91c1c 100%);
  border-radius: 24px;
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.ticket-cover {
  height: 360rpx;
  padding: 40rpx 40rpx 0;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-height: 180px;
  border-radius: 24px 24px 0 0;
}

.ticket-cover-gradient {
  position: absolute;
  top: 0; right: 0;
  width: 80%;
  height: 100%;
  background: radial-gradient(circle at 90% 60%, rgba(255,255,255,0.18) 0%, transparent 60%);
}

.ticket-band-name {
  position: relative;
  font-weight: 900;
  color: #ffffff;
  letter-spacing: 6rpx;
  text-shadow: 0 4rpx 12rpx rgba(0,0,0,0.2);
  font-family: "STKaiti","KaiTi",serif;
  margin-bottom: 30rpx;
  font-size: 30px;
  line-height: 1.3;
}

.ticket-band-logo {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: #ffffff;
  margin: 0 auto;
  position: relative;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 40rpx rgba(0, 0, 0, 0.1);
  display: none;
}

.ticket-band-logo::before {
  content: '★';
  font-size: 80rpx;
  color: #ef4444;
  text-shadow: 0 0 20rpx rgba(239,68,68,0.6);
  transform: rotate(8deg);
}

.ticket-meta {
  position: absolute;
  bottom: 24rpx;
  left: 32rpx;
  right: 32rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: rgba(255,255,255,0.92);
}

.ticket-place {
  font-size: 22rpx;
  font-weight: 600;
  letter-spacing: 1rpx;
}

.ticket-year {
  font-size: 20rpx;
  letter-spacing: 1rpx;
}

.ticket-tour-label {
  font-size: 18rpx;
  letter-spacing: 1rpx;
  opacity: 0.85;
  display: none;
}

.ticket-torn-edge {
  height: 28rpx;
  background: linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 40%, #ef4444 40%, #ef4444 100%);
  position: relative;
}

.ticket-torn-edge::before,
.ticket-torn-edge::after {
  content: '';
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: var(--color-surface-muted);
  z-index: 5;
}

.ticket-torn-edge::before { left: -28rpx; }
.ticket-torn-edge::after { right: -28rpx; }

.ticket-info {
  position: relative;
  padding: 20px;
  background: #fff;
}

.ticket-info::before {
  content: '';
  position: absolute;
  left: 40rpx;
  right: 40rpx;
  top: -2rpx;
  height: 2rpx;
  background-image: repeating-linear-gradient(90deg, rgba(255,255,255,0.6) 0 8rpx, transparent 8rpx 16rpx);
}

.info-line {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 10rpx 0;
}

.info-icon {
  font-size: 26rpx;
  color: rgba(255,255,255,0.9);
  width: 30rpx;
  text-align: center;
}

.info-text {
  font-size: 26rpx;
  color: #ffffff;
  font-weight: 500;
}

.info-text.price {
  font-size: 30rpx;
  font-weight: 700;
  letter-spacing: 1rpx;
}

.ticket-divider {
  height: 2rpx;
  background: rgba(255,255,255,0.2);
  margin: 16rpx 0;
}

.ticket-title {
  padding-top: 8rpx;
}

.ticket-city {
  font-size: 30rpx;
  color: #ffffff;
  font-weight: 700;
  letter-spacing: 1rpx;
  margin-bottom: 6rpx;
  display: none;
}

.ticket-show-name {
  display: block;
  font-size: 28rpx;
  color: rgba(255,255,255,0.92);
  line-height: 1.5;
}

/* ========= 翻页点 ========= */
.page-dots {
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  padding: 24rpx 0 32rpx;
  position: relative;
  margin-top: -40rpx;
  z-index: 12;
  display: none;
}

.dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: rgba(0,0,0,0.18);
}

.dot.active {
  width: 36rpx;
  border-radius: 6rpx;
  background: var(--color-text);
}

/* ========= 详情内容 ========= */
.detail-content {
  padding: 0 24rpx;
  background: var(--color-surface-muted);
  min-height: 600rpx;
}

/* 演出信息大卡 */
.show-info-card {
  background: rgba(31, 41, 55, 0.92);
  margin-bottom: 28rpx;
  backdrop-filter: blur(10px);
  border-radius: 22px;
  padding: 20px;
  box-shadow: none;
}

.card-header {
  display: block;
  font-size: 32rpx;
  color: #ffffff;
  font-weight: 700;
  line-height: 1.5;
  margin-bottom: 28rpx;
  letter-spacing: 0.5rpx;
}

.card-info-row {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  padding: 14rpx 0;
  border-bottom: 1rpx solid rgba(255,255,255,0.08);
}

.card-info-row:last-of-type {
  border-bottom: none;
  padding-bottom: 4rpx;
}

.card-info-icon {
  font-size: 28rpx;
  margin-top: 2rpx;
  flex-shrink: 0;
}

.card-info-body {
  flex: 1;
}

.card-info-main {
  display: block;
  font-size: 26rpx;
  color: var(--color-surface-raised);
  font-weight: 600;
  margin-bottom: 4rpx;
}

.card-info-sub {
  display: block;
  font-size: 22rpx;
  color: rgba(249,250,251,0.65);
  line-height: 1.5;
}

.card-price-row {
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: 10rpx;
  padding-top: 20rpx;
}

.card-price-label {
  font-size: 22rpx;
  color: rgba(249,250,251,0.65);
}

.card-price-value {
  font-size: 44rpx;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: 1rpx;
}

/* 日期票选择器 */
.date-picker-section {
  margin-bottom: 28rpx;
}

.date-tabs {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16rpx;
  padding: 0 8rpx;
}

.date-tab {
  flex: 1;
  background: rgba(31, 41, 55, 0.85);
  padding: 22rpx 0 26rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
  transform: skewX(-4deg);
  box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.1);
  position: relative;
  min-height: 56px;
  border-radius: 16px;
}

.date-tab.active {
  transform: skewX(-4deg) translateY(-12rpx);
  box-shadow: 0 16rpx 30rpx rgba(0, 0, 0, 0.1);
  background: #e0f2ec;
  color: #286c5c;
}

.date-tab.booked {
  background: rgba(156,163,175,0.4);
}

.date-tab::after {
  content: '';
  position: absolute;
  top: 12rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: rgba(255,255,255,0.3);
}

.date-tab.active::after {
  background: rgba(255,255,255,0.6);
}

.tab-month {
  font-size: 24rpx;
  color: rgba(255,255,255,0.75);
  font-weight: 500;
  transform: skewX(4deg);
}

.tab-day {
  font-size: 52rpx;
  font-weight: 800;
  color: #ffffff;
  line-height: 1.1;
  transform: skewX(4deg);
  letter-spacing: 2rpx;
}

.date-tab.booked .tab-day {
  opacity: 0.6;
  text-decoration: line-through;
}

/* 想看模块 */
.want-see-card {
  background: rgba(31, 41, 55, 0.92);
  padding: 30rpx 32rpx 28rpx;
  margin-bottom: 28rpx;
  border: 2rpx solid rgba(255,255,255,0.08);
  border-radius: 22px;
  box-shadow: none;
}

.ws-title {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 18rpx;
}

.ws-icon {
  font-size: 36rpx;
}

.ws-text {
  font-size: 32rpx;
  color: #ffffff;
  font-weight: 700;
  letter-spacing: 1rpx;
}

.ws-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.ws-count {
  font-size: 68rpx;
  font-weight: 800;
  color: #ffffff;
  line-height: 1;
  letter-spacing: 2rpx;
}

.ws-unit {
  font-size: 26rpx;
  color: rgba(255,255,255,0.65);
  margin-right: auto;
  padding-left: 4rpx;
}

.ws-btn {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 16rpx 28rpx;
  border-radius: 40rpx;
  background: rgba(255,255,255,0.08);
  border: 2rpx solid rgba(255,255,255,0.12);
}

.ws-btn.added {
  background: linear-gradient(135deg, rgba(239,68,68,0.9), rgba(220,38,38,0.9));
  border-color: rgba(239,68,68,0.5);
}

.ws-btn-icon {
  font-size: 28rpx;
  color: #ef4444;
}

.ws-btn.added .ws-btn-icon {
  color: #ffffff;
}

.ws-btn-text {
  font-size: 24rpx;
  font-weight: 600;
  color: #ffffff;
}

/* 乐队信息卡 */
.band-card {
  background: rgba(31, 41, 55, 0.92);
  border-radius: 24rpx;
  padding: 22rpx 24rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 28rpx;
}

.band-avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 20rpx;
  overflow: hidden;
  flex-shrink: 0;
  border: 2rpx solid rgba(255,255,255,0.1);
}

.band-info {
  flex: 1;
  min-width: 0;
}

.band-name {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 6rpx;
}

.band-meta {
  display: block;
  font-size: 22rpx;
  color: rgba(255,255,255,0.6);
}

.band-follow-btn {
  padding: 12rpx 24rpx;
  border-radius: 40rpx;
  background: rgba(255,255,255,0.08);
  border: 2rpx solid rgba(255,255,255,0.18);
  flex-shrink: 0;
}

.band-follow-btn text {
  font-size: 22rpx;
  font-weight: 600;
  color: #ffffff;
}

/* 演出详情 */
.show-detail-section {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx 24rpx 32rpx;
  overflow: hidden;
}

.section-header-line {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
  margin-bottom: 24rpx;
}

.hl-line {
  flex: 1;
  height: 1rpx;
  background: var(--color-border);
  max-width: 80rpx;
}

.hl-text {
  font-size: 24rpx;
  color: var(--color-text-muted);
  letter-spacing: 4rpx;
  font-weight: 500;
}

.detail-banner {
  width: 100%;
  height: 320rpx;
  border-radius: 18rpx;
  margin-bottom: 24rpx;
  background: #ef4444;
}

.section-title {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 16rpx;
}

.desc-text {
  display: block;
  font-size: 26rpx;
  color: var(--color-text-body);
  line-height: 1.8;
}

/* ========= 底部操作栏 ========= */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 14rpx 24rpx;
  padding-bottom: calc(14rpx + env(safe-area-inset-bottom));
  background: rgba(250,253,252,.92);
  backdrop-filter: blur(24px) saturate(125%);
  -webkit-backdrop-filter: blur(24px) saturate(125%);
  box-shadow: var(--shadow-float);
  border-top: 1px solid rgba(255,255,255,.8);
  border-radius: 24px 24px 0 0;
  z-index: 80;
}

.bar-left {
  display: flex;
  gap: 32rpx;
}

.bar-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
  min-width: 60rpx;
}

.bar-icon {
  font-size: 36rpx;
  color: var(--color-text-muted);
}

.bar-icon.active {
  color: #ef4444;
}

.bar-text {
  font-size: 20rpx;
  color: var(--color-text-muted);
  font-weight: 500;
}

.bar-right {
  margin-left: auto;
  padding: 24rpx 120rpx;
  box-shadow: 0 10rpx 28rpx rgba(0, 0, 0, 0.1);
  min-height: 48px;
  border-radius: 16px;
  background: #263d32;
}

.bar-right.disabled {
  background: var(--color-text-muted);
  box-shadow: none;
}

.bar-cta-text {
  font-size: 30rpx;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 2rpx;
}
</style>

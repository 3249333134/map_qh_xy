<template>
  <view class="detail-page service-detail">
    <!-- 服务封面 -->
    <view class="service-cover">
      <view class="cover-map-grid"></view>
      <view class="cover-marker">
        <view class="marker-dot"></view>
        <view class="marker-pulse"></view>
      </view>
      <view class="cover-badge">服务</view>
      <view class="cover-rating">
        <text class="rating-score">{{ serviceData.rating }}</text>
        <text class="rating-label">分</text>
      </view>
    </view>

    <!-- 顶部导航 -->
    <view class="detail-nav">
      <view class="nav-back" @tap="back">
        <view class="back-btn">
          <text class="back-icon">‹</text>
        </view>
      </view>
      <text class="nav-title">服务详情</text>
      <view class="nav-actions">
        <view class="share-btn" @tap="shareContent">
          <text class="action-icon">↗</text>
        </view>
      </view>
    </view>

    <!-- 基本信息 -->
    <view class="service-header">
      <text class="service-title">{{ serviceData.name || serviceData.title || '服务名称' }}</text>
      <view class="service-author">
        <image class="author-avatar" :src="serviceData.avatar || '/static/logo.png'" mode="aspectFill" />
        <text class="author-name">{{ serviceData.author || '服务商' }}</text>
      </view>
    </view>

    <!-- 预约时段 -->
    <view class="reserve-section">
      <view class="section-header">
        <text class="section-title">预约时段</text>
        <text class="section-subtitle">今日剩余 {{ availableCount }} 个时段</text>
      </view>

      <!-- 时段分组 -->
      <view class="time-groups">
        <view class="time-group">
          <text class="group-label">上午</text>
          <view class="time-slots">
            <view
              v-for="slot in morningSlots"
              :key="slot.time"
              class="time-slot"
              :class="{ active: selectedSlot === slot.time, booked: !slot.available }"
              @tap="selectSlot(slot)">
              <text>{{ slot.time }}</text>
            </view>
          </view>
        </view>

        <view class="time-group">
          <text class="group-label">下午</text>
          <view class="time-slots">
            <view
              v-for="slot in afternoonSlots"
              :key="slot.time"
              class="time-slot"
              :class="{ active: selectedSlot === slot.time, booked: !slot.available }"
              @tap="selectSlot(slot)">
              <text>{{ slot.time }}</text>
            </view>
          </view>
        </view>

        <view class="time-group">
          <text class="group-label">晚上</text>
          <view class="time-slots">
            <view
              v-for="slot in eveningSlots"
              :key="slot.time"
              class="time-slot"
              :class="{ active: selectedSlot === slot.time, booked: !slot.available }"
              @tap="selectSlot(slot)">
              <text>{{ slot.time }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 服务介绍 -->
    <view class="info-section">
      <text class="section-title">服务介绍</text>
      <text class="info-text">{{ serviceData.description || '暂无服务介绍' }}</text>
    </view>

    <!-- 服务信息 -->
    <view class="service-info">
      <view class="info-row">
        <text class="info-icon">📍</text>
        <text class="info-label">服务地址</text>
        <text class="info-value">{{ locationText }}</text>
      </view>
      <view class="info-row">
        <text class="info-icon">📞</text>
        <text class="info-label">联系电话</text>
        <text class="info-value clickable" @tap="callPhone">138****8888</text>
      </view>
      <view class="info-row">
        <text class="info-icon">⏰</text>
        <text class="info-label">营业时间</text>
        <text class="info-value">09:00 - 21:00</text>
      </view>
      <view class="info-row">
        <text class="info-icon">💰</text>
        <text class="info-label">服务价格</text>
        <text class="info-value price">¥ {{ serviceData.price || '88' }} 起</text>
      </view>
    </view>

    <!-- 用户评价 -->
    <view class="reviews-section">
      <view class="section-header">
        <text class="section-title">用户评价</text>
        <text class="review-count">({{ reviews.length }})</text>
      </view>
      <view class="reviews-list">
        <view class="review-item" v-for="review in reviews" :key="review.id">
          <image class="review-avatar" :src="review.avatar || '/static/logo.png'" mode="aspectFill" />
          <view class="review-body">
            <view class="review-header">
              <text class="review-name">{{ review.name }}</text>
              <view class="review-stars">
                <text v-for="i in 5" :key="i" :class="{ filled: i <= review.rating }">★</text>
              </view>
            </view>
            <text class="review-content">{{ review.content }}</text>
            <text class="review-time">{{ review.time }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部占位 -->
    <view :style="{ height: bottomHeight + 'px' }"></view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <view class="bar-left">
        <view class="bar-action" @tap="toggleCollect">
          <text :class="{ active: isCollected }">{{ isCollected ? '★' : '☆' }}</text>
          <text>收藏</text>
        </view>
        <view class="bar-action" @tap="callPhone">
          <text>📞</text>
          <text>电话</text>
        </view>
      </view>
      <view class="bar-right" :class="{ disabled: !canReserve }" @tap="handleReserve">
        <text>{{ canReserve ? '立即预约' : '已约满' }}</text>
      </view>
    </view>
  </view>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useInteraction } from '../../../utils/interaction.js'

export default {
  name: 'ServiceDetail',
  setup() {
    const serviceData = ref({
      name: '',
      title: '',
      author: '',
      description: '',
      rating: 4.8,
      price: 88,
      likes: 0,
      location: null,
      address: ''
    })

    const isCollected = ref(false)
    const selectedSlot = ref('')
    const bottomHeight = ref(80)
    const reviews = ref([])

    const interaction = useInteraction()

    // 生成时段
    const morningSlots = ref([
      { time: '09:00', available: true },
      { time: '09:30', available: true },
      { time: '10:00', available: false },
      { time: '10:30', available: true },
      { time: '11:00', available: true },
      { time: '11:30', available: false }
    ])

    const afternoonSlots = ref([
      { time: '14:00', available: true },
      { time: '14:30', available: true },
      { time: '15:00', available: true },
      { time: '15:30', available: false },
      { time: '16:00', available: true },
      { time: '16:30', available: true }
    ])

    const eveningSlots = ref([
      { time: '18:00', available: true },
      { time: '18:30', available: false },
      { time: '19:00', available: true },
      { time: '19:30', available: true },
      { time: '20:00', available: false },
      { time: '20:30', available: false }
    ])

    const availableCount = computed(() => {
      const all = [...morningSlots.value, ...afternoonSlots.value, ...eveningSlots.value]
      return all.filter(s => s.available).length
    })

    const canReserve = computed(() => {
      return selectedSlot.value && availableCount.value > 0
    })

    const locationText = computed(() => {
      if (serviceData.value.location && serviceData.value.location.coordinates) {
        const [lng, lat] = serviceData.value.location.coordinates
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
      }
      return serviceData.value.address || '地址信息'
    })

    const selectSlot = (slot) => {
      if (!slot.available) {
        uni.showToast({ title: '该时段已被预约', icon: 'none' })
        return
      }
      selectedSlot.value = slot.time
    }

    const toggleCollect = () => {
      const cardId = serviceData.value._id || serviceData.value.id
      isCollected.value = interaction.toggleFavorite(cardId, serviceData.value)
      uni.showToast({
        title: isCollected.value ? '已收藏' : '取消收藏',
        icon: 'none'
      })
    }

    const handleReserve = () => {
      if (!selectedSlot.value) {
        uni.showToast({ title: '请先选择预约时段', icon: 'none' })
        return
      }
      if (!canReserve.value) {
        uni.showToast({ title: '已约满', icon: 'none' })
        return
      }

      uni.showModal({
        title: '确认预约',
        content: `确定预约 ${selectedSlot.value} 的服务吗？`,
        success: (res) => {
          if (res.confirm) {
            uni.showToast({ title: '预约成功', icon: 'success' })
            // 将该时段标记为已预约
            const allSlots = [...morningSlots.value, ...afternoonSlots.value, ...eveningSlots.value]
            const slot = allSlots.find(s => s.time === selectedSlot.value)
            if (slot) slot.available = false
            selectedSlot.value = ''
          }
        }
      })
    }

    const callPhone = () => {
      uni.showToast({ title: '电话功能待实现', icon: 'none' })
    }

    const shareContent = () => {
      uni.showToast({ title: '分享功能待实现', icon: 'none' })
    }

    const back = () => {
      uni.navigateBack()
    }

    const loadData = () => {
      try {
        const item = uni.getStorageSync('INDEX_LAST_ITEM')
        if (item && item._id) {
          serviceData.value = { ...serviceData.value, ...item }
          const cardId = item._id || item.id
          isCollected.value = interaction.isFavorited(cardId)
        }
      } catch (e) {
        console.warn('加载服务数据失败:', e)
      }

      reviews.value = generateMockReviews()
    }

    const generateMockReviews = () => {
      const names = ['王先生', '李女士', '张先生', '赵女士', '陈先生']
      const contents = [
        '服务非常专业，强烈推荐！',
        '环境不错，态度也好',
        '性价比高，下次还来',
        '提前预约很方便',
        '体验很好，满意'
      ]
      return names.map((name, i) => ({
        id: i + 1,
        name,
        avatar: '/static/logo.png',
        content: contents[i],
        rating: Math.floor(Math.random() * 2) + 4,
        time: `${i + 1}天前`
      }))
    }

    onMounted(() => {
      loadData()
    })

    return {
      serviceData,
      isCollected,
      selectedSlot,
      bottomHeight,
      reviews,
      morningSlots,
      afternoonSlots,
      eveningSlots,
      availableCount,
      canReserve,
      locationText,
      selectSlot,
      toggleCollect,
      handleReserve,
      callPhone,
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

.service-cover {
  height: 800rpx;
  position: relative;
  background: linear-gradient(135deg, #e0f2fe 0%, #f0fdf4 54%, #fff7ed 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-map-grid {
  position: absolute;
  inset: 0;
  opacity: 0.75;
  background-image:
    linear-gradient(90deg, rgba(100, 116, 139, 0.14) 1px, transparent 1px),
    linear-gradient(rgba(100, 116, 139, 0.12) 1px, transparent 1px),
    linear-gradient(145deg, transparent 0 44%, rgba(14, 165, 233, 0.22) 44% 49%, transparent 49% 100%);
  background-size: 34px 34px, 34px 34px, 100% 100%;
}

.cover-marker {
  position: relative;
  width: 60px;
  height: 60px;
  z-index: 2;
}

.marker-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #0ea5e9;
  border: 6px solid #fff;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
}

.marker-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(14, 165, 233, 0.2);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: translate(-50%, -50%) scale(0.8); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
}

.cover-badge {
  position: absolute;
  top: 16px;
  left: 16px;
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  font-size: 13px;
  font-weight: 600;
  color: #0369a1;
}

.cover-rating {
  position: absolute;
  top: 16px;
  right: 16px;
  padding: 6px 14px;
  background: rgba(255, 251, 235, 0.95);
  border-radius: 16px;
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.rating-score {
  font-size: 15px;
  font-weight: 700;
  color: #b45309;
}

.rating-label {
  font-size: 11px;
  color: #b45309;
}

.service-header {
  padding: 32rpx;
  background: #fff;
  margin-top: -40rpx;
  border-top-left-radius: 32rpx;
  border-top-right-radius: 32rpx;
  position: relative;
  z-index: 10;
}

.service-title {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1.4;
  margin-bottom: 12px;
}

.service-author {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.author-name {
  font-size: 14px;
  color: #666;
}

.reserve-section {
  padding: 20px 16px;
  background: #fff;
  margin-top: 8px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.section-subtitle {
  font-size: 12px;
  color: #07c160;
}

.time-groups {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.time-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.group-label {
  font-size: 13px;
  font-weight: 500;
  color: #999;
}

.time-slots {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.time-slot {
  min-width: 70px;
  padding: 8px 14px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  text-align: center;
  background: #fff;
}

.time-slot text {
  font-size: 13px;
  color: #333;
}

.time-slot.active {
  border-color: #0ea5e9;
  background: #e0f2fe;
}

.time-slot.active text {
  color: #0369a1;
  font-weight: 500;
}

.time-slot.booked {
  background: #f5f5f5;
  border-color: #eee;
}

.time-slot.booked text {
  color: #ccc;
  text-decoration: line-through;
}

.info-section {
  padding: 20px 16px;
  background: #fff;
  margin-top: 8px;
}

.info-text {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.service-info {
  margin: 8px 16px;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
}

.info-row:not(:last-child) {
  border-bottom: 1px solid #f5f5f5;
}

.info-icon {
  font-size: 18px;
}

.info-label {
  flex: 1;
  font-size: 14px;
  color: #666;
}

.info-value {
  font-size: 14px;
  color: #333;
  text-align: right;
}

.info-value.clickable {
  color: #0ea5e9;
}

.info-value.price {
  color: #ff6b6b;
  font-weight: 600;
}

.reviews-section {
  padding: 20px 16px;
  background: #fff;
  margin-top: 8px;
}

.review-count {
  font-size: 13px;
  color: #999;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-item {
  display: flex;
  gap: 12px;
}

.review-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
}

.review-body {
  flex: 1;
}

.review-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.review-name {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.review-stars {
  display: flex;
  gap: 2px;
}

.review-stars text {
  font-size: 12px;
  color: #ddd;
}

.review-stars text.filled {
  color: #ffc107;
}

.review-content {
  display: block;
  font-size: 14px;
  color: #333;
  line-height: 1.5;
  margin-bottom: 6px;
}

.review-time {
  font-size: 11px;
  color: #999;
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
  color: #ffc107;
}

.bar-action text:last-child {
  font-size: 10px;
  color: #999;
}

.bar-right {
  margin-left: auto;
  padding: 12px 32px;
  background: linear-gradient(135deg, #0ea5e9 0%, #22c55e 100%);
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
</style>

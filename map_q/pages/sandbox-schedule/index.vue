<template>
  <view class="page">
    <view class="status-spacer" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="nav-bar">
      <view class="nav-back" @tap="goBack">‹</view>
      <text class="nav-title">定时发布</text>
      <view class="nav-right cta" @tap="onDone">完成</view>
    </view>

    <view class="content">
      <view class="card">
        <text class="card-title">选择日期</text>
        <view class="week-grid">
          <view
            v-for="d in days"
            :key="d.key"
            class="day-cell"
            :class="{ active: d.active }"
            @tap="onDay(d)"
          >
            <text class="day-week">{{ d.week }}</text>
            <text class="day-num">{{ d.num }}</text>
          </view>
        </view>
      </view>

      <view class="card">
        <text class="card-title">选择时间</text>
        <view class="time-chips">
          <view
            v-for="t in times"
            :key="t"
            class="time-chip"
            :class="{ active: selectedTime === t }"
            @tap="selectedTime = t"
          >{{ t }}</view>
        </view>
      </view>

      <view class="note-card">
        <text class="note-title">到时自动发布</text>
        <text class="note-desc">到时后自动转为发布流程，仍会保留预览确认。可提前在「我的 - 创作管理」取消或修改。</text>
      </view>

      <view class="summary-card">
        <text class="summary-label">将发布于</text>
        <text class="summary-value">{{ selectedDayLabel }} · {{ selectedTime }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const statusBarHeight = ref(20)
const days = ref([
  { key: 'mon', week: '一', num: '21', active: false, label: '周一 7/21' },
  { key: 'tue', week: '二', num: '22', active: false, label: '周二 7/22' },
  { key: 'wed', week: '三', num: '23', active: true, label: '周三 7/23' },
  { key: 'thu', week: '四', num: '24', active: false, label: '周四 7/24' },
  { key: 'fri', week: '五', num: '25', active: false, label: '周五 7/25' },
  { key: 'sat', week: '六', num: '26', active: false, label: '周六 7/26' },
  { key: 'sun', week: '日', num: '27', active: false, label: '周日 7/27' }
])
const times = ['09:00', '12:30', '18:00', '21:00']
const selectedTime = ref('12:30')

const selectedDayLabel = computed(() => {
  const d = days.value.find(item => item.active)
  return d ? d.label : ''
})

onMounted(() => {
  try {
    const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
    statusBarHeight.value = info.statusBarHeight || 20
  } catch (e) {}
})

const goBack = () => uni.navigateBack()
const onDay = (d) => {
  days.value.forEach(item => { item.active = item.key === d.key })
}
const onDone = () => {
  uni.showToast({ title: '已设定定时发布', icon: 'success' })
  setTimeout(goBack, 800)
}
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

.card {
  padding: 28rpx 24rpx;
  border-radius: 14rpx;
  background: #ffffff;
  box-shadow: 0 1px 8px rgba(18, 24, 38, 0.06);
}

.card-title {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #222;
}

.week-grid {
  margin-top: 20rpx;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8rpx;
}

.day-cell {
  padding: 16rpx 0;
  border-radius: 14rpx;
  background: #f0f1f3;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.day-cell.active {
  background: #248cf5;
}

.day-week {
  font-size: 22rpx;
  color: #8a8f98;
}

.day-cell.active .day-week {
  color: rgba(255, 255, 255, 0.8);
}

.day-num {
  margin-top: 6rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: #222;
}

.day-cell.active .day-num {
  color: #ffffff;
}

.time-chips {
  margin-top: 20rpx;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 12rpx;
}

.time-chip {
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  background: #f0f1f3;
  color: #5f646d;
  font-size: 28rpx;
  font-weight: 600;
}

.time-chip.active {
  background: #ff7043;
  color: #ffffff;
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

.summary-card {
  margin-top: 20rpx;
  padding: 28rpx 24rpx;
  border-radius: 14rpx;
  background: linear-gradient(135deg, #248cf5 0%, #7650c8 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.summary-label {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.85);
}

.summary-value {
  font-size: 30rpx;
  font-weight: 700;
  color: #ffffff;
}
</style>

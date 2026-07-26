<template>
  <view class="booking-page">
    <GlobalNavBar :title="success ? '预约成功' : '预约确认'">
      <template #left><view class="nav-back" @tap="goBack">‹</view></template>
    </GlobalNavBar>

    <view v-if="!success" class="page-content" :style="{ paddingTop: topOffset + 'px' }">
      <view class="summary-card">
        <text class="booking-title">{{ title }} 预约</text>
        <text class="booking-desc">确认服务项目、时间和联系人信息</text>
      </view>

      <view class="form-card">
        <view class="field-row">
          <text class="field-label">服务项目</text>
          <text class="field-value">{{ serviceName }}</text>
        </view>
        <view class="field-block">
          <text class="field-label">预约日期</text>
          <scroll-view class="date-scroll" scroll-x show-scrollbar="false">
            <view class="date-list">
              <view v-for="date in dates" :key="date.value" class="date-chip" :class="{ active: selectedDate === date.value }" @tap="selectedDate = date.value">
                <text class="date-week">{{ date.week }}</text><text class="date-day">{{ date.day }}</text>
              </view>
            </view>
          </scroll-view>
        </view>
        <view class="field-block">
          <text class="field-label">预约时间</text>
          <view class="time-grid">
            <view v-for="slot in slots" :key="slot" class="time-chip" :class="{ active: selectedTime === slot }" @tap="selectedTime = slot">{{ slot }}</view>
          </view>
        </view>
        <view class="field-row">
          <text class="field-label">联系人</text>
          <input v-model="contact" class="field-input" placeholder="请输入联系人" />
        </view>
        <view class="field-row">
          <text class="field-label">手机号</text>
          <input v-model="phone" class="field-input" type="number" maxlength="11" placeholder="请输入手机号" />
        </view>
        <view class="field-row note-row">
          <text class="field-label">备注</text>
          <input v-model="note" class="field-input" placeholder="选填，如到店需求" />
        </view>
      </view>

      <view class="state-card">
        <text class="state-title">预约后状态</text>
        <text class="state-copy">确认后详情页会显示已预约状态，消息中心同步收到“服务助手”通知。</text>
      </view>
    </view>

    <view v-else class="success-state" :style="{ paddingTop: topOffset + 'px' }">
      <view class="success-mark">✓</view>
      <text class="success-title">预约成功</text>
      <text class="success-desc">{{ selectedDate }} {{ selectedTime }} · {{ title }}</text>
      <text class="success-copy">服务助手会在消息中心同步提醒，并在服务开始前再次通知。</text>
      <view class="success-actions">
        <view class="secondary-btn" @tap="goMessages">查看消息</view>
        <view class="primary-btn" @tap="goBack">完成</view>
      </view>
    </view>

    <view v-if="!success" class="booking-footer" :style="{ paddingBottom: safeBottom + 'px' }">
      <view class="price-area"><text class="price">¥ 0</text><text class="price-note">无需预付，现场确认</text></view>
      <view class="confirm-btn" :class="{ disabled: !canSubmit }" @tap="confirmBooking">确认预约</view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import GlobalNavBar from '../../components/common/GlobalNavBar.vue'

const item = ref({})
const source = ref('service')
const selectedDate = ref('今天')
const selectedTime = ref('19:30')
const contact = ref('用户495')
const phone = ref('13800004950')
const note = ref('')
const success = ref(false)
const topOffset = ref(68)
const safeBottom = ref(0)

const dates = [
  { value: '今天', week: '今天', day: '21' },
  { value: '明天', week: '明天', day: '22' },
  { value: '周四', week: '周四', day: '23' },
  { value: '周五', week: '周五', day: '24' },
  { value: '周六', week: '周六', day: '25' }
]
const slots = ['09:30', '11:00', '14:00', '16:30', '19:30', '20:30']

const title = computed(() => item.value.name || item.value.title || '推荐服务')
const serviceName = computed(() => item.value.serviceName || item.value.category || '到店咨询 / 场地预约')
const canSubmit = computed(() => selectedDate.value && selectedTime.value && contact.value.trim() && /^1\d{10}$/.test(phone.value))

onLoad(options => {
  source.value = options?.source || 'service'
  try {
    item.value = uni.getStorageSync('BOOKING_ITEM') || uni.getStorageSync('SERVICE_LAST_ITEM') || uni.getStorageSync('INDEX_LAST_ITEM') || {}
    const metrics = uni.getStorageSync('TOP_NAV_METRICS')
    if (metrics?.totalPx) topOffset.value = metrics.totalPx
    const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
    safeBottom.value = info.safeAreaInsets?.bottom || Math.max(0, (info.screenHeight || 0) - (info.safeArea?.bottom || info.screenHeight || 0))
  } catch (e) {}
})

function confirmBooking() {
  if (!canSubmit.value) {
    uni.showToast({ title: '请完整填写预约信息', icon: 'none' })
    return
  }
  const booking = {
    id: `booking_${Date.now()}`,
    item: item.value,
    title: title.value,
    date: selectedDate.value,
    time: selectedTime.value,
    contact: contact.value,
    phone: phone.value,
    note: note.value,
    status: 'confirmed',
    createdAt: Date.now()
  }
  try {
    const list = uni.getStorageSync('BOOKING_LIST') || []
    uni.setStorageSync('BOOKING_LIST', [booking, ...list])
    uni.setStorageSync('BOOKING_LAST_RESULT', booking)
  } catch (e) {}
  success.value = true
}

function goBack() {
  if (success.value) {
    uni.navigateBack({ fail: () => uni.switchTab({ url: source.value === 'index' ? '/pages/index/index' : '/pages/service/index' }) })
    return
  }
  uni.navigateBack()
}
function goMessages() { uni.switchTab({ url: '/pages/message/index' }) }
</script>

<style scoped>
.booking-page { min-height: 100vh; background: #f7f8fa; color: #222; }
.nav-back { width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: #f2f3f5; color: #30343b; font-size: 28px; line-height: 28px; }
.page-content { padding-left: 14px; padding-right: 14px; padding-bottom: 112px; box-sizing: border-box; }
.summary-card,.form-card,.state-card { margin-top: 12px; padding: 15px; border-radius: 12px; background: #fff; box-shadow: 0 1px 8px rgba(18,24,38,.06); }
.booking-title,.booking-desc { display: block; }
.booking-title { color: #20242a; font-size: 22px; line-height: 30px; font-weight: 800; }
.booking-desc { margin-top: 8px; color: #68707b; font-size: 14px; line-height: 22px; }
.field-row { min-height: 54px; display: flex; align-items: center; justify-content: space-between; gap: 14px; border-bottom: 1px solid #eee; }
.field-block { padding: 15px 0; border-bottom: 1px solid #eee; }
.note-row { border-bottom: 0; }
.field-label { color: #5f6670; font-size: 14px; }
.field-value { flex: 1; text-align: right; color: #252a31; font-size: 14px; font-weight: 600; }
.field-input { flex: 1; height: 42px; text-align: right; color: #252a31; font-size: 14px; }
.date-scroll { width: 100%; margin-top: 12px; white-space: nowrap; }
.date-list { display: inline-flex; gap: 8px; padding-right: 10px; }
.date-chip { width: 58px; height: 58px; display: inline-flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 12px; background: #f2f4f7; color: #68707b; }
.date-chip.active { color: #fff; background: #ff7043; }
.date-week,.date-day { font-size: 12px; line-height: 18px; }
.date-day { font-size: 16px; font-weight: 700; }
.time-grid { margin-top: 12px; display: grid; grid-template-columns: repeat(3,1fr); gap: 9px; }
.time-chip { height: 38px; display: flex; align-items: center; justify-content: center; border-radius: 19px; color: #5f6670; background: #f2f4f7; font-size: 13px; }
.time-chip.active { color: #fff; background: #248cf5; }
.state-title,.state-copy { display: block; }
.state-title { font-size: 15px; font-weight: 700; }
.state-copy { margin-top: 8px; color: #68707b; font-size: 13px; line-height: 21px; }
.booking-footer { position: fixed; z-index: 1000; left: 0; right: 0; bottom: 0; min-height: 76px; padding: 10px 14px; display: flex; align-items: center; gap: 14px; background: rgba(255,255,255,.98); border-top: 1px solid #eee; box-sizing: border-box; }
.price-area { flex: 1; display: flex; flex-direction: column; }
.price { color: #ff7043; font-size: 20px; font-weight: 800; }
.price-note { color: #9aa1aa; font-size: 11px; }
.confirm-btn { min-width: 132px; height: 46px; display: flex; align-items: center; justify-content: center; border-radius: 23px; color: #fff; background: linear-gradient(135deg,#ff8a4a,#ff5b35); font-size: 15px; font-weight: 700; box-shadow: 0 6px 18px rgba(255,112,67,.28); }
.confirm-btn.disabled { opacity: .45; box-shadow: none; }
.success-state { padding-left: 24px; padding-right: 24px; text-align: center; }
.success-mark { width: 76px; height: 76px; margin: 110px auto 18px; display: flex; align-items: center; justify-content: center; border-radius: 50%; color: #fff; background: #24d06c; font-size: 40px; font-weight: 800; box-shadow: 0 10px 24px rgba(36,208,108,.28); }
.success-title,.success-desc,.success-copy { display: block; }
.success-title { font-size: 22px; font-weight: 800; }
.success-desc { margin-top: 10px; color: #30343b; font-size: 15px; font-weight: 600; }
.success-copy { margin: 12px 28px 0; color: #737b86; font-size: 14px; line-height: 22px; }
.success-actions { margin-top: 36px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.secondary-btn,.primary-btn { height: 46px; display: flex; align-items: center; justify-content: center; border-radius: 23px; font-size: 14px; font-weight: 700; }
.secondary-btn { color: #5f6670; background: #eff1f4; }
.primary-btn { color: #fff; background: linear-gradient(135deg,#ff8a4a,#ff5b35); }
</style>

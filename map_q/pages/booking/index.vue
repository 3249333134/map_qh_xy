<template>
  <view class="booking-page">
    <GlobalNavBar :title="successOrder ? '预约已提交' : '确认预约'">
      <template #left><view class="nav-back" role="button" aria-label="返回" @tap="goBack"><view class="back-icon"></view></view></template>
    </GlobalNavBar>

    <view v-if="!successOrder" class="page-content" :style="{ paddingTop: topOffset + 'px' }">
      <view class="summary-card">
        <view class="service-mark">服</view>
        <view class="summary-copy"><text class="booking-title">{{ service.title }}</text><text class="booking-desc">{{ priceText }} · {{ serviceAreaText }}</text></view>
      </view>

      <view class="progress-card">
        <view v-for="item in steps" :key="item.id" class="progress-item" :class="{ active: step >= item.id, current: step === item.id }">
          <view class="progress-dot">{{ item.id }}</view><text>{{ item.name }}</text>
        </view>
      </view>

      <view v-if="step === 1" class="form-card">
        <text class="section-title">选择服务时间</text>
        <text class="section-hint">不可预约时段会自动禁用，提交前仍会再次校验。</text>
        <view class="field-block">
          <text class="field-label">预约日期 <text class="required">*</text></text>
          <scroll-view class="date-scroll" scroll-x>
            <view class="date-list">
              <view v-for="date in dates" :key="date.value" class="date-chip" :class="{ active: draft.date === date.value }" @tap="selectDate(date.value)">
                <text>{{ date.week }}</text><text>{{ date.day }}</text>
              </view>
            </view>
          </scroll-view>
        </view>
        <view class="field-block">
          <text class="field-label">可预约时段 <text class="required">*</text></text>
          <view class="time-grid">
            <view v-for="slot in visibleSlots" :key="slot.id" class="time-chip" :class="{ active: draft.slotId === slot.id, disabled: !slot.available }" @tap="selectSlot(slot)">{{ slot.time }}</view>
          </view>
          <text v-if="errors.slotId" class="field-error">{{ errors.slotId }}</text>
        </view>
      </view>

      <view v-else-if="step === 2" class="form-card">
        <text class="section-title">人数与规格</text>
        <view class="field-row">
          <view><text class="field-label">服务人数</text><text class="field-help">价格会按人数重新计算</text></view>
          <view class="counter"><view @tap="changeQuantity(-1)">−</view><text>{{ draft.quantity }}</text><view @tap="changeQuantity(1)">＋</view></view>
        </view>
        <view class="field-block">
          <text class="field-label">服务规格 <text class="required">*</text></text>
          <view class="spec-list">
            <view v-for="spec in specifications" :key="spec" class="spec-chip" :class="{ active: draft.specification === spec }" @tap="draft.specification = spec">{{ spec }}</view>
          </view>
          <text v-if="errors.specification" class="field-error">{{ errors.specification }}</text>
        </view>
        <view class="field-block no-border">
          <text class="field-label">备注</text>
          <textarea v-model="draft.note" class="note-input" maxlength="200" placeholder="选填，例如同行人、设备或现场需求" />
          <text class="input-count">{{ draft.note.length }}/200</text>
        </view>
      </view>

      <view v-else-if="step === 3" class="form-card">
        <text class="section-title">地点与联系人</text>
        <label class="input-group"><text>联系人 <text class="required">*</text></text><input v-model="draft.contact.name" placeholder="请输入真实姓名" /></label>
        <text v-if="errors.contactName" class="field-error">{{ errors.contactName }}</text>
        <label class="input-group"><text>手机号 <text class="required">*</text></text><input v-model="draft.contact.phone" type="number" maxlength="11" placeholder="用于履约联系" /></label>
        <text v-if="errors.phone" class="field-error">{{ errors.phone }}</text>
        <label class="input-group textarea-group"><text>服务地点 <text class="required">*</text></text><textarea v-model="draft.location.address" maxlength="100" placeholder="确认到店或上门地址" /></label>
        <text v-if="errors.address" class="field-error">{{ errors.address }}</text>
        <view class="privacy-tip"><view class="shield-icon"></view><text>联系方式仅提供给本次服务的已确认服务者。</text></view>
      </view>

      <view v-else class="form-card">
        <text class="section-title">费用与规则确认</text>
        <view class="receipt">
          <view><text>服务单价</text><text>¥{{ unitPrice.toFixed(2) }}</text></view>
          <view><text>人数</text><text>× {{ draft.quantity }}</text></view>
          <view class="total"><text>合计</text><text>¥{{ totalPrice.toFixed(2) }}</text></view>
        </view>
        <view class="policy-list">
          <view><text>取消规则</text><text>{{ policies.cancellation }}</text></view>
          <view><text>改期规则</text><text>{{ policies.reschedule }}</text></view>
          <view><text>退款规则</text><text>{{ policies.refund }}</text></view>
          <view><text>隐私说明</text><text>{{ policies.privacy }}</text></view>
        </view>
        <view class="agreement" @tap="draft.policyAccepted = !draft.policyAccepted">
          <view class="check-box" :class="{ checked: draft.policyAccepted }"><view></view></view>
          <text>我已阅读并同意费用、取消规则和隐私说明</text>
        </view>
        <text v-if="errors.policyAccepted" class="field-error">{{ errors.policyAccepted }}</text>
        <view v-if="service.service?.pricing?.requiresPayment" class="demo-notice">本项目使用演示支付，不会产生真实扣款。</view>
      </view>
    </view>

    <view v-else class="success-state" :style="{ paddingTop: topOffset + 'px' }">
      <view class="success-mark"><view></view></view>
      <text class="success-title">预约已提交</text>
      <text class="success-desc">{{ successOrder.title }}</text>
      <text class="success-copy">{{ statusCopy }} 已生成应用内日历事件，提醒会在下次打开应用时检查。</text>
      <view class="success-actions"><view class="secondary-btn" @tap="goMessages">查看消息</view><view class="primary-btn" @tap="openOrder">查看订单</view></view>
    </view>

    <view v-if="!successOrder" class="booking-footer" :style="{ paddingBottom: safeBottom + 'px' }">
      <view class="price-area"><text class="price">¥{{ totalPrice.toFixed(2) }}</text><text class="price-note">{{ step }}/4 · 草稿已自动保存</text></view>
      <view v-if="step > 1" class="previous-btn" @tap="step--">上一步</view>
      <view class="confirm-btn" :class="{ disabled: submitting }" @tap="next">{{ step === 4 ? (submitting ? '提交中' : '提交预约') : '下一步' }}</view>
    </view>
  </view>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import GlobalNavBar from '../../components/common/GlobalNavBar.vue'
import { contentDetailApi, normalizeContentDetail } from '../../utils/api/contentDetail.js'
import { bookingApi, BOOKING_STATUS } from '../../utils/api/booking.js'

const service = ref(normalizeContentDetail({}, 'service'))
const source = ref('service')
const step = ref(1)
const errors = reactive({})
const submitting = ref(false)
const successOrder = ref(null)
const topOffset = ref(68)
const safeBottom = ref(0)
const draft = reactive({
  serviceId: '', slotId: '', date: '', time: '', specification: '', quantity: 1, note: '',
  contact: { name: '', phone: '' }, location: { address: '' }, policyAccepted: false
})
const steps = [{ id: 1, name: '时间' }, { id: 2, name: '规格' }, { id: 3, name: '联系' }, { id: 4, name: '确认' }]
const specifications = ['标准服务', '深度服务', '多人协作']
const dates = Array.from({ length: 7 }, (_, index) => {
  const date = new Date(Date.now() + index * 86400000)
  return { value: date.toISOString().slice(0, 10), week: index === 0 ? '今天' : ['周日','周一','周二','周三','周四','周五','周六'][date.getDay()], day: String(date.getDate()).padStart(2, '0') }
})
const slots = computed(() => service.value.service?.availableSlots || [])
const visibleSlots = computed(() => {
  const sameDate = slots.value.filter(slot => slot.date === draft.date)
  return sameDate.length ? sameDate : slots.value.map(slot => ({ ...slot, date: draft.date }))
})
const unitPrice = computed(() => Number(service.value.service?.pricing?.amount || 0))
const totalPrice = computed(() => unitPrice.value * Number(draft.quantity || 1))
const priceText = computed(() => `¥${unitPrice.value}/${service.value.service?.pricing?.unit || '次'}`)
const serviceAreaText = computed(() => service.value.service?.serviceArea?.description || '到店服务')
const policies = computed(() => service.value.service?.policies || {})
const statusCopy = computed(() => successOrder.value?.status === BOOKING_STATUS.PENDING_PAYMENT ? '订单等待演示支付。' : '订单正在等待服务者确认。')

function hydrateDraft(saved) {
  if (!saved) return
  Object.assign(draft, saved, { contact: { ...draft.contact, ...(saved.contact || {}) }, location: { ...draft.location, ...(saved.location || {}) } })
}
function selectDate(value) { draft.date = value; draft.slotId = ''; draft.time = '' }
function selectSlot(slot) { if (!slot.available) return uni.showToast({ title: '该时段已约满', icon: 'none' }); draft.slotId = slot.id; draft.time = slot.time }
function changeQuantity(delta) { draft.quantity = Math.min(20, Math.max(1, Number(draft.quantity) + delta)) }
function clearErrors() { Object.keys(errors).forEach(key => delete errors[key]) }
function validateCurrentStep() {
  clearErrors()
  if (step.value === 1 && !draft.slotId) errors.slotId = '请选择一个可预约时段'
  if (step.value === 2 && !draft.specification) errors.specification = '请选择服务规格'
  if (step.value === 3) {
    if (!draft.contact.name.trim()) errors.contactName = '请输入联系人姓名'
    if (!/^1\d{10}$/.test(draft.contact.phone)) errors.phone = '请输入有效的 11 位手机号'
    if (!draft.location.address.trim()) errors.address = '请确认服务地点'
  }
  if (step.value === 4 && !draft.policyAccepted) errors.policyAccepted = '请阅读并同意预约规则'
  return Object.keys(errors).length === 0
}
async function next() {
  if (submitting.value || !validateCurrentStep()) return
  if (step.value < 4) { step.value++; return }
  submitting.value = true
  try {
    let order = bookingApi.createOrder(JSON.parse(JSON.stringify(draft)), service.value)
    bookingApi.createCalendarEvent(order)
    if (order.status === BOOKING_STATUS.PENDING_PAYMENT) {
      await new Promise(resolve => uni.showModal({ title: '演示支付', content: `模拟支付 ¥${order.feeDetail.total.toFixed(2)}，不会产生真实扣款。`, confirmText: '完成演示', success: result => { if (result.confirm) order = bookingApi.transition(order.id, BOOKING_STATUS.PENDING_CONFIRMATION, '演示支付已完成'); resolve() } }))
    }
    successOrder.value = order
  } catch (cause) {
    uni.showModal({ title: '提交失败', content: cause?.message || '请稍后重试', showCancel: false })
  } finally {
    submitting.value = false
  }
}
function goBack() {
  if (successOrder.value) return uni.navigateBack({ fail: () => uni.switchTab({ url: source.value === 'index' ? '/pages/index/index' : '/pages/service/index' }) })
  uni.showModal({ title: '保留预约草稿？', content: '下次进入可以继续填写。', cancelText: '放弃', confirmText: '保留', success: result => { if (!result.confirm) bookingApi.clearDraft(); uni.navigateBack() } })
}
function goMessages() { uni.switchTab({ url: '/pages/message/index' }) }
function openOrder() { uni.navigateTo({ url: `/pages/order/index?id=${encodeURIComponent(successOrder.value.id)}` }) }

watch(draft, value => { if (value.serviceId && !successOrder.value) bookingApi.saveDraft(JSON.parse(JSON.stringify(value))) }, { deep: true })
onLoad(async options => {
  source.value = options?.source || 'service'
  const raw = uni.getStorageSync('BOOKING_ITEM') || uni.getStorageSync('SERVICE_LAST_ITEM') || {}
  service.value = await contentDetailApi.fetchById(options?.id || raw._id || raw.id || 'service_preview', 'service')
  draft.serviceId = service.value.id
  draft.date = raw.selectedSlot?.date || dates[0].value
  draft.location.address = service.value.location?.address || ''
  if (raw.selectedSlot) { draft.slotId = raw.selectedSlot.id; draft.time = raw.selectedSlot.time }
  hydrateDraft(bookingApi.getDraft(service.value.id))
  try {
    const metrics = uni.getStorageSync('TOP_NAV_METRICS'); if (metrics?.totalPx) topOffset.value = metrics.totalPx
    const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync(); safeBottom.value = info.safeAreaInsets?.bottom || 0
  } catch (error) {}
})
</script>

<style scoped>
.booking-page { min-height: 100vh; background: var(--color-page); color: #0f172a; }.nav-back { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 15px; background: #f1f5f9; }.back-icon { width: 10px; height: 10px; border-left: 2px solid #334155; border-bottom: 2px solid #334155; transform: rotate(45deg); }.page-content { padding: 14px 14px 118px; box-sizing: border-box; }
.summary-card,.progress-card,.form-card { margin-bottom: 12px; border: 1px solid #eef2f7; border-radius: 20px; background: #fff; box-shadow: 0 8px 26px rgba(15,23,42,.05); }.summary-card { display: flex; align-items: center; gap: 12px; padding: 14px; }.service-mark { flex: 0 0 48px; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 15px; color: #fff; background: #0f9f92; font-size: 16px; font-weight: 800; }.summary-copy { min-width: 0; }.booking-title,.booking-desc { display: block; }.booking-title { font-size: 17px; font-weight: 750; }.booking-desc { margin-top: 4px; color: #64748b; font-size: 12px; }
.progress-card { display: grid; grid-template-columns: repeat(4,1fr); padding: 14px 8px; }.progress-item { position: relative; display: flex; flex-direction: column; align-items: center; color: #94a3b8; font-size: 11px; }.progress-item::before { content: ''; position: absolute; top: 13px; right: 50%; width: 100%; height: 2px; background: #e2e8f0; }.progress-item:first-child::before { display: none; }.progress-item.active::before { background: #fb923c; }.progress-dot { position: relative; z-index: 1; width: 26px; height: 26px; margin-bottom: 5px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: #e2e8f0; color: #64748b; font-size: 11px; font-weight: 750; }.progress-item.active .progress-dot { color: #fff; background: #fb923c; }.progress-item.current { color: #c2410c; font-weight: 700; }
.form-card { padding: 18px 16px; }.section-title,.section-hint,.field-label,.field-help,.field-error,.input-count { display: block; }.section-title { font-size: 19px; font-weight: 800; }.section-hint { margin-top: 6px; color: #64748b; font-size: 12px; line-height: 1.5; }.field-block { padding: 18px 0; border-bottom: 1px solid #f1f5f9; }.field-block.no-border { border-bottom: 0; }.field-label { color: #334155; font-size: 14px; font-weight: 650; }.required,.field-error { color: #b91c1c; }.field-error { margin-top: 7px; font-size: 12px; }
.date-scroll { margin-top: 12px; white-space: nowrap; }.date-list { display: inline-flex; gap: 8px; padding-right: 12px; }.date-chip { width: 58px; height: 58px; border: 1px solid #e2e8f0; border-radius: 14px; display: inline-flex; flex-direction: column; align-items: center; justify-content: center; color: #64748b; }.date-chip text { font-size: 11px; line-height: 18px; }.date-chip.active { border-color: #ea580c; color: #c2410c; background: #fff7ed; }.time-grid { margin-top: 12px; display: grid; grid-template-columns: repeat(3,1fr); gap: 9px; }.time-chip,.spec-chip { min-height: 44px; display: flex; align-items: center; justify-content: center; border: 1px solid #e2e8f0; border-radius: 13px; color: #475569; font-size: 13px; }.time-chip.active,.spec-chip.active { border-color: #ea580c; color: #c2410c; background: #fff7ed; }.time-chip.disabled { opacity: .38; }
.field-row { min-height: 68px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f1f5f9; }.field-help { margin-top: 4px; color: #94a3b8; font-size: 11px; }.counter { display: flex; align-items: center; gap: 15px; }.counter view { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 13px; background: #f1f5f9; color: #334155; font-size: 20px; }.counter text { min-width: 22px; text-align: center; font-weight: 750; }.spec-list { margin-top: 12px; display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; }.note-input { width: 100%; min-height: 100px; margin-top: 10px; padding: 12px; border-radius: 14px; background: var(--color-page); box-sizing: border-box; font-size: 14px; }.input-count { margin-top: 5px; color: #94a3b8; font-size: 11px; text-align: right; }
.input-group { display: block; padding: 14px 0 10px; border-bottom: 1px solid #f1f5f9; }.input-group>text { display: block; color: #334155; font-size: 13px; font-weight: 650; }.input-group input,.input-group textarea { width: 100%; min-height: 44px; margin-top: 6px; font-size: 15px; }.textarea-group textarea { min-height: 76px; }.privacy-tip { margin-top: 16px; padding: 12px; display: flex; align-items: center; gap: 9px; border-radius: 13px; color: #475569; background: #f0fdfa; font-size: 11px; }.shield-icon { width: 16px; height: 18px; border: 2px solid #0f9f92; border-radius: 8px 8px 10px 10px; }
.receipt,.policy-list { margin-top: 14px; padding: 12px; border-radius: 14px; background: var(--color-page); }.receipt view,.policy-list view { min-height: 32px; display: flex; justify-content: space-between; gap: 18px; color: #64748b; font-size: 12px; }.receipt .total { padding-top: 8px; border-top: 1px solid #e2e8f0; color: #0f172a; font-size: 15px; font-weight: 750; }.receipt .total text:last-child { color: #ea580c; }.policy-list view { display: block; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }.policy-list view:last-child { border-bottom: 0; }.policy-list text { display: block; }.policy-list text:first-child { color: #64748b; font-weight: 700; }.policy-list text:last-child { margin-top: 4px; line-height: 1.5; }.agreement { min-height: 54px; display: flex; align-items: center; gap: 10px; color: #334155; font-size: 12px; }.check-box { width: 22px; height: 22px; border: 2px solid #cbd5e1; border-radius: 7px; box-sizing: border-box; }.check-box.checked { position: relative; border-color: #ea580c; background: #ea580c; }.check-box.checked::after { content: ''; position: absolute; left: 5px; top: 2px; width: 6px; height: 11px; border-right: 2px solid #fff; border-bottom: 2px solid #fff; transform: rotate(45deg); }.demo-notice { padding: 11px; border-radius: 12px; color: #9a3412; background: #fff7ed; font-size: 11px; }
.booking-footer { position: fixed; z-index: 1000; left: 0; right: 0; bottom: 0; min-height: 78px; padding: 10px 14px; display: flex; align-items: center; gap: 9px; background: rgba(255,255,255,.97); border-top: 1px solid #e2e8f0; box-sizing: content-box; backdrop-filter: blur(16px); }.price-area { flex: 1; display: flex; flex-direction: column; }.price { color: #ea580c; font-size: 20px; font-weight: 800; }.price-note { color: #64748b; font-size: 10px; }.previous-btn,.confirm-btn { min-width: 72px; height: 48px; padding: 0 13px; display: flex; align-items: center; justify-content: center; border-radius: 15px; font-size: 13px; font-weight: 700; }.previous-btn { color: #475569; background: #f1f5f9; }.confirm-btn { min-width: 112px; color: #fff; background: #ea580c; box-shadow: 0 7px 18px rgba(234,88,12,.2); }.confirm-btn.disabled { opacity: .45; box-shadow: none; }
.success-state { padding: 120px 24px 40px; text-align: center; }.success-mark { width: 72px; height: 72px; margin: 0 auto 18px; border-radius: 23px; display: flex; align-items: center; justify-content: center; background: #dcfce7; }.success-mark view { width: 18px; height: 34px; border-right: 5px solid #15803d; border-bottom: 5px solid #15803d; transform: rotate(45deg) translate(-4px,-4px); }.success-title,.success-desc,.success-copy { display: block; }.success-title { font-size: 22px; font-weight: 800; }.success-desc { margin-top: 10px; font-size: 15px; font-weight: 650; }.success-copy { margin-top: 10px; color: #64748b; font-size: 13px; line-height: 1.65; }.success-actions { margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }.secondary-btn,.primary-btn { height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 15px; font-size: 14px; font-weight: 750; }.secondary-btn { color: #475569; background: #f1f5f9; }.primary-btn { color: #fff; background: #ea580c; }
</style>

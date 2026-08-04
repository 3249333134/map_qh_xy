<template>
  <view class="page">
    <GlobalNavBar title="订单详情"><template #left><view class="back-button" @tap="goBack"><view></view></view></template></GlobalNavBar>
    <view class="content" :style="{ paddingTop: topOffset + 'px' }">
      <view v-if="!order" class="empty-state"><text>未找到订单</text><view @tap="goBack">返回</view></view>
      <template v-else>
        <view class="status-card">
          <view class="status-icon"><view></view></view>
          <view><text class="status-title">{{ statusLabel }}</text><text class="status-desc">{{ statusDescription }}</text></view>
        </view>
        <view class="card">
          <text class="card-title">{{ order.title }}</text>
          <view class="info-row"><text>预约时间</text><text>{{ order.draftSnapshot.date }} {{ order.draftSnapshot.time }}</text></view>
          <view class="info-row"><text>服务规格</text><text>{{ order.draftSnapshot.specification }} × {{ order.draftSnapshot.quantity }}</text></view>
          <view class="info-row"><text>服务地点</text><text>{{ order.draftSnapshot.location.address }}</text></view>
          <view class="info-row"><text>联系人</text><text>{{ order.draftSnapshot.contact.name }} {{ maskPhone(order.draftSnapshot.contact.phone) }}</text></view>
          <view class="info-row total"><text>订单金额</text><text>¥{{ order.feeDetail.total.toFixed(2) }}</text></view>
        </view>
        <view class="card">
          <text class="section-title">订单进度</text>
          <view v-for="(item,index) in timeline" :key="index" class="timeline-row">
            <view class="timeline-mark"></view>
            <view><text>{{ item.title }}</text><text>{{ formatTime(item.at) }}</text></view>
          </view>
        </view>
        <view v-if="order.status === STATUS.COMPLETED && !order.review" class="card">
          <text class="section-title">评价服务</text>
          <view class="rating-row"><view v-for="value in 5" :key="value" :class="{ active: reviewRating >= value }" @tap="reviewRating = value"><view></view></view></view>
          <textarea v-model="reviewContent" class="review-input" maxlength="300" placeholder="评价将保持独立，商家只能回复，不能修改。" />
          <view class="primary-action" @tap="submitReview">提交评价</view>
        </view>
        <view v-else-if="order.review" class="card review-card">
          <text class="section-title">我的评价 · {{ order.review.rating }} 分</text>
          <text class="review-text">{{ order.review.content }}</text>
          <text class="review-lock">评分提交后不可修改；如有补充可联系平台处理。</text>
        </view>
        <view class="action-card">
          <view class="secondary-action" @tap="openConversation">订单会话</view>
          <view v-if="canReschedule" class="secondary-action" @tap="requestReschedule">申请改期</view>
          <view v-if="canCancel" class="secondary-action danger" @tap="cancelOrder">取消订单</view>
          <view v-if="primaryAction" class="primary-action" @tap="runPrimaryAction">{{ primaryAction.label }}</view>
        </view>
      </template>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import GlobalNavBar from '../../components/common/GlobalNavBar.vue'
import { bookingApi, BOOKING_STATUS as STATUS } from '../../utils/api/booking.js'
const order = ref(null)
const topOffset = ref(68)
const reviewRating = ref(5)
const reviewContent = ref('')
const labels = {
  pending_payment: '待演示支付', pending_confirmation: '等待服务者确认', confirmed: '预约已确认',
  pending_fulfillment: '等待履约', in_service: '服务进行中', completed: '服务已完成',
  cancelled: '订单已取消', rescheduling: '正在改期', refunding: '退款处理中', refunded: '已退款'
}
const statusLabel = computed(() => labels[order.value?.status] || '订单状态')
const statusDescription = computed(() => ({
  pending_payment: '本项目不会产生真实扣款。',
  pending_confirmation: '服务者确认后将通过应用内消息通知。',
  confirmed: '预约已锁定，可添加提醒或申请改期。',
  pending_fulfillment: '请按约定时间到达服务地点。',
  in_service: '服务结束后请确认完成并评价。',
  completed: '感谢使用，欢迎提交可信评价。',
  cancelled: '如已支付，可按规则发起退款。',
  rescheduling: '选择新时间后等待服务者再次确认。',
  refunding: '退款为演示状态，不涉及真实资金。',
  refunded: '退款流程已结束。'
}[order.value?.status] || ''))
const timeline = computed(() => [
  { title: '订单已创建', at: order.value?.createdAt },
  ...(order.value?.timeline || []).map(item => ({ title: `${labels[item.to] || item.to}${item.note ? ` · ${item.note}` : ''}`, at: item.at }))
])
const primaryAction = computed(() => ({
  pending_payment: { label: '完成演示支付', next: STATUS.PENDING_CONFIRMATION },
  pending_confirmation: { label: '模拟服务者确认', next: STATUS.CONFIRMED },
  confirmed: { label: '进入待履约', next: STATUS.PENDING_FULFILLMENT },
  pending_fulfillment: { label: '开始服务', next: STATUS.IN_SERVICE },
  rescheduling: { label: '确认新时段', next: STATUS.CONFIRMED },
  in_service: { label: '确认完成', next: STATUS.COMPLETED },
  cancelled: { label: '申请演示退款', next: STATUS.REFUNDING },
  refunding: { label: '完成演示退款', next: STATUS.REFUNDED }
}[order.value?.status] || null))
const canReschedule = computed(() => [STATUS.CONFIRMED, STATUS.PENDING_FULFILLMENT].includes(order.value?.status))
const canCancel = computed(() => [
  STATUS.PENDING_PAYMENT,
  STATUS.PENDING_CONFIRMATION,
  STATUS.CONFIRMED,
  STATUS.PENDING_FULFILLMENT,
  STATUS.RESCHEDULING
].includes(order.value?.status))
function reload() { order.value = bookingApi.listOrders().find(item => item.id === order.value?.id) || order.value }
function runPrimaryAction() {
  const action = primaryAction.value
  if (!action) return
  try { order.value = bookingApi.transition(order.value.id, action.next, action.label) } catch (cause) { uni.showToast({ title: cause.message, icon: 'none' }) }
}
function requestReschedule() {
  try {
    order.value = bookingApi.transition(order.value.id, STATUS.RESCHEDULING, '用户申请改期')
  } catch (cause) {
    uni.showToast({ title: cause.message, icon: 'none' })
  }
}
function cancelOrder() {
  uni.showModal({
    title: '取消订单',
    content: '取消后将按服务规则判断是否可退款，确定继续吗？',
    confirmColor: '#dc2626',
    success: result => {
      if (!result.confirm) return
      try {
        order.value = bookingApi.transition(order.value.id, STATUS.CANCELLED, '用户取消订单')
      } catch (cause) {
        uni.showToast({ title: cause.message, icon: 'none' })
      }
    }
  })
}
function submitReview() {
  if (!reviewContent.value.trim()) return uni.showToast({ title: '请填写评价内容', icon: 'none' })
  try { order.value = bookingApi.submitReview(order.value.id, { rating: reviewRating.value, content: reviewContent.value.trim() }) } catch (cause) { uni.showToast({ title: cause.message, icon: 'none' }) }
}
function openConversation() { uni.navigateTo({ url: `/pages/chat/index?name=${encodeURIComponent('服务助手')}&orderId=${encodeURIComponent(order.value.id)}` }) }
function formatTime(value) { const date = new Date(value || Date.now()); return `${date.getMonth()+1}月${date.getDate()}日 ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}` }
function maskPhone(value) { return String(value || '').replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2') }
function goBack() { uni.navigateBack() }
onLoad(options => {
  order.value = bookingApi.listOrders().find(item => item.id === options?.id) || null
  try { const metrics = uni.getStorageSync('TOP_NAV_METRICS'); if (metrics?.totalPx) topOffset.value = metrics.totalPx } catch (error) {}
})
</script>

<style scoped>
.page { min-height: 100vh; background: var(--color-page); }.back-button { width: 44px; height: 44px; border-radius: 15px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; }.back-button view { width: 10px; height: 10px; border-left: 2px solid #334155; border-bottom: 2px solid #334155; transform: rotate(45deg); }.content { padding: 14px 14px 34px; }.status-card,.card,.action-card { margin-bottom: 12px; padding: 16px; border: 1px solid #eef2f7; border-radius: 20px; background: #fff; box-shadow: 0 8px 24px rgba(15,23,42,.05); }
.status-card { display: flex; align-items: center; gap: 13px; }.status-icon { width: 48px; height: 48px; border-radius: 16px; display: flex; align-items: center; justify-content: center; background: #fff7ed; }.status-icon view { width: 18px; height: 18px; border: 3px solid #ea580c; border-radius: 50%; box-sizing: border-box; box-shadow: 0 0 0 5px rgba(234,88,12,.12); }.status-title,.status-desc,.card-title,.section-title,.timeline-row text,.review-text,.review-lock { display: block; }.status-title { color: #0f172a; font-size: 18px; font-weight: 800; }.status-desc { margin-top: 4px; color: #64748b; font-size: 12px; }.card-title,.section-title { margin-bottom: 10px; color: #0f172a; font-size: 16px; font-weight: 750; }
.info-row { min-height: 42px; display: flex; justify-content: space-between; gap: 18px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 12px; }.info-row text { display: flex; align-items: center; }.info-row text:last-child { max-width: 66%; color: #64748b; text-align: right; }.info-row.total { border-bottom: 0; color: #0f172a; font-weight: 700; }.info-row.total text:last-child { color: #ea580c; font-size: 17px; font-weight: 800; }
.timeline-row { position: relative; min-height: 52px; padding-left: 30px; }.timeline-row::before { content: ''; position: absolute; left: 8px; top: 15px; bottom: -15px; width: 2px; background: #e2e8f0; }.timeline-row:last-child::before { display: none; }.timeline-mark { position: absolute; left: 2px; top: 8px; width: 14px; height: 14px; border: 3px solid #fff; border-radius: 50%; background: #fb923c; box-shadow: 0 0 0 2px #fed7aa; }.timeline-row text:first-child { color: #334155; font-size: 13px; font-weight: 650; }.timeline-row text:last-child { margin-top: 4px; color: #94a3b8; font-size: 10px; }
.rating-row { display: flex; gap: 10px; }.rating-row>view { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 14px; background: #f1f5f9; }.rating-row>view view { width: 18px; height: 18px; clip-path: polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 94%,50% 72%,21% 94%,32% 57%,2% 35%,39% 35%); background: #cbd5e1; }.rating-row>view.active { background: #fff7ed; }.rating-row>view.active view { background: #f59e0b; }.review-input { width: 100%; min-height: 100px; margin-top: 12px; padding: 12px; border-radius: 14px; background: var(--color-page); box-sizing: border-box; font-size: 14px; }.review-text { color: #334155; font-size: 14px; line-height: 1.65; }.review-lock { margin-top: 10px; color: #64748b; font-size: 11px; }
.action-card { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }.secondary-action,.primary-action { min-height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 15px; font-size: 13px; font-weight: 750; }.secondary-action { color: #475569; background: #f1f5f9; }.secondary-action.danger { color: #b91c1c; background: #fef2f2; }.primary-action { color: #fff; background: #ea580c; box-shadow: 0 7px 18px rgba(234,88,12,.2); }.empty-state { padding-top: 140px; text-align: center; }.empty-state text { display: block; color: #64748b; }.empty-state view { width: 120px; height: 46px; margin: 20px auto; display: flex; align-items: center; justify-content: center; border-radius: 15px; color: #fff; background: #ea580c; }
</style>

import { readVersioned, writeVersioned } from './storage.js'
import { calculateSelectionTotal, normalizeService } from '../serviceCatalog.js'

const VERSION = 1
const DRAFT_KEY = 'BOOKING_DRAFT_V1'
const ORDER_KEY = 'BOOKING_ORDERS_V1'
const CALENDAR_KEY = 'APP_CALENDAR_EVENTS_V1'
const NOTIFICATION_KEY = 'APP_BOOKING_NOTIFICATIONS_V1'

export const BOOKING_STATUS = {
  PENDING_PAYMENT: 'pending_payment',
  PENDING_CONFIRMATION: 'pending_confirmation',
  CONFIRMED: 'confirmed',
  PENDING_FULFILLMENT: 'pending_fulfillment',
  IN_SERVICE: 'in_service',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  RESCHEDULING: 'rescheduling',
  REFUNDING: 'refunding',
  REFUNDED: 'refunded'
}

const allowedTransitions = {
  pending_payment: ['pending_confirmation', 'cancelled'],
  pending_confirmation: ['confirmed', 'cancelled'],
  confirmed: ['pending_fulfillment', 'rescheduling', 'cancelled'],
  pending_fulfillment: ['in_service', 'rescheduling', 'cancelled'],
  in_service: ['completed'],
  completed: [],
  cancelled: ['refunding'],
  rescheduling: ['confirmed', 'cancelled'],
  refunding: ['refunded'],
  refunded: []
}

const verificationCode = id => String([...String(id)].reduce((sum, char) => sum + char.charCodeAt(0), 0) * 7919).slice(-6).padStart(6, '0')
const normalizeOrder = order => ({
  orderKind: order.orderKind || (order.category === 'ticket' ? 'ticket' : 'service'),
  category: order.category || order.draftSnapshot?.category || 'food',
  selectionSnapshot: order.selectionSnapshot || order.draftSnapshot?.selectionSnapshot || {},
  verificationCode: order.verificationCode || verificationCode(order.id || 'order'),
  verificationStatus: order.verificationStatus || (order.verifiedAt ? 'verified' : 'unused'),
  verifiedAt: Number(order.verifiedAt || 0),
  ...order
})
const readOrders = () => (readVersioned(ORDER_KEY, VERSION, []) || []).map(normalizeOrder)
const saveOrders = orders => writeVersioned(ORDER_KEY, VERSION, orders)

function pushNotification(order, title, content) {
  const list = readVersioned(NOTIFICATION_KEY, VERSION, [])
  writeVersioned(NOTIFICATION_KEY, VERSION, [{
    id: `notice_${Date.now()}`,
    orderId: order.id,
    title,
    content,
    read: false,
    createdAt: Date.now()
  }, ...list])
}

export const bookingApi = {
  getDraft(serviceId) {
    const draft = readVersioned(DRAFT_KEY, VERSION, null)
    return draft && (!serviceId || draft.serviceId === serviceId) ? draft : null
  },
  saveDraft(draft) {
    return writeVersioned(DRAFT_KEY, VERSION, { ...draft, updatedAt: Date.now() })
  },
  clearDraft() {
    uni.removeStorageSync(DRAFT_KEY)
  },
  listOrders() {
    return readOrders()
  },
  createOrder(draft, service) {
    if (!draft?.serviceId || !draft?.slotId || !draft?.contact?.name || !draft?.contact?.phone || !draft.policyAccepted) {
      throw new Error('预约资料不完整')
    }
    const normalizedService = normalizeService(service?.service ? { ...service, ...service.service } : service, draft.category || service?.serviceCategory)
    const requiresPayment = Boolean(normalizedService.pricing.requiresPayment)
    const total = calculateSelectionTotal(normalizedService, draft.selectionSnapshot || { quantity: draft.quantity })
    const order = {
      id: `order_${Date.now()}`,
      serviceId: draft.serviceId,
      title: normalizedService.title || '预约服务',
      orderKind: normalizedService.serviceCategory === 'ticket' ? 'ticket' : 'service',
      category: normalizedService.serviceCategory,
      selectionSnapshot: JSON.parse(JSON.stringify(draft.selectionSnapshot || {})),
      draftSnapshot: JSON.parse(JSON.stringify(draft)),
      feeDetail: {
        subtotal: total,
        discount: 0,
        total,
        currency: 'CNY'
      },
      status: requiresPayment ? BOOKING_STATUS.PENDING_PAYMENT : BOOKING_STATUS.PENDING_CONFIRMATION,
      paymentMode: requiresPayment ? 'demo' : 'offline',
      conversationId: `conversation_${Date.now()}`,
      calendarEventId: '',
      verificationCode: verificationCode(`order_${Date.now()}`),
      verificationStatus: 'unused',
      verifiedAt: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      timeline: []
    }
    const orders = [order, ...readOrders()]
    saveOrders(orders)
    pushNotification(order, '预约已提交', requiresPayment ? '请完成演示支付后等待服务者确认。' : '服务者确认后会在消息中心通知你。')
    this.clearDraft()
    return order
  },
  transition(orderId, nextStatus, note = '') {
    const orders = readOrders()
    const index = orders.findIndex(order => order.id === orderId)
    if (index < 0) throw new Error('订单不存在')
    const order = orders[index]
    if (!(allowedTransitions[order.status] || []).includes(nextStatus)) throw new Error('当前订单状态不支持此操作')
    orders[index] = {
      ...order,
      status: nextStatus,
      updatedAt: Date.now(),
      timeline: [...(order.timeline || []), { from: order.status, to: nextStatus, note, at: Date.now() }]
    }
    saveOrders(orders)
    pushNotification(orders[index], '订单状态已更新', note || `订单状态更新为 ${nextStatus}`)
    return orders[index]
  },
  verify(orderId, code) {
    const orders = readOrders()
    const index = orders.findIndex(order => order.id === orderId)
    if (index < 0) throw new Error('订单不存在')
    const order = orders[index]
    if (order.verificationStatus === 'verified') throw new Error('该核销码已使用')
    if (![BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.PENDING_FULFILLMENT].includes(order.status)) throw new Error('当前订单尚不可核销')
    if (String(code || '') !== String(order.verificationCode)) throw new Error('核销码不正确，请核对后重试')
    const now = Date.now()
    orders[index] = {
      ...order,
      status: BOOKING_STATUS.IN_SERVICE,
      verificationStatus: 'verified',
      verifiedAt: now,
      updatedAt: now,
      timeline: [...(order.timeline || []), { from: order.status, to: BOOKING_STATUS.IN_SERVICE, note: '商家已核销到店码', at: now }]
    }
    saveOrders(orders)
    pushNotification(orders[index], '到店核销成功', '服务已开始，请在结束后确认完成。')
    return orders[index]
  },
  createCalendarEvent(order) {
    const events = readVersioned(CALENDAR_KEY, VERSION, [])
    const startAt = new Date(`${order.draftSnapshot.date}T${order.draftSnapshot.time}:00`).getTime()
    const event = {
      id: `calendar_${Date.now()}`,
      orderId: order.id,
      title: order.title,
      startAt,
      remindAt: startAt - 60 * 60 * 1000,
      reminded: false
    }
    writeVersioned(CALENDAR_KEY, VERSION, [event, ...events])
    const orders = readOrders().map(item => item.id === order.id ? { ...item, calendarEventId: event.id, updatedAt: Date.now() } : item)
    saveOrders(orders)
    return event
  },
  collectDueReminders(now = Date.now()) {
    const events = readVersioned(CALENDAR_KEY, VERSION, [])
    const due = events.filter(event => !event.reminded && event.remindAt <= now && event.startAt > now)
    if (due.length) {
      const dueIds = new Set(due.map(event => event.id))
      writeVersioned(CALENDAR_KEY, VERSION, events.map(event => dueIds.has(event.id) ? { ...event, reminded: true } : event))
    }
    return due
  },
  submitReview(orderId, review) {
    const orders = readOrders()
    const index = orders.findIndex(order => order.id === orderId)
    if (index < 0 || orders[index].status !== BOOKING_STATUS.COMPLETED) throw new Error('订单完成后才能评价')
    if (orders[index].review) throw new Error('评分提交后不可修改')
    orders[index] = { ...orders[index], review: { ...review, createdAt: Date.now(), appendText: '' } }
    saveOrders(orders)
    return orders[index]
  }
}

export default bookingApi


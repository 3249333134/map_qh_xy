import { readVersioned, writeVersioned } from './storage.js'

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

const readOrders = () => readVersioned(ORDER_KEY, VERSION, [])
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
    const requiresPayment = Boolean(service?.service?.pricing?.requiresPayment)
    const order = {
      id: `order_${Date.now()}`,
      serviceId: draft.serviceId,
      title: service?.title || '预约服务',
      draftSnapshot: JSON.parse(JSON.stringify(draft)),
      feeDetail: {
        subtotal: Number(service?.service?.pricing?.amount || 0) * Number(draft.quantity || 1),
        discount: 0,
        total: Number(service?.service?.pricing?.amount || 0) * Number(draft.quantity || 1),
        currency: 'CNY'
      },
      status: requiresPayment ? BOOKING_STATUS.PENDING_PAYMENT : BOOKING_STATUS.PENDING_CONFIRMATION,
      paymentMode: requiresPayment ? 'demo' : 'offline',
      conversationId: `conversation_${Date.now()}`,
      calendarEventId: '',
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


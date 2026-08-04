import { readVersioned, writeVersioned } from './storage.js'

const VERSION = 1
const EVENT_KEY = 'MERCHANT_EVENTS_V1'
const PROFILE_KEY = 'MERCHANT_PROFILE_V1'
const readEvents = () => readVersioned(EVENT_KEY, VERSION, [])
const saveEvents = events => writeVersioned(EVENT_KEY, VERSION, events)

export const merchantEventApi = {
  getProfile() {
    return readVersioned(PROFILE_KEY, VERSION, {
      id: 'merchant_current',
      name: '我的商家',
      verificationStatus: 'unverified'
    })
  },
  setVerificationStatus(status) {
    return writeVersioned(PROFILE_KEY, VERSION, { ...this.getProfile(), verificationStatus: status, updatedAt: Date.now() })
  },
  list() {
    return readEvents()
  },
  saveDraft(input) {
    const events = readEvents()
    const id = input.id || `merchant_event_${Date.now()}`
    const event = {
      registrations: [],
      reviews: [],
      ...events.find(item => item.id === id),
      ...input,
      id,
      merchantId: this.getProfile().id,
      verificationStatus: this.getProfile().verificationStatus,
      status: input.status === 'published' ? 'published' : 'draft',
      updatedAt: Date.now()
    }
    const next = [event, ...events.filter(item => item.id !== id)]
    saveEvents(next)
    return event
  },
  publish(id) {
    const profile = this.getProfile()
    if (profile.verificationStatus !== 'verified') throw new Error('完成主体认证后才能发布活动')
    const events = readEvents()
    const event = events.find(item => item.id === id)
    if (!event) throw new Error('活动不存在')
    const required = [event.title, event.startTime, event.endTime, event.locationName, event.capacity, event.registrationDeadline, event.cancelRule]
    if (required.some(value => !value)) throw new Error('请补齐时间、地点、容量、截止时间和取消规则')
    event.status = 'published'
    event.verificationStatus = 'verified'
    event.updatedAt = Date.now()
    saveEvents(events)
    return event
  },
  register(id, user = { id: 'current_user', name: '用户495' }) {
    const events = readEvents()
    const event = events.find(item => item.id === id)
    if (!event || event.status !== 'published') throw new Error('活动当前不可报名')
    if ((event.registrations || []).length >= Number(event.capacity || 0)) throw new Error('活动名额已满')
    if (!(event.registrations || []).some(item => item.id === user.id)) event.registrations.push({ ...user, createdAt: Date.now(), status: 'registered' })
    saveEvents(events)
    return event
  },
  cancel(id, reason) {
    const events = readEvents()
    const event = events.find(item => item.id === id)
    if (!event) throw new Error('活动不存在')
    event.status = 'cancelled'
    event.cancelReason = reason || '商家取消活动'
    event.registrations = (event.registrations || []).map(item => ({ ...item, status: 'notified_cancelled' }))
    event.updatedAt = Date.now()
    saveEvents(events)
    return event
  },
  archive(id) {
    const events = readEvents()
    const event = events.find(item => item.id === id)
    if (!event) throw new Error('活动不存在')
    event.status = 'archived'
    event.updatedAt = Date.now()
    saveEvents(events)
    return event
  },
  replyReview(id, reviewId, reply) {
    const events = readEvents()
    const event = events.find(item => item.id === id)
    const review = event?.reviews?.find(item => item.id === reviewId)
    if (!review) throw new Error('评价不存在')
    review.merchantReply = String(reply || '').trim()
    review.replyAt = Date.now()
    saveEvents(events)
    return event
  }
}

export default merchantEventApi


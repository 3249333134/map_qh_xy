import { beforeEach, describe, expect, it } from 'vitest'
import { bookingApi, BOOKING_STATUS } from '../utils/api/booking.js'
import { normalizeService } from '../utils/serviceCatalog.js'
import { installUniStorage } from './setup.js'

describe('booking verification', () => {
  beforeEach(() => installUniStorage())

  it('creates compatible verification fields and verifies only once', () => {
    const service = normalizeService({ id: 'food_1', price: 88, requiresPayment: false }, 'food')
    const order = bookingApi.createOrder({ serviceId: service.id, slotId: 'slot', quantity: 1, category: 'food', selectionSnapshot: { packageId: service.packages[0].id, quantity: 1 }, contact: { name: '林', phone: '13800000000' }, policyAccepted: true }, service)
    const confirmed = bookingApi.transition(order.id, BOOKING_STATUS.CONFIRMED, '商家确认')
    const verified = bookingApi.verify(confirmed.id, confirmed.verificationCode)
    expect(verified.status).toBe(BOOKING_STATUS.IN_SERVICE)
    expect(verified.verificationStatus).toBe('verified')
    expect(() => bookingApi.verify(verified.id, verified.verificationCode)).toThrow('已使用')
  })
})

import { describe, expect, it } from 'vitest'
import { calculateSelectionTotal, normalizeService, normalizeServiceCategory, SERVICE_CATEGORY_LIST } from '../utils/serviceCatalog.js'

describe('service catalog', () => {
  it('normalizes every explicit category without keyword guessing', () => {
    expect(SERVICE_CATEGORY_LIST.map(item => normalizeServiceCategory(item.id))).toEqual(['ticket','food','leisure','beauty','fitness','visit'])
  })

  it('builds category-specific packages and clamps quantity totals', () => {
    const service = normalizeService({ id: 'gym', price: 100, bookingConfig: { minQuantity: 1, maxQuantity: 3 } }, 'fitness')
    expect(service.serviceCategory).toBe('fitness')
    expect(service.packages).toHaveLength(3)
    expect(calculateSelectionTotal(service, { packageId: service.packages[0].id, quantity: 8 })).toBe(300)
  })
})

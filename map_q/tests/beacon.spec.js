import { beforeEach, describe, expect, it } from 'vitest'
import { installUniStorage } from './setup.js'
import { beaconApi, distanceMeters } from '../utils/api/beacon.js'

beforeEach(() => installUniStorage())

describe('beacon duplicate detection', () => {
  it('calculates nearby distance', () => {
    expect(distanceMeters(
      { latitude: 30.572269, longitude: 104.066541 },
      { latitude: 30.572369, longitude: 104.066541 }
    )).toBeLessThan(20)
  })

  it('marks same-name points within 150m as strong duplicates', () => {
    const draft = beaconApi.createDraftFromCoordinate(30.572269, 104.066541)
    draft.beacon.name = '天府广场'
    const duplicates = beaconApi.checkDuplicates(draft, [{
      _id: 'existing',
      name: '天府广场',
      location: { type: 'Point', coordinates: [104.0668, 30.5725] }
    }])
    expect(duplicates[0].level).toBe('strong')
  })
})

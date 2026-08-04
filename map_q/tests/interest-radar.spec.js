import { beforeEach, describe, expect, it } from 'vitest'
import { installUniStorage } from './setup.js'
import {
  blurPublicLocation,
  distanceKm,
  formatFreshness,
  interestRadarApi,
  rankRadarItems
} from '../utils/api/interestRadar.js'
import {
  autosaveLabel,
  loadCreationPreferences,
  saveCreationPreferences,
  summarizeCreationCenter
} from '../utils/creationQuickCenter.js'
import { createCreationDraft } from '../utils/api/creation.js'
import { MEDIA_STATUS } from '../utils/api/mediaUpload.js'

beforeEach(() => installUniStorage())

describe('interest radar adapter', () => {
  it('blurs public people locations and keeps a coarse map focus', () => {
    const source = { latitude: 30.572269, longitude: 104.066541 }
    const blurred = blurPublicLocation(source, 1)
    expect(blurred).not.toEqual(source)
    expect(distanceKm(source, blurred)).toBeGreaterThan(0.2)
    expect(distanceKm(source, blurred)).toBeLessThan(0.6)
  })

  it('ranks live and matching signals before stale unrelated items', () => {
    const now = 10_000_000
    const ranked = rankRadarItems([
      { id: 'stale', sharedInterests: ['跑步'], activeAt: now - 20 * 60 * 60 * 1000, distance: 4, isLive: false },
      { id: 'live', sharedInterests: ['摄影'], activeAt: now - 60_000, distance: 1, isLive: true }
    ], { interestTags: ['摄影'], radiusKm: 5, requestedAt: now })
    expect(ranked[0].id).toBe('live')
    expect(formatFreshness(now - 60_000, now)).toBe('刚刚')
  })

  it('caches scans for sixty seconds and exposes privacy-safe people', async () => {
    const query = {
      center: { latitude: 30.572269, longitude: 104.066541 },
      radiusKm: 5,
      interestTags: ['摄影'],
      requestedAt: 20_000_000
    }
    const first = await interestRadarApi.fetchNearby(query, { immediate: true })
    const second = await interestRadarApi.fetchNearby({ ...query, requestedAt: query.requestedAt + 30_000 }, { immediate: true })
    expect(second.cached).toBe(true)
    expect(first.items.length).toBeGreaterThanOrEqual(12)
    expect(first.items.some(item => item.kind === 'person')).toBe(true)
    expect(first.items.filter(item => item.kind === 'person').every(item => item.locationPrecision === 'fuzzy')).toBe(true)
    expect(first.items.every(item => item.sourceItem && item.detailId && item.detailType)).toBe(true)
  })
})

describe('creation quick center', () => {
  it('persists the default precision and applies it only to newly created drafts', () => {
    const previous = createCreationDraft('normal')
    saveCreationPreferences({ defaultLocationPrecision: 'exact' })
    const next = createCreationDraft('normal')
    expect(previous.location.precision).toBe('fuzzy')
    expect(next.location.precision).toBe('exact')
    expect(loadCreationPreferences().defaultLocationPrecision).toBe('exact')
  })

  it('summarizes media and review states for the inline panels', () => {
    const summary = summarizeCreationCenter([
      { id: 'draft', media: [{ id: 'failed', status: MEDIA_STATUS.FAILED }] }
    ], [{ id: 'record', status: 'review_pending' }])
    expect(summary.failed).toBe(1)
    expect(summary.reviewPending).toBe(1)
    expect(autosaveLabel(summary)).toContain('待处理')
  })
})

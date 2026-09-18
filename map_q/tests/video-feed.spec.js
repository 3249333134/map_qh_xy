import { describe, it, expect } from 'vitest'
import { createVideoFeed, normalizeVideo } from '../utils/videoFeed.js'
import { installUniStorage } from './setup.js'
import { getTestVideo } from '../utils/testMedia.js'

describe('video feed', () => {
  it.each([0, 1])('offers the other demo after entering demo %s, then ends without duplicates', async selected => {
    installUniStorage().set('USE_MOCK_DATA', true)
    const feed = createVideoFeed()
    const first = feed.seed(getTestVideo(selected))
    const result = await feed.next()
    expect(result.list.map(item => item.id)).toEqual([getTestVideo(1 - selected).id])
    expect(result.list[0].id).not.toBe(first.id)
    expect(result.hasMore).toBe(false)
    expect((await feed.next()).list).toEqual([])
  })
  it('shares in-flight requests and returns the same result to waiting callers', async () => {
    let resolvePage, calls = 0
    const feed = createVideoFeed(() => { calls++; return new Promise(resolve => { resolvePage = resolve }) })
    const first = feed.next(), second = feed.next()
    expect(first).toBe(second)
    resolvePage({ list: [{ id: 'x', type: 'video' }], hasMore: false })
    expect((await first).list[0].id).toBe('x')
    expect((await second).list[0].id).toBe('x')
    expect(calls).toBe(1)
  })
  it('keeps seed first, filters other types, deduplicates and requests without map filters', async () => {
    const requests = []
    const feed = createVideoFeed(async params => { requests.push(params); return { list: [{ id: 'a', type: 'video' }, { id: 'b', type: 'place' }, { id: 'c', type: 'video', videoUrl: 'clip.mp4' }], hasMore: false } })
    expect(feed.seed({ id: 'a', type: 'video' }).id).toBe('a')
    expect((await feed.next()).list.map(v => v.id)).toEqual(['c'])
    expect(await feed.next()).toEqual({ list: [], hasMore: false })
    expect(requests).toEqual([{ page: 1, pageSize: 20 }])
  })
  it('retries the same page after a failure', async () => {
    const pages = []; let fail = true
    const feed = createVideoFeed(async ({ page }) => { pages.push(page); if (fail) { fail = false; throw Error('offline') } return { list: [], hasMore: false } })
    await expect(feed.next()).rejects.toThrow('offline')
    await feed.next()
    expect(pages).toEqual([1, 1])
  })
  it('keeps valid zero coordinates and rejects missing or invalid location', () => {
    expect(normalizeVideo({ location: { type: 'Point', coordinates: [0, 0] } }).location.latitude).toBe(0)
    expect(normalizeVideo({ address: '已知地址' }).location).toBeNull()
    expect(normalizeVideo({ location: { latitude: 95, longitude: 100 } }).location).toBeNull()
    expect(normalizeVideo({ location: { latitude: null, longitude: 100 } }).location).toBeNull()
    expect(normalizeVideo({ location: { latitude: 30, longitude: 104, name: '公园' } }).location.name).toBe('公园')
  })
  it('resolves media sources without treating cover images as video', () => {
    expect(normalizeVideo({ cover: 'image.jpg' }).videoUrl).toBe('')
    expect(normalizeVideo({ media: [{ type: 'video', url: '/static/logo.png' }] }).videoUrl).toBe('')
    expect(normalizeVideo({ media: [{ type: 'video', url: 'movie.mp4' }] }).videoUrl).toBe('movie.mp4')
  })
})

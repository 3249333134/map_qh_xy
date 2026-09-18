import { describe, it, expect, beforeEach } from 'vitest'
import { contentDetailApi } from '../utils/api/contentDetail.js'
import { installUniStorage } from './setup.js'
import { TEST_MEDIA_VERSION, getTestVideo } from '../utils/testMedia.js'
let store
beforeEach(() => { store = installUniStorage(); store.set('USE_MOCK_DATA', false) })
describe('video detail identity', () => {
  it('rejects a different ID and a different type', async () => {
    store.set('INDEX_LAST_ITEM', { id: 'wrong', type: 'video' })
    await expect(contentDetailApi.fetchById('wanted', 'video')).rejects.toThrow('未找到')
    store.set('INDEX_LAST_ITEM', { id: 'wanted', type: 'article' })
    await expect(contentDetailApi.fetchById('wanted', 'video')).rejects.toThrow('未找到')
  })
  it('sets the active item on a cache hit', async () => {
    store.set('INDEX_LAST_ITEM', { id: 'a', type: 'video', videoUrl: 'a.mp4' })
    await contentDetailApi.fetchById('a', 'video')
    store.set('CONTENT_DETAIL_ACTIVE_V1', { id: 'b', type: 'video' })
    await contentDetailApi.fetchById('a', 'video')
    expect(store.get('CONTENT_DETAIL_ACTIVE_V1').id).toBe('a')
  })
  it('uses stable demo identities and current demo media without touching interactions', async () => {
    store.set('USE_MOCK_DATA', true)
    expect(getTestVideo(0).id).toBe(getTestVideo(2).id)
    store.set('CONTENT_ACTION_STATE_V1', { sentinel: 'preserve' })
    const detail = await contentDetailApi.fetchById(getTestVideo(0).id, 'video')
    expect(detail.demoVersion).toBe(TEST_MEDIA_VERSION)
    expect(detail.cover).toBe('/static/video-demo/street.jpg')
    expect(store.get('CONTENT_ACTION_STATE_V1')).toEqual({ sentinel: 'preserve' })
    store.set('USE_MOCK_DATA', false)
    await expect(contentDetailApi.fetchById(getTestVideo(0).id, 'video')).rejects.toThrow('未找到')
    await expect(contentDetailApi.fetchById(getTestVideo(1).id, 'video')).rejects.toThrow('未找到')
  })
})

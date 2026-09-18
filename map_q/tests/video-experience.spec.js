import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { createRenderer, nextTick } from 'vue'
import { installUniStorage } from './setup.js'
import VideoDetail from '../pages/detail/components/VideoDetail.vue'
const hooks = vi.hoisted(() => ({}))
const api = vi.hoisted(() => ({ fetch: vi.fn() }))
vi.mock('@dcloudio/uni-app', () => ({ onHide: fn => { hooks.hide = fn }, onShow: fn => { hooks.show = fn }, onBackPress: fn => { hooks.back = fn } }))
vi.mock('../utils/api/map.js', () => ({ mapDataApi: { fetchMapData: api.fetch } }))
const renderer = createRenderer({ createElement: () => ({}), createText: () => ({}), createComment: () => ({}), insert() {}, remove() {}, setText() {}, setElementText() {}, parentNode() {}, nextSibling() {}, patchProp() {} })
let app, state, store, player
beforeEach(async () => {
  api.fetch.mockResolvedValue({ list: [{ id: 'second', type: 'video', videoUrl: 'second.mp4', location: { type: 'Point', coordinates: [104, 30] } }], hasMore: false })
  store = installUniStorage(); store.set('USE_MOCK_DATA', false)
  player = { pause: vi.fn(), play: vi.fn(), seek: vi.fn() }
  Object.assign(uni, { createVideoContext: () => player, hideKeyboard: vi.fn(), getWindowInfo: () => ({ statusBarHeight: 24, safeAreaInsets: { bottom: 20 } }), navigateBack: vi.fn(), switchTab: vi.fn() })
  app = renderer.createApp({ ...VideoDetail, render: () => null }, { detail: { id: 'first', type: 'video', videoUrl: 'first.mp4', author: { name: '甲' } } })
  state = app.mount({}).$.setupState
  await nextTick(); await Promise.resolve(); await nextTick()
})
afterEach(() => app.unmount())
describe('video experience state', () => {
  it.each(['client', 'page', 'native'])('switches both directions with %s touch coordinates without toggling playback', async kind => {
    const point = y => kind === 'native' ? { x: 160, y } : kind === 'page' ? { pageX: 160, pageY: y } : { clientX: 160, clientY: y }
    state.touchStart({ touches: [point(600)] })
    await state.touchEnd({ changedTouches: [point(200)] })
    expect(state.current.id).toBe('second')
    state.togglePlay()
    expect(player.play).not.toHaveBeenCalled()
    state.touchStart({ touches: [point(200)] })
    await state.touchEnd({ changedTouches: [point(600)] })
    expect(state.current.id).toBe('first')
  })
  it('ignores cancelled gestures, horizontal gestures and drawer swipes', async () => {
    const begin = () => state.touchStart({ touches: [{ x: 150, y: 600 }] })
    const end = () => state.touchEnd({ changedTouches: [{ x: 150, y: 200 }] })
    begin(); state.touchCancel(); await end()
    expect(state.index).toBe(0)
    begin(); await state.touchEnd({ changedTouches: [{ x: 350, y: 580 }] })
    expect(state.index).toBe(0)
    begin(); state.openDrawer('map'); await end()
    expect(state.index).toBe(0)
    state.closeDrawer(); begin(); await end()
    expect(state.index).toBe(1)
  })
  it('rejects old player events even after returning to the same video', async () => {
    const old = state.playbackHandlers
    await state.move(1); await state.move(-1)
    state.time = 3
    old.time({ detail: { currentTime: 80, duration: 100 } }); old.error()
    expect(state.time).toBe(3)
    expect(state.playError).toBe(false)
  })
  it('resets invalid stored progress after actual duration is known', () => {
    state.time = 90
    state.playbackHandlers.metadata({ detail: { duration: 5, width: 640, height: 360 } })
    expect(state.time).toBe(0)
    expect(player.seek).toHaveBeenCalledWith(0)
    expect(state.fit).toBe('contain')
  })
  it.each([false, true])('waits for preload, cancels the switch when hidden=%s', async hidden => {
    app.unmount()
    let resolvePage
    api.fetch.mockImplementationOnce(() => new Promise(resolve => { resolvePage = resolve }))
    app = renderer.createApp({ ...VideoDetail, render: () => null }, { detail: { id: 'first', type: 'video', videoUrl: 'first.mp4' } })
    state = app.mount({}).$.setupState
    const moving = state.move(1)
    const duplicateGesture = state.move(1)
    if (hidden) hooks.hide()
    resolvePage({ list: [{ id: 'second', type: 'video', videoUrl: 'second.mp4' }], hasMore: false })
    await moving; await duplicateGesture
    expect(state.index).toBe(hidden ? 0 : 1)
  })
  it('keeps playback running across mutually exclusive drawers and blocks video switching', async () => {
    state.playing = true
    state.openDrawer('map')
    await state.move(1)
    expect(state.index).toBe(0)
    expect(state.drawer).toBe('map')
    state.openDrawer('comments')
    expect(state.drawer).toBe('comments')
    expect(player.pause).not.toHaveBeenCalled()
    expect(state.playing).toBe(true)
    expect(hooks.back()).toBe(true)
    expect(state.drawer).toBe('')
    expect(hooks.back()).toBe(false)
  })
  it('saves progress, changes active sharing item and isolates interactions', async () => {
    state.time = 12
    state.toggle('liked')
    await state.move(1)
    expect(state.current.id).toBe('second')
    expect(state.state.liked).toBe(false)
    expect(store.get('CONTENT_DETAIL_ACTIVE_V1').id).toBe('second')
    expect(store.get('VIDEO_PROGRESS_V1').first.currentTime).toBe(12)
    state.draft = '第二条的评论'; state.sendComment()
    expect(state.state.comments).toHaveLength(1)
    await state.move(-1)
    expect(state.state.comments).toHaveLength(0)
    expect(state.state.liked).toBe(true)
    expect(state.time).toBe(12)
    expect(player.pause).toHaveBeenCalled()
  })
  it('recenters only the map without unsupported APIs or pausing the video', async () => {
    await state.move(1)
    state.openDrawer('map')
    player.pause.mockClear()
    const previous = state.mapRevision
    state.mapError = true
    state.recenter()
    expect(state.mapRevision).toBe(previous + 1)
    expect(state.mapError).toBe(false)
    expect(state.current.location.latitude).toBe(30)
    expect(player.pause).not.toHaveBeenCalled()
  })
  it('pauses on hide and only resumes if previously playing', async () => {
    state.playing = true; hooks.hide(); hooks.show(); await nextTick()
    expect(player.pause).toHaveBeenCalledOnce()
    expect(player.play).toHaveBeenCalledOnce()
  })
})

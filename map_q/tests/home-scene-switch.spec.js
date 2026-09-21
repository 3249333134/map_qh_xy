import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

// Execute the page's real setup with map/platform boundaries stubbed.
function createPage() {
  const contentHeight = ref(440)
  const currentMode = ref('mid')
  const mapConfig = { latitude: 30.6, longitude: 104.1, scale: 14, markers: [], polyline: [{ id: 'route' }] }
  const updateMapMarkers = vi.fn(() => { mapConfig.markers = [{ id: 'ordinary' }] })
  const context = {
    ref, console, setTimeout, clearTimeout,
    onMounted() {}, onLoad() {}, onHide() {}, onShow() {}, onShareAppMessage() {},
    MapBackground: {}, InlineMapSocial: {}, ContentArea: {}, GlobalOverlayHost: {},
    uni: { setStorageSync: vi.fn() },
    messageBoardApi: { list: () => [] },
    useMapData: () => ({ mapPoints: ref([]), fetchMapData: async () => {}, loadMoreItems: async () => {} }),
    useCategory: () => ({ categories: ref([]), activeCategory: ref('all') }),
    useLayout: () => ({
      contentHeight, currentMode,
      setContentMode(mode) { currentMode.value = mode; contentHeight.value = mode === 'min' ? 144 : 560 },
      handleDragEnd() {},
    }),
    useMapManager: () => ({
      mapConfig, updateMapMarkers, visibleCardIndices: ref([]), saveMapState() {}, selectPoint() {},
      exploreState: { center: {}, timeRange: {}, spatialFilter: {}, layers: [] },
    }),
  }
  const file = readFileSync(new URL('../pages/index/index.vue', import.meta.url), 'utf8')
  const script = file.match(/<script>([\s\S]*?)<\/script>/)[1]
    .replace(/^import[\s\S]*?from ['"][^'"]+['"]\s*$/gm, '')
    .replace('export default', 'globalThis.component =')
  vm.runInNewContext(script, context)
  return { page: context.component.setup(), updateMapMarkers, currentMode }
}

describe('home map scene switching', () => {
  it('switches all five scenes in place and restores the previous panel and route when the side control closes', () => {
    const { page } = createPage()
    for (const scene of ['people', 'checkin', 'mate', 'couple', 'board']) {
      page.openMapSocial(scene)
      expect(page.socialMode.value).toBe(true)
      expect(page.socialScene.value).toBe(scene)
      expect(page.contentHeight.value).toBe(144)
      expect([page.mapConfig.latitude, page.mapConfig.longitude, page.mapConfig.scale]).toEqual([30.6, 104.1, 14])
      expect(page.mapConfig.polyline).toEqual([])
    }
    page.openMapSocial('board')
    expect(page.socialMode.value).toBe(true)
    page.setSocialMode(false)
    expect(page.socialMode.value).toBe(false)
    expect(page.contentHeight.value).toBe(440)
    expect(page.mapConfig.polyline).toEqual([{ id: 'route' }])
    expect(page.mapConfig.markers).toEqual([{ id: 'ordinary' }])
  })

  it('opens the default immediately and remembers the scene through repeated toggles', () => {
    const { page } = createPage()
    page.setSocialMode(false)
    expect(page.contentHeight.value).toBe(440)
    page.setSocialMode(true)
    expect(page.socialScene.value).toBe('people')
    expect(page.mapConfig.markers.length).toBeGreaterThan(0)
    page.openMapSocial('mate')
    for (let i = 0; i < 4; i++) {
      page.socialSelected.value = page.mapConfig.markers[0]
      page.setSocialMode(false)
      expect(page.socialSelected.value).toBeNull()
      expect(page.contentHeight.value).toBe(440)
      expect(page.mapConfig.markers).toEqual([{ id: 'ordinary' }])
      page.setSocialMode(true)
      expect(page.socialMode.value).toBe(true)
      expect(page.socialScene.value).toBe('mate')
      expect(page.socialSelected.value).toBeNull()
      expect(page.contentHeight.value).toBe(144)
    }
  })

  it('keeps selection on repeat taps and exits for ordinary layer tools', () => {
    const { page } = createPage()
    page.setSocialMode(true)
    const selected = page.mapConfig.markers[0]
    page.socialSelected.value = selected
    const selectedProxy = page.socialSelected.value
    page.openMapSocial('people')
    expect(page.socialSelected.value).toBe(selectedProxy)
    expect(page.socialMode.value).toBe(true)
    page.openLayers()
    expect(page.socialMode.value).toBe(false)
    expect(page.socialSelected.value).toBeNull()
    expect(page.exploreToolMode.value).toBe('layers')
    page.closeExploreTool()
    expect(page.contentHeight.value).toBe(440)
  })

  it('falls back to nearby people for an invalid stored scene', () => {
    const { page } = createPage()
    page.socialScene.value = 'removed-scene'
    page.setSocialMode(true)
    expect(page.socialScene.value).toBe('people')
  })

  it('does not replace scene markers when ordinary pagination finishes', async () => {
    const { page, updateMapMarkers } = createPage()
    page.openMapSocial('mate')
    const markers = page.mapConfig.markers
    await page.loadMoreItems()
    expect(updateMapMarkers).not.toHaveBeenCalled()
    expect(page.mapConfig.markers).toBe(markers)
  })

  it('exits the scene for search and preserves the expanded height after dragging', () => {
    const { page, currentMode } = createPage()
    page.openMapSocial('people')
    page.onSearchTap()
    expect(page.socialMode.value).toBe(false)
    expect(page.contentHeight.value).toBe(560)
    page.openMapSocial('checkin')
    page.contentHeight.value = 390
    currentMode.value = 'mid'
    page.onPanelDragEnd()
    expect(page.socialMode.value).toBe(false)
    expect(page.contentHeight.value).toBe(390)
  })
})


describe('controlled scene toolbar', () => {
  it('requests mode changes without keeping a separate local open state', () => {
    const file = readFileSync(new URL('../components/map/ExploreControls.vue', import.meta.url), 'utf8')
    const script = file.match(/<script>([\s\S]*?)<\/script>/)[1]
      .replace(/^import[\s\S]*?from ['"][^'"]+['"]\s*$/gm, '')
      .replace('export default', 'globalThis.component =')
    const vibrateShort = vi.fn()
    const context = { CITY_OPTIONS: [], uni: { vibrateShort } }
    vm.runInNewContext(script, context)
    const component = context.component
    expect(component.data()).not.toHaveProperty('socialMode')
    expect(component.data()).not.toHaveProperty('quickPanelOpen')
    const state = { socialMode: false, $emit: vi.fn() }
    component.methods.toggleQuickPanel.call(state)
    expect(state.$emit).toHaveBeenLastCalledWith('social-mode-change', true)
    expect(state.socialMode).toBe(false)
    state.socialMode = true
    component.methods.toggleQuickPanel.call(state)
    expect(state.$emit).toHaveBeenLastCalledWith('social-mode-change', false)
    expect(state.socialMode).toBe(true)
    state.sceneScrollTarget = 'social-people'
    component.methods.selectSocialScene.call(state, 'couple')
    expect(state.$emit).toHaveBeenLastCalledWith('social-scene-change', 'couple')
    expect(vibrateShort).not.toHaveBeenCalled()
    expect(state.sceneScrollTarget).toBe('social-people')
    const nextTicks = []
    state.$nextTick = callback => nextTicks.push(callback)
    state.socialScene = 'couple'
    component.watch.socialMode.call(state, true)
    expect(state.sceneScrollTarget).toBe('')
    nextTicks.shift()()
    expect(state.sceneScrollTarget).toBe('social-couple')
  })
})

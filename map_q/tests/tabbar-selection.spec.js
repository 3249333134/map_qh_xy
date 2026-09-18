import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { describe, expect, it } from 'vitest'

function createTabbar(route) {
  let definition, currentRoute = route
  const deferred = []
  runInNewContext(readFileSync(new URL('../custom-tab-bar/index.js', import.meta.url), 'utf8'), {
    Component: value => { definition = value },
    getCurrentPages: () => currentRoute ? [{ route: currentRoute }] : [],
    getApp: () => ({ globalData: {} }),
    wx: { nextTick: fn => deferred.push(fn) }
  })
  const tab = { data: { ...definition.data }, setData(patch) { Object.assign(this.data, patch) }, ...definition.methods }
  return { tab, definition, deferred, route: value => { currentRoute = value } }
}

describe('native tabbar selection', () => {
  it('pins the same tab rectangles while open, restores them on close and blocks other tabs', () => {
    const { tab } = createTabbar('pages/message/index')
    const rect = { left: 156, top: 780, width: 78, height: 48 }
    tab.createSelectorQuery = () => ({ selectAll: () => ({ boundingClientRect: callback => ({ exec: () => callback([rect]) }) }) })
    tab.setPublishOpen(true)
    expect(tab.data.itemStyles[0]).toContain('left:156px;top:780px;width:78px;height:48px;')
    expect(tab.data.publishOpen).toBe(true)
    tab.onTap({ currentTarget: { dataset: { index: 1 } } })
    expect(tab.data.selected).toBe(0)
    tab.setPublishOpen(false)
    expect(tab.data.publishOpen).toBe(false)
  })
  it('selects messages on direct entry and other tabs on return', () => {
    const { tab, definition, route } = createTabbar('pages/message/index')
    definition.ready.call(tab)
    expect(tab.data.selected).toBe(3)
    route('/pages/my/index'); definition.pageLifetimes.show.call(tab)
    expect(tab.data.selected).toBe(4)
    route('pages/index/index'); tab.updateSelected()
    expect(tab.data.selected).toBe(0)
  })
  it('corrects the selection after a page-show timing race', () => {
    const { tab, definition, route, deferred } = createTabbar('pages/index/index')
    definition.pageLifetimes.show.call(tab)
    route('pages/message/index')
    deferred.forEach(fn => fn())
    expect(tab.data.selected).toBe(3)
  })
  it('keeps the current tab during empty page stacks and publish navigation', () => {
    const { tab, route } = createTabbar('pages/message/index')
    tab.updateSelected()
    for (const path of ['', 'pages/chat/index', 'pages/plus/index']) {
      route(path); tab.updateSelected()
      expect(tab.data.selected).toBe(3)
    }
  })
})

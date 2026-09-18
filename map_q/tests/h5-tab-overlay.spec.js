import { afterEach, describe, expect, it, vi } from 'vitest'
import { syncH5TabOverlay } from '../utils/h5TabOverlay.js'

afterEach(() => { syncH5TabOverlay(false); vi.unstubAllGlobals() })
describe('H5 overlay tab geometry', () => {
  it('measures every tab before changing layout and restores original inline styles', () => {
    const classes = new Set()
    const items = Array.from({ length: 5 }, (_, index) => ({
      style: { cssText: `color: ${index};` },
      getBoundingClientRect() {
        const displaced = items.filter(item => item.style.position === 'fixed').length * 10
        return { left: index * 78 - displaced, top: 790, width: 78, height: 50 }
      }
    }))
    vi.stubGlobal('document', { querySelectorAll: () => items, body: { classList: { contains: name => classes.has(name), toggle: (name, open) => open ? classes.add(name) : classes.delete(name) } } })
    syncH5TabOverlay(true)
    expect(items[2].style.left).toBe('156px')
    expect(items[2].style.top).toBe('790px')
    syncH5TabOverlay(true)
    expect(items[2].style.left).toBe('156px')
    syncH5TabOverlay(false)
    expect(items[2].style.cssText).toBe('color: 2;')
    expect(classes.size).toBe(0)
  })
})

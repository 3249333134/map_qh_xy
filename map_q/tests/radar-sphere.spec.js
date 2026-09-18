import { describe, expect, it } from 'vitest'
import { createRadarMotion, identityRotation, projectRadarSphere, radarTouchPoint, rotateOrientation } from '../utils/radarSphere.js'

function harness(reducedMotion = false) {
  let time = 0, sequence = 0
  const frames = new Map(), values = []
  const motion = createRadarMotion({ onChange: value => values.push(value), now: () => time, schedule: fn => { frames.set(++sequence, fn); return sequence }, cancel: id => frames.delete(id), reducedMotion: () => reducedMotion })
  return { motion, frames, values, advance(dt = 32) { time += dt; const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(fn => fn()) } }
}

describe('radar sphere gestures', () => {
  it('reads native, web and page coordinates without inventing missing coordinates', () => {
    for (const point of [{ x: 0, y: 2 }, { clientX: 0, clientY: 2 }, { pageX: 0, pageY: 2 }]) expect(radarTouchPoint(point)).toEqual({ x: 0, y: 2 })
    expect(radarTouchPoint({})).toBeNull()
  })
  it('rotates on both axes while preserving sphere geometry through many turns', () => {
    let matrix = identityRotation()
    for (let i = 0; i < 1000; i++) matrix = rotateOrientation(matrix, 0.03, -0.02)
    for (let row = 0; row < 3; row++) expect(Math.hypot(...matrix.slice(row * 3, row * 3 + 3))).toBeCloseTo(1, 9)
    expect(matrix).not.toEqual(identityRotation())
  })
  it('coalesces drag updates, continues with inertia and stops in bounded time', () => {
    const h = harness()
    h.motion.begin({ x: 100, y: 100 }); h.advance()
    h.motion.move({ x: 130, y: 120 }); h.motion.move({ x: 160, y: 140 })
    expect(h.frames.size).toBe(1)
    expect(h.motion.end()).toBe(true)
    const released = h.values.length
    h.advance(); expect(h.values.length).toBeGreaterThan(released)
    for (let i = 0; i < 50; i++) h.advance()
    expect(h.frames.size).toBe(0)
  })
  it('pressing again interrupts inertia; cancelling removes pending updates', () => {
    const h = harness()
    h.motion.begin({ x: 0, y: 0 }); h.advance(); h.motion.move({ x: 50, y: 50 }); h.motion.end()
    expect(h.motion.begin({ x: 20, y: 20 })).toBe(true)
    expect(h.frames.size).toBe(0)
    h.motion.move({ x: 90, y: 70 }); h.motion.stop()
    const count = h.values.length
    h.advance(); expect(h.values).toHaveLength(count)
  })
  it('does not rotate taps or add inertia for reduced motion', () => {
    const h = harness(true)
    h.motion.begin({ x: 0, y: 0 }); h.motion.move({ x: 2, y: 2 })
    expect(h.motion.end()).toBe(false); expect(h.values).toHaveLength(0)
    h.motion.begin({ x: 0, y: 0 }); h.advance(); h.motion.move({ x: 50, y: 50 }); h.motion.end()
    expect(h.values).toHaveLength(1); expect(h.frames.size).toBe(0)
  })
  it('keeps target identity and pixel positions within a small canvas', () => {
    const target = { id: 'content-1' }
    const points = Array.from({ length: 32 }, (_, i) => ({ cloudId: String(i), title: '兴趣标签', targetItem: target }))
    const projected = projectRadarSphere(points, identityRotation(), 280, 200)
    expect(projected.some(p => p.visible)).toBe(true)
    for (const point of projected) {
      expect(point.targetItem).toBe(target)
      expect(point.x).toBeGreaterThan(0); expect(point.x).toBeLessThan(280)
      expect(point.y).toBeGreaterThan(0); expect(point.y).toBeLessThan(200)
    }
  })
})

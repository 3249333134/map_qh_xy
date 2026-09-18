export const identityRotation = () => [1, 0, 0, 0, 1, 0, 0, 0, 1]

// Apply rotations in screen space so diagonal drags remain intuitive after any turn.
export function rotateOrientation(matrix, dx, dy) {
  const cy = Math.cos(dx), sy = Math.sin(dx), cx = Math.cos(dy), sx = Math.sin(dy)
  const rotation = [cy, 0, sy, sx * sy, cx, -sx * cy, -cx * sy, sx, cx * cy]
  return rotation.map((_, i) => {
    const row = Math.floor(i / 3), col = i % 3
    return rotation[row * 3] * matrix[col] + rotation[row * 3 + 1] * matrix[col + 3] + rotation[row * 3 + 2] * matrix[col + 6]
  })
}

export function radarTouchPoint(point) {
  if (!point) return null
  const x = point.clientX ?? point.pageX ?? point.x, y = point.clientY ?? point.pageY ?? point.y
  return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null
}

export function createRadarMotion({ onChange, now = Date.now, schedule = fn => setTimeout(fn, 32), cancel = clearTimeout, reducedMotion = () => false, sensitivity = () => 0.009 }) {
  let orientation = rotateOrientation(identityRotation(), 0.28, -0.12)
  let frame = null, touch = null, velocity = [0, 0], queued = [0, 0], lastFrame = 0, released = 0
  const flush = () => {
    if (queued[0] || queued[1]) {
      orientation = rotateOrientation(orientation, queued[0], queued[1]); queued = [0, 0]
      onChange(orientation)
    }
  }
  const tick = () => {
    frame = null
    const time = now(), dt = Math.min(48, Math.max(1, time - lastFrame)); lastFrame = time
    if (!touch) {
      const decay = Math.exp(-dt / 180)
      velocity = velocity.map(value => value * decay)
      queued[0] += velocity[0] * dt; queued[1] += velocity[1] * dt
    }
    flush()
    if (!touch && time - released < 1200 && Math.hypot(...velocity) > 0.00008) frame = schedule(tick)
  }
  const stop = () => { if (frame !== null) cancel(frame); frame = null; queued = [0, 0]; velocity = [0, 0]; touch = null }
  return {
    begin(point) {
      const wasMoving = frame !== null && !touch
      stop()
      touch = { ...point, origin: point, time: now(), moved: false }
      return wasMoving
    },
    move(point) {
      if (!touch) return false
      if (!touch.moved && Math.hypot(point.x - touch.origin.x, point.y - touch.origin.y) < 6) return false
      const time = now(), dt = Math.max(8, time - touch.time), scale = sensitivity()
      const dx = (point.x - touch.x) * scale, dy = -(point.y - touch.y) * scale
      velocity = [dx / dt, dy / dt].map(value => Math.max(-0.012, Math.min(0.012, value)))
      queued[0] += dx; queued[1] += dy
      touch = { ...touch, ...point, time, moved: true }
      if (frame === null) { lastFrame = time; frame = schedule(tick) }
      return true
    },
    end() {
      if (!touch) return false
      const moved = touch.moved, fresh = now() - touch.time < 100
      if (frame !== null) cancel(frame)
      frame = null; flush(); touch = null
      if (moved && fresh && !reducedMotion()) { released = lastFrame = now(); frame = schedule(tick) }
      return moved
    },
    stop,
    rotate(direction) { stop(); orientation = rotateOrientation(orientation, direction * 0.5, 0); onChange(orientation) }
  }
}

export function projectRadarSphere(points, orientation, width = 320, height = 320) {
  const count = Math.max(1, points.length), radius = Math.max(20, Math.min(width - 80, height - 54) / 2)
  const placed = []
  return points.map((point, index) => {
    const y = 1 - 2 * ((index + 0.5) / count), ring = Math.sqrt(1 - y * y)
    const angle = index * Math.PI * (3 - Math.sqrt(5)), p = [Math.cos(angle) * ring, y, Math.sin(angle) * ring]
    const [x, ry, z] = [0, 1, 2].map(row => p.reduce((sum, value, col) => sum + value * orientation[row * 3 + col], 0))
    return { ...point, x: width / 2 + x * radius, y: height / 2 - ry * radius, z }
  }).sort((a, b) => Number(!!a.isTag) - Number(!!b.isTag) || b.z - a.z).map(point => {
    const scale = 0.65 + (point.z + 1) * 0.22
    const labelWidth = Math.min(110, Math.max(40, String(point.title).length * 12 + 18)) * scale
    const overlaps = placed.some(box => Math.abs(box.x - point.x) < (box.width + labelWidth) / 2 && Math.abs(box.y - point.y) < 23 * scale)
    const visible = point.z > -0.82 && !overlaps
    if (visible) placed.push({ x: point.x, y: point.y, width: labelWidth })
    return { ...point, visible, position: { left: `${point.x}px`, top: `${point.y}px`, opacity: visible ? Math.max(0.2, 0.62 + point.z * 0.38) : 0, zIndex: Math.round(20 + point.z * 10), transform: `translate(-50%, -50%) scale(${scale.toFixed(3)})` } }
  })
}

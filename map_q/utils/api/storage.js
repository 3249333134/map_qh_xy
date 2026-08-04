export function readVersioned(key, version, fallback) {
  try {
    const raw = uni.getStorageSync(key)
    if (!raw) return fallback
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (parsed && parsed.version === version) return parsed.data
    return fallback
  } catch (error) {
    return fallback
  }
}

export function writeVersioned(key, version, data) {
  uni.setStorageSync(key, { version, updatedAt: Date.now(), data })
  return data
}

export function asArray(value) {
  return Array.isArray(value) ? value : []
}


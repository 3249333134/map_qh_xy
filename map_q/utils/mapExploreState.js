export const MAP_EXPLORE_VERSION = 1
export const MAP_EXPLORE_STATE_KEY = 'MAP_EXPLORE_STATE_V1'
export const MAP_EXPLORE_COMMAND_KEY = 'MAP_EXPLORE_COMMAND_V1'
export const MAP_EXPLORE_DATA_CACHE_KEY = 'MAP_EXPLORE_DATA_CACHE_V1'
export const MAP_EXPLORE_CACHE_TTL = 10 * 60 * 1000

export const DEFAULT_CITY = Object.freeze({
  cityCode: '510100',
  cityName: '成都',
  latitude: 30.572269,
  longitude: 104.066541
})

export const CITY_OPTIONS = Object.freeze([
  DEFAULT_CITY,
  { cityCode: '420100', cityName: '武汉', latitude: 30.59285, longitude: 114.30554 },
  { cityCode: '110100', cityName: '北京', latitude: 39.9042, longitude: 116.4074 },
  { cityCode: '310100', cityName: '上海', latitude: 31.2304, longitude: 121.4737 },
  { cityCode: '440100', cityName: '广州', latitude: 23.1291, longitude: 113.2644 },
  { cityCode: '440300', cityName: '深圳', latitude: 22.5431, longitude: 114.0579 }
])

export const createDefaultMapExploreState = () => ({
  version: MAP_EXPLORE_VERSION,
  center: { ...DEFAULT_CITY },
  scale: 14,
  category: 'all',
  timeRange: { preset: 'all', start: '', end: '' },
  spatialFilter: { mode: 'bounds', radiusKm: 5 },
  layers: ['content', 'place', 'service', 'event', 'route', 'replica'],
  panelMode: 'mid',
  selectedPointId: '',
  updatedAt: Date.now()
})

const asNumber = (value, fallback) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function normalizeMapExploreState(input = {}) {
  const fallback = createDefaultMapExploreState()
  const center = input.center || {}
  const timeRange = input.timeRange || {}
  const spatialFilter = input.spatialFilter || {}
  const panelModes = ['min', 'mid', 'max']
  return {
    version: MAP_EXPLORE_VERSION,
    center: {
      cityCode: String(center.cityCode || fallback.center.cityCode),
      cityName: String(center.cityName || fallback.center.cityName),
      latitude: asNumber(center.latitude, fallback.center.latitude),
      longitude: asNumber(center.longitude, fallback.center.longitude)
    },
    scale: Math.max(3, Math.min(20, asNumber(input.scale, fallback.scale))),
    category: String(input.category || fallback.category),
    timeRange: {
      preset: String(timeRange.preset || fallback.timeRange.preset),
      start: String(timeRange.start || ''),
      end: String(timeRange.end || '')
    },
    spatialFilter: {
      mode: spatialFilter.mode === 'radius' ? 'radius' : 'bounds',
      radiusKm: [1, 3, 5, 10].includes(Number(spatialFilter.radiusKm))
        ? Number(spatialFilter.radiusKm)
        : fallback.spatialFilter.radiusKm
    },
    layers: Array.isArray(input.layers) ? [...new Set(input.layers.map(String))] : [...fallback.layers],
    panelMode: panelModes.includes(input.panelMode) ? input.panelMode : fallback.panelMode,
    selectedPointId: String(input.selectedPointId || ''),
    updatedAt: asNumber(input.updatedAt, Date.now())
  }
}

export function loadMapExploreState() {
  try {
    const raw = uni.getStorageSync(MAP_EXPLORE_STATE_KEY)
    if (!raw) return { state: createDefaultMapExploreState(), restored: false }
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    return { state: normalizeMapExploreState(parsed), restored: true }
  } catch (error) {
    console.warn('地图探索状态读取失败，已恢复默认值', error)
    return { state: createDefaultMapExploreState(), restored: false }
  }
}

export function saveMapExploreState(state) {
  const normalized = normalizeMapExploreState({ ...state, updatedAt: Date.now() })
  try {
    uni.setStorageSync(MAP_EXPLORE_STATE_KEY, normalized)
  } catch (error) {
    console.warn('地图探索状态保存失败', error)
  }
  return normalized
}

export function setMapExploreCommand(command = {}) {
  const payload = { ...command, id: command.id || `cmd_${Date.now()}`, createdAt: Date.now() }
  uni.setStorageSync(MAP_EXPLORE_COMMAND_KEY, payload)
  return payload
}

export function consumeMapExploreCommand() {
  try {
    const command = uni.getStorageSync(MAP_EXPLORE_COMMAND_KEY)
    if (!command) return null
    uni.removeStorageSync(MAP_EXPLORE_COMMAND_KEY)
    return command
  } catch (error) {
    console.warn('地图探索命令读取失败', error)
    return null
  }
}

const round = (value, precision = 4) => Number(asNumber(value, 0).toFixed(precision))

export function buildMapQueryKey(query = {}) {
  const bounds = query.bounds || {}
  const northeast = bounds.northeast || {}
  const southwest = bounds.southwest || {}
  return JSON.stringify({
    ne: [round(northeast.latitude), round(northeast.longitude)],
    sw: [round(southwest.latitude), round(southwest.longitude)],
    category: query.category || 'all',
    timeStart: query.timeStart || '',
    timeEnd: query.timeEnd || '',
    radiusKm: asNumber(query.radiusKm, 5),
    layers: [...(query.layers || [])].sort(),
    page: asNumber(query.page, 1),
    pageSize: asNumber(query.pageSize, 12)
  })
}

export function saveExploreDataCache(queryKey, items) {
  try {
    uni.setStorageSync(MAP_EXPLORE_DATA_CACHE_KEY, {
      queryKey,
      items: Array.isArray(items) ? items : [],
      cachedAt: Date.now()
    })
  } catch (error) {
    console.warn('地图内容缓存失败', error)
  }
}

export function loadExploreDataCache({ allowStale = true } = {}) {
  try {
    const cached = uni.getStorageSync(MAP_EXPLORE_DATA_CACHE_KEY)
    if (!cached || !Array.isArray(cached.items)) return null
    const fresh = Date.now() - Number(cached.cachedAt || 0) < MAP_EXPLORE_CACHE_TTL
    if (!fresh && !allowStale) return null
    return { ...cached, fresh }
  } catch (error) {
    return null
  }
}

export function buildShareSnapshot(state) {
  const normalized = normalizeMapExploreState(state)
  return {
    lat: round(normalized.center.latitude, 5),
    lng: round(normalized.center.longitude, 5),
    scale: normalized.scale,
    city: normalized.center.cityName,
    category: normalized.category,
    time: normalized.timeRange.preset,
    radius: normalized.spatialFilter.mode === 'bounds' ? 0 : normalized.spatialFilter.radiusKm,
    layers: normalized.layers.join(','),
    selected: normalized.selectedPointId || ''
  }
}

export function encodeShareSnapshot(state) {
  return encodeURIComponent(JSON.stringify(buildShareSnapshot(state)))
}

export function decodeShareSnapshot(value) {
  if (!value) return null
  try {
    const parsed = JSON.parse(decodeURIComponent(value))
    return normalizeMapExploreState({
      center: {
        ...DEFAULT_CITY,
        cityName: parsed.city || DEFAULT_CITY.cityName,
        latitude: parsed.lat,
        longitude: parsed.lng
      },
      scale: parsed.scale,
      category: parsed.category,
      timeRange: { preset: parsed.time || 'all' },
      spatialFilter: parsed.radius
        ? { mode: 'radius', radiusKm: Number(parsed.radius) }
        : { mode: 'bounds', radiusKm: 5 },
      layers: String(parsed.layers || '').split(',').filter(Boolean),
      selectedPointId: parsed.selected || ''
    })
  } catch (error) {
    console.warn('分享地图参数解析失败', error)
    return null
  }
}

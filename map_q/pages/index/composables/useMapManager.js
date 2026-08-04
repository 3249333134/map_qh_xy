import { ref, reactive } from 'vue'
import {
  createDefaultMapExploreState,
  loadMapExploreState,
  normalizeMapExploreState,
  saveMapExploreState
} from '../../../utils/mapExploreState.js'

const MARKER_CONFIG = {
  normal: { iconPath: '/static/marker-blue.png' },
  video: { iconPath: '/static/marker-purple.png' },
  article: { iconPath: '/static/marker-blue.png' },
  place: { iconPath: '/static/marker-green.png' },
  event: { iconPath: '/static/marker-orange.png' },
  service: { iconPath: '/static/marker-green.png' },
  replica: { iconPath: '/static/marker-orange.png' },
  candidate: { iconPath: '/static/marker-orange.png' }
}

const pointCoords = point => {
  const coords = point?.location?.type === 'Point' ? point.location.coordinates : null
  if (!Array.isArray(coords) || coords.length < 2) return null
  const longitude = Number(coords[0])
  const latitude = Number(coords[1])
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null
}

export function useMapManager() {
  const defaultState = createDefaultMapExploreState()
  const exploreState = reactive(defaultState)
  const mapConfig = reactive({
    latitude: defaultState.center.latitude,
    longitude: defaultState.center.longitude,
    scale: defaultState.scale,
    markers: [],
    polyline: [],
    showLocation: true,
    enableOverlooking: false,
    enableZoom: true,
    enableScroll: true,
    enableRotate: false,
    showCompass: false,
    selectedMarkerId: null
  })
  const visibleCardIndices = ref([])
  const selectedPointId = ref('')

  const syncConfigFromState = state => {
    mapConfig.latitude = state.center.latitude
    mapConfig.longitude = state.center.longitude
    mapConfig.scale = state.scale
    selectedPointId.value = state.selectedPointId || ''
  }

  const loadState = () => {
    const result = loadMapExploreState()
    Object.assign(exploreState, result.state)
    syncConfigFromState(result.state)
    return result
  }

  const saveState = overrides => {
    const normalized = saveMapExploreState({
      ...exploreState,
      ...overrides,
      center: {
        ...exploreState.center,
        latitude: mapConfig.latitude,
        longitude: mapConfig.longitude,
        ...(overrides?.center || {})
      },
      scale: mapConfig.scale,
      selectedPointId: selectedPointId.value
    })
    Object.assign(exploreState, normalized)
    return normalized
  }

  const applyState = state => {
    const normalized = normalizeMapExploreState(state)
    Object.assign(exploreState, normalized)
    syncConfigFromState(normalized)
    saveState()
  }

  const clusterPoints = points => {
    const scale = Number(mapConfig.scale || 14)
    if (scale >= 16) return points.map((point, sourceIndex) => ({ point, sourceIndex, clusterCount: 0 }))
    const cellSize = scale <= 10 ? 0.08 : scale <= 12 ? 0.035 : scale <= 14 ? 0.012 : 0.005
    const buckets = new Map()
    points.forEach((point, sourceIndex) => {
      const coords = pointCoords(point)
      if (!coords || point.type === 'track') return
      const key = `${Math.floor(coords.latitude / cellSize)}:${Math.floor(coords.longitude / cellSize)}`
      const bucket = buckets.get(key) || []
      bucket.push({ point, sourceIndex, coords })
      buckets.set(key, bucket)
    })
    return [...buckets.values()].map(bucket => {
      if (bucket.length === 1) return { ...bucket[0], clusterCount: 0 }
      const latitude = bucket.reduce((sum, item) => sum + item.coords.latitude, 0) / bucket.length
      const longitude = bucket.reduce((sum, item) => sum + item.coords.longitude, 0) / bucket.length
      return {
        ...bucket[0],
        coords: { latitude, longitude },
        clusterCount: bucket.length,
        members: bucket.map(item => item.point._id)
      }
    })
  }

  const updateMapMarkers = points => {
    if (!Array.isArray(points) || !points.length) {
      mapConfig.markers = []
      return
    }
    const visible = new Set((visibleCardIndices.value || []).map(Number))
    const restrict = visible.size > 0
    const eligible = points.filter((point, index) => {
      if (point.type === 'track' || !pointCoords(point)) return false
      if (restrict && !visible.has(index) && String(point._id) !== String(selectedPointId.value)) return false
      return true
    })
    mapConfig.markers = clusterPoints(eligible).map((entry, markerIndex) => {
      const point = entry.point
      const coords = entry.coords || pointCoords(point)
      const isCluster = entry.clusterCount > 1
      const isReplica = point.anchorKind === 'replica' || point.type === 'replica'
      const isCandidate = point.anchorKind === 'candidate'
      const selected = !isCluster && String(point._id) === String(selectedPointId.value)
      const markerType = isCandidate ? 'candidate' : isReplica ? 'replica' : (point.type || 'normal')
      const config = MARKER_CONFIG[markerType] || MARKER_CONFIG.normal
      return {
        id: markerIndex + 1,
        latitude: coords.latitude,
        longitude: coords.longitude,
        width: selected ? 42 : isCluster ? 38 : 30,
        height: selected ? 42 : isCluster ? 38 : 30,
        iconPath: isCluster ? '/static/marker-orange.png' : config.iconPath,
        zIndex: selected ? 1000 : isCluster ? 500 : markerIndex,
        customData: {
          pointId: point._id,
          sourceIndex: entry.sourceIndex,
          name: point.name || point.title || '位置',
          type: markerType,
          anchorKind: isCluster ? 'cluster' : isCandidate ? 'candidate' : isReplica ? 'replica' : 'normal',
          clusterCount: entry.clusterCount || 0,
          members: entry.members || []
        },
        callout: {
          content: isCluster
            ? `${entry.clusterCount} 个地点`
            : isCandidate
              ? `审核中 · ${point.name || point.title || '候选信标'}`
              : (selected ? (point.name || point.title || '已选中') : ''),
          fontSize: 12,
          borderRadius: 16,
          bgColor: isCluster ? '#ea580c' : isCandidate ? '#fffbeb' : '#ffffff',
          color: isCluster ? '#ffffff' : isCandidate ? '#92400e' : '#0f172a',
          padding: 7,
          display: isCluster || isCandidate || selected ? 'ALWAYS' : 'BYCLICK'
        }
      }
    })
  }

  const selectPoint = pointId => {
    selectedPointId.value = pointId ? String(pointId) : ''
    exploreState.selectedPointId = selectedPointId.value
  }

  const getUserLocation = () => new Promise((resolve, reject) => {
    uni.getLocation({
      type: 'gcj02',
      isHighAccuracy: true,
      success: res => {
        mapConfig.latitude = Number(res.latitude)
        mapConfig.longitude = Number(res.longitude)
        mapConfig.scale = 16
        exploreState.center = {
          ...exploreState.center,
          cityCode: '',
          cityName: '当前位置',
          latitude: mapConfig.latitude,
          longitude: mapConfig.longitude
        }
        exploreState.scale = 16
        saveState()
        resolve(res)
      },
      fail: reject
    })
  })

  const requestLocationPermission = async () => {
    try {
      if (typeof uni.getSetting !== 'function' || typeof uni.authorize !== 'function') {
        return getUserLocation()
      }
      const setting = await uni.getSetting()
      if (setting?.authSetting?.['scope.userLocation'] === false) {
        if (typeof uni.openSetting !== 'function') throw new Error('location-denied')
        const opened = await uni.openSetting()
        if (!opened?.authSetting?.['scope.userLocation']) throw new Error('location-denied')
      } else if (setting?.authSetting?.['scope.userLocation'] !== true) {
        await uni.authorize({ scope: 'scope.userLocation' })
      }
      return getUserLocation()
    } catch (error) {
      throw error
    }
  }

  const setCenter = (latitude, longitude, scale = mapConfig.scale, city = {}) => {
    mapConfig.latitude = Number(latitude)
    mapConfig.longitude = Number(longitude)
    mapConfig.scale = Number(scale)
    exploreState.center = {
      ...exploreState.center,
      ...city,
      latitude: mapConfig.latitude,
      longitude: mapConfig.longitude
    }
    exploreState.scale = mapConfig.scale
    saveState()
  }

  const handleVisibleCardsChange = indices => {
    visibleCardIndices.value = Array.isArray(indices) ? indices : []
  }

  const saveMapState = () => saveState()
  const loadMapState = () => loadState()
  const clearTrack = () => { mapConfig.polyline = [] }

  return {
    exploreState,
    mapConfig,
    visibleCardIndices,
    selectedPointId,
    updateMapMarkers,
    getUserLocation,
    requestLocationPermission,
    handleVisibleCardsChange,
    saveMapState,
    loadMapState,
    applyState,
    setCenter,
    selectPoint,
    clearTrack,
    MARKER_CONFIG
  }
}

import { ref, reactive } from 'vue'
import mapDataApi from '../../../utils/api/map.js'
import { generateMockMapData, isMockEnabled } from '../../../utils/mockMapData.js'
import { creationApi } from '../../../utils/api/creation.js'
import {
  buildMapQueryKey,
  loadExploreDataCache,
  saveExploreDataCache
} from '../../../utils/mapExploreState.js'

const TYPE_LAYER_MAP = {
  normal: 'content',
  video: 'content',
  article: 'content',
  place: 'place',
  service: 'service',
  event: 'event',
  track: 'route',
  replica: 'replica'
}

function filterItems(items, query) {
  const layers = new Set(query.layers || [])
  const start = query.timeStart ? new Date(query.timeStart).getTime() : 0
  const end = query.timeEnd ? new Date(query.timeEnd).getTime() : 0
  return (items || []).filter(item => {
    const layer = item.anchorKind === 'replica' ? 'replica' : (TYPE_LAYER_MAP[item.type] || 'content')
    if (layers.size && !layers.has(layer)) return false
    if (!start && !end) return true
    const itemTime = new Date(item.startTime || item.createdAt || item.time || 0).getTime()
    if (!itemTime) return item.type !== 'event'
    return (!start || itemTime >= start) && (!end || itemTime <= end)
  })
}

function mergeCreationItems(items, query) {
  const combined = [...(items || []), ...creationApi.getMapItems()]
  const seen = new Set()
  return filterItems(combined, query).filter(item => {
    const id = String(item._id || item.id || '')
    if (!id || seen.has(id)) return false
    seen.add(id)
    return true
  })
}

export function useMapData() {
  const mapPoints = ref([])
  const previewPoints = ref([])
  const isLoading = ref(false)
  const isRefreshing = ref(false)
  const error = ref(null)
  const hasMoreData = ref(true)
  const currentPage = ref(1)
  const pageSize = ref(12)
  const mapBounds = ref(null)
  const lastQuery = ref(null)
  const categoryData = reactive({})
  const memoryCache = new Map()
  let requestSequence = 0

  const restorePreview = () => {
    const cached = loadExploreDataCache({ allowStale: true })
    if (!cached || !cached.items.length) return false
    previewPoints.value = cached.items.slice(0, 6)
    mapPoints.value = [...previewPoints.value]
    return true
  }

  const buildQuery = (activeCategory, mapConfig, filters = {}, page = 1) => {
    const timeRange = filters.timeRange || {}
    const spatialFilter = filters.spatialFilter || {}
    return {
      bounds: mapBounds.value,
      center: {
        latitude: Number(mapConfig.latitude),
        longitude: Number(mapConfig.longitude)
      },
      category: activeCategory || 'all',
      timeStart: timeRange.start || '',
      timeEnd: timeRange.end || '',
      radiusKm: spatialFilter.mode === 'radius' ? Number(spatialFilter.radiusKm || 5) : 0,
      layers: filters.layers || [],
      page,
      pageSize: pageSize.value
    }
  }

  const requestData = async (query, mapConfig, activeCategory, isLoadMore) => {
    if (!isMockEnabled()) {
      return mapDataApi.fetchByBounds(query.bounds, query)
    }
    const items = await generateMockMapData(
      activeCategory,
      mapConfig,
      query.bounds,
      query.page,
      isLoadMore ? mapPoints.value.length : 0,
      isLoadMore
    )
    return {
      list: filterItems(items, query),
      pagination: { page: query.page, totalPages: 3 },
      totalInBounds: items.length,
      densityInfo: {}
    }
  }

  const fetchMapData = async (activeCategory, mapConfig, options = {}) => {
    const isLoadMore = options === true || options.isLoadMore === true
    const filters = typeof options === 'object' ? options.filters || {} : {}
    const force = typeof options === 'object' && options.force === true
    if (isLoading.value && !isLoadMore && !force) return

    const page = isLoadMore ? currentPage.value + 1 : 1
    const query = buildQuery(activeCategory, mapConfig, filters, page)
    const queryKey = buildMapQueryKey(query)
    const sequence = ++requestSequence
    lastQuery.value = { activeCategory, mapConfig, filters, query }
    error.value = null
    isLoading.value = true
    isRefreshing.value = mapPoints.value.length > 0 && !isLoadMore

    try {
      const memory = memoryCache.get(queryKey)
      if (!force && memory && Date.now() - memory.cachedAt < 10 * 60 * 1000) {
        if (sequence !== requestSequence) return
        mapPoints.value = isLoadMore ? [...mapPoints.value, ...memory.items] : [...memory.items]
        currentPage.value = page
        hasMoreData.value = memory.hasMore
        return
      }

      const result = await requestData(query, mapConfig, activeCategory, isLoadMore)
      if (sequence !== requestSequence) return
      const items = mergeCreationItems(result.list, query)
      mapPoints.value = isLoadMore ? [...mapPoints.value, ...items] : items
      currentPage.value = page
      hasMoreData.value = result.hasMore != null
        ? result.hasMore
        : page < Number(result.pagination?.totalPages || 1)
      memoryCache.set(queryKey, { items, hasMore: hasMoreData.value, cachedAt: Date.now() })
      categoryData[activeCategory] = [...mapPoints.value]
      if (!isLoadMore) saveExploreDataCache(queryKey, mapPoints.value)
    } catch (requestError) {
      if (sequence !== requestSequence) return
      error.value = {
        message: requestError?.message || '内容加载失败，请检查网络后重试',
        canRetry: true
      }
      if (!mapPoints.value.length) mapPoints.value = [...previewPoints.value]
      hasMoreData.value = false
    } finally {
      if (sequence === requestSequence) {
        isLoading.value = false
        isRefreshing.value = false
      }
    }
  }

  const retry = async () => {
    if (!lastQuery.value) return
    const { activeCategory, mapConfig, filters } = lastQuery.value
    await fetchMapData(activeCategory, mapConfig, { filters, force: true })
  }

  const loadMoreItems = async (activeCategory, mapConfig, filters = {}) => {
    if (isLoading.value || !hasMoreData.value) return
    await fetchMapData(activeCategory, mapConfig, { isLoadMore: true, filters })
  }

  const switchCategory = () => {
    currentPage.value = 1
    return false
  }

  const invalidateRequests = () => {
    requestSequence++
    isLoading.value = false
    isRefreshing.value = false
  }

  return {
    mapPoints,
    previewPoints,
    isLoading,
    isRefreshing,
    error,
    hasMoreData,
    currentPage,
    pageSize,
    mapBounds,
    categoryData,
    lastQuery,
    restorePreview,
    fetchMapData,
    loadMoreItems,
    switchCategory,
    retry,
    invalidateRequests
  }
}

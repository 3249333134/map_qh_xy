import { ref, computed } from 'vue'
import { socialViewStateApi } from '../../../utils/api/social.js'

export function useMyOverlay(params) {
  const { footprintCards, contentTranslateY, screenHeight, safeTopOffset, activeModule, isOverlayExpanded: overlayExpandedRef } = params
  const savedView = socialViewStateApi.getFootprint()

  // 允许外部传入同一 isOverlayExpanded 引用，保证布局和覆盖层状态一致
  const isOverlayExpanded = overlayExpandedRef || ref(false)
  isOverlayExpanded.value = !!savedView.expanded
  const overlayLevels = ref(['国', '县', '市', '区', '街'])
  const activeOverlayLevel = ref('市')
  const activeOverlayAreaGroup = ref(savedView.area || 'all')
  const overlayDisplayMode = ref('sections')
  const overlayScrollIntoView = ref('')
  const overlayLeftColumnData = ref([])
  const overlayRightColumnData = ref([])
  const overlayTouchStartY = ref(0)
  const overlayTouchLastY = ref(0)
  const overlayTouchStartTime = ref(0)
  const overlaySwipeThreshold = ref(50)
  const overlaySwipeVelocityThreshold = ref(0.35)

  // 新增：内容类别（列分类）
  const activeCategory = ref(savedView.category || 'all')
  const categoryFilterGroups = computed(() => {
    const items = Array.isArray(footprintCards.value) ? footprintCards.value : []
    const definitions = [
      { key: 'content', label: '内容' },
      { key: 'place', label: '地点' },
      { key: 'service', label: '服务' },
      { key: 'event', label: '活动' },
      { key: 'route', label: '路线' },
      { key: 'favorite', label: '收藏' }
    ]
    const groups = definitions
      .map((definition) => ({
        ...definition,
        count: items.filter(item => {
          if (definition.key === 'route') return item.layer === 'route' || item.layer === 'track'
          if (definition.key === 'favorite') return item.sourceType === 'favorite'
          return item.layer === definition.key
        }).length
      }))
      .filter(item => item.count > 0)
    groups.unshift({ key: 'all', label: '全部', count: items.length })
    return groups
  })

  const favoriteAllItems = computed(() => {
    return (Array.isArray(footprintCards.value) ? footprintCards.value : []).map((item) => ({
      ...item,
      category: item.sourceType === 'favorite'
        ? 'favorite'
        : item.layer === 'track' ? 'route' : item.layer,
      type: item.detailType === 'service' ? 'service' : 'content',
      _id: item.id,
      id: item.sourceId,
      name: item.title,
      time: item.createdAt,
      location: item.hasLocation ? { coordinates: [item.longitude, item.latitude] } : null
    }))
  })

  const matchAreaGroup = (item, key) => {
    if (!key || key === 'all') return true
    return [item?.district, item?.city, item?.address].filter(Boolean).some(value => String(value).includes(key))
  }

  const matchCardScope = (item, lvl) => {
    const text = ((item && (item.address || item.location || '')) || '').toString()
    const has = s => text.includes(s)
    switch (lvl) {
      case '国': return true
      case '县': return has('县')
      case '市': return has('市')
      case '区': return has('区')
      case '街': return has('街') || has('路')
      default: return true
    }
  }

  // 新增：按类别匹配
  const matchCategory = (item, key) => {
    if (!key || key === 'all') return true
    return item?.category === key
  }

  const overlayFilteredCards = computed(() => {
    const lvl = activeOverlayLevel.value
    const areaKey = activeOverlayAreaGroup.value
    const cat = activeCategory.value
    return favoriteAllItems.value.filter((it) => matchCardScope(it, lvl) && matchCategory(it, cat) && matchAreaGroup(it, areaKey))
  })

  const groupedOverlaySections = computed(() => {
    // 只在右侧分段列表中显示当前选中的区域（若为“全部”，则显示所有区域分段）
    const areaKey = activeOverlayAreaGroup.value
    const groupsAll = locationFilterGroups.value.filter((g) => g.key !== 'all')
    const groups = (areaKey && areaKey !== 'all') ? groupsAll.filter((g) => g.key === areaKey) : groupsAll

    const items = favoriteAllItems.value
    const lvl = activeOverlayLevel.value
    const cat = activeCategory.value

    return groups.map((g) => {
      const list = items.filter((it) => matchCardScope(it, lvl) && matchCategory(it, cat) && matchAreaGroup(it, g.key))
      return { key: g.key, label: g.label, items: list }
    })
  })

  const locationFilterGroups = computed(() => {
    const items = favoriteAllItems.value
    const dict = {}
    items.forEach((it) => {
      const seg = it.district || it.city || '未定位'
      dict[seg] = (dict[seg] || 0) + 1
    })
    const arr = Object.keys(dict).map((k) => ({ key: k, label: k, count: dict[k] }))
    arr.sort((a, b) => b.count - a.count)
    arr.unshift({ key: 'all', label: '全部', count: items.length })
    return arr
  })

  const computeOverlayColumns = () => {
    try {
      const filtered = Array.isArray(overlayFilteredCards.value) ? overlayFilteredCards.value : []
      overlayLeftColumnData.value = filtered
      overlayRightColumnData.value = []
    } catch (e) {
      console.warn('计算覆盖层卡片列数据失败', e)
      overlayLeftColumnData.value = []
      overlayRightColumnData.value = []
    }
  }

  const getOverlayCardHeight = (column, idx) => {
    return 196
  }

  const expandMapFullScreen = () => {
    activeModule.value = 'location'
    isOverlayExpanded.value = !isOverlayExpanded.value
    if (isOverlayExpanded.value) {
      overlayDisplayMode.value = 'sections'
      computeOverlayColumns()
    }
    socialViewStateApi.patchFootprint({ expanded: isOverlayExpanded.value })
  }

  const handleOverlayLevelChange = (lvl) => { activeOverlayLevel.value = lvl }
  const selectAreaGroup = (key) => {
    activeOverlayAreaGroup.value = key || 'all'
    // 选中具体区域时，滚动到对应分段；选择“全部”时取消定点滚动
    overlayScrollIntoView.value = (key && key !== 'all') ? ('section-' + key) : ''
    if (isOverlayExpanded.value) computeOverlayColumns()
    socialViewStateApi.patchFootprint({ area: activeOverlayAreaGroup.value })
  }
  // 新增：选择类别
  const selectCategoryGroup = (key) => {
    activeCategory.value = key || 'all'
    if (isOverlayExpanded.value) computeOverlayColumns()
    socialViewStateApi.patchFootprint({ category: activeCategory.value })
  }

  const viewSectionAll = (sec) => {
    if (!sec || !sec.key) return
    activeOverlayAreaGroup.value = sec.key
    overlayScrollIntoView.value = 'section-' + sec.key
    if (isOverlayExpanded.value) computeOverlayColumns()
    socialViewStateApi.patchFootprint({ area: activeOverlayAreaGroup.value })
  }

  const onOverlayTouchStart = (e) => {
    const t = (e && (e.touches && e.touches[0])) || (e && (e.changedTouches && e.changedTouches[0])) || null
    const y = t ? (typeof t.pageY === 'number' ? t.pageY : t.clientY) : 0
    overlayTouchStartY.value = y
    overlayTouchStartTime.value = Date.now()
  }
  const onOverlayTouchMove = (e) => {
    const t = (e && (e.touches && e.touches[0])) || (e && (e.changedTouches && e.changedTouches[0])) || null
    const y = t ? (typeof t.pageY === 'number' ? t.pageY : t.clientY) : overlayTouchLastY.value
    overlayTouchLastY.value = y
  }
  const onOverlayTouchEnd = (e) => {
    const t = (e && (e.changedTouches && e.changedTouches[0])) || (e && (e.touches && e.touches[0])) || null
    const endY = t ? (typeof t.pageY === 'number' ? t.pageY : t.clientY) : overlayTouchLastY.value
    const deltaY = endY - overlayTouchStartY.value
    const duration = Math.max(1, Date.now() - (overlayTouchStartTime.value || Date.now()))
    const velocity = Math.abs(deltaY) / duration
    const threshold = overlaySwipeThreshold.value || 50
    const velocityThreshold = overlaySwipeVelocityThreshold.value || 0.35
    if (deltaY > 0 && (Math.abs(deltaY) >= threshold || velocity >= velocityThreshold)) {
      isOverlayExpanded.value = false
      socialViewStateApi.patchFootprint({ expanded: false })
    }
  }

  const onOverlayScroll = (event) => {
    socialViewStateApi.patchFootprint({ scrollTop: Number(event?.detail?.scrollTop || 0) })
  }

  return {
    // 状态
    isOverlayExpanded,
    overlayLevels,
    activeOverlayLevel,
    activeOverlayAreaGroup,
    overlayDisplayMode,
    overlayScrollIntoView,
    overlayLeftColumnData,
    overlayRightColumnData,
    overlayTouchStartY,
    overlayTouchLastY,
    overlayTouchStartTime,
    overlaySwipeThreshold,
    overlaySwipeVelocityThreshold,
    activeCategory,
    categoryFilterGroups,

    // 计算
    favoriteAllItems,
    overlayFilteredCards,
    groupedOverlaySections,
    locationFilterGroups,

    // 方法
    computeOverlayColumns,
    getOverlayCardHeight,
    expandMapFullScreen,
    handleOverlayLevelChange,
    selectAreaGroup,
    selectCategoryGroup,
    viewSectionAll,
    onOverlayTouchStart,
    onOverlayTouchMove,
    onOverlayTouchEnd,
    onOverlayScroll
  }
}

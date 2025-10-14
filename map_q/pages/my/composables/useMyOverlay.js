import { ref, computed } from 'vue'

export function useMyOverlay(params) {
  const { favoriteData, contentTranslateY, screenHeight, safeTopOffset, activeModule, isOverlayExpanded: overlayExpandedRef } = params

  // 允许外部传入同一 isOverlayExpanded 引用，保证布局和覆盖层状态一致
  const isOverlayExpanded = overlayExpandedRef || ref(false)
  const overlayLevels = ref(['国', '县', '市', '区', '街'])
  const activeOverlayLevel = ref('市')
  const activeOverlayAreaGroup = ref('all')
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
  const activeCategory = ref('all')
  const categoryFilterGroups = computed(() => {
    const f = favoriteData.value || {}
    const groups = ['photos', 'videos', 'articles', 'music', 'locations', 'services']
    const labels = { photos: '照片', videos: '视频', articles: '文章', music: '音乐', locations: '地点', services: '服务' }
    let total = 0
    const arr = groups.map((g) => {
      const len = Array.isArray(f[g]) ? f[g].length : 0
      total += len
      return { key: g, label: labels[g], count: len }
    })
    arr.unshift({ key: 'all', label: '全部', count: total })
    return arr
  })

  const favoriteAllItems = computed(() => {
    const f = favoriteData.value || {}
    const groups = ['photos', 'videos', 'articles', 'music', 'locations', 'services']
    const all = []
    groups.forEach((g) => {
      const arr = Array.isArray(f[g]) ? f[g] : []
      arr.forEach((item) => {
        const copied = Object.assign({}, item)
        copied.category = g
        copied.type = (item && item.type === 'service') ? 'service' : (g === 'services' ? 'service' : 'content')
        all.push(copied)
      })
    })
    return all
  })

  const matchAreaGroup = (item, key) => {
    if (!key || key === 'all') return true
    const txt = ((item && (item.address || item.location || '')) || '').toString()
    return txt.indexOf(key) !== -1
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
    return ((item && item.category) || '') === key
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
      const txt = ((it && (it.address || it.location || '')) || '').toString()
      const mDistrict = txt.match(/[\u4e00-\u9fa5]+区/)
      const mCity = txt.match(/[\u4e00-\u9fa5]+市/)
      const mStreet = txt.match(/[\u4e00-\u9fa5]+(?:路|街)/)
      const seg = (mDistrict && mDistrict[0]) || (mCity && mCity[0]) || (mStreet && mStreet[0]) || '未知'
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
    const base = 220
    const variance = 0
    return base + variance
  }

  const expandMapFullScreen = () => {
    activeModule.value = 'location'
    isOverlayExpanded.value = !isOverlayExpanded.value
    if (isOverlayExpanded.value) {
      overlayDisplayMode.value = 'sections'
      computeOverlayColumns()
    }
    try {
      uni.showToast({ title: isOverlayExpanded.value ? '展开我的足迹地图卡片' : '收起我的足迹地图卡片', icon: 'none', duration: 600 })
    } catch (e) {}
  }

  const handleOverlayLevelChange = (lvl) => { activeOverlayLevel.value = lvl }
  const selectAreaGroup = (key) => {
    activeOverlayAreaGroup.value = key || 'all'
    // 选中具体区域时，滚动到对应分段；选择“全部”时取消定点滚动
    overlayScrollIntoView.value = (key && key !== 'all') ? ('section-' + key) : ''
    if (isOverlayExpanded.value) computeOverlayColumns()
    try { uni.showToast({ title: '区域：' + (key || '全部'), icon: 'none', duration: 500 }) } catch (e) {}
  }
  // 新增：选择类别
  const selectCategoryGroup = (key) => {
    activeCategory.value = key || 'all'
    if (isOverlayExpanded.value) computeOverlayColumns()
    try { uni.showToast({ title: '类别：' + (key || '全部'), icon: 'none', duration: 500 }) } catch (e) {}
  }

  const viewSectionAll = (sec) => {
    if (!sec || !sec.key) return
    activeOverlayAreaGroup.value = sec.key
    overlayScrollIntoView.value = 'section-' + sec.key
    if (isOverlayExpanded.value) computeOverlayColumns()
    try { uni.showToast({ title: '已切换到 ' + (sec.label || sec.key), icon: 'none', duration: 500 }) } catch (e) {}
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
    if (deltaY < 0 && (Math.abs(deltaY) >= threshold || velocity >= velocityThreshold)) {
      isOverlayExpanded.value = false
    }
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
    onOverlayTouchEnd
  }
}
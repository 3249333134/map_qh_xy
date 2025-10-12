import { ref, reactive, computed } from 'vue'

export function useMyLayout(params = {}) {
  const isOverlayExpanded = params.isOverlayExpanded || ref(false)

  const screenHeight = ref(0)
  const safeTopOffset = ref(0)

  const positions = reactive({
    default: 350,
    middle: 200,
    top: 50
  })

  const expandUpDistancePx = ref(305)
  const contentTranslateY = ref(350)

  // 拖拽与动画状态
  const startY = ref(0)
  const startTranslateY = ref(0)
  const isDragging = ref(false)
  const dragThreshold = ref(5)
  const dragStartTime = ref(0)
  const snapThreshold = ref(60)

  // rAF/polyfill
  const _requestFrame = typeof requestAnimationFrame !== 'function'
    ? (fn) => setTimeout(fn, 16)
    : (fn) => requestAnimationFrame(fn)
  const _cancelFrame = typeof cancelAnimationFrame !== 'function'
    ? (id) => clearTimeout(id)
    : (id) => cancelAnimationFrame(id)
  let _rafId = null
  let _queuedY = null

  const isFullyExpanded = computed(() => contentTranslateY.value <= positions.top)

  const currentPosition = computed(() => {
    const current = contentTranslateY.value
    const top = positions.top
    const defaultPos = positions.default
    if (Math.abs(current - top) < 30) return 'top'
    if (Math.abs(current - defaultPos) < 30) return 'default'
    return 'free'
  })

  const mapOverlayStyle = computed(() => {
    if (!isOverlayExpanded.value) return {}
    const top = contentTranslateY.value + 42 + (safeTopOffset.value || 0)
    return { top: top + 'px', left: '9px', right: '9px', bottom: '2px' }
  })

  const overlayExpandedHeight = computed(() => {
    if (!isOverlayExpanded.value) return 0
    const top = contentTranslateY.value + 42 + (safeTopOffset.value || 0)
    const total = screenHeight.value || 667
    const paddingBottom = 2
    const reservedHeader = 64
    const chipsHeight = 48
    const spacing = 16
    const height = total - top - paddingBottom - reservedHeader - chipsHeight - spacing
    return Math.max(120, Math.round(height))
  })

  const initPage = () => {
    setTimeout(() => {
      try {
        const systemInfo = uni.getWindowInfo()
        safeTopOffset.value = (systemInfo && ((systemInfo.safeAreaInsets && systemInfo.safeAreaInsets.top) || (systemInfo.safeArea && systemInfo.safeArea.top) || systemInfo.statusBarHeight || 0)) || 0
        screenHeight.value = systemInfo.windowHeight
        const applyPositions = (profileHeight) => {
          const computedTop = Math.max(0, Math.round(profileHeight))
          const expandUp = (expandUpDistancePx.value || 160)
          const computedDefault = Math.max(0, Math.round(computedTop - expandUp))
          positions.top = computedTop
          positions.default = computedDefault
          positions.middle = Math.round((positions.top + positions.default) / 2)
        }
        const query = typeof uni.createSelectorQuery === 'function' ? uni.createSelectorQuery() : null
        if (query) {
          // 组合式 API 下不传递 this，直接在页面作用域查询
          query.select('.profile-section').boundingClientRect((rect) => {
            if (rect && rect.height) applyPositions(rect.height)
            else applyPositions(350)
          }).exec()
        } else {
          applyPositions(350)
        }
      } catch (e) {
        console.warn('获取系统信息失败，使用兜底方案:', e)
        screenHeight.value = 667
        const fallbackTop = 350
        const expandUp = (expandUpDistancePx.value || 160)
        const fallbackDefault = Math.max(0, Math.round(fallbackTop - expandUp))
        positions.top = fallbackTop
        positions.default = fallbackDefault
        positions.middle = Math.round((positions.top + positions.default) / 2)
      }
    }, 100)
  }

  const handleDragStart = (e) => {
    const eventData = e.detail || e
    startY.value = eventData.startY
    startTranslateY.value = contentTranslateY.value
    isDragging.value = true
    dragStartTime.value = Date.now()
    if (_rafId && typeof _cancelFrame === 'function') {
      _cancelFrame(_rafId)
    }
    _queuedY = null
    _rafId = null
  }

  const handleDragMove = (e) => {
    if (!isDragging.value) return
    const eventData = e && e.detail ? e.detail : {}
    const currentY = eventData.currentY
    const deltaY = currentY - startY.value
    // 父组件实时位移由 update-translate-y 事件驱动
    return
  }

  const animateToPosition = (targetY) => {
    if (!_rafId) {
      _queuedY = targetY
      _rafId = _requestFrame(() => {
        contentTranslateY.value = _queuedY
        _rafId = null
      })
    } else {
      _queuedY = targetY
    }
  }

  const handleUpdateTranslateY = (newY) => {
    const minY = Math.min(positions.top, positions.default)
    const maxY = Math.max(positions.top, positions.default)
    const clamped = typeof newY === 'number' ? Math.max(Math.min(newY, maxY), minY) : contentTranslateY.value
    if (!_rafId) {
      _queuedY = clamped
      _rafId = _requestFrame(() => {
        contentTranslateY.value = _queuedY
        _rafId = null
      })
    } else {
      _queuedY = clamped
    }
  }

  const handleDragEnd = (e, module, isAtTop) => {
    if (!isDragging.value) return
    isDragging.value = false
    const eventData = e.detail || e
    const deltaY = eventData.deltaY || 0
    const dragDurationMs = Date.now() - (dragStartTime.value || Date.now())
    const velocity = dragDurationMs > 0 ? Math.abs(deltaY) / dragDurationMs : 0
    let finalY = contentTranslateY.value
    const minY = Math.min(positions.top, positions.default)
    const maxY = Math.max(positions.top, positions.default)

    if (velocity > 0.3) {
      if (deltaY < 0) finalY = positions.default
      else finalY = module === 'favorite' || module === 'date' ? (isAtTop ? positions.top : finalY) : positions.top
    } else {
      const distanceToTop = Math.abs(finalY - positions.top)
      const distanceToDefault = Math.abs(finalY - positions.default)
      const threshold = snapThreshold.value || 60
      if (distanceToTop <= threshold || distanceToDefault <= threshold) {
        finalY = distanceToTop <= distanceToDefault ? positions.top : positions.default
      } else {
        finalY = distanceToTop <= distanceToDefault ? positions.top : positions.default
      }
    }

    finalY = Math.max(Math.min(finalY, maxY), minY)
    animateToPosition(finalY)
  }

  const handleQuickSwitch = () => {
    const current = currentPosition.value
    const targetPosition = current === 'default' ? 'top' : 'default'
    animateToPosition(positions[targetPosition])
  }

  return {
    // 状态
    screenHeight,
    safeTopOffset,
    positions,
    expandUpDistancePx,
    contentTranslateY,
    dateScrollAtTop: ref(true),
    favoriteScrollAtTop: ref(true),
    isDragging,
    startY,
    startTranslateY,
    dragThreshold,
    dragStartTime,
    snapThreshold,

    // 计算
    isFullyExpanded,
    currentPosition,
    mapOverlayStyle,
    overlayExpandedHeight,

    // 方法
    initPage,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleUpdateTranslateY,
    animateToPosition,
    handleQuickSwitch
  }
}
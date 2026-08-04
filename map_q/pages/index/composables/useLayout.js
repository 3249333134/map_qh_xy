import { ref, computed } from 'vue'
import { LAYOUT_CONFIG } from '../constants/layoutConfig.js'

export function useLayout() {
  const screenHeight = ref(0)
  const contentHeight = ref(0)
  const searchBoxHeight = ref(50)
  const safeBottomOffset = ref(0)
  
  const isDragging = ref(false)
  const dragStartY = ref(0)
  const dragStartHeight = ref(0)
  const dragStartTime = ref(0)
  const lastDragY = ref(0)
  const dragDistance = ref(0)
  const interactionLockedUntil = ref(0)
  
  const mapHeight = computed(() => screenHeight.value)
  
  const minContentHeight = computed(() => 
    screenHeight.value * LAYOUT_CONFIG.MIN_CONTENT_RATIO
  )
  
  const midContentHeight = computed(() => 
    screenHeight.value * LAYOUT_CONFIG.INITIAL_CONTENT_RATIO
  )
  
  const maxContentHeight = computed(() => 
    screenHeight.value * LAYOUT_CONFIG.MAX_CONTENT_RATIO
  )
  
  const currentMode = computed(() => {
    const range = maxContentHeight.value - minContentHeight.value
    const relativeHeight = contentHeight.value - minContentHeight.value
    const ratio = relativeHeight / range
    
    if (ratio < LAYOUT_CONFIG.SNAP_THRESHOLD_LOW) return 'min'
    if (ratio < LAYOUT_CONFIG.SNAP_THRESHOLD_HIGH) return 'mid'
    return 'max'
  })
  
  const initLayout = () => {
    const systemInfo = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
    screenHeight.value = systemInfo.windowHeight
    contentHeight.value = midContentHeight.value
    try {
      const metrics = uni.getStorageSync('TABBAR_METRICS') || null
      if (metrics && typeof metrics.tabHeightPx === 'number') {
        safeBottomOffset.value = metrics.tabHeightPx
      } else {
        safeBottomOffset.value = 86
      }
    } catch (e) {
      safeBottomOffset.value = 86
    }
  }
  
  const getClientY = (e) => {
    const d = (e && e.detail) ? e.detail : e || {}
    const t = (d && d.touches && d.touches[0]) ? d.touches[0]
      : (d && d.changedTouches && d.changedTouches[0]) ? d.changedTouches[0]
      : null
    if (t && typeof t.clientY === 'number') return t.clientY
    if (t && typeof t.pageY === 'number') return t.pageY
    if (typeof d.clientY === 'number') return d.clientY
    if (typeof d.pageY === 'number') return d.pageY
    return 0
  }

  const handleDragStart = (e) => {
    isDragging.value = true
    dragStartY.value = getClientY(e)
    lastDragY.value = dragStartY.value
    dragStartHeight.value = contentHeight.value
    dragStartTime.value = Date.now()
    dragDistance.value = 0
  }
  
  const handleDrag = (e) => {
    if (!isDragging.value) return
    
    const currentY = getClientY(e)
    const deltaY = dragStartY.value - currentY
    dragDistance.value = Math.max(dragDistance.value, Math.abs(currentY - dragStartY.value))
    lastDragY.value = currentY
    
    let newHeight = dragStartHeight.value + deltaY
    newHeight = Math.max(
      minContentHeight.value,
      Math.min(maxContentHeight.value, newHeight)
    )
    
    contentHeight.value = newHeight
  }
  
  const handleDragEnd = () => {
    const duration = Math.max(1, Date.now() - dragStartTime.value)
    const velocity = (dragStartY.value - lastDragY.value) / duration
    const targets = [
      { mode: 'min', value: minContentHeight.value },
      { mode: 'mid', value: midContentHeight.value },
      { mode: 'max', value: maxContentHeight.value }
    ]
    let target
    if (Math.abs(velocity) >= LAYOUT_CONFIG.FLING_VELOCITY) {
      const ordered = velocity > 0 ? targets : [...targets].reverse()
      target = ordered.find(item => velocity > 0
        ? item.value > contentHeight.value + 1
        : item.value < contentHeight.value - 1)
    }
    if (!target) {
      target = targets.reduce((closest, item) =>
        Math.abs(item.value - contentHeight.value) < Math.abs(closest.value - contentHeight.value)
          ? item
          : closest
      )
    }
    contentHeight.value = target.value
    isDragging.value = false
    if (dragDistance.value >= LAYOUT_CONFIG.DRAG_THRESHOLD) {
      interactionLockedUntil.value = Date.now() + LAYOUT_CONFIG.SCROLL_LOCK_DURATION
    }
  }

  const canActivateContent = () => !isDragging.value && Date.now() >= interactionLockedUntil.value
  
  const toggleContentMode = () => {
    const targetMode = currentMode.value === 'min' ? 'max' : 'min'
    contentHeight.value = targetMode === 'min' 
      ? minContentHeight.value 
      : maxContentHeight.value
  }
  
  const setContentMode = (mode) => {
    if (mode === 'min') {
      contentHeight.value = minContentHeight.value
    } else if (mode === 'max') {
      contentHeight.value = maxContentHeight.value
    } else {
      contentHeight.value = midContentHeight.value
    }
  }
  
  return {
    screenHeight,
    contentHeight,
    searchBoxHeight,
    safeBottomOffset,
    isDragging,
    
    mapHeight,
    minContentHeight,
    midContentHeight,
    maxContentHeight,
    currentMode,
    interactionLockedUntil,
    
    initLayout,
    handleDragStart,
    handleDrag,
    handleDragEnd,
    canActivateContent,
    toggleContentMode,
    setContentMode
  }
}

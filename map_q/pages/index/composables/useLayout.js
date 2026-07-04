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
    dragStartHeight.value = contentHeight.value
  }
  
  const handleDrag = (e) => {
    if (!isDragging.value) return
    
    const currentY = getClientY(e)
    const deltaY = dragStartY.value - currentY
    
    let newHeight = dragStartHeight.value + deltaY
    newHeight = Math.max(
      minContentHeight.value,
      Math.min(maxContentHeight.value, newHeight)
    )
    
    contentHeight.value = newHeight
  }
  
  const handleDragEnd = () => {
    isDragging.value = false
  }
  
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
    
    initLayout,
    handleDragStart,
    handleDrag,
    handleDragEnd,
    toggleContentMode,
    setContentMode
  }
}

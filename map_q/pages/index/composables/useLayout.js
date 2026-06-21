import { ref, computed } from 'vue'
import { LAYOUT_CONFIG } from '../constants/layoutConfig.js'

export function useLayout() {
  // 布局状态
  const screenHeight = ref(0)
  const contentHeight = ref(0)
  const searchBoxHeight = ref(50)
  // 底部偏移（TabBar 占位 + 安全区）
  const safeBottomOffset = ref(0)
  
  // 拖拽状态
  const isDragging = ref(false)
  const dragStartY = ref(0)
  const dragStartHeight = ref(0)
  
  // 计算属性
  const mapHeight = computed(() => screenHeight.value - contentHeight.value)
  
  const minContentHeight = computed(() => 
    searchBoxHeight.value + LAYOUT_CONFIG.MARGIN
  )
  
  const maxContentHeight = computed(() => 
    screenHeight.value * LAYOUT_CONFIG.MAX_CONTENT_RATIO
  )
  
  // 初始化布局
  const initLayout = () => {
    const systemInfo = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
    screenHeight.value = systemInfo.windowHeight
    contentHeight.value = screenHeight.value * LAYOUT_CONFIG.INITIAL_CONTENT_RATIO
    // 读取底部 TabBar 的占位高度（px），用于内容区域限位到底部蓝框区域
    try {
      const metrics = uni.getStorageSync('TABBAR_METRICS') || null
      // 只使用 TabBar 本身高度，避免与安全区双重抵消造成空白
      if (metrics && typeof metrics.tabHeightPx === 'number') {
        safeBottomOffset.value = metrics.tabHeightPx
      } else {
        const tabPx = 86
        safeBottomOffset.value = tabPx
      }
    } catch (e) {
      const tabPx = 86
      safeBottomOffset.value = tabPx
    }
  }
  
  // 统一事件坐标读取
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

  // 拖拽处理
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
    
    const range = maxContentHeight.value - minContentHeight.value
    const snapThresholds = {
      min: minContentHeight.value + range * LAYOUT_CONFIG.SNAP_THRESHOLD_LOW,
      max: minContentHeight.value + range * LAYOUT_CONFIG.SNAP_THRESHOLD_HIGH
    }
    
    let newHeight
    if (contentHeight.value < snapThresholds.min) {
      newHeight = minContentHeight.value
    } else if (contentHeight.value < snapThresholds.max) {
      newHeight = screenHeight.value * LAYOUT_CONFIG.INITIAL_CONTENT_RATIO
    } else {
      newHeight = maxContentHeight.value
    }
    
    contentHeight.value = newHeight
  }
  
  return {
    // 状态
    screenHeight,
    contentHeight,
    searchBoxHeight,
    safeBottomOffset,
    isDragging,
    
    // 计算属性
    mapHeight,
    minContentHeight,
    maxContentHeight,
    
    // 方法
    initLayout,
    handleDragStart,
    handleDrag,
    handleDragEnd
  }
}

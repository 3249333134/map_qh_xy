import { ref, computed } from 'vue'
import { LAYOUT_CONFIG } from '../pages/index/constants/layoutConfig.js'

export function useLayout() {
  // 布局状态
  const screenHeight = ref(0)
  const contentHeight = ref(0)
  const searchBoxHeight = ref(50)
  
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
    const systemInfo = uni.getWindowInfo()
    screenHeight.value = systemInfo.windowHeight
    contentHeight.value = screenHeight.value * LAYOUT_CONFIG.INITIAL_CONTENT_RATIO
  }
  
  // 拖拽处理
  const handleDragStart = (e) => {
    isDragging.value = true
    dragStartY.value = e.touches[0].clientY
    dragStartHeight.value = contentHeight.value
  }
  
  const handleDrag = (e) => {
    if (!isDragging.value) return
    
    const currentY = e.touches[0].clientY
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
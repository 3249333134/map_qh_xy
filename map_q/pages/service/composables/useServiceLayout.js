import { ref, computed } from 'vue'

// 服务页面布局配置常量
const SERVICE_LAYOUT_CONFIG = {
  INITIAL_CONTENT_RATIO: 0.67,
  MAX_CONTENT_RATIO: 0.67,
  MIN_CONTENT_RATIO: 0.33,
  MIN_VISIBLE_RATIO: 0.08,
  MARGIN: 10,
  SNAP_THRESHOLD_LOW: 0.2,
  SNAP_THRESHOLD_MID: 0.5,
  SNAP_THRESHOLD_HIGH: 0.7
}

export function useServiceLayout() {
  const screenHeight = ref(0)
  const contentHeight = ref(0)
  const searchBoxHeight = ref(50)
  const isDragging = ref(false)
  const dragStartY = ref(0)
  const dragStartHeight = ref(0)
  const visibleCardIndices = ref([])
  
  // 计算地图高度
  const mapHeight = computed(() => {
    return screenHeight.value - contentHeight.value
  })
  
  // 最小内容高度（屏幕的1/3）
  const minContentHeight = computed(() => {
    return screenHeight.value * SERVICE_LAYOUT_CONFIG.MIN_CONTENT_RATIO
  })
  
  // 最小可见高度（只显示搜索框）
  const minVisibleHeight = computed(() => {
    return screenHeight.value * SERVICE_LAYOUT_CONFIG.MIN_VISIBLE_RATIO
  })
  
  // 最大内容高度（屏幕的2/3）
  const maxContentHeight = computed(() => {
    return screenHeight.value * SERVICE_LAYOUT_CONFIG.MAX_CONTENT_RATIO
  })
  
  // 初始化布局
  const initLayout = () => {
    const systemInfo = uni.getWindowInfo()
    screenHeight.value = systemInfo.windowHeight
    contentHeight.value = screenHeight.value * SERVICE_LAYOUT_CONFIG.INITIAL_CONTENT_RATIO
  }
  
  // 处理拖拽开始
  const handleDragStart = (e) => {
    isDragging.value = true
    dragStartY.value = e.touches[0].clientY
    dragStartHeight.value = contentHeight.value
  }
  
  // 处理拖拽中
  const handleDrag = (e) => {
    if (!isDragging.value) return
    
    const currentY = e.touches[0].clientY
    const deltaY = dragStartY.value - currentY
    
    let newHeight = dragStartHeight.value + deltaY
    
    newHeight = Math.max(
      minVisibleHeight.value,
      Math.min(maxContentHeight.value, newHeight)
    )
    
    contentHeight.value = newHeight
  }
  
  // 处理拖拽结束
  const handleDragEnd = () => {
    isDragging.value = false
    
    const range = maxContentHeight.value - minVisibleHeight.value
    const snapThresholds = {
      min: minVisibleHeight.value + range * SERVICE_LAYOUT_CONFIG.SNAP_THRESHOLD_LOW,
      mid: minVisibleHeight.value + range * SERVICE_LAYOUT_CONFIG.SNAP_THRESHOLD_MID,
      max: minVisibleHeight.value + range * SERVICE_LAYOUT_CONFIG.SNAP_THRESHOLD_HIGH
    }
    
    let newHeight
    if (contentHeight.value < snapThresholds.min) {
      newHeight = minVisibleHeight.value
    } else if (contentHeight.value < snapThresholds.mid) {
      newHeight = minContentHeight.value
    } else {
      newHeight = maxContentHeight.value
    }
    
    contentHeight.value = newHeight
  }
  
  // 处理可视卡片变化
  const handleVisibleCardsChange = (visibleIndices) => {
    visibleCardIndices.value = visibleIndices
  }
  
  return {
    // 状态
    screenHeight,
    contentHeight,
    searchBoxHeight,
    isDragging,
    visibleCardIndices,
    
    // 计算属性
    mapHeight,
    minContentHeight,
    minVisibleHeight,
    maxContentHeight,
    
    // 方法
    initLayout,
    handleDragStart,
    handleDrag,
    handleDragEnd,
    handleVisibleCardsChange
  }
}
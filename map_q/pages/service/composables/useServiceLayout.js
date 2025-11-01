import { ref, computed } from 'vue'
import { SERVICE_LAYOUT_CONFIG } from '../constants/layoutConfig.js'

export function useServiceLayout() {
  // 布局状态
  const screenHeight = ref(0)
  const contentHeight = ref(0)
  const searchBoxHeight = ref(50)
  // 底部偏移（TabBar 占位），用于将内容区限位到自定义TabBar上缘
  const safeBottomOffset = ref(0)
  
  // 拖拽状态
  const isDragging = ref(false)
  const dragStartY = ref(0)
  const dragStartHeight = ref(0)
  
  // 计算属性
  const mapHeight = computed(() => screenHeight.value - contentHeight.value)
  
  // 与首页一致：内容区最小高度仅保留搜索框
  const minContentHeight = computed(() => 
    (searchBoxHeight.value || 0) + SERVICE_LAYOUT_CONFIG.MARGIN
  )
  
  const minVisibleHeight = computed(() => 
    screenHeight.value * SERVICE_LAYOUT_CONFIG.MIN_VISIBLE_RATIO
  )
  
  const maxContentHeight = computed(() => 
    screenHeight.value * SERVICE_LAYOUT_CONFIG.MAX_CONTENT_RATIO
  )
  
  // 初始化布局
  const initLayout = () => {
    const systemInfo = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
    screenHeight.value = systemInfo.windowHeight
    contentHeight.value = screenHeight.value * SERVICE_LAYOUT_CONFIG.INITIAL_CONTENT_RATIO
    // 读取底部 TabBar 高度，仅用 TabBar 本身高度避免出现额外空白
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
    // 与首页一致：下限为 minContentHeight（仅搜索框高度）
    newHeight = Math.max(
      minContentHeight.value,
      Math.min(maxContentHeight.value, newHeight)
    )
    
    contentHeight.value = newHeight
  }
  
  const handleDragEnd = () => {
    isDragging.value = false
    
    // 与首页一致：吸附阈值围绕 minContentHeight
    const range = maxContentHeight.value - minContentHeight.value
    const snapThresholds = {
      min: minContentHeight.value + range * SERVICE_LAYOUT_CONFIG.SNAP_THRESHOLD_LOW,
      max: minContentHeight.value + range * SERVICE_LAYOUT_CONFIG.SNAP_THRESHOLD_HIGH
    }
    
    let newHeight
    if (contentHeight.value < snapThresholds.min) {
      newHeight = minContentHeight.value
    } else if (contentHeight.value < snapThresholds.max) {
      newHeight = screenHeight.value * SERVICE_LAYOUT_CONFIG.INITIAL_CONTENT_RATIO
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
    minVisibleHeight,
    maxContentHeight,
    
    // 方法
    initLayout,
    handleDragStart,
    handleDrag,
    handleDragEnd
  }
}
// 服务页面布局配置常量
export const SERVICE_LAYOUT_CONFIG = {
  // 内容区域初始高度比例（屏幕高度的2/3）
  INITIAL_CONTENT_RATIO: 0.67,
  
  // 内容区域最大高度比例（屏幕高度的2/3）
  MAX_CONTENT_RATIO: 0.67,
  
  // 内容区域最小高度比例（屏幕高度的1/3）
  MIN_CONTENT_RATIO: 0.33,
  
  // 内容区域最小显示高度（只显示搜索框）
  MIN_VISIBLE_RATIO: 0.08,
  
  // 边距
  MARGIN: 10,
  
  // 吸附阈值（低）
  SNAP_THRESHOLD_LOW: 0.2,
  
  // 吸附阈值（中）
  SNAP_THRESHOLD_MID: 0.5,
  
  // 吸附阈值（高）
  SNAP_THRESHOLD_HIGH: 0.7
}

// 服务分类配置
export const SERVICE_CATEGORIES = [
  { id: 'all', name: '全部服务', active: true },
  { id: 'repair', name: '维修服务', active: false },
  { id: 'clean', name: '清洁服务', active: false },
  { id: 'delivery', name: '配送服务', active: false }
]

// 分类映射配置
export const CATEGORY_MAP = {
  'repair': '维修服务',
  'clean': '清洁服务',
  'delivery': '配送服务'
}

// 地图标记配置
export const MARKER_CONFIG = {
  DEFAULT_ICON: '/static/marker.png',
  ICONS: {
    'all': '/static/marker.png',
    'repair': '/static/marker.png',
    'clean': '/static/marker.png',
    'delivery': '/static/marker.png'
  },
  SIZE: {
    WIDTH: 24,
    HEIGHT: 24
  }
}
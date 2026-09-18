// 服务页面布局配置常量
export const SERVICE_LAYOUT_CONFIG = {
  // 内容区域初始高度比例（与首页一致为屏幕高度的1/3）
  INITIAL_CONTENT_RATIO: 0.55,
  
  // 内容区域最大高度比例（与首页一致为屏幕高度的2/3）
  MAX_CONTENT_RATIO: 0.70,
  
  // 内容区域最小高度比例（屏幕高度的1/3）
  MIN_CONTENT_RATIO: 0.33,
  
  // 内容区域最小显示高度（只显示搜索框）
  MIN_VISIBLE_RATIO: 0.08,
  
  // 边距
  MARGIN: 10,
  
  // 吸附阈值（低）
  SNAP_THRESHOLD_LOW: 0.3,
  
  // 吸附阈值（中）
  SNAP_THRESHOLD_MID: 0.5,
  
  // 吸附阈值（高）
  SNAP_THRESHOLD_HIGH: 0.7
}

// 服务分类配置
export const SERVICE_CATEGORIES = [
  { id: 'all', name: '全部服务', active: true },
  { id: 'ticket', name: '演出票务', active: false },
  { id: 'food', name: '餐饮美食', active: false },
  { id: 'leisure', name: '休闲门店', active: false },
  { id: 'beauty', name: '丽人服务', active: false },
  { id: 'fitness', name: '健身运动', active: false },
  { id: 'visit', name: '探店预约', active: false }
]

// 分类映射配置
export const CATEGORY_MAP = {
  ticket: '演出票务', food: '餐饮美食', leisure: '休闲门店', beauty: '丽人服务', fitness: '健身运动', visit: '探店预约'
}

// 地图标记配置
export const MARKER_CONFIG = {
  DEFAULT_ICON: '/static/marker.png',
  SIZE: {
    WIDTH: 24,
    HEIGHT: 24
  },
  CATEGORY_ICONS: {
    'all': '/static/marker.png',
    ticket: '/static/marker-red.png', food: '/static/marker-green.png', leisure: '/static/marker-purple.png', beauty: '/static/marker-orange.png', fitness: '/static/marker-blue.png', visit: '/static/marker.png'
  }
}

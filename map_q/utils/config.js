// 统一配置文件
export const APP_CONFIG = {
  // 服务器配置 - 修改为本地开发地址
  SERVER: {
    HOST: '127.0.0.1',  // 改为 127.0.0.1，避免 localhost 解析问题
    PORT: '3000',
    PROTOCOL: 'http',
    WS_PROTOCOL: 'ws'
  },
  
  // API 基础配置 - 自动基于SERVER配置生成
  get API() {
    return {
      BASE_URL: `${this.SERVER.PROTOCOL}://${this.SERVER.HOST}:${this.SERVER.PORT}`,
      ENDPOINTS: {
        MAP_DATA: '/api/map-data',
        CONTACTS: '/api/contacts',
        GROUPS: '/api/groups',
        CHANNELS: '/api/channels',
        UNREAD_COUNTS: '/api/unread-counts',
        MARK_READ: '/api/mark-read',
        NOTIFICATIONS: '/notifications'
      }
    }
  },
  
  // WebSocket 配置 - 自动基于SERVER配置生成
  get WEBSOCKET() {
    return {
      BASE_URL: `${this.SERVER.WS_PROTOCOL}://${this.SERVER.HOST}:${this.SERVER.PORT}`,
      NOTIFICATIONS_URL: `${this.SERVER.WS_PROTOCOL}://${this.SERVER.HOST}:${this.SERVER.PORT}/notifications`
    }
  },
  
  // 数据库配置
  DATABASE: {
    NAME: 'map_data',
    COLLECTION_NAME: 'map_points'
  }
}

// 便捷方法
export const getApiUrl = (endpoint) => {
  return `${APP_CONFIG.API.BASE_URL}${APP_CONFIG.API.ENDPOINTS[endpoint] || endpoint}`
}

export const getWebSocketUrl = (endpoint = '') => {
  return `${APP_CONFIG.WEBSOCKET.BASE_URL}${endpoint}`
}

// 获取完整的服务器地址
export const getServerUrl = () => {
  return `${APP_CONFIG.SERVER.PROTOCOL}://${APP_CONFIG.SERVER.HOST}:${APP_CONFIG.SERVER.PORT}`
}

// 获取WebSocket服务器地址
export const getWebSocketServerUrl = () => {
  return `${APP_CONFIG.SERVER.WS_PROTOCOL}://${APP_CONFIG.SERVER.HOST}:${APP_CONFIG.SERVER.PORT}`
}
import { APP_CONFIG } from './config.js'

class NotificationManager {
  constructor() {
    this.socket = null
    this.subscribers = new Map()
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
  }
  
  // 订阅推送
  async subscribe(options = {}) {
    const { onMessage, onUnreadUpdate } = options
    
    if (!this.isInitialized) {
      await this.initialize()
    }
    
    const subscriptionId = Date.now().toString()
    
    this.subscribers.set(subscriptionId, {
      onMessage,
      onUnreadUpdate
    })
    
    return subscriptionId
  }
  
  // 取消订阅
  unsubscribe(subscriptionId) {
    this.subscribers.delete(subscriptionId)
  }
  
  // 初始化推送服务
  async initialize() {
    try {
      // 获取推送权限
      const result = await uni.requestSubscribeMessage({
        tmplIds: ['推送模板ID'] // 需要在微信公众平台配置
      })
      
      console.log('推送权限:', result)
      
      // 启动WebSocket连接用于实时推送
      this.connectWebSocket()
      
      this.isInitialized = true
    } catch (error) {
      console.error('初始化推送失败:', error)
    }
  }
  
  // 连接WebSocket
  connectWebSocket() {
    if (this.socket) {
      this.socket.close()
    }
    
    this.socket = uni.connectSocket({
      url: APP_CONFIG.WEBSOCKET.NOTIFICATIONS_URL
    })
    
    this.socket.onOpen(() => {
      console.log('推送连接已建立')
      this.reconnectAttempts = 0
    })
    
    this.socket.onMessage((res) => {
      try {
        const data = JSON.parse(res.data)
        this.handleNotification(data)
      } catch (error) {
        console.error('解析推送消息失败:', error)
      }
    })
    
    this.socket.onClose(() => {
      console.log('推送连接断开，尝试重连...')
      this.handleReconnect()
    })
    
    this.socket.onError((error) => {
      console.error('推送连接错误:', error)
      this.handleReconnect()
    })
  }
  
  // 处理重连
  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
      
      console.log(`第 ${this.reconnectAttempts} 次重连，${delay}ms 后重试`)
      
      setTimeout(() => {
        this.connectWebSocket()
      }, delay)
    } else {
      console.error('推送连接重连失败，已达到最大重试次数')
    }
  }
  
  // 处理推送通知
  handleNotification(data) {
    const { type, payload } = data
    
    // 通知所有订阅者
    this.subscribers.forEach(subscriber => {
      if (type === 'message' && subscriber.onMessage) {
        subscriber.onMessage(payload)
      } else if (type === 'unread_update' && subscriber.onUnreadUpdate) {
        subscriber.onUnreadUpdate(payload)
      }
    })
    
    // 显示系统通知
    if (type === 'message') {
      this.showSystemNotification(payload)
    }
  }
  
  // 显示系统通知
  showSystemNotification(message) {
    // 检查应用状态
    const pages = getCurrentPages()
    const isAppActive = pages.length > 0
    
    if (!isAppActive) {
      // 应用在后台，显示系统通知
      uni.showLocalNotification({
        title: message.senderName || '新消息',
        content: message.content,
        payload: JSON.stringify({
          chatId: message.chatId,
          chatType: message.chatType
        })
      })
    }
  }
  
  // 发送推送消息
  sendNotification(data) {
    if (this.socket && this.socket.readyState === 1) {
      this.socket.send({
        data: JSON.stringify(data)
      })
    } else {
      console.warn('推送连接未建立，无法发送消息')
    }
  }
  
  // 断开连接
  disconnect() {
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
    this.isInitialized = false
    this.reconnectAttempts = 0
  }
}

// 导出单例
export default new NotificationManager()
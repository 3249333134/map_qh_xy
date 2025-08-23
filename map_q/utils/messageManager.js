class MessageManager {
  constructor() {
    this.listeners = new Map()
    this.unreadCounts = new Map()
    this.totalUnread = 0
  }
  
  // 添加消息监听器
  addListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }
  
  // 移除监听器
  removeListener(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }
  
  // 触发事件
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        callback(data)
      })
    }
  }
  
  // 接收新消息
  receiveMessage(message) {
    const { chatId, chatType } = message
    const key = `${chatType}_${chatId}`
    
    // 更新未读计数
    const currentCount = this.unreadCounts.get(key) || 0
    this.unreadCounts.set(key, currentCount + 1)
    this.updateTotalUnread()
    
    // 触发消息事件
    this.emit('new-message', message)
    this.emit('unread-update', {
      chatId,
      chatType,
      count: currentCount + 1
    })
    
    // 显示推送通知
    this.showNotification(message)
  }
  
  // 标记消息已读
  markAsRead(chatId, chatType) {
    const key = `${chatType}_${chatId}`
    this.unreadCounts.set(key, 0)
    this.updateTotalUnread()
    
    this.emit('unread-update', {
      chatId,
      chatType,
      count: 0
    })
  }
  
  // 获取未读计数
  getUnreadCount(chatId, chatType) {
    const key = `${chatType}_${chatId}`
    return this.unreadCounts.get(key) || 0
  }
  
  // 更新总未读数
  updateTotalUnread() {
    this.totalUnread = Array.from(this.unreadCounts.values())
      .reduce((sum, count) => sum + count, 0)
    
    // 更新TabBar徽章
    if (this.totalUnread > 0) {
      uni.setTabBarBadge({
        index: 2, // 消息页面的索引
        text: this.totalUnread.toString()
      })
    } else {
      uni.removeTabBarBadge({
        index: 2
      })
    }
    
    this.emit('total-unread-update', this.totalUnread)
  }
  
  // 显示推送通知
  showNotification(message) {
    // 检查应用是否在前台
    const isActive = getCurrentPages().length > 0
    
    if (!isActive) {
      // 应用在后台，显示系统通知
      uni.showLocalNotification({
        title: message.senderName,
        content: message.content,
        payload: {
          chatId: message.chatId,
          chatType: message.chatType
        }
      })
    } else {
      // 应用在前台，显示应用内通知
      this.showInAppNotification(message)
    }
  }
  
  // 应用内通知
  showInAppNotification(message) {
    this.emit('in-app-notification', {
      title: message.senderName,
      content: message.content,
      avatar: message.senderAvatar,
      duration: 3000
    })
  }
  
  // 清除所有未读
  clearAllUnread() {
    this.unreadCounts.clear()
    this.totalUnread = 0
    uni.removeTabBarBadge({ index: 2 })
    this.emit('total-unread-update', 0)
  }
}

// 导出单例
export default new MessageManager()
import { getApiUrl } from './config.js'

// 消息相关API
export const messageApi = {
  // 获取联系人列表
  async getContacts() {
    try {
      const response = await uni.request({
        url: getApiUrl('CONTACTS'),
        method: 'GET'
      })
      return response.data.data || []
    } catch (error) {
      console.error('获取联系人失败:', error)
      return this.getMockContacts()
    }
  },
  
  // 获取群组列表
  async getGroups() {
    try {
      const response = await uni.request({
        url: getApiUrl('GROUPS'),
        method: 'GET'
      })
      return response.data.data || []
    } catch (error) {
      console.error('获取群组失败:', error)
      return this.getMockGroups()
    }
  },
  
  // 获取频道列表
  async getChannels() {
    try {
      const response = await uni.request({
        url: getApiUrl('CHANNELS'),
        method: 'GET'
      })
      return response.data.data || []
    } catch (error) {
      console.error('获取频道失败:', error)
      return this.getMockChannels()
    }
  },
  
  // 获取未读计数
  async getUnreadCounts() {
    try {
      const response = await uni.request({
        url: getApiUrl('UNREAD_COUNTS'),
        method: 'GET'
      })
      return response.data.data || []
    } catch (error) {
      console.error('获取未读计数失败:', error)
      return [
        { type: 'contact', count: 3 },
        { type: 'group', count: 0 },
        { type: 'channel', count: 5 }
      ]
    }
  },
  
  // 标记为已读
  async markAsRead(chatId, type) {
    try {
      await uni.request({
        url: getApiUrl('MARK_READ'),
        method: 'POST',
        data: { chatId, type }
      })
    } catch (error) {
      console.error('标记已读失败:', error)
    }
  },
  
  // 创建群聊
  async createGroup(name) {
    try {
      const response = await uni.request({
        url: getApiUrl('GROUPS'),
        method: 'POST',
        data: { name }
      })
      return response.data.data
    } catch (error) {
      console.error('创建群聊失败:', error)
      throw error
    }
  },
  
  // 模拟数据
  getMockContacts() {
    return [
      {
        id: 1,
        name: '张三',
        avatar: '/static/user1.png',
        lastMessage: '你好，最近怎么样？',
        time: '10:30',
        unread: 2
      },
      {
        id: 2,
        name: '李四',
        avatar: '/static/user2.png',
        lastMessage: '明天见面聊',
        time: '09:15',
        unread: 0
      },
      {
        id: 3,
        name: '王五',
        avatar: '/static/user3.png',
        lastMessage: '文件已发送',
        time: '昨天',
        unread: 1
      }
    ]
  },
  
  getMockGroups() {
    return [
      {
        id: 1,
        name: '工作群',
        avatar: '/static/group1.png',
        lastMessage: '会议时间改到下午3点',
        time: '11:20',
        unread: 1
      },
      {
        id: 2,
        name: '同学群',
        avatar: '/static/group2.png',
        lastMessage: '周末聚餐安排',
        time: '10:45',
        unread: 0
      }
    ]
  },
  
  getMockChannels() {
    return [
      {
        id: 1,
        name: '技术频道',
        avatar: '/static/channel1.png',
        lastMessage: '新的技术分享',
        time: '08:45',
        unread: 3
      },
      {
        id: 2,
        name: '新闻频道',
        avatar: '/static/channel2.png',
        lastMessage: '今日要闻',
        time: '07:30',
        unread: 2
      }
    ]
  }
}
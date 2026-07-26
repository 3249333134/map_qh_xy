import { http, buildUrl } from '../request.js'
import { logError } from '../logger.js'

export const messageApi = {
  async getContacts() {
    try {
      const res = await http.get(buildUrl('/api/contacts'))
      return res.data.data || []
    } catch (error) {
      logError(error, '获取联系人')
      return getMockContacts()
    }
  },

  async getGroups() {
    try {
      const res = await http.get(buildUrl('/api/groups'))
      return res.data.data || []
    } catch (error) {
      logError(error, '获取群组')
      return getMockGroups()
    }
  },

  async getChannels() {
    try {
      const res = await http.get(buildUrl('/api/channels'))
      return res.data.data || []
    } catch (error) {
      logError(error, '获取频道')
      return getMockChannels()
    }
  },

  async getUnreadCounts() {
    try {
      const res = await http.get(buildUrl('/api/unread-counts'))
      return res.data.data || []
    } catch (error) {
      logError(error, '获取未读计数')
      return [
        { type: 'contact', count: 3 },
        { type: 'group', count: 0 },
        { type: 'channel', count: 5 }
      ]
    }
  },

  async markAsRead(chatId, type) {
    try {
      await http.post(buildUrl('/api/mark-read'), { chatId, type })
    } catch (error) {
      logError(error, '标记已读')
    }
  },

  async createGroup(name) {
    try {
      const res = await http.post(buildUrl('/api/groups'), { name })
      return res.data.data
    } catch (error) {
      logError(error, '创建群聊')
      throw error
    }
  }
}

function getMockContacts() {
  return [
    { id: 1, name: '张三', avatar: '/static/user1.png', lastMessage: '你好，最近怎么样？', time: '10:30', unread: 2 },
    { id: 2, name: '李四', avatar: '/static/user2.png', lastMessage: '明天见面聊', time: '09:15', unread: 0 },
    { id: 3, name: '王五', avatar: '/static/user3.png', lastMessage: '文件已发送', time: '昨天', unread: 1 }
  ]
}

function getMockGroups() {
  return [
    { id: 1, name: '工作群', avatar: '/static/group1.png', lastMessage: '会议时间改到下午3点', time: '11:20', unread: 1 },
    { id: 2, name: '同学群', avatar: '/static/group2.png', lastMessage: '周末聚餐安排', time: '10:45', unread: 0 }
  ]
}

function getMockChannels() {
  return [
    { id: 1, name: '技术频道', avatar: '/static/channel1.png', lastMessage: '新的技术分享', time: '08:45', unread: 3 },
    { id: 2, name: '新闻频道', avatar: '/static/channel2.png', lastMessage: '今日要闻', time: '07:30', unread: 2 }
  ]
}

export default messageApi

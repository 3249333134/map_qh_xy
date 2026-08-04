import { beforeEach, describe, expect, it } from 'vitest'
import {
  channelApi,
  conversationApi,
  favoriteApi,
  footprintApi,
  messageApi,
  profileApi,
  socialStore,
  timelineApi
} from '../utils/api/social.js'
import { consumeChannelOpenCommand, setChannelOpenCommand } from '../utils/channelOpenCommand.js'

describe('5.5/5.6 社交与个人数据闭环', () => {
  beforeEach(() => socialStore.resetForTest())

  it('迁移旧会话并按置顶、星标排序与汇总未读', () => {
    conversationApi.hydrateLegacy({
      city: [
        { id: 'a', type: 'channel', name: '频道 A', preview: '新消息', unread: 2 },
        { id: 'b', type: 'direct', name: '用户 B', preview: '你好', unread: 1, pinned: true }
      ]
    })
    conversationApi.patch('a', { starred: true })
    expect(conversationApi.list('city').map((item) => item.id)).toEqual(['b', 'a'])
    expect(conversationApi.unreadOverview()).toMatchObject({ channel: 2, direct: 1, total: 3 })
  })

  it('草稿、免打扰与本地清除可持久化', () => {
    conversationApi.hydrateLegacy({ direct: [{ id: 'chat-1', type: 'direct', name: '小王', preview: '' }] })
    conversationApi.setDraft('chat-1', '稍后发送')
    conversationApi.patch('chat-1', { muted: true })
    expect(conversationApi.get('chat-1')).toMatchObject({ draft: '稍后发送', muted: true })
    expect(conversationApi.removeLocal('chat-1')).toBe(true)
    expect(conversationApi.get('chat-1')).toBeNull()
  })

  it('消息支持失败重试与限时撤回', () => {
    const failed = messageApi.send('chat-1', { type: 'text', text: '测试', simulateFailure: true })
    expect(failed.deliveryState).toBe('failed')
    expect(messageApi.retry('chat-1', failed.id)?.deliveryState).toBe('sent')
    expect(messageApi.recall('chat-1', failed.id)).toBe(true)
    expect(messageApi.list('chat-1')[0].deliveryState).toBe('recalled')
  })

  it('频道命令只消费一次，所有者不能直接退出', () => {
    setChannelOpenCommand({ channelId: 'city', source: 'map_anchor', focusThreadId: 'city-route' })
    expect(consumeChannelOpenCommand()).toMatchObject({ channelId: 'city', source: 'map_anchor' })
    expect(consumeChannelOpenCommand()).toBeNull()
    channelApi.patch('city', { owner: 'self' })
    expect(channelApi.exit('city')).toMatchObject({ ok: false })
  })

  it('足迹分享会过滤私密与敏感内容并模糊位置', () => {
    footprintApi.seed([
      { id: 'public', latitude: 30.572269, longitude: 104.066541, visibility: 'public', locationPrecision: 'exact' },
      { id: 'private', latitude: 30.57, longitude: 104.06, visibility: 'private', locationPrecision: 'exact' },
      { id: 'sensitive', latitude: 30.58, longitude: 104.07, visibility: 'public', locationPrecision: 'exact', sensitive: true }
    ])
    const shared = footprintApi.shareSnapshot()
    expect(shared).toHaveLength(1)
    expect(shared[0]).toMatchObject({ id: 'public', locationPrecision: 'fuzzy' })
    expect(shared[0].latitude).not.toBe(30.572269)
  })

  it('时间轴分享年度回顾不会公开私密条目', () => {
    timelineApi.seed([
      { id: 'public', title: '公开记录', createdAt: Date.parse('2026-03-02'), private: false },
      { id: 'private', title: '私密记录', createdAt: Date.parse('2026-04-02'), private: true }
    ])
    expect(timelineApi.yearReview(2026, false)).toHaveLength(2)
    expect(timelineApi.yearReview(2026, true).map((item) => item.id)).toEqual(['public'])
  })

  it('收藏推荐开关与个人资料统一持久化', () => {
    favoriteApi.setRecommendationEnabled(false)
    profileApi.patch({ username: '用户372' })
    expect(profileApi.get()).toMatchObject({
      username: '用户372',
      privacy: { favoritesForRecommendation: false }
    })
  })
})

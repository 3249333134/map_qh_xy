import { describe, expect, it } from 'vitest'
import { resolveMessageMap, validChatLocation } from '../utils/messageMap.js'

const channels = {
  city: { name: '城市频道', location: { latitude: 30, longitude: 104, name: '成都' }, radius: 1200 },
  park: { name: '公园频道', location: { latitude: 31, longitude: 105, name: '公园' } }
}
const resolve = options => resolveMessageMap({ tab: 0, bucket: 'city', getChannel: id => channels[id], ...options })

describe('message map association', () => {
  it('follows the selected channel and keeps its declared area', () => {
    expect(resolve({}).location.latitude).toBe(30)
    expect(resolve({}).radius).toBe(1200)
    expect(resolve({ bucket: 'park' }).location.latitude).toBe(31)
    expect(resolve({ bucket: 'park' }).radius).toBeNull()
  })
  it('prefers a conversation location and resolves explicit group channel links', () => {
    expect(resolve({ message: { id: 'g', type: 'group', channelId: 'park' } }).location.latitude).toBe(31)
    expect(resolve({ message: { id: 'g', type: 'group', location: { latitude: 0, longitude: 0 } } }).location.latitude).toBe(0)
    expect(resolve({ message: { id: 'park-1', type: 'channel' } }).channelId).toBe('park')
  })
  it('does not invent missing locations or expose private friend coordinates', () => {
    expect(resolve({ bucket: 'unknown' }).location).toBeNull()
    expect(validChatLocation({ latitude: null, longitude: 104 })).toBeNull()
    expect(validChatLocation({ latitude: 91, longitude: 104 })).toBeNull()
    const friend = resolve({ message: { type: 'direct', name: '小明', location: channels.city.location } })
    expect(friend.kind).toBe('direct')
    expect(friend.title).toBe('小明')
    expect(friend.location).toBeNull()
    expect(resolve({ tab: 2 }).kind).toBe('system')
  })
})

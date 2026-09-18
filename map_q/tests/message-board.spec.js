import { beforeEach, describe, expect, it } from 'vitest'
import { messageBoardApi } from '../utils/api/messageBoard.js'
import { installUniStorage } from './setup.js'

describe('message board repository', () => {
  beforeEach(() => installUniStorage())

  it('stores multiple media items as one map board entity', () => {
    const board = messageBoardApi.create({ title: '城市夜话', location: { coordinates: [104, 30] }, items: [{ text: '第一条' }, { images: ['a.jpg', 'b.jpg'] }] })
    expect(messageBoardApi.list()).toHaveLength(1)
    expect(board.itemCount).toBe(2)
    expect(board.location.coordinates).toEqual([104, 30])
  })

  it('rejects mixed images and video in a single message', () => {
    expect(() => messageBoardApi.create({ items: [{ images: ['a.jpg'], video: { url: 'a.mp4' } }] })).toThrow('不能同时包含')
  })

  it('supports delete and undo restore', () => {
    const board = messageBoardApi.create({ items: [{ text: '可撤销' }] })
    const removed = messageBoardApi.remove(board.id)
    expect(messageBoardApi.list()).toHaveLength(0)
    messageBoardApi.restore(removed)
    expect(messageBoardApi.list()[0].id).toBe(board.id)
  })
})

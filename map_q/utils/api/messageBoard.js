import { asArray, readVersioned, writeVersioned } from './storage.js'

const VERSION = 1
const BOARD_KEY = 'MAP_MESSAGE_BOARDS_V1'
const DRAFT_KEY = 'MAP_MESSAGE_BOARD_DRAFT_V1'

const clone = value => JSON.parse(JSON.stringify(value))
const uid = prefix => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

function normalizeItem(input = {}) {
  const images = asArray(input.images).filter(Boolean).slice(0, 9)
  const video = input.video?.url ? { url: input.video.url, poster: input.video.poster || '' } : null
  if (images.length && video) throw new Error('一条留言不能同时包含图片和视频')
  const text = String(input.text || '').trim().slice(0, 1000)
  if (!text && !images.length && !video) throw new Error('请至少添加文字、图片或视频')
  return {
    id: String(input.id || uid('message')),
    type: video ? 'video' : images.length ? 'images' : 'text',
    text, images, video,
    author: input.author || { id: 'local_user', name: '我', avatar: '/static/logo.png' },
    likes: Number(input.likes || 0), replies: asArray(input.replies), createdAt: Number(input.createdAt || Date.now())
  }
}

function normalizeBoard(input = {}) {
  const items = asArray(input.items).map(normalizeItem)
  const coords = asArray(input.location?.coordinates)
  return {
    id: String(input.id || uid('board')),
    title: String(input.title || '').trim().slice(0, 40) || '城市留言板',
    description: String(input.description || '').trim().slice(0, 200),
    location: { type: 'Point', coordinates: [Number(coords[0] || 104.0668), Number(coords[1] || 30.5725)], address: input.location?.address || '地图选点' },
    visibility: ['public', 'friends', 'private'].includes(input.visibility) ? input.visibility : 'public',
    cover: input.cover || items.find(item => item.images?.length)?.images?.[0] || items.find(item => item.video)?.video?.poster || '',
    items, itemCount: items.length, status: input.status || 'active',
    createdAt: Number(input.createdAt || Date.now()), updatedAt: Number(input.updatedAt || Date.now())
  }
}

const readBoards = () => asArray(readVersioned(BOARD_KEY, VERSION, [])).map(normalizeBoard)
const saveBoards = boards => writeVersioned(BOARD_KEY, VERSION, boards.map(normalizeBoard))

export const messageBoardApi = {
  list() { return clone(readBoards()) },
  get(id) { const board = readBoards().find(item => item.id === String(id)); return board ? clone(board) : null },
  create(input) {
    const board = normalizeBoard(input)
    if (!board.items.length) throw new Error('留言板至少需要一条内容')
    saveBoards([board, ...readBoards()])
    this.clearDraft()
    return clone(board)
  },
  addItem(boardId, input) {
    const boards = readBoards()
    const index = boards.findIndex(item => item.id === String(boardId))
    if (index < 0) throw new Error('留言板不存在')
    boards[index] = normalizeBoard({ ...boards[index], items: [...boards[index].items, normalizeItem(input)], updatedAt: Date.now() })
    saveBoards(boards)
    return clone(boards[index])
  },
  toggleLike(boardId, itemId) {
    const boards = readBoards(); const board = boards.find(item => item.id === String(boardId))
    if (!board) throw new Error('留言板不存在')
    const item = board.items.find(entry => entry.id === String(itemId)); if (!item) throw new Error('留言不存在')
    item.likes += 1; board.updatedAt = Date.now(); saveBoards(boards); return clone(board)
  },
  addReply(boardId, itemId, text) {
    const value = String(text || '').trim().slice(0, 300); if (!value) throw new Error('请输入回复内容')
    const boards = readBoards(); const board = boards.find(item => item.id === String(boardId)); if (!board) throw new Error('留言板不存在')
    const item = board.items.find(entry => entry.id === String(itemId)); if (!item) throw new Error('留言不存在')
    item.replies.push({ id: uid('reply'), text: value, author: '我', createdAt: Date.now() }); board.updatedAt = Date.now(); saveBoards(boards); return clone(board)
  },
  remove(id) {
    const boards = readBoards(); const removed = boards.find(item => item.id === String(id)); if (!removed) return null
    saveBoards(boards.filter(item => item.id !== String(id))); return clone(removed)
  },
  restore(board) { if (!board) return null; const normalized = normalizeBoard(board); saveBoards([normalized, ...readBoards().filter(item => item.id !== normalized.id)]); return clone(normalized) },
  saveDraft(draft) { return writeVersioned(DRAFT_KEY, VERSION, { ...draft, updatedAt: Date.now() }) },
  getDraft() { return readVersioned(DRAFT_KEY, VERSION, null) },
  clearDraft() { try { uni.removeStorageSync(DRAFT_KEY) } catch (error) {} }
}

export { normalizeBoard as normalizeMessageBoard, normalizeItem as normalizeMessageBoardItem }
export default messageBoardApi

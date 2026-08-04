import { readVersioned, writeVersioned } from './storage.js'

const VERSION = 1
const KEY = 'CONTENT_ACTION_STATE_V1'
const emptyState = () => ({ liked: false, collected: false, followed: false, hidden: false, reported: false, comments: [] })
const readAll = () => readVersioned(KEY, VERSION, {})
const saveAll = data => writeVersioned(KEY, VERSION, data)

function update(id, updater) {
  const all = readAll()
  const previous = { ...emptyState(), ...(all[id] || {}) }
  const next = updater({ ...previous })
  all[id] = next
  saveAll(all)
  return next
}

export const contentInteractionApi = {
  getState(id) {
    return { ...emptyState(), ...(readAll()[id] || {}) }
  },
  toggle(id, field) {
    if (!['liked', 'collected', 'followed'].includes(field)) throw new Error('不支持的互动类型')
    return update(id, state => ({ ...state, [field]: !state[field] }))
  },
  addComment(id, content, parentId = '') {
    const value = String(content || '').trim()
    if (!value) throw new Error('评论内容不能为空')
    return update(id, state => ({
      ...state,
      comments: [{
        id: `comment_${Date.now()}`,
        content: value,
        parentId,
        author: { id: 'current_user', name: '我', avatar: '/static/logo.png' },
        liked: false,
        likeCount: 0,
        createdAt: Date.now()
      }, ...(state.comments || [])]
    }))
  },
  toggleCommentLike(id, commentId) {
    return update(id, state => ({
      ...state,
      comments: (state.comments || []).map(comment => comment.id === commentId
        ? { ...comment, liked: !comment.liked, likeCount: Math.max(0, Number(comment.likeCount || 0) + (comment.liked ? -1 : 1)) }
        : comment)
    }))
  },
  report(id, reason) {
    return update(id, state => ({ ...state, reported: true, reportReason: reason, reportedAt: Date.now() }))
  },
  hide(id) {
    return update(id, state => ({ ...state, hidden: true, hiddenAt: Date.now() }))
  },
  undoHide(id) {
    return update(id, state => ({ ...state, hidden: false, hiddenAt: 0 }))
  },
  buildSharePath(detail) {
    return `/pages/detail/index?id=${encodeURIComponent(detail.id)}&type=${encodeURIComponent(detail.type)}&source=share`
  }
}

export default contentInteractionApi


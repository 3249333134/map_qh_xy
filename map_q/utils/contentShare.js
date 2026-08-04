import { contentInteractionApi } from './api/contentInteraction.js'

export function shareActiveContent() {
  const detail = uni.getStorageSync('CONTENT_DETAIL_ACTIVE_V1')
  if (!detail?.id) {
    uni.showToast({ title: '分享信息尚未准备好', icon: 'none' })
    return
  }
  const path = contentInteractionApi.buildSharePath(detail)
  // #ifdef H5
  const base = typeof location !== 'undefined' ? `${location.origin}${location.pathname}#` : ''
  uni.setClipboardData({ data: `${base}${path}` })
  // #endif
  // #ifndef H5
  uni.showShareMenu({
    withShareTicket: true,
    fail: () => uni.setClipboardData({ data: path })
  })
  uni.showModal({ title: '分享内容', content: '请使用右上角分享按钮发送给好友；也可以复制当前详情路径。', cancelText: '关闭', confirmText: '复制路径', success: result => { if (result.confirm) uni.setClipboardData({ data: path }) } })
  // #endif
}


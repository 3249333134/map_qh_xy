const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
const cancelledTaskIds = new Set()

export const MEDIA_STATUS = {
  QUEUED: 'queued',
  UPLOADING: 'uploading',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  NEEDS_RESELECT: 'needs_reselect'
}

const extensionKind = path => /\.(mp4|mov|m4v|webm)$/i.test(String(path || '')) ? 'video' : 'image'

export const mediaUploadApi = {
  createTasks(paths = [], kind = '') {
    return paths.map((path, index) => ({
      id: `media_${Date.now()}_${index}`,
      kind: kind || extensionKind(path),
      localPath: path,
      previewPath: path,
      status: MEDIA_STATUS.QUEUED,
      progress: 0,
      remoteUrl: '',
      error: '',
      retryCount: 0,
      createdAt: Date.now()
    }))
  },

  validateSelection(existing = [], next = []) {
    const all = [...existing.filter(item => item.status !== MEDIA_STATUS.CANCELLED), ...next]
    const kinds = new Set(all.map(item => item.kind))
    if (kinds.size > 1) throw new Error('图片与视频不能混合发布')
    if (all.some(item => item.kind === 'video') && all.length > 1) throw new Error('每次最多发布 1 个视频')
    if (all.filter(item => item.kind === 'image').length > 9) throw new Error('每次最多发布 9 张图片')
    return true
  },

  async upload(task, onChange = () => {}) {
    cancelledTaskIds.delete(task.id)
    const next = { ...task, status: MEDIA_STATUS.UPLOADING, error: '', progress: 4 }
    onChange(next)
    for (const progress of [18, 36, 58, 78, 100]) {
      await wait(90)
      if (cancelledTaskIds.has(task.id)) {
        next.status = MEDIA_STATUS.CANCELLED
        next.progress = 0
        return next
      }
      next.progress = progress
      onChange({ ...next })
    }
    if (String(task.localPath).includes('__upload_fail__')) {
      next.status = MEDIA_STATUS.FAILED
      next.error = '模拟上传失败，请重试或删除该媒体'
      next.progress = 0
    } else {
      next.status = MEDIA_STATUS.SUCCEEDED
      next.remoteUrl = task.localPath
      next.progress = 100
      next.completedAt = Date.now()
    }
    onChange({ ...next })
    return next
  },

  retry(task, onChange) {
    return this.upload({ ...task, retryCount: Number(task.retryCount || 0) + 1, status: MEDIA_STATUS.QUEUED }, onChange)
  },

  cancel(task) {
    cancelledTaskIds.add(task.id)
    return { ...task, status: MEDIA_STATUS.CANCELLED, progress: 0, error: '' }
  },

  restore(tasks = []) {
    return tasks.map(task => {
      if (task.status === MEDIA_STATUS.UPLOADING) return { ...task, status: MEDIA_STATUS.FAILED, progress: 0, error: '上次上传被中断，请重试' }
      if (/^blob:/i.test(task.localPath || '') && !task.remoteUrl) return { ...task, status: MEDIA_STATUS.NEEDS_RESELECT, progress: 0, error: 'H5 临时媒体已失效，请重新选择' }
      return task
    })
  }
}

export default mediaUploadApi

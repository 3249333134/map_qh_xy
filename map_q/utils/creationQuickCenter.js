import { readVersioned, writeVersioned } from './api/storage.js'
import { MEDIA_STATUS } from './api/mediaUpload.js'
import { CREATION_STATUS } from './api/creation.js'

const VERSION = 1
const PREFERENCE_KEY = 'CREATION_PREFERENCES_V1'
const QUICK_STATE_KEY = 'CREATION_QUICK_CENTER_V1'

export const LOCATION_PRECISION_OPTIONS = [
  { id: 'exact', title: '精确位置', description: '发布时保存准确坐标', icon: '◎' },
  { id: 'fuzzy', title: '模糊位置', description: '仅展示约 300–500 米区域', icon: '◌' },
  { id: 'hidden', title: '隐藏位置', description: '不保存坐标，不生成地图锚点', icon: '—' }
]

export function loadCreationPreferences() {
  const saved = readVersioned(PREFERENCE_KEY, VERSION, null)
  return {
    version: VERSION,
    defaultLocationPrecision: ['exact', 'fuzzy', 'hidden'].includes(saved?.defaultLocationPrecision)
      ? saved.defaultLocationPrecision
      : 'fuzzy',
    updatedAt: Number(saved?.updatedAt || Date.now())
  }
}

export function saveCreationPreferences(input = {}) {
  const value = {
    version: VERSION,
    defaultLocationPrecision: ['exact', 'fuzzy', 'hidden'].includes(input.defaultLocationPrecision)
      ? input.defaultLocationPrecision
      : 'fuzzy',
    updatedAt: Date.now()
  }
  writeVersioned(PREFERENCE_KEY, VERSION, value)
  return value
}

export function loadQuickCenterState() {
  const saved = readVersioned(QUICK_STATE_KEY, VERSION, null)
  return {
    activePanel: 'radar',
    selectedRadarItemId: String(saved?.selectedRadarItemId || ''),
    lastScanAt: Number(saved?.lastScanAt || 0)
  }
}

export function saveQuickCenterState(input = {}) {
  const value = {
    activePanel: 'radar',
    selectedRadarItemId: String(input.selectedRadarItemId || ''),
    lastScanAt: Number(input.lastScanAt || 0)
  }
  writeVersioned(QUICK_STATE_KEY, VERSION, value)
  return value
}

export function summarizeCreationCenter(drafts = [], records = []) {
  const media = drafts.flatMap(draft => (draft.media || []).map(task => ({ ...task, draftId: draft.id, mode: draft.mode })))
  const count = status => media.filter(item => item.status === status).length
  const recordCount = status => records.filter(item => item.status === status).length
  return {
    drafts: drafts.length,
    media,
    queued: count(MEDIA_STATUS.QUEUED),
    uploading: count(MEDIA_STATUS.UPLOADING),
    failed: count(MEDIA_STATUS.FAILED),
    needsReselect: count(MEDIA_STATUS.NEEDS_RESELECT),
    reviewPending: recordCount(CREATION_STATUS.REVIEW_PENDING),
    published: recordCount(CREATION_STATUS.PUBLISHED),
    rejected: recordCount(CREATION_STATUS.REJECTED),
    scheduled: recordCount(CREATION_STATUS.SCHEDULED)
  }
}

export function autosaveLabel(summary = {}) {
  if (summary.uploading > 0) return `上传中 ${summary.uploading}`
  if (summary.failed + summary.needsReselect > 0) return `${summary.failed + summary.needsReselect} 项待处理`
  if (summary.drafts > 0) return `${summary.drafts} 个草稿可恢复`
  return '已自动保存'
}

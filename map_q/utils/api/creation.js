import { readVersioned, writeVersioned } from './storage.js'
import { MEDIA_STATUS } from './mediaUpload.js'
import { ipRightsApi } from './ipRights.js'

const VERSION = 1
const DRAFT_KEY = 'CREATION_DRAFTS_V1'
const RECORD_KEY = 'CREATION_RECORDS_V1'
const ANCHOR_KEY = 'CREATION_MAP_ANCHORS_V1'
const CHANNEL_KEY = 'CREATION_CHANNEL_RECORDS_V1'
const TIMELINE_KEY = 'CREATION_TIMELINE_RECORDS_V1'
const NOTICE_KEY = 'CREATION_NOTIFICATIONS_V1'
const TEST_SHARE_KEY = 'SANDBOX_TEST_SHARES_V1'

const clone = value => JSON.parse(JSON.stringify(value))
const readList = key => readVersioned(key, VERSION, [])
const saveList = (key, list) => writeVersioned(key, VERSION, list)
const activeSubmissions = new Set()

export const CREATION_STATUS = {
  DRAFT: 'draft',
  UPLOADING: 'uploading',
  REVIEW_PENDING: 'review_pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SCHEDULED: 'scheduled',
  CANCELLED: 'cancelled',
  PUBLISHED: 'published'
}

export function createCreationDraft(mode = 'normal', seed = {}) {
  const id = seed.id || `draft_${mode}_${Date.now()}`
  const savedPreference = readVersioned('CREATION_PREFERENCES_V1', 1, null)
  const defaultPrecision = ['exact', 'fuzzy', 'hidden'].includes(savedPreference?.defaultLocationPrecision)
    ? savedPreference.defaultLocationPrecision
    : 'fuzzy'
  return {
    id,
    mode,
    contentType: seed.contentType || 'normal',
    text: '',
    media: [],
    topics: [],
    mentions: [],
    location: { precision: defaultPrecision, name: '', address: '', latitude: null, longitude: null },
    visibility: 'public',
    copyright: { kind: 'original', sourceName: '', statement: '原创内容，未经许可请勿转载' },
    sandbox: { category: '灵感', scheduleAt: 0, testRecipients: [] },
    ip: { profileId: '', officialIdentity: false, tags: [], series: '', licenseRule: null },
    beacon: { name: '', type: 'place', description: '', evidence: [], duplicateCheck: [] },
    status: CREATION_STATUS.DRAFT,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...seed
  }
}

export function validateCreationDraft(draft, { forSubmit = true } = {}) {
  const errors = {}
  const activeMedia = (draft.media || []).filter(item => item.status !== MEDIA_STATUS.CANCELLED)
  const successfulMedia = activeMedia.filter(item => item.status === MEDIA_STATUS.SUCCEEDED)
  if (!String(draft.text || '').trim() && successfulMedia.length === 0 && draft.mode !== 'beacon') errors.content = '请输入正文或添加已上传完成的媒体'
  if (activeMedia.some(item => item.status === MEDIA_STATUS.UPLOADING || item.status === MEDIA_STATUS.QUEUED)) errors.media = '媒体仍在上传，请等待完成'
  if (activeMedia.some(item => [MEDIA_STATUS.FAILED, MEDIA_STATUS.NEEDS_RESELECT].includes(item.status))) errors.media = '存在上传失败或失效媒体，请重试、重新选择或删除'
  if ((draft.topics || []).length > 5) errors.topics = '最多添加 5 个话题'
  if ((draft.mentions || []).length > 20) errors.mentions = '最多 @ 20 位用户'
  if (draft.copyright?.kind === 'repost' && !String(draft.copyright.sourceName || '').trim()) errors.copyright = '转载内容必须填写来源'
  if (draft.copyright?.kind === 'licensed' && !String(draft.copyright.statement || '').trim()) errors.copyright = '授权素材必须填写授权说明'
  if (draft.mode === 'ip') {
    const profile = ipRightsApi.getProfile(draft.ip?.profileId)
    if (!profile) errors.ip = '请选择 IP'
    if (draft.ip?.officialIdentity && !profile?.verified) errors.ip = '未完成权属认证，不能使用官方 IP 身份'
    if (!draft.ip?.licenseRule) errors.license = '请配置结构化授权规则'
  }
  if (draft.mode === 'beacon') {
    if (!String(draft.beacon?.name || '').trim()) errors.beaconName = '请填写信标名称'
    if (!String(draft.beacon?.description || '').trim()) errors.beaconDescription = '请填写信标介绍'
    if (!Number.isFinite(Number(draft.location?.latitude)) || !Number.isFinite(Number(draft.location?.longitude))) errors.location = '请选择并校正信标坐标'
    if (forSubmit && !(draft.beacon?.evidence || draft.media || []).some(item => item.status === MEDIA_STATUS.SUCCEEDED)) errors.evidence = '请至少添加一项上传成功的证据'
  }
  return errors
}

function upsertById(list, value) {
  return [value, ...list.filter(item => item.id !== value.id)]
}

function pushNotice(record, title, content) {
  saveList(NOTICE_KEY, [{ id: `creation_notice_${Date.now()}`, recordId: record.id, title, content, read: false, createdAt: Date.now() }, ...readList(NOTICE_KEY)])
}

function createProducts(record) {
  const draft = record.draftSnapshot
  const coordinates = draft.location?.precision === 'hidden' ? null : [Number(draft.location.longitude), Number(draft.location.latitude)]
  let anchorId = ''
  if (coordinates && draft.visibility !== 'private' && !draft.beacon?.linkedPointId) {
    anchorId = `created_anchor_${record.id}`
    const anchor = {
      _id: anchorId,
      id: anchorId,
      type: draft.mode === 'beacon' ? 'place' : draft.contentType,
      anchorKind: draft.mode === 'beacon' ? 'candidate' : 'normal',
      reviewStatus: record.status,
      authorOnly: record.status !== CREATION_STATUS.PUBLISHED,
      accessScope: draft.visibility,
      name: draft.mode === 'beacon' ? draft.beacon.name : (draft.text.slice(0, 18) || '新发布内容'),
      title: draft.text.slice(0, 32) || draft.beacon?.name || '新发布内容',
      description: draft.mode === 'beacon' ? draft.beacon.description : draft.text,
      location: { type: 'Point', coordinates },
      address: draft.location.address || draft.location.name,
      images: (draft.media || []).filter(item => item.status === MEDIA_STATUS.SUCCEEDED).map(item => item.remoteUrl || item.previewPath),
      createdAt: record.createdAt
    }
    saveList(ANCHOR_KEY, upsertById(readList(ANCHOR_KEY), anchor))
  }
  const channelRecordId = draft.visibility === 'private' ? '' : `channel_${record.id}`
  if (channelRecordId) saveList(CHANNEL_KEY, upsertById(readList(CHANNEL_KEY), { id: channelRecordId, recordId: record.id, status: record.status, visibility: draft.visibility, snapshot: clone(draft), createdAt: Date.now() }))
  const timelineRecordId = `timeline_${record.id}`
  saveList(TIMELINE_KEY, upsertById(readList(TIMELINE_KEY), { id: timelineRecordId, recordId: record.id, action: draft.mode === 'beacon' ? '提交地图共创' : '发布内容', title: draft.text.slice(0, 30) || draft.beacon?.name || '新创作', status: record.status, createdAt: Date.now() }))
  return { anchorId, channelRecordId, timelineRecordId }
}

export const creationApi = {
  listDrafts(mode = '') {
    const drafts = readList(DRAFT_KEY)
    return mode ? drafts.filter(item => item.mode === mode) : drafts
  },
  getDraft(id) {
    return readList(DRAFT_KEY).find(item => item.id === id) || null
  },
  getLatestDraft(mode) {
    return this.listDrafts(mode).find(item => item.status === CREATION_STATUS.DRAFT) || null
  },
  saveDraft(draft) {
    const value = { ...clone(draft), status: draft.status || CREATION_STATUS.DRAFT, updatedAt: Date.now() }
    saveList(DRAFT_KEY, upsertById(readList(DRAFT_KEY), value))
    return value
  },
  removeDraft(id) {
    saveList(DRAFT_KEY, readList(DRAFT_KEY).filter(item => item.id !== id))
  },
  listRecords() {
    return readList(RECORD_KEY)
  },
  getRecord(id) {
    return this.listRecords().find(item => item.id === id) || null
  },
  async submit(draft, options = {}) {
    const submissionKey = String(draft?.id || '')
    if (activeSubmissions.has(submissionKey)) throw new Error('正在提交，请勿重复操作')
    activeSubmissions.add(submissionKey)
    try {
    const errors = validateCreationDraft(draft)
    if (Object.keys(errors).length) {
      const error = new Error(Object.values(errors)[0])
      error.fields = errors
      throw error
    }
    const scheduleAt = Number(draft.sandbox?.scheduleAt || 0)
    const scheduled = draft.mode === 'sandbox' && scheduleAt > Date.now() && !options.publishNow
    const id = `creation_${Date.now()}`
    let licenseVersionId = ''
    if (draft.mode === 'ip') licenseVersionId = ipRightsApi.createLicenseVersion(draft.ip.licenseRule, id).id
    const record = {
      id,
      mode: draft.mode,
      draftSnapshot: clone(draft),
      status: scheduled ? CREATION_STATUS.SCHEDULED : CREATION_STATUS.REVIEW_PENDING,
      moderation: {
        stage: scheduled ? 'waiting_schedule' : 'ai_review',
        submittedAt: Date.now(),
        nextReviewAt: scheduled ? scheduleAt : Date.now() + 15000,
        reason: '',
        history: [{ status: scheduled ? CREATION_STATUS.SCHEDULED : CREATION_STATUS.REVIEW_PENDING, at: Date.now() }]
      },
      licenseVersionId,
      anchorId: '',
      channelRecordId: '',
      timelineRecordId: '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    Object.assign(record, createProducts(record))
    saveList(RECORD_KEY, [record, ...readList(RECORD_KEY)])
    pushNotice(record, scheduled ? '已创建定时发布' : '内容已提交审核', scheduled ? '到达设定时间后，将在下次打开应用时重新执行审核。' : '审核中的内容暂仅自己可见。')
    this.removeDraft(draft.id)
    return record
    } finally {
      activeSubmissions.delete(submissionKey)
    }
  },
  cancelScheduled(id) {
    const records = this.listRecords()
    const record = records.find(item => item.id === id)
    if (!record || record.status !== CREATION_STATUS.SCHEDULED) throw new Error('该记录当前不能取消')
    record.status = CREATION_STATUS.CANCELLED
    record.updatedAt = Date.now()
    record.moderation.history.push({ status: CREATION_STATUS.CANCELLED, at: Date.now() })
    saveList(RECORD_KEY, records)
    pushNotice(record, '定时发布已取消', '内容仍保留在创作记录中。')
    return record
  },
  processDue(now = Date.now()) {
    const records = this.listRecords()
    const changed = []
    records.forEach(record => {
      if (record.status === CREATION_STATUS.SCHEDULED && Number(record.moderation.nextReviewAt) <= now) {
        record.status = CREATION_STATUS.REVIEW_PENDING
        record.moderation.stage = 'ai_review'
        record.moderation.nextReviewAt = now + 15000
        record.moderation.history.push({ status: CREATION_STATUS.REVIEW_PENDING, at: now })
        changed.push(record)
      } else if (record.status === CREATION_STATUS.REVIEW_PENDING && Number(record.moderation.nextReviewAt) <= now) {
        record.status = CREATION_STATUS.PUBLISHED
        record.moderation.stage = 'approved'
        record.moderation.history.push({ status: CREATION_STATUS.APPROVED, at: now }, { status: CREATION_STATUS.PUBLISHED, at: now })
        record.publishedAt = now
        record.updatedAt = now
        changed.push(record)
      }
    })
    if (changed.length) {
      saveList(RECORD_KEY, records)
      const anchors = readList(ANCHOR_KEY).map(anchor => {
        const record = changed.find(item => item.anchorId === anchor.id)
        return record ? { ...anchor, reviewStatus: record.status, authorOnly: record.status !== CREATION_STATUS.PUBLISHED, anchorKind: record.mode === 'beacon' && record.status !== CREATION_STATUS.PUBLISHED ? 'candidate' : 'normal' } : anchor
      })
      saveList(ANCHOR_KEY, anchors)
      const changedById = new Map(changed.map(record => [record.id, record]))
      saveList(CHANNEL_KEY, readList(CHANNEL_KEY).map(item => {
        const record = changedById.get(item.recordId)
        return record ? { ...item, status: record.status, updatedAt: now } : item
      }))
      saveList(TIMELINE_KEY, readList(TIMELINE_KEY).map(item => {
        const record = changedById.get(item.recordId)
        return record ? { ...item, status: record.status, updatedAt: now } : item
      }))
      changed.forEach(record => pushNotice(record, record.status === CREATION_STATUS.PUBLISHED ? '内容审核通过' : '定时内容已进入审核', record.status === CREATION_STATUS.PUBLISHED ? '内容已进入对应地图、频道和个人时间轴。' : '审核中的内容暂仅自己可见。'))
    }
    return changed
  },
  getMapItems() {
    return readList(ANCHOR_KEY)
  },
  getNotifications() {
    return readList(NOTICE_KEY)
  },
  getTimelineRecords() {
    return readList(TIMELINE_KEY)
  },
  saveTestShare(draft, recipients) {
    const share = { id: `sandbox_share_${Date.now()}`, draftSnapshot: clone(draft), recipients: clone(recipients), visibility: 'invited_only', nonPublic: true, createdAt: Date.now() }
    saveList(TEST_SHARE_KEY, [share, ...readList(TEST_SHARE_KEY)])
    return share
  }
}

export const moderationApi = {
  processDue: now => creationApi.processDue(now),
  reject(recordId, reason = '内容信息需要补充') {
    const records = creationApi.listRecords()
    const record = records.find(item => item.id === recordId)
    if (!record) throw new Error('发布记录不存在')
    record.status = CREATION_STATUS.REJECTED
    record.moderation.stage = 'rejected'
    record.moderation.reason = reason
    record.moderation.history.push({ status: CREATION_STATUS.REJECTED, reason, at: Date.now() })
    saveList(RECORD_KEY, records)
    pushNotice(record, '内容审核未通过', `${reason}。你可以修改后重新提交。`)
    return record
  },
  appeal(recordId, content) {
    const records = creationApi.listRecords()
    const record = records.find(item => item.id === recordId)
    if (!record || record.status !== CREATION_STATUS.REJECTED) throw new Error('当前记录不能申诉')
    record.moderation.appeal = { content: String(content || '').trim(), status: 'pending', createdAt: Date.now() }
    record.updatedAt = Date.now()
    saveList(RECORD_KEY, records)
    return record
  }
}

export const sandboxApi = {
  saveDraft: draft => creationApi.saveDraft({ ...draft, mode: 'sandbox' }),
  listScheduled: () => creationApi.listRecords().filter(item => item.mode === 'sandbox' && item.status === CREATION_STATUS.SCHEDULED),
  cancelSchedule: id => creationApi.cancelScheduled(id),
  shareForTest: (draft, recipients) => creationApi.saveTestShare(draft, recipients)
}

export default creationApi

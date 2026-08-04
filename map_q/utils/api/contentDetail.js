import { getContentImages, getPointCoordinates } from '../contentResolver.js'
import { asArray, readVersioned, writeVersioned } from './storage.js'

const VERSION = 1
const CACHE_KEY = 'CONTENT_DETAIL_CACHE_V1'
export const ACTIVE_DETAIL_KEY = 'CONTENT_DETAIL_ACTIVE_V1'
const SUPPORTED_TYPES = ['normal', 'video', 'article', 'place', 'event', 'service', 'track']

const nowIso = () => new Date().toISOString()
const safeType = type => SUPPORTED_TYPES.includes(type) ? type : 'normal'

function defaultSlots() {
  return ['09:30', '11:00', '14:00', '16:30', '19:30'].map((time, index) => ({
    id: `slot_${index}`,
    date: new Date(Date.now() + (index < 2 ? 0 : 86400000)).toISOString().slice(0, 10),
    time,
    available: index !== 1
  }))
}

export function normalizeContentDetail(input = {}, requestedType = '') {
  const type = safeType(requestedType || input.type)
  const id = String(input.id || input._id || `${type}_preview`)
  const coordinates = getPointCoordinates(input)
  const title = input.title || input.name || {
    normal: '城市里的今日灵感',
    video: '城市漫步影像',
    article: '一份值得收藏的城市探索指南',
    place: '红星国际',
    event: '周末城市摄影漫步',
    service: '城市旅拍服务',
    track: '城市夜景摄影路线'
  }[type]
  const description = input.description || input.summary || `关于“${title}”的完整介绍与实用信息。`
  const authorName = input.author?.name || input.author || input.provider?.name || '用户495'
  const images = getContentImages(input)
  const base = {
    id,
    _id: id,
    type,
    title,
    name: title,
    description,
    summary: input.summary || description,
    createdAt: input.createdAt || nowIso(),
    author: {
      id: input.author?.id || input.authorId || `author_${id}`,
      name: authorName,
      avatar: input.author?.avatar || input.avatar || '/static/logo.png',
      verified: Boolean(input.author?.verified || input.verified)
    },
    media: asArray(input.media).length
      ? input.media
      : images.map((url, index) => ({ id: `${id}_media_${index}`, type: type === 'video' && index === 0 ? 'video' : 'image', url })),
    images,
    location: coordinates ? {
      name: input.locationName || input.poiName || input.address || title,
      address: input.address || input.detailAddress || '四川省成都市锦江区',
      latitude: Number(coordinates[1]),
      longitude: Number(coordinates[0]),
      distanceText: input.distanceText || input.distance || '地图范围内'
    } : null,
    channel: input.channel || { id: `channel_${type}`, name: type === 'service' ? '成都生活服务' : '城市灵感频道' },
    interactionStats: {
      likes: Number(input.likes || 0),
      comments: Number(input.commentCount || 0),
      collects: Number(input.collectCount || 0),
      views: Number(input.views || input.reads || input.plays || 0)
    },
    copyright: input.copyright || {
      kind: input.original === false ? 'repost' : 'original',
      sourceName: input.original === false ? (input.sourceName || '授权来源') : '',
      statement: input.original === false ? '已获来源授权，转载需注明出处' : '原创内容，未经许可请勿转载'
    },
    tags: asArray(input.tags).length ? input.tags : ['成都', '城市探索']
  }

  if (type === 'video') {
    base.video = {
      url: input.videoUrl || input.url || '',
      poster: input.cover || images[0],
      duration: Number(input.duration || 125)
    }
    Object.assign(base, { videoUrl: base.video.url, cover: base.video.poster, duration: base.video.duration, plays: base.interactionStats.views })
  }
  if (type === 'article') {
    const paragraphs = asArray(input.paragraphs).length ? input.paragraphs : [description, '从路线、时间和现场体验三个维度整理出发前需要了解的信息。', '建议收藏后按目录逐段阅读，并结合地图定位使用。']
    base.article = {
      abstract: input.summary || description,
      paragraphs,
      toc: paragraphs.map((text, index) => ({ id: `section_${index}`, title: index === 0 ? '概览' : `第 ${index + 1} 节` })),
      readCount: Number(input.reads || 1283)
    }
    Object.assign(base, { content: base.article.paragraphs.join('\n\n'), summary: base.article.abstract, reads: base.article.readCount })
  }
  if (type === 'place') {
    base.place = {
      openingStatus: input.openingStatus || '营业中',
      openingHours: input.openingHours || '09:00–21:00',
      phone: input.phone || '028-88886666',
      wiki: input.wiki || description,
      correctionStatus: input.correctionStatus || ''
    }
    Object.assign(base, { openingStatus: base.place.openingStatus, openingHours: base.place.openingHours, phone: base.place.phone, wiki: base.place.wiki, rating: Number(input.rating || 4.8), address: base.location?.address || '' })
  }
  if (type === 'event') {
    base.event = {
      startTime: input.startTime || new Date(Date.now() + 86400000).toISOString(),
      endTime: input.endTime || new Date(Date.now() + 90000000).toISOString(),
      registrationDeadline: input.registrationDeadline || new Date(Date.now() + 72000000).toISOString(),
      participantCount: Number(input.participants || 12),
      capacity: Number(input.maxParticipants || input.capacity || 30),
      fee: Number(input.fee || 0),
      rules: input.rules || '请准时到达；活动开始前 24 小时可免费取消。'
    }
    Object.assign(base, { startTime: base.event.startTime, endTime: base.event.endTime, registrationDeadline: base.event.registrationDeadline, participants: base.event.participantCount, maxParticipants: base.event.capacity, fee: base.event.fee, rules: base.event.rules, status: new Date(base.event.startTime).getTime() > Date.now() ? 'upcoming' : 'ongoing', address: base.location?.address || '' })
  }
  if (type === 'service') {
    base.service = {
      provider: input.provider || { id: `provider_${id}`, name: authorName, kind: input.providerKind || 'merchant', verified: input.verified !== false },
      verification: input.verification || { status: input.verified === false ? 'unverified' : 'verified', label: input.verified === false ? '身份待认证' : '主体已认证' },
      pricing: input.pricing || { mode: 'fixed', amount: Number(input.price || 88), unit: '次', requiresPayment: Boolean(input.requiresPayment) },
      serviceArea: input.serviceArea || { mode: 'radius', radiusKm: 5, description: '到店或 5km 范围内上门服务' },
      availableSlots: asArray(input.availableSlots).length ? input.availableSlots : defaultSlots(),
      reviews: asArray(input.reviews).length ? input.reviews : [
        { id: 'review_1', authorName: '林女士', rating: 5, content: '沟通清楚，服务过程专业可靠。', createdAt: nowIso(), merchantReply: '' }
      ],
      policies: input.policies || {
        cancellation: '开始前 24 小时可免费取消',
        reschedule: '开始前 12 小时可免费改期一次',
        refund: '符合取消规则的订单原路退回',
        privacy: '联系方式仅用于本次服务履约'
      }
    }
    Object.assign(base, { provider: base.service.provider, verification: base.service.verification, pricing: base.service.pricing, price: base.service.pricing.amount, serviceArea: base.service.serviceArea, availableSlots: base.service.availableSlots, reviews: base.service.reviews, policies: base.service.policies, address: base.location?.address || '' })
  }
  if (type === 'track') {
    const line = input.location?.type === 'LineString' ? asArray(input.location.coordinates) : []
    base.track = {
      distanceKm: Number(input.distance || 8.6),
      durationMinutes: Number.parseInt(input.duration, 10) || 52,
      difficulty: input.difficulty || '轻松',
      elevationGain: Number(input.elevationGain || 86),
      coordinates: line,
      nodes: asArray(input.highEnergyPoints).map((node, index) => ({
        id: `node_${index}`,
        name: node.label || `节点 ${index + 1}`,
        coordinate: node.coordinate,
        note: node.note || '路线关键节点'
      }))
    }
    Object.assign(base, { distance: base.track.distanceKm, duration: `${base.track.durationMinutes}分钟`, difficulty: base.track.difficulty, elevationGain: base.track.elevationGain, highEnergyPoints: base.track.nodes.map(node => ({ coordinate: node.coordinate, label: node.name, note: node.note })), location: { type: 'LineString', coordinates: base.track.coordinates } })
  }
  return base
}

function findCandidate(id, type) {
  const active = uni.getStorageSync(ACTIVE_DETAIL_KEY)
  const candidates = [
    active,
    uni.getStorageSync(type === 'service' ? 'SERVICE_LAST_ITEM' : 'INDEX_LAST_ITEM'),
    uni.getStorageSync('BOOKING_ITEM')
  ].filter(Boolean)
  return candidates.find(item => String(item.id || item._id || '') === String(id)) || candidates[0] || {}
}

export const contentDetailApi = {
  async fetchById(id, type, options = {}) {
    const cache = readVersioned(CACHE_KEY, VERSION, {})
    const cacheKey = `${safeType(type)}:${id}`
    const cached = cache[cacheKey]
    if (cached && !options.force && Date.now() - cached.cachedAt < 10 * 60 * 1000) return cached.detail
    const detail = normalizeContentDetail(findCandidate(id, type), type)
    detail.id = String(id || detail.id)
    detail._id = detail.id
    cache[cacheKey] = { detail, cachedAt: Date.now() }
    writeVersioned(CACHE_KEY, VERSION, cache)
    uni.setStorageSync(ACTIVE_DETAIL_KEY, detail)
    return detail
  },
  getActive() {
    const value = uni.getStorageSync(ACTIVE_DETAIL_KEY)
    return value ? normalizeContentDetail(value, value.type) : null
  },
  clearActive() {
    uni.removeStorageSync(ACTIVE_DETAIL_KEY)
  }
}

export default contentDetailApi

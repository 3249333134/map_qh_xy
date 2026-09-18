export const SERVICE_CATEGORIES = Object.freeze({
  TICKET: 'ticket',
  FOOD: 'food',
  LEISURE: 'leisure',
  BEAUTY: 'beauty',
  FITNESS: 'fitness',
  VISIT: 'visit'
})

export const SERVICE_CATEGORY_LIST = Object.freeze([
  { id: SERVICE_CATEGORIES.TICKET, name: '演出票务', shortName: '票务', mark: '票', tone: '#d9574f' },
  { id: SERVICE_CATEGORIES.FOOD, name: '餐饮美食', shortName: '餐饮', mark: '餐', tone: '#0f9f92' },
  { id: SERVICE_CATEGORIES.LEISURE, name: '休闲门店', shortName: '休闲', mark: '玩', tone: '#6b74c9' },
  { id: SERVICE_CATEGORIES.BEAUTY, name: '丽人服务', shortName: '丽人', mark: '丽', tone: '#c85c82' },
  { id: SERVICE_CATEGORIES.FITNESS, name: '健身运动', shortName: '健身', mark: '健', tone: '#3f7ea8' },
  { id: SERVICE_CATEGORIES.VISIT, name: '探店预约', shortName: '探店', mark: '探', tone: '#9a7437' }
])

const CATEGORY_ALIASES = {
  ticket: SERVICE_CATEGORIES.TICKET, event: SERVICE_CATEGORIES.TICKET, '票务': SERVICE_CATEGORIES.TICKET, '演出': SERVICE_CATEGORIES.TICKET,
  food: SERVICE_CATEGORIES.FOOD, cateen: SERVICE_CATEGORIES.FOOD, restaurant: SERVICE_CATEGORIES.FOOD, '餐饮': SERVICE_CATEGORIES.FOOD, '火锅': SERVICE_CATEGORIES.FOOD, '咖啡': SERVICE_CATEGORIES.FOOD,
  leisure: SERVICE_CATEGORIES.LEISURE, game: SERVICE_CATEGORIES.LEISURE, '休闲': SERVICE_CATEGORIES.LEISURE, '密室': SERVICE_CATEGORIES.LEISURE, '娱乐': SERVICE_CATEGORIES.LEISURE,
  beauty: SERVICE_CATEGORIES.BEAUTY, '丽人': SERVICE_CATEGORIES.BEAUTY, '美容': SERVICE_CATEGORIES.BEAUTY, '美甲': SERVICE_CATEGORIES.BEAUTY,
  fitness: SERVICE_CATEGORIES.FITNESS, '健身': SERVICE_CATEGORIES.FITNESS, '瑜伽': SERVICE_CATEGORIES.FITNESS,
  visit: SERVICE_CATEGORIES.VISIT, explore: SERVICE_CATEGORIES.VISIT, '探店': SERVICE_CATEGORIES.VISIT, '预约': SERVICE_CATEGORIES.VISIT
}

export const SERVICE_CATEGORY_CONFIG = Object.freeze({
  ticket: {
    title: '选择场次与票档', parameterLabels: ['场次', '票档'], unit: '张', action: '立即购票', orderKind: 'ticket',
    specifications: ['看台票', '内场票', 'VIP票'], highlights: ['实名入场', '电子票', '开场前停止检票']
  },
  food: {
    title: '选择桌位与用餐时长', parameterLabels: ['人数', '用餐时长'], unit: '位', action: '预约到店', orderKind: 'service',
    specifications: ['双人套餐', '四人套餐', '多人聚餐'], highlights: ['排队状态实时更新', '支持到店核销', '过敏原可备注']
  },
  leisure: {
    title: '选择项目与场次', parameterLabels: ['参与人数', '项目时长'], unit: '人', action: '锁定场次', orderKind: 'service',
    specifications: ['标准场', '包间场', '主题场'], highlights: ['提前 15 分钟到店', '包间人数有限制', '迟到可能缩短体验']
  },
  beauty: {
    title: '选择项目与技师', parameterLabels: ['服务人数', '预计耗时'], unit: '人', action: '预约技师', orderKind: 'service',
    specifications: ['基础护理', '进阶护理', '指定技师'], highlights: ['到店前确认皮肤状态', '一次性用品', '支持指定技师']
  },
  fitness: {
    title: '选择课程与教练', parameterLabels: ['上课人数', '课程时长'], unit: '人', action: '预约课程', orderKind: 'service',
    specifications: ['单次体验', '小班课程', '私教课程'], highlights: ['需穿运动装备', '器械消毒', '健康状况请提前告知']
  },
  visit: {
    title: '选择探店时段', parameterLabels: ['同行人数', '拍摄时长'], unit: '人', action: '预约探店', orderKind: 'service',
    specifications: ['自由探店', '主题任务', '商家共创'], highlights: ['遵守拍摄区域', '内容任务到店查看', '公开发布需经本人确认']
  }
})

export function normalizeServiceCategory(value, fallback = SERVICE_CATEGORIES.FOOD) {
  const raw = String(value || '').trim().toLowerCase()
  if (CATEGORY_ALIASES[raw]) return CATEGORY_ALIASES[raw]
  const alias = Object.keys(CATEGORY_ALIASES).find(key => raw.includes(key))
  return alias ? CATEGORY_ALIASES[alias] : fallback
}

const addDays = days => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10)

export function normalizeService(input = {}, requestedCategory = '') {
  const category = normalizeServiceCategory(requestedCategory || input.serviceCategory || input.category || input.type)
  const categoryMeta = SERVICE_CATEGORY_LIST.find(item => item.id === category)
  const config = SERVICE_CATEGORY_CONFIG[category]
  const id = String(input.id || input._id || `${category}_preview`)
  const amount = Number(input.pricing?.amount ?? input.price ?? (category === 'ticket' ? 120 : 88))
  const location = input.location?.coordinates
    ? input.location
    : { type: 'Point', coordinates: [104.0668, 30.5725] }
  const slots = Array.isArray(input.availableSlots) && input.availableSlots.length
    ? input.availableSlots
    : ['10:00', '14:00', '16:30', '19:30'].map((time, index) => ({ id: `${id}_slot_${index}`, date: addDays(index > 1 ? 1 : 0), time, available: index !== 2 }))
  const packages = Array.isArray(input.packages) && input.packages.length
    ? input.packages
    : config.specifications.map((name, index) => ({ id: `${id}_pkg_${index}`, name, description: config.highlights[index] || '到店后按所选规格提供服务', price: amount + index * Math.max(20, Math.round(amount * 0.35)) }))
  return {
    ...input,
    id, _id: id, type: category === 'ticket' ? 'event' : 'service', serviceCategory: category,
    categoryName: categoryMeta.name, categoryMark: categoryMeta.mark, categoryTone: categoryMeta.tone,
    title: input.title || input.name || `${categoryMeta.name}精选`, name: input.name || input.title || `${categoryMeta.name}精选`,
    description: input.description || `提供清晰的${categoryMeta.name}信息、预约时段与到店核销服务。`,
    address: input.address || input.location?.address || '成都市锦江区春熙路 88 号',
    rating: Number(input.rating || 4.8), distance: Number(input.distance || 1.6), openingHours: input.openingHours || '10:00–22:00',
    location, packages, availableSlots: slots,
    bookingConfig: { minQuantity: 1, maxQuantity: category === 'ticket' ? 6 : 10, durationOptions: category === 'ticket' ? [1] : [1, 2, 3], ...(input.bookingConfig || {}) },
    venue: input.venue || { name: input.venueName || input.address || '春熙路城市空间', entryNote: category === 'ticket' ? '请携带有效身份证件入场' : '到店后出示订单核销码' },
    provider: input.provider || { id: `provider_${id}`, name: input.author?.name || input.author || 'Map Q 认证商户', kind: 'merchant', verified: true },
    verification: input.verification || { status: 'verified', label: '主体已认证' },
    pricing: { mode: 'fixed', amount, unit: category === 'ticket' ? '张' : '次', requiresPayment: input.requiresPayment !== false, ...(input.pricing || {}) },
    policies: input.policies || { cancellation: '预约开始前 24 小时可免费取消', reschedule: '开始前 12 小时可改期一次', refund: '符合取消规则时原路退回', privacy: '联系方式仅用于本次履约' },
    media: Array.isArray(input.media) ? input.media : [],
    highlights: Array.isArray(input.highlights) && input.highlights.length ? input.highlights : config.highlights
  }
}

export function calculateSelectionTotal(service, selection = {}) {
  const normalized = normalizeService(service, service?.serviceCategory)
  const selected = normalized.packages.find(item => item.id === selection.packageId) || normalized.packages[0]
  const quantity = Math.min(normalized.bookingConfig.maxQuantity, Math.max(normalized.bookingConfig.minQuantity, Number(selection.quantity || 1)))
  return Number(selected.price || normalized.pricing.amount) * quantity
}

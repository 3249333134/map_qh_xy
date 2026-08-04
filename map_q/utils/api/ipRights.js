import { readVersioned, writeVersioned } from './storage.js'

const VERSION = 1
const PROFILE_KEY = 'IP_PROFILES_V1'
const LICENSE_KEY = 'IP_LICENSE_VERSIONS_V1'
const ORDER_KEY = 'IP_LICENSE_ORDERS_V1'

const defaultProfiles = [
  { id: 'ip_monster', name: '治愈系小怪兽', verified: true, verificationLabel: '权属已认证', series: ['日常篇', '冒险篇', '限定篇'] },
  { id: 'ip_observer', name: '城市观察员', verified: false, verificationLabel: '权属认证中', series: ['城市记录'] }
]

export const defaultLicenseRule = () => ({
  repostAllowed: false,
  commercialAllowed: false,
  derivativeAllowed: false,
  attributionRequired: true,
  validFrom: new Date().toISOString().slice(0, 10),
  validUntil: '',
  territory: '中国大陆',
  platformScope: '足迹平台内',
  note: ''
})

export function validateLicenseRule(rule = {}) {
  const errors = {}
  if (rule.commercialAllowed && !rule.repostAllowed) errors.commercialAllowed = '允许商用时必须同时允许转载或分发'
  if (rule.derivativeAllowed && !rule.repostAllowed) errors.derivativeAllowed = '允许二创时必须同时允许转载'
  if (rule.validUntil && rule.validFrom && new Date(rule.validUntil) < new Date(rule.validFrom)) errors.validUntil = '授权结束日期不能早于开始日期'
  if (!rule.territory) errors.territory = '请选择授权地域'
  if (!rule.platformScope) errors.platformScope = '请选择授权平台范围'
  return errors
}

export const ipRightsApi = {
  listProfiles() {
    const list = readVersioned(PROFILE_KEY, VERSION, null)
    if (list) return list
    writeVersioned(PROFILE_KEY, VERSION, defaultProfiles)
    return defaultProfiles
  },
  getProfile(id) {
    return this.listProfiles().find(item => item.id === id) || null
  },
  createLicenseVersion(rule, contentId = '') {
    const errors = validateLicenseRule(rule)
    if (Object.keys(errors).length) throw new Error(Object.values(errors)[0])
    const list = readVersioned(LICENSE_KEY, VERSION, [])
    const version = {
      id: `license_${Date.now()}`,
      version: list.length + 1,
      contentId,
      ruleSnapshot: JSON.parse(JSON.stringify(rule)),
      summary: this.buildSummary(rule),
      createdAt: Date.now(),
      immutable: true
    }
    writeVersioned(LICENSE_KEY, VERSION, [version, ...list])
    return version
  },
  listLicenseVersions() {
    return readVersioned(LICENSE_KEY, VERSION, [])
  },
  buildSummary(rule = {}) {
    const abilities = [
      rule.repostAllowed ? '允许转载' : '禁止转载',
      rule.commercialAllowed ? '允许商用' : '禁止商用',
      rule.derivativeAllowed ? '允许二创' : '禁止二创',
      rule.attributionRequired ? '必须署名' : '无需署名'
    ]
    const deadline = rule.validUntil ? `，有效期至 ${rule.validUntil}` : '，长期有效'
    return `${abilities.join(' · ')}；${rule.territory || '未限定地域'}；${rule.platformScope || '未限定平台'}${deadline}`
  },
  createOrder(contentId, licenseVersionId) {
    const version = this.listLicenseVersions().find(item => item.id === licenseVersionId)
    if (!version) throw new Error('授权版本不存在')
    const orders = readVersioned(ORDER_KEY, VERSION, [])
    const order = { id: `ip_order_${Date.now()}`, contentId, licenseVersionId, licenseSnapshot: JSON.parse(JSON.stringify(version)), createdAt: Date.now() }
    writeVersioned(ORDER_KEY, VERSION, [order, ...orders])
    return order
  }
}

export default ipRightsApi


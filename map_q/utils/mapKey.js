import { APP_CONFIG } from './config.js'

let cachedKey = null

export const getQqMapKey = () => {
  if (cachedKey) return cachedKey
  try {
    const app = typeof getApp === 'function' ? getApp() : null
    const envKey =
      (app && app.globalData && app.globalData.QQ_MAP_KEY) ||
      uni.getStorageSync('QQ_MAP_KEY') ||
      (typeof process !== 'undefined' && process.env && process.env.QQ_MAP_KEY) ||
      ''
    const key = envKey || APP_CONFIG.TENCENT_MAP.KEY
    cachedKey = key
    return key
  } catch (e) {
    return APP_CONFIG.TENCENT_MAP.KEY
  }
}

export const clearMapKeyCache = () => {
  cachedKey = null
}

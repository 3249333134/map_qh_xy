import { APP_CONFIG } from './config.js'
import { logError, logWarn } from './logger.js'

const DEFAULT_TIMEOUT = 10000

const request = (options) => {
  const {
    url,
    method = 'GET',
    data = {},
    header = {},
    timeout = DEFAULT_TIMEOUT,
    showLoading = false,
    loadingText = '加载中...'
  } = options

  if (showLoading) {
    uni.showLoading({ title: loadingText, mask: true })
  }

  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        ...header
      },
      timeout,
      success: (res) => {
        if (showLoading) {
          uni.hideLoading()
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res)
        } else {
          const err = new Error(`HTTP ${res.statusCode}`)
          err.statusCode = res.statusCode
          err.data = res.data
          logError(err, 'API请求失败')
          reject(err)
        }
      },
      fail: (err) => {
        if (showLoading) {
          uni.hideLoading()
        }
        logError(err, '网络请求失败')
        reject(err)
      }
    })
  })
}

export const http = {
  get: (url, data, options = {}) => request({ url, method: 'GET', data, ...options }),
  post: (url, data, options = {}) => request({ url, method: 'POST', data, ...options }),
  put: (url, data, options = {}) => request({ url, method: 'PUT', data, ...options }),
  delete: (url, data, options = {}) => request({ url, method: 'DELETE', data, ...options })
}

export const buildUrl = (endpoint) => {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint
  }
  return `${APP_CONFIG.API.BASE_URL}${endpoint}`
}

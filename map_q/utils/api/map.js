import { http, buildUrl } from '../request.js'
import { logError } from '../logger.js'
import { isMockEnabled } from '../mockMapData.js'

const ENDPOINT = '/api/map-data'

export const mapDataApi = {
  async fetchMapData(params = {}) {
    try {
      const res = await http.get(buildUrl(ENDPOINT), params)
      const responseData = res.data && res.data.data ? res.data.data :
                          (Array.isArray(res.data) ? res.data : [])
      const list = Array.isArray(responseData) ? responseData : []
      const normalized = list.map(item => ({
        ...item,
        _id: item._id || item.id || `id_${Date.now()}_${Math.random()}`,
        name: item.name || item.title || '未命名地点',
        author: item.author || '未知作者'
      }))
      const pagination = (res.data && res.data.pagination) || {}
      return {
        list: normalized,
        pagination,
        total: pagination.total || normalized.length,
        hasMore: params.page ? params.page < (pagination.totalPages || 1) : false
      }
    } catch (error) {
      logError(error, '获取地图数据')
      throw error
    }
  },

  async fetchByBounds(bounds, params = {}) {
    try {
      const res = await http.get(buildUrl(ENDPOINT), {
        ...params,
        bounds: JSON.stringify(bounds)
      })
      const responseData = res.data && res.data.data ? res.data.data :
                          (Array.isArray(res.data) ? res.data : [])
      const list = Array.isArray(responseData) ? responseData : []
      const normalized = list.map(item => ({
        ...item,
        _id: item._id || item.id || `id_${Date.now()}_${Math.random()}`,
        name: item.name || item.title || '未命名地点',
        author: item.author || '未知作者'
      }))
      const pagination = (res.data && res.data.pagination) || {}
      const densityInfo = (res.data && res.data.densityInfo) || {}
      return {
        list: normalized,
        pagination,
        densityInfo,
        totalInBounds: densityInfo.totalInBounds || normalized.length,
        hasMore: params.page ? params.page < (pagination.totalPages || 1) : false
      }
    } catch (error) {
      logError(error, '按边界获取地图数据')
      throw error
    }
  }
}

export default mapDataApi

import { APP_CONFIG } from './config.js'
import { getQqMapKey } from './mapKey.js'

const formatQQAddress = (c) => {
  if (!c) return ''
  return [c.province, c.city, c.district, c.street, c.street_number].filter(Boolean).join('')
}

const formatNominatimAddress = (a) => {
  if (!a) return ''
  return [
    a.province || a.state,
    a.city || a.town || a.village,
    a.county || a.state_district,
    a.road,
    a.residential || a.suburb || a.neighbourhood,
    a.house_number
  ].filter(Boolean).join('')
}

const requestNominatim = (lat, lng) => {
  return new Promise((resolve) => {
    uni.request({
      url: `${APP_CONFIG.NOMINATIM.REVERSE_URL}?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      method: 'GET',
      header: { 'Accept-Language': 'zh-CN' },
      success: (res) => {
        const a = res && res.data && res.data.address
        const txt = formatNominatimAddress(a)
        resolve(txt || (res && res.data && res.data.display_name) || '')
      },
      fail: () => resolve('')
    })
  })
}

export const resolveAddressByCoords = (lat, lng) => {
  const key = getQqMapKey()
  if (key) {
    return new Promise((resolve) => {
      uni.request({
        url: `${APP_CONFIG.TENCENT_MAP.GEOCODER_URL}?location=${lat},${lng}&key=${key}&get_poi=0`,
        method: 'GET',
        success: (res) => {
          const c = res && res.data && res.data.result && res.data.result.address_component
          const addr = res && res.data && res.data.result && res.data.result.address
          const txt = formatQQAddress(c)
          resolve(txt || addr || '')
        },
        fail: () => {
          requestNominatim(lat, lng).then(resolve)
        }
      })
    })
  }
  return requestNominatim(lat, lng)
}

export const fetchPointNameByCoords = async (lat, lng) => {
  const addr = await resolveAddressByCoords(lat, lng)
  return addr || '未知位置'
}

export function getMiniProgramAppId() {
  try {
    if (typeof wx === 'undefined' || typeof wx.getAccountInfoSync !== 'function') return ''
    return String(wx.getAccountInfoSync()?.miniProgram?.appId || '')
  } catch (error) {
    return ''
  }
}

export function isWeChatTouristRuntime() {
  const appId = getMiniProgramAppId()
  let platform = ''
  try {
    if (typeof wx !== 'undefined') {
      platform = String(wx.getDeviceInfo?.().platform || wx.getSystemInfoSync?.().platform || '')
    }
  } catch (error) {}
  return platform === 'devtools' || appId === 'touristappid' || (typeof wx !== 'undefined' && !appId)
}

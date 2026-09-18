export function validChatLocation(location) {
  if (!location) return null
  const latitude = location.type === 'Point' ? location.coordinates?.[1] : location.latitude
  const longitude = location.type === 'Point' ? location.coordinates?.[0] : location.longitude
  if ([latitude, longitude].some(value => value === null || value === undefined || value === '' || !Number.isFinite(Number(value)))) return null
  if (Math.abs(Number(latitude)) > 90 || Math.abs(Number(longitude)) > 180) return null
  return { latitude: Number(latitude), longitude: Number(longitude), name: location.name || location.address || '' }
}

export function resolveMessageMap({ tab, bucket, message, getChannel }) {
  if (tab === 2) return { kind: 'system', title: '系统通知', subtitle: '通知不关联地理位置', location: null }
  const type = message?.type || message?.kind
  if (type === 'direct' || type === 'contact' || (!message && tab === 1)) {
    return { kind: 'direct', title: message?.name || message?.title || '好友私信', subtitle: '聊天双方 · 未共享位置', location: null }
  }
  const channelId = message?.channelId || (type === 'channel' ? String(message.id).replace(/-\d+$/, '') : bucket)
  const channel = getChannel(channelId)
  const location = validChatLocation(message?.location) || validChatLocation(channel?.location)
  // A radius is a declared channel boundary, never a guessed distance around a point.
  const radius = Number(message?.radius ?? channel?.radius ?? channel?.location?.radius)
  return {
    kind: 'channel', channelId,
    title: message?.name || message?.title || channel?.name || '频道区域',
    subtitle: location ? (location.name || '已标注频道位置') : '该频道尚未标注区域',
    location, radius: Number.isFinite(radius) && radius > 0 ? radius : null
  }
}

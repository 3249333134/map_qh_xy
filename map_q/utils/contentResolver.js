export function getItemId(item) {
  return item && (item._id || item.id || '')
}

export function getContentCover(item) {
  const data = item || {}
  const candidates = [
    data.cover,
    data.coverUrl,
    data.coverImage,
    data.poster,
    data.thumbnail,
    data.thumb,
    data.image,
    data.imageUrl,
    data.photo,
    data.picture
  ]

  if (Array.isArray(data.images)) candidates.push(data.images[0])
  if (Array.isArray(data.photos)) candidates.push(data.photos[0])
  if (Array.isArray(data.media)) {
    const first = data.media[0]
    candidates.push(typeof first === 'string' ? first : first && (first.url || first.src))
  }

  const found = candidates.find(value => typeof value === 'string' && value.trim())
  return found || ''
}

export function getContentImages(item, fallback = '/static/logo.png') {
  const data = item || {}
  const result = []
  const push = value => {
    if (typeof value === 'string' && value.trim() && !result.includes(value)) {
      result.push(value)
    }
  }

  if (Array.isArray(data.images)) data.images.forEach(push)
  if (Array.isArray(data.photos)) data.photos.forEach(push)
  if (Array.isArray(data.media)) {
    data.media.forEach(media => push(typeof media === 'string' ? media : media && (media.url || media.src)))
  }
  push(getContentCover(data))

  return result.length ? result : [fallback]
}

export function getPointCoordinates(item) {
  const location = item && item.location
  if (location && location.type === 'Point' && Array.isArray(location.coordinates) && location.coordinates.length >= 2) {
    return location.coordinates
  }
  if (item && Array.isArray(item.coordinates) && item.coordinates.length >= 2) {
    return item.coordinates
  }
  return null
}

export function getLocationText(item, precision = 4) {
  const coords = getPointCoordinates(item)
  if (coords) {
    const [lng, lat] = coords
    if (Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))) {
      return `${Number(lat).toFixed(precision)}, ${Number(lng).toFixed(precision)}`
    }
  }
  return (item && (item.address || item.locationName || item.poiName)) || ''
}

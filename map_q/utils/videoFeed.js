import { TEST_VIDEOS, getTestVideo } from './testMedia.js'
import { mapDataApi } from './api/map.js'
import { isMockEnabled } from './mockMapData.js'

async function requestVideos(params) {
  if (!isMockEnabled()) return mapDataApi.fetchMapData(params)
  return { list: params.page === 1 ? TEST_VIDEOS.map((_, index) => getTestVideo(index)) : [], hasMore: false }
}

export function normalizeVideo(item = {}) {
  const media = Array.isArray(item.media) ? item.media.find(value => value?.type === 'video') : null
  const id = String(item.id || item._id || '')
  const source = [item.videoUrl, item.video?.url, typeof item.video === 'string' ? item.video : '', item.url, item.src, media?.url].find(value => typeof value === 'string' && value.trim() && !/\.(png|jpe?g|webp|gif|svg)(?:[?#]|$)/i.test(value)) || ''
  const loc = item.location || {}
  const coords = loc.type === 'Point' ? loc.coordinates : item.coordinates
  const lat = coords?.[1] ?? loc.latitude
  const lng = coords?.[0] ?? loc.longitude
  const valid = lat !== undefined && lat !== null && lat !== '' && lng !== undefined && lng !== null && lng !== '' && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng)) && Math.abs(Number(lat)) <= 90 && Math.abs(Number(lng)) <= 180
  return { ...item, id, _id: id, type: 'video', title: item.title || item.name || '城市影像', videoUrl: source,
    cover: [item.cover, item.poster, item.video?.poster, media?.poster].find(value => typeof value === 'string' && value && !/static\/logo\.png/i.test(value)) || '',
    author: typeof item.author === 'object' ? item.author : { name: item.author || '创作者', avatar: item.avatar || '' },
    location: valid ? { latitude: Number(lat), longitude: Number(lng), name: loc.name || item.locationName || item.poiName || '', address: loc.address || item.address || '' } : null,
    address: item.address || loc.address || '',
    interactionStats: item.interactionStats || { likes: Number(item.likes || 0), comments: Number(item.commentCount || 0) }
  }
}

export function createVideoFeed(fetchPage = requestVideos) {
  let page = 1, pending = null, hasMore = true
  const seen = new Set()
  return {
    seed(item) { const video = normalizeVideo(item); if (video.id) seen.add(video.id); return video },
    next() {
      if (pending) return pending
      if (!hasMore) return Promise.resolve({ list: [], hasMore })
      pending = (async () => {
      try {
        const result = await fetchPage({ page, pageSize: 20 })
        const list = []
        for (const item of result.list || []) {
          const id = String(item.id || item._id || '')
          if (item.type !== 'video' || !id || seen.has(id)) continue
          seen.add(id); list.push(normalizeVideo(item))
        }
        page += 1
        hasMore = Boolean(result.hasMore)
        return { list, hasMore }
      } finally { pending = null }
      })()
      return pending
    }
  }
}

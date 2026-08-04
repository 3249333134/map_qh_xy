import { creationApi, createCreationDraft, moderationApi } from './creation.js'

const toRadians = value => value * Math.PI / 180
export function distanceMeters(a, b) {
  const earth = 6371000
  const dLat = toRadians(Number(b.latitude) - Number(a.latitude))
  const dLng = toRadians(Number(b.longitude) - Number(a.longitude))
  const lat1 = toRadians(Number(a.latitude))
  const lat2 = toRadians(Number(b.latitude))
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return earth * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
}

const normalizeName = value => String(value || '').toLowerCase().replace(/[\s·\-_/]/g, '')
const similarName = (a, b) => {
  const left = normalizeName(a)
  const right = normalizeName(b)
  return Boolean(left && right && (left === right || left.includes(right) || right.includes(left)))
}

export const beaconApi = {
  createDraftFromCoordinate(latitude, longitude) {
    return createCreationDraft('beacon', {
      location: { precision: 'exact', name: '地图选点', address: '', latitude: Number(latitude), longitude: Number(longitude) }
    })
  },
  checkDuplicates(draft, existing = []) {
    const origin = draft.location || {}
    return existing
      .map(item => {
        const coords = item.location?.coordinates
        if (!Array.isArray(coords) || coords.length < 2) return null
        const distance = distanceMeters(origin, { latitude: coords[1], longitude: coords[0] })
        const sameName = similarName(draft.beacon?.name, item.name || item.title)
        if ((sameName && distance <= 150) || distance <= 50) {
          return { id: item._id || item.id, name: item.name || item.title, distance: Math.round(distance), level: sameName && distance <= 150 ? 'strong' : 'nearby', point: item }
        }
        return null
      })
      .filter(Boolean)
      .sort((a, b) => a.distance - b.distance)
  },
  async submit(draft, existing = []) {
    const duplicateCheck = this.checkDuplicates(draft, existing)
    const value = { ...draft, beacon: { ...draft.beacon, duplicateCheck } }
    return creationApi.submit(value)
  },
  appeal(recordId, content) {
    return moderationApi.appeal(recordId, content)
  }
}

export default beaconApi


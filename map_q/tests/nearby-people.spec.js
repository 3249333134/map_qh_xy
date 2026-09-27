import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { NEARBY_PEOPLE, buildNearbyMarkers, filterNearbyPeople } from '../utils/nearbyPeople.js'

describe('nearby people map', () => {
  const origin = { latitude: 30.6, longitude: 104.1 }
  it('uses local avatar assets and the same identities for cards and markers', () => {
    const markers = buildNearbyMarkers(origin)
    expect(markers).toHaveLength(NEARBY_PEOPLE.length)
    markers.forEach((marker, index) => {
      expect(marker).not.toHaveProperty('callout')
      expect(marker.customData.id).toBe(NEARBY_PEOPLE[index].id)
      expect(marker.iconPath).toContain('/static/nearby/marker-')
      for (const path of [marker.iconPath, marker.customData.avatar, NEARBY_PEOPLE[index].selectedIcon]) {
        expect(existsSync(new URL(`..${path}`, import.meta.url))).toBe(true)
      }
    })
  })
  it('filters both cards and markers without changing marker identities or locations', () => {
    const all = buildNearbyMarkers(origin)
    for (const filter of ['online', 'walk', 'coffee', 'art']) {
      const cards = filterNearbyPeople(filter)
      const markers = buildNearbyMarkers(origin, filter)
      expect(markers.map(marker => marker.customData.id)).toEqual(cards.map(card => card.id))
      for (const marker of markers) expect(marker).toEqual(all.find(item => item.id === marker.id))
    }
  })
  it('highlights the selected avatar without altering its map location', () => {
    const first = buildNearbyMarkers(origin)[0]
    const selected = buildNearbyMarkers(origin, 'all', first.customData.id)[0]
    expect(selected).not.toHaveProperty('callout')
    expect(selected.iconPath).toContain('-selected.png')
    expect(selected.width).toBeGreaterThan(first.width)
    expect(selected.latitude).toBe(first.latitude)
    expect(selected.longitude).toBe(first.longitude)
  })
})

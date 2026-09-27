// Demo people, shared by the native map and the nearby panel.
export const NEARBY_PEOPLE = [
  { id: 'people_0', name: '阿蓝', distance: '300m', tag: '城市漫步', interest: 'walk', online: true, offset: [.0007, -.00055] },
  { id: 'people_1', name: '林野', distance: '1.2km', tag: '周末骑行', interest: 'walk', online: false, offset: [-.0004, .0006] },
  { id: 'people_2', name: '小北', distance: '860m', tag: '一起看展', interest: 'art', online: true, offset: [.00025, .0005] },
  { id: 'people_3', name: '青禾', distance: '1.5km', tag: '咖啡时间', interest: 'coffee', online: false, offset: [-.0007, -.0005] },
  { id: 'people_4', name: '知白', distance: '2.1km', tag: '摄影散步', interest: 'art', online: false, offset: [.0011, .0003] },
  { id: 'people_5', name: '南风', distance: '450m', tag: '寻找搭子', interest: 'walk', online: true, offset: [-.001, .00015] }
].map((person, index) => ({ ...person, markerId: 8000 + index, avatar: `/static/nearby/avatar-${index + 1}.png`, icon: `/static/nearby/marker-${index + 1}.png`, selectedIcon: `/static/nearby/marker-${index + 1}-selected.png` }))

export function filterNearbyPeople(filter = 'all') {
  return NEARBY_PEOPLE.filter(person => filter === 'all' || (filter === 'online' ? person.online : person.interest === filter))
}
export function buildNearbyMarkers(origin, filter = 'all', selectedId = '') {
  return filterNearbyPeople(filter).map(person => ({
    id: person.markerId,
    latitude: Number(origin.latitude) + person.offset[0],
    longitude: Number(origin.longitude) + person.offset[1],
    width: person.id === selectedId ? 64 : 52,
    height: person.id === selectedId ? 68 : 55,
    anchor: { x: .5, y: .5 },
    iconPath: person.id === selectedId ? person.selectedIcon : person.icon,
    customData: { kind: 'people', id: person.id, title: person.name, subtitle: `${person.distance} · ${person.tag}`, avatar: person.avatar, online: person.online, tag: person.tag },
  }))
}

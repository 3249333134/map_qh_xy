import { beforeEach, describe, expect, it } from 'vitest'
import { favoriteApi, socialStore, socialViewStateApi } from '../utils/api/social.js'
import {
  FOOTPRINT_TYPES,
  createMyEntryState,
  createFootprintViewModels,
  groupTimelineRecords,
  isMinimumSheetPosition,
  normalizeContentType
} from '../pages/my/composables/useMyData.js'

describe('我的足迹统一视图', () => {
  beforeEach(() => socialStore.resetForTest())

  it('统一映射九类筛选类型', () => {
    expect(FOOTPRINT_TYPES.map((item) => item.key)).toEqual([
      'all', 'photo', 'video', 'article', 'music', 'place', 'service', 'event', 'route'
    ])
    expect(normalizeContentType({ detailType: 'normal' }, 'photos')).toBe('photo')
    expect(normalizeContentType({ detailType: 'track' })).toBe('route')
    expect(normalizeContentType({ layer: 'service' })).toBe('service')
  })

  it('关联收藏状态并只为合法坐标建立地图记录', () => {
    const entries = createFootprintViewModels([
      { id: 'fp-1', sourceId: '1', title: '有坐标', contentType: 'place', createdAt: 1, hasLocation: true, latitude: 30.6, longitude: 104.1 },
      { id: 'fp-2', sourceId: '2', title: '无坐标', contentType: 'article', createdAt: 2, hasLocation: false }
    ], [
      { id: 'fav-1', objectId: '1', folderId: 'default' }
    ])

    expect(entries[0]).toMatchObject({ favoriteId: 'fav-1', isFavorite: true, folderId: 'default' })
    expect(entries[1]).toMatchObject({ isFavorite: false, hasLocation: false })
    expect(entries.filter((item) => item.hasLocation).map((item) => item.footprintId)).toEqual(['fp-1'])
  })

  it('日期组倒序、组内时间升序', () => {
    const records = [
      { sourceId: 'late', createdAt: Date.parse('2026-08-08 18:00') },
      { sourceId: 'early', createdAt: Date.parse('2026-08-08 09:00') },
      { sourceId: 'new-day', createdAt: Date.parse('2026-08-09 12:00') }
    ]
    const groups = groupTimelineRecords(records)
    expect(groups.map((group) => group.date)).toEqual(['2026-08-09', '2026-08-08'])
    expect(groups[1].items.map((item) => item.sourceId)).toEqual(['early', 'late'])
  })

  it('支持收藏批量移动、取消与撤销', () => {
    favoriteApi.seed([
      { id: 'fav-1', objectId: '1', folderId: 'default' },
      { id: 'fav-2', objectId: '2', folderId: 'default' }
    ])
    const folder = favoriteApi.createFolder('旅行')
    expect(favoriteApi.moveMany(['fav-1', 'fav-2'], folder.id)).toHaveLength(2)
    expect(favoriteApi.list().every((item) => item.folderId === folder.id)).toBe(true)

    const removed = favoriteApi.removeMany(['fav-1'])
    expect(removed.map((item) => item.id)).toEqual(['fav-1'])
    expect(favoriteApi.list().map((item) => item.id)).toEqual(['fav-2'])

    favoriteApi.restoreMany(removed)
    expect(favoriteApi.list().map((item) => item.id).sort()).toEqual(['fav-1', 'fav-2'])
  })

  it('保存并恢复个人页模式、日期、筛选与面板状态', () => {
    socialViewStateApi.patchFootprint({
      mode: 'date', date: '2026-08-09', category: 'video', panelState: 'expanded',
      selectedPointId: 'fp-1', scrollTop: 128
    })
    expect(socialViewStateApi.getFootprint()).toMatchObject({
      mode: 'date', date: '2026-08-09', category: 'video', panelState: 'expanded',
      selectedPointId: 'fp-1', scrollTop: 128
    })
  })

  it('每次进入我的页都使用固定的收藏瀑布流默认态', () => {
    socialViewStateApi.patchFootprint({
      mode: 'date', category: 'video', panelState: 'expanded', dateLayout: 'list',
      profileCollapsed: false, sheetY: 128
    })
    expect(createMyEntryState(new Date('2026-08-10T09:00:00'))).toEqual({
      mode: 'favorite', category: 'all', panelState: 'default', date: '2026-08-10',
      dateLayout: 'list', profileCollapsed: true, selectedPointId: '', sheetY: null
    })
  })

  it('面板到达最低位置时进入极简切换态', () => {
    expect(isMinimumSheetPosition(580, 580)).toBe(true)
    expect(isMinimumSheetPosition(574, 580)).toBe(true)
    expect(isMinimumSheetPosition(560, 580)).toBe(false)
  })
})

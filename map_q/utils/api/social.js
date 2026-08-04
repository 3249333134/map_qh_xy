const STORAGE_KEY = 'FOOTPRINT_SOCIAL_STATE_V2'
const VERSION = 2
let memoryState = null

const now = () => Date.now()
const clone = (value) => JSON.parse(JSON.stringify(value))

function readStorage() {
  try {
    if (typeof uni !== 'undefined' && uni.getStorageSync) return uni.getStorageSync(STORAGE_KEY)
  } catch (e) {}
  return memoryState
}

function writeStorage(value) {
  memoryState = clone(value)
  try {
    if (typeof uni !== 'undefined' && uni.setStorageSync) uni.setStorageSync(STORAGE_KEY, value)
  } catch (e) {}
  return value
}

function initialState() {
  return {
    version: VERSION,
    conversations: [],
    messages: {},
    notifications: [],
    channels: [
      {
        id: 'city',
        name: '成都街拍兴趣频道',
        description: '分享成都街头影像、路线和附近灵感。',
        scope: 'place',
        location: { latitude: 30.572269, longitude: 104.066541, name: '成都' },
        owner: 'user-owner',
        admins: ['user-admin'],
        members: 642,
        online: 31,
        rules: ['尊重他人', '地点信息需真实', '禁止发布精确私人位置'],
        membershipState: 'joined',
        notificationSetting: 'all',
        archiveState: 'active',
        starred: true,
        blocked: false,
        threads: [
          { id: 'city-general', title: '附近新发现', count: 28 },
          { id: 'city-route', title: '街拍路线', count: 12 }
        ]
      },
      {
        id: 'nearby',
        name: '附近动态',
        description: '当前地图可见区域的公开内容与活动。',
        scope: 'map',
        location: { latitude: 30.572269, longitude: 104.066541, name: '当前位置附近' },
        owner: 'platform',
        admins: ['platform'],
        members: 128,
        online: 16,
        rules: ['默认使用模糊位置', '广播需要审核'],
        membershipState: 'joined',
        notificationSetting: 'important',
        archiveState: 'active',
        starred: false,
        blocked: false,
        threads: [{ id: 'nearby-live', title: '正在发生', count: 9 }]
      }
    ],
    profile: {
      id: 'self',
      avatar: '/static/logo.png',
      username: '用户名',
      description: '这里是用户描述信息',
      verified: false,
      interests: ['城市漫步', '摄影', '展览', '咖啡'],
      following: 128,
      followers: 256,
      privacy: {
        footprintSharePrecision: 'fuzzy',
        favoritesForRecommendation: true,
        publicProfile: true
      }
    },
    footprints: [],
    timeline: [],
    favorites: [],
    favoriteFolders: [{ id: 'default', name: '默认收藏夹', order: 0 }],
    viewState: {
      messageHome: {
        version: 1,
        activeTab: 0,
        selectedBubble: 'nearby',
        railOrder: {},
        scrollOffsets: {},
        searchMode: 'all',
        updatedAt: 0
      },
      footprint: {
        version: 1,
        area: 'all',
        category: 'all',
        expanded: false,
        selectedPointId: '',
        scrollTop: 0,
        mapCenter: null,
        scale: null,
        updatedAt: 0
      }
    },
    importedLegacy: false,
    updatedAt: now()
  }
}

function migrate(raw) {
  if (!raw || typeof raw !== 'object') return initialState()
  const base = initialState()
  if (raw.version === VERSION) {
    return {
      ...base,
      ...raw,
      profile: { ...base.profile, ...(raw.profile || {}), privacy: { ...base.profile.privacy, ...(raw.profile?.privacy || {}) } },
      viewState: {
        messageHome: { ...base.viewState.messageHome, ...(raw.viewState?.messageHome || {}) },
        footprint: { ...base.viewState.footprint, ...(raw.viewState?.footprint || {}) }
      }
    }
  }
  return {
    ...base,
    ...raw,
    version: VERSION,
    profile: { ...base.profile, ...(raw.profile || {}), privacy: { ...base.profile.privacy, ...(raw.profile?.privacy || {}) } },
    viewState: {
      messageHome: { ...base.viewState.messageHome, ...(raw.viewState?.messageHome || {}) },
      footprint: { ...base.viewState.footprint, ...(raw.viewState?.footprint || {}) }
    },
    updatedAt: now()
  }
}

function state() {
  const value = migrate(readStorage())
  if (!readStorage()) writeStorage(value)
  return value
}

function mutate(fn) {
  const value = state()
  const result = fn(value)
  value.updatedAt = now()
  writeStorage(value)
  return result
}

function normalizeLegacyConversation(item, bucketId, order) {
  return {
    id: String(item.id),
    bucketId,
    kind: item.type === 'system_notice' || item.type === 'assistant' ? 'system' : item.type,
    title: item.name,
    avatarColor: item.avatarColor,
    avatarText: item.avatarText,
    lastMessage: item.preview || '',
    unreadCount: Number(item.unread || 0),
    pinned: !!item.pinned,
    starred: !!item.starred,
    muted: !!item.muted,
    draft: item.draft || '',
    deliveryState: item.deliveryState || 'read',
    order,
    updatedAt: item.updatedAt || now() - order * 1000,
    actionBtn: item.actionBtn || ''
  }
}

export const conversationApi = {
  hydrateLegacy(messageData = {}) {
    return mutate((value) => {
      if (value.importedLegacy && value.conversations.length) return value.conversations
      const conversations = []
      Object.keys(messageData).forEach((bucketId) => {
        ;(messageData[bucketId] || []).forEach((item, order) => {
          const normalized = normalizeLegacyConversation(item, bucketId, order)
          if (!conversations.some((entry) => entry.id === normalized.id)) conversations.push(normalized)
        })
      })
      value.conversations = conversations
      value.importedLegacy = true
      return clone(conversations)
    })
  },
  list(bucketId) {
    return clone(state().conversations
      .filter((item) => !bucketId || item.bucketId === bucketId)
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || Number(b.starred) - Number(a.starred) || b.updatedAt - a.updatedAt))
  },
  get(id) {
    return clone(state().conversations.find((item) => item.id === String(id)) || null)
  },
  patch(id, patch) {
    return mutate((value) => {
      const item = value.conversations.find((entry) => entry.id === String(id))
      if (!item) return null
      Object.assign(item, patch, { updatedAt: now() })
      return clone(item)
    })
  },
  setDraft(id, draft) {
    return this.patch(id, { draft: String(draft || '') })
  },
  touch(id) {
    return this.patch(id, { lastAccessedAt: now() })
  },
  createGroup(payload = {}) {
    return mutate((value) => {
      const participants = Array.isArray(payload.participants) ? payload.participants : []
      const item = {
        id: payload.id || `group-${now()}`,
        bucketId: payload.bucketId || 'follow',
        kind: 'group',
        title: String(payload.title || `群聊（${participants.length + 1}）`),
        participants: clone(participants),
        avatarColor: payload.avatarColor || '#3D8BFF',
        avatarText: payload.avatarText || '群',
        lastMessage: '群聊已创建',
        unreadCount: 0,
        pinned: false,
        starred: false,
        muted: false,
        draft: '',
        deliveryState: 'read',
        updatedAt: now(),
        lastAccessedAt: now()
      }
      value.conversations.push(item)
      return clone(item)
    })
  },
  markRead(id, unread = false) {
    return this.patch(id, { unreadCount: unread ? 1 : 0 })
  },
  removeLocal(id) {
    return mutate((value) => {
      const index = value.conversations.findIndex((item) => item.id === String(id))
      if (index < 0) return false
      value.conversations.splice(index, 1)
      return true
    })
  },
  removeLocalWithSnapshot(id) {
    return mutate((value) => {
      const index = value.conversations.findIndex((item) => item.id === String(id))
      if (index < 0) return null
      return clone(value.conversations.splice(index, 1)[0])
    })
  },
  restore(snapshot) {
    if (!snapshot || !snapshot.id) return null
    return mutate((value) => {
      const existing = value.conversations.find((item) => item.id === String(snapshot.id))
      if (existing) return clone(existing)
      value.conversations.push(clone(snapshot))
      return clone(snapshot)
    })
  },
  search(keyword) {
    const q = String(keyword || '').trim().toLowerCase()
    if (!q) return { channels: [], people: [], messages: [], services: [], orders: [], places: [] }
    const items = state().conversations.filter((item) => `${item.title} ${item.lastMessage} ${item.draft}`.toLowerCase().includes(q))
    return {
      channels: clone(items.filter((item) => item.kind === 'channel')),
      people: clone(items.filter((item) => item.kind === 'direct' || item.kind === 'group')),
      messages: clone(items),
      services: clone(items.filter((item) => /服务|预约/.test(item.lastMessage))),
      orders: clone(items.filter((item) => item.kind === 'order' || /订单/.test(item.lastMessage))),
      places: clone(items.filter((item) => /位置|地点|附近/.test(item.lastMessage)))
    }
  },
  unreadOverview() {
    const result = { channel: 0, direct: 0, system: 0, total: 0 }
    state().conversations.forEach((item) => {
      const count = Number(item.unreadCount || 0)
      if (item.kind === 'channel') result.channel += count
      else if (item.kind === 'system') result.system += count
      else result.direct += count
      result.total += count
    })
    return result
  }
}

export const messageApi = {
  list(conversationId) {
    return clone(state().messages[String(conversationId)] || [])
  },
  seed(conversationId, messages) {
    return mutate((value) => {
      const key = String(conversationId)
      if (!value.messages[key]?.length) value.messages[key] = clone(messages || [])
      return clone(value.messages[key])
    })
  },
  send(conversationId, payload) {
    return mutate((value) => {
      const key = String(conversationId)
      const item = {
        id: `msg-${now()}-${Math.random().toString(36).slice(2, 7)}`,
        conversationId: key,
        sender: 'self',
        type: payload.type || 'text',
        payload: clone(payload),
        replyTo: payload.replyTo || null,
        moderation: 'approved',
        deliveryState: payload.simulateFailure ? 'failed' : 'sent',
        createdAt: now()
      }
      value.messages[key] = value.messages[key] || []
      value.messages[key].push(item)
      const conversation = value.conversations.find((entry) => entry.id === key)
      if (conversation) {
        conversation.lastMessage = payload.text || `[${payload.type || '消息'}]`
        conversation.deliveryState = item.deliveryState
        conversation.updatedAt = now()
      }
      return clone(item)
    })
  },
  retry(conversationId, messageId) {
    return mutate((value) => {
      const item = (value.messages[String(conversationId)] || []).find((entry) => entry.id === String(messageId))
      if (!item || item.deliveryState !== 'failed') return null
      item.deliveryState = 'sent'
      item.retryCount = Number(item.retryCount || 0) + 1
      return clone(item)
    })
  },
  recall(conversationId, messageId, sender = 'self') {
    return mutate((value) => {
      const item = (value.messages[String(conversationId)] || []).find((entry) => entry.id === String(messageId))
      if (!item || item.sender !== sender || now() - item.createdAt > 120000) return false
      item.deliveryState = 'recalled'
      item.payload = { text: '消息已撤回' }
      return true
    })
  }
}

export const notificationApi = {
  seed(items) {
    return mutate((value) => {
      if (!value.notifications.length) value.notifications = clone(items || [])
      return clone(value.notifications)
    })
  },
  list() {
    return clone(state().notifications.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)))
  },
  patch(id, patch) {
    return mutate((value) => {
      const item = value.notifications.find((entry) => entry.id === String(id))
      if (!item) return null
      Object.assign(item, patch)
      return clone(item)
    })
  },
  markAllRead() {
    return mutate((value) => {
      value.notifications.forEach((item) => { item.unread = false })
      return true
    })
  },
  remove(id) {
    return mutate((value) => {
      value.notifications = value.notifications.filter((item) => item.id !== String(id))
      return true
    })
  }
}

export const channelApi = {
  list(filter = 'all') {
    const items = state().channels
    if (filter === 'starred') return clone(items.filter((item) => item.starred))
    if (filter === 'managed') return clone(items.filter((item) => item.owner === 'self' || item.admins.includes('self')))
    if (filter === 'archived') return clone(items.filter((item) => item.archiveState === 'archived'))
    return clone(items)
  },
  get(id) {
    return clone(state().channels.find((item) => item.id === String(id)) || null)
  },
  patch(id, patch) {
    return mutate((value) => {
      const channel = value.channels.find((item) => item.id === String(id))
      if (!channel) return null
      Object.assign(channel, patch)
      return clone(channel)
    })
  },
  create(payload = {}) {
    return mutate((value) => {
      const name = String(payload.name || '新地图频道').trim()
      const idBase = name.toLowerCase().replace(/\s+/g, '-')
      const id = payload.id || `${idBase || 'channel'}-${now()}`
      const channel = {
        id,
        name,
        description: String(payload.description || '分享附近真实、有用的地图内容。'),
        scope: payload.scope || 'interest',
        location: payload.location || { latitude: 30.572269, longitude: 104.066541, name: '成都' },
        owner: 'self',
        admins: ['self'],
        members: 1,
        online: 1,
        rules: Array.isArray(payload.rules) && payload.rules.length
          ? clone(payload.rules)
          : ['尊重他人', '地点信息需真实', '禁止发布精确私人位置'],
        membershipState: 'joined',
        notificationSetting: 'all',
        archiveState: 'active',
        starred: true,
        blocked: false,
        threads: [{ id: `${id}-general`, title: '日常讨论', count: 0 }],
        createdAt: now()
      }
      value.channels.push(channel)
      return clone(channel)
    })
  },
  summary(id) {
    const channel = this.get(id)
    if (!channel) return null
    return {
      id: channel.id,
      name: channel.name,
      description: channel.description,
      scope: channel.scope,
      locationName: channel.location?.name || '',
      members: Number(channel.members || 0),
      active: Number(channel.online || 0),
      muted: channel.notificationSetting === 'none',
      joined: channel.membershipState === 'joined',
      starred: !!channel.starred,
      archiveState: channel.archiveState,
      threads: clone(channel.threads || [])
    }
  },
  recentActivity(id, limit = 3) {
    const channel = this.get(id)
    if (!channel) return []
    return clone((channel.threads || []).slice(0, limit).map((thread, index) => ({
      id: thread.id,
      title: thread.title,
      count: Number(thread.count || 0),
      freshness: index === 0 ? '刚刚更新' : index === 1 ? '今天' : '最近'
    })))
  },
  join(id) { return this.patch(id, { membershipState: 'joined' }) },
  exit(id, userId = 'self') {
    const channel = this.get(id)
    if (!channel || channel.owner === userId) return { ok: false, reason: '所有者需先转让频道' }
    return { ok: !!this.patch(id, { membershipState: 'left' }) }
  },
  canBroadcast(id, role = 'member') {
    const channel = this.get(id)
    return !!channel && channel.archiveState !== 'archived' && ['owner', 'admin'].includes(role)
  },
  archiveExpired(timestamp = now()) {
    return mutate((value) => {
      let count = 0
      value.channels.forEach((channel) => {
        if (channel.endsAt && channel.endsAt <= timestamp && channel.archiveState !== 'archived') {
          channel.archiveState = 'archived'
          count += 1
        }
      })
      return count
    })
  }
}

function collectCreationRecords() {
  const keys = ['CREATION_RECORDS_V1', 'CREATION_RECORDS_V2', 'BOOKING_ORDERS_V1', 'MERCHANT_EVENTS_V1']
  const result = []
  keys.forEach((key) => {
    try {
      const stored = typeof uni !== 'undefined' ? uni.getStorageSync(key) : null
      if (Array.isArray(stored)) result.push(...stored)
      else if (stored && typeof stored === 'object') result.push(...Object.values(stored).filter(Boolean))
    } catch (e) {}
  })
  return result
}

export const profileApi = {
  get() { return clone(state().profile) },
  patch(patch) {
    return mutate((value) => {
      value.profile = { ...value.profile, ...patch, privacy: { ...value.profile.privacy, ...(patch.privacy || {}) } }
      return clone(value.profile)
    })
  },
  stats() {
    const value = state()
    const records = collectCreationRecords()
    return {
      following: value.profile.following,
      followers: value.profile.followers,
      posts: records.filter((item) => item.mode !== 'beacon').length || value.footprints.filter((item) => item.sourceType === 'content').length,
      checkins: value.footprints.filter((item) => item.sourceType === 'checkin').length,
      favorites: value.favorites.length,
      services: records.filter((item) => item.serviceId || item.mode === 'service').length
    }
  }
}

export const footprintApi = {
  seed(entries) {
    return mutate((value) => {
      if (!value.footprints.length) value.footprints = clone(entries || [])
      return clone(value.footprints)
    })
  },
  sync(entries) {
    return mutate((value) => {
      ;(entries || []).forEach((entry) => {
        const index = value.footprints.findIndex((item) => String(item.id) === String(entry.id))
        if (index >= 0) value.footprints.splice(index, 1, clone(entry))
        else value.footprints.push(clone(entry))
      })
      return clone(value.footprints)
    })
  },
  list(filters = {}) {
    return clone(state().footprints.filter((item) => {
      if (filters.city && item.city !== filters.city) return false
      if (filters.layer && filters.layer !== 'all' && item.layer !== filters.layer) return false
      if (filters.visibility && item.visibility !== filters.visibility) return false
      if (filters.start && item.createdAt < filters.start) return false
      if (filters.end && item.createdAt > filters.end) return false
      return !item.deleted
    }))
  },
  cards(filters = {}) {
    return this.list(filters).map((item) => {
      const hasLatitude = item.latitude !== null && item.latitude !== undefined && item.latitude !== ''
      const hasLongitude = item.longitude !== null && item.longitude !== undefined && item.longitude !== ''
      const latitude = hasLatitude ? Number(item.latitude) : null
      const longitude = hasLongitude ? Number(item.longitude) : null
      const hasLocation = hasLatitude && hasLongitude && Number.isFinite(latitude) && Number.isFinite(longitude)
      const snapshot = item.snapshot && typeof item.snapshot === 'object' ? item.snapshot : {}
      const layer = item.layer || item.sourceType || 'content'
      const detailType = item.detailType || (
        layer === 'service' ? 'service'
          : layer === 'place' ? 'place'
            : layer === 'event' ? 'event'
              : layer === 'route' || layer === 'track' ? 'track'
                : snapshot.type || 'normal'
      )
      return {
        id: String(item.id),
        sourceId: String(item.sourceId || item.id),
        sourceType: item.sourceType || layer,
        layer,
        detailType,
        title: item.title || snapshot.title || snapshot.name || '足迹内容',
        author: item.author || snapshot.author || '',
        subtitle: item.subtitle || snapshot.subtitle || snapshot.desc || '',
        cover: item.cover || snapshot.cover || snapshot.thumbnail || '',
        city: item.city || '成都',
        district: item.district || snapshot.district || '未定位',
        address: item.address || snapshot.address || '',
        createdAt: Number(item.createdAt || 0),
        likes: Number(item.likes ?? snapshot.likes ?? 0),
        distance: item.distance || '',
        status: item.status || '',
        latitude: hasLocation ? latitude : null,
        longitude: hasLocation ? longitude : null,
        hasLocation,
        locationPrecision: item.locationPrecision || 'hidden',
        visibility: item.visibility || 'private',
        availableState: item.availableState || 'available',
        snapshot: clone(snapshot)
      }
    })
  },
  shareSnapshot(filters = {}) {
    return this.list(filters)
      .filter((item) => item.visibility === 'public' && item.locationPrecision !== 'hidden' && !item.sensitive && !item.blocked)
      .map((item) => ({
        ...item,
        latitude: Number((Math.round(item.latitude * 2000) / 2000).toFixed(4)),
        longitude: Number((Math.round(item.longitude * 2000) / 2000).toFixed(4)),
        locationPrecision: 'fuzzy'
      }))
  }
}

export const socialViewStateApi = {
  getMessageHome() {
    return clone(state().viewState?.messageHome || initialState().viewState.messageHome)
  },
  patchMessageHome(patch = {}) {
    return mutate((value) => {
      value.viewState = value.viewState || initialState().viewState
      value.viewState.messageHome = {
        ...initialState().viewState.messageHome,
        ...(value.viewState.messageHome || {}),
        ...clone(patch),
        updatedAt: now()
      }
      return clone(value.viewState.messageHome)
    })
  },
  getFootprint() {
    return clone(state().viewState?.footprint || initialState().viewState.footprint)
  },
  patchFootprint(patch = {}) {
    return mutate((value) => {
      value.viewState = value.viewState || initialState().viewState
      value.viewState.footprint = {
        ...initialState().viewState.footprint,
        ...(value.viewState.footprint || {}),
        ...clone(patch),
        updatedAt: now()
      }
      return clone(value.viewState.footprint)
    })
  }
}

export const timelineApi = {
  seed(entries) {
    return mutate((value) => {
      if (!value.timeline.length) value.timeline = clone(entries || [])
      return clone(value.timeline)
    })
  },
  list() { return clone(state().timeline.filter((item) => !item.hidden)) },
  group() {
    return this.list().reduce((groups, item) => {
      const date = new Date(item.createdAt || now())
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      groups[key] = groups[key] || []
      groups[key].push(item)
      return groups
    }, {})
  },
  addMemorial(payload) {
    return mutate((value) => {
      const item = { id: `memorial-${now()}`, type: 'memorial', private: true, createdAt: now(), ...payload }
      value.timeline.push(item)
      return clone(item)
    })
  },
  sourceDeleted(sourceId, keepMemorial = false) {
    return mutate((value) => {
      value.timeline = value.timeline.filter((item) => {
        if (item.sourceId !== sourceId) return true
        if (keepMemorial && item.type === 'memorial') {
          item.sourceDeleted = true
          item.title = `${item.title}（原内容已删除）`
          return true
        }
        return false
      })
      return true
    })
  },
  yearReview(year, sharing = false) {
    return this.list().filter((item) => {
      const matchesYear = new Date(item.createdAt || 0).getFullYear() === Number(year)
      return matchesYear && (!sharing || !item.private)
    })
  }
}

export const favoriteApi = {
  seed(records) {
    return mutate((value) => {
      if (!value.favorites.length) value.favorites = clone(records || [])
      return clone(value.favorites)
    })
  },
  list(type) {
    const items = state().favorites
    return clone(type && type !== 'all' ? items.filter((item) => item.objectType === type) : items)
  },
  folders() { return clone(state().favoriteFolders) },
  createFolder(name) {
    return mutate((value) => {
      const item = { id: `folder-${now()}`, name: String(name || '新收藏夹'), order: value.favoriteFolders.length }
      value.favoriteFolders.push(item)
      return clone(item)
    })
  },
  move(recordId, folderId) {
    return mutate((value) => {
      const item = value.favorites.find((entry) => entry.id === String(recordId))
      if (!item) return null
      item.folderId = folderId
      return clone(item)
    })
  },
  setRecommendationEnabled(enabled) {
    return profileApi.patch({ privacy: { favoritesForRecommendation: !!enabled } })
  }
}

export const socialStore = {
  version: VERSION,
  snapshot: () => clone(state()),
  resetForTest: () => {
    memoryState = initialState()
    return clone(memoryState)
  }
}

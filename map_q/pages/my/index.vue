<template>
  <view class="my-page">
    <view class="map-stage" :class="{ muted: activeMode !== 'location' }">
      <LocationModule
        ref="locationModule"
        :user-locations="mapLocations"
        :is-fully-expanded="panelState === 'default'"
        :selected-point-id="selectedFootprintId"
        @marker-tap="handleMarkerTap"
      />
      <view v-if="activeMode !== 'location'" class="map-wash"></view>
    </view>

    <view class="profile-layer" :class="{ compact: isProfileCompact }" :style="profileStyle">
      <view class="profile-topline">
        <view
          class="profile-identity"
          role="button"
          tabindex="0"
          :aria-label="isProfileCompact ? '展开个人资料' : '收起个人资料'"
          @tap="toggleProfile"
          @keyup.enter="toggleProfile"
        >
          <image class="avatar" :src="userInfo.avatar" mode="aspectFill" aria-label="个人头像" />
          <view class="identity-copy">
            <text class="username">{{ userInfo.username }}</text>
            <text class="description">{{ userInfo.description }}</text>
          </view>
        </view>
        <button class="settings-button" aria-label="打开个人设置" @tap.stop="openSettings">设置</button>
      </view>
      <view class="profile-stats">
        <view v-for="stat in profileStats" :key="stat.label" class="stat-item">
          <text class="stat-number">{{ stat.number }}</text>
          <text class="stat-label">{{ stat.label }}</text>
        </view>
      </view>
    </view>

    <view
      class="footprint-sheet"
      :class="{ dragging: isDragging, expanded: panelState === 'expanded', minimized: isSheetMinimized, 'location-mode': activeMode === 'location' }"
      :style="sheetStyle"
    >
      <view
        class="sheet-grab-region"
        role="button"
        tabindex="0"
        catchtouchmove="true"
        aria-label="拖动足迹面板"
        :aria-expanded="panelState === 'expanded'"
        @tap="togglePanelState"
        @keyup.enter="togglePanelState"
        @touchstart.stop="startSheetDrag"
        @touchmove.stop.prevent="moveSheetDrag"
        @touchend.stop="endSheetDrag"
        @touchcancel.stop="endSheetDrag"
      >
        <view class="drag-handle"></view>
      </view>

      <view class="mode-tabs" role="tablist" aria-label="足迹查看方式">
        <button
          v-for="mode in modes"
          :key="mode.key"
          class="mode-tab"
          role="tab"
          :class="{ active: activeMode === mode.key }"
          :aria-label="mode.label"
          :aria-selected="activeMode === mode.key"
          :tabindex="activeMode === mode.key ? 0 : -1"
          @keydown.left.prevent="focusAdjacentMode($event, -1)"
          @keydown.right.prevent="focusAdjacentMode($event, 1)"
          @tap="switchMode(mode.key)"
        >
          <view class="mode-symbol" :class="`symbol-${mode.key}`" aria-hidden="true"></view>
          <text>{{ mode.label }}</text>
        </button>
      </view>

      <view v-if="!isSheetMinimized" class="sheet-body">
      <view v-if="activeMode === 'location'" class="location-toolbar">
        <view class="toolbar-copy">
          <text class="toolbar-title">我的足迹地图</text>
          <text class="toolbar-count">{{ recordCount }} 条</text>
        </view>
        <button class="toolbar-action" @tap="shareFootprints">分享</button>
      </view>

      <view v-else-if="activeMode === 'date'" class="date-timeline">
        <view class="date-timeline-header">
          <text class="date-timeline-title">{{ selectedDateObject.getFullYear() }}｜{{ String(selectedDateObject.getMonth() + 1).padStart(2, '0') }}.{{ String(selectedDateObject.getDate()).padStart(2, '0') }}</text>
          <view class="date-timeline-actions">
            <button class="year-review-button" @tap="openYearReview">年度回顾</button>
            <button class="today-button" @tap="returnToday">回到今天</button>
          </view>
        </view>
        <view v-if="!calendarExpanded" class="week-strip" role="group" aria-label="本周日期">
          <button
            v-for="day in weekDays"
            :key="day.key"
            class="week-day"
            :class="{ selected: day.key === selectedDate, marked: day.hasRecords }"
            :aria-label="calendarDayLabel(day)"
            @tap="selectDate(day.key)"
          ><text>{{ day.weekday }}</text><text>{{ day.number }}</text></button>
        </view>
        <button
          class="calendar-toggle"
          :class="{ expanded: calendarExpanded }"
          :aria-expanded="calendarExpanded"
          :aria-label="calendarExpanded ? '收起月历' : '展开月历'"
          @tap="toggleCalendar"
        ><view></view></button>
      </view>

      <view v-else class="mode-toolbar">
        <template>
          <view class="toolbar-copy">
            <text class="toolbar-title">{{ activeMode === 'favorite' ? '我的收藏' : '我的足迹地图' }}</text>
            <text class="toolbar-count">{{ recordCount }} 条</text>
          </view>
          <button v-if="activeMode === 'favorite'" class="toolbar-action" @tap="toggleManage">
            {{ managingFavorites ? '完成' : '管理' }}
          </button>
          <button v-else class="toolbar-action" @tap="shareFootprints">分享</button>
        </template>
      </view>

      <scroll-view v-if="activeMode === 'date' && calendarExpanded" class="calendar-panel" scroll-y :show-scrollbar="false">
        <view class="calendar-weekdays">
          <text v-for="weekday in weekdays" :key="weekday">{{ weekday }}</text>
        </view>
        <view class="calendar-grid" role="grid" aria-label="足迹日期">
          <button
            v-for="day in calendarDays"
            :key="day.key"
            class="calendar-day"
            role="gridcell"
            :class="{ selected: day.key === selectedDate, muted: !day.currentMonth, marked: day.hasRecords }"
            :aria-label="calendarDayLabel(day)"
            :aria-selected="day.key === selectedDate"
            @tap="selectCalendarDate(day.key)"
          >
            <text>{{ day.number }}</text>
            <view v-if="day.hasRecords" class="calendar-dot"></view>
          </button>
        </view>
      </scroll-view>

      <scroll-view v-if="activeMode !== 'location'" class="type-filter" scroll-x :show-scrollbar="false">
        <view class="type-filter-inner" role="listbox" aria-label="足迹类型">
          <button
            v-for="type in types"
            :key="type.key"
            class="type-chip"
            role="option"
            :class="{ active: activeType === type.key }"
            :aria-selected="activeType === type.key"
            @tap="selectType(type.key)"
          >{{ type.label }}</button>
        </view>
      </scroll-view>

      <view v-if="activeMode === 'location'" class="location-dock-copy">
        <view class="dock-icon" aria-hidden="true"></view>
        <text>点按地图上的内容卡片可查看详情</text>
        <text>拖动地图可浏览全部地点与内容</text>
      </view>

      <view v-else class="sheet-content">
        <view v-if="activeMode === 'date'" class="content-layout-switch" role="tablist" aria-label="日期内容展示形式">
          <button role="tab" :aria-selected="dateLayout === 'list'" :class="{ active: dateLayout === 'list' }" @tap="setDateLayout('list')">时间轴</button>
          <button role="tab" :aria-selected="dateLayout === 'masonry'" :class="{ active: dateLayout === 'masonry' }" @tap="setDateLayout('masonry')">卡片流</button>
        </view>
        <FootprintTimeline
          v-if="activeMode === 'date' && dateLayout === 'list'"
          :groups="visibleGroups"
          :selected-id="selectedFootprintId"
          :scroll-into-view="scrollIntoView"
          :managing="managingFavorites"
          :selected-record-ids="selectedFavoriteIds"
          :empty-title="emptyState.title"
          :empty-description="emptyState.description"
          @item-click="openEntry"
          @focus="focusEntryOnMap"
          @toggle-select="toggleFavoriteSelection"
          @scroll-state-change="handleTimelineScroll"
          @sheet-drag-start="startSheetDrag"
          @sheet-drag-move="moveSheetDrag"
          @sheet-drag-end="endSheetDrag"
        />
        <FootprintMasonry
          v-else
          :entries="modeEntries"
          :selected-id="selectedFootprintId"
          :managing="managingFavorites"
          :selected-record-ids="selectedFavoriteIds"
          :empty-title="emptyState.title"
          :empty-description="emptyState.description"
          @item-click="openEntry"
          @toggle-select="toggleFavoriteSelection"
          @scroll-state-change="handleTimelineScroll"
        />
      </view>
      </view>

      <view v-if="managingFavorites && !isSheetMinimized" class="manage-bar">
        <button class="manage-select" @tap="toggleSelectAll">{{ allFavoritesSelected ? '取消全选' : '全选' }}</button>
        <text role="status" aria-live="polite">已选 {{ selectedFavoriteIds.length }} 项</text>
        <view class="manage-actions">
          <button :disabled="!selectedFavoriteIds.length" @tap="moveSelectedFavorites">移动</button>
          <button class="danger" :disabled="!selectedFavoriteIds.length" @tap="removeSelectedFavorites">取消收藏</button>
        </view>
      </view>
    </view>

    <view
      v-if="undoRecords.length"
      class="undo-toast"
      role="status"
      aria-live="polite"
      @touchstart="pauseUndoTimer"
      @touchend="resumeUndoTimer"
      @mouseenter="pauseUndoTimer"
      @mouseleave="resumeUndoTimer"
      @focusin="pauseUndoTimer"
      @focusout="resumeUndoTimer"
    >
      <text>已取消收藏 {{ undoRecords.length }} 项</text>
      <button @tap="undoRemoveFavorites">撤销</button>
    </view>

    <GlobalOverlayHost />
  </view>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import GlobalOverlayHost from '../../components/common/GlobalOverlayHost.vue'
import LocationModule from './components/LocationModule.vue'
import FootprintTimeline from './components/FootprintTimeline.vue'
import FootprintMasonry from './components/FootprintMasonry.vue'
import { FOOTPRINT_TYPES, createMyEntryState, groupTimelineRecords, isMinimumSheetPosition, useMyData } from './composables/useMyData.js'
import { favoriteApi, footprintApi, socialViewStateApi } from '../../utils/api/social.js'

const modes = [
  { key: 'location', label: '位置' },
  { key: 'favorite', label: '收藏' },
  { key: 'date', label: '日期' }
]
const types = FOOTPRINT_TYPES
const weekdays = ['一', '二', '三', '四', '五', '六', '日']
const validModes = new Set(modes.map((item) => item.key))
const validTypes = new Set(types.map((item) => item.key))

const {
  userInfo, profileStats, footprintEntries, favoriteEntries, timelineEntries,
  hydrateRepositories, refreshFavorites
} = useMyData()

const windowHeight = ref(812)
const safeTop = ref(20)
const tabBarHeight = ref(86)
const entryState = createMyEntryState()
const activeMode = ref(entryState.mode)
const activeType = ref(entryState.category)
const panelState = ref(entryState.panelState)
const selectedDate = ref(entryState.date)
const selectedFootprintId = ref(entryState.selectedPointId)
const scrollIntoView = ref('')
const calendarExpanded = ref(false)
const dateLayout = ref(entryState.dateLayout)
const profileCollapsed = ref(entryState.profileCollapsed)
const managingFavorites = ref(false)
const selectedFavoriteIds = ref([])
const timelineScrollAtTop = ref(true)
const locationModule = ref(null)
const undoRecords = ref([])
let undoTimer = null

const isDragging = ref(false)
const dragStartY = ref(0)
const dragStartSheetY = ref(0)
const liveSheetY = ref(null)
const skipNextHandleTap = ref(false)

const expandedSheetY = computed(() => Math.max(safeTop.value + 68, 88))
const defaultSheetY = computed(() => Math.max(expandedSheetY.value + 188, Math.min(380, Math.round(windowHeight.value * 0.42))))
const minimizedSheetY = computed(() => Math.max(defaultSheetY.value + 80, windowHeight.value - tabBarHeight.value - 104))
const currentSheetY = computed(() => {
  if (liveSheetY.value !== null && liveSheetY.value !== undefined) {
    return Math.max(expandedSheetY.value, Math.min(minimizedSheetY.value, liveSheetY.value))
  }
  return panelState.value === 'expanded' ? expandedSheetY.value : defaultSheetY.value
})
const isProfileCompact = computed(() => profileCollapsed.value)
const isSheetMinimized = computed(() => isMinimumSheetPosition(currentSheetY.value, minimizedSheetY.value))
const sheetStyle = computed(() => ({
  transform: `translate3d(0, ${currentSheetY.value}px, 0)`,
  height: `${Math.max(240, windowHeight.value - currentSheetY.value)}px`,
  paddingBottom: `${tabBarHeight.value}px`,
  '--tabbar-height': `${tabBarHeight.value}px`
}))
const profileStyle = computed(() => ({ paddingTop: `${safeTop.value + 12}px` }))

const selectedDateObject = computed(() => new Date(`${selectedDate.value}T00:00:00`))
const formattedSelectedDate = computed(() => {
  const date = selectedDateObject.value
  return `${date.getMonth() + 1}/${date.getDate()}`
})
const selectedWeekday = computed(() => ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][selectedDateObject.value.getDay()])

const timelineDateKeys = computed(() => new Set(timelineEntries.value.map((item) => formatDateKey(new Date(item.createdAt)))))
const weekDays = computed(() => {
  const selected = selectedDateObject.value
  const mondayOffset = (selected.getDay() + 6) % 7
  const monday = new Date(selected)
  monday.setDate(selected.getDate() - mondayOffset)
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    const key = formatDateKey(date)
    return { key, number: date.getDate(), weekday: weekdays[index], currentMonth: date.getMonth() === selected.getMonth(), hasRecords: timelineDateKeys.value.has(key) }
  })
})
const calendarDays = computed(() => {
  const selected = selectedDateObject.value
  const first = new Date(selected.getFullYear(), selected.getMonth(), 1)
  const offset = (first.getDay() + 6) % 7
  const start = new Date(first)
  start.setDate(first.getDate() - offset)
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const key = formatDateKey(date)
    return {
      key,
      number: date.getDate(),
      currentMonth: date.getMonth() === selected.getMonth(),
      hasRecords: timelineDateKeys.value.has(key)
    }
  })
})

const typedEntries = (entries) => activeType.value === 'all'
  ? entries
  : entries.filter((item) => item.contentType === activeType.value)

const modeEntries = computed(() => {
  if (activeMode.value === 'favorite') return typedEntries(favoriteEntries.value)
  if (activeMode.value === 'date') {
    return typedEntries(timelineEntries.value.filter((item) => formatDateKey(new Date(item.createdAt)) === selectedDate.value))
  }
  // 位置模式始终是一张完整地图，不继承收藏/日期的内容筛选。
  return footprintEntries.value.filter((item) => item.hasLocation)
})
const visibleGroups = computed(() => groupTimelineRecords(modeEntries.value))
const recordCount = computed(() => modeEntries.value.length)
const mapEntries = computed(() => {
  if (activeMode.value === 'favorite') return modeEntries.value.filter((item) => item.hasLocation)
  if (activeMode.value === 'date') return modeEntries.value.filter((item) => item.hasLocation)
  return modeEntries.value
})
const mapLocations = computed(() => mapEntries.value.map((item) => ({
  id: item.sourceId,
  footprintId: item.footprintId,
  title: item.title,
  latitude: item.latitude,
  longitude: item.longitude,
  address: item.address,
  cover: item.media[0] || '',
  subtitle: item.author,
  likes: item.likes,
  type: item.contentType,
  detailType: item.detailType,
  layer: item.contentType
})))

const emptyState = computed(() => {
  if (activeMode.value === 'favorite') return { title: '暂无这类收藏', description: '收藏的内容会按日期整理在这里，可切换其他类型继续查看。' }
  if (activeMode.value === 'date') return { title: '这一天还没有记录', description: '切换日期，或发布一条带时间与位置的内容。' }
  return { title: '暂无可定位足迹', description: '没有坐标的内容仍可在收藏或日期视图中查看。' }
})

const selectableFavoriteIds = computed(() => modeEntries.value.map((item) => item.favoriteId).filter(Boolean))
const allFavoritesSelected = computed(() => selectableFavoriteIds.value.length > 0 && selectableFavoriteIds.value.every((id) => selectedFavoriteIds.value.includes(id)))

function formatDateKey(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function persistView(patch = {}) {
  socialViewStateApi.patchFootprint({
    mode: activeMode.value,
    date: selectedDate.value,
    category: activeType.value,
    panelState: panelState.value,
    dateLayout: dateLayout.value,
    profileCollapsed: profileCollapsed.value,
    expanded: panelState.value === 'expanded',
    selectedPointId: selectedFootprintId.value,
    sheetY: liveSheetY.value ?? currentSheetY.value,
    ...patch
  })
}

function switchMode(mode) {
  if (!validModes.has(mode)) return
  activeMode.value = mode
  // The top switcher changes content only. Keep the sheet exactly where the
  // user dragged it so position, favorite, and date feel like one workspace.
  managingFavorites.value = false
  selectedFavoriteIds.value = []
  calendarExpanded.value = false
  persistView()
}

function focusAdjacentMode(event, offset) {
  const tabs = Array.from(event?.currentTarget?.parentElement?.querySelectorAll?.('[role="tab"]') || [])
  const index = tabs.indexOf(event?.currentTarget)
  if (index < 0 || !tabs.length) return
  const next = tabs[(index + offset + tabs.length) % tabs.length]
  next?.focus?.()
  next?.click?.()
}

function selectType(type) {
  if (!validTypes.has(type)) return
  activeType.value = type
  selectedFootprintId.value = ''
  persistView()
}

function selectDate(dateKey) {
  selectedDate.value = dateKey
  persistView()
}

function selectCalendarDate(dateKey) {
  selectedDate.value = dateKey
  calendarExpanded.value = false
  persistView()
}

function setDateLayout(layout) {
  if (layout !== 'list' && layout !== 'masonry') return
  dateLayout.value = layout
  persistView()
}

function returnToday() {
  selectDate(formatDateKey(new Date()))
}

function toggleProfile() {
  profileCollapsed.value = !profileCollapsed.value
  persistView()
}

function shiftDay(offset) {
  const date = new Date(selectedDateObject.value)
  date.setDate(date.getDate() + offset)
  selectDate(formatDateKey(date))
}

function toggleCalendar() {
  calendarExpanded.value = !calendarExpanded.value
  persistView()
}

function touchY(event) {
  const detail = event?.detail && typeof event.detail === 'object' ? event.detail : {}
  // uni-app H5 and mp-weixin put touch data on different levels. Do not let an
  // empty detail object hide the actual touch coordinates on the root event.
  const touch = event?.touches?.[0]
    || event?.changedTouches?.[0]
    || detail?.touches?.[0]
    || detail?.changedTouches?.[0]
  const value = event?.startY ?? event?.currentY ?? event?.endY
    ?? event?.y ?? detail?.startY ?? detail?.currentY ?? detail?.endY ?? detail?.y
    ?? touch?.clientY ?? touch?.pageY ?? touch?.y ?? touch?.screenY
  return Number.isFinite(Number(value)) ? Number(value) : null
}

function startSheetDrag(event) {
  const startY = touchY(event)
  if (startY === null) return
  dragStartY.value = startY
  dragStartSheetY.value = currentSheetY.value
  skipNextHandleTap.value = false
  isDragging.value = true
}

function moveSheetDrag(event) {
  if (!isDragging.value) return
  const currentY = touchY(event)
  if (currentY === null) return
  const delta = currentY - dragStartY.value
  if (Math.abs(delta) > 6) skipNextHandleTap.value = true
  const next = dragStartSheetY.value + delta
  liveSheetY.value = Math.max(expandedSheetY.value, Math.min(minimizedSheetY.value, next))
}

function endSheetDrag() {
  if (!isDragging.value) return
  isDragging.value = false
  const y = liveSheetY.value ?? currentSheetY.value
  // Keep the exact resting position. The named state only describes the
  // accessibility affordance; it must never force a drag snap.
  panelState.value = y <= expandedSheetY.value + 2 ? 'expanded' : 'default'
  persistView()
}

function togglePanelState() {
  if (skipNextHandleTap.value) {
    skipNextHandleTap.value = false
    return
  }
  if (isDragging.value) return
  const y = currentSheetY.value
  const targetY = y <= expandedSheetY.value + 12 ? defaultSheetY.value : expandedSheetY.value
  liveSheetY.value = targetY
  panelState.value = targetY === expandedSheetY.value ? 'expanded' : 'default'
  persistView()
}

function handleTimelineScroll({ isAtTop, scrollTop }) {
  timelineScrollAtTop.value = isAtTop
  persistView({ scrollTop })
}

function scrollToEntry(item) {
  const id = `footprint-${String(item.footprintId || item.sourceId).replace(/[^a-zA-Z0-9_-]/g, '-')}`
  scrollIntoView.value = ''
  nextTick(() => { scrollIntoView.value = id })
}

function handleMarkerTap(payload) {
  const location = payload?.location || payload
  if (!location) return
  const target = footprintEntries.value.find((item) => String(item.footprintId) === String(location.footprintId || location.id))
  if (!target) return
  selectedFootprintId.value = target.footprintId
  scrollToEntry(target)
  persistView()
}

function focusEntryOnMap(item) {
  if (!item?.hasLocation) return
  selectedFootprintId.value = item.footprintId
  panelState.value = 'default'
  liveSheetY.value = null
  nextTick(() => locationModule.value?.focusLocation?.({ latitude: item.latitude, longitude: item.longitude }))
  persistView()
}

function openEntry(item) {
  if (!item) return
  if (item.availableState !== 'available') {
    uni.showToast({ title: '原内容已失效，可继续保留足迹', icon: 'none' })
    return
  }
  if (!item.footprintId && item.contentType === 'event') {
    uni.showModal({ title: item.title, content: `${formattedSelectedDate.value} ${item.duration || ''}`, showCancel: false })
    return
  }
  selectedFootprintId.value = item.footprintId
  persistView()
  if (item.detailType === 'service') {
    uni.navigateTo({ url: '/pages/service/detail/index' })
    return
  }
  uni.navigateTo({
    url: `/pages/detail/index?id=${encodeURIComponent(item.sourceId)}&type=${encodeURIComponent(item.detailType || 'normal')}&source=my-footprint&returnStateKey=footprint`
  })
}

function toggleManage() {
  managingFavorites.value = !managingFavorites.value
  selectedFavoriteIds.value = []
}

function toggleFavoriteSelection(item) {
  if (!item?.favoriteId) return
  selectedFavoriteIds.value = selectedFavoriteIds.value.includes(item.favoriteId)
    ? selectedFavoriteIds.value.filter((id) => id !== item.favoriteId)
    : [...selectedFavoriteIds.value, item.favoriteId]
}

function toggleSelectAll() {
  selectedFavoriteIds.value = allFavoritesSelected.value ? [] : selectableFavoriteIds.value.slice()
}

function moveSelectedFavorites() {
  if (!selectedFavoriteIds.value.length) return
  const folders = favoriteApi.folders()
  uni.showActionSheet({
    itemList: [...folders.map((folder) => folder.name), '新建收藏夹'],
    success: ({ tapIndex }) => {
      if (tapIndex === folders.length) {
        uni.showModal({
          title: '新建收藏夹', editable: true, placeholderText: '输入收藏夹名称',
          success: ({ confirm, content }) => {
            if (!confirm || !String(content || '').trim()) return
            const folder = favoriteApi.createFolder(String(content).trim())
            finishMoveFavorites(folder.id)
          }
        })
      } else if (folders[tapIndex]) finishMoveFavorites(folders[tapIndex].id)
    }
  })
}

function finishMoveFavorites(folderId) {
  const moved = favoriteApi.moveMany(selectedFavoriteIds.value, folderId)
  refreshFavorites()
  selectedFavoriteIds.value = []
  uni.showToast({ title: `已移动 ${moved.length} 项`, icon: 'none' })
}

function removeSelectedFavorites() {
  if (!selectedFavoriteIds.value.length) return
  uni.showModal({
    title: '取消收藏', content: `确定取消收藏选中的 ${selectedFavoriteIds.value.length} 项吗？`, confirmColor: '#dc2626',
    success: ({ confirm }) => {
      if (!confirm) return
      undoRecords.value = favoriteApi.removeMany(selectedFavoriteIds.value)
      refreshFavorites()
      selectedFavoriteIds.value = []
      managingFavorites.value = false
      if (undoTimer) clearTimeout(undoTimer)
      undoTimer = setTimeout(() => { undoRecords.value = [] }, 8000)
    }
  })
}

function undoRemoveFavorites() {
  favoriteApi.restoreMany(undoRecords.value)
  refreshFavorites()
  undoRecords.value = []
  if (undoTimer) clearTimeout(undoTimer)
  uni.showToast({ title: '收藏已恢复', icon: 'none' })
}

function pauseUndoTimer() {
  if (undoTimer) clearTimeout(undoTimer)
  undoTimer = null
}

function resumeUndoTimer() {
  if (!undoRecords.value.length) return
  pauseUndoTimer()
  undoTimer = setTimeout(() => { undoRecords.value = [] }, 8000)
}

function shareFootprints() {
  const filters = activeType.value === 'all' ? {} : { layer: activeType.value }
  const snapshot = footprintApi.shareSnapshot(filters)
  if (!snapshot.length) {
    uni.showToast({ title: '当前筛选没有可分享的公开足迹', icon: 'none' })
    return
  }
  try { uni.setStorageSync('MY_FOOTPRINT_SHARE_SNAPSHOT', snapshot) } catch (error) {}
  uni.navigateTo({ url: '/pages/map-share/index?source=my-footprint' })
}

function openSettings() { uni.navigateTo({ url: '/pages/my-settings/index' }) }
function openYearReview() { uni.navigateTo({ url: `/pages/my-timeline/index?year=${selectedDateObject.value.getFullYear()}` }) }
function calendarDayLabel(day) {
  const states = []
  if (day.key === selectedDate.value) states.push('已选择')
  if (!day.currentMonth) states.push('非本月')
  if (day.hasRecords) states.push('有足迹记录')
  return `${day.key}${states.length ? `，${states.join('，')}` : ''}`
}

function initializeMetrics() {
  try {
    const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
    windowHeight.value = Number(info.windowHeight || 812)
    safeTop.value = Number(info.safeAreaInsets?.top || info.statusBarHeight || 20)
    const tabMetrics = uni.getStorageSync('TABBAR_METRICS')
    tabBarHeight.value = Number(tabMetrics?.placeholderHeightPx || 86)
  } catch (error) {}
}

onMounted(initializeMetrics)
onShow(() => {
  const freshEntry = createMyEntryState()
  activeMode.value = freshEntry.mode
  activeType.value = freshEntry.category
  panelState.value = freshEntry.panelState
  selectedDate.value = freshEntry.date
  selectedFootprintId.value = freshEntry.selectedPointId
  dateLayout.value = freshEntry.dateLayout
  profileCollapsed.value = freshEntry.profileCollapsed
  calendarExpanded.value = false
  liveSheetY.value = null
  managingFavorites.value = false
  selectedFavoriteIds.value = []
  scrollIntoView.value = ''
  hydrateRepositories()
  try {
    const pages = getCurrentPages()
    const page = pages[pages.length - 1]
    page?.getTabBar?.()?.setData({ selected: 4 })
  } catch (error) {}
})
onUnmounted(() => { if (undoTimer) clearTimeout(undoTimer) })
</script>

<style scoped>
.my-page { position: fixed; inset: 0; overflow: hidden; color: var(--ink-900); background: var(--color-page); --brand: var(--color-explore); --brand-strong: var(--color-explore-strong); --brand-soft: var(--color-explore-soft); --ink-900: var(--color-text); --ink-700: var(--color-text-body); --ink-500: var(--color-text-muted); --ink-300: #c3cbc8; --line-soft: var(--color-divider); --ease-bouncy: cubic-bezier(.2,.8,.2,1); }
.map-stage { position: absolute; inset: 0 0 0; z-index: 1; transition: filter 220ms var(--ease-standard); }
.map-stage.muted { filter: saturate(.74) brightness(1.035) contrast(.96); }
.map-stage :deep(.location-module), .map-stage :deep(.map-section) { height: 100%; }
.map-wash { position: absolute; inset: 0; pointer-events: none; background: rgba(250,252,248,.12); }
.profile-layer { position: absolute; top: 0; left: 0; right: 0; z-index: 8; min-height: 118rpx; padding: env(safe-area-inset-top) 24rpx 10rpx; background: linear-gradient(180deg, rgba(255,255,255,.88) 0%, rgba(255,255,255,.34) 72%, rgba(255,255,255,0) 100%); pointer-events: none; }
.profile-topline { display: flex; align-items: center; justify-content: space-between; gap: 20rpx; transition: transform 260ms var(--ease-bouncy); }
.profile-identity { width: fit-content; min-width: 0; flex: 0 1 auto; display: flex; flex-direction: row; align-items: center; gap: 10rpx; padding: 6rpx 14rpx 6rpx 6rpx; pointer-events: auto; border: 1rpx solid rgba(255,255,255,.92); border-radius: 999rpx; box-shadow: 0 8rpx 22rpx rgba(0, 0, 0, 0.075); transition: transform 200ms var(--ease-bouncy);  background: var(--color-surface-glass); }
.profile-identity:active { transform: scale(.97); }
.avatar { width: 62rpx; height: 62rpx; border: 3rpx solid #fff; border-radius: 50%; background: #fff; box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08); transition: transform 200ms var(--ease-bouncy); }
.identity-copy { min-width: 0; display: flex; flex-direction: column; align-items: flex-start; gap: 4rpx; }
.username { color: var(--ink-900); font-size: 25rpx; font-weight: 750; line-height: 1.2; }
.description { max-width: 300rpx; overflow: hidden; color: var(--ink-500); font-size: 19rpx; white-space: nowrap; text-overflow: ellipsis; }
.settings-button { position: relative; width: 88rpx; height: 72rpx; margin: 0; padding: 0; pointer-events: auto; border: 1rpx solid rgba(255,255,255,.9); border-radius: 999rpx; color: var(--brand-strong); box-shadow: 0 8rpx 22rpx rgba(0, 0, 0, 0.075); font-size: 20rpx; font-weight: 650; line-height: 72rpx;  background: var(--color-surface-glass); }
.settings-button::after { border: 0; }
.profile-stats { display: none; }
.stat-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6rpx; }
.stat-item + .stat-item { border-left: 1rpx solid var(--line-soft); }
.stat-number { font-size: 30rpx; font-weight: 800; font-variant-numeric: tabular-nums; }
.stat-label { color: var(--ink-500); font-size: 21rpx; }
.profile-layer.compact { min-height: 112rpx; background: linear-gradient(180deg, rgba(255,255,255,.88), rgba(255,255,255,.30) 72%, transparent); }
.profile-layer.compact .profile-topline { transform: translate3d(0,-4rpx,0); }
.profile-layer.compact .profile-identity { flex-direction: row; align-items: center; }
.profile-layer.compact .avatar { width: 62rpx; height: 62rpx; border-width: 3rpx; }
.profile-layer.compact .identity-copy { align-items: flex-start; }
.profile-layer.compact .username { font-size: 25rpx; }
.profile-layer.compact .description { max-width: 280rpx; font-size: 19rpx; }
.profile-layer.compact .profile-stats { opacity: 0; pointer-events: none; transform: translate3d(0,-24rpx,0); }
.footprint-sheet { position: absolute; top: 0; left: 0; right: 0; z-index: 20; display: flex; flex-direction: column; overflow: hidden; border: 0; transition: transform 240ms ease; will-change: transform; box-shadow: var(--shadow-sheet); border-radius: 30px 30px 0 0; background: rgba(250,253,252,.92); backdrop-filter: blur(24px) saturate(125%); -webkit-backdrop-filter: blur(24px) saturate(125%); }
.footprint-sheet.dragging { transition: none; }
.footprint-sheet.location-mode { background: rgba(250,253,252,.92); }
.footprint-sheet.minimized {  background: var(--color-surface-glass); }
.sheet-grab-region { flex: 0 0 56rpx; display: flex; align-items: flex-start; justify-content: center; touch-action: none; cursor: ns-resize; height: 20px; flex-basis: 20px; margin-bottom: 0; padding-top: 8px; padding-bottom: 8px; }
.sheet-grab-region:active .drag-handle { width: 96rpx; background: var(--color-text-muted); }
.drag-handle { border-radius: 4rpx; transition: width 160ms ease, background 160ms ease; width: 32px; height: 4px; background: #c4ccc8; }
.mode-tabs { display: flex; border: 0; margin: 0 14px 4px; padding: 0; gap: 4px; background: transparent; border-radius: 0; }
.mode-tab { min-width: 0; margin: 0; padding: 0 12rpx; flex: 1; display: flex; align-items: center; justify-content: center; color: var(--color-text-muted); background: transparent; transition: color 180ms ease, background 180ms ease;  height: 44px;  line-height: 44px;  font-size: 13px;  font-weight: 500;  border-radius: 16px;  gap: 6px; }
.mode-tab::after { border: 0; }
.mode-tab.active { background: #e0f2ec; color: #286c5c; box-shadow: none; font-weight: 600; }
.mode-symbol { position: relative; width: 24rpx; height: 24rpx; flex: 0 0 24rpx; color: currentColor; }
.symbol-location { width: 20rpx; height: 20rpx; border: 4rpx solid currentColor; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); }
.symbol-favorite::before { content: ''; position: absolute; left: 4rpx; top: 2rpx; width: 18rpx; height: 24rpx; border: 4rpx solid currentColor; border-radius: 4rpx 4rpx 10rpx 10rpx; }
.symbol-date { border: 4rpx solid currentColor; border-radius: 5rpx; }
.symbol-date::before { content: ''; position: absolute; left: -4rpx; right: -4rpx; top: 6rpx; border-top: 4rpx solid currentColor; }
.mode-toolbar { min-height: 68rpx; padding: 0 22rpx; display: flex; align-items: center; gap: 10rpx; }
.location-toolbar { min-height: 68rpx; padding: 0 22rpx; display: flex; align-items: center; gap: 10rpx; }
.toolbar-copy { min-width: 0; flex: 1; display: flex; align-items: baseline; gap: 12rpx; }
.toolbar-title { color: var(--ink-900); font-size: 14px; font-weight: 600; }
.toolbar-count { font-weight: 650; font-size: 11px; color: var(--color-text-muted); }
.toolbar-action { margin: 0; border: 0; color: var(--brand-strong); font-weight: 650; box-shadow: none; min-width: 44px; height: 36px; line-height: 36px; padding: 0 10px; font-size: 12px; background: transparent; border-radius: 12px; }
.toolbar-action::after { border: 0; }
.calendar-panel { border-radius: 22rpx; box-shadow: none; margin: 0 14px 8px; background: transparent; height: 216px; max-height: 22vh; flex-shrink: 0; padding: 4px 2px; }
.date-timeline { border-bottom: 1rpx solid var(--line-soft); margin: 0 14px; padding: 0 2px 4px; background: transparent; border-radius: 0; }
.date-timeline-header { display: flex; align-items: center; justify-content: space-between; gap: 10rpx; min-height: 40px; }
.date-timeline-title { color: var(--ink-900); font-variant-numeric: tabular-nums; font-size: 13px; font-weight: 600; }
.date-timeline-actions { display: flex; align-items: center; gap: 8rpx; }
.year-review-button, .today-button { margin: 0; height: 36px; line-height: 36px; padding: 0 8px; font-size: 11px; font-weight: 500; border-radius: 12px; }
.year-review-button { color: var(--brand-strong); background: transparent; }
.today-button { background: transparent; color: var(--color-text); box-shadow: none; }
.year-review-button::after, .today-button::after { border: 0; }
.week-strip { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4rpx; }
.week-day { position: relative; min-width: 0; margin: 0; padding: 3rpx 0; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--ink-500); background: transparent; line-height: 1; height: 44px; font-size: 11px; border-radius: 12px; gap: 4px; }
.week-day text:last-child { color: var(--ink-700); font-size: 13px; font-weight: 600; }
.week-day::after { border: 0; }
.week-day.marked::before { content: ''; position: absolute; bottom: 6rpx; width: 6rpx; height: 6rpx; border-radius: 50%; background: var(--brand); }
.week-day.selected { background: #e0f2ec; color: #286c5c; box-shadow: none; }
.week-day.selected text:last-child { color: #286c5c; }
.week-day.selected::before { background: #fff; }
.calendar-toggle { padding: 0; display: flex; align-items: center; justify-content: center; width: 44px; height: 24px; margin: 2px auto 0; background: transparent; border-radius: 12px; }
.calendar-toggle::after { border: 0; }
.calendar-toggle view { border-right: 4rpx solid #fff; border-bottom: 4rpx solid #fff; transform: rotate(45deg) translate(-3rpx,-3rpx); border-color: var(--color-text-muted); width: 7px; height: 7px; border-width: 0 1.5px 1.5px 0; }
.calendar-toggle.expanded view { transform: rotate(225deg) translate(-3rpx,-3rpx); }
.calendar-weekdays, .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); }
.calendar-weekdays text { height: 44rpx; color: var(--ink-500); font-size: 22rpx; text-align: center; line-height: 44rpx; }
.calendar-day { position: relative; margin: 0; padding: 0; color: var(--ink-700); background: transparent; height: 36px; min-height: 36px; line-height: 36px; font-size: 12px; border-radius: 12px; }
.calendar-day::after { border: 0; }
.calendar-day.muted { color: #d1d5db; }
.calendar-day.selected { background: #e0f2ec; color: #286c5c; }
.calendar-dot { position: absolute; left: 50%; bottom: 5rpx; width: 6rpx; height: 6rpx; border-radius: 50%; background: var(--brand); transform: translateX(-50%); }
.calendar-day.selected .calendar-dot { background: #fff; }
.type-filter { width: 100%; flex: 0 0 76rpx; white-space: nowrap; -webkit-mask-image: linear-gradient(90deg,#000 0%,#000 91%,transparent 100%); mask-image: linear-gradient(90deg,#000 0%,#000 91%,transparent 100%); flex-basis: 44px; border-bottom: 0; }
.type-filter-inner { display: inline-flex; padding: 0 14px; gap: 2px; }
.type-chip { margin: 0; border: 0; color: var(--ink-500); background: var(--color-page); transition: color 180ms ease, background 180ms ease, box-shadow 180ms ease; min-width: 40px; height: 40px; min-height: 40px; line-height: 40px; padding: 0 8px; font-size: 12px; font-weight: 500; border-radius: 12px; }
.type-chip::after { border: 0; }
.type-chip.active { background: #e0f2ec; color: #286c5c; font-weight: 600; box-shadow: none; }
.sheet-body { min-height: 0; flex: 1; display: flex; flex-direction: column; }
.sheet-content { min-height: 0; flex: 1; }
.footprint-sheet.minimized .mode-tabs { margin-bottom: 0; }
.location-dock-copy { margin: 8rpx 20rpx 20rpx; padding: 24rpx 28rpx; display: flex; flex-direction: column; gap: 8rpx; border: 1rpx dashed #d1d5db; border-radius: 24rpx; background: #fff; box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.04); }
.dock-icon { position: relative; width: 44rpx; height: 44rpx; margin-bottom: 8rpx; }
.dock-icon::before { content: ''; position: absolute; left: 6rpx; top: 4rpx; width: 30rpx; height: 30rpx; border: 6rpx solid var(--brand); border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-sizing: border-box; }
.location-dock-copy text:first-child { color: var(--ink-700); font-size: 24rpx; font-weight: 700; }
.location-dock-copy text:last-child { color: var(--ink-500); font-size: 21rpx; }
.content-layout-switch { display: flex; align-items: center; height: 36px; padding: 0 14px; gap: 16px; border-top: 0; border-bottom: 0; }
.content-layout-switch button { margin: 0; color: var(--ink-500); font-weight: 650; flex: 0 0 auto; height: 32px; line-height: 32px; font-size: 11px; padding: 0 2px; border-radius: 0; background: transparent; }
.content-layout-switch button::after { border: 0; }
.content-layout-switch button.active { background: transparent; color: #286c5c; box-shadow: inset 0 -2px 0 #286c5c; }
.manage-bar { position: absolute; left: 20rpx; right: 20rpx; bottom: calc(var(--tabbar-height) + 14rpx); min-height: 104rpx; padding: 14rpx 18rpx; z-index: 4; display: flex; align-items: center; gap: 14rpx; border-radius: 28rpx; color: var(--ink-900); box-shadow: 0 14rpx 38rpx rgba(0, 0, 0, 0.1);  background: var(--color-surface-glass); }
.manage-bar > text { flex: 1; color: var(--ink-500); font-size: 21rpx; }
.manage-bar button { min-height: 88rpx; margin: 0; padding: 0 18rpx; border-radius: 22rpx; color: var(--ink-500); background: var(--color-surface-raised); font-size: 23rpx; line-height: 88rpx; }
.manage-bar button::after { border: 0; }
.manage-bar .manage-select { padding: 0 10rpx; background: transparent; color: var(--brand-strong); }
.manage-actions { display: flex; gap: 8rpx; }
.manage-bar button.danger { color: var(--color-danger); background: var(--color-danger-soft); }
.manage-bar button[disabled] { opacity: .42; }
.undo-toast { position: fixed; left: 50%; bottom: calc(126rpx + env(safe-area-inset-bottom)); z-index: 80; width: min(620rpx, calc(100% - 48rpx)); min-height: 84rpx; padding: 12rpx 16rpx 12rpx 24rpx; display: flex; align-items: center; gap: 16rpx; border-radius: 24rpx; color: #fff; background: var(--color-text); box-shadow: 0 16rpx 38rpx rgba(0, 0, 0, 0.1); transform: translateX(-50%); }
.undo-toast text { flex: 1; font-size: 24rpx; }
.undo-toast button { width: 108rpx; height: 88rpx; margin: 0; padding: 0; border-radius: 20rpx; color: #ffb483; background: rgba(255,255,255,.1); font-size: 23rpx; font-weight: 750; line-height: 88rpx; }
.undo-toast button::after { border: 0; }

/* My page: the map stays open; date browsing uses one compact control stack. */
.profile-layer { min-height: 104rpx; padding: env(safe-area-inset-top) 20rpx 8rpx; background: linear-gradient(180deg, rgba(255,255,255,.82), rgba(255,255,255,0) 100%); }
.profile-identity { gap: 8rpx; padding: 5rpx 12rpx 5rpx 5rpx; box-shadow: 0 4rpx 12rpx rgba(0,0,0,.05);  background: var(--color-surface-glass); }
.avatar { width: 56rpx; height: 56rpx; border-width: 2rpx; box-shadow: none; }
.username { font-size: 23rpx; }
.description { font-size: 18rpx; }
.settings-button { width: 72rpx; height: 60rpx; border-radius: 14rpx; box-shadow: 0 4rpx 12rpx rgba(0,0,0,.05); font-size: 19rpx; line-height: 60rpx;  background: var(--color-surface-glass); }
.footprint-sheet { box-shadow: var(--shadow-sheet); border-radius: 30px 30px 0 0; background: rgba(250,253,252,.92); backdrop-filter: blur(24px) saturate(125%); -webkit-backdrop-filter: blur(24px) saturate(125%); }
.sheet-grab-region { height: 20px; flex-basis: 20px; margin-bottom: 0; padding-top: 8px; padding-bottom: 8px; }
.drag-handle { width: 32px; height: 4px; background: #c4ccc8; }
.mode-tabs { margin: 0 14px 4px; padding: 0; gap: 4px; background: transparent; border-radius: 0; }
.mode-tab { padding: 0 8rpx;  height: 44px;  line-height: 44px;  font-size: 13px;  font-weight: 500;  border-radius: 16px;  gap: 6px; }
.mode-tab.active { background: #e0f2ec; color: #286c5c; box-shadow: none; font-weight: 600; }
.mode-symbol { width: 20rpx; height: 20rpx; flex-basis: 20rpx; }
.symbol-location { width: 17rpx; height: 17rpx; border-width: 3rpx; }
.symbol-favorite::before { left: 3rpx; top: 2rpx; width: 15rpx; height: 20rpx; border-width: 3rpx; }
.symbol-date { border-width: 3rpx; }
.symbol-date::before { left: -3rpx; right: -3rpx; top: 5rpx; border-top-width: 3rpx; }
.date-timeline { margin: 0 14px; padding: 0 2px 4px; background: transparent; border-radius: 0; }
.date-timeline-header { min-height: 40px; }
.date-timeline-title { font-size: 13px; font-weight: 600; }
.date-timeline-actions { gap: 6rpx; }
.year-review-button,.today-button { height: 46rpx; padding: 0 10rpx; border-radius: 9rpx; font-size: 18rpx; line-height: 46rpx; }
.today-button { background: transparent; color: var(--color-text); box-shadow: none; }
.week-strip { gap: 2rpx; }
.week-day { height: 44px; font-size: 11px; border-radius: 12px; gap: 4px; }
.week-day text:last-child { font-size: 13px; font-weight: 600; }
.week-day.marked::before { bottom: 4rpx; width: 5rpx; height: 5rpx; }
.week-day.selected { background: #e0f2ec; color: #286c5c; box-shadow: none; }
.calendar-toggle { margin-bottom: -9rpx; width: 44px; height: 24px; margin: 2px auto 0; background: transparent; border-radius: 12px; }
.type-filter { flex-basis: 44px; border-bottom: 0; }
.type-filter-inner { padding: 0 14px; gap: 2px; }
.type-chip { min-width: 40px; height: 40px; min-height: 40px; line-height: 40px; padding: 0 8px; font-size: 12px; font-weight: 500; border-radius: 12px; }
.type-chip.active { background: #e0f2ec; color: #286c5c; font-weight: 600; box-shadow: none; }
.content-layout-switch { height: 36px; padding: 0 14px; gap: 16px; border-top: 0; border-bottom: 0; }
.content-layout-switch button { flex: 0 0 auto; height: 32px; line-height: 32px; font-size: 11px; padding: 0 2px; border-radius: 0; background: transparent; }

/* Reuse the home sheet vocabulary: a clear work surface, compact filters, and one strong selection. */
.footprint-sheet { box-shadow: var(--shadow-sheet); border-radius: 30px 30px 0 0; background: rgba(250,253,252,.92); backdrop-filter: blur(24px) saturate(125%); -webkit-backdrop-filter: blur(24px) saturate(125%); }

.sheet-grab-region {
  height: 20px;
  flex-basis: 20px;
  margin-bottom: 0;
  padding-top: 8px;
  padding-bottom: 8px;
}

.drag-handle {
  width: 32px;
  height: 4px;
  background: #c4ccc8;
}

.mode-tabs { margin: 0 14px 4px; padding: 0; gap: 4px; background: transparent; border-radius: 0; }

.mode-tab {
  padding: 0 10rpx;
  color: var(--color-text-muted);
  background: transparent;  height: 44px;  line-height: 44px;  font-size: 13px;  font-weight: 500;  border-radius: 16px;  gap: 6px; }

.mode-tab.active { background: #e0f2ec; color: #286c5c; box-shadow: none; font-weight: 600; }

.mode-toolbar,
.location-toolbar {
  min-height: 40px;
  padding: 0 16px;
}

.toolbar-action {
  color: var(--color-text);
  min-width: 44px;
  height: 36px;
  line-height: 36px;
  padding: 0 10px;
  font-size: 12px;
  background: transparent;
  border-radius: 12px;
}

.date-timeline {
  border: 0;
  margin: 0 14px;
  padding: 0 2px 4px;
  background: transparent;
  border-radius: 0;
}

.date-timeline-header { min-height: 40px;
}

.week-day { height: 44px; font-size: 11px; border-radius: 12px; gap: 4px;
}

.type-filter {
  border-top: 0;
  flex-basis: 44px;
  border-bottom: 0;
}

.type-filter-inner { padding: 0 14px; gap: 2px;
}

.type-chip {
  color: var(--color-text-body);
  background: transparent;
  min-width: 40px;
  height: 40px;
  min-height: 40px;
  line-height: 40px;
  padding: 0 8px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 12px;
}

.type-chip.active {
  background: #e0f2ec;
  color: #286c5c;
  font-weight: 600;
  box-shadow: none;
}

.content-layout-switch {
  height: 36px;
  padding: 0 14px;
  gap: 16px;
  border-top: 0;
  border-bottom: 0;
}

.content-layout-switch button {
  flex: 0 0 auto;
  height: 32px;
  line-height: 32px;
  font-size: 11px;
  padding: 0 2px;
  border-radius: 0;
  background: transparent;
}
@media (orientation: landscape) {
  .profile-layer { right: 52%; min-height: 100%; padding-left: calc(32rpx + env(safe-area-inset-left)); background: linear-gradient(90deg, rgba(255,255,255,.97), rgba(255,255,255,.85) 78%, transparent); }
  .footprint-sheet { left: 46%; right: env(safe-area-inset-right); top: calc(12rpx + env(safe-area-inset-top)); bottom: 0; height: auto !important; transform: translate3d(0, 0, 0) !important;  background: var(--color-surface-glass); border-radius: 32px 32px 0 0; box-shadow: var(--shadow-sheet); backdrop-filter: blur(24px) saturate(135%); -webkit-backdrop-filter: blur(24px) saturate(135%); }
  .profile-layer.compact .profile-stats { opacity: 1; transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  .map-stage, .profile-topline, .profile-identity, .avatar, .profile-stats, .footprint-sheet, .mode-tab, .type-chip { transition-duration: .01ms; }
}
</style>

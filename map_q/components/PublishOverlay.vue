<template>
  <view class="overlay" :class="{ active: isActive }" @tap="close">
    <view class="workspace" @tap.stop>
      <view class="status-card">
        <view class="status-head">
          <view class="title-group">
            <text class="eyebrow">CREATION SPACE</text>
            <text class="workspace-title">开始你的创作</text>
          </view>
          <view class="autosave-state" :class="{ warning: quickSummary.failed + quickSummary.needsReselect > 0 }">
            <view class="state-dot"></view>
            <text>{{ autosaveText }}</text>
          </view>
        </view>

        <view class="feature-row">
          <view
            v-for="feature in features"
            :key="feature.id"
            class="feature-card"
            :class="[{ selected: activePanel === feature.id }, feature.tone]"
            role="button"
            :aria-label="feature.title"
            @tap="togglePanel(feature.id)"
          >
            <view class="feature-mark"></view>
            <text>{{ feature.title }}</text>
            <text class="feature-meta">{{ feature.meta }}</text>
          </view>
        </view>
      </view>

      <view class="content-zone">
        <view v-if="activePanel === 'radar'" class="radar-panel">
          <view class="panel-head">
            <view class="panel-title">
              <text>附近兴趣雷达</text>
              <text v-if="radarLoading">正在匹配地图中的人和事</text>
              <text v-else-if="radarError">{{ radarError }}</text>
              <text v-else>发现 {{ radarResult.interestCount }} 个公开兴趣信号 · {{ freshnessText }}</text>
            </view>
            <view
              class="compact-button blue"
              :class="{ disabled: radarLoading }"
              role="button"
              aria-label="重新扫描附近兴趣"
              @tap="scanNearby(true)"
            >
              <view class="button-dot"></view>
              <text>{{ radarLoading ? '扫描中' : radarError ? '重试' : '重新扫描' }}</text>
            </view>
          </view>

          <view v-if="radarLoading && !radarResult.items.length" class="radar-skeleton">
            <view class="skeleton-circle"></view>
            <view class="skeleton-lines"><view></view><view></view><view></view></view>
          </view>

          <view v-else-if="!radarResult.items.length" class="panel-empty">
            <view class="empty-radar"></view>
            <text>{{ radarError || '当前范围内还没有公开兴趣信号' }}</text>
            <text>可以扩大地图范围后重新扫描</text>
            <view class="empty-action" @tap="scanNearby(true)">再次扫描</view>
          </view>

          <template v-else>
            <view
              class="interest-sphere"
              :class="{ scanning: radarLoading }"
              role="application"
              aria-label="可拖动旋转的附近兴趣球面"
              @touchstart.stop="onSphereTouchStart"
              @touchmove.stop.prevent="onSphereTouchMove"
              @touchend.stop="onSphereTouchEnd"
              @touchcancel.stop="onSphereTouchEnd"
            >
              <view class="sphere-surface">
                <view class="sphere-outline"></view>
                <view class="sphere-latitude latitude-one"></view>
                <view class="sphere-latitude latitude-two"></view>
                <view class="sphere-meridian meridian-one"></view>
                <view class="sphere-meridian meridian-two"></view>
                <view
                  v-for="point in radarSpherePoints"
                  :key="point.cloudId"
                  class="sphere-point"
                  :class="[point.kind, { tag: point.isTag, hidden: !point.visible }]"
                  :style="point.position"
                  role="button"
                  :aria-label="`${point.title}，点击查看关联内容详情`"
                  @tap="openRadarDetail(point.targetItem)"
                >
                  <view class="sphere-node">{{ point.isTag ? '' : kindGlyph(point.kind) }}</view>
                  <text>{{ point.title }}</text>
                </view>
              </view>
              <view class="sphere-controls">
                <view class="sphere-control" role="button" aria-label="向左旋转兴趣球" @tap.stop="rotateSphere(-1)">‹</view>
                <text>{{ sphereDragging ? '正在旋转兴趣球' : '拖动球面探索更多内容' }}</text>
                <view class="sphere-control" role="button" aria-label="向右旋转兴趣球" @tap.stop="rotateSphere(1)">›</view>
              </view>
            </view>
          </template>
        </view>

        <view v-else-if="activePanel === 'media'" class="management-panel">
          <view class="panel-head">
            <view class="panel-title"><text>媒体与草稿</text><text>直接恢复中断任务或继续编辑</text></view>
            <view class="compact-button" @tap="activePanel = 'radar'"><text>返回雷达</text></view>
          </view>
          <view class="summary-grid">
            <view><text>{{ quickSummary.queued }}</text><text>待上传</text></view>
            <view><text>{{ quickSummary.uploading }}</text><text>上传中</text></view>
            <view class="danger"><text>{{ quickSummary.failed }}</text><text>失败</text></view>
            <view class="warning"><text>{{ quickSummary.needsReselect }}</text><text>需重选</text></view>
          </view>
          <scroll-view class="manage-list" scroll-y>
            <view v-if="!mediaItems.length" class="inline-empty"><text>媒体状态正常</text><text>现有草稿没有待处理的上传任务</text></view>
            <view v-for="task in mediaItems" :key="task.id" class="manage-row">
              <view class="row-icon media-icon"><view></view></view>
              <view class="row-copy">
                <text>{{ mediaTitle(task) }}</text>
                <text :class="{ error: isMediaProblem(task) }">{{ mediaStatusText(task) }}</text>
                <view v-if="task.status === 'uploading'" class="mini-progress"><view :style="{ width: task.progress + '%' }"></view></view>
              </view>
              <view class="row-actions">
                <view v-if="canRetryMedia(task)" class="row-button primary" @tap="retryMedia(task)">{{ task.status === 'needs_reselect' ? '去重选' : '重试' }}</view>
                <view v-else class="row-button" @tap="openDraft(task.mode, task.draftId)">打开</view>
                <view class="row-button danger" @tap="removeMedia(task)">删除</view>
              </view>
            </view>
          </scroll-view>
        </view>

        <view v-else-if="activePanel === 'privacy'" class="management-panel">
          <view class="panel-head">
            <view class="panel-title"><text>默认位置隐私</text><text>仅影响之后创建的新草稿</text></view>
            <view class="compact-button" @tap="activePanel = 'radar'"><text>返回雷达</text></view>
          </view>
          <view class="privacy-context">
            <view class="context-pin"><view></view></view>
            <view><text>{{ mapState.center.cityName || '成都' }}</text><text>{{ locationPermissionText }}</text></view>
            <view class="privacy-safe">隐私可控</view>
          </view>
          <view class="privacy-options">
            <view
              v-for="option in locationOptions"
              :key="option.id"
              class="privacy-option"
              :class="{ selected: preferences.defaultLocationPrecision === option.id }"
              @tap="setLocationPrecision(option.id)"
            >
              <view class="privacy-radio"><view></view></view>
              <view><text>{{ option.title }}</text><text>{{ option.description }}</text></view>
              <text class="selected-label">{{ preferences.defaultLocationPrecision === option.id ? '当前默认' : '选择' }}</text>
            </view>
          </view>
          <text class="panel-note">已存在的草稿继续使用各自的位置快照，不会被批量修改。</text>
        </view>

        <view v-else class="management-panel">
          <view class="panel-head">
            <view class="panel-title"><text>创作审核</text><text>跟踪审核、发布与定时计划</text></view>
            <view class="compact-button" @tap="activePanel = 'radar'"><text>返回雷达</text></view>
          </view>
          <view class="review-tabs">
            <view v-for="tab in reviewTabs" :key="tab.id" :class="{ selected: reviewFilter === tab.id }" @tap="reviewFilter = tab.id">
              <text>{{ tab.title }}</text><text>{{ tab.count }}</text>
            </view>
          </view>
          <scroll-view class="manage-list review-list" scroll-y>
            <view v-if="!filteredRecords.length" class="inline-empty"><text>暂无{{ activeReviewTitle }}内容</text><text>提交内容后可在这里查看状态</text></view>
            <view v-for="record in filteredRecords" :key="record.id" class="review-row">
              <view :class="['review-status', record.status]">{{ reviewStatusGlyph(record.status) }}</view>
              <view class="row-copy">
                <text>{{ recordTitle(record) }}</text>
                <text>{{ reviewStatusText(record) }} · {{ formatTime(record.updatedAt || record.createdAt) }}</text>
                <text v-if="record.moderation?.reason" class="error">{{ record.moderation.reason }}</text>
              </view>
              <view class="review-action" :class="{ danger: record.status === 'scheduled' }" @tap="handleRecord(record)">{{ reviewActionText(record) }}</view>
            </view>
          </scroll-view>
        </view>
      </view>

      <view class="action-dock">
        <view class="primary-action" @tap="open(entries[0])">
          <view class="primary-icon"><view class="pen-icon"></view></view>
          <view class="primary-copy"><text>发布动态</text><text>图文、视频、话题与位置</text></view>
          <view class="primary-arrow"></view>
        </view>
        <view class="secondary-grid">
          <view v-for="entry in entries.slice(1)" :key="entry.id" class="secondary-action" @tap="open(entry)">
            <view class="secondary-icon" :class="entry.id">
              <view v-if="entry.id === 'sandbox'" class="sandbox-icon"></view>
              <text v-else-if="entry.id === 'ip'">IP</text>
              <view v-else class="beacon-icon"><view></view></view>
            </view>
            <text>{{ entry.shortTitle }}</text>
          </view>
        </view>
        <text class="dock-hint">再次点击下方 × 或轻触背景即可关闭</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, onUnmounted, reactive, ref, watch } from 'vue'
import { creationApi, CREATION_STATUS, moderationApi } from '../utils/api/creation.js'
import { mediaUploadApi, MEDIA_STATUS } from '../utils/api/mediaUpload.js'
import { interestRadarApi } from '../utils/api/interestRadar.js'
import { loadMapExploreState } from '../utils/mapExploreState.js'
import {
  autosaveLabel,
  loadCreationPreferences,
  loadQuickCenterState,
  LOCATION_PRECISION_OPTIONS,
  saveCreationPreferences,
  saveQuickCenterState,
  summarizeCreationCenter
} from '../utils/creationQuickCenter.js'

const props = defineProps({ show: { type: Boolean, default: false } })
const emit = defineEmits(['close'])
const isActive = ref(false)
const activePanel = ref('radar')
const drafts = ref([])
const records = ref([])
const preferences = reactive(loadCreationPreferences())
const quickState = reactive(loadQuickCenterState())
const mapState = reactive(loadMapExploreState().state)
const locationPermissionText = ref('位置授权由系统管理')
const radarLoading = ref(false)
const radarError = ref('')
const radarRequestId = ref(0)
const reviewFilter = ref('pending')
const sphereRotationX = ref(-0.12)
const sphereRotationY = ref(0.28)
const sphereDragging = ref(false)
let sphereTouch = null
let lastSphereDragAt = 0
const radarResult = reactive({
  items: [],
  interestCount: 0,
  matchScore: 0,
  nearbyHeat: 0,
  radiusKm: mapState.spatialFilter?.radiusKm || 5,
  generatedAt: 0,
  source: ''
})
let closeTimer = null

const entries = [
  { id: 'publish', shortTitle: '发布', url: '/pages/publish/index' },
  { id: 'sandbox', shortTitle: '沙盒', url: '/pages/sandbox/index' },
  { id: 'ip', shortTitle: '原创 IP', url: '/pages/ip-publish/index' },
  { id: 'beacon', shortTitle: '新建信标', url: '/pages/publish-cocreate/index' }
]
const locationOptions = LOCATION_PRECISION_OPTIONS
const quickSummary = computed(() => summarizeCreationCenter(drafts.value, records.value))
const autosaveText = computed(() => autosaveLabel(quickSummary.value))
const mediaItems = computed(() => quickSummary.value.media.filter(task => task.status !== MEDIA_STATUS.CANCELLED).slice(0, 8))
const features = computed(() => [
  {
    id: 'media',
    title: '媒体进度可恢复',
    meta: quickSummary.value.failed + quickSummary.value.needsReselect
      ? `${quickSummary.value.failed + quickSummary.value.needsReselect} 项待处理`
      : `${quickSummary.value.media.length} 项媒体`,
    tone: 'orange'
  },
  {
    id: 'privacy',
    title: '位置隐私可控制',
    meta: precisionTitle(preferences.defaultLocationPrecision),
    tone: 'blue'
  },
  {
    id: 'review',
    title: '审核状态可追踪',
    meta: quickSummary.value.reviewPending ? `${quickSummary.value.reviewPending} 项审核中` : '状态正常',
    tone: 'green'
  }
])
const reviewTabs = computed(() => [
  { id: 'pending', title: '审核中', count: quickSummary.value.reviewPending },
  { id: 'published', title: '已发布', count: quickSummary.value.published },
  { id: 'rejected', title: '被退回', count: quickSummary.value.rejected },
  { id: 'scheduled', title: '定时', count: quickSummary.value.scheduled }
])
const statusForFilter = {
  pending: CREATION_STATUS.REVIEW_PENDING,
  published: CREATION_STATUS.PUBLISHED,
  rejected: CREATION_STATUS.REJECTED,
  scheduled: CREATION_STATUS.SCHEDULED
}
const filteredRecords = computed(() => records.value.filter(item => item.status === statusForFilter[reviewFilter.value]).slice(0, 8))
const activeReviewTitle = computed(() => reviewTabs.value.find(item => item.id === reviewFilter.value)?.title || '')
const radarSpherePoints = computed(() => projectRadarSphere(
  buildRadarSignals(radarResult.items),
  sphereRotationX.value,
  sphereRotationY.value
))
const freshnessText = computed(() => {
  if (!radarResult.generatedAt) return '等待扫描'
  const seconds = Math.max(0, Math.round((Date.now() - radarResult.generatedAt) / 1000))
  return seconds < 60 ? '刚刚更新' : `${Math.floor(seconds / 60)} 分钟前更新`
})

watch(() => props.show, value => {
  clearTimeout(closeTimer)
  isActive.value = Boolean(value)
  if (!value) return
  activePanel.value = 'radar'
  quickState.selectedRadarItemId = ''
  refreshCenterData()
  inspectLocationPermission()
  scanNearby(false)
}, { immediate: true })

onUnmounted(() => {
  clearTimeout(closeTimer)
  radarRequestId.value += 1
})

function refreshCenterData() {
  try { creationApi.processDue() } catch (e) {}
  drafts.value = creationApi.listDrafts()
  records.value = creationApi.listRecords()
}

function inspectLocationPermission() {
  if (typeof uni.getSetting !== 'function') {
    locationPermissionText.value = '浏览器定位权限由系统管理'
    return
  }
  uni.getSetting({
    success: result => {
      const state = result.authSetting?.['scope.userLocation']
      locationPermissionText.value = state === false ? '定位未授权，可在系统设置中修改' : state === true ? '定位已授权' : '首次使用时请求定位授权'
    },
    fail: () => { locationPermissionText.value = '位置授权由系统管理' }
  })
}

async function scanNearby(force = false) {
  if (radarLoading.value) return
  const requestId = ++radarRequestId.value
  radarLoading.value = true
  radarError.value = ''
  try {
    const result = await interestRadarApi.fetchNearby({
      center: mapState.center,
      bounds: null,
      radiusKm: mapState.spatialFilter?.mode === 'radius' ? mapState.spatialFilter.radiusKm : 5,
      interestTags: ['摄影', '漫步', '咖啡', '展览'],
      layers: mapState.layers,
      requestedAt: Date.now()
    }, { force })
    if (requestId !== radarRequestId.value) return
    Object.assign(radarResult, result)
    quickState.lastScanAt = result.generatedAt
    quickState.selectedRadarItemId = ''
    saveQuickCenterState(quickState)
  } catch (cause) {
    if (requestId !== radarRequestId.value) return
    radarError.value = cause?.message || '扫描失败，请检查网络后重试'
  } finally {
    if (requestId === radarRequestId.value) radarLoading.value = false
  }
}

function togglePanel(id) {
  activePanel.value = activePanel.value === id ? 'radar' : id
  if (activePanel.value !== 'radar') refreshCenterData()
}

function touchPoint(event) {
  const point = event?.touches?.[0] || event?.changedTouches?.[0]
  if (!point) return null
  return {
    x: Number(point.clientX ?? point.pageX ?? 0),
    y: Number(point.clientY ?? point.pageY ?? 0)
  }
}

function onSphereTouchStart(event) {
  const point = touchPoint(event)
  if (!point) return
  sphereDragging.value = false
  sphereTouch = {
    startX: point.x,
    startY: point.y,
    lastX: point.x,
    lastY: point.y,
    startRotationX: sphereRotationX.value,
    startRotationY: sphereRotationY.value,
    moved: false
  }
}

function onSphereTouchMove(event) {
  const point = touchPoint(event)
  if (!point || !sphereTouch) return
  const totalX = point.x - sphereTouch.startX
  const totalY = point.y - sphereTouch.startY
  if (!sphereTouch.moved && Math.hypot(totalX, totalY) > 4) {
    sphereTouch.moved = true
    sphereDragging.value = true
  }
  if (!sphereTouch.moved) return
  sphereRotationY.value = sphereTouch.startRotationY + totalX * 0.019
  sphereRotationX.value = sphereTouch.startRotationX + totalY * 0.016
  sphereTouch.lastX = point.x
  sphereTouch.lastY = point.y
}

function onSphereTouchEnd() {
  if (sphereTouch?.moved) lastSphereDragAt = Date.now()
  sphereTouch = null
  sphereRotationX.value = normalizeSphereAngle(sphereRotationX.value)
  sphereRotationY.value = normalizeSphereAngle(sphereRotationY.value)
  setTimeout(() => { sphereDragging.value = false }, 80)
}

function rotateSphere(direction) {
  sphereRotationY.value += Number(direction || 1) * 0.62
  lastSphereDragAt = Date.now()
}

function normalizeSphereAngle(value) {
  const circle = Math.PI * 2
  return ((Number(value || 0) + Math.PI) % circle + circle) % circle - Math.PI
}

function openRadarDetail(item) {
  if (sphereDragging.value || Date.now() - lastSphereDragAt < 140) return
  const card = item?.sourceItem
  const id = String(item?.detailId || card?._id || card?.id || '')
  const type = String(item?.detailType || card?.type || 'normal')
  if (!card || !id) {
    uni.showToast({ title: '关联内容暂不可用，请重新扫描', icon: 'none' })
    return
  }
  uni.setStorageSync('INDEX_LAST_ITEM', card)
  if (type === 'service') uni.setStorageSync('SERVICE_LAST_ITEM', card)
  finishClose(() => {
    uni.navigateTo({
      url: `/pages/detail/index?id=${encodeURIComponent(id)}&type=${encodeURIComponent(type)}&source=interest-radar&inline=0`
    })
  })
}

function close() {
  if (!isActive.value) return
  finishClose()
}

function finishClose(afterClose) {
  radarRequestId.value += 1
  radarLoading.value = false
  isActive.value = false
  clearTimeout(closeTimer)
  closeTimer = setTimeout(() => {
    activePanel.value = 'radar'
    quickState.selectedRadarItemId = ''
    emit('close')
    if (typeof afterClose === 'function') afterClose()
  }, 150)
}

function open(entry) {
  finishClose(() => {
    const suffix = entry.id === 'beacon'
      ? `?source=creation-space&lat=${encodeURIComponent(mapState.center.latitude)}&lng=${encodeURIComponent(mapState.center.longitude)}`
      : ''
    uni.navigateTo({ url: entry.url + suffix })
  })
}

function openDraft(mode, draftId) {
  const routes = {
    normal: '/pages/publish/index',
    sandbox: '/pages/sandbox/index',
    ip: '/pages/ip-publish/index',
    beacon: '/pages/publish-cocreate/index'
  }
  finishClose(() => uni.navigateTo({ url: `${routes[mode] || routes.normal}?draftId=${encodeURIComponent(draftId)}` }))
}

function updateTask(task, nextTask) {
  const draft = creationApi.getDraft(task.draftId)
  if (!draft) return
  draft.media = (draft.media || []).map(item => item.id === task.id ? nextTask : item)
  creationApi.saveDraft(draft)
  refreshCenterData()
}

async function retryMedia(task) {
  if (task.status === MEDIA_STATUS.NEEDS_RESELECT) return openDraft(task.mode, task.draftId)
  try {
    await mediaUploadApi.retry(task, next => updateTask(task, next))
  } catch (cause) {
    uni.showToast({ title: cause?.message || '重试失败', icon: 'none' })
  }
}

function removeMedia(task) {
  uni.showModal({
    title: '删除这项媒体？',
    content: '删除后无法从当前草稿恢复。',
    confirmColor: '#dc2626',
    success: result => {
      if (!result.confirm) return
      const draft = creationApi.getDraft(task.draftId)
      if (!draft) return
      mediaUploadApi.cancel(task)
      draft.media = (draft.media || []).filter(item => item.id !== task.id)
      creationApi.saveDraft(draft)
      refreshCenterData()
      uni.showToast({ title: '已从草稿删除', icon: 'none' })
    }
  })
}

function setLocationPrecision(id) {
  Object.assign(preferences, saveCreationPreferences({ defaultLocationPrecision: id }))
  uni.showToast({ title: `新草稿默认使用${precisionTitle(id)}`, icon: 'none' })
}

function handleRecord(record) {
  if (record.status === CREATION_STATUS.REJECTED) {
    uni.showModal({
      title: '修改并重新提交',
      content: record.moderation?.reason || '请补充内容后重新提交审核。',
      confirmText: '打开草稿',
      success: result => {
        if (!result.confirm) return
        const revised = {
          ...record.draftSnapshot,
          id: `${record.draftSnapshot.id}_revision_${Date.now()}`,
          status: CREATION_STATUS.DRAFT,
          updatedAt: Date.now()
        }
        creationApi.saveDraft(revised)
        openDraft(revised.mode, revised.id)
      }
    })
    return
  }
  if (record.status === CREATION_STATUS.SCHEDULED) {
    uni.showModal({
      title: '取消定时发布？',
      content: '取消后不会进入审核，创作记录仍会保留。',
      confirmColor: '#dc2626',
      success: result => {
        if (!result.confirm) return
        try {
          creationApi.cancelScheduled(record.id)
          refreshCenterData()
          uni.showToast({ title: '定时发布已取消', icon: 'none' })
        } catch (cause) {
          uni.showToast({ title: cause?.message || '取消失败', icon: 'none' })
        }
      }
    })
    return
  }
  if (record.status === CREATION_STATUS.REVIEW_PENDING) {
    finishClose(() => uni.navigateTo({ url: '/pages/creator-center/index?tab=review' }))
    return
  }
  finishClose(() => uni.navigateTo({ url: `/pages/publish-success/index?id=${encodeURIComponent(record.id)}` }))
}

function buildRadarSignals(items = []) {
  const points = []
  const usedTags = new Set()
  items.slice(0, 14).forEach((item, index) => {
    points.push({
      ...item,
      cloudId: `signal_${item.id}`,
      targetItem: item,
      isTag: false,
      weight: item.kind === 'person' || item.isLive ? 1.08 : index % 3 === 0 ? 1 : 0.92
    })
    ;(item.sharedInterests || []).slice(0, 2).forEach((tag, tagIndex) => {
      const tagKey = `${tag}_${item.id}`
      if (!tag || usedTags.has(tagKey) || points.length >= 32) return
      usedTags.add(tagKey)
      points.push({
        ...item,
        cloudId: `tag_${item.id}_${tagIndex}_${tag}`,
        title: tag,
        targetItem: item,
        isTag: true,
        isLive: false,
        weight: 0.7
      })
    })
  })
  return points.slice(0, 32)
}

function projectRadarSphere(points, rotationX, rotationY) {
  const count = Math.max(1, points.length)
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))
  const cosY = Math.cos(rotationY)
  const sinY = Math.sin(rotationY)
  const cosX = Math.cos(rotationX)
  const sinX = Math.sin(rotationX)
  return points.map((point, index) => {
    const y0 = 1 - 2 * ((index + 0.5) / count)
    const radius = Math.sqrt(Math.max(0, 1 - y0 * y0))
    const angle = index * goldenAngle
    const x0 = Math.cos(angle) * radius
    const z0 = Math.sin(angle) * radius
    const x1 = x0 * cosY + z0 * sinY
    const z1 = -x0 * sinY + z0 * cosY
    const y1 = y0 * cosX - z1 * sinX
    const z2 = y0 * sinX + z1 * cosX
    const depthScale = (0.72 + (z2 + 1) * 0.13) * Number(point.weight || 1)
    const visible = z2 > -0.84
    return {
      ...point,
      visible,
      position: {
        left: `${50 + x1 * 43}%`,
        top: `${50 - y1 * 43}%`,
        opacity: visible ? Math.max(0.24, 0.57 + z2 * 0.34) : 0,
        zIndex: Math.round(20 + z2 * 10),
        transform: `translate3d(-50%, -50%, 0) scale(${depthScale.toFixed(3)})`
      }
    }
  })
}

function shortTitle(value) {
  const title = String(value || '')
  return title.length > 5 ? `${title.slice(0, 5)}…` : title
}
function kindGlyph(kind) { return ({ person: '人', content: '新', event: '事', service: '服', place: '地' })[kind] || '点' }
function precisionTitle(value) { return ({ exact: '精确位置', fuzzy: '模糊位置', hidden: '隐藏位置' })[value] || '模糊位置' }
function distanceText(item) {
  const value = Number(item.distance || 0)
  return value < 1 ? `约 ${Math.max(100, Math.round(value * 10) * 100)}m` : `约 ${value.toFixed(1)}km`
}
function mediaTitle(task) { return `${task.kind === 'video' ? '视频' : '图片'} · ${task.mode === 'sandbox' ? '沙盒草稿' : task.mode === 'ip' ? 'IP 草稿' : task.mode === 'beacon' ? '信标证据' : '发布草稿'}` }
function isMediaProblem(task) { return [MEDIA_STATUS.FAILED, MEDIA_STATUS.NEEDS_RESELECT].includes(task.status) }
function canRetryMedia(task) { return [MEDIA_STATUS.FAILED, MEDIA_STATUS.NEEDS_RESELECT, MEDIA_STATUS.QUEUED].includes(task.status) }
function mediaStatusText(task) {
  return ({
    queued: '等待上传',
    uploading: `上传中 ${task.progress || 0}%`,
    succeeded: '上传完成',
    failed: task.error || '上传失败，可重试',
    needs_reselect: task.error || '临时媒体失效，需重新选择'
  })[task.status] || '状态未知'
}
function recordTitle(record) { return String(record.draftSnapshot?.text || record.draftSnapshot?.beacon?.name || '未命名创作').slice(0, 22) }
function reviewStatusText(record) {
  return ({
    review_pending: '审核中',
    published: '已发布',
    rejected: '审核退回',
    scheduled: '等待定时发布'
  })[record.status] || '创作记录'
}
function reviewStatusGlyph(status) { return ({ review_pending: '审', published: '发', rejected: '退', scheduled: '时' })[status] || '记' }
function reviewActionText(record) {
  return ({
    review_pending: '看进度',
    published: '查看',
    rejected: '修改',
    scheduled: '取消'
  })[record.status] || '查看'
}
function formatTime(value) {
  const date = new Date(Number(value || Date.now()))
  return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped>
.overlay{position:fixed;z-index:9000;inset:0;overflow:hidden;background: rgba(15,23,42,.62);opacity:0;pointer-events:none;transition:opacity 180ms ease}.overlay.active{opacity:1;pointer-events:auto}.workspace{position:absolute;left:14px;right:14px;top:calc(84px + env(safe-area-inset-top));bottom:calc(30px + env(safe-area-inset-bottom));max-width:480px;margin:0 auto;padding:12px 12px 18px;display:flex;flex-direction:column;gap:10px;border: 1px solid rgba(196,181,253,.25);border-radius:32px;color: #e2e8f0;background: linear-gradient(164deg,#29223c 0%,#171d2d 48%,#171629 100%);box-shadow:0 36px 86px rgba(2,6,23,.58),0 0 0 7px rgba(37,29,57,.24),0 -10px 34px rgba(139,92,246,.12),inset 0 1px 0 rgba(255,255,255,.1);box-sizing:border-box;transform:translateY(18px) scale(.97);transition:transform 220ms cubic-bezier(.2,.8,.2,1),opacity 180ms ease;opacity:0}.workspace::before{content:'';position:absolute;z-index:0;inset:0;border-radius:31px;pointer-events:none;box-shadow:inset 0 0 0 1px rgba(255,255,255,.035)}.workspace>view{position:relative;z-index:1}.active .workspace{transform:translateY(0) scale(1);opacity:1}
.status-card{flex:0 0 auto;padding:16px;border: 1px solid rgba(255,255,255,.09);border-radius:24px;background: linear-gradient(145deg,rgba(50,39,69,.76),rgba(25,32,47,.72));box-shadow:inset 0 1px 0 rgba(255,255,255,.035)}.status-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.eyebrow,.workspace-title{display:block}.eyebrow{color: #fdba74;font-size:10px;font-weight:800;letter-spacing:1.4px}.workspace-title{margin-top:5px;color: #fff;font-size:24px;font-weight:850}.autosave-state{min-height:36px;padding:0 11px;display:flex;align-items:center;gap:7px;border-radius:999px;color: #d1fae5;background: rgba(16,185,129,.16);font-size:11px;font-weight:750;white-space:nowrap}.autosave-state.warning{color: #ffedd5;background: rgba(234,88,12,.18)}.state-dot,.button-dot{width:7px;height:7px;border-radius:50%;background: #34d399;box-shadow:0 0 0 5px rgba(52,211,153,.12)}.autosave-state.warning .state-dot{background: #fb923c;box-shadow:0 0 0 5px rgba(251,146,60,.12)}
.feature-row{margin-top:18px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.feature-card{position:relative;min-height:82px;padding:11px 10px;display:flex;flex-direction:column;justify-content:center;gap:6px;border: 1px solid transparent;border-radius:15px;color: #e2e8f0;background: rgba(255,255,255,.065);font-size:12px;line-height:1.35;box-sizing:border-box;transition:background 180ms ease,border-color 180ms ease,transform 140ms ease}.feature-card:active{transform:scale(.97)}.feature-card.selected{border-color: rgba(255,255,255,.24);background: rgba(255,255,255,.12)}.feature-mark{width:22px;height:3px;border-radius:3px;background: #fb923c}.feature-card.blue .feature-mark{background: #60a5fa}.feature-card.green .feature-mark{background: #34d399}.feature-meta{color: #94a3b8;font-size:9px}.feature-card.selected .feature-meta{color: #dbeafe}
.content-zone{position:relative;z-index:1;flex:1;min-height:0;margin:0;border: 1px solid rgba(96,165,250,.2);border-radius:24px;background: rgba(10,17,30,.82);box-shadow:inset 0 1px 0 rgba(255,255,255,.055);overflow:hidden}.radar-panel,.management-panel{height:100%;padding:14px;display:flex;flex-direction:column;box-sizing:border-box}.panel-head{position:relative;z-index:6;flex:0 0 auto;display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.panel-title text{display:block}.panel-title text:first-child{color: #fff;font-size:16px;font-weight:800}.panel-title text:last-child{margin-top:4px;color: #fff;font-size:10px}.compact-button{min-width:76px;min-height:44px;padding:0 10px;display:flex;align-items:center;justify-content:center;gap:6px;border-radius:14px;color: #cbd5e1;background: rgba(255,255,255,.075);font-size:10px;font-weight:750;box-sizing:border-box}.compact-button.blue{color: #bfdbfe;background: rgba(37,99,235,.18)}.compact-button.disabled{opacity:.6}.compact-button .button-dot{width:6px;height:6px;background: #60a5fa;box-shadow:none}
.interest-sphere{position:relative;flex:1;min-height:220px;margin-top:8px;overflow:hidden;border: 1px solid rgba(137,157,190,.2);border-radius:18px;background-color: #11182a;background-image:radial-gradient(circle at 50% 43%,rgba(71,85,124,.3),rgba(17,24,42,0) 58%),linear-gradient(155deg,rgba(76,67,111,.13),transparent 42%),radial-gradient(circle,rgba(226,232,240,.3) 0 1px,transparent 1.15px),radial-gradient(circle,rgba(126,145,177,.17) 0 1px,transparent 1.15px);background-size:auto,auto,47px 47px,79px 79px;background-position:center,center,5px 8px,21px 27px;box-shadow:inset 0 1px 0 rgba(255,255,255,.035),inset 0 -28px 48px rgba(3,7,18,.22);touch-action:none;contain:layout paint}.sphere-surface{position:absolute;left:50%;top:-34px;height:calc(100% + 36px);width:auto;aspect-ratio:1/1;overflow:hidden;transform:translateX(-50%)}.sphere-outline{position:absolute;inset:1%;border: 1px solid rgba(143,163,197,.11);border-radius:50%}.sphere-latitude,.sphere-meridian{position:absolute;left:50%;top:50%;border: 1px solid rgba(130,151,188,.055);border-radius:50%;transform:translate(-50%,-50%)}.sphere-latitude{width:98%;height:34%}.latitude-two{height:68%}.sphere-meridian{width:34%;height:98%}.meridian-two{width:68%}.sphere-point{position:absolute;min-width:36px;min-height:36px;padding:0 1px;display:flex;align-items:center;justify-content:center;color: #d8deea;box-sizing:border-box;will-change:transform,opacity}.sphere-point.hidden{pointer-events:none}.sphere-point:active{opacity:.62!important}.sphere-node{width:13px;height:13px;margin-right:4px;display:flex;align-items:center;justify-content:center;border: 1px solid rgba(226,232,240,.28);border-radius:50%;color: #f8fafc;background: #58677d;font-size:6px;font-weight:800}.sphere-point text{max-width:80px;overflow:hidden;font-size:9px;font-weight:600;line-height:1.2;text-overflow:ellipsis;white-space:nowrap;text-shadow:0 1px 2px rgba(0,0,0,.78)}.sphere-point.person .sphere-node{background: #685f80}.sphere-point.event .sphere-node{background: #81614e}.sphere-point.service .sphere-node{background: #496d6f}.sphere-point.place .sphere-node{background: #55705d}.sphere-point.tag{min-width:26px;min-height:26px;color: #aab2c0}.sphere-point.tag .sphere-node{width:4px;height:4px;margin-right:3px;border: 0;background: #7f8a9e}.sphere-point.tag text{font-size:8px;font-weight:500}.sphere-controls{position:absolute;z-index:60;left:0;right:0;bottom:0;height:42px;display:flex;align-items:center;justify-content:space-between;pointer-events:none;background: linear-gradient(180deg,rgba(17,24,42,0),rgba(17,24,42,.93))}.sphere-controls>text{padding:5px 10px;border-radius:999px;color: #9aa5b7;background: rgba(22,30,50,.72);font-size:8px}.sphere-control{width:44px;height:42px;display:flex;align-items:center;justify-content:center;color: #b4bdcc;font-size:20px;pointer-events:auto}.interest-sphere.scanning .sphere-outline{animation:sphereBreath 1.5s ease-in-out infinite}
.interest-cloud{position:relative;flex:1;min-height:218px;margin:4px -5px 0;overflow:hidden;border-radius:20px;background-color: #0c0b18;background-image:radial-gradient(circle at 18% 24%,rgba(167,139,250,.18) 0,rgba(167,139,250,0) 28%),radial-gradient(circle at 77% 36%,rgba(45,212,191,.13) 0,rgba(45,212,191,0) 26%),radial-gradient(circle at 54% 72%,rgba(96,165,250,.13) 0,rgba(96,165,250,0) 31%);box-shadow:inset 0 0 48px rgba(2,6,23,.5)}.interest-cloud::before{content:'';position:absolute;inset:0;opacity:.48;background-image:radial-gradient(circle,rgba(255,255,255,.72) 0 1px,transparent 1.4px);background-size:37px 37px;transform:rotate(7deg)}.cloud-glow{position:absolute;border-radius:50%;filter:blur(2px);opacity:.5}.glow-one{left:12%;top:20%;width:70px;height:70px;background: radial-gradient(circle,rgba(139,92,246,.22),transparent 68%)}.glow-two{right:14%;top:30%;width:82px;height:82px;background: radial-gradient(circle,rgba(45,212,191,.18),transparent 70%)}.glow-three{left:42%;bottom:10%;width:94px;height:94px;background: radial-gradient(circle,rgba(59,130,246,.16),transparent 70%)}.cloud-scan-line{position:absolute;z-index:1;left:50%;top:51%;width:1px;height:43%;opacity:.22;background: linear-gradient(180deg,#34d399,transparent);transform-origin:top center;transform:rotate(-24deg)}.interest-cloud.scanning .cloud-scan-line{animation:cloudScan 2.4s linear infinite}.cloud-point{position:absolute;z-index:4;min-width:44px;min-height:44px;display:flex;align-items:center;justify-content:center;color: #e2e8f0;transform:translate(-50%,-50%);transition:transform 170ms ease,filter 170ms ease}.cloud-point:active,.cloud-point.selected{z-index:8;filter:brightness(1.18);transform:translate(-50%,-50%) scale(1.12)}.cloud-avatar{width:13px;height:13px;margin-right:4px;display:flex;align-items:center;justify-content:center;border: 2px solid rgba(255,255,255,.68);border-radius:50%;color: #fff;background: #60a5fa;box-shadow:0 0 0 6px rgba(96,165,250,.1),0 0 20px rgba(96,165,250,.34);font-size:7px;font-weight:850}.cloud-point text{max-width:82px;overflow:hidden;font-size:10px;font-weight:700;line-height:1.2;text-overflow:ellipsis;white-space:nowrap;text-shadow:0 2px 8px rgba(0,0,0,.9)}.cloud-point.node-large .cloud-avatar{width:23px;height:23px;margin-right:5px;font-size:10px}.cloud-point.node-large text{font-size:12px}.cloud-point.node-medium .cloud-avatar{width:18px;height:18px;font-size:8px}.cloud-point.node-medium text{font-size:11px}.cloud-point.node-small{opacity:.88}.cloud-point.person .cloud-avatar{background: #8b5cf6;box-shadow:0 0 0 7px rgba(139,92,246,.12),0 0 22px rgba(139,92,246,.42)}.cloud-point.event .cloud-avatar{background: #f97316;box-shadow:0 0 0 6px rgba(249,115,22,.1),0 0 20px rgba(249,115,22,.34)}.cloud-point.service .cloud-avatar{background: #14b8a6;box-shadow:0 0 0 6px rgba(20,184,166,.1),0 0 20px rgba(20,184,166,.34)}.cloud-point.place .cloud-avatar{background: #22c55e;box-shadow:0 0 0 6px rgba(34,197,94,.1),0 0 20px rgba(34,197,94,.34)}.cloud-point.tag{min-width:34px;min-height:34px;opacity:.68}.cloud-point.tag .cloud-avatar{width:7px;height:7px;margin-right:4px;border-width:1px;background: #c4b5fd;box-shadow:0 0 12px rgba(196,181,253,.5)}.cloud-point.tag text{font-size:9px;font-weight:600}.online-dot{position:absolute;left:6px;top:7px;width:6px;height:6px;border: 2px solid #0c0b18;border-radius:50%;background: #34d399;box-shadow:0 0 8px rgba(52,211,153,.8)}.cloud-origin{position:absolute;z-index:3;left:50%;top:52%;display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-50%)}.cloud-origin view{width:8px;height:8px;border: 3px solid rgba(167,243,208,.28);border-radius:50%;background: #34d399;box-shadow:0 0 0 7px rgba(52,211,153,.08),0 0 24px rgba(52,211,153,.4)}.cloud-origin text{margin-top:10px;color: rgba(167,243,208,.62);font-size:8px}.cloud-metrics{position:absolute;z-index:7;left:9px;right:9px;bottom:8px;height:40px;padding:0 10px;display:grid;grid-template-columns:repeat(3,1fr);align-items:center;border: 1px solid rgba(255,255,255,.08);border-radius:13px;background: rgba(15,23,42,.76);backdrop-filter:blur(10px)}.cloud-metrics>view{position:relative;text-align:center}.cloud-metrics>view+view::before{content:'';position:absolute;left:0;top:4px;bottom:4px;width:1px;background: rgba(148,163,184,.16)}.cloud-metrics text{display:block}.cloud-metrics text:first-child{color: #f8fafc;font-size:11px;font-weight:850}.cloud-metrics text:last-child{margin-top:1px;color: #f8fafc;font-size:7px}
.radar-layout{flex:1;min-height:176px;margin-top:7px;display:flex;align-items:center;justify-content:center;gap:10px}.radar-stage{position:relative;flex:0 1 230px;aspect-ratio:1/1;max-height:220px;overflow:hidden;border-radius:50%;background: radial-gradient(circle,rgba(37,99,235,.16),rgba(15,23,42,.12) 70%)}.radar-ring{position:absolute;top:50%;left:50%;border: 1px solid rgba(96,165,250,.28);border-radius:50%;transform:translate(-50%,-50%)}.ring-one{width:32%;height:32%}.ring-two{width:64%;height:64%}.ring-three{width:94%;height:94%}.radar-axis{position:absolute;left:50%;top:50%;background: rgba(96,165,250,.18);transform:translate(-50%,-50%)}.radar-axis.horizontal{width:94%;height:1px}.radar-axis.vertical{width:1px;height:94%}.radar-sweep{position:absolute;left:3%;top:calc(50% - 1px);width:47%;height:2px;border-radius:2px;background: linear-gradient(90deg,rgba(52,211,153,0),rgba(52,211,153,.95));transform-origin:100% 50%}.radar-sweep.moving{animation:radarRotate 2.2s linear infinite}.radar-core{position:absolute;z-index:2;left:50%;top:50%;width:11px;height:11px;border: 3px solid rgba(167,243,208,.32);border-radius:50%;background: #34d399;box-shadow:0 0 0 7px rgba(52,211,153,.1);transform:translate(-50%,-50%)}.radar-point{position:absolute;z-index:3;min-width:44px;min-height:44px;display:flex;align-items:center;gap:4px;color: #dbeafe;font-size:9px;font-weight:700;transform:translate(-50%,-50%);transition:transform 160ms ease}.radar-point.selected{z-index:5;transform:translate(-50%,-50%) scale(1.12)}.point-glyph{width:22px;height:22px;display:flex;align-items:center;justify-content:center;border: 2px solid rgba(255,255,255,.7);border-radius:50%;color: #fff;background: #60a5fa;box-shadow:0 0 0 5px rgba(96,165,250,.12);font-size:9px}.radar-point.person .point-glyph{background: #8b5cf6}.radar-point.event .point-glyph{background: #f97316}.radar-point.service .point-glyph{background: #14b8a6}.radar-point.place .point-glyph{background: #22c55e}.radar-point.live .point-glyph{box-shadow:0 0 0 6px rgba(249,115,22,.16)}.radar-insights{flex:0 0 118px;display:flex;flex-direction:column;gap:8px}.insight-card{padding:10px;border-radius:14px;background: rgba(255,255,255,.06)}.insight-card>view:first-child{display:flex;align-items:center;justify-content:space-between;gap:5px}.insight-card text{color: #cbd5e1;font-size:9px}.insight-card text:last-child{color: #fff;font-size:12px;font-weight:850}.insight-track{height:4px;margin-top:8px;overflow:hidden;border-radius:4px;background: rgba(148,163,184,.17)}.insight-track>view{height:100%;border-radius:4px}.match{background: #60a5fa}.heat{background: #fb923c}.distance-card{padding:10px;border: 1px solid rgba(52,211,153,.15);border-radius:14px;background: rgba(16,185,129,.08)}.distance-card text{display:block}.distance-card text:first-child{color: #a7f3d0;font-size:9px}.distance-card text:nth-child(2){margin-top:2px;color: #fff;font-size:18px;font-weight:850}.distance-card text:last-child{margin-top:3px;color: #a7f3d0;font-size:8px;line-height:1.35}
.radar-result{flex:0 0 auto;min-height:68px;padding:9px;display:flex;align-items:center;gap:9px;border: 1px solid rgba(255,255,255,.1);border-radius:17px;background: rgba(255,255,255,.065)}.result-kind{width:42px;height:42px;flex:0 0 42px;display:flex;align-items:center;justify-content:center;border-radius:13px;color: #fff;background: #60a5fa;font-size:13px;font-weight:850}.result-kind.person{background: #8b5cf6}.result-kind.event{background: #f97316}.result-kind.service{background: #14b8a6}.result-kind.place{background: #22c55e}.result-copy{flex:1;min-width:0}.result-copy>text,.result-title-line text{display:block}.result-title-line{display:flex;align-items:center;gap:5px}.result-title-line text:first-child{overflow:hidden;color: #fff;font-size:12px;font-weight:800;text-overflow:ellipsis;white-space:nowrap}.live-badge{padding:3px 5px;border-radius:7px;color: #ffedd5!important;background: rgba(234,88,12,.2);font-size:8px!important;white-space:nowrap}.result-copy>text:nth-child(2){margin-top:3px;overflow:hidden;color: #cbd5e1;font-size:9px;text-overflow:ellipsis;white-space:nowrap}.result-copy>text:last-child{margin-top:3px;color: #cbd5e1;font-size:8px}.map-action{min-width:66px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:13px;color: #dbeafe;background: #2563eb;font-size:10px;font-weight:800}.signal-strip{flex:0 0 58px;margin-top:2px;white-space:nowrap}.signal-strip-inner{display:inline-flex;gap:7px;padding:4px 0}.signal-chip{min-width:112px;height:48px;padding:0 9px;display:grid;grid-template-columns:10px 1fr;align-content:center;column-gap:6px;border-radius:13px;background: rgba(255,255,255,.055)}.signal-chip text{overflow:hidden;color: #e2e8f0;font-size:9px;text-overflow:ellipsis}.signal-chip text:last-child{grid-column:2;color: #e2e8f0;font-size:8px}.signal-dot{width:8px;height:8px;grid-row:1/3;border-radius:50%;background: #60a5fa}.signal-dot.person{background: #8b5cf6}.signal-dot.event{background: #f97316}.signal-dot.service{background: #14b8a6}.signal-dot.place{background: #22c55e}
.radar-skeleton{flex:1;display:flex;align-items:center;justify-content:center;gap:22px}.skeleton-circle{width:168px;height:168px;border-radius:50%;background: rgba(96,165,250,.08);animation:pulse 1.2s ease-in-out infinite}.skeleton-lines{width:110px}.skeleton-lines view{height:48px;margin:8px 0;border-radius:14px;background: rgba(255,255,255,.06);animation:pulse 1.2s ease-in-out infinite}.panel-empty,.inline-empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}.empty-radar{width:86px;height:86px;margin-bottom:12px;border: 1px solid rgba(96,165,250,.32);border-radius:50%;box-shadow:inset 0 0 0 24px rgba(96,165,250,.04)}.panel-empty text,.inline-empty text{display:block;color: #cbd5e1;font-size:12px}.panel-empty text:nth-child(3),.inline-empty text:last-child{margin-top:5px;color: #64748b;font-size:10px}.empty-action{min-width:104px;height:44px;margin-top:14px;display:flex;align-items:center;justify-content:center;border-radius:14px;color: #dbeafe;background: #2563eb;font-size:11px;font-weight:750}
.summary-grid{margin-top:13px;display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.summary-grid>view{min-height:64px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:14px;background: rgba(255,255,255,.055)}.summary-grid text{display:block}.summary-grid text:first-child{color: #fff;font-size:18px;font-weight:850}.summary-grid text:last-child{margin-top:3px;color: #fff;font-size:9px}.summary-grid .danger text:first-child{color: #fca5a5}.summary-grid .warning text:first-child{color: #fdba74}.manage-list{flex:1;min-height:0;margin-top:10px}.manage-row,.review-row{min-height:70px;margin-bottom:8px;padding:8px;display:flex;align-items:center;gap:9px;border: 1px solid rgba(255,255,255,.07);border-radius:15px;background: rgba(255,255,255,.045);box-sizing:border-box}.row-icon{width:42px;height:42px;flex:0 0 42px;display:flex;align-items:center;justify-content:center;border-radius:13px;background: rgba(96,165,250,.14)}.media-icon view{width:19px;height:15px;border: 2px solid #60a5fa;border-radius:4px}.row-copy{flex:1;min-width:0}.row-copy text{display:block}.row-copy text:first-child{overflow:hidden;color: #f8fafc;font-size:11px;font-weight:750;text-overflow:ellipsis;white-space:nowrap}.row-copy text:nth-child(2){margin-top:4px;color: #f8fafc;font-size:9px}.row-copy text.error{color: #fca5a5}.mini-progress{height:3px;margin-top:6px;overflow:hidden;border-radius:3px;background: rgba(148,163,184,.18)}.mini-progress view{height:100%;background: #60a5fa}.row-actions{display:flex;gap:5px}.row-button{min-width:44px;height:44px;padding:0 6px;display:flex;align-items:center;justify-content:center;border-radius:11px;color: #cbd5e1;background: rgba(255,255,255,.08);font-size:9px;box-sizing:border-box}.row-button.primary{color: #dbeafe;background: rgba(37,99,235,.25)}.row-button.danger{color: #fecaca;background: rgba(220,38,38,.15)}
.privacy-context{min-height:68px;margin-top:13px;padding:9px 11px;display:flex;align-items:center;gap:10px;border-radius:16px;background: rgba(16,185,129,.08)}.context-pin{position:relative;width:42px;height:42px;flex:0 0 42px;border-radius:13px;background: rgba(52,211,153,.14)}.context-pin::before{content:'';position:absolute;left:14px;top:9px;width:12px;height:16px;border: 2px solid #34d399;border-radius:9px 9px 9px 2px;transform:rotate(-45deg)}.context-pin view{position:absolute;left:19px;top:15px;width:5px;height:5px;border-radius:50%;background: #34d399}.privacy-context>view:nth-child(2){flex:1}.privacy-context text{display:block}.privacy-context>view:nth-child(2) text:first-child{color: #fff;font-size:13px;font-weight:800}.privacy-context>view:nth-child(2) text:last-child{margin-top:4px;color: #fff;font-size:9px}.privacy-safe{padding:6px 8px;border-radius:9px;color: #a7f3d0;background: rgba(16,185,129,.13);font-size:9px;font-weight:700}.privacy-options{margin-top:10px}.privacy-option{min-height:68px;margin-bottom:8px;padding:9px 11px;display:flex;align-items:center;gap:10px;border: 1px solid rgba(255,255,255,.07);border-radius:15px;background: rgba(255,255,255,.04)}.privacy-option.selected{border-color: rgba(96,165,250,.42);background: rgba(37,99,235,.12)}.privacy-radio{width:22px;height:22px;flex:0 0 22px;display:flex;align-items:center;justify-content:center;border: 2px solid #64748b;border-radius:50%}.privacy-option.selected .privacy-radio{border-color: #60a5fa}.privacy-option.selected .privacy-radio view{width:10px;height:10px;border-radius:50%;background: #60a5fa}.privacy-option>view:nth-child(2){flex:1}.privacy-option text{display:block}.privacy-option>view:nth-child(2) text:first-child{color: #f8fafc;font-size:12px;font-weight:750}.privacy-option>view:nth-child(2) text:last-child{margin-top:3px;color: #f8fafc;font-size:9px}.selected-label{color: #93c5fd;font-size:9px}.panel-note{display:block;margin-top:auto;padding-top:6px;color: #64748b;font-size:9px;text-align:center}
.review-tabs{margin-top:12px;display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.review-tabs>view{min-height:52px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:13px;color: #94a3b8;background: rgba(255,255,255,.045)}.review-tabs>view.selected{color: #dbeafe;background: rgba(37,99,235,.18)}.review-tabs text{display:block;font-size:9px}.review-tabs text:last-child{margin-top:2px;color: #fff;font-size:13px;font-weight:850}.review-status{width:42px;height:42px;flex:0 0 42px;display:flex;align-items:center;justify-content:center;border-radius:13px;color: #dbeafe;background: rgba(37,99,235,.18);font-size:12px;font-weight:850}.review-status.published{color: #a7f3d0;background: rgba(16,185,129,.16)}.review-status.rejected{color: #fecaca;background: rgba(220,38,38,.16)}.review-status.scheduled{color: #fde68a;background: rgba(245,158,11,.16)}.review-action{min-width:58px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:12px;color: #dbeafe;background: rgba(37,99,235,.2);font-size:9px;font-weight:750}.review-action.danger{color: #fecaca;background: rgba(220,38,38,.14)}
.action-dock{flex:0 0 auto;padding:11px;border: 1px solid rgba(255,255,255,.09);border-radius:23px;background: linear-gradient(145deg,rgba(35,31,52,.72),rgba(20,29,42,.74));box-shadow:inset 0 1px 0 rgba(255,255,255,.035)}.primary-action{min-height:72px;padding:9px 13px;display:flex;align-items:center;gap:11px;border: 1px solid rgba(255,255,255,.8);border-radius:18px;background: rgba(255,255,255,.98);box-sizing:border-box;transition:transform 140ms ease,opacity 140ms ease}.primary-action:active,.secondary-action:active{transform:scale(.97);opacity:.9}.primary-icon{width:48px;height:48px;flex:0 0 48px;display:flex;align-items:center;justify-content:center;border-radius:15px;background: #ffedd5}.pen-icon{position:relative;width:7px;height:25px;border-radius:5px;background: #ea580c;transform:rotate(42deg)}.pen-icon::after{content:'';position:absolute;left:0;bottom:-5px;border-top: 6px solid #ea580c;border-left: 3.5px solid transparent;border-right: 3.5px solid transparent}.primary-copy{flex:1}.primary-copy text{display:block}.primary-copy text:first-child{color: #0f172a;font-size:17px;font-weight:850}.primary-copy text:last-child{margin-top:4px;color: #64748b;font-size:11px}.primary-arrow{width:9px;height:9px;margin-right:4px;border-top: 2px solid #94a3b8;border-right: 2px solid #94a3b8;transform:rotate(45deg)}.secondary-grid{margin-top:9px;display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.secondary-action{min-height:68px;padding:7px 4px;display:flex;align-items:center;justify-content:center;gap:7px;border: 1px solid rgba(255,255,255,.72);border-radius:16px;color: #334155;background: rgba(255,255,255,.96);font-size:11px;font-weight:750;transition:transform 140ms ease,opacity 140ms ease}.secondary-icon{width:34px;height:34px;flex:0 0 34px;display:flex;align-items:center;justify-content:center;border-radius:11px}.secondary-icon.sandbox{background: #ede9fe}.secondary-icon.ip{color: #2563eb;background: #dbeafe;font-size:11px;font-weight:900}.secondary-icon.beacon{background: #dcfce7}.sandbox-icon{width:15px;height:15px;border: 2px solid var(--color-info);border-radius:5px;transform:rotate(45deg)}.beacon-icon{position:relative;width:15px;height:20px;border: 2px solid #16a34a;border-radius:10px 10px 10px 2px;transform:rotate(-45deg)}.beacon-icon view{position:absolute;left:4px;top:5px;width:5px;height:5px;border-radius:50%;background: #16a34a}.dock-hint{display:block;margin-top:8px;color: rgba(255,255,255,.68);font-size:9px;text-align:center}
@keyframes radarRotate{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes cloudScan{from{transform:rotate(-24deg)}to{transform:rotate(336deg)}}@keyframes sphereBreath{0%,100%{opacity:.55}50%{opacity:1}}@keyframes pulse{0%,100%{opacity:.46}50%{opacity:1}}
@media screen and (max-width:375px){.workspace{left:6px;right:6px;top:calc(78px + env(safe-area-inset-top));padding:9px;gap:8px}.status-card{padding:13px}.workspace-title{font-size:21px}.feature-row{margin-top:13px;gap:6px}.feature-card{min-height:70px;padding:8px;font-size:10px}.content-zone{border-radius:21px}.radar-panel,.management-panel{padding:11px}.radar-layout{min-height:156px;gap:5px}.radar-stage{flex-basis:190px}.radar-insights{flex-basis:104px;gap:6px}.insight-card,.distance-card{padding:8px}.radar-point text{display:none}.action-dock{padding:9px}.primary-action{min-height:66px}.secondary-action{min-height:62px;flex-direction:column;gap:3px}.dock-hint{margin-top:6px}.summary-grid>view{min-height:54px}.manage-row,.review-row{min-height:64px;padding:6px}.row-icon,.review-status{width:36px;height:36px;flex-basis:36px}.row-button{min-width:42px;padding:0 4px}.autosave-state{padding:0 8px;font-size:9px}}
@media screen and (max-height:740px){.workspace{top:calc(62px + env(safe-area-inset-top));gap:7px;padding-top:9px}.status-card{padding:11px}.workspace-title{font-size:20px}.feature-row{margin-top:9px}.feature-card{min-height:60px}.feature-meta{display:none}.interest-sphere{min-height:168px}.radar-layout{min-height:138px}.radar-stage{max-height:170px}.action-dock{padding:8px}.primary-action{min-height:58px}.primary-icon{width:42px;height:42px;flex-basis:42px}.secondary-action{min-height:54px}.dock-hint{display:none}}
@media screen and (orientation:landscape){.workspace{top:20px;bottom:20px;max-width:860px;display:grid;grid-template-columns:34% 1fr 34%;gap:10px}.status-card,.content-zone,.action-dock{min-width:0;height:100%;box-sizing:border-box}.feature-row{grid-template-columns:1fr}.feature-card{min-height:60px}.action-dock{display:flex;flex-direction:column;justify-content:center}.secondary-grid{grid-template-columns:1fr}.secondary-action{min-height:54px}.sphere-surface{top:50%;height:auto;width:112%;aspect-ratio:1/1;transform:translate(-50%,-50%)}.radar-layout{min-height:130px}.radar-result{min-height:60px}}
@media (prefers-reduced-motion:reduce){.overlay,.workspace,.feature-card,.primary-action,.secondary-action,.radar-point,.cloud-point{transition:none}.radar-sweep.moving,.interest-cloud.scanning .cloud-scan-line,.interest-sphere.scanning .sphere-outline,.skeleton-circle,.skeleton-lines view{animation:none}}

</style>

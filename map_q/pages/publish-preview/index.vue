<template>
  <view class="page">
    <GlobalNavBar title="发布预览">
      <template #left><view class="nav-btn" @tap="goBack">返回编辑</view></template>
      <template #right><view class="nav-btn primary" :class="{ disabled: submitting }" @tap="publish">{{ submitting ? '提交中' : actionText }}</view></template>
    </GlobalNavBar>

    <scroll-view v-if="draft" class="content" scroll-y :style="{ paddingTop: topOffset + 'px' }">
      <view class="notice"><view class="notice-icon"></view><text>{{ previewNotice }}</text></view>
      <view class="preview-card">
        <view class="author-row"><view class="avatar">我</view><view><text class="author">用户495</text><text class="status">发布前预览</text></view></view>
        <text v-if="draft.text" class="body">{{ draft.text }}</text>
        <view v-if="media.length" class="media-grid" :class="{ single: media.length === 1 }">
          <template v-for="item in media" :key="item.id">
            <video v-if="item.kind === 'video'" :src="item.remoteUrl || item.previewPath" controls />
            <image v-else :src="item.remoteUrl || item.previewPath" mode="aspectFill" />
          </template>
        </view>
        <view class="chips">
          <text v-for="topic in draft.topics" :key="topic.id">#{{ topic.name }}</text>
          <text v-if="draft.location.precision !== 'hidden'" class="location-chip">{{ draft.location.name }}</text>
        </view>
      </view>

      <view class="summary-card">
        <text class="section-title">发布摘要</text>
        <view class="summary-row"><text>创作模式</text><text>{{ modeText }}</text></view>
        <view class="summary-row"><text>内容类型</text><text>{{ typeText }}</text></view>
        <view class="summary-row"><text>可见范围</text><text>{{ visibilityText }}</text></view>
        <view class="summary-row"><text>位置精度</text><text>{{ precisionText }}</text></view>
        <view class="summary-row"><text>版权声明</text><text>{{ copyrightText }}</text></view>
        <view v-if="draft.mode === 'ip'" class="license-summary"><text>授权摘要</text><text>{{ licenseSummary }}</text></view>
        <view v-if="draft.mode === 'sandbox' && draft.sandbox.scheduleAt" class="license-summary"><text>定时计划</text><text>{{ formatTime(draft.sandbox.scheduleAt) }}；到期后在应用前台重新执行审核。</text></view>
      </view>

      <view v-if="Object.keys(errors).length" class="error-card" role="alert">
        <text class="section-title">发布前需要处理</text>
        <text v-for="(message,key) in errors" :key="key">{{ message }}</text>
      </view>
      <view class="safe-space"></view>
    </scroll-view>
    <view v-else class="empty"><text>未找到可预览的草稿</text><view @tap="goBack">返回编辑</view></view>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import GlobalNavBar from '../../components/common/GlobalNavBar.vue'
import { creationApi, validateCreationDraft } from '../../utils/api/creation.js'
import { ipRightsApi, validateLicenseRule } from '../../utils/api/ipRights.js'
import { getActiveCreationDraft } from '../../utils/creationCommand.js'

const draft = ref(null)
const submitting = ref(false)
const errors = reactive({})
const topOffset = uni.getStorageSync('TOP_NAV_METRICS')?.totalPx || 64
const media = computed(() => (draft.value?.media || []).filter(item => item.status === 'succeeded'))
const modeText = computed(() => ({ normal: '普通发布', sandbox: '沙盒创作', ip: 'IP 内容', beacon: '地图共创' }[draft.value?.mode] || '创作'))
const typeText = computed(() => ({ normal: '图文动态', video: '视频', article: '文章', event: '活动', place: '地点' }[draft.value?.contentType] || draft.value?.contentType))
const visibilityText = computed(() => ({ public: '公开', friends: '仅好友', private: '私密' }[draft.value?.visibility]))
const precisionText = computed(() => ({ exact: '精确位置', fuzzy: '模糊位置', hidden: '隐藏位置，不生成锚点' }[draft.value?.location?.precision]))
const copyrightText = computed(() => ({ original: '原创内容', repost: `转载 · ${draft.value?.copyright?.sourceName || '未填写来源'}`, licensed: '授权素材' }[draft.value?.copyright?.kind]))
const licenseSummary = computed(() => draft.value?.ip?.licenseRule ? ipRightsApi.buildSummary(draft.value.ip.licenseRule) : '尚未配置')
const actionText = computed(() => draft.value?.mode === 'sandbox' && draft.value?.sandbox?.scheduleAt > Date.now() ? '确认定时' : '提交审核')
const previewNotice = computed(() => draft.value?.mode === 'sandbox' ? '沙盒内容正式发布时会重新执行审核；测试分享不会进入公开流。' : '提交后先进入审核，审核中的锚点仅自己可见。')

function hydrateErrors() {
  Object.keys(errors).forEach(key => delete errors[key])
  Object.assign(errors, validateCreationDraft(draft.value))
  if (draft.value?.mode === 'ip') Object.assign(errors, validateLicenseRule(draft.value.ip?.licenseRule || {}))
}
async function publish() {
  if (!draft.value || submitting.value) return
  hydrateErrors()
  if (Object.keys(errors).length) return uni.showToast({ title: Object.values(errors)[0], icon: 'none' })
  submitting.value = true
  try {
    const record = await creationApi.submit(draft.value)
    uni.setStorageSync('CREATION_LAST_RECORD_ID', record.id)
    uni.redirectTo({ url: `/pages/publish-success/index?id=${encodeURIComponent(record.id)}` })
  } catch (cause) {
    if (cause.fields) Object.assign(errors, cause.fields)
    uni.showModal({ title: '提交失败', content: cause.message || '请检查内容后重试', showCancel: false })
  } finally {
    submitting.value = false
  }
}
function formatTime(value) {
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`
}
function goBack() { uni.navigateBack() }
onLoad(options => {
  draft.value = creationApi.getDraft(options?.draftId || getActiveCreationDraft())
  if (draft.value) hydrateErrors()
})
</script>

<style scoped>
.page { min-height: 100vh; color: #0f172a; background: var(--color-page); }.nav-btn { min-width: 76px; height: 44px; padding: 0 10px; display: flex; align-items: center; justify-content: center; border-radius: 14px; color: #475569; background: #f1f5f9; font-size: 12px; font-weight: 700; }.nav-btn.primary { color: #fff; background: #ea580c; }.nav-btn.disabled { opacity: .45; }.content { height: 100vh; padding: 14px; box-sizing: border-box; }.notice { min-height: 54px; padding: 9px 12px; display: flex; align-items: center; gap: 10px; border-radius: 16px; color: #475569; background: #eff6ff; font-size: 12px; line-height: 1.5; }.notice-icon { width: 18px; height: 18px; flex: 0 0 18px; border: 2px solid #2563eb; border-radius: 50%; position: relative; }.notice-icon::after { content: ''; position: absolute; left: 7px; top: 4px; width: 2px; height: 7px; border-radius: 1px; background: #2563eb; }.preview-card,.summary-card,.error-card { margin-top: 12px; padding: 16px; border: 1px solid #eef2f7; border-radius: 20px; background: #fff; box-shadow: 0 8px 24px rgba(15,23,42,.05); }.author-row { display: flex; align-items: center; gap: 10px; }.avatar { width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: #fff; background: #2563eb; font-weight: 800; }.author,.status { display: block; }.author { font-size: 14px; font-weight: 750; }.status { margin-top: 3px; color: #64748b; font-size: 10px; }.body { display: block; margin-top: 15px; font-size: 16px; line-height: 1.7; white-space: pre-wrap; }.media-grid { margin-top: 14px; display: grid; grid-template-columns: repeat(3,1fr); gap: 5px; overflow: hidden; border-radius: 14px; }.media-grid.single { grid-template-columns: 1fr; }.media-grid image { width: 100%; aspect-ratio: 1; }.media-grid.single image { aspect-ratio: 4/3; }.chips { margin-top: 13px; display: flex; flex-wrap: wrap; gap: 7px; }.chips text { padding: 6px 9px; border-radius: 999px; color: #1d4ed8; background: #eff6ff; font-size: 11px; }.chips .location-chip { color: #c2410c; background: #fff7ed; }.section-title { display: block; margin-bottom: 8px; font-size: 16px; font-weight: 800; }.summary-row { min-height: 43px; display: flex; align-items: center; justify-content: space-between; gap: 20px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 12px; }.summary-row text:last-child { max-width: 64%; color: #64748b; text-align: right; }.license-summary { padding: 12px 0 2px; }.license-summary text { display: block; }.license-summary text:first-child { font-size: 12px; font-weight: 700; }.license-summary text:last-child { margin-top: 5px; color: #64748b; font-size: 11px; line-height: 1.6; }.error-card { border-color: #fecaca; background: #fff; }.error-card>text:not(.section-title) { display: block; margin-top: 6px; color: #991b1b; font-size: 12px; }.safe-space { height: calc(28px + env(safe-area-inset-bottom)); }.empty { padding-top: 180px; text-align: center; color: #64748b; }.empty view { width: 120px; height: 46px; margin: 20px auto; display: flex; align-items: center; justify-content: center; border-radius: 14px; color: #fff; background: #ea580c; }
.media-grid video { width: 100%; aspect-ratio: 1; }
.media-grid.single video { aspect-ratio: 4/3; }
</style>

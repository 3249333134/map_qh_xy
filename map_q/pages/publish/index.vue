<template>
  <view class="page">
    <GlobalNavBar title="发布动态">
      <template #left><view class="nav-action secondary" @tap="leaveEditor">取消</view></template>
      <template #right><view class="nav-action preview" @tap="openPreview">预览</view></template>
    </GlobalNavBar>

    <scroll-view class="page-scroll" scroll-y :style="{ paddingTop: topOffset + 'px' }">
      <view class="editor-card">
        <text class="field-label">正文</text>
        <textarea v-model="draft.text" class="content-input" maxlength="500" placeholder="分享你的创作、想法或日常…" />
        <view class="input-meta"><text v-if="errors.content" class="field-error">{{ errors.content }}</text><text class="counter">{{ draft.text.length }}/500</text></view>
      </view>

      <CreationMediaGrid v-model="draft.media" />
      <text v-if="errors.media" class="standalone-error">{{ errors.media }}</text>

      <view class="settings-card">
        <view class="setting-row" @tap="openTypePicker"><view><text class="setting-label">内容类型</text><text class="setting-help">决定详情展示结构</text></view><view class="setting-value">{{ typeText }}<text class="chevron">›</text></view></view>
        <view class="setting-row" @tap="openTopicPicker"><view><text class="setting-label">话题</text><text class="setting-help">最多添加 5 个</text></view><view class="setting-value">{{ topicText }}<text class="chevron">›</text></view></view>
        <view class="setting-row" @tap="openMentionPicker"><view><text class="setting-label">@ 用户</text><text class="setting-help">最多选择 20 位</text></view><view class="setting-value">{{ mentionText }}<text class="chevron">›</text></view></view>
        <view class="setting-row" @tap="openLocationPicker"><view><text class="setting-label">位置</text><text class="setting-help">精确、模糊或隐藏</text></view><view class="setting-value">{{ locationText }}<text class="chevron">›</text></view></view>
      </view>

      <view class="form-card">
        <text class="section-title">谁可以看</text>
        <view class="segmented">
          <view v-for="item in visibilityOptions" :key="item.id" :class="{ active: draft.visibility === item.id }" @tap="draft.visibility = item.id">{{ item.name }}</view>
        </view>
        <text class="section-hint">{{ visibilityHint }}</text>
      </view>

      <view class="form-card">
        <text class="section-title">版权与来源</text>
        <view class="segmented copyright-tabs">
          <view v-for="item in copyrightOptions" :key="item.id" :class="{ active: draft.copyright.kind === item.id }" @tap="selectCopyright(item)">{{ item.name }}</view>
        </view>
        <view v-if="draft.copyright.kind !== 'original'" class="input-field">
          <text>{{ draft.copyright.kind === 'repost' ? '内容来源' : '授权说明' }}</text>
          <input v-if="draft.copyright.kind === 'repost'" v-model="draft.copyright.sourceName" placeholder="填写作者、机构或原始链接" />
          <textarea v-else v-model="draft.copyright.statement" maxlength="200" placeholder="填写授权主体、范围和期限" />
        </view>
        <text v-if="errors.copyright" class="field-error">{{ errors.copyright }}</text>
      </view>

      <view class="draft-tip"><view class="save-dot"></view><text>内容已自动保存为草稿</text></view>
      <view class="safe-space"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import GlobalNavBar from '../../components/common/GlobalNavBar.vue'
import CreationMediaGrid from '../../components/creation/CreationMediaGrid.vue'
import { creationApi, createCreationDraft, validateCreationDraft } from '../../utils/api/creation.js'
import { mediaUploadApi } from '../../utils/api/mediaUpload.js'
import { consumeCreationCommand, setActiveCreationDraft } from '../../utils/creationCommand.js'

const draft = reactive(createCreationDraft('normal'))
const errors = reactive({})
const topOffset = uni.getStorageSync('TOP_NAV_METRICS')?.totalPx || 64
const visibilityOptions = [{ id: 'public', name: '公开' }, { id: 'friends', name: '好友' }, { id: 'private', name: '私密' }]
const copyrightOptions = [{ id: 'original', name: '原创' }, { id: 'repost', name: '转载' }, { id: 'licensed', name: '授权素材' }]
const typeLabels = { normal: '图文动态', video: '视频', article: '文章', event: '活动' }
const typeText = computed(() => typeLabels[draft.contentType] || '图文动态')
const topicText = computed(() => draft.topics.length ? `${draft.topics.length} 个话题` : '未添加')
const mentionText = computed(() => draft.mentions.length ? `${draft.mentions.length} 位用户` : '未添加')
const locationText = computed(() => draft.location.precision === 'hidden' ? '隐藏位置' : (draft.location.name || (draft.location.precision === 'fuzzy' ? '模糊位置' : '精确位置')))
const visibilityHint = computed(() => ({ public: '公开内容审核通过后进入地图和频道。', friends: '仅好友可见，地图锚点带好友访问范围。', private: '仅自己可见，不生成地图锚点。' }[draft.visibility]))

let saveTimer = null
watch(draft, value => {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => creationApi.saveDraft(JSON.parse(JSON.stringify(value))), 500)
}, { deep: true })

function applyCommand(command) {
  if (!command) return
  if (command.applyType) draft.contentType = command.applyType
  if (command.applyTopics) draft.topics = command.applyTopics.slice(0, 5)
  if (command.applyMentions) draft.mentions = command.applyMentions.slice(0, 20)
  if (command.applyLocation) draft.location = command.applyLocation
}
function clearErrors() { Object.keys(errors).forEach(key => delete errors[key]) }
function openTypePicker() { setActiveCreationDraft(draft.id); uni.navigateTo({ url: '/pages/publish-type/index?picker=1' }) }
function openTopicPicker() { setActiveCreationDraft(draft.id); uni.navigateTo({ url: '/pages/publish-topic-picker/index' }) }
function openMentionPicker() { setActiveCreationDraft(draft.id); uni.navigateTo({ url: '/pages/publish-mention-picker/index' }) }
function openLocationPicker() { setActiveCreationDraft(draft.id); uni.navigateTo({ url: '/pages/publish-location-picker/index' }) }
function selectCopyright(item) {
  draft.copyright.kind = item.id
  if (item.id === 'original') draft.copyright = { kind: 'original', sourceName: '', statement: '原创内容，未经许可请勿转载' }
  if (item.id === 'repost') draft.copyright.statement = '转载内容，来源见标注'
  if (item.id === 'licensed') draft.copyright.statement = ''
}
function openPreview() {
  clearErrors()
  Object.assign(errors, validateCreationDraft(draft, { forSubmit: false }))
  if (Object.keys(errors).length) return uni.showToast({ title: Object.values(errors)[0], icon: 'none' })
  creationApi.saveDraft(draft)
  setActiveCreationDraft(draft.id)
  uni.navigateTo({ url: `/pages/publish-preview/index?draftId=${encodeURIComponent(draft.id)}` })
}
function leaveEditor() {
  uni.showModal({
    title: '保留当前草稿？',
    content: '保留后可在下次进入时继续编辑。',
    cancelText: '放弃',
    confirmText: '保留',
    success: result => {
      if (result.confirm) creationApi.saveDraft(draft)
      else creationApi.removeDraft(draft.id)
      uni.navigateBack({ fail: () => uni.switchTab({ url: '/pages/index/index' }) })
    }
  })
}
onLoad(options => {
  const saved = creationApi.getDraft(options?.draftId) || creationApi.getLatestDraft('normal')
  if (saved) Object.assign(draft, saved, { media: mediaUploadApi.restore(saved.media || []) })
  setActiveCreationDraft(draft.id)
})
onShow(() => applyCommand(consumeCreationCommand()))
</script>

<style scoped>
.page { min-height: 100vh; color: #0f172a; background: var(--color-page); }.nav-action { min-width: 54px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 14px; font-size: 14px; font-weight: 700; }.nav-action.secondary { color: #475569; background: #f1f5f9; }.nav-action.preview { color: #fff; background: #ea580c; }.page-scroll { height: 100vh; padding: 14px; box-sizing: border-box; }.editor-card,.settings-card,.form-card { margin-bottom: 12px; padding: 16px; border: 1px solid #eef2f7; border-radius: 20px; background: #fff; box-shadow: 0 8px 24px rgba(15,23,42,.05); }.field-label,.section-title,.section-hint,.field-error,.counter,.setting-label,.setting-help { display: block; }.field-label,.section-title { color: #0f172a; font-size: 16px; font-weight: 750; }.content-input { width: 100%; min-height: 150px; margin-top: 10px; font-size: 16px; line-height: 1.65; }.input-meta { display: flex; justify-content: space-between; gap: 10px; }.counter { margin-left: auto; color: #94a3b8; font-size: 11px; font-variant-numeric: tabular-nums; }.field-error,.standalone-error { color: #b91c1c; font-size: 12px; }.standalone-error { display: block; margin: -2px 4px 12px; }.settings-card { padding-top: 2px; padding-bottom: 2px; }.setting-row { min-height: 70px; display: flex; align-items: center; justify-content: space-between; gap: 16px; border-bottom: 1px solid #f1f5f9; }.setting-row:last-child { border-bottom: 0; }.setting-label { font-size: 14px; font-weight: 700; }.setting-help { margin-top: 4px; color: #64748b; font-size: 11px; }.setting-value { max-width: 48%; display: flex; align-items: center; color: #475569; font-size: 13px; text-align: right; }.chevron { margin-left: 7px; color: #94a3b8; font-size: 22px; }.section-hint { margin-top: 10px; color: #64748b; font-size: 11px; line-height: 1.5; }.segmented { margin-top: 13px; padding: 4px; display: grid; grid-template-columns: repeat(3,1fr); gap: 4px; border-radius: 15px; background: #f1f5f9; }.segmented view { min-height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 12px; color: #64748b; font-size: 13px; }.segmented view.active { color: #c2410c; background: #fff; box-shadow: 0 3px 10px rgba(15,23,42,.08); font-weight: 700; }.input-field { margin-top: 14px; }.input-field>text { display: block; color: #334155; font-size: 12px; font-weight: 700; }.input-field input,.input-field textarea { width: 100%; min-height: 48px; margin-top: 7px; padding: 11px 12px; border-radius: 13px; background: var(--color-page); box-sizing: border-box; font-size: 14px; }.input-field textarea { min-height: 90px; }.draft-tip { height: 44px; display: flex; align-items: center; justify-content: center; gap: 7px; color: #64748b; font-size: 11px; }.save-dot { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; }.safe-space { height: calc(34px + env(safe-area-inset-bottom)); }
</style>

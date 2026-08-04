<template>
  <view class="page">
    <GlobalNavBar title="沙盒创作">
      <template #left><view class="nav-btn" @tap="leaveEditor">关闭</view></template>
      <template #right><view class="nav-btn save" @tap="saveDraft">保存草稿</view></template>
    </GlobalNavBar>
    <scroll-view class="content" scroll-y :style="{ paddingTop: topOffset + 'px' }">
      <view class="private-banner"><view class="private-mark">沙</view><view><text>非公开创作空间</text><text>沙盒内容不会直接进入公共地图和内容流</text></view></view>
      <view class="editor-card">
        <text class="section-title">创作内容</text>
        <textarea v-model="draft.text" maxlength="500" placeholder="记录想法、实验内容或尚未完成的创作…" />
        <text class="counter">{{ draft.text.length }}/500</text>
      </view>
      <CreationMediaGrid v-model="draft.media" />
      <view class="form-card">
        <text class="section-title">沙盒分类</text>
        <view class="category-list">
          <view v-for="category in categories" :key="category" :class="{ active: draft.sandbox.category === category }" @tap="draft.sandbox.category = category">{{ category }}</view>
          <view class="add-category" @tap="addCategory">新增分类</view>
        </view>
      </view>
      <view class="settings-card">
        <view class="setting-row" @tap="openSchedule">
          <view><text>定时发布</text><text>到期后在应用前台重新执行审核</text></view>
          <view class="value">{{ scheduleText }}<text>›</text></view>
        </view>
        <view class="setting-row" @tap="openTestShare">
          <view><text>分享给指定好友测试</text><text>接收方会持续看到“非公开测试”标识</text></view>
          <view class="value">{{ recipientText }}<text>›</text></view>
        </view>
      </view>
      <view v-if="scheduled.length" class="form-card">
        <text class="section-title">已设置的定时发布</text>
        <view v-for="item in scheduled" :key="item.id" class="schedule-record">
          <view><text>{{ item.draftSnapshot.text.slice(0,24) || '沙盒内容' }}</text><text>{{ formatTime(item.moderation.nextReviewAt) }}</text></view>
          <view class="cancel-schedule" @tap="cancelSchedule(item)">取消</view>
        </view>
      </view>
      <text v-if="firstError" class="error">{{ firstError }}</text>
      <view class="safe-space"></view>
    </scroll-view>
    <view class="footer">
      <view class="footer-copy"><text>每 500ms 自动保存</text><text>草稿安全</text></view>
      <view class="preview-btn" @tap="openPreview">预览并正式发布</view>
    </view>
  </view>
</template>
<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import GlobalNavBar from '../../components/common/GlobalNavBar.vue'
import CreationMediaGrid from '../../components/creation/CreationMediaGrid.vue'
import { creationApi, createCreationDraft, sandboxApi, validateCreationDraft } from '../../utils/api/creation.js'
import { mediaUploadApi } from '../../utils/api/mediaUpload.js'
import { consumeCreationCommand, setActiveCreationDraft } from '../../utils/creationCommand.js'
const topOffset = uni.getStorageSync('TOP_NAV_METRICS')?.totalPx || 64
const draft = reactive(createCreationDraft('sandbox', { visibility: 'private' }))
const categories = ref(['灵感', '待完善', '实验内容'])
const errors = reactive({})
const scheduled = ref([])
const scheduleText = computed(() => draft.sandbox.scheduleAt ? formatTime(draft.sandbox.scheduleAt) : '未设置')
const recipientText = computed(() => draft.sandbox.testRecipients.length ? `${draft.sandbox.testRecipients.length} 位` : '未选择')
const firstError = computed(() => Object.values(errors)[0] || '')
let timer = null
watch(draft, value => {
  clearTimeout(timer)
  timer = setTimeout(() => sandboxApi.saveDraft(JSON.parse(JSON.stringify(value))), 500)
}, { deep: true })
function refreshScheduled() { scheduled.value = sandboxApi.listScheduled() }
function applyCommand(command) {
  if (!command) return
  if (command.applySchedule) draft.sandbox.scheduleAt = command.applySchedule
  if (command.applyTestRecipients) {
    draft.sandbox.testRecipients = command.applyTestRecipients
    const share = sandboxApi.shareForTest(draft, command.applyTestRecipients)
    uni.showToast({ title: `已创建非公开测试分享（${share.recipients.length} 人）`, icon: 'none' })
  }
}
function addCategory() {
  uni.showModal({ title: '新增沙盒分类', editable: true, placeholderText: '输入分类名称', success: result => {
    const value = String(result.content || '').trim()
    if (result.confirm && value) { if (!categories.value.includes(value)) categories.value.push(value); draft.sandbox.category = value }
  } })
}
function openSchedule() { saveDraft(false); setActiveCreationDraft(draft.id); uni.navigateTo({ url: '/pages/sandbox-schedule/index' }) }
function openTestShare() { saveDraft(false); setActiveCreationDraft(draft.id); uni.navigateTo({ url: '/pages/sandbox-test-share/index' }) }
function saveDraft(showToast = true) { sandboxApi.saveDraft(draft); if (showToast) uni.showToast({ title: '草稿已保存', icon: 'none' }) }
function openPreview() {
  Object.keys(errors).forEach(key => delete errors[key])
  Object.assign(errors, validateCreationDraft(draft, { forSubmit: false }))
  if (Object.keys(errors).length) return
  draft.visibility = 'public'
  saveDraft(false); setActiveCreationDraft(draft.id)
  uni.navigateTo({ url: `/pages/publish-preview/index?draftId=${encodeURIComponent(draft.id)}` })
}
function cancelSchedule(item) {
  uni.showModal({ title: '取消定时发布', content: '取消后不会进入审核，是否继续？', confirmColor: '#dc2626', success: result => {
    if (!result.confirm) return
    try { sandboxApi.cancelSchedule(item.id); refreshScheduled() } catch (cause) { uni.showToast({ title: cause.message, icon: 'none' }) }
  } })
}
function leaveEditor() {
  uni.showModal({ title: '保留沙盒草稿？', content: '沙盒会自动保存，放弃将删除当前草稿。', cancelText: '放弃', confirmText: '保留', success: result => {
    if (result.confirm) saveDraft(false); else creationApi.removeDraft(draft.id)
    uni.navigateBack({ fail: () => uni.switchTab({ url: '/pages/index/index' }) })
  } })
}
function formatTime(value) { const d = new Date(value); return `${d.getMonth()+1}月${d.getDate()}日 ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}` }
onLoad(options => {
  const saved = creationApi.getDraft(options?.draftId) || creationApi.getLatestDraft('sandbox')
  if (saved) Object.assign(draft, saved, { media: mediaUploadApi.restore(saved.media || []) })
  setActiveCreationDraft(draft.id); refreshScheduled()
})
onShow(() => { applyCommand(consumeCreationCommand()); refreshScheduled() })
</script>
<style scoped>
.page{min-height:100vh;color: #0f172a;background: var(--color-page)}.nav-btn{min-width:64px;height:44px;padding:0 10px;display:flex;align-items:center;justify-content:center;border-radius:14px;color: #475569;background: #f1f5f9;font-size:12px;font-weight:700}.nav-btn.save{color: #1d4ed8;background: #eff6ff}.content{height:100vh;padding:14px 14px 110px;box-sizing:border-box}.private-banner{min-height:66px;margin-bottom:12px;padding:10px 12px;display:flex;align-items:center;gap:11px;border-radius:18px;color: #5b21b6;background: #f5f3ff}.private-mark{width:42px;height:42px;border-radius:13px;display:flex;align-items:center;justify-content:center;color: #fff;background: var(--color-info);font-weight:800}.private-banner text{display:block}.private-banner text:first-child{font-size:14px;font-weight:750}.private-banner text:last-child{margin-top:3px;color: #6d28d9;font-size:10px}.editor-card,.form-card,.settings-card{margin-bottom:12px;padding:16px;border: 1px solid #eef2f7;border-radius:20px;background: #fff;box-shadow:0 8px 24px rgba(15,23,42,.05)}.section-title{display:block;font-size:16px;font-weight:800}.editor-card textarea{width:100%;min-height:140px;margin-top:9px;font-size:16px;line-height:1.65}.counter{display:block;color: #94a3b8;font-size:11px;text-align:right}.category-list{margin-top:13px;display:flex;flex-wrap:wrap;gap:8px}.category-list view{min-height:44px;padding:0 14px;display:flex;align-items:center;border-radius:13px;color: #475569;background: #f1f5f9;font-size:12px}.category-list view.active{color: #5b21b6;background: #ede9fe;font-weight:700}.category-list .add-category{color: #2563eb;background: #eff6ff}.settings-card{padding-top:2px;padding-bottom:2px}.setting-row{min-height:76px;display:flex;align-items:center;justify-content:space-between;gap:14px;border-bottom: 1px solid #f1f5f9}.setting-row:last-child{border-bottom: 0}.setting-row text{display:block}.setting-row>view:first-child text:first-child{font-size:14px;font-weight:700}.setting-row>view:first-child text:last-child{margin-top:4px;color: #64748b;font-size:10px}.value{max-width:42%;display:flex;align-items:center;color: #475569;font-size:11px;text-align:right}.value text{margin-left:6px;font-size:20px}.schedule-record{min-height:62px;display:flex;align-items:center;justify-content:space-between;gap:10px;border-bottom: 1px solid #f1f5f9}.schedule-record text{display:block}.schedule-record text:first-child{font-size:12px;font-weight:700}.schedule-record text:last-child{margin-top:3px;color: #64748b;font-size:10px}.cancel-schedule{min-width:60px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:13px;color: #b91c1c;background: #fef2f2;font-size:11px;font-weight:700}.error{display:block;margin:8px 4px;color: #b91c1c;font-size:12px}.footer{position:fixed;z-index:100;left:0;right:0;bottom:0;min-height:78px;padding:10px 14px calc(10px + env(safe-area-inset-bottom));display:flex;align-items:center;gap:12px;background: rgba(255,255,255,.97);border-top: 1px solid #e2e8f0;box-sizing:content-box}.footer-copy{flex:1}.footer-copy text{display:block}.footer-copy text:first-child{color: #64748b;font-size:10px}.footer-copy text:last-child{margin-top:3px;font-size:12px;font-weight:700}.preview-btn{min-width:154px;height:50px;display:flex;align-items:center;justify-content:center;border-radius:15px;color: #fff;background: #ea580c;font-size:13px;font-weight:750}.safe-space{height:20px}
</style>

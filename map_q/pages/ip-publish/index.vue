<template>
  <view class="page">
    <GlobalNavBar title="IP 内容发布">
      <template #left><view class="nav-btn" @tap="leaveEditor">取消</view></template>
      <template #right><view class="nav-btn save" @tap="saveDraft">保存</view></template>
    </GlobalNavBar>
    <scroll-view class="content" scroll-y :style="{ paddingTop: topOffset + 'px' }">
      <view class="identity-card" @tap="openIpSelector">
        <view class="ip-mark">{{ profile ? profile.name.slice(0,1) : 'IP' }}</view>
        <view class="identity-copy"><text>{{ profile?.name || '选择已认证 IP' }}</text><text :class="{ verified: profile?.verified }">{{ profile?.verificationLabel || '发布前必须选择 IP' }}</text></view>
        <text class="chevron">›</text>
      </view>
      <view v-if="profile" class="official-row" :class="{ disabled: !profile.verified }" @tap="toggleOfficial">
        <view><text>使用“官方 IP”身份</text><text>{{ profile.verified ? '发布后展示认证标识' : '权属认证完成前不可选择' }}</text></view>
        <view class="switch" :class="{ active: draft.ip.officialIdentity }"><view></view></view>
      </view>
      <view class="editor-card">
        <text class="section-title">IP 内容</text>
        <textarea v-model="draft.text" maxlength="500" placeholder="创作与 IP 世界观、角色或系列相关的内容…" />
        <text class="counter">{{ draft.text.length }}/500</text>
      </view>
      <CreationMediaGrid v-model="draft.media" />
      <view class="settings-card">
        <view class="setting-row" @tap="editTags"><view><text>IP 标签</text><text>用于系列检索与内容归档</text></view><view class="value">{{ draft.ip.tags.length ? draft.ip.tags.join('、') : '未添加' }}<text>›</text></view></view>
        <view class="setting-row" @tap="pickSeries"><view><text>所属系列</text><text>保留系列上下文</text></view><view class="value">{{ draft.ip.series || '未选择' }}<text>›</text></view></view>
        <view class="setting-row" @tap="openLicense"><view><text>授权方式</text><text>转载、商用、二创、署名和期限分别配置</text></view><view class="value">{{ draft.ip.licenseRule ? '已配置' : '未配置' }}<text>›</text></view></view>
      </view>
      <view v-if="draft.ip.licenseRule" class="license-card"><text class="section-title">授权摘要</text><text>{{ licenseSummary }}</text><text class="immutable-tip">发布时将创建不可变授权版本，后续修改不会覆盖历史订单。</text></view>
      <text v-if="firstError" class="error">{{ firstError }}</text>
      <view class="safe-space"></view>
    </scroll-view>
    <view class="footer"><view><text>结构化授权</text><text>发布后保留历史版本</text></view><view class="preview-btn" @tap="openPreview">预览并发布</view></view>
  </view>
</template>
<script setup>
import { computed, reactive, watch } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import GlobalNavBar from '../../components/common/GlobalNavBar.vue'
import CreationMediaGrid from '../../components/creation/CreationMediaGrid.vue'
import { creationApi, createCreationDraft, validateCreationDraft } from '../../utils/api/creation.js'
import { mediaUploadApi } from '../../utils/api/mediaUpload.js'
import { defaultLicenseRule, ipRightsApi, validateLicenseRule } from '../../utils/api/ipRights.js'
import { consumeCreationCommand, setActiveCreationDraft } from '../../utils/creationCommand.js'
const topOffset = uni.getStorageSync('TOP_NAV_METRICS')?.totalPx || 64
const draft = reactive(createCreationDraft('ip', { ip: { profileId: '', officialIdentity: false, tags: [], series: '', licenseRule: defaultLicenseRule() } }))
const errors = reactive({})
const profile = computed(() => ipRightsApi.getProfile(draft.ip.profileId))
const licenseSummary = computed(() => ipRightsApi.buildSummary(draft.ip.licenseRule))
const firstError = computed(() => Object.values(errors)[0] || '')
let timer = null
watch(draft, value => { clearTimeout(timer); timer = setTimeout(() => creationApi.saveDraft(JSON.parse(JSON.stringify(value))), 500) }, { deep: true })
function applyCommand(command) {
  if (!command) return
  if (command.applyIp) {
    draft.ip.profileId = command.applyIp.id
    if (!command.applyIp.verified) draft.ip.officialIdentity = false
  }
  if (command.applyLicense) draft.ip.licenseRule = command.applyLicense
}
function openIpSelector() { saveDraft(false); setActiveCreationDraft(draft.id); uni.navigateTo({ url: '/pages/ip-selector/index' }) }
function openLicense() { saveDraft(false); setActiveCreationDraft(draft.id); uni.navigateTo({ url: '/pages/ip-auth-settings/index' }) }
function toggleOfficial() {
  if (!profile.value?.verified) return uni.showToast({ title: '权属认证完成后才能使用官方 IP 身份', icon: 'none' })
  draft.ip.officialIdentity = !draft.ip.officialIdentity
}
function editTags() {
  uni.showModal({ title: 'IP 标签', editable: true, placeholderText: '使用逗号分隔，最多 5 个', content: draft.ip.tags.join(','), success: result => {
    if (result.confirm) draft.ip.tags = String(result.content || '').split(/[,，]/).map(item => item.trim()).filter(Boolean).slice(0,5)
  } })
}
function pickSeries() {
  const series = profile.value?.series || ['默认系列']
  uni.showActionSheet({ itemList: series, success: result => { draft.ip.series = series[result.tapIndex] } })
}
function saveDraft(showToast = true) { creationApi.saveDraft(draft); if (showToast) uni.showToast({ title: 'IP 草稿已保存', icon: 'none' }) }
function openPreview() {
  Object.keys(errors).forEach(key => delete errors[key])
  Object.assign(errors, validateCreationDraft(draft, { forSubmit: false }), validateLicenseRule(draft.ip.licenseRule || {}))
  if (Object.keys(errors).length) return
  saveDraft(false); setActiveCreationDraft(draft.id)
  uni.navigateTo({ url: `/pages/publish-preview/index?draftId=${encodeURIComponent(draft.id)}` })
}
function leaveEditor() {
  uni.showModal({ title: '保留 IP 草稿？', content: '保留后可继续编辑授权规则。', cancelText: '放弃', confirmText: '保留', success: result => {
    if (result.confirm) saveDraft(false); else creationApi.removeDraft(draft.id)
    uni.navigateBack({ fail: () => uni.switchTab({ url: '/pages/index/index' }) })
  } })
}
onLoad(options => {
  const saved = creationApi.getDraft(options?.draftId) || creationApi.getLatestDraft('ip')
  if (saved) Object.assign(draft, saved, { media: mediaUploadApi.restore(saved.media || []) })
  setActiveCreationDraft(draft.id)
})
onShow(() => applyCommand(consumeCreationCommand()))
</script>
<style scoped>
.page{min-height:100vh;color: #0f172a;background: var(--color-page)}.nav-btn{min-width:60px;height:44px;padding:0 10px;display:flex;align-items:center;justify-content:center;border-radius:14px;color: #475569;background: #f1f5f9;font-size:12px;font-weight:700}.nav-btn.save{color: #1d4ed8;background: #eff6ff}.content{height:100vh;padding:14px 14px 108px;box-sizing:border-box}.identity-card,.official-row,.editor-card,.settings-card,.license-card{margin-bottom:12px;border: 1px solid #eef2f7;border-radius:20px;background: #fff;box-shadow:0 8px 24px rgba(15,23,42,.05)}.identity-card{min-height:74px;padding:10px 14px;display:flex;align-items:center;gap:12px}.ip-mark{width:48px;height:48px;border-radius:15px;display:flex;align-items:center;justify-content:center;color: #fff;background: #2563eb;font-size:16px;font-weight:850}.identity-copy{flex:1}.identity-copy text{display:block}.identity-copy text:first-child{font-size:15px;font-weight:800}.identity-copy text:last-child{margin-top:4px;color: #b45309;font-size:10px}.identity-copy text.verified{color: #15803d}.chevron{color: #94a3b8;font-size:24px}.official-row{min-height:68px;padding:9px 14px;display:flex;align-items:center;justify-content:space-between;gap:12px}.official-row text{display:block}.official-row text:first-child{font-size:14px;font-weight:700}.official-row text:last-child{margin-top:4px;color: #64748b;font-size:10px}.official-row.disabled{opacity:.58}.switch{position:relative;width:48px;height:28px;border-radius:14px;background: #cbd5e1}.switch view{position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background: #cbd5e1;transition:transform 180ms ease}.switch.active{background: #ea580c}.switch.active view{transform:translateX(20px)}.editor-card,.license-card{padding:16px}.section-title{display:block;font-size:16px;font-weight:800}.editor-card textarea{width:100%;min-height:140px;margin-top:9px;font-size:16px;line-height:1.65}.counter{display:block;color: #94a3b8;font-size:11px;text-align:right}.settings-card{padding:2px 16px}.setting-row{min-height:76px;display:flex;align-items:center;justify-content:space-between;gap:14px;border-bottom: 1px solid #f1f5f9}.setting-row:last-child{border-bottom: 0}.setting-row text{display:block}.setting-row>view:first-child text:first-child{font-size:14px;font-weight:700}.setting-row>view:first-child text:last-child{margin-top:4px;color: #64748b;font-size:10px}.value{max-width:45%;display:flex;align-items:center;color: #475569;font-size:11px;text-align:right}.value text{margin-left:6px;font-size:20px}.license-card>text:nth-child(2){display:block;margin-top:10px;color: #334155;font-size:12px;line-height:1.65}.immutable-tip{display:block;margin-top:10px;padding:9px;border-radius:11px;color: #1d4ed8;background: #eff6ff;font-size:10px;line-height:1.5}.error{display:block;margin:8px 4px;color: #b91c1c;font-size:12px}.footer{position:fixed;z-index:100;left:0;right:0;bottom:0;min-height:76px;padding:10px 14px calc(10px + env(safe-area-inset-bottom));display:flex;align-items:center;gap:12px;background: rgba(255,255,255,.97);border-top: 1px solid #e2e8f0;box-sizing:content-box}.footer>view:first-child{flex:1}.footer text{display:block}.footer text:first-child{font-size:12px;font-weight:700}.footer text:last-child{margin-top:3px;color: #64748b;font-size:10px}.preview-btn{min-width:138px;height:50px;display:flex;align-items:center;justify-content:center;border-radius:15px;color: #fff;background: #ea580c;font-size:13px;font-weight:750}.safe-space{height:20px}@media(prefers-reduced-motion:reduce){.switch view{transition:none}}
</style>


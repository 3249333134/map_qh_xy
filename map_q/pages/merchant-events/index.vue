<template>
  <view class="page">
    <GlobalNavBar title="商家活动管理"><template #left><view class="back-button" @tap="goBack"><view></view></view></template></GlobalNavBar>
    <scroll-view class="content" scroll-y :style="{ paddingTop: topOffset + 'px' }">
      <view class="verification-card" :class="{ verified: profile.verificationStatus === 'verified' }">
        <view class="verification-mark"><view></view></view>
        <view class="verification-copy"><text>{{ profile.verificationStatus === 'verified' ? '主体已认证' : '主体尚未认证' }}</text><text>{{ profile.verificationStatus === 'verified' ? '可发布活动并管理报名名单' : '可以保存草稿，认证后才能公开发布' }}</text></view>
        <view class="verify-action" @tap="toggleVerification">{{ profile.verificationStatus === 'verified' ? '查看' : '演示认证' }}</view>
      </view>
      <view class="toolbar"><view><text class="page-title">我的活动</text><text class="page-subtitle">{{ events.length }} 个活动</text></view><view class="create-button" @tap="openEditor()">创建活动</view></view>
      <view v-if="!events.length" class="empty-card"><view class="empty-graphic"><view></view></view><text>还没有商家活动</text><text>创建后可管理容量、名单、取消通知和归档。</text><view @tap="openEditor()">创建第一个活动</view></view>
      <view v-for="event in events" :key="event.id" class="event-card">
        <view class="event-head"><view><text class="event-title">{{ event.title || '未命名草稿' }}</text><text class="event-meta">{{ event.locationName || '地点待完善' }} · {{ formatDate(event.startTime) }}</text></view><text class="status-chip" :class="event.status">{{ statusName(event.status) }}</text></view>
        <view class="capacity-row"><view class="capacity-copy"><text>报名人数</text><text>{{ event.registrations?.length || 0 }} / {{ event.capacity || 0 }}</text></view><view class="capacity-track"><view :style="{ width: capacityPercent(event) + '%' }"></view></view></view>
        <view class="event-actions">
          <view @tap="openEditor(event)">编辑</view>
          <view v-if="event.status === 'draft'" class="primary" @tap="publish(event)">发布</view>
          <view v-if="event.status === 'published'" @tap="showRegistrations(event)">报名名单</view>
          <view v-if="event.status === 'published'" class="danger" @tap="cancelEvent(event)">取消活动</view>
          <view v-if="['published','cancelled'].includes(event.status)" @tap="archiveEvent(event)">归档</view>
        </view>
      </view>
      <view class="bottom-space"></view>
    </scroll-view>

    <view v-if="editorOpen" class="editor-scrim" @tap="requestCloseEditor"></view>
    <view v-if="editorOpen" class="editor-sheet">
      <view class="sheet-handle"></view>
      <view class="editor-head"><view><text>活动资料</text><text>必填信息完整后才能发布</text></view><view class="close-button" @tap="requestCloseEditor"></view></view>
      <scroll-view class="editor-form" scroll-y>
        <label><text>活动名称 *</text><input v-model="form.title" placeholder="例如：周末城市摄影漫步" /></label>
        <label><text>活动地点 *</text><input v-model="form.locationName" placeholder="绑定商家地点或填写集合点" /></label>
        <label><text>开始时间 *</text><input v-model="form.startTime" placeholder="2026-08-08 15:00" /></label>
        <label><text>结束时间 *</text><input v-model="form.endTime" placeholder="2026-08-08 17:00" /></label>
        <label><text>报名截止 *</text><input v-model="form.registrationDeadline" placeholder="2026-08-07 20:00" /></label>
        <view class="two-column"><label><text>容量 *</text><input v-model.number="form.capacity" type="number" placeholder="30" /></label><label><text>费用</text><input v-model.number="form.fee" type="digit" placeholder="0" /></label></view>
        <label><text>取消规则 *</text><textarea v-model="form.cancelRule" maxlength="200" placeholder="说明免费取消时间和通知方式" /></label>
        <label><text>活动说明</text><textarea v-model="form.description" maxlength="500" placeholder="活动流程、适合人群和注意事项" /></label>
      </scroll-view>
      <view class="editor-footer"><view class="secondary-action" @tap="saveDraft">保存草稿</view><view class="primary-action" @tap="saveAndPublish">保存并发布</view></view>
    </view>
  </view>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import GlobalNavBar from '../../components/common/GlobalNavBar.vue'
import { merchantEventApi } from '../../utils/api/merchantEvent.js'
const topOffset = ref(68)
const events = ref([])
const profile = ref(merchantEventApi.getProfile())
const editorOpen = ref(false)
const form = reactive({ id: '', title: '', locationName: '', startTime: '', endTime: '', registrationDeadline: '', capacity: 30, fee: 0, cancelRule: '', description: '', status: 'draft' })
function refresh() { profile.value = merchantEventApi.getProfile(); events.value = merchantEventApi.list() }
function resetForm(event = {}) { Object.assign(form, { id: '', title: '', locationName: '', startTime: '', endTime: '', registrationDeadline: '', capacity: 30, fee: 0, cancelRule: '', description: '', status: 'draft' }, event) }
function openEditor(event) { resetForm(event); editorOpen.value = true }
function requestCloseEditor() { uni.showModal({ title: '保留活动草稿？', content: '关闭前可以保存当前填写内容。', cancelText: '放弃', confirmText: '保存', success: result => { if (result.confirm) saveDraft(); else editorOpen.value = false } }) }
function saveDraft() { merchantEventApi.saveDraft(JSON.parse(JSON.stringify(form))); editorOpen.value = false; refresh(); uni.showToast({ title: '草稿已保存', icon: 'none' }) }
function saveAndPublish() {
  try { const event = merchantEventApi.saveDraft(JSON.parse(JSON.stringify(form))); merchantEventApi.publish(event.id); editorOpen.value = false; refresh(); uni.showToast({ title: '活动已发布', icon: 'none' }) }
  catch (cause) { uni.showModal({ title: '暂不能发布', content: cause.message, showCancel: false }) }
}
function publish(event) { try { merchantEventApi.publish(event.id); refresh() } catch (cause) { uni.showModal({ title: '暂不能发布', content: cause.message, showCancel: false }) } }
function toggleVerification() {
  if (profile.value.verificationStatus === 'verified') return uni.showToast({ title: '主体认证有效', icon: 'none' })
  uni.showModal({ title: '演示主体认证', content: '本地演示会将当前商家标记为已认证，不代表真实平台审核。', success: result => { if (result.confirm) { merchantEventApi.setVerificationStatus('verified'); refresh() } } })
}
function showRegistrations(event) {
  const list = event.registrations || []
  uni.showModal({ title: `报名名单 ${list.length}/${event.capacity}`, content: list.length ? list.map((item,index) => `${index+1}. ${item.name} · ${item.status}`).join('\n') : '暂时没有用户报名', showCancel: false })
}
function cancelEvent(event) { uni.showModal({ title: '取消活动', content: '取消后所有报名记录会标记为已通知，操作不可撤销。', confirmColor: '#b91c1c', success: result => { if (result.confirm) { merchantEventApi.cancel(event.id, '商家取消活动'); refresh() } } }) }
function archiveEvent(event) { try { merchantEventApi.archive(event.id); refresh() } catch (cause) { uni.showToast({ title: cause.message, icon: 'none' }) } }
function statusName(status) { return ({ draft: '草稿', published: '报名中', cancelled: '已取消', archived: '已归档' })[status] || status }
function capacityPercent(event) { return Math.min(100, Math.round(((event.registrations?.length || 0) / Math.max(1, Number(event.capacity || 1))) * 100)) }
function formatDate(value) { if (!value) return '时间待完善'; return String(value).replace('T',' ').slice(0,16) }
function goBack() { uni.navigateBack() }
onLoad(() => { try { const metrics = uni.getStorageSync('TOP_NAV_METRICS'); if (metrics?.totalPx) topOffset.value = metrics.totalPx } catch (error) {} })
onShow(refresh)
</script>

<style scoped>
.page { min-height: 100vh; background: var(--color-page); }.back-button { width: 44px; height: 44px; border-radius: 15px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; }.back-button view { width: 10px; height: 10px; border-left: 2px solid #334155; border-bottom: 2px solid #334155; transform: rotate(45deg); }.content { height: 100vh; padding: 14px; box-sizing: border-box; }
.verification-card { display: flex; align-items: center; gap: 11px; padding: 14px; border: 1px solid #fed7aa; border-radius: 19px; background: #fff7ed; }.verification-card.verified { border-color: #bbf7d0; background: #f0fdf4; }.verification-mark { width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; background: #ffedd5; }.verified .verification-mark { background: #dcfce7; }.verification-mark view { width: 16px; height: 19px; border: 2px solid #ea580c; border-radius: 8px 8px 10px 10px; }.verified .verification-mark view { border-color: #15803d; }.verification-copy { flex: 1; }.verification-copy text,.page-title,.page-subtitle,.event-title,.event-meta,.capacity-copy text,.empty-card text,.editor-head text,.editor-form label>text { display: block; }.verification-copy text:first-child { color: #9a3412; font-size: 14px; font-weight: 750; }.verified .verification-copy text:first-child { color: #166534; }.verification-copy text:last-child { margin-top: 4px; color: #64748b; font-size: 11px; }.verify-action { min-height: 40px; padding: 0 12px; border-radius: 13px; display: flex; align-items: center; color: #9a3412; background: #fff; font-size: 12px; font-weight: 700; }
.toolbar { margin: 20px 2px 12px; display: flex; align-items: center; justify-content: space-between; }.page-title { color: #0f172a; font-size: 20px; font-weight: 800; }.page-subtitle { margin-top: 3px; color: #64748b; font-size: 11px; }.create-button { min-height: 44px; padding: 0 15px; border-radius: 14px; display: flex; align-items: center; color: #fff; background: #ea580c; font-size: 13px; font-weight: 750; }
.event-card,.empty-card { margin-bottom: 12px; padding: 15px; border: 1px solid #eef2f7; border-radius: 19px; background: #fff; box-shadow: 0 7px 22px rgba(15,23,42,.05); }.event-head { display: flex; justify-content: space-between; gap: 12px; }.event-title { color: #0f172a; font-size: 16px; font-weight: 750; }.event-meta { margin-top: 5px; color: #64748b; font-size: 11px; }.status-chip { height: 28px; padding: 0 9px; border-radius: 10px; display: flex; align-items: center; color: #475569; background: #f1f5f9; font-size: 10px; font-weight: 700; }.status-chip.published { color: #166534; background: #dcfce7; }.status-chip.cancelled { color: #991b1b; background: #fee2e2; }
.capacity-row { margin-top: 16px; }.capacity-copy { display: flex; justify-content: space-between; }.capacity-copy text { color: #64748b; font-size: 11px; }.capacity-copy text:last-child { color: #64748b; font-weight: 700; }.capacity-track { height: 6px; margin-top: 7px; overflow: hidden; border-radius: 6px; background: #e2e8f0; }.capacity-track view { height: 100%; border-radius: 6px; background: #0f9f92; }.event-actions { margin-top: 14px; display: flex; flex-wrap: wrap; gap: 8px; }.event-actions view { min-height: 40px; padding: 0 12px; border-radius: 12px; display: flex; align-items: center; color: #475569; background: #f1f5f9; font-size: 11px; font-weight: 700; }.event-actions .primary { color: #fff; background: #ea580c; }.event-actions .danger { color: #b91c1c; background: #fef2f2; }
.empty-card { padding: 38px 20px; text-align: center; }.empty-graphic { width: 62px; height: 62px; margin: auto; border-radius: 20px; display: flex; align-items: center; justify-content: center; background: #eff6ff; }.empty-graphic view { width: 25px; height: 21px; border: 3px solid #2563eb; border-radius: 6px; box-shadow: 6px 6px 0 -3px #eff6ff,6px 6px 0 0 #2563eb; }.empty-card text:nth-child(2) { margin-top: 18px; color: #0f172a; font-size: 16px; font-weight: 750; }.empty-card text:nth-child(3) { margin-top: 6px; color: #64748b; font-size: 11px; }.empty-card>view:last-child { width: 150px; height: 46px; margin: 20px auto 0; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: #fff; background: #fff; font-size: 13px; font-weight: 750; }.bottom-space { height: 40px; }
.editor-scrim { position: fixed; z-index: 1200; inset: 0; background: rgba(15,23,42,.48); }.editor-sheet { position: fixed; z-index: 1210; left: 0; right: 0; bottom: 0; height: 82vh; padding: 8px 16px calc(12px + env(safe-area-inset-bottom)); border-radius: 28px 28px 0 0; background: #fff; box-sizing: border-box; }.sheet-handle { width: 36px; height: 4px; margin: 0 auto 12px; border-radius: 4px; background: #cbd5e1; }.editor-head { display: flex; align-items: center; justify-content: space-between; }.editor-head text:first-child { color: #0f172a; font-size: 20px; font-weight: 800; }.editor-head text:last-child { margin-top: 3px; color: #64748b; font-size: 11px; }.close-button { position: relative; width: 44px; height: 44px; border-radius: 14px; background: #f1f5f9; }.close-button::before,.close-button::after { content: ''; position: absolute; left: 14px; top: 21px; width: 16px; height: 2px; background: #64748b; transform: rotate(45deg); }.close-button::after { transform: rotate(-45deg); }
.editor-form { height: calc(82vh - 146px); margin-top: 10px; }.editor-form label { display: block; padding: 10px 0; }.editor-form label>text { color: #334155; font-size: 12px; font-weight: 650; }.editor-form input,.editor-form textarea { width: 100%; min-height: 46px; margin-top: 7px; padding: 0 12px; border: 1px solid #e2e8f0; border-radius: 13px; box-sizing: border-box; font-size: 14px; }.editor-form textarea { min-height: 78px; padding-top: 12px; }.two-column { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }.editor-footer { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding-top: 10px; border-top: 1px solid #f1f5f9; }.secondary-action,.primary-action { height: 48px; border-radius: 15px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 750; }.secondary-action { color: #475569; background: #f1f5f9; }.primary-action { color: #fff; background: #ea580c; }
</style>


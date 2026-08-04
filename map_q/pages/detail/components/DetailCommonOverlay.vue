<template>
  <view>
    <view class="more-trigger" role="button" aria-label="更多操作" @tap="sheetOpen = true">
      <view class="dot"></view><view class="dot"></view><view class="dot"></view>
    </view>
    <view v-if="sheetOpen" class="scrim" @tap="sheetOpen = false"></view>
    <view v-if="sheetOpen" class="action-sheet">
      <view class="sheet-handle"></view>
      <view class="sheet-head">
        <view><text class="sheet-title">内容操作</text><text class="sheet-subtitle">{{ copyrightLabel }}</text></view>
        <view class="close-button" role="button" aria-label="关闭" @tap="sheetOpen = false"></view>
      </view>
      <view class="copyright-card">
        <view class="copyright-mark">©</view>
        <view class="row-copy"><text>{{ detail.copyright?.kind === 'repost' ? '授权转载' : '原创内容' }}</text><text>{{ detail.copyright?.statement }}</text></view>
      </view>
      <view class="action-row" @tap="openChannel"><view class="row-icon channel-icon"></view><view class="row-copy"><text>进入关联频道</text><text>{{ detail.channel?.name || '内容频道' }}</text></view><view class="chevron"></view></view>
      <view class="action-row" @tap="locateOnMap"><view class="row-icon location-icon"></view><view class="row-copy"><text>在地图中定位</text><text>{{ detail.location?.name || '查看内容所在位置' }}</text></view><view class="chevron"></view></view>
      <view class="action-row danger" @tap="report"><view class="row-icon">!</view><view class="row-copy"><text>举报内容</text><text>选择原因并提交记录</text></view><view class="chevron"></view></view>
      <view class="action-row" @tap="hide"><view class="row-icon hide-icon"></view><view class="row-copy"><text>不感兴趣</text><text>减少类似内容推荐，可撤销</text></view><view class="chevron"></view></view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { contentInteractionApi } from '../../../utils/api/contentInteraction.js'
import { setMapExploreCommand } from '../../../utils/mapExploreState.js'
const props = defineProps({ detail: { type: Object, required: true } })
const emit = defineEmits(['state-change'])
const sheetOpen = ref(false)
const copyrightLabel = computed(() => props.detail.copyright?.kind === 'repost' ? `来源：${props.detail.copyright?.sourceName || '授权来源'}` : '作者声明为原创内容')
function openChannel() { sheetOpen.value = false; uni.navigateTo({ url: `/pages/channel-detail/index?id=${encodeURIComponent(props.detail.channel?.id || '')}` }) }
function locateOnMap() {
  const location = props.detail.location
  if (!location) return uni.showToast({ title: '该内容没有位置信息', icon: 'none' })
  const point = { _id: props.detail.id, id: props.detail.id, type: props.detail.type, name: props.detail.title, description: props.detail.description, address: location.address, location: { type: 'Point', coordinates: [location.longitude, location.latitude] } }
  setMapExploreCommand({ focusPoint: point, openDetail: point, scale: 16 })
  sheetOpen.value = false
  uni.switchTab({ url: props.detail.type === 'service' ? '/pages/service/index' : '/pages/index/index' })
}
function report() {
  const reasons = ['内容不实', '侵权或抄袭', '违法违规', '骚扰或垃圾内容']
  uni.showActionSheet({ itemList: reasons, success: result => { emit('state-change', contentInteractionApi.report(props.detail.id, reasons[result.tapIndex])); sheetOpen.value = false; uni.showToast({ title: '举报已记录', icon: 'none' }) } })
}
function hide() {
  emit('state-change', contentInteractionApi.hide(props.detail.id)); sheetOpen.value = false
  uni.showModal({ title: '已减少类似推荐', content: '你可以立即撤销本次操作。', cancelText: '知道了', confirmText: '撤销', success: result => { if (result.confirm) emit('state-change', contentInteractionApi.undoHide(props.detail.id)) } })
}
</script>

<style scoped>
.more-trigger { position: fixed; z-index: 1200; right: 16px; top: calc(env(safe-area-inset-top) + 10px); width: 44px; height: 44px; border-radius: 15px; display: flex; align-items: center; justify-content: center; gap: 3px; background: rgba(255,255,255,.94); box-shadow: 0 8px 24px rgba(15,23,42,.14); }.dot { width: 4px; height: 4px; border-radius: 50%; background: #334155; }
.scrim { position: fixed; z-index: 1290; inset: 0; background: rgba(15,23,42,.48); }.action-sheet { position: fixed; z-index: 1300; left: 0; right: 0; bottom: 0; padding: 8px 16px calc(18px + env(safe-area-inset-bottom)); border-radius: 28px 28px 0 0; background: #fff; box-shadow: 0 -16px 40px rgba(15,23,42,.18); animation: sheetIn .22s ease-out; }
.sheet-handle { width: 36px; height: 4px; margin: 0 auto 14px; border-radius: 4px; background: #cbd5e1; }.sheet-head,.copyright-card,.action-row { display: flex; align-items: center; }.sheet-head { justify-content: space-between; margin-bottom: 14px; }
.sheet-title,.sheet-subtitle,.row-copy text { display: block; }.sheet-title { color: #0f172a; font-size: 20px; font-weight: 750; }.sheet-subtitle { margin-top: 3px; color: #64748b; font-size: 12px; }
.close-button { position: relative; width: 44px; height: 44px; border-radius: 15px; background: #f1f5f9; }.close-button::before,.close-button::after { content: ''; position: absolute; left: 14px; top: 21px; width: 16px; height: 2px; border-radius: 2px; background: #64748b; transform: rotate(45deg); }.close-button::after { transform: rotate(-45deg); }
.copyright-card { gap: 12px; margin-bottom: 10px; padding: 13px; border: 1px solid #fed7aa; border-radius: 16px; background: #fffaf5; }.copyright-mark,.row-icon { flex: 0 0 44px; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 14px; }.copyright-mark { color: #c2410c; background: #ffedd5; font-size: 18px; font-weight: 800; }
.row-copy { flex: 1; min-width: 0; }.row-copy text:first-child { color: #0f172a; font-size: 14px; font-weight: 700; }.row-copy text:last-child { margin-top: 3px; color: #64748b; font-size: 12px; line-height: 1.45; }.action-row { gap: 12px; min-height: 66px; border-bottom: 1px solid #f1f5f9; }.action-row:last-child { border-bottom: 0; }.row-icon { position: relative; background: #eff6ff; }.action-row.danger .row-icon { color: #b91c1c; background: #fef2f2; font-weight: 800; }
.channel-icon::before { content: ''; width: 18px; height: 14px; border: 2px solid #2563eb; border-radius: 5px; box-shadow: 4px 4px 0 -2px #eff6ff,4px 4px 0 0 #2563eb; }.location-icon::before { content: ''; width: 15px; height: 15px; border: 2px solid #2563eb; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); }.hide-icon::before { content: ''; width: 19px; height: 12px; border: 2px solid #64748b; border-radius: 50%; }.hide-icon::after { content: ''; position: absolute; width: 23px; height: 2px; background: #64748b; transform: rotate(-35deg); }
.chevron { width: 8px; height: 8px; margin-right: 6px; border-top: 2px solid #94a3b8; border-right: 2px solid #94a3b8; transform: rotate(45deg); }@keyframes sheetIn { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: translateY(0); } }@media (prefers-reduced-motion: reduce) { .action-sheet { animation: none; } }
</style>

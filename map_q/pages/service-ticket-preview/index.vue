<template>
  <view class="page" :class="{ entered }">
    <view class="hero" :style="{ paddingTop: statusBar + 'px' }">
      <view class="nav"><view class="circle" role="button" aria-label="返回" @tap="back"><view class="back"></view></view><text>Live House</text><view class="avatar">MQ</view></view>
      <view class="ambient"></view>
      <view class="ticket" aria-label="演出票根预览">
        <view class="poster"><text class="tour">心生炙热</text><text class="year">2026 TOUR</text></view>
        <view class="perforation"></view>
        <view class="ticket-copy">
          <view class="meta"><text>3月15日 周日 20:00</text><text>武汉 · MAO Livehouse</text><text>{{ event.wantSee || 154 }} 人想看</text><text class="price">¥{{ event.price }}</text></view>
          <view class="rule"></view>
          <text class="city">【武汉】帆布小镇</text><text class="name">{{ event.title }}</text>
        </view>
      </view>
      <view class="dots"><view class="active"></view><view></view><view></view></view>
    </view>
    <view class="cta mq-pressable" role="button" aria-label="了解演出详情" @tap="openDetail"><text>了解详情</text><view class="arrow"></view></view>
  </view>
</template>
<script setup>
import { ref } from 'vue'
import { onLoad, onReady } from '@dcloudio/uni-app'
import { normalizeService } from '../../utils/serviceCatalog.js'
const statusBar = ref(20)
const entered = ref(false)
const event = ref(normalizeService({ category: 'ticket', title: '心生炙热 2026巡演—武汉站', price: 120 }, 'ticket'))
onLoad(() => { try { const raw = uni.getStorageSync('SERVICE_LAST_ITEM') || {}; event.value = normalizeService(raw, 'ticket'); const info = uni.getWindowInfo?.() || uni.getSystemInfoSync(); statusBar.value = info.statusBarHeight || 20 } catch (error) {} })
onReady(() => { setTimeout(() => { entered.value = true }, 16) })
function back(){ uni.navigateBack() }
function openDetail(){ uni.setStorageSync('SERVICE_LAST_ITEM', event.value); uni.navigateTo({ url: `/pages/ticket-detail/index?id=${encodeURIComponent(event.value.id)}` }) }
</script>
<style scoped>
.page{min-height:100vh;background:var(--color-page);color:var(--color-text);overflow:hidden}.hero{position:relative;min-height:calc(100vh - 132px);padding:16px 24px 32px;display:flex;flex-direction:column;box-sizing:border-box;background:var(--color-page)}.nav{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;font-size:18px;font-weight:700}.circle,.avatar{width:46px;height:46px;border:1px solid var(--color-border);border-radius:50%;display:flex;align-items:center;justify-content:center;background:#fff}.avatar{font-size:12px}.back{width:10px;height:10px;border-left:2px solid var(--color-text);border-bottom:2px solid var(--color-text);transform:rotate(45deg)}.ambient{position:absolute;inset:90px 0 0;background:none}.ticket{position:relative;z-index:2;width:min(82vw,360px);margin:auto;filter:drop-shadow(0 26px 32px rgba(0,0,0,.36))}.poster{height:285px;padding:24px;border-radius:28px 28px 4px 4px;display:flex;flex-direction:column;justify-content:space-between;background:linear-gradient(145deg,#f0443c,#a81822);box-sizing:border-box;color:#fff}.tour{font-size:42px;font-weight:800;letter-spacing:-2px}.year{font-size:12px;letter-spacing:3px}.perforation{height:18px;background:radial-gradient(circle at 0 50%,transparent 9px,#e6423d 10px),radial-gradient(circle at 100% 50%,transparent 9px,#e6423d 10px);background-color:#e6423d}.ticket-copy{padding:18px 24px 24px;border-radius:4px 4px 28px 28px;background:#df3f3b;color:#fff}.meta text,.city,.name{display:block}.meta{display:grid;gap:8px;color:#ffe7e3;font-size:13px}.price{font-size:18px!important;font-weight:800}.rule{margin:16px 0;border-top:1px dashed rgba(255,255,255,.55)}.city{font-size:14px;font-weight:700}.name{margin-top:6px;font-size:19px;font-weight:800;line-height:1.35}.dots{position:relative;z-index:2;display:flex;justify-content:center;gap:8px}.dots view{width:6px;height:6px;border-radius:50%;background:var(--color-border)}.dots .active{width:18px;border-radius:9px;background:var(--color-text)}.cta{position:fixed;z-index:3;left:24px;right:24px;bottom:calc(28px + env(safe-area-inset-bottom));height:58px;border-radius:18px;display:flex;align-items:center;justify-content:center;gap:10px;background:var(--color-primary);box-shadow:var(--shadow-float);font-size:17px;font-weight:800;color:#fff}.arrow{width:9px;height:9px;border-top:2px solid #fff;border-right:2px solid #fff;transform:rotate(45deg)}
.ticket{opacity:.82;transform:translate3d(0,34px,0) rotate(-1.2deg) scale(.96);filter:drop-shadow(0 16px 22px rgba(0,0,0,.26));transition:opacity var(--motion-entrance) ease,transform var(--motion-entrance) var(--ease-out),filter var(--motion-entrance) ease}.entered .ticket{opacity:1;transform:translate3d(0,0,0) rotate(0) scale(1);filter:drop-shadow(0 26px 32px rgba(0,0,0,.36))}.cta{opacity:.86;transform:translate3d(0,18px,0);transition:opacity var(--motion-emphasized) ease .14s,transform var(--motion-emphasized) var(--ease-out) .14s;color:#fff}.entered .cta{opacity:1;transform:translate3d(0,0,0)}@media (prefers-reduced-motion:reduce){.ticket,.cta,.entered .ticket,.entered .cta{transition:none;transform:none;opacity:1}}
</style>

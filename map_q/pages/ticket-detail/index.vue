<template>
  <view class="page">
    <view class="ambient"></view>
    <view class="nav" :style="{ paddingTop: statusBar + 'px' }">
      <view class="round back" aria-label="返回" @tap="goBack"><view></view></view>
      <view class="nav-copy"><text>演出详情</text><text>本地演示购票</text></view>
      <view class="round more" aria-label="更多"><view></view><view></view><view></view></view>
    </view>
    <scroll-view scroll-y class="scroll" :style="{ paddingTop: statusBar + 76 + 'px' }">
      <view class="headline"><text>{{ event.title }}</text><text>{{ event.venue.name }}</text></view>
      <view class="glass ticket-summary">
        <view class="mini-poster"><text>心生</text><text>炙热</text><text>2026</text></view>
        <view class="summary-copy">
          <view class="meta-line"><view class="clock"></view><text>2026.3.15 周日 20:00</text></view>
          <view class="meta-line"><view class="pin"></view><text>{{ event.address }}</text></view>
          <text class="venue-note">约 90 分钟 · 现场安排为准</text>
          <text class="price">¥ {{ selectedPackage.price }}</text>
        </view>
      </view>

      <text class="section-label">选择日期</text>
      <scroll-view scroll-x :show-scrollbar="false" class="date-scroll"><view class="date-list">
        <view v-for="date in dates" :key="date.day" class="date-ticket mq-pressable" :class="{ active: selectedDate === date.day, disabled: date.disabled }" role="button" :aria-label="`3月${date.day}日，${date.disabled ? '已售罄' : selectedDate === date.day ? '已选择' : '可购买'}`" @tap="selectDate(date)"><view class="hole"></view><text>3月</text><text>{{ date.day }}</text><text>{{ date.disabled ? '售罄' : '可购' }}</text></view>
      </view></scroll-view>

      <view class="glass want-card">
        <view><text class="section-kicker">想看</text><view class="want-number"><text>154</text><text>人想看</text></view></view>
        <view class="want-action mq-pressable" :class="{ active: wanted }" role="button" :aria-label="wanted ? '取消想看' : '加入想看'" @tap="wanted = !wanted"><view class="heart"></view><text>{{ wanted ? '已加入' : '加入想看' }}</text></view>
      </view>

      <view class="glass package-card">
        <view class="card-heading"><text>票档</text><text>一次选择一个票档</text></view>
        <view v-for="item in event.packages" :key="item.id" class="package mq-pressable" :class="{ active: selectedPackage.id === item.id }" role="button" :aria-label="`选择${item.name}，${item.price}元`" @tap="selectedId = item.id">
          <view><text>{{ item.name }}</text><text>{{ item.description || '电子票 · 到场核销' }}</text></view><text>¥{{ item.price }}</text>
        </view>
      </view>

      <view class="glass artist">
        <view class="artist-photo">帆</view><view><text>帆布小镇乐队</text><text>29.8万粉丝 · 12场在售演出</text></view><view class="follow">关注</view>
      </view>

      <view class="glass detail-card">
        <text class="detail-title">场馆与入场</text><text>{{ event.venue.name }}</text><text>{{ event.address }}</text><text>{{ event.venue.entryNote }}</text>
        <view class="map-link" @tap="openLocation"><view class="route"></view><text>查看场馆路线</text></view>
      </view>
      <view class="glass detail-card"><text class="detail-title">退改与实名规则</text><text>{{ event.policies.cancellation }}</text><text>{{ event.policies.refund }}</text></view>
      <view class="spacer"></view>
    </scroll-view>
    <view class="footer"><view><text>¥{{ selectedPackage.price }}</text><text>{{ selectedPackage.name }} · 3月{{ selectedDate }}日</text></view><view class="buy mq-pressable" role="button" aria-label="立即购票" @tap="buy">立即购票</view></view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { normalizeService } from '../../utils/serviceCatalog.js'
const statusBar = ref(20), wanted = ref(false), selectedDate = ref(15), selectedId = ref('')
const event = ref(normalizeService({ category:'ticket', title:'心生炙热 2026巡演—武汉站', price:120 }, 'ticket'))
const dates = [{day:8,disabled:true},{day:15},{day:20},{day:28}]
const selectedPackage = computed(() => event.value.packages.find(i => i.id === selectedId.value) || event.value.packages[0])
onLoad(() => { const raw = uni.getStorageSync('SERVICE_LAST_ITEM') || {}; event.value = normalizeService(raw,'ticket'); selectedId.value = event.value.packages[0]?.id || ''; statusBar.value = (uni.getWindowInfo?.() || uni.getSystemInfoSync()).statusBarHeight || 20 })
function goBack(){ uni.navigateBack() }
function selectDate(date){ if (!date.disabled) selectedDate.value = date.day }
function openLocation(){ const c = event.value.location.coordinates; uni.openLocation({ longitude:c[0], latitude:c[1], name:event.value.venue.name, address:event.value.address }) }
function buy(){ uni.setStorageSync('BOOKING_ITEM',{ ...event.value, selectedPackage:selectedPackage.value, selectedDate:selectedDate.value }); uni.navigateTo({ url:`/pages/service-params/index?id=${encodeURIComponent(event.value.id)}&category=ticket` }) }
</script>

<style scoped>
.page{position:relative;min-height:100vh;overflow:hidden;background:var(--color-page);color:var(--color-text)}.ambient{position:absolute;inset:0 0 auto;height:430px;background:none}
.nav{position:fixed;z-index:30;left:0;right:0;top:0;padding-left:18px;padding-right:18px;padding-bottom:10px;display:flex;align-items:center;gap:12px;background:linear-gradient(180deg,rgba(246,246,245,.98),rgba(246,246,245,.90),transparent)}.round{width:46px;height:46px;flex:0 0 46px;border:1px solid var(--color-border);border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--color-surface)}.back>view{width:10px;height:10px;border-left:2px solid var(--color-text-body);border-bottom:2px solid var(--color-text-body);transform:rotate(45deg)}.more{gap:4px}.more view{width:4px;height:4px;border-radius:50%;background:var(--color-primary)}.nav-copy{flex:1;text-align:center}.nav-copy text{display:block}.nav-copy text:first-child{font-size:17px;font-weight:800}.nav-copy text:last-child{margin-top:2px;color:var(--color-text-body);font-size:10px}
.scroll{position:relative;z-index:2;height:100vh;box-sizing:border-box}.headline{padding:18px 20px;text-align:center}.headline text{display:block}.headline text:first-child{font-size:20px;font-weight:800;line-height:1.4}.headline text:last-child{margin-top:5px;color:var(--color-text-body);font-size:12px}.glass{margin:0 16px 14px;border:1px solid var(--color-border);border-radius:18px;background:var(--color-surface);box-shadow:var(--shadow-card)}
.ticket-summary{padding:16px;display:flex;gap:15px}.mini-poster{width:102px;height:130px;padding:14px;border-radius:14px;display:flex;flex-direction:column;justify-content:center;background:linear-gradient(145deg,#f23c38,#b31220);box-sizing:border-box;box-shadow:0 14px 24px rgba(0, 0, 0, 0.1);color:#fff}.mini-poster text{display:block;font-size:22px;font-weight:850}.mini-poster text:last-child{margin-top:8px;color:#ffd9d4;font-size:10px;letter-spacing:2px}.summary-copy{flex:1;display:flex;flex-direction:column;justify-content:center;gap:8px}.meta-line{display:flex;align-items:center;gap:8px;color:var(--color-text);font-size:12px}.clock{width:13px;height:13px;border:1.5px solid var(--color-text-body);border-radius:50%;position:relative}.clock:after{content:'';position:absolute;left:5px;top:2px;width:1px;height:5px;background:var(--color-surface);transform:rotate(-35deg);transform-origin:bottom}.pin{width:11px;height:11px;border:2px solid var(--color-text-body);border-radius:50% 50% 50% 0;transform:rotate(-45deg)}.venue-note{color:var(--color-text-body);font-size:10px}.price{margin-top:3px;font-size:24px;font-weight:850;font-variant-numeric:tabular-nums}
.section-label{display:block;margin:24px 18px 12px;color:var(--color-text);font-size:15px;font-weight:750}.date-scroll{white-space:nowrap}.date-list{display:inline-flex;gap:12px;padding:0 16px 10px}.date-ticket{position:relative;width:78px;height:104px;border:1px solid var(--color-border);border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--color-surface);color:var(--color-text);overflow:hidden}.date-ticket .hole{position:absolute;left:50%;top:-7px;width:14px;height:14px;transform:translateX(-50%);border-radius:50%;background:var(--color-page)}.date-ticket text{display:block}.date-ticket text:nth-child(2){font-size:11px}.date-ticket text:nth-child(3){margin:2px 0;font-size:26px;font-weight:850}.date-ticket text:last-child{font-size:9px;color:var(--color-text-body)}.date-ticket.active{border-color:var(--color-primary);background:var(--color-primary);color:#fff;box-shadow:var(--shadow-card)}.date-ticket.active text:last-child{color:#fff}.date-ticket.disabled{opacity:.38}
.want-card{padding:16px;display:flex;align-items:center;justify-content:space-between}.section-kicker{color:var(--color-text-body);font-size:12px}.want-number{display:flex;align-items:baseline;gap:7px}.want-number text:first-child{font-size:38px;font-weight:900}.want-number text:last-child{color:var(--color-text-body);font-size:12px}.want-action{min-height:44px;padding:0 14px;border-radius:14px;display:flex;align-items:center;gap:8px;background:var(--color-surface);color:var(--color-text);font-size:12px}.want-action.active{background:var(--color-primary-soft);color:var(--color-text)}.heart{width:15px;height:13px;position:relative;transform:rotate(-45deg);border-radius:2px 0 0 2px;background:currentColor}.heart:before,.heart:after{content:'';position:absolute;width:15px;height:13px;border-radius:50%;background:currentColor}.heart:before{top:-7px;left:0}.heart:after{left:7px;top:0}
.package-card{padding:16px}.card-heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}.card-heading text:first-child{font-weight:800}.card-heading text:last-child{color:var(--color-text-body);font-size:10px}.package{min-height:62px;margin-top:9px;padding:11px 13px;border:1px solid var(--color-border);border-radius:13px;display:flex;align-items:center;justify-content:space-between;background:var(--color-surface);box-sizing:border-box}.package.active{border-color:var(--color-primary);background:var(--color-primary-soft)}.package text{display:block}.package>view text:first-child{font-size:13px;font-weight:750}.package>view text:last-child{margin-top:4px;color:var(--color-text-body);font-size:10px}.package>text{color:var(--color-text);font-size:17px;font-weight:850}
.artist{padding:15px;display:flex;align-items:center;gap:12px}.artist-photo{width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:#d9b670;font-size:22px;font-weight:850}.artist>view:nth-child(2){flex:1}.artist text{display:block}.artist text:first-child{font-size:13px;font-weight:750}.artist text:last-child{margin-top:5px;color:var(--color-text-body);font-size:10px}.follow{height:40px;padding:0 14px;border-radius:12px;display:flex;align-items:center;background:var(--color-surface);color:var(--color-text);font-size:11px;font-weight:700}.detail-card{padding:16px}.detail-card>text{display:block;margin-top:7px;color:var(--color-text-body);font-size:12px;line-height:1.5}.detail-card .detail-title{margin:0 0 9px;color:var(--color-text);font-size:15px;font-weight:800}.map-link{min-height:44px;margin-top:13px;border-radius:13px;display:flex;align-items:center;justify-content:center;gap:8px;background:var(--color-primary-soft);color:var(--color-text);font-size:12px;font-weight:750}.route{width:15px;height:15px;border:2px solid currentColor;border-radius:50%;position:relative}.route:after{content:'';position:absolute;left:5px;top:5px;width:13px;border-top:2px solid currentColor;transform:rotate(-35deg)}.spacer{height:112px}
.footer{position:fixed;z-index:35;left:0;right:0;bottom:0;padding:10px 16px calc(10px + env(safe-area-inset-bottom));display:flex;align-items:center;gap:14px;background:var(--color-surface);border-top:1px solid var(--color-border)}.footer>view:first-child{flex:1}.footer text{display:block}.footer text:first-child{color:var(--color-text);font-size:22px;font-weight:900}.footer text:last-child{margin-top:2px;color:var(--color-text-body);font-size:10px}.buy{height:52px;padding:0 30px;border-radius:26px;display:flex;align-items:center;background:var(--color-primary);color:#fff;font-size:14px;font-weight:850;box-shadow:var(--shadow-card)}
.date-ticket,.package,.want-action{transition:transform var(--motion-standard) var(--ease-out),background-color var(--motion-standard) ease,border-color var(--motion-standard) ease,box-shadow var(--motion-standard) ease}.date-ticket.active{transform:translate3d(0,-4px,0)}.package.active{transform:translate3d(0,-2px,0)}@media (prefers-reduced-motion:reduce){.date-ticket.active,.package.active{transform:none}}
</style>

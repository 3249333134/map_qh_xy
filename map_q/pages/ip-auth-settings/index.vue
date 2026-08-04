<template>
  <view class="page">
    <GlobalNavBar title="结构化授权"><template #left><view class="nav-btn" @tap="goBack">取消</view></template><template #right><view class="nav-btn done" @tap="save">保存</view></template></GlobalNavBar>
    <scroll-view class="content" scroll-y :style="{ paddingTop: topOffset + 'px' }">
      <view class="form-card">
        <text class="section-title">使用权限</text>
        <view v-for="item in switches" :key="item.key" class="switch-row" @tap="rule[item.key] = !rule[item.key]">
          <view><text>{{ item.name }}</text><text>{{ item.desc }}</text></view>
          <view class="toggle" :class="{ active: rule[item.key] }"><view></view></view>
        </view>
      </view>
      <view class="form-card">
        <text class="section-title">授权范围与期限</text>
        <label class="field"><text>生效日期</text><picker mode="date" :value="rule.validFrom" @change="rule.validFrom = $event.detail.value"><view>{{ rule.validFrom }}</view></picker></label>
        <label class="field"><text>结束日期</text><picker mode="date" :value="rule.validUntil" @change="rule.validUntil = $event.detail.value"><view>{{ rule.validUntil || '长期有效' }}</view></picker></label>
        <label class="field"><text>授权地域</text><input v-model="rule.territory" placeholder="例如：中国大陆" /></label>
        <label class="field"><text>平台范围</text><input v-model="rule.platformScope" placeholder="例如：足迹平台内" /></label>
        <label class="field textarea"><text>补充规则</text><textarea v-model="rule.note" maxlength="200" placeholder="选填，不超过 200 字" /></label>
      </view>
      <view class="summary-card"><text class="section-title">授权摘要预览</text><text>{{ summary }}</text></view>
      <view v-if="Object.keys(errors).length" class="error-card"><text v-for="(message,key) in errors" :key="key">{{ message }}</text></view>
      <view class="safe-space"></view>
    </scroll-view>
  </view>
</template>
<script setup>
import { computed, reactive } from 'vue'
import GlobalNavBar from '../../components/common/GlobalNavBar.vue'
import { defaultLicenseRule, ipRightsApi, validateLicenseRule } from '../../utils/api/ipRights.js'
import { creationApi } from '../../utils/api/creation.js'
import { getActiveCreationDraft, setCreationCommand } from '../../utils/creationCommand.js'
const topOffset=uni.getStorageSync('TOP_NAV_METRICS')?.totalPx||64
const draft=creationApi.getDraft(getActiveCreationDraft())
const rule=reactive({ ...defaultLicenseRule(), ...(draft?.ip?.licenseRule||{}) })
const errors=reactive({})
const switches=[
  {key:'repostAllowed',name:'允许转载',desc:'允许他人在授权范围内分发'},
  {key:'commercialAllowed',name:'允许商用',desc:'允许用于商业推广或商品'},
  {key:'derivativeAllowed',name:'允许二创',desc:'允许改编、混剪或衍生创作'},
  {key:'attributionRequired',name:'必须署名',desc:'使用时必须展示 IP 与权利人'}
]
const summary=computed(()=>ipRightsApi.buildSummary(rule))
function save(){Object.keys(errors).forEach(k=>delete errors[k]);Object.assign(errors,validateLicenseRule(rule));if(Object.keys(errors).length)return;setCreationCommand({applyLicense:JSON.parse(JSON.stringify(rule))});uni.navigateBack()}
function goBack(){uni.navigateBack()}
</script>
<style scoped>
.page{min-height:100vh;color: #0f172a;background: var(--color-page)}.nav-btn{min-width:56px;height:44px;padding:0 10px;display:flex;align-items:center;justify-content:center;border-radius:14px;color: #475569;background: #f1f5f9;font-size:12px;font-weight:700}.nav-btn.done{color: #fff;background: #ea580c}.content{height:100vh;padding:14px;box-sizing:border-box}.form-card,.summary-card,.error-card{margin-bottom:12px;padding:16px;border: 1px solid #eef2f7;border-radius:20px;background: #fff;box-shadow:0 8px 24px rgba(15,23,42,.05)}.section-title{display:block;margin-bottom:8px;font-size:16px;font-weight:800}.switch-row{min-height:68px;display:flex;align-items:center;justify-content:space-between;gap:14px;border-bottom: 1px solid #f1f5f9}.switch-row:last-child{border-bottom: 0}.switch-row text{display:block}.switch-row text:first-child{font-size:14px;font-weight:700}.switch-row text:last-child{margin-top:4px;color: #64748b;font-size:10px}.toggle{position:relative;flex:0 0 48px;width:48px;height:28px;border-radius:14px;background: #cbd5e1}.toggle view{position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background: #cbd5e1;transition:transform 180ms ease}.toggle.active{background: #ea580c}.toggle.active view{transform:translateX(20px)}.field{display:block;padding:12px 0;border-bottom: 1px solid #f1f5f9}.field>text{display:block;color: #334155;font-size:12px;font-weight:700}.field input,.field picker,.field textarea,.field picker view{width:100%;min-height:44px;margin-top:5px;display:flex;align-items:center;font-size:14px}.field textarea{min-height:80px}.summary-card>text:last-child{display:block;color: #475569;font-size:12px;line-height:1.65}.error-card{border-color: #fecaca;background: #fff}.error-card text{display:block;margin:4px 0;color: #991b1b;font-size:12px}.safe-space{height:calc(24px + env(safe-area-inset-bottom))}@media(prefers-reduced-motion:reduce){.toggle view{transition:none}}
</style>

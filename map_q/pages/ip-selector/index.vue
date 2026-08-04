<template>
  <view class="page">
    <GlobalNavBar title="选择 IP"><template #left><view class="nav-btn" @tap="goBack">取消</view></template><template #right><view class="nav-btn done" @tap="done">完成</view></template></GlobalNavBar>
    <view class="content" :style="{ paddingTop: topOffset + 'px' }">
      <view class="notice">未认证 IP 可以作为普通关联标签，但不能使用“官方 IP”身份。</view>
      <view class="list">
        <view v-for="item in profiles" :key="item.id" class="profile" :class="{ active: selected?.id === item.id }" @tap="selected = item">
          <view class="mark">{{ item.name.slice(0,1) }}</view>
          <view class="copy"><text>{{ item.name }}</text><text :class="{ verified: item.verified }">{{ item.verificationLabel }}</text></view>
          <view class="radio"><view v-if="selected?.id === item.id"></view></view>
        </view>
      </view>
    </view>
  </view>
</template>
<script setup>
import { ref } from 'vue'
import GlobalNavBar from '../../components/common/GlobalNavBar.vue'
import { ipRightsApi } from '../../utils/api/ipRights.js'
import { setCreationCommand } from '../../utils/creationCommand.js'
const topOffset = uni.getStorageSync('TOP_NAV_METRICS')?.totalPx || 64
const profiles = ref(ipRightsApi.listProfiles())
const selected = ref(profiles.value[0] || null)
function done(){ if(!selected.value)return;setCreationCommand({applyIp:selected.value});uni.navigateBack() }
function goBack(){uni.navigateBack()}
</script>
<style scoped>
.page{min-height:100vh;background: var(--color-page)}.nav-btn{min-width:56px;height:44px;padding:0 10px;display:flex;align-items:center;justify-content:center;border-radius:14px;color: #475569;background: #f1f5f9;font-size:12px;font-weight:700}.nav-btn.done{color: #fff;background: #ea580c}.content{padding:14px}.notice{padding:12px;border-radius:15px;color: #92400e;background: #fffbeb;font-size:12px;line-height:1.55}.list{margin-top:12px;overflow:hidden;border-radius:20px;background: #fff}.profile{min-height:76px;padding:10px 14px;display:flex;align-items:center;gap:12px;border-bottom: 1px solid #f1f5f9}.profile:last-child{border-bottom: 0}.profile.active{background: #fff7ed}.mark{width:48px;height:48px;border-radius:15px;display:flex;align-items:center;justify-content:center;color: #fff;background: #2563eb;font-weight:850}.copy{flex:1}.copy text{display:block}.copy text:first-child{font-size:14px;font-weight:800}.copy text:last-child{margin-top:4px;color: #b45309;font-size:10px}.copy text.verified{color: #15803d}.radio{width:24px;height:24px;border: 2px solid #cbd5e1;border-radius:50%;display:flex;align-items:center;justify-content:center}.active .radio{border-color: #ea580c}.radio view{width:12px;height:12px;border-radius:50%;background: #ea580c}
</style>


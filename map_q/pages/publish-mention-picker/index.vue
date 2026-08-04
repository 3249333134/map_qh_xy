<template>
  <view class="page">
    <GlobalNavBar title="@ 用户"><template #left><view class="nav-btn" @tap="goBack">取消</view></template><template #right><view class="nav-btn done" @tap="done">完成 {{ selected.length }}/20</view></template></GlobalNavBar>
    <view class="content" :style="{ paddingTop: topOffset + 'px' }">
      <view class="search"><view class="search-icon"></view><input v-model="keyword" placeholder="搜索好友或群组" /></view>
      <text class="section-title">最近联系人</text>
      <view class="contact-list">
        <view v-for="item in filtered" :key="item.id" class="contact" @tap="toggle(item)">
          <view class="avatar">{{ item.name.slice(0,1) }}</view>
          <view class="copy"><text>{{ item.name }}</text><text>{{ item.subtitle }}</text></view>
          <view class="check" :class="{ active: isSelected(item) }"><view v-if="isSelected(item)"></view></view>
        </view>
      </view>
    </view>
  </view>
</template>
<script setup>
import { computed, ref } from 'vue'
import GlobalNavBar from '../../components/common/GlobalNavBar.vue'
import { setCreationCommand } from '../../utils/creationCommand.js'
const topOffset = uni.getStorageSync('TOP_NAV_METRICS')?.totalPx || 64
const keyword = ref('')
const selected = ref([])
const contacts = ref([
  { id: 'user_wang', name: '小王', subtitle: '最近聊天' },
  { id: 'user_lin', name: '设计师小林', subtitle: '共同关注城市影像' },
  { id: 'group_food', name: '美食探店群', subtitle: '群组 · 28 人' },
  { id: 'user_moon', name: '月见', subtitle: '地点频道好友' },
  { id: 'group_photo', name: '周末摄影组', subtitle: '群组 · 16 人' }
])
const filtered = computed(() => contacts.value.filter(item => !keyword.value || item.name.includes(keyword.value)))
const isSelected = item => selected.value.some(value => value.id === item.id)
function toggle(item) {
  if (isSelected(item)) selected.value = selected.value.filter(value => value.id !== item.id)
  else if (selected.value.length < 20) selected.value = [...selected.value, item]
  else uni.showToast({ title: '最多选择 20 位用户', icon: 'none' })
}
function done() { setCreationCommand({ applyMentions: selected.value }); uni.navigateBack() }
function goBack() { uni.navigateBack() }
</script>
<style scoped>
.page { min-height: 100vh; background: var(--color-page); }.nav-btn { min-width: 54px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 14px; color: #475569; background: #f1f5f9; font-size: 13px; font-weight: 700; }.nav-btn.done { padding: 0 10px; color: #fff; background: #ea580c; }.content { padding: 14px; }.search { height: 50px; padding: 0 14px; display: flex; align-items: center; gap: 10px; border-radius: 16px; background: #fff; border: 1px solid #eef2f7; }.search input { flex: 1; height: 44px; font-size: 15px; }.search-icon { width: 16px; height: 16px; border: 2px solid #64748b; border-radius: 50%; position: relative; }.search-icon::after { content: ''; position: absolute; right: -5px; bottom: -3px; width: 7px; height: 2px; border-radius: 1px; background: #64748b; transform: rotate(45deg); }.section-title { display: block; margin: 20px 4px 10px; font-size: 15px; font-weight: 800; }.contact-list { overflow: hidden; border-radius: 20px; background: #fff; }.contact { min-height: 70px; padding: 8px 14px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #f1f5f9; }.contact:last-child { border-bottom: 0; }.avatar { width: 46px; height: 46px; border-radius: 15px; display: flex; align-items: center; justify-content: center; color: #fff; background: #2563eb; font-weight: 800; }.copy { flex: 1; }.copy text { display: block; }.copy text:first-child { font-size: 14px; font-weight: 700; }.copy text:last-child { margin-top: 4px; color: #64748b; font-size: 11px; }.check { width: 24px; height: 24px; border: 2px solid #cbd5e1; border-radius: 8px; display: flex; align-items: center; justify-content: center; }.check.active { border-color: #ea580c; background: #ea580c; }.check view { width: 6px; height: 11px; border-right: 2px solid #fff; border-bottom: 2px solid #fff; transform: rotate(45deg) translate(-1px,-1px); }
</style>

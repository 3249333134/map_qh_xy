<template>
  <view class="page" :style="{ paddingTop: topOffset + 'px' }">
    <view class="status-mark"><view></view></view>
    <text class="title">{{ title }}</text>
    <text class="desc">{{ description }}</text>
    <view v-if="record" class="record-card">
      <view><text>当前状态</text><text>{{ statusText }}</text></view>
      <view><text>地图锚点</text><text>{{ record.anchorId ? '已生成候选锚点' : '未生成' }}</text></view>
      <view><text>频道记录</text><text>{{ record.channelRecordId ? '已写入' : '私密内容不写入' }}</text></view>
      <view><text>个人时间轴</text><text>已记录</text></view>
    </view>
    <view class="actions"><view class="secondary" @tap="goMessages">查看审核消息</view><view class="primary" @tap="goHome">返回地图</view></view>
  </view>
</template>
<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { creationApi, CREATION_STATUS } from '../../utils/api/creation.js'
const record = ref(null)
const topOffset = (uni.getStorageSync('TOP_NAV_METRICS')?.totalPx || 64) + 70
const statusText = computed(() => ({ review_pending: '审核中', scheduled: '等待定时发布', published: '已发布' }[record.value?.status] || '已提交'))
const title = computed(() => record.value?.status === CREATION_STATUS.SCHEDULED ? '定时发布已创建' : '内容已提交审核')
const description = computed(() => record.value?.status === CREATION_STATUS.SCHEDULED ? '到达设定时间后，会在下次打开应用时进入审核。' : '审核中的内容和候选锚点暂时只有你自己可见。')
function goMessages() { uni.switchTab({ url: '/pages/message/index' }) }
function goHome() { uni.switchTab({ url: '/pages/index/index' }) }
onLoad(options => { record.value = creationApi.getRecord(options?.id || uni.getStorageSync('CREATION_LAST_RECORD_ID')) })
</script>
<style scoped>
.page { min-height: 100vh; padding-left: 22px; padding-right: 22px; color: #0f172a; background: var(--color-page); text-align: center; box-sizing: border-box; }.status-mark { width: 76px; height: 76px; margin: 0 auto 20px; border-radius: 24px; display: flex; align-items: center; justify-content: center; background: #fff7ed; }.status-mark view { width: 22px; height: 22px; border: 3px solid #ea580c; border-radius: 50%; box-shadow: 0 0 0 7px rgba(234,88,12,.12); }.title,.desc { display: block; }.title { font-size: 23px; font-weight: 850; }.desc { margin-top: 10px; color: #64748b; font-size: 13px; line-height: 1.65; }.record-card { margin-top: 28px; padding: 7px 16px; border-radius: 20px; background: #fff; box-shadow: 0 8px 24px rgba(15,23,42,.05); text-align: left; }.record-card view { min-height: 48px; display: flex; align-items: center; justify-content: space-between; gap: 16px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 12px; }.record-card view:last-child { border-bottom: 0; }.record-card text:last-child { color: #64748b; font-weight: 700; }.actions { margin-top: 28px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }.actions view { height: 50px; display: flex; align-items: center; justify-content: center; border-radius: 15px; font-size: 13px; font-weight: 750; }.secondary { color: #475569; background: #e2e8f0; }.primary { color: #fff; background: #ea580c; }
</style>

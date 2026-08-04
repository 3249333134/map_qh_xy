<template>
  <view class="page">
    <view :style="{ height: statusBarHeight + 'px' }" />
    <view class="nav">
      <button aria-label="返回" @tap="goBack"><view class="back" /></button>
      <text>我的频道</text>
      <view class="nav-space" />
    </view>
    <view class="tabs">
      <button v-for="item in tabs" :key="item.key" :class="{ active: filter === item.key }" @tap="selectFilter(item.key)">{{ item.label }}</button>
    </view>
    <scroll-view class="list" scroll-y show-scrollbar="false">
      <view v-if="!channels.length" class="empty"><text>当前分类暂无频道</text><text>可从地图锚点或消息首页发现频道。</text></view>
      <view v-for="channel in channels" :key="channel.id" class="channel-card" @tap="openChannel(channel)">
        <view class="avatar">{{ channel.name.slice(0, 1) }}</view>
        <view class="copy">
          <view><text>{{ channel.name }}</text><text v-if="channel.starred">星标</text></view>
          <text>{{ channel.members }} 位成员 · {{ channel.online }} 位近期活跃</text>
          <text>{{ channel.archiveState === 'archived' ? '只读归档' : channel.description }}</text>
        </view>
        <view class="chevron" />
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { channelApi } from '../../utils/api/social.js'
import { setChannelOpenCommand } from '../../utils/channelOpenCommand.js'

const statusBarHeight = ref(20)
const filter = ref('all')
const channels = ref([])
const tabs = [
  { key: 'all', label: '已加入' },
  { key: 'managed', label: '管理中' },
  { key: 'starred', label: '星标' },
  { key: 'archived', label: '已归档' }
]

onMounted(() => {
  try {
    const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
    statusBarHeight.value = info.statusBarHeight || 20
  } catch (e) {}
  refresh()
})
const refresh = () => { channels.value = channelApi.list(filter.value).filter(item => filter.value !== 'all' || item.membershipState === 'joined') }
const selectFilter = key => { filter.value = key; refresh() }
const goBack = () => uni.navigateBack()
const openChannel = channel => {
  setChannelOpenCommand({ channelId: channel.id, source: 'my_channels' })
  uni.navigateTo({ url: `/pages/channel-detail/index?id=${encodeURIComponent(channel.id)}` })
}
</script>

<style scoped>
.page { height: 100vh; background: var(--color-page); color: #202633; overflow: hidden; }
.nav { height: 88rpx; padding: 0 18rpx; display: flex; align-items: center; justify-content: space-between; background: #fff; border-bottom: .03125rem solid #ECEEF2; }
.nav > text { font-size: 32rpx; font-weight: 750; }
.nav button, .nav-space { width: 72rpx; height: 72rpx; margin: 0; padding: 0; border: 0; background: transparent; display: flex; align-items: center; justify-content: center; }
.nav button::after, .tabs button::after { border: 0; }
.back { width: 20rpx; height: 20rpx; border-left: 4rpx solid #202633; border-bottom: 4rpx solid #202633; transform: rotate(45deg); }
.tabs { height: 86rpx; padding: 0 20rpx; display: flex; align-items: center; gap: 8rpx; background: #fff; }
.tabs button { flex: 1; height: 60rpx; margin: 0; padding: 0; border-radius: 30rpx; background: transparent; color: #798293; font-size: 23rpx; line-height: 60rpx; }
.tabs button.active { background: #FFF1E7; color: #C55819; font-weight: 700; }
.list { height: calc(100vh - 174rpx); box-sizing: border-box; padding: 20rpx 24rpx calc(40rpx + env(safe-area-inset-bottom)); }
.channel-card { min-height: 132rpx; margin-bottom: 16rpx; padding: 22rpx; border-radius: 20rpx; display: flex; align-items: center; gap: 18rpx; background: #fff; box-shadow: 0 5rpx 18rpx rgba(25,36,55,.04); }
.avatar { width: 76rpx; height: 76rpx; flex-shrink: 0; border-radius: 22rpx; display: flex; align-items: center; justify-content: center; background: #eaf4ff; color: #2478D3; font-size: 29rpx; font-weight: 800; }
.copy { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 6rpx; }
.copy > view { display: flex; align-items: center; gap: 10rpx; }
.copy > view text:first-child { font-size: 27rpx; font-weight: 750; }
.copy > view text:last-child { padding: 3rpx 8rpx; border-radius: 8rpx; background: #fff1d6; color: #A85B00; font-size: 18rpx; }
.copy > text { color: #7E8796; font-size: 21rpx; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.chevron { width: 14rpx; height: 14rpx; border-right: 3rpx solid #A7AFBA; border-top: 3rpx solid #A7AFBA; transform: rotate(45deg); }
.empty { margin-top: 160rpx; display: flex; flex-direction: column; align-items: center; gap: 12rpx; color: #8A93A2; font-size: 23rpx; }
.empty text:first-child { color: #4F5968; font-size: 28rpx; font-weight: 700; }
</style>

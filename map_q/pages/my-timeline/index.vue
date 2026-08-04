<template>
  <view class="page">
    <view :style="{ height: statusBarHeight + 'px' }" />
    <view class="nav">
      <button aria-label="返回" @tap="goBack"><view class="back" /></button>
      <text>{{ year }} 年度回顾</text>
      <button class="share" @tap="shareReview">分享</button>
    </view>

    <scroll-view class="content" scroll-y show-scrollbar="false">
      <view class="summary">
        <text class="summary-kicker">MY FOOTPRINT</text>
        <text class="summary-title">{{ year }}，你在城市里留下了 {{ entries.length }} 个瞬间</text>
        <text class="summary-desc">私密内容仅在本人预览中展示，分享时会自动过滤。</text>
        <view class="summary-stats">
          <view><text>{{ monthCount }}</text><text>活跃月份</text></view>
          <view><text>{{ publicCount }}</text><text>可分享记录</text></view>
          <view><text>{{ memorialCount }}</text><text>纪念点</text></view>
        </view>
      </view>

      <view class="toolbar">
        <text>时间轴</text>
        <button @tap="addMemorial">＋ 添加纪念点</button>
      </view>

      <view v-if="!entries.length" class="empty">
        <text>这一年还没有时间轴记录</text>
        <text>发布内容、参与活动或添加纪念点后会出现在这里。</text>
      </view>

      <view v-else class="timeline">
        <view v-for="group in groupedEntries" :key="group.date" class="day-group">
          <view class="date-label">{{ group.date }}</view>
          <view class="day-items">
            <view v-for="item in group.items" :key="item.id" class="timeline-item">
              <view class="type-mark" :class="item.type">{{ typeLabel(item.type) }}</view>
              <view class="item-copy">
                <view class="item-title-row">
                  <text>{{ item.title }}</text>
                  <text v-if="item.private" class="private-tag">仅自己</text>
                </view>
                <text>{{ item.sourceDeleted ? '原内容已删除，纪念点仍保留' : typeDescription(item.type) }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
      <view class="bottom-space" />
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { timelineApi } from '../../utils/api/social.js'

const statusBarHeight = ref(20)
const year = ref(new Date().getFullYear())
const entries = ref([])

onMounted(() => {
  try {
    const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
    statusBarHeight.value = info.statusBarHeight || 20
  } catch (e) {}
  const pages = getCurrentPages()
  const options = pages[pages.length - 1]?.options || {}
  year.value = Number(options.year || new Date().getFullYear())
  refresh()
})

const refresh = () => { entries.value = timelineApi.yearReview(year.value, false) }
const publicCount = computed(() => timelineApi.yearReview(year.value, true).length)
const memorialCount = computed(() => entries.value.filter(item => item.type === 'memorial').length)
const monthCount = computed(() => new Set(entries.value.map(item => new Date(item.createdAt).getMonth())).size)
const groupedEntries = computed(() => {
  const groups = {}
  entries.value.forEach(item => {
    const date = new Date(item.createdAt)
    const key = `${date.getMonth() + 1}月${date.getDate()}日`
    groups[key] = groups[key] || []
    groups[key].push(item)
  })
  return Object.keys(groups).map(date => ({ date, items: groups[date] }))
})

const typeLabel = type => ({ content: '文', service: '服', event: '活', order: '单', channel: '频', memorial: '念' })[type] || '记'
const typeDescription = type => ({ content: '发布了一条内容', service: '完成了一次服务', event: '参与了一场活动', order: '订单状态发生变化', channel: '发生了频道事件', memorial: '个人纪念点' })[type] || '时间轴记录'
const goBack = () => uni.navigateBack()
const addMemorial = () => {
  uni.showModal({
    title: '添加纪念点',
    editable: true,
    placeholderText: '写下一段值得纪念的事',
    success: ({ confirm, content }) => {
      if (!confirm || !String(content || '').trim()) return
      timelineApi.addMemorial({ title: String(content).trim() })
      refresh()
    }
  })
}
const shareReview = () => {
  const count = timelineApi.yearReview(year.value, true).length
  uni.showModal({
    title: '隐私检查完成',
    content: `将分享 ${count} 条公开记录，私密内容不会包含在年度回顾中。`,
    confirmText: '继续分享',
    success: ({ confirm }) => { if (confirm) uni.showToast({ title: '分享卡片已准备', icon: 'none' }) }
  })
}
</script>

<style scoped>
.page { min-height: 100vh; background: var(--color-page); color: #202633; }
.nav { height: 88rpx; padding: 0 18rpx; display: flex; align-items: center; justify-content: space-between; background: #fff; border-bottom: .03125rem solid #ECEEF2; }
.nav > text { font-size: 31rpx; font-weight: 750; }
.nav button { width: 76rpx; height: 72rpx; margin: 0; padding: 0; border: 0; background: transparent; display: flex; align-items: center; justify-content: center; font-size: 24rpx; }
.nav button::after, .toolbar button::after { border: 0; }
.back { width: 20rpx; height: 20rpx; border-left: 4rpx solid #202633; border-bottom: 4rpx solid #202633; transform: rotate(45deg); }
.share { color: var(--color-primary); }
.content { height: calc(100vh - 88rpx); }
.summary { margin: 24rpx; padding: 32rpx; border-radius: 24rpx; background: #fff; box-shadow: 0 7rpx 24rpx rgba(25,36,55,.05); }
.summary-kicker { display: block; color: var(--color-primary); font-size: 19rpx; font-weight: 800; letter-spacing: 2rpx; }
.summary-title { display: block; margin-top: 12rpx; font-size: 36rpx; line-height: 1.4; font-weight: 800; }
.summary-desc { display: block; margin-top: 12rpx; color: #7b8493; font-size: 23rpx; line-height: 1.55; }
.summary-stats { margin-top: 28rpx; padding-top: 22rpx; display: flex; border-top: 1rpx solid #EEF0F3; }
.summary-stats view { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 5rpx; }
.summary-stats text:first-child { font-size: 30rpx; font-weight: 800; }
.summary-stats text:last-child { color: #8B94A5; font-size: 21rpx; }
.toolbar { padding: 12rpx 28rpx; display: flex; align-items: center; justify-content: space-between; }
.toolbar > text { font-size: 30rpx; font-weight: 800; }
.toolbar button { height: 68rpx; margin: 0; padding: 0 22rpx; border-radius: 34rpx; background: #FFF1E7; color: #C55819; font-size: 23rpx; line-height: 68rpx; }
.timeline { padding: 8rpx 24rpx; }
.day-group { display: flex; gap: 18rpx; margin-bottom: 24rpx; }
.date-label { width: 94rpx; padding-top: 22rpx; flex-shrink: 0; color: #6C7585; font-size: 22rpx; font-weight: 650; }
.day-items { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 12rpx; }
.timeline-item { min-height: 104rpx; padding: 18rpx; border-radius: 18rpx; display: flex; align-items: center; gap: 16rpx; background: #fff; }
.type-mark { width: 56rpx; height: 56rpx; flex-shrink: 0; border-radius: 16rpx; display: flex; align-items: center; justify-content: center; background: #eaf4ff; color: #2478D3; font-size: 21rpx; font-weight: 750; }
.type-mark.service { background: #E9FAF2; color: #148A5B; }
.type-mark.event { background: #F2EDFF; color: #6A43C8; }
.type-mark.memorial { background: #FFF1E7; color: #C55819; }
.item-copy { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 7rpx; }
.item-title-row { display: flex; align-items: center; gap: 8rpx; }
.item-title-row > text:first-child { min-width: 0; font-size: 26rpx; font-weight: 700; }
.item-copy > text { color: #838C9C; font-size: 21rpx; }
.private-tag { padding: 3rpx 8rpx; border-radius: 8rpx; background: #F0F1F3; color: #747D8B; font-size: 18rpx; }
.empty { margin: 70rpx 30rpx; display: flex; flex-direction: column; align-items: center; gap: 12rpx; color: #8A93A2; font-size: 23rpx; text-align: center; }
.empty text:first-child { color: #4F5968; font-size: 28rpx; font-weight: 700; }
.bottom-space { height: calc(60rpx + env(safe-area-inset-bottom)); }
</style>

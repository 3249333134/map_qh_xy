<template>
  <view class="page">
    <view class="status-spacer" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="nav-bar">
      <view class="nav-back" @tap="goBack">‹</view>
      <text class="nav-title">话题选择</text>
      <view class="nav-right cta" @tap="onDone">完成</view>
    </view>

    <view class="search-bar">
      <view class="search-input">
        <text class="search-icon">#</text>
        <input
          v-model="keyword"
          class="search-field"
          placeholder="城市漫游"
          confirm-type="search"
        />
      </view>
    </view>

    <view class="content">
      <view class="section-title">推荐话题</view>
      <view class="chips">
        <view
          v-for="c in recommends"
          :key="c.key"
          class="chip"
          :class="{ active: c.active }"
          @tap="onRecommend(c)"
        >{{ c.name }}</view>
      </view>

      <view class="section-title">搜索结果</view>
      <view class="result-list">
        <view v-for="(r, i) in results" :key="r.key" class="result-row" :class="{ last: i === results.length - 1 }">
          <view class="thumb" :style="{ background: r.bg }">{{ r.emoji }}</view>
          <view class="result-info">
            <text class="result-title">{{ r.title }}</text>
            <text class="result-sub">{{ r.heat }}热度 · {{ r.count }}条内容</text>
          </view>
          <view class="result-action" :class="{ added: r.added }" @tap="onAdd(r)">
            {{ r.added ? '已添加' : '添加' }}
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const statusBarHeight = ref(20)
const keyword = ref('')
const recommends = ref([
  { key: 'ride', name: '#周末骑行', active: true },
  { key: 'camp', name: '#城市露营', active: false },
  { key: 'shop', name: '#探店打卡', active: false },
  { key: 'chunxi', name: '#春熙路', active: false }
])
const results = ref([
  { key: 'roam', title: '#城市漫游', heat: '12800', count: '482', emoji: '🏙', bg: 'rgba(36, 140, 245, 0.12)', added: false },
  { key: 'image', title: '#城市影像', heat: '9650', count: '321', emoji: '📷', bg: 'rgba(118, 80, 200, 0.12)', added: false }
])

onMounted(() => {
  try {
    const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
    statusBarHeight.value = info.statusBarHeight || 20
  } catch (e) {}
})

const goBack = () => uni.navigateBack()
const onDone = () => {
  uni.showToast({ title: '已选择话题', icon: 'success' })
  setTimeout(goBack, 800)
}
const onRecommend = (c) => { c.active = !c.active }
const onAdd = (r) => {
  r.added = !r.added
  uni.showToast({ title: r.added ? '已添加' + r.title : '已移除' + r.title, icon: 'none' })
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f7f7f8;
}

.status-spacer {
  background: #ffffff;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: 0 24rpx;
  background: #ffffff;
  border-bottom: 1rpx solid #f0f1f3;
}

.nav-back {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #f0f1f3;
  color: #222;
  font-size: 44rpx;
  line-height: 44rpx;
}

.nav-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #222;
}

.nav-right {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-right.cta {
  width: auto;
  padding: 0 28rpx;
  height: 56rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #ff8a4a 0%, #ff5b35 100%);
  color: #ffffff;
  font-size: 26rpx;
  font-weight: 700;
}

.search-bar {
  padding: 16rpx 24rpx;
  background: #ffffff;
}

.search-input {
  display: flex;
  align-items: center;
  height: 72rpx;
  padding: 0 24rpx;
  border-radius: 999rpx;
  background: #f0f1f3;
}

.search-icon {
  margin-right: 12rpx;
  color: #8a8f98;
  font-size: 28rpx;
  font-weight: 700;
}

.search-field {
  flex: 1;
  font-size: 28rpx;
  color: #222;
}

.content {
  padding: 16rpx 24rpx 48rpx;
}

.section-title {
  display: block;
  margin: 24rpx 8rpx 16rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: #222;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.chip {
  padding: 14rpx 28rpx;
  border-radius: 999rpx;
  background: #ffffff;
  color: #5f646d;
  font-size: 26rpx;
  box-shadow: 0 1px 8px rgba(18, 24, 38, 0.06);
}

.chip.active {
  background: #248cf5;
  color: #ffffff;
}

.result-list {
  background: #ffffff;
  border-radius: 14rpx;
  box-shadow: 0 1px 8px rgba(18, 24, 38, 0.06);
  padding: 0 24rpx;
}

.result-row {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f0f1f3;
}

.result-row.last {
  border-bottom: 0;
}

.thumb {
  width: 80rpx;
  height: 80rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  flex-shrink: 0;
}

.result-info {
  flex: 1;
  margin-left: 20rpx;
}

.result-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #222;
}

.result-sub {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #8a8f98;
}

.result-action {
  padding: 12rpx 28rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #ff8a4a 0%, #ff5b35 100%);
  color: #ffffff;
  font-size: 26rpx;
  font-weight: 600;
}

.result-action.added {
  background: #f0f1f3;
  color: #8a8f98;
}
</style>

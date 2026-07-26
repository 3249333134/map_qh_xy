<template>
  <view class="search-page">
    <view class="status-spacer" :style="{ height: statusBarHeight + 'px' }"></view>

    <!-- 搜索头部 -->
    <view class="search-header">
      <view class="search-field">
        <view class="search-glyph"></view>
        <input
          v-model="keyword"
          class="search-input"
          confirm-type="search"
          placeholder="搜 活动通知"
          :focus="autoFocus"
          @confirm="runSearch"
        />
        <view v-if="keyword" class="clear-btn" @tap="keyword = ''">×</view>
      </view>
      <view class="cancel-btn" @tap="goBack">取消</view>
    </view>

    <scroll-view class="search-body" scroll-y show-scrollbar="false">
      <!-- 最近搜索 -->
      <view class="section">
        <view class="section-head">
          <text class="section-title">最近搜索</text>
          <text class="section-action" @tap="clearRecent">清空</text>
        </view>
        <view class="recent-chips">
          <view
            v-for="item in recentList"
            :key="item"
            class="recent-chip"
            @tap="pickRecent(item)"
          >
            <text class="recent-chip-text">{{ item }}</text>
          </view>
        </view>
      </view>

      <!-- 搜索结果 -->
      <view class="section">
        <view class="section-head">
          <text class="section-title">搜索结果</text>
          <text class="section-count">{{ resultList.length }} 条</text>
        </view>

        <view class="result-list">
          <view
            v-for="res in resultList"
            :key="res.id"
            class="result-row"
            @tap="openResult(res)"
          >
            <view class="result-icon" :class="res.color">
              <text class="result-icon-text">{{ res.icon }}</text>
            </view>
            <view class="result-main">
              <view class="result-title-row">
                <text class="result-title">{{ res.title }}</text>
                <text class="result-source">{{ res.source }}</text>
              </view>
              <text class="result-desc">{{ res.desc }}</text>
            </view>
            <view class="result-action">
              <text class="result-action-text">打开</text>
              <text class="result-action-arrow">›</text>
            </view>
          </view>
        </view>
      </view>

      <view class="search-tip">
        <text class="tip-text">结果会按频道、联系人、服务聚合，点击「打开」直达对应会话。</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const statusBarHeight = ref(20)
const autoFocus = ref(true)
const keyword = ref('')

const recentList = ref(['系统通知', '服务助手', '小王'])

const resultList = ref([
  {
    id: 'r-1',
    icon: '活',
    color: 'red',
    title: '活动通知',
    source: '春熙路频道',
    desc: '集合点已更新'
  },
  {
    id: 'r-2',
    icon: '服',
    color: 'orange',
    title: '服务助手',
    source: '服务频道',
    desc: '您的预约已确认'
  },
  {
    id: 'r-3',
    icon: '王',
    color: 'green',
    title: '小王',
    source: '频道与朋友',
    desc: '周末夜景摄影集合'
  }
])

onMounted(() => {
  try {
    const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
    statusBarHeight.value = info.statusBarHeight || 20
  } catch (e) {}
})

const goBack = () => uni.navigateBack()

const runSearch = () => {
  uni.showToast({ title: '搜索：' + (keyword.value || '全部'), icon: 'none' })
}

const pickRecent = (item) => {
  keyword.value = item
}

const clearRecent = () => {
  recentList.value = []
}

const openResult = (res) => {
  uni.showToast({ title: '打开 ' + res.title, icon: 'none' })
}
</script>

<style scoped>
.search-page {
  min-height: 100vh;
  background: #f7f7f8;
  display: flex;
  flex-direction: column;
}

.status-spacer {
  background: #ffffff;
}

.search-header {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 18rpx 28rpx 24rpx;
  background: #ffffff;
  border-bottom: 1rpx solid #f0f1f3;
}

.search-field {
  flex: 1;
  height: 72rpx;
  padding: 0 26rpx;
  display: flex;
  align-items: center;
  border-radius: 999rpx;
  background: #f0f1f3;
}

.search-glyph {
  width: 28rpx;
  height: 28rpx;
  margin-right: 16rpx;
  border: 4rpx solid #8a8f98;
  border-radius: 50%;
  position: relative;
  flex-shrink: 0;
}
.search-glyph::after {
  content: '';
  position: absolute;
  width: 12rpx;
  height: 4rpx;
  right: -10rpx;
  bottom: -4rpx;
  border-radius: 4rpx;
  background: #8a8f98;
  transform: rotate(45deg);
}

.search-input {
  flex: 1;
  height: 72rpx;
  font-size: 28rpx;
  color: #222;
}

.clear-btn {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9aa1aa;
  font-size: 40rpx;
}

.cancel-btn {
  width: 84rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #5f646d;
  font-size: 28rpx;
}

.search-body {
  flex: 1;
  padding: 28rpx 28rpx 60rpx;
  box-sizing: border-box;
}

.section {
  margin-bottom: 36rpx;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 22rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 800;
  color: #222;
}

.section-action {
  font-size: 24rpx;
  color: #8a8f98;
}

.section-count {
  font-size: 24rpx;
  color: #8a8f98;
}

/* 最近搜索 chips */
.recent-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 18rpx;
}

.recent-chip {
  padding: 14rpx 28rpx;
  border-radius: 999rpx;
  background: #ffffff;
  border: 1rpx solid #eceef1;
  box-shadow: 0 1px 8px rgba(18, 24, 38, 0.06);
}

.recent-chip-text {
  font-size: 26rpx;
  color: #5f646d;
}

/* 搜索结果列表 */
.result-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.result-row {
  display: flex;
  align-items: center;
  gap: 22rpx;
  padding: 26rpx 24rpx;
  border-radius: 18rpx;
  background: #ffffff;
  box-shadow: 0 1px 8px rgba(18, 24, 38, 0.06);
}

.result-icon {
  width: 96rpx;
  height: 96rpx;
  border-radius: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.result-icon.red {
  background: linear-gradient(135deg, #ff6a6a 0%, #ff3b3b 100%);
  box-shadow: 0 6rpx 16rpx rgba(255, 59, 59, 0.28);
}
.result-icon.orange {
  background: linear-gradient(135deg, #ff8a4a 0%, #ff5b35 100%);
  box-shadow: 0 6rpx 16rpx rgba(255, 91, 53, 0.28);
}
.result-icon.green {
  background: linear-gradient(135deg, #4be08a 0%, #24d06c 100%);
  box-shadow: 0 6rpx 16rpx rgba(36, 208, 108, 0.28);
}

.result-icon-text {
  color: #ffffff;
  font-size: 36rpx;
  font-weight: 800;
}

.result-main {
  flex: 1;
  min-width: 0;
}

.result-title-row {
  display: flex;
  align-items: baseline;
  gap: 14rpx;
}

.result-title {
  font-size: 30rpx;
  font-weight: 800;
  color: #222;
}

.result-source {
  font-size: 20rpx;
  color: #8a8f98;
  background: #f0f1f3;
  padding: 2rpx 12rpx;
  border-radius: 999rpx;
}

.result-desc {
  display: block;
  margin-top: 8rpx;
  font-size: 25rpx;
  color: #8a8f98;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-action {
  display: flex;
  align-items: center;
  gap: 4rpx;
  padding: 0 22rpx;
  height: 60rpx;
  border-radius: 999rpx;
  background: rgba(36, 140, 245, 0.1);
  flex-shrink: 0;
}

.result-action-text {
  color: #248cf5;
  font-size: 24rpx;
  font-weight: 700;
}

.result-action-arrow {
  color: #248cf5;
  font-size: 30rpx;
  line-height: 1;
}

.search-tip {
  margin-top: 12rpx;
  padding: 24rpx 28rpx;
  border-radius: 18rpx;
  background: #ffffff;
  box-shadow: 0 1px 8px rgba(18, 24, 38, 0.06);
}

.tip-text {
  font-size: 24rpx;
  color: #8a8f98;
  line-height: 38rpx;
}
</style>

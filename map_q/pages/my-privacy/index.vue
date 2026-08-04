<template>
  <view class="page">
    <view :style="{ height: statusBarHeight + 'px' }" />
    <view class="nav">
      <button aria-label="返回" @tap="goBack"><view class="back" /></button>
      <text>隐私控制</text>
      <view class="nav-space" />
    </view>

    <scroll-view class="content" scroll-y show-scrollbar="false">
      <view class="intro">
        <text>位置与推荐隐私</text>
        <text>这些设置仅影响后续分享和推荐，不会擅自修改已有内容的可见范围。</text>
      </view>

      <view class="card">
        <view class="row column">
          <view>
            <text class="label">足迹对外分享精度</text>
            <text class="desc">分享地图时自动过滤私密、隐藏位置和敏感地点</text>
          </view>
          <view class="segments">
            <button
              v-for="item in precisions"
              :key="item.value"
              :class="{ active: precision === item.value }"
              @tap="setPrecision(item.value)"
            >{{ item.label }}</button>
          </view>
        </view>
        <view class="row">
          <view>
            <text class="label">收藏用于推荐</text>
            <text class="desc">关闭后不参与兴趣雷达和内容排序</text>
          </view>
          <switch color="#24C76B" :checked="recommendation" @change="setRecommendation" />
        </view>
        <view class="row">
          <view>
            <text class="label">公开个人主页</text>
            <text class="desc">关闭后非好友只能看到基础资料</text>
          </view>
          <switch color="#24C76B" :checked="publicProfile" @change="setPublicProfile" />
        </view>
      </view>

      <view class="notice">
        <view class="shield" />
        <text>精确位置在私信中仍需每次二次确认；关闭推荐不会删除你的收藏记录。</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { favoriteApi, profileApi } from '../../utils/api/social.js'

const statusBarHeight = ref(20)
const precision = ref('fuzzy')
const recommendation = ref(true)
const publicProfile = ref(true)
const precisions = [
  { label: '模糊', value: 'fuzzy' },
  { label: '城市级', value: 'city' },
  { label: '不分享', value: 'hidden' }
]

onMounted(() => {
  try {
    const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
    statusBarHeight.value = info.statusBarHeight || 20
  } catch (e) {}
  const privacy = profileApi.get().privacy
  precision.value = privacy.footprintSharePrecision
  recommendation.value = privacy.favoritesForRecommendation
  publicProfile.value = privacy.publicProfile
})

const goBack = () => uni.navigateBack()
const setPrecision = (value) => {
  precision.value = value
  profileApi.patch({ privacy: { footprintSharePrecision: value } })
}
const setRecommendation = ({ detail }) => {
  recommendation.value = detail.value
  favoriteApi.setRecommendationEnabled(detail.value)
}
const setPublicProfile = ({ detail }) => {
  publicProfile.value = detail.value
  profileApi.patch({ privacy: { publicProfile: detail.value } })
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--color-page);
  color: #202633;
}

.nav {
  height: 88rpx;
  padding: 0 18rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: .03125rem solid #ECEEF2;
}

.nav > text {
  font-size: 32rpx;
  font-weight: 700;
}

.nav button,
.nav-space {
  width: 72rpx;
  height: 72rpx;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav button::after,
.segments button::after {
  border: 0;
}

.back {
  width: 20rpx;
  height: 20rpx;
  border-left: 4rpx solid #202633;
  border-bottom: 4rpx solid #202633;
  transform: rotate(45deg);
}

.content {
  height: calc(100vh - 88rpx);
}

.intro {
  padding: 34rpx 28rpx 18rpx;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.intro text:first-child {
  font-size: 34rpx;
  font-weight: 800;
}

.intro text:last-child,
.desc {
  color: #798293;
  font-size: 23rpx;
  line-height: 1.55;
}

.card {
  margin: 16rpx 24rpx;
  padding: 0 26rpx;
  border-radius: 22rpx;
  background: #fff;
  box-shadow: 0 5rpx 18rpx rgba(25, 36, 55, 0.05);
}

.row {
  min-height: 116rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
  border-bottom: 1rpx solid #EEF0F3;
}

.row:last-child {
  border-bottom: 0;
}

.row.column {
  min-height: 184rpx;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  gap: 20rpx;
}

.row > view:first-child {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.label {
  font-size: 28rpx;
  font-weight: 650;
}

.segments {
  display: flex;
  gap: 10rpx;
}

.segments button {
  flex: 1;
  height: 68rpx;
  margin: 0;
  padding: 0;
  border-radius: 34rpx;
  background: #F0F2F5;
  color: #697386;
  font-size: 23rpx;
  line-height: 68rpx;
}

.segments button.active {
  background: #eaf4ff;
  color: #2478D3;
  font-weight: 700;
}

.notice {
  margin: 24rpx;
  padding: 22rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  background: #FFF7EE;
  color: #7B624A;
  font-size: 23rpx;
  line-height: 1.55;
}

.shield {
  width: 30rpx;
  height: 34rpx;
  flex-shrink: 0;
  border: 3rpx solid #FF8A4A;
  border-radius: 14rpx 14rpx 18rpx 18rpx;
}
</style>

<template>
  <view class="content-area">
    <view class="info-header">
      <text class="title">{{ title }}</text>
      <view class="author-line">
        <text class="author-name">{{ authorName }}</text>
        <text class="dot">·</text>
        <text class="publish-time">{{ publishTime }}</text>
        <text class="dot">·</text>
        <text class="view-count">{{ viewCount }}浏览</text>
      </view>
    </view>

    <view class="description">
      <text class="desc-text">{{ content }}</text>
    </view>

    <view class="tags-area" v-if="tags && tags.length">
      <text class="tag" v-for="tag in tags" :key="tag">#{{ tag }}</text>
    </view>

    <view class="meta-info">
      <text class="location" v-if="location">{{ location }}</text>
    </view>
  </view>
</template>

<script>
import { computed } from 'vue'
export default {
  name: 'ContentArea',
  props: {
    content: { type: String, default: '' },
    tags: { type: Array, default: () => [] },
    publishTime: { type: String, default: '' },
    authorName: { type: String, default: '' },
    title: { type: String, default: '' },
    viewCount: { type: Number, default: 0 }
  },
  setup() {
    const location = computed(() => '杭州')
    return { location }
  }
}
</script>

<style scoped>
.content-area {
  padding: 32rpx;
  background-color: #fff;
  border-top-left-radius: 32rpx;
  border-top-right-radius: 32rpx;
  margin-top: -20rpx;
  position: relative;
  z-index: 10;
}

.info-header {
  margin-bottom: 24rpx;
}

.title {
  font-size: 40rpx;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.4;
  display: block;
  margin-bottom: 16rpx;
}

.author-line {
  display: flex;
  align-items: center;
  font-size: 24rpx;
  color: #64748b;
}

.author-name {
  color: #374151;
  font-weight: 500;
}

.dot {
  margin: 0 12rpx;
}

.publish-time,
.view-count {
  color: #9ca3af;
}

.description {
  margin-bottom: 24rpx;
}

.desc-text {
  font-size: 30rpx;
  color: #4b5563;
  line-height: 1.8;
  white-space: pre-wrap;
}

.tags-area {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.tag {
  font-size: 24rpx;
  color: #ff7a45;
  background: #fff7ed;
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
}

.meta-info {
  padding-top: 20rpx;
  border-top: 1rpx solid #f3f4f6;
}

.location {
  font-size: 24rpx;
  color: #64748b;
  display: flex;
  align-items: center;
}
</style>
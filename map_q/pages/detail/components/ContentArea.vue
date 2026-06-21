<template>
  <view class="content-area">
    <view class="description">
      <text class="desc-text">{{ content }}</text>
    </view>

    <view class="tags-area" v-if="tags && tags.length">
      <text class="tag" v-for="tag in tags" :key="tag">#{{ tag }}</text>
    </view>

    <view class="meta-info">
      <text class="time">{{ publishTime }}</text>
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
  padding: 16px;
  background-color: #fff;
}
.description { margin-bottom: 8px; }
.desc-text {
  font-size: 16px;
  color: #333;
  line-height: 1.6;
  white-space: pre-wrap;
}
.tags-area {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin: 8px 0 8px;
}
.tag {
  font-size: 12px;
  color: #007AFF;
}
.meta-info {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #999;
}
</style>
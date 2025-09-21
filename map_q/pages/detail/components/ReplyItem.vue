<template>
  <view class="reply-item">
    <view class="reply-content">
      <text v-if="reply.replyTo" class="reply-to">回复 @{{ reply.replyTo }}：</text>
      <text class="reply-text">{{ reply.content }}</text>
    </view>
    <view class="reply-meta">
      <text class="reply-time">{{ reply.time }}</text>
      <text class="reply-action" @click="handleReply">回复</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'ReplyItem',
  props: {
    reply: {
      type: Object,
      default: () => ({
        replyTo: '',
        content: '',
        time: ''
      })
    }
  },
  emits: ['reply'],
  methods: {
    handleReply() {
      this.$emit('reply', this.reply);
    }
  }
}
</script>

<style scoped>
.reply-item {
  padding: 20rpx 0;
  border-bottom: 1px solid #f0f0f0;
}

.reply-content {
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
  margin-bottom: 10rpx;
}

.reply-to {
  color: #666;
  font-size: 26rpx;
}

.reply-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.reply-time {
  font-size: 24rpx;
  color: #999;
}

.reply-action {
  font-size: 24rpx;
  color: #07c160;
}
</style>
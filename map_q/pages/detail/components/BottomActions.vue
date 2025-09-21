<template>
  <view class="bottom-actions">
    <view class="action-left" @tap="handleOpenComment">
      <view class="comment-input">
        <image class="user-avatar" :src="currentUser.avatar" mode="aspectFill"></image>
        <text class="placeholder">说点什么...</text>
      </view>
    </view>
    <view class="action-right">
      <view class="action-btn" @tap="handleLike">
        <text class="icon" :class="{ liked: isLiked }">♥</text>
        <text class="count">{{ likeCount }}</text>
      </view>
      <view class="action-btn" @tap="handleCollect">
        <text class="icon" :class="{ favorited: isCollected }">☆</text>
        <text class="count">{{ collectCount }}</text>
      </view>
      <view class="action-btn" @tap="handleOpenComment">
        <text class="icon">💬</text>
        <text class="count">{{ commentCount }}</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'BottomActions',
  props: {
    likeCount: { type: Number, default: 0 },
    isLiked: { type: Boolean, default: false },
    collectCount: { type: Number, default: 0 },
    isCollected: { type: Boolean, default: false },
    commentCount: { type: Number, default: 0 },
    currentUser: {
      type: Object,
      default: () => ({ avatar: '/static/logo.png' })
    }
  },
  emits: ['like', 'collect', 'share', 'comment'],
  methods: {
    handleLike() { this.$emit('like') },
    handleCollect() { this.$emit('collect') },
    handleShare() { this.$emit('share') },
    handleOpenComment() { this.$emit('comment') }
  }
}
</script>

<style scoped>
.bottom-actions {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #fff;
  border-top: 1px solid #f0f0f0;
  z-index: 999;
}
.action-left { flex: 1; }
.comment-input {
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 18px;
  padding: 6px 10px;
}
.user-avatar {
  width: 24px; height: 24px;
  border-radius: 12px;
  margin-right: 8px;
}
.placeholder {
  color: #999;
  font-size: 14px;
}
.action-right {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-left: 10px;
}
.action-btn { display: flex; align-items: center; gap: 6px; }
.icon { font-size: 18px; color: #999; }
.icon.liked { color: #ff4757; }
.icon.favorited { color: #ffb400; }
.count { font-size: 12px; color: #666; }
</style>
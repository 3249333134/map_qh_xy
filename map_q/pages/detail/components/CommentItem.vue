<template>
  <view class="comment-item">
    <image class="comment-avatar" :src="comment.avatar" mode="aspectFill" />
    <view class="comment-content">
      <view class="comment-main">
        <view class="comment-left">
          <text class="comment-username">{{ comment.name }}</text>
          <text class="comment-time">{{ comment.time }}</text>
          <!-- 星级：仅当有评分时展示，用有无评分代表是否使用过本服务 -->
          <view v-if="comment && comment.rating != null" class="comment-rating-inline" :aria-label="'评分' + comment.rating">
            <text v-for="i in 5" :key="i" class="rating-star" :class="{ active: i <= Math.round(comment.rating) }">★</text>
          </view>
        </view>
        <view class="comment-right-section">
          <view class="comment-like" @click="onLike">
            <text class="like-icon" :class="{ liked: comment.isLiked }">♥</text>
            <text class="like-count">{{ comment.likeCount || 0 }}</text>
          </view>
          <text class="comment-reply" @click="onReply">回复</text>
        </view>
      </view>

      <view class="comment-meta">
        <text class="comment-text">{{ comment.content }}</text>

        <view class="replies-section" v-if="comment.replies && comment.replies.length">
          <view class="reply-item" v-for="(reply, idx) in comment.replies" :key="idx">
            <image class="reply-avatar" :src="reply.avatar" mode="aspectFill" />
            <view class="reply-content-wrapper">
              <view class="reply-header">
                <view class="reply-left">
                  <text class="reply-username">{{ reply.name }}</text>
                  <text class="reply-time">{{ reply.time }}</text>
                </view>
                <view class="reply-right-section">
                  <view class="comment-like" @click="toggleReplyLike(reply)">
                    <text class="like-icon" :class="{ liked: reply.isLiked }">♥</text>
                    <text class="like-count">{{ reply.likeCount || 0 }}</text>
                  </view>
                  <text class="comment-reply" @click="onReplyToReply(reply)">回复</text>
                </view>
              </view>
              <text class="reply-content">{{ reply.content }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'CommentItem',
  props: {
    comment: {
      type: Object,
      required: true
    }
  },
  emits: ['like', 'reply', 'reply-to-reply'],
  methods: {
    onLike() {
      this.$emit('like', this.comment)
    },
    onReply() {
      this.$emit('reply', this.comment)
    },
    onReplyToReply(reply) {
      this.$emit('reply-to-reply', this.comment, reply)
    },
    toggleReplyLike(reply) {
      // 本地切换，保持与 /test 行为一致
      reply.isLiked = !reply.isLiked
      reply.likeCount = (reply.likeCount || 0) + (reply.isLiked ? 1 : -1)
      if (reply.likeCount < 0) reply.likeCount = 0
    }
  }
}
</script>

<style scoped>
.comment-item {
  display: flex;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
  align-items: flex-start;
}
.comment-avatar {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  margin-right: 12px;
  flex-shrink: 0;
}
.comment-content {
  flex: 1;
  min-width: 0;
}
.comment-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: -13px; /* 原 6px，缩小一级用户名与内容的垂直间距 */
  position: relative;
  z-index: 2;
}
.comment-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}
/* 新增：时间后内联星级 */
.comment-rating-inline {
  display: flex;
  align-items: center;
  gap: 3px;
  margin-left: 2px;
  transform: translateY(-1px);
}
.rating-star { font-size: 12px; color: #ddd; }
.rating-star.active { color: #FFD54F; }

.comment-right-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 48px;          /* 固定点击区域宽度，便于命中 */
  flex: 0 0 48px;
  position: relative;
  z-index: 3;           /* 确保位于上层可点击 */
}
.comment-meta {
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;           /* 位于下层，避免遮挡右侧操作区 */
}
.comment-username { font-size: 14px; font-weight: 600; color: #333; }
.comment-time { font-size: 12px; color: #999; }
.comment-right-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 44px;
  flex: 0 0 44px;
}
.comment-meta { display: flex; flex-direction: column; }
.comment-text {
  font-size: 14px; color: #333; line-height: 1.4; margin-bottom: 6px; word-wrap: break-word;
}
.comment-reply { font-size: 12px; color: #999; }
.comment-reply:hover { color: #007AFF; }
.like-icon { color: #999; font-size: 16px; }
.like-icon.liked { color: #ff4757; }
.like-count { font-size: 12px; color: #999; }

/* 回复区域样式（与 /test 一致的灰色气泡） */
.replies-section {
  margin-top: 8px;
  padding-left: 12px;
  border-left: 2px solid #f0f0f0;
}
.reply-item {
  display: flex;
  background: #f8f8f8;
  padding: 12px 8px;
  border-radius: 8px;
  margin-bottom: 6px;
  align-items: flex-start;
}
.reply-item:last-child { margin-bottom: 0; }
.reply-avatar {
  width: 32px;
  height: 32px;
  border-radius: 16px;
  margin-right: 8px;
  flex-shrink: 0;
}
.reply-content-wrapper { flex: 1; min-width: 0; }
.reply-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: -23px; /* 原 6px，缩小二级用户名与内容的垂直间距 */
  position: relative;
  z-index: 2;
}
.reply-left { display: flex; align-items: center; gap: 6px; }
.reply-username { font-size: 12px; font-weight: 600; color: #666; }
.reply-time { font-size: 11px; color: #999; }
.reply-right-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.reply-content {
  font-size: 12px;
  color: #333;
  line-height: 1.4;
  word-wrap: break-word;
}
</style>
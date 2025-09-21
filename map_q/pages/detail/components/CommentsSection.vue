<template>
  <view class="comments-wrapper">
    <view class="comment-count-section">
      <text class="comment-count">共 {{ comments.length }} 条评论</text>
    </view>

    <view class="comments-section" v-if="comments && comments.length">
      <CommentItem
        v-for="(comment, index) in comments"
        :key="comment.id || index"
        :comment="comment"
        @like="handleLikeComment"
        @reply="handleReplyComment"
        @reply-to-reply="handleReplyToReply"
      />
    </view>

    <view class="empty-comments" v-else>
      <text>暂无评论，快来抢沙发吧~</text>
    </view>

    <view class="load-more" v-if="hasMore && !loading">
      <text @click="loadMoreComments">点击加载更多</text>
    </view>
    <view class="load-more" v-else-if="loading">
      <text>加载中...</text>
    </view>
  </view>
</template>

<script>
import CommentItem from './CommentItem.vue'

export default {
  name: 'CommentsSection',
  components: { CommentItem },
  props: {
    comments: { type: Array, default: () => [] },
    totalComments: { type: Number, default: 0 },
    hasMoreComments: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    sortBy: { type: String, default: 'time' }
  },
  emits: ['loadMore', 'toggleSort', 'likeComment', 'replyComment'],
  methods: {
    loadMoreComments() {
      if (!this.loading) this.$emit('loadMore')
    },
    toggleSort() {
      this.$emit('toggleSort')
    },
    handleLikeComment(comment) {
      this.$emit('likeComment', comment.id)
    },
    handleReplyComment(comment) {
      this.$emit('replyComment', { commentId: comment.id, atName: comment.name || '' })
    },
    handleReplyToReply(comment, reply) {
      this.$emit('replyComment', { commentId: comment.id, atName: (reply && reply.name) || '' })
    }
  }
}
</script>

<style scoped>
.comments-wrapper {
  background: #fff;
}

/* 与 /test 一致的粘性标题 */
.comment-count-section {
  background: #fff;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 80px;
  z-index: 10;
}
.comment-count {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  border-left: 3px solid #007AFF;
  padding-left: 12px;
}

.comments-section {
  background: #fff;
  padding: 0 16px;
}

.empty-comments {
  padding: 30px 0;
  text-align: center;
  color: #999;
  font-size: 14px;
}

.load-more {
  padding: 16px 0;
  text-align: center;
  color: #666;
  font-size: 14px;
  border-top: 1px solid #f0f0f0;
}
</style>
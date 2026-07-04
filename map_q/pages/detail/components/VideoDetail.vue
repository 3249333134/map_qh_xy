<template>
  <view class="detail-page video-detail">
    <!-- 视频播放区域 -->
    <view class="video-container">
      <view class="video-placeholder" @tap="togglePlay">
        <view class="play-btn" v-if="!isPlaying">
          <text class="play-icon">▶</text>
        </view>
        <view class="video-info">
          <text class="duration">{{ formattedDuration }}</text>
        </view>
      </view>
    </view>

    <!-- 顶部导航 -->
    <view class="detail-nav">
      <view class="nav-back" @tap="back">
        <view class="back-btn">
          <text class="back-icon">‹</text>
        </view>
      </view>
      <text class="nav-title">视频详情</text>
      <view class="nav-actions">
        <view class="share-btn" @tap="shareContent">
          <text class="action-icon">↗</text>
        </view>
      </view>
    </view>

    <!-- 用户信息 -->
    <view class="user-section">
      <view class="user-avatar">
        <image :src="videoData.avatar || '/static/logo.png'" mode="aspectFill" />
      </view>
      <view class="user-info">
        <text class="user-name">{{ videoData.author }}</text>
        <text class="publish-time">{{ videoData.publishTime }}</text>
      </view>
      <view class="follow-btn" :class="{ followed: isFollowing }" @tap="toggleFollow">
        <text>{{ isFollowing ? '已关注' : '+ 关注' }}</text>
      </view>
    </view>

    <!-- 视频标题 -->
    <view class="title-section">
      <text class="video-title">{{ videoData.title }}</text>
      <view class="video-stats">
        <text class="stat-item">播放 {{ formattedPlays }}</text>
        <text class="stat-sep">·</text>
        <text class="stat-item">点赞 {{ videoData.likes }}</text>
      </view>
    </view>

    <!-- 标签 -->
    <view class="tags-section" v-if="videoData.tags && videoData.tags.length">
      <view class="tag" v-for="(tag, index) in videoData.tags" :key="index">
        <text>#{{ tag }}</text>
      </view>
    </view>

    <!-- 分割线 -->
    <view class="divider"></view>

    <!-- 评论区域 -->
    <view class="comments-title">
      <text>评论 ({{ commentCount }})</text>
    </view>

    <view class="comments-list">
      <view class="comment-item" v-for="comment in comments" :key="comment.id">
        <image class="comment-avatar" :src="comment.avatar || '/static/logo.png'" mode="aspectFill" />
        <view class="comment-content">
          <view class="comment-header">
            <text class="comment-name">{{ comment.name }}</text>
            <text class="comment-time">{{ comment.time }}</text>
          </view>
          <text class="comment-text">{{ comment.content }}</text>
          <view class="comment-actions">
            <view class="action-item" @tap="likeComment(comment.id)">
              <text :class="{ liked: comment.isLiked }">{{ comment.isLiked ? '♥' : '♡' }}</text>
              <text>{{ comment.likeCount }}</text>
            </view>
            <view class="action-item" @tap="replyComment({ commentId: comment.id, atName: comment.name })">
              <text>回复</text>
            </view>
          </view>
          <!-- 回复列表 -->
          <view class="replies-list" v-if="comment.replies && comment.replies.length">
            <view class="reply-item" v-for="reply in comment.replies" :key="reply.id">
              <text class="reply-name">{{ reply.name }}</text>
              <text class="reply-text">回复 {{ reply.content }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部占位 -->
    <view :style="{ height: bottomHeight + 'px' }"></view>

    <!-- 底部操作栏 -->
    <view class="bottom-actions">
      <view class="action-input" @tap="showCommentInput">
        <text>写评论...</text>
      </view>
      <view class="action-icons">
        <view class="icon-item" @tap="toggleLike">
          <text :class="{ active: isLiked }">{{ isLiked ? '♥' : '♡' }}</text>
          <text class="icon-count">{{ videoData.likes }}</text>
        </view>
        <view class="icon-item" @tap="toggleCollect">
          <text :class="{ active: isCollected }">{{ isCollected ? '★' : '☆' }}</text>
          <text class="icon-count">收藏</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { ref, computed, onMounted } from 'vue'

export default {
  name: 'VideoDetail',
  setup() {
    const videoData = ref({
      title: '视频标题',
      author: '用户',
      avatar: '',
      publishTime: '',
      duration: 0,
      plays: 0,
      likes: 0,
      tags: []
    })

    const isPlaying = ref(false)
    const isLiked = ref(false)
    const isCollected = ref(false)
    const isFollowing = ref(false)
    const comments = ref([])
    const commentCount = ref(0)
    const bottomHeight = ref(100)

    const formattedDuration = computed(() => {
      const mins = Math.floor(videoData.value.duration / 60)
      const secs = videoData.value.duration % 60
      return `${mins}:${secs.toString().padStart(2, '0')}`
    })

    const formattedPlays = computed(() => {
      const plays = videoData.value.plays
      if (plays >= 10000) {
        return (plays / 10000).toFixed(1) + '万'
      }
      return plays.toString()
    })

    const togglePlay = () => {
      isPlaying.value = !isPlaying.value
    }

    const toggleLike = () => {
      isLiked.value = !isLiked.value
      videoData.value.likes += isLiked.value ? 1 : -1
    }

    const toggleCollect = () => {
      isCollected.value = !isCollected.value
      uni.showToast({
        title: isCollected.value ? '已收藏' : '取消收藏',
        icon: 'none'
      })
    }

    const toggleFollow = () => {
      isFollowing.value = !isFollowing.value
      uni.showToast({
        title: isFollowing.value ? '已关注' : '取消关注',
        icon: 'none'
      })
    }

    const shareContent = () => {
      uni.showToast({
        title: '分享功能待实现',
        icon: 'none'
      })
    }

    const likeComment = (commentId) => {
      const comment = comments.value.find(c => c.id === commentId)
      if (comment) {
        comment.isLiked = !comment.isLiked
        comment.likeCount += comment.isLiked ? 1 : -1
      }
    }

    const replyComment = (payload) => {
      showCommentInput(payload.atName)
    }

    const showCommentInput = (atName = '') => {
      uni.showToast({
        title: '评论功能待实现',
        icon: 'none'
      })
    }

    const back = () => {
      uni.navigateBack()
    }

    const loadData = () => {
      try {
        const item = uni.getStorageSync('INDEX_LAST_ITEM')
        if (item && item._id) {
          videoData.value.title = item.name || item.title || '视频标题'
          videoData.value.author = item.author || '用户'
          videoData.value.likes = item.likes || 0
          videoData.value.duration = item.duration || 0
          videoData.value.plays = item.plays || 0
          videoData.value.tags = item.tags || []
          videoData.value.publishTime = item.publishTime || new Date().toLocaleDateString()
        }
      } catch (e) {
        console.warn('加载视频数据失败:', e)
      }

      // 加载评论
      comments.value = generateMockComments()
      commentCount.value = comments.value.length
    }

    const generateMockComments = () => {
      const usernames = ['用户A', '用户B', '用户C', '用户D', '用户E']
      const contents = ['视频很棒！', '支持一下', '666', '学习到了', '很有用']
      const comments = []
      for (let i = 0; i < 10; i++) {
        comments.push({
          id: i + 1,
          name: usernames[i % usernames.length],
          avatar: '/static/logo.png',
          content: contents[i % contents.length],
          time: '刚刚',
          isLiked: false,
          likeCount: Math.floor(Math.random() * 100),
          replies: []
        })
      }
      return comments
    }

    onMounted(() => {
      loadData()
    })

    return {
      videoData,
      isPlaying,
      isLiked,
      isCollected,
      isFollowing,
      comments,
      commentCount,
      bottomHeight,
      formattedDuration,
      formattedPlays,
      togglePlay,
      toggleLike,
      toggleCollect,
      toggleFollow,
      shareContent,
      likeComment,
      replyComment,
      showCommentInput,
      back
    }
  }
}
</script>

<style scoped>
.detail-page {
  min-height: 100vh;
  background-color: #fafafa;
}

.detail-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--status-bar-height) 24rpx 16rpx;
  background: transparent;
  z-index: 100;
}

.nav-back {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
}

.back-icon {
  font-size: 48rpx;
  font-weight: 300;
  color: #ffffff;
  position: relative;
  top: -4rpx;
}

.nav-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #ffffff;
}

.nav-actions {
  width: 80rpx;
  display: flex;
  justify-content: flex-end;
}

.share-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
}

.action-icon {
  font-size: 28rpx;
  color: #ffffff;
}

.video-container {
  width: 100%;
  height: 800rpx;
  background: #000;
  position: relative;
}

.video-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.play-btn {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
}

.play-icon {
  font-size: 32px;
  color: #333;
  margin-left: 6px;
}

.video-info {
  position: absolute;
  bottom: 12px;
  right: 12px;
  background: rgba(0, 0, 0, 0.6);
  padding: 4px 8px;
  border-radius: 4px;
}

.duration {
  color: #fff;
  font-size: 12px;
}

.user-section {
  display: flex;
  align-items: center;
  padding: 32rpx;
  background: #fff;
  margin-top: -40rpx;
  border-top-left-radius: 32rpx;
  border-top-right-radius: 32rpx;
  position: relative;
  z-index: 10;
}

.user-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 12px;
}

.user-avatar image {
  width: 100%;
  height: 100%;
}

.user-info {
  flex: 1;
}

.user-name {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}

.publish-time {
  font-size: 12px;
  color: #999;
}

.follow-btn {
  padding: 6px 16px;
  border-radius: 16px;
  background: #ff4757;
  color: #fff;
  font-size: 13px;
}

.follow-btn.followed {
  background: #f0f0f0;
  color: #666;
}

.title-section {
  padding: 16px;
  background: #fff;
}

.video-title {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1.4;
  margin-bottom: 8px;
}

.video-stats {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-item {
  font-size: 13px;
  color: #999;
}

.stat-sep {
  color: #ddd;
}

.tags-section {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 16px 16px;
  background: #fff;
}

.tag {
  padding: 4px 12px;
  border-radius: 12px;
  background: #f0f0f0;
}

.tag text {
  font-size: 12px;
  color: #666;
}

.divider {
  height: 8px;
  background: #f5f5f5;
}

.comments-title {
  padding: 16px;
  font-size: 15px;
  font-weight: 600;
  color: #333;
  background: #fff;
}

.comments-list {
  background: #fff;
}

.comment-item {
  display: flex;
  padding: 16px;
  border-bottom: 1px solid #f5f5f5;
}

.comment-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  margin-right: 12px;
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.comment-name {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.comment-time {
  font-size: 11px;
  color: #999;
}

.comment-text {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
  margin-bottom: 8px;
}

.comment-actions {
  display: flex;
  gap: 16px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #999;
}

.action-item .liked {
  color: #ff4757;
}

.replies-list {
  margin-top: 12px;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 8px;
}

.reply-item {
  margin-bottom: 6px;
}

.reply-item:last-child {
  margin-bottom: 0;
}

.reply-name {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  margin-right: 4px;
}

.reply-text {
  font-size: 12px;
  color: #666;
}

.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 10px 16px;
  padding-bottom: calc(10px + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -1px 4px rgba(0, 0, 0, 0.05);
}

.action-input {
  flex: 1;
  height: 36px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  background: #f5f5f5;
  border-radius: 18px;
  margin-right: 16px;
}

.action-input text {
  font-size: 14px;
  color: #999;
}

.action-icons {
  display: flex;
  gap: 20px;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.icon-item text:first-child {
  font-size: 22px;
  color: #999;
}

.icon-item text:first-child.active {
  color: #ff4757;
}

.icon-count {
  font-size: 10px;
  color: #999;
}
</style>

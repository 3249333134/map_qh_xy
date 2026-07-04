<template>
  <view class="detail-page article-detail">
    <!-- 封面图 -->
    <view class="cover-section" v-if="articleData.cover">
      <image class="cover-image" :src="articleData.cover" mode="aspectFill" />
    </view>
    <view class="cover-section cover-placeholder" v-else>
      <text class="cover-text">暂无封面</text>
    </view>

    <!-- 顶部导航 -->
    <view class="detail-nav">
      <view class="nav-back" @tap="back">
        <view class="back-btn">
          <text class="back-icon">‹</text>
        </view>
      </view>
      <text class="nav-title">文章</text>
      <view class="nav-actions">
        <view class="share-btn" @tap="shareContent">
          <text class="action-icon">↗</text>
        </view>
      </view>
    </view>

    <!-- 文章头部 -->
    <view class="article-header">
      <text class="article-title">{{ articleData.title }}</text>
      <view class="article-meta">
        <view class="author-info">
          <image class="author-avatar" :src="articleData.avatar || '/static/logo.png'" mode="aspectFill" />
          <text class="author-name">{{ articleData.author }}</text>
        </view>
        <text class="publish-time">{{ articleData.publishTime }}</text>
      </view>
    </view>

    <!-- 文章正文 -->
    <view class="article-content">
      <view class="content-text">
        <text>{{ articleData.content }}</text>
      </view>

      <!-- 摘要/导语 -->
      <view class="article-summary" v-if="articleData.summary">
        <text>{{ articleData.summary }}</text>
      </view>

      <!-- 标签 -->
      <view class="tags-section" v-if="articleData.tags && articleData.tags.length">
        <view class="tag" v-for="(tag, index) in articleData.tags" :key="index">
          <text>{{ tag }}</text>
        </view>
      </view>
    </view>

    <!-- 阅读统计 -->
    <view class="read-stats">
      <view class="stat-item">
        <text class="stat-icon">👁</text>
        <text class="stat-value">{{ formattedReads }}</text>
        <text class="stat-label">阅读</text>
      </view>
      <view class="stat-item">
        <text class="stat-icon">♥</text>
        <text class="stat-value">{{ articleData.likes }}</text>
        <text class="stat-label">点赞</text>
      </view>
    </view>

    <!-- 作者信息卡片 -->
    <view class="author-card">
      <image class="author-card-avatar" :src="articleData.avatar || '/static/logo.png'" mode="aspectFill" />
      <view class="author-card-info">
        <text class="author-card-name">{{ articleData.author }}</text>
        <text class="author-card-desc">文章作者</text>
      </view>
      <view class="follow-btn" :class="{ followed: isFollowing }" @tap="toggleFollow">
        <text>{{ isFollowing ? '已关注' : '+ 关注' }}</text>
      </view>
    </view>

    <!-- 分割线 -->
    <view class="section-divider"></view>

    <!-- 评论区域 -->
    <view class="comments-section">
      <view class="comments-header">
        <text class="comments-title">评论 ({{ commentCount }})</text>
      </view>

      <view class="comments-list">
        <view class="comment-item" v-for="comment in comments" :key="comment.id">
          <image class="comment-avatar" :src="comment.avatar || '/static/logo.png'" mode="aspectFill" />
          <view class="comment-body">
            <view class="comment-info">
              <text class="comment-name">{{ comment.name }}</text>
              <text class="comment-time">{{ comment.time }}</text>
            </view>
            <text class="comment-text">{{ comment.content }}</text>
            <view class="comment-footer">
              <view class="comment-action" @tap="likeComment(comment.id)">
                <text :class="{ active: comment.isLiked }">{{ comment.isLiked ? '♥' : '♡' }}</text>
                <text>{{ comment.likeCount }}</text>
              </view>
              <view class="comment-action" @tap="replyComment({ commentId: comment.id, atName: comment.name })">
                <text>回复</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部占位 -->
    <view :style="{ height: bottomHeight + 'px' }"></view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <view class="input-area" @tap="showCommentInput">
        <text>写评论...</text>
      </view>
      <view class="action-group">
        <view class="action-btn" @tap="toggleLike">
          <text :class="{ active: isLiked }">{{ isLiked ? '♥' : '♡' }}</text>
          <text>{{ articleData.likes }}</text>
        </view>
        <view class="action-btn" @tap="toggleCollect">
          <text :class="{ active: isCollected }">{{ isCollected ? '★' : '☆' }}</text>
          <text>收藏</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { ref, computed, onMounted } from 'vue'

export default {
  name: 'ArticleDetail',
  setup() {
    const articleData = ref({
      title: '文章标题',
      author: '作者',
      avatar: '',
      publishTime: '',
      content: '文章正文内容...',
      summary: '',
      cover: '',
      reads: 0,
      likes: 0,
      tags: []
    })

    const isLiked = ref(false)
    const isCollected = ref(false)
    const isFollowing = ref(false)
    const comments = ref([])
    const commentCount = ref(0)
    const bottomHeight = ref(80)

    const formattedReads = computed(() => {
      const reads = articleData.value.reads
      if (reads >= 10000) {
        return (reads / 10000).toFixed(1) + '万'
      }
      return reads.toString()
    })

    const toggleLike = () => {
      isLiked.value = !isLiked.value
      articleData.value.likes += isLiked.value ? 1 : -1
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
          articleData.value.title = item.name || item.title || '文章标题'
          articleData.value.author = item.author || '作者'
          articleData.value.likes = item.likes || 0
          articleData.value.reads = item.reads || 0
          articleData.value.summary = item.summary || ''
          articleData.value.cover = item.cover || ''
          articleData.value.content = item.description || item.summary || '暂无正文内容'
          articleData.value.tags = item.tags || []
          articleData.value.publishTime = item.publishTime || new Date().toLocaleDateString()
        }
      } catch (e) {
        console.warn('加载文章数据失败:', e)
      }

      comments.value = generateMockComments()
      commentCount.value = comments.value.length
    }

    const generateMockComments = () => {
      const usernames = ['读者A', '读者B', '读者C', '读者D', '读者E', '读者F']
      const contents = [
        '这篇文章写得太好了！',
        '受益匪浅，感谢分享',
        '支持作者',
        '收藏了',
        '写得真棒',
        '期待更多作品'
      ]
      const comments = []
      for (let i = 0; i < 8; i++) {
        comments.push({
          id: i + 1,
          name: usernames[i % usernames.length],
          avatar: '/static/logo.png',
          content: contents[i % contents.length],
          time: i === 0 ? '刚刚' : `${i}小时前`,
          isLiked: false,
          likeCount: Math.floor(Math.random() * 50),
          replies: []
        })
      }
      return comments
    }

    onMounted(() => {
      loadData()
    })

    return {
      articleData,
      isLiked,
      isCollected,
      isFollowing,
      comments,
      commentCount,
      bottomHeight,
      formattedReads,
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
  background: #fff;
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

.cover-section {
  position: relative;
  width: 100%;
  height: 800rpx;
  background: #e8e8e8;
}

.cover-section .cover-image {
  width: 100%;
  height: 100%;
}

.cover-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8fafc 0%, #eef2f7 100%);
}

.cover-text {
  font-size: 28rpx;
  color: #94a3b8;
}

.article-header {
  padding: 32rpx;
  background: #fff;
  margin-top: -40rpx;
  border-top-left-radius: 32rpx;
  border-top-right-radius: 32rpx;
  position: relative;
  z-index: 10;
}

.article-title {
  display: block;
  font-size: 22px;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1.4;
  margin-bottom: 16px;
}

.article-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.author-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.publish-time {
  font-size: 12px;
  color: #999;
}

.article-content {
  padding: 20px;
}

.content-text {
  margin-bottom: 16px;
}

.content-text text {
  font-size: 16px;
  color: #333;
  line-height: 1.8;
}

.article-summary {
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
  margin: 16px 0;
}

.article-summary text {
  font-size: 15px;
  color: #666;
  line-height: 1.6;
}

.tags-section {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.tag {
  padding: 6px 14px;
  background: #f0f5ff;
  border-radius: 16px;
}

.tag text {
  font-size: 13px;
  color: #4a90e2;
}

.read-stats {
  display: flex;
  justify-content: center;
  gap: 40px;
  padding: 20px;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-icon {
  font-size: 16px;
}

.stat-value {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.stat-label {
  font-size: 12px;
  color: #999;
}

.author-card {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background: #fff;
}

.author-card-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  margin-right: 12px;
}

.author-card-info {
  flex: 1;
}

.author-card-name {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}

.author-card-desc {
  font-size: 12px;
  color: #999;
}

.follow-btn {
  padding: 6px 18px;
  border-radius: 18px;
  background: #ff4757;
}

.follow-btn text {
  font-size: 13px;
  color: #fff;
}

.follow-btn.followed {
  background: #f0f0f0;
}

.follow-btn.followed text {
  color: #666;
}

.section-divider {
  height: 8px;
  background: #f8f8f8;
}

.comments-section {
  padding: 16px 20px;
  background: #fff;
}

.comments-header {
  margin-bottom: 16px;
}

.comments-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-item {
  display: flex;
  gap: 12px;
}

.comment-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
}

.comment-body {
  flex: 1;
}

.comment-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
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
  display: block;
  font-size: 14px;
  color: #333;
  line-height: 1.5;
  margin-bottom: 8px;
}

.comment-footer {
  display: flex;
  gap: 16px;
}

.comment-action {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #999;
}

.comment-action .active {
  color: #ff4757;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 10px 16px;
  padding-bottom: calc(10px + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -1px 8px rgba(0, 0, 0, 0.05);
}

.input-area {
  flex: 1;
  height: 38px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  background: #f5f5f5;
  border-radius: 19px;
  margin-right: 16px;
}

.input-area text {
  font-size: 14px;
  color: #999;
}

.action-group {
  display: flex;
  gap: 20px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.action-btn text:first-child {
  font-size: 22px;
  color: #999;
}

.action-btn text:first-child.active {
  color: #ff4757;
}

.action-btn text:last-child {
  font-size: 10px;
  color: #999;
}
</style>

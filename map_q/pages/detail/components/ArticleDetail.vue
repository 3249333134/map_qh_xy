<template>
  <view class="detail-page article-detail">
    <!-- 顶部导航（沉浸式） -->
    <view class="detail-nav immersive">
      <view class="status-spacer" :style="{ height: statusBarHeight + 'px' }"></view>
      <view class="nav-row">
        <view class="nav-back" @tap="back">
          <text class="back-icon">‹</text>
        </view>
        <text class="nav-title">文章</text>
        <view class="nav-actions">
          <text class="action-icon" @tap="shareContent">↗</text>
        </view>
      </view>
    </view>

    <!-- 文章头部（顶到状态栏） -->
    <view class="article-header" :style="{ paddingTop: statusBarHeight + 'px' }">
      <text class="article-title">{{ articleData.title }}</text>
      <view class="article-meta">
        <view class="author-info">
          <image class="author-avatar" :src="articleData.avatar || '/static/logo.png'" mode="aspectFill" />
          <text class="author-name">{{ articleData.author }}</text>
        </view>
        <text class="publish-time">{{ articleData.publishTime }}</text>
      </view>
    </view>

    <!-- 封面图 -->
    <view class="cover-image" v-if="articleData.cover">
      <image :src="articleData.cover" mode="widthFix" />
    </view>

    <!-- 文章正文 -->
    <view class="article-content">
      <scroll-view v-if="articleData.toc.length" class="toc-scroll" scroll-x>
        <view class="toc-list">
          <view v-for="(item,index) in articleData.toc" :key="item.id" class="toc-chip" @tap="activeSection = index">{{ item.title }}</view>
        </view>
      </scroll-view>
      <view class="content-text">
        <text v-for="(paragraph,index) in visibleParagraphs" :key="index" :id="`article-section-${index}`" class="paragraph">{{ paragraph }}</text>
      </view>
      <view v-if="articleData.paragraphs.length > 2" class="expand-reading" @tap="expanded = !expanded">{{ expanded ? '收起正文' : '展开阅读全文' }}</view>

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
import { contentInteractionApi } from '../../../utils/api/contentInteraction.js'
import { shareActiveContent } from '../../../utils/contentShare.js'

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
      ,paragraphs: []
      ,toc: []
    })

    const isLiked = ref(false)
    const isCollected = ref(false)
    const isFollowing = ref(false)
    const comments = ref([])
    const commentCount = ref(0)
    const bottomHeight = ref(80)
    const statusBarHeight = ref(20)
    const contentId = ref('')
    const expanded = ref(false)
    const activeSection = ref(0)
    const visibleParagraphs = computed(() => expanded.value ? articleData.value.paragraphs : articleData.value.paragraphs.slice(0, 2))

    const formattedReads = computed(() => {
      const reads = articleData.value.reads
      if (reads >= 10000) {
        return (reads / 10000).toFixed(1) + '万'
      }
      return reads.toString()
    })

    const toggleLike = () => {
      isLiked.value = contentInteractionApi.toggle(contentId.value, 'liked').liked
      articleData.value.likes += isLiked.value ? 1 : -1
    }

    const toggleCollect = () => {
      isCollected.value = contentInteractionApi.toggle(contentId.value, 'collected').collected
      uni.showToast({
        title: isCollected.value ? '已收藏' : '取消收藏',
        icon: 'none'
      })
    }

    const toggleFollow = () => {
      isFollowing.value = contentInteractionApi.toggle(contentId.value, 'followed').followed
      uni.showToast({
        title: isFollowing.value ? '已关注' : '取消关注',
        icon: 'none'
      })
    }

    const shareContent = () => {
      shareActiveContent()
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
      uni.showModal({
        title: atName ? `回复 ${atName}` : '发表评论',
        editable: true,
        placeholderText: '友善交流，分享你的看法',
        success: result => {
          if (!result.confirm || !result.content?.trim()) return
          try {
            const state = contentInteractionApi.addComment(contentId.value, result.content)
            const added = state.comments[0]
            comments.value.unshift({ id: added.id, name: added.author.name, avatar: added.author.avatar, content: added.content, time: '刚刚', isLiked: false, likeCount: 0 })
            commentCount.value = comments.value.length
          } catch (cause) { uni.showToast({ title: cause.message, icon: 'none' }) }
        }
      })
    }

    const back = () => {
      uni.navigateBack()
    }

    const loadData = () => {
      try {
      const item = uni.getStorageSync('CONTENT_DETAIL_ACTIVE_V1') || uni.getStorageSync('INDEX_LAST_ITEM')
        if (item && item._id) {
          contentId.value = item.id || item._id
          articleData.value.title = item.name || item.title || '文章标题'
          articleData.value.author = item.author?.name || item.author || '作者'
          articleData.value.likes = item.likes || 0
          articleData.value.reads = item.reads || 0
          articleData.value.summary = item.summary || ''
          articleData.value.cover = item.cover || ''
          articleData.value.content = item.description || item.summary || '暂无正文内容'
          articleData.value.paragraphs = item.article?.paragraphs || String(item.content || item.description || item.summary || '暂无正文内容').split(/\n{2,}/).filter(Boolean)
          articleData.value.toc = item.article?.toc || articleData.value.paragraphs.map((text,index) => ({ id: `section_${index}`, title: index === 0 ? '概览' : `第 ${index + 1} 节` }))
          articleData.value.tags = item.tags || []
          const state = contentInteractionApi.getState(contentId.value)
          isLiked.value = state.liked
          isCollected.value = state.collected
          isFollowing.value = state.followed
          articleData.value.publishTime = item.publishTime || new Date().toLocaleDateString()
        }
      } catch (e) {
        console.warn('加载文章数据失败:', e)
      }

      const saved = contentInteractionApi.getState(contentId.value).comments.map(item => ({ id: item.id, name: item.author?.name || '我', avatar: item.author?.avatar, content: item.content, time: '刚刚', isLiked: item.liked, likeCount: item.likeCount }))
      comments.value = [...saved, ...generateMockComments()]
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
      try {
        const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
        statusBarHeight.value = info.statusBarHeight || 20
      } catch (e) {}
    })

    return {
      articleData,
      isLiked,
      isCollected,
      isFollowing,
      comments,
      commentCount,
      bottomHeight,
      statusBarHeight,
      expanded,
      activeSection,
      visibleParagraphs,
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
  z-index: 100;
}

.detail-nav.immersive {
  background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 100%);
}

.nav-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
}

.nav-back {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-icon {
  font-size: 32px;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 1px 3px rgba(0,0,0,0.3);
}

.nav-title {
  font-size: 17px;
  font-weight: 600;
  color: #fff;
  text-shadow: 0 1px 3px rgba(0,0,0,0.3);
}

.nav-actions {
  width: 40px;
  display: flex;
  justify-content: flex-end;
}

.action-icon {
  font-size: 20px;
  color: #fff;
  text-shadow: 0 1px 3px rgba(0,0,0,0.3);
}

.article-header {
  padding: 20px 20px 16px;
  background: #fff;
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

.cover-image {
  width: 100%;
  padding: 0 20px;
}

.cover-image image {
  width: 100%;
  border-radius: 8px;
}

.article-content {
  padding: 20px;
}
.toc-scroll { width: 100%; margin-bottom: 18px; white-space: nowrap; }.toc-list { display: inline-flex; gap: 8px; }.toc-chip { min-height: 40px; padding: 0 14px; border-radius: 13px; display: inline-flex; align-items: center; color: #1d4ed8; background: #eff6ff; font-size: 12px; font-weight: 650; }.paragraph { display: block; margin-bottom: 16px; }.expand-reading { min-height: 46px; margin-top: 8px; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: #c2410c; background: #fff7ed; font-size: 13px; font-weight: 700; }

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
  border-top: 1px solid #f1f5f9;
  border-bottom: 1px solid #f1f5f9;
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
  background: var(--color-danger);
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
  background: var(--color-page);
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
  color: var(--color-danger);
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
  color: var(--color-danger);
}

.action-btn text:last-child {
  font-size: 10px;
  color: #999;
}
</style>

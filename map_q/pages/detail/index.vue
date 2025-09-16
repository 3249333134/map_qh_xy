<template>
  <view class="detail-page">
    <!-- 页面滚动容器 -->
    <scroll-view 
      class="page-scroll" 
      scroll-y 
      :scroll-top="pageScrollTop"
      :scroll-with-animation="true"
      :style="{ height: '100vh' }">

    <!-- 头部导航 -->
    <view class="header">
      <view class="nav-bar">
        <view class="nav-left" @tap="goBack">
          <text class="icon-back">‹</text>
        </view>
        <view class="nav-center">
          <view class="user-info">
            <image class="avatar" :src="userInfo.avatar" mode="aspectFill"></image>
            <text class="username">{{ userInfo.name }}</text>
          </view>
        </view>
        <view class="nav-right">
          <view class="follow-btn" :class="{ followed: userInfo.isFollowed }" @tap="toggleFollow">
            <text>{{ userInfo.isFollowed ? '已关注' : '关注' }}</text>
          </view>
          <text class="share-icon">⤴</text>
        </view>
      </view>
    </view>

    <!-- 主要内容区域 -->
    <scroll-view class="content-scroll" scroll-y>
      <!-- 大图展示区域 -->
      <view class="image-container">
        <swiper class="image-swiper" :indicator-dots="imageList.length > 1" indicator-color="rgba(255,255,255,0.5)" indicator-active-color="#fff">
          <swiper-item v-for="(image, index) in imageList" :key="index">
            <image class="main-image" :src="image" mode="aspectFill"></image>
          </swiper-item>
        </swiper>
        <view class="image-indicator" v-if="imageList.length > 1">
          <text>{{ currentImageIndex + 1 }}/{{ imageList.length }}</text>
        </view>
      </view>

      <!-- 内容描述区域 -->
      <view class="content-area">
        <view class="description">
          <text class="desc-text">{{ contentInfo.description }}</text>
        </view>
        
        <!-- 标签区域 -->
        <view class="tags-area">
          <text class="tag" v-for="tag in contentInfo.tags" :key="tag">#{{ tag }}</text>
        </view>
        
        <!-- 时间和位置信息 -->
        <view class="meta-info">
          <text class="time">{{ contentInfo.time }}</text>
          <text class="location" v-if="contentInfo.location">{{ contentInfo.location }}</text>
        </view>
      </view>

      <!-- 评论数量显示区域 -->
      <view class="comment-count-section">
        <text class="comment-count">共 {{ commentList.length }} 条评论</text>
      </view>
      
      <!-- 评论列表区域 -->
      <view class="comments-section" v-if="showComments && commentList.length > 0">
        <view class="comment-item" v-for="(comment, index) in commentList" :key="index">
          <image class="comment-avatar" :src="comment.avatar" mode="aspectFill"></image>
          <view class="comment-content">
            <!-- 名字、时间在左侧，点赞在右侧 -->
            <view class="comment-main">
              <view class="comment-left">
                <text class="comment-username">{{ comment.name }}</text>
                <text class="comment-time">{{ comment.time }}</text>
              </view>
              <view class="comment-right-section">
                <view class="comment-like" @click="toggleCommentLike(comment)">
                  <text class="like-icon" :class="{ 'liked': comment.isLiked }">♥</text>
                  <text class="like-count" v-if="comment.likeCount > 0">{{ comment.likeCount }}</text>
                </view>
                <text class="comment-reply" @click="replyToComment(comment)">回复</text>
              </view>
            </view>
            <!-- 评论内容 -->
            <view class="comment-meta">
              <text class="comment-text">{{ comment.content }}</text>
              <!-- 回复列表 -->
              <view class="replies-section" v-if="comment.replies && comment.replies.length > 0">
                <view class="reply-item" v-for="(reply, replyIndex) in comment.replies" :key="replyIndex">
                  <image class="reply-avatar" :src="reply.avatar" mode="aspectFill"></image>
                  <view class="reply-content-wrapper">
                    <view class="reply-header">
                      <view class="reply-left">
                        <text class="reply-username">{{ reply.name }}</text>
                        <text class="reply-time">{{ reply.time }}</text>
                      </view>
                      <view class="reply-right-section">
                        <view class="comment-like" @click="toggleReplyLike(reply)">
                          <text class="like-icon" :class="{ 'liked': reply.isLiked }">♥</text>
                          <text class="like-count" v-if="reply.likeCount > 0">{{ reply.likeCount }}</text>
                        </view>
                        <text class="comment-reply" @click="replyToReply(reply)">回复</text>
                      </view>
                    </view>
                    <text class="reply-content">{{ reply.content }}</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 评论底部提示 -->
      <view class="comment-end-tip">
        <text class="end-tip-text">---没有评论了，留下更多回忆吧---</text>
      </view>
      
      <!-- 底部留白区域 -->
      <view class="bottom-spacer"></view>
    </scroll-view>

    </scroll-view>

    <!-- 底部互动区域 -->
    <view class="bottom-actions">
      <view class="action-left">
        <view class="comment-input" @tap="showCommentInput">
          <image class="user-avatar" :src="currentUser.avatar" mode="aspectFill"></image>
          <text class="placeholder">说点什么...</text>
        </view>
      </view>
      <view class="action-right">
        <view class="action-btn" @tap="toggleLike">
          <text class="icon" :class="{ liked: isLiked }">♥</text>
          <text class="count">{{ likeCount }}</text>
        </view>
        <view class="action-btn" @tap="toggleFavorite">
          <text class="icon" :class="{ favorited: isFavorited }">☆</text>
          <text class="count">{{ favoriteCount }}</text>
        </view>
        <view class="action-btn" @tap="toggleComments">
          <text class="icon">💬</text>
          <text class="count">{{ commentList.length }}</text>
        </view>
      </view>
    </view>

    <!-- 评论弹窗 -->
    <view class="comment-modal" v-if="showCommentModal" @tap="hideComments">
      <view class="comment-content" @tap.stop>
        <view class="comment-header">
          <text class="comment-title">共{{ commentCount }}条评论</text>
          <text class="close-btn" @tap="hideComments">×</text>
        </view>
        <scroll-view class="comment-list" scroll-y>
          <view class="comment-item" v-for="comment in commentList" :key="comment.id">
            <image class="comment-avatar" :src="comment.avatar" mode="aspectFill"></image>
            <view class="comment-main">
              <view class="comment-user">
                <text class="comment-name">{{ comment.name }}</text>
                <text class="comment-time">{{ comment.time }}</text>
              </view>
              <text class="comment-text">{{ comment.content }}</text>
            </view>
            <text class="comment-like" :class="{ liked: comment.isLiked }" @tap="toggleCommentLike(comment)">♥</text>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      pageScrollTop: 0,
      userInfo: {
        name: '人中黄疯许陌蒸',
        avatar: '/static/logo.png',
        isFollowed: false
      },
      currentUser: {
        avatar: '/static/logo.png'
      },
      imageList: [
        '/static/logo.png'
      ],
      currentImageIndex: 0,
      contentInfo: {
        description: '我们一起说\n小舞生日快乐！',
        tags: ['斗罗大陆', '小舞', 'cos', 'cos正片', '三舞', '国漫'],
        time: '08-21',
        location: '杭州'
      },
      isLiked: false,
      isFavorited: false,
      likeCount: 79,
      favoriteCount: 32,
      commentCount: 11,
      showCommentModal: false,
      showComments: true, // 将这里改为true，让评论列表默认显示
      commentList: [],
      randomComments: [],
      usernames: [
        '司烬', '星白', '夏日', '冰喵喵', '野生的泡泡糖师', '王浩雄', 
        '分程', '冯华平喵', 'Tommy&小古', '冰喵喵', '等着面条有神桃花开', 'Clown小丑'
      ],
      commentTemplates: [
        '太好看了！', '小舞生日快乐！', '哈哈哈哈哈', '666，赞了赞了',
        '我也想去！', '好可爱啊', '拍得真好', '期待更多作品', '太棒了',
        '喜欢这个风格', ' really 不错', '支持支持', '好美啊', '太厉害了',
        '学到了', '收藏了', '转发了', '点赞👍', '真心不错', '继续加油'
      ]
    }
  },
  onLoad(options) {
    // 接收从首页传递的参数
    if (options.id) {
      this.cardId = options.id
      this.cardTitle = decodeURIComponent(options.title || '')
      this.cardAuthor = decodeURIComponent(options.author || '')
      this.cardLikes = parseInt(options.likes || 0)
    }
    
    // 生成随机评论数据
    this.generateRandomComments()
    
    // 加载详情数据
    this.loadDetailData(this.cardId)
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    toggleFollow() {
      this.userInfo.isFollowed = !this.userInfo.isFollowed
    },
    toggleLike() {
      this.isLiked = !this.isLiked
      this.likeCount += this.isLiked ? 1 : -1
    },
    toggleFavorite() {
      this.isFavorited = !this.isFavorited
      this.favoriteCount += this.isFavorited ? 1 : -1
    },
    toggleComments() {
      this.showComments = !this.showComments
      if (this.showComments && this.commentList.length === 0) {
        this.commentList = this.randomComments
      }
      
      if (this.showComments) {
        // 显示评论时滚动到评论区
        this.scrollToComments()
      }
      // 如果需要，隐藏评论时可以滚动回顶部
      // else {
      //   this.resetScroll()
      // }
    },
    
    resetScroll() {
      this.pageScrollTop = 0
    },
    
    // 新增专门的滚动方法
    scrollToComments() {
      const query = uni.createSelectorQuery().in(this)
      
      // 同时获取评论区域和页面滚动容器的信息
      query.select('.comment-count-section').boundingClientRect()
      query.select('.page-scroll').scrollOffset()
      
      query.exec((res) => {
        const commentRect = res[0]  // 评论区域位置信息
        const scrollData = res[1]   // 当前滚动位置信息
        
        if (commentRect && scrollData) {
          // 计算目标滚动位置
          // commentRect.top 是相对于视口的位置
          // scrollData.scrollTop 是当前滚动位置
          // 80 是导航栏高度，确保评论标题显示在导航栏下方
          const targetScrollTop = scrollData.scrollTop + commentRect.top - 80
          
          // 确保滚动位置不为负数
          const finalScrollTop = Math.max(0, targetScrollTop)
          
          // 使用一个小的延迟来触发滚动动画
          setTimeout(() => {
            this.pageScrollTop = finalScrollTop
          }, 50)
        }
      })
    },
    showComments() {
      this.showCommentModal = true
    },
    hideComments() {
      this.showCommentModal = false
    },
    showCommentInput() {
      // 显示评论输入框
      console.log('显示评论输入')
    },
    generateRandomComments() {
      const commentCount = Math.floor(Math.random() * 20) + 15; // 15-35条评论
      this.randomComments = [];
      
      for (let i = 0; i < commentCount; i++) {
        const comment = {
          id: i + 1,
          name: this.usernames[Math.floor(Math.random() * this.usernames.length)],
          avatar: '/static/logo.png',
          content: this.commentTemplates[Math.floor(Math.random() * this.commentTemplates.length)],
          time: this.getRandomTime(),
          timestamp: this.getRandomTimestamp(),
          isLiked: Math.random() > 0.7,
          likeCount: Math.floor(Math.random() * 50),
          replies: Math.random() > 0.5 ? this.generateReplies() : [] // 50%的概率有回复
        };
        this.randomComments.push(comment);
      }
      
      // 按热度和时间排序
      const allCommentsByHot = [...this.randomComments].sort((a, b) => b.likeCount - a.likeCount);
      const hotestComment = allCommentsByHot[0];
      const remainingComments = allCommentsByHot.slice(1);
      const recentCount = Math.floor(Math.random() * 3) + 1;
      const recentComments = [...remainingComments]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, recentCount);
      
      const otherComments = remainingComments
        .filter(comment => !recentComments.some(recent => recent.id === comment.id))
        .sort((a, b) => b.likeCount - a.likeCount);
      
      this.randomComments = [hotestComment, ...recentComments, ...otherComments];
      this.commentList = this.randomComments;
    },
    
    generateReplies() {
      const replyCount = Math.floor(Math.random() * 3); // 0-2条回复
      const replies = [];
      
      for (let i = 0; i < replyCount; i++) {
        replies.push({
          id: i + 1,
          name: this.usernames[Math.floor(Math.random() * this.usernames.length)],
          avatar: '/static/logo.png',
          content: this.commentTemplates[Math.floor(Math.random() * this.commentTemplates.length)],
          time: this.getRandomTime(),
          isLiked: Math.random() > 0.8,
          likeCount: Math.floor(Math.random() * 20)
        });
      }
      
      return replies;
    },

    toggleCommentLike(comment) {
      comment.isLiked = !comment.isLiked;
      comment.likeCount += comment.isLiked ? 1 : -1;
      if (comment.likeCount < 0) comment.likeCount = 0;
    },

    toggleReplyLike(reply) {
      reply.isLiked = !reply.isLiked;
      reply.likeCount += reply.isLiked ? 1 : -1;
      if (reply.likeCount < 0) reply.likeCount = 0;
    },

    replyToComment(comment) {
      console.log('回复评论:', comment.name);
      // 这里可以添加回复评论的逻辑
    },

    replyToReply(reply) {
      console.log('回复回复:', reply.name);
      // 这里可以添加回复回复的逻辑
    },
    
    getRandomTime() {
      const timeOptions = [
        '刚刚', '1分钟前', '5分钟前', '10分钟前', '30分钟前',
        '1小时前', '2小时前', '3小时前', '5小时前',
        '昨天', '2天前', '3天前', '1周前'
      ];
      return timeOptions[Math.floor(Math.random() * timeOptions.length)];
    },
    
    getRandomTimestamp() {
      const now = Date.now();
      const timeRanges = [
        now - 60 * 1000, // 1分钟前
        now - 5 * 60 * 1000, // 5分钟前
        now - 10 * 60 * 1000, // 10分钟前
        now - 30 * 60 * 1000, // 30分钟前
        now - 60 * 60 * 1000, // 1小时前
        now - 2 * 60 * 60 * 1000, // 2小时前
        now - 3 * 60 * 60 * 1000, // 3小时前
        now - 5 * 60 * 60 * 1000, // 5小时前
        now - 24 * 60 * 60 * 1000, // 昨天
        now - 2 * 24 * 60 * 60 * 1000, // 2天前
        now - 3 * 24 * 60 * 60 * 1000, // 3天前
        now - 7 * 24 * 60 * 60 * 1000 // 1周前
      ];
      return timeRanges[Math.floor(Math.random() * timeRanges.length)];
    },
    
    loadDetailData(id) {
      // 根据ID加载详情数据
      console.log('加载详情数据:', id)
      
      // 这里可以添加实际的数据加载逻辑
      // 比如从API获取详细信息，更新页面数据等
      if (this.cardTitle) {
        this.contentInfo.description = this.cardTitle
      }
      if (this.cardAuthor) {
        this.userInfo.name = this.cardAuthor
      }
      if (this.cardLikes) {
        this.likeCount = this.cardLikes
      }
    }
  }
}
</script>

<style scoped>
.detail-page {
  height: 100vh;
  background: #fff;
  display: flex;
  flex-direction: column;
}

.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: #ffffff;
  padding-top: calc(var(--status-bar-height) + 29px);
}

.nav-bar {
  display: flex;
  align-items: center;
  height: 44px;
  padding: 0 16px;
}

.nav-center {
  flex: 1;
  display: flex;
  justify-content: flex-start;
  align-items: flex-end;
  margin-left: 0;
  padding-left: 8px;
  padding-bottom: 4px;
}

.nav-right {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  padding-bottom: 4px;
}

.user-info {
  display: flex;
  align-items: center;
}

.avatar {
  width: 39px;
  height: 39px;
  border-radius: 16px;
  margin-right: 8px;
  flex-shrink: 0;
}

.username {
  color: #000000;
  font-size: 16px;
  font-weight: 500;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 100%;
  margin-right: 80px;
}

.follow-btn {
  background: rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 16px;
  padding: 4px 12px;
}

.follow-btn.followed {
  background: rgba(0, 0, 0, 0.15);
}

.follow-btn text {
  color: #000000;
  font-size: 14px;
}

.icon-back {
  color: #000000;
  font-size: 36px;
  position: relative;
  top: -2px;
}

.share-icon {
  color: #000000;
  font-size: 20px;
}

.content-scroll {
  flex: 1;
  margin-top: calc(44px + var(--status-bar-height) + 29px);
  margin-bottom: 60px;
}

/* 评论数量显示区域样式 */
.comment-end-tip {
  padding: 15px;
  text-align: center;
  background: transparent;
  margin: 10px 16px;
}

.end-tip-text {
  font-size: 14px;
  color: #999;
  line-height: 1.5;
}

.bottom-spacer {
  height: 100px;
  background: transparent;
}

/* 评论数量标题样式 */
.comment-count-section {
  background: #fff;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 80px; /* 导航栏高度 */
  z-index: 10;
}

.comment-count {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  border-left: 3px solid #007AFF;
  padding-left: 12px;
}

/* 评论区域样式 */
.comments-section {
  background: #fff;
  padding: 0 16px;
}

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

.comment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.comment-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: -23px;
}

.comment-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.comment-username {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.comment-time {
  font-size: 12px;
  color: #999;
}

.comment-right-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.comment-meta {
  display: flex;
  flex-direction: column;
}

.comment-text {
  font-size: 14px;
  color: #333;
  line-height: 1.4;
  margin-bottom: 6px;
  word-wrap: break-word;
}

.comment-reply {
  font-size: 12px;
  color: #999;
  cursor: pointer;
}

.comment-reply:hover {
  color: #007AFF;
}

/* 回复区域样式 */
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

.reply-item:last-child {
  margin-bottom: 0;
}

.reply-avatar {
  width: 32px;
  height: 32px;
  border-radius: 16px;
  margin-right: 8px;
  flex-shrink: 0;
}

.reply-content-wrapper {
  flex: 1;
  min-width: 0;
}

.reply-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: -27px;
}

.reply-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.reply-username {
  font-size: 12px;
  font-weight: 600;
  color: #666;
}

.reply-time {
  font-size: 11px;
  color: #999;
}

.reply-right-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.reply-like {
  color: #999;
  font-size: 14px;
  padding: 2px;
}

.reply-like .like-icon.liked {
  color: #ff4757;
}

.reply-like .like-count {
  font-size: 10px;
  color: #999;
}

.reply-reply {
  font-size: 10px;
  color: #999;
  cursor: pointer;
}

.reply-reply:hover {
  color: #007AFF;
}

.reply-content {
  font-size: 12px;
  color: #333;
  line-height: 1.4;
  word-wrap: break-word;
}

.like-icon {
  font-size: 16px;
  color: #ccc;
  transition: color 0.3s;
}

.like-icon.liked {
  color: #ff4757;
}

.image-container {
  position: relative;
  height: 60vh;
}

.image-swiper {
  height: 100%;
}

.main-image {
  width: 100%;
  height: 100%;
}

.image-indicator {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 12px;
  padding: 4px 8px;
}

.image-indicator text {
  color: #fff;
  font-size: 12px;
}

.content-area {
  padding: 20px 16px;
  background: #fff;
}

.description {
  margin-bottom: 12px;
}

.desc-text {
  font-size: 16px;
  line-height: 1.5;
  color: #333;
}

.tags-area {
  margin-bottom: 12px;
}

.tag {
  color: #1890ff;
  font-size: 14px;
  margin-right: 8px;
}

.meta-info {
  display: flex;
  gap: 12px;
}

.time, .location {
  color: #999;
  font-size: 12px;
}

.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  border-top: 1px solid #f0f0f0;
}

.action-left {
  flex: 1;
  margin-right: 12px;
}

.comment-input {
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 20px;
  padding: 8px 12px;
}

.user-avatar {
  width: 24px;
  height: 24px;
  border-radius: 12px;
  margin-right: 8px;
}

.placeholder {
  color: #999;
  font-size: 14px;
}

.action-right {
  display: flex;
  gap: 16px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.action-btn .icon {
  font-size: 20px;
  color: #666;
}

.action-btn .icon.liked {
  color: #ff4757;
}

.action-btn .icon.favorited {
  color: #ffa502;
}

.action-btn .count {
  font-size: 12px;
  color: #999;
}

.comment-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.comment-content {
  background: #fff;
  border-radius: 12px 12px 0 0;
  max-height: 60vh;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.comment-title {
  font-size: 16px;
  font-weight: 500;
}

.close-btn {
  font-size: 24px;
  color: #999;
}

.comment-list {
  flex: 1;
  padding: 0 16px;
}

.comment-main {
  flex: 1;
}

.comment-user {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.comment-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.comment-like {
  color: #999;
  font-size: 16px;
  padding: 4px;
}

.comment-like.liked {
  color: #ff4757;
}
</style>
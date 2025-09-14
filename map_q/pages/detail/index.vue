<template>
  <view class="detail-page">
    <!-- 页面滚动容器 -->
    <scroll-view class="page-scroll" scroll-y :style="{ height: '100vh' }">

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
            <view class="comment-header">
              <text class="comment-username">{{ comment.name }}</text>
              <text class="comment-time">{{ comment.time }}</text>
            </view>
            <text class="comment-text">{{ comment.content }}</text>
            <view class="comment-footer">
              <view class="comment-actions">
                <view class="comment-like" @click="toggleCommentLike(comment)">
                  <text class="iconfont icon-like" :class="{ 'liked': comment.isLiked }">♥</text>
                  <text class="like-count">{{ comment.likeCount }}</text>
                </view>
                <text class="comment-reply">回复</text>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 评论底部提示 -->
        <view class="comment-end-tip">
          <text class="end-tip-text">到底了</text>
        </view>
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
      commentTemplates: [
        '太好看了！',
        '小舞生日快乐！',
        '哈哈哈哈哈',
        '666，赞了赞了',
        '我也想去！',
        '好可爱啊',
        '拍得真好',
        '期待更多作品',
        '太棒了',
        '喜欢这个风格',
        '真的很不错',
        '支持支持',
        '好美啊',
        '太厉害了',
        '学到了',
        '收藏了',
        '转发了',
        '点赞👍',
        '真心不错',
        '继续加油'
      ],
      usernames: [
        '司烬', '星白', '夏日', '冰喵喵', '野生的泡泡糖师', '王浩雄', '分程', '冯华平喵', 'Tommy&小古', '冰喵喵', '等着面条有神桃花开', 'Clown小丑'
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
      
      // 如果显示评论，则滚动到评论区域
      if (this.showComments) {
        this.$nextTick(() => {
          // 使用 uni.createSelectorQuery 获取评论区域的位置
          const query = uni.createSelectorQuery().in(this)
          query.select('.comments-section').boundingClientRect(data => {
            if (data) {
              // 获取页面滚动视图
              const scrollQuery = uni.createSelectorQuery().in(this)
              scrollQuery.select('.page-scroll').scrollOffset(scrollData => {
                // 计算需要滚动的距离
                // data.top 是评论区域相对于页面顶部的距离
                // 减去导航栏高度（大约44px）和一些缓冲空间
                const targetScrollTop = scrollData.scrollTop + data.top - 60
                
                // 执行滚动动画
                uni.pageScrollTo({
                  scrollTop: targetScrollTop,
                  duration: 300 // 300ms 的滚动动画
                })
              }).exec()
            }
          }).exec()
        })
      }
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
          timestamp: this.getRandomTimestamp(), // 添加时间戳用于排序
          isLiked: Math.random() > 0.7,
          likeCount: Math.floor(Math.random() * 50),
          replies: Math.random() > 0.8 ? this.generateReplies() : []
        };
        this.randomComments.push(comment);
      }
      
      // 1. 先按热度排序（点赞数降序）获取所有评论
      const allCommentsByHot = [...this.randomComments].sort((a, b) => b.likeCount - a.likeCount);
      
      // 2. 获取热度最高的评论（第一条）
      const hotestComment = allCommentsByHot[0];
      
      // 3. 从剩余评论中按时间排序获取1-3条最新的评论
      const remainingComments = allCommentsByHot.slice(1);
      const recentCount = Math.floor(Math.random() * 3) + 1; // 1-3条
      const recentComments = [...remainingComments]
        .sort((a, b) => b.timestamp - a.timestamp) // 按时间戳降序排序
        .slice(0, recentCount); // 取前几条最新的
      
      // 4. 获取剩余的评论（除了最热门的和最新的）
      const otherComments = remainingComments
        .filter(comment => !recentComments.some(recent => recent.id === comment.id))
        .sort((a, b) => b.likeCount - a.likeCount); // 继续按热度排序
      
      // 5. 最终排序：最热门的 + 最新的1-3条 + 其他按热度排序的
      this.randomComments = [hotestComment, ...recentComments, ...otherComments];
      
      // 初始化commentList
      this.commentList = this.randomComments
    },
    
    generateReplies() {
      const replyCount = Math.floor(Math.random() * 3) + 1;
      const replies = [];
      
      for (let i = 0; i < replyCount; i++) {
        replies.push({
          id: Date.now() + i,
          name: this.usernames[Math.floor(Math.random() * this.usernames.length)],
          content: this.commentTemplates[Math.floor(Math.random() * this.commentTemplates.length)]
        });
      }
      
      return replies;
    },
    
    getRandomTime() {
      const timeOptions = [
        '刚刚', '1分钟前', '5分钟前', '10分钟前', '30分钟前',
        '1小时前', '2小时前', '3小时前', '5小时前',
        '昨天', '2天前', '3天前', '1周前'
      ];
      return timeOptions[Math.floor(Math.random() * timeOptions.length)];
    },
    
    // 添加新方法：生成随机时间戳
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
    
    toggleCommentLike(comment) {
      comment.isLiked = !comment.isLiked;
      comment.likeCount += comment.isLiked ? 1 : -1;
      if (comment.likeCount < 0) comment.likeCount = 0;
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
  width: 32px;
  height: 32px;
  border-radius: 16px;
  margin-right: 8px;
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
  padding: 30rpx 20rpx;
  text-align: center;
  background: #f8f8f8;
  margin-top: 20rpx;
}

.end-tip-text {
  font-size: 28rpx;
  color: #999;
  line-height: 1.5;
}

.comment-count {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

/* 评论区域样式 */
.comments-section {
  background: #fff;
  padding: 0 16px;
}

.comment-item {
  display: flex;
  padding: 16px 0;
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
  margin-bottom: 6px;
}

.comment-username {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-right: 8px;
}

.comment-time {
  font-size: 13px;
  color: #999;
  margin-left: auto;
}

.comment-text {
  font-size: 15px;
  color: #333;
  line-height: 1.4;
  margin-bottom: 8px;
  word-wrap: break-word;
}

.comment-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.comment-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.comment-like {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.comment-like .icon-like {
  font-size: 16px;
  color: #999;
  transition: color 0.3s;
}

.comment-like .icon-like.liked {
  color: #ff6b6b;
}

.like-count {
  font-size: 13px;
  color: #999;
}

.comment-reply {
  font-size: 13px;
  color: #999;
  cursor: pointer;
}

.comment-reply:hover {
  color: #007AFF;
}

.reply-item {
  background: #f8f8f8;
  padding: 8px 12px;
  border-radius: 8px;
  margin-bottom: 4px;
}

.reply-username {
  font-size: 12px;
  color: #666;
  margin-right: 4px;
}

.reply-text {
  font-size: 12px;
  color: #333;
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
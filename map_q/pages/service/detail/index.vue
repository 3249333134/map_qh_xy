<template>
  <scroll-view class="detail-page" scroll-y>
    <!-- 顶部导航（与首页详情页一致） -->
    <Header
      :userInfo="headerUserInfo"
      @back="onBack"
      @follow="toggleFollow"
      @share="onShare"
    />

    <!-- 顶部大图/轮播 -->
    <view class="hero">
      <!-- 使用与首页详情页一致的图片轮播组件，支持单图复制为三张、自动播放、触摸暂停和图片预览 -->
      <ImageSlider :images="images" :countBottom="39" />

      <view class="hero-info">
        <view class="name-row">
          <text class="name">{{ serviceItem.name || '服务详情' }}</text>
          <view class="distance-chip" v-if="distanceText">{{ distanceText }}</view>
        </view>
        <view class="rating-row">
          <view class="stars">
            <text v-for="i in 5" :key="i" class="star" :class="{ active: i <= Math.round(ratingValue) }">★</text>
          </view>
          <text class="rating-text">{{ ratingValue.toFixed(1) }}</text>
          <text class="reviews-count">({{ ratingCount }} 条评价)</text>
        </view>
      </view>
    </view>

    <!-- 关于我 -->
    <view class="section card about">
      <text class="section-title">关于我</text>
      <text class="about-text">
        {{ aboutCollapsed ? briefAbout : (serviceItem.description || '暂无描述') }}
        <text v-if="hasMoreAbout" class="link" @tap="toggleAbout">{{ aboutCollapsed ? '展开' : '收起' }}</text>
      </text>
    </view>

    <!-- 成交/服务完成数 -->
    <view class="section stat-card">
      <view class="stat-number">{{ serviceCompletedText }}</view>
      <text class="stat-label">已完成服务</text>
    </view>

    <!-- 兴趣 -->
    <view class="section">
      <text class="section-title">兴趣</text>
      <view class="chip-wrap">
        <view v-for="(tag,i) in interests" :key="i" class="chip">{{ tag }}</view>
      </view>
    </view>

    <!-- 偏好 -->
    <view class="section">
      <text class="section-title">偏好</text>
      <view class="chip-wrap">
        <view v-for="(tag,i) in preferences" :key="'p'+i" class="chip ghost">{{ tag }}</view>
      </view>
    </view>

    <!-- 我的服务列表 -->
    <view class="section">
      <text class="section-title">我的服务</text>
      <view class="service-list">
        <view v-for="(svc,i) in servicesOffering" :key="i" class="svc-item">
          <image class="svc-thumb" :src="svc.image || images[0]" mode="aspectFill" />
          <view class="svc-meta">
            <text class="svc-title">{{ svc.title }}</text>
            <text class="svc-duration">{{ svc.duration }}</text>
            <text class="svc-price">¥ {{ svc.price }}</text>
          </view>
          <button class="svc-book" size="mini" @tap="bookService(svc)">预约</button>
        </view>
      </view>
    </view>

    <!-- 评分与评论（评分摘要 + 与首页详情一致的 CommentsSection） -->
    <view class="section">
      <text class="section-title">评价</text>
      <view class="rating-summary">
        <text class="rating-big">综合评分 {{ ratingValue.toFixed(1) }}</text>
        <text class="reviews-count">{{ ratingCount }} 条评价</text>
      </view>
      <view class="rating-bars">
        <view v-for="n in 5" :key="n" class="bar-row">
          <text class="bar-label">{{ 6 - n }}</text>
          <view class="bar">
            <view class="bar-inner" :style="{ width: (distribution[6-n] || 0) + '%' }" />
          </view>
          <text class="bar-percent">{{ (distribution[6-n] || 0) }} %</text>
        </view>
      </view>

      <!-- 使用与首页详情页一致的评论组件 -->
      <view class="comments-fullbleed">
        <CommentsSection
          :comments="comments"
          :hasMoreComments="hasMoreComments"
          :loading="loadingComments"
          @loadMore="loadMoreComments"
          @likeComment="likeComment"
          @replyComment="replyComment"
        />
      </view>
    </view>

    <view :style="{ height: placeholderHeightRpx + 'rpx' }" />
  </scroll-view>

  <!-- 底部操作栏：收藏 / 客服 / 购物车 / 立即预约 -->
  <view class="bottom-actions" :style="bottomActionsStyle">
    <view class="actions-left">
      <view class="action-item" @tap="toggleCollect">
        <text class="action-icon" :class="{ active: isCollected }">{{ isCollected ? '★' : '☆' }}</text>
        <text class="action-text">{{ isCollected ? '已收藏' : '收藏' }}</text>
      </view>
      <view class="action-item" @tap="contactService">
        <text class="action-icon">客</text>
        <text class="action-text">客服</text>
      </view>
      <view class="action-item cart" @tap="openCart">
        <text class="action-icon">🛒</text>
        <text class="action-text">购物车</text>
        <text v-if="cartCount > 0" class="badge">{{ cartCount }}</text>
      </view>
    </view>
    <button class="action-cta" @tap="bookNow">立即预约</button>
  </view>
</template>

<script>
import Header from '../../detail/components/Header.vue'
import ImageSlider from '../../detail/components/ImageSlider.vue'
import CommentsSection from '../../detail/components/CommentsSection.vue'
export default {
  components: { Header, ImageSlider, CommentsSection },
  data() {
    return {
      serviceItem: {
        _id: '',
        name: '',
        author: '',
        address: '',
        description: '',
        distance: '',
        images: []
      },
      images: [],
      isFollowed: false,
      // 底部操作栏状态
      isCollected: false,
      cartCount: 0,
      // 动态 TabBar 等高（rpx）与安全区底部（rpx）
      tabHeightRpx: 100,
      safeBottomRpx: 0,
      // 视觉微调量：为不同平台做 2~4rpx 的细微修正
      microAdjustRpx: 0,
      // 整体抬高量（不再使用，改为直接压缩可视高度）
      raiseRpx: 0,
      // 底部安全区上限：避免过度留白（rpx）
      safeBottomCapRpx: 32,
      // 额外底部内边距：确保文字高于中间黑色横条
      bottomExtraRpx: 0,
      // 底部操作栏内容整体下移偏移（rpx），用于微调视觉位置
      contentOffsetRpx: 0,
      // 评论数据（与首页详情页一致）
      comments: [],
      hasMoreComments: true,
      loadingComments: false,
      aboutCollapsed: true,
      serviceCompleted: 2652,
      interests: ['书籍与小说', '电影', '建筑'],
      preferences: ['朋友', '商务', '女性'],
      servicesOffering: [
        { title: '生日派对', duration: '30分钟', price: 200 },
        { title: '周年庆', duration: '30分钟', price: 200 },
        { title: '晚餐陪伴', duration: '60分钟', price: 380 }
      ],
      ratingValue: 4.8,
      ratingCount: 300,
      distribution: { 5: 88, 4: 10, 3: 1, 2: 1, 1: 0 }
    }
  },
  computed: {
    headerUserInfo() {
      return {
        name: this.serviceItem.name || '服务详情',
        avatar: (this.images && this.images[0]) || '/static/logo.png',
        isFollowed: this.isFollowed
      }
    },
    longitude() {
      const loc = this.serviceItem.location
      return loc && Array.isArray(loc.coordinates) ? loc.coordinates[0] : 104.066541
    },
    latitude() {
      const loc = this.serviceItem.location
      return loc && Array.isArray(loc.coordinates) ? loc.coordinates[1] : 30.572269
    },
    hasMoreAbout() {
      return (this.serviceItem.description || '').length > 110
    },
    briefAbout() {
      const text = this.serviceItem.description || '暂无描述'
      return this.hasMoreAbout ? text.slice(0, 110) + '...' : text
    },
    distanceText() {
      return this.serviceItem.distance ? `${this.serviceItem.distance}` : ''
    },
    serviceCompletedText() {
      try { return Number(this.serviceCompleted).toLocaleString() } catch (e) { return String(this.serviceCompleted) }
    },
    // 计算：占位高度与底部栏样式
    placeholderHeightRpx() {
      // 使用压缩并设定上限后的安全区，确保滚动内容不被遮挡但不过度留白
      const compactSafe = Math.min(Math.max(0, this.safeBottomRpx - 10), this.safeBottomCapRpx)
      return (this.tabHeightRpx - 2) + compactSafe
    },
    bottomActionsStyle() {
      // 更薄的顶部内边距，压缩底部安全区留白并设上限
      const topPad = (2 + (this.microAdjustRpx || 0) + (this.contentOffsetRpx || 0))
      const compactSafe = Math.min(Math.max(0, this.safeBottomRpx - 10), this.safeBottomCapRpx)
      return {
        // 整体高度略小于系统 TabBar，使视觉更薄
        height: (this.tabHeightRpx - 2) + 'rpx',
        padding: `${topPad}rpx 12px ${compactSafe}rpx`
      }
    }
  },
  onLoad(options) {
    const source = options && options.source || ''
    
    const ec = this.getOpenerEventChannel && this.getOpenerEventChannel()
    if (ec) {
      ec.on('service-item', ({ item }) => {
        const normalized = this.normalizeItem(item)
        this.serviceItem = normalized
        this.images = (normalized.images && normalized.images.length ? normalized.images : [ '/static/logo.png' ])
        uni.setNavigationBarTitle({ title: normalized.name || '服务详情' })
        // 使用服务页专用存储
        uni.setStorageSync('SERVICE_LAST_ITEM', normalized)
      })
    }
    if (!this.serviceItem._id) {
      // 优先从服务页专用存储加载
      const cached = uni.getStorageSync('SERVICE_LAST_ITEM')
      if (cached && cached._id) {
        this.serviceItem = cached
        this.images = (cached.images && cached.images.length ? cached.images : [ '/static/logo.png' ])
        uni.setNavigationBarTitle({ title: cached.name || '服务详情' })
      } else {
        // 兼容旧的存储方式
        const oldCached = uni.getStorageSync('LAST_SERVICE_ITEM')
        if (oldCached && oldCached._id) {
          this.serviceItem = oldCached
          this.images = (oldCached.images && oldCached.images.length ? oldCached.images : [ '/static/logo.png' ])
          uni.setNavigationBarTitle({ title: oldCached.name || '服务详情' })
        } else {
          this.images = ['/static/logo.png']
        }
      }
    }

    // 直接绑定首页（系统）TabBar 高度：读取 App 启动时缓存的全局度量
    try {
      const app = getApp && getApp()
      let metrics = uni.getStorageSync('TABBAR_METRICS')
      if (!metrics || !metrics.tabHeightRpx) {
        metrics = app && app.computeTabBarMetrics ? app.computeTabBarMetrics() : null
      }
      if (metrics) {
        this.tabHeightRpx = metrics.tabHeightRpx
        this.safeBottomRpx = metrics.safeBottomRpx
        this.microAdjustRpx = metrics.microAdjustRpx || 0
      }
    } catch (e) {
      // 兜底：保持原有默认值
      this.tabHeightRpx = 100
      this.safeBottomRpx = 0
      this.microAdjustRpx = 0
    }

    // 初始化评论（与首页详情页一致的生成与加载逻辑）
    this.getComments()
  },
  methods: {
    normalizeItem(item) {
      if (!item) return {}
      const id = item._id || item.id || `id_${Date.now()}_${Math.random()}`
      const name = item.name || item.title || '服务'
      const author = item.author || '未知提供商'
      const address = item.address || '暂无地址'
      const description = item.description || ''
      const distance = item.distance || (item.km ? `${item.km} 公里` : '')
      let images = item.images || item.photos || []
      if (!Array.isArray(images) || images.length === 0) images = ['/static/logo.png']
      let location = item.location
      if (!location && item.coordinates && Array.isArray(item.coordinates)) {
        location = { type: 'Point', coordinates: item.coordinates }
      }
      return { _id: id, name, author, address, description, distance, images, location }
    },
    onBack() { uni.navigateBack() },
    onShare() {
      uni.setClipboardData({
        data: `${this.serviceItem.name} - ${this.serviceItem.address || ''}`,
        success: () => uni.showToast({ title: '已复制', icon: 'none' })
      })
    },
    toggleFollow() {
      this.isFollowed = !this.isFollowed
      uni.showToast({ title: this.isFollowed ? '已关注' : '已取消关注', icon: 'none' })
    },
    bookService(svc) {
      uni.showToast({ title: `预约：${svc.title}`, icon: 'none' })
    },
    // 底部操作栏交互
    toggleCollect() {
      this.isCollected = !this.isCollected
      uni.showToast({ title: this.isCollected ? '已收藏' : '已取消收藏', icon: 'none' })
    },
    contactService() {
      // 这里可接入客服会话或跳转客服页面
      uni.showToast({ title: '联系客服', icon: 'none' })
    },
    openCart() {
      uni.showToast({ title: '打开购物车', icon: 'none' })
    },
    bookNow() {
      // 统一预约入口：可跳转预约流程，或使用已有列表项预约
      if (this.servicesOffering && this.servicesOffering.length) {
        this.bookService(this.servicesOffering[0])
      } else {
        uni.showToast({ title: '立即预约', icon: 'none' })
      }
    },
    toggleAbout() { this.aboutCollapsed = !this.aboutCollapsed },
    
    // ===== 评论模块：与首页详情页一致的逻辑 =====
    // 生成随机时间和时间戳（与首页逻辑保持一致）
    getRandomTime() {
      const minutesAgo = Math.floor(Math.random() * 60)
      if (minutesAgo < 1) return '刚刚'
      if (minutesAgo < 60) return `${minutesAgo}分钟前`
      const hoursAgo = Math.floor(minutesAgo / 60)
      if (hoursAgo < 24) return `${hoursAgo}小时前`
      const daysAgo = Math.floor(hoursAgo / 24)
      return `${daysAgo}天前`
    },
    getRandomTimestamp() {
      const now = Date.now()
      const delta = Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)
      return now - delta
    },
    generateReplies() {
      const replyCount = Math.random() > 0.5 ? Math.floor(Math.random() * 3) + 1 : 0
      const arr = []
      for (let i = 0; i < replyCount; i++) {
        arr.push({
          avatar: '/static/logo.png',
          name: '用户' + Math.floor(Math.random() * 1000),
          time: this.getRandomTime(),
          content: '回复内容示例',
          isLiked: Math.random() > 0.7,
          likeCount: Math.floor(Math.random() * 20)
        })
      }
      return arr
    },
    generateRandomComments() {
      const usernames = ['司烬','星白','夏日','冰喵喵','野生的泡泡糖师','王浩雄','分程','冯华平喵','Tommy&小古','等着面条有神桃花开','Clown小丑']
      const commentTemplates = ['太好看了！','小舞生日快乐！','哈哈哈哈哈','666，赞了赞了','我也想去！','好可爱啊','拍得真好','期待更多作品','太棒了','喜欢这个风格','really 不错','支持支持','好美啊','太厉害了','学到了','收藏了','转发了','点赞👍','真心不错','继续加油']
      const count = Math.floor(Math.random() * 20) + 15
      const list = []
      for (let i = 0; i < count; i++) {
        list.push({
          id: i + 1,
          name: usernames[Math.floor(Math.random() * usernames.length)],
          avatar: '/static/logo.png',
          content: commentTemplates[Math.floor(Math.random() * commentTemplates.length)],
          time: this.getRandomTime(),
          timestamp: this.getRandomTimestamp(),
          isLiked: Math.random() > 0.7,
          likeCount: Math.floor(Math.random() * 50),
          // 新增：约 60% 的评论包含星级评分（3-5 星），有评分表示真的使用过服务
          rating: Math.random() < 0.6 ? (Math.floor(Math.random() * 3) + 3) : null,
          replies: Math.random() > 0.5 ? this.generateReplies() : []
        })
      }
      // 排序：置顶最热 + 若干最新，其余按热度
      const allByHot = [...list].sort((a,b) => b.likeCount - a.likeCount)
      const hotest = allByHot[0]
      const remain = allByHot.slice(1)
      const recentCount = Math.floor(Math.random() * 3) + 1
      const recent = [...remain].sort((a,b) => b.timestamp - a.timestamp).slice(0, recentCount)
      const others = remain.filter(c => !recent.some(r => r.id === c.id)).sort((a,b) => b.likeCount - a.likeCount)
      return [hotest, ...recent, ...others]
    },
    async getComments() {
      this.loadingComments = true
      await new Promise(resolve => setTimeout(resolve, 500))
      this.comments = this.generateRandomComments()
      this.loadingComments = false
      this.hasMoreComments = true
    },
    async loadMoreComments() {
      if (!this.hasMoreComments || this.loadingComments) return
      this.loadingComments = true
      await new Promise(resolve => setTimeout(resolve, 600))
      const more = this.generateRandomComments().slice(0, 5)
      this.comments = [...this.comments, ...more]
      if (this.comments.length > 50) this.hasMoreComments = false
      this.loadingComments = false
    },
    likeComment(commentId) {
      const c = this.comments.find(i => i.id === commentId)
      if (c) {
        c.isLiked = !c.isLiked
        c.likeCount += c.isLiked ? 1 : -1
        if (c.likeCount < 0) c.likeCount = 0
      }
    },
    replyComment(payloadOrId, maybeName) {
      let commentId, atName
      if (typeof payloadOrId === 'object' && payloadOrId !== null) {
        commentId = payloadOrId.commentId
        atName = payloadOrId.atName || ''
      } else {
        commentId = payloadOrId
        atName = maybeName || ''
      }
      const fromName = '我'
      console.log(`${fromName} 回复 ${atName}（评论ID: ${commentId}）`)
      this.showCommentInput(atName)
    },
    showCommentInput(atName = '') {
      try {
        const query = uni.createSelectorQuery()
        query.select('.comment-count-section').boundingClientRect()
        query.selectViewport().scrollOffset()
        query.exec(res => {
          const rect = res && res[0]
          const viewport = res && res[1]
          if (rect && viewport) {
            const top = Math.max(0, rect.top + viewport.scrollTop - 80)
            uni.pageScrollTo({ scrollTop: top, duration: 300 })
          }
        })
        if (atName) console.log('预填 @', atName)
      } catch (e) {
        console.log('显示评论输入框', atName)
      }
    },

    seeAllReviews() { uni.showToast({ title: '查看更多评价', icon: 'none' }) }
  }
}
</script>

<style scoped>
.detail-page { min-height: 100vh; background: #f7f8fa; }
.hero { position: relative; }
/* ImageSlider 自带高度，这里无需 hero-swiper/hero-img 样式，但保留不影响 */
.hero-swiper { width: 100%; height: 420rpx; }
.hero-img { width: 100%; height: 100%; display: block; }
/* 抬高信息条，避免遮挡 ImageSlider 右下角计数气泡 */
.hero-info { position: absolute; left: 0; right: 0; bottom: 24rpx; padding: 20rpx 16rpx 16rpx; background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 100%); color: #fff; }
.name-row { display: flex; align-items: center; justify-content: space-between; }
.name { font-size: 34rpx; font-weight: 700; }
.distance-chip { background: rgba(255,255,255,0.9); color: #111; padding: 6rpx 12rpx; border-radius: 28rpx; font-size: 22rpx; }
.rating-row { margin-top: 8rpx; display: flex; align-items: center; gap: 12rpx; }
.stars { display: flex; gap: 6rpx; }
.star { color: #bbb; font-size: 26rpx; }
.star.active { color: #FFD54F; }
.rating-text { font-size: 26rpx; }
.reviews-count { font-size: 22rpx; opacity: 0.9; }

.section { margin: 18rpx 20rpx 0; background: #fff; border-radius: 16rpx; padding: 22rpx; }
.card { box-shadow: 0 6rpx 18rpx rgba(0,0,0,0.06); }
.section-title { font-size: 28rpx; font-weight: 600; color: #111; }
.about-text { margin-top: 12rpx; font-size: 26rpx; color: #444; line-height: 1.7; }
.link { color: #3978ff; margin-left: 10rpx; }

.stat-card { display: flex; flex-direction: column; align-items: center; justify-content: center; }
.stat-number { font-size: 40rpx; color: #1a9f5a; font-weight: 800; }
.stat-label { margin-top: 8rpx; font-size: 24rpx; color: #4a4a4a; }

.chip-wrap { margin-top: 14rpx; display: flex; flex-wrap: wrap; gap: 14rpx; }
.chip { padding: 10rpx 18rpx; background: #EDF2FF; color: #276EF1; border-radius: 26rpx; font-size: 24rpx; }
.chip.ghost { background: #F5F5F5; color: #555; }

.service-list { margin-top: 12rpx; display: flex; flex-direction: column; gap: 16rpx; }
.svc-item { display: flex; align-items: center; gap: 16rpx; padding: 16rpx; border: 1rpx solid #f0f0f0; border-radius: 12rpx; }
.svc-thumb { width: 120rpx; height: 120rpx; border-radius: 10rpx; background: #eee; }
.svc-meta { flex: 1; display: flex; flex-direction: column; gap: 6rpx; }
.svc-title { font-size: 28rpx; font-weight: 600; color: #111; }
.svc-duration { font-size: 24rpx; color: #666; }
.svc-price { font-size: 28rpx; color: #1f7a37; font-weight: 700; }
.svc-book { background: #FFD400; color: #333; border: 0; border-radius: 12rpx; padding: 0 18rpx; height: 60rpx; line-height: 60rpx; }

.rating-summary { display: flex; align-items: baseline; gap: 12rpx; margin-top: 8rpx; }
.rating-big { font-size: 30rpx; color: #1a8f43; font-weight: 700; }
.rating-bars { margin-top: 12rpx; display: flex; flex-direction: column; gap: 10rpx; }
.bar-row { display: flex; align-items: center; gap: 12rpx; }
.bar-label { width: 28rpx; text-align: right; color: #666; font-size: 22rpx; }
.bar { flex: 1; height: 14rpx; background: #F2F3F5; border-radius: 8rpx; overflow: hidden; }
.bar-inner { height: 100%; background: #2ecc71; border-radius: 8rpx; }
.bar-percent { width: 80rpx; text-align: right; color: #666; font-size: 22rpx; }

/* 评论组件外层无需额外样式，这里保留与页面风格一致的间距 */

</style>

<style scoped>
/* 底部操作栏样式 */
.bottom-actions {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: #fff;
  /* 高度与内边距改为运行时动态绑定（与系统 TabBar 等高） */
  border-top: 1rpx solid #eee;
  box-sizing: border-box;
}
.actions-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.action-item {
  position: relative;
  width: 120rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
}
.action-icon {
  width: 56rpx;
  height: 56rpx;
  line-height: 56rpx;
  text-align: center;
  border-radius: 50%;
  background: #f5f5f5;
  color: #333;
  font-size: 28rpx;
}
.action-icon.active { color: #ffb300; }
.action-text { font-size: 22rpx; color: #333; }

.action-item.cart .badge {
  position: absolute;
  top: -8rpx;
  right: 10rpx;
  background: #ff4d4f;
  color: #fff;
  border-radius: 20rpx;
  padding: 0 10rpx;
  font-size: 20rpx;
  line-height: 28rpx;
}

.action-cta {
  flex: 1;
  height: 56rpx;
  line-height: 56rpx;
  text-align: center;
  background: #ff4d4f;
  color: #fff;
  border: none;
  border-radius: 44rpx;
  font-size: 28rpx;
  font-weight: 700;
}
.comments-fullbleed { margin-left: -22rpx; margin-right: -22rpx; }
</style>
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

    <!-- 评分与评论 -->
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
      <view class="review-list">
        <view v-for="(rv,i) in reviews" :key="i" class="review-item">
          <image class="avatar" :src="rv.avatar || '/static/logo.png'" mode="cover" />
          <view class="review-body">
            <view class="review-head">
              <text class="review-name">{{ rv.name }}</text>
              <text class="review-date">{{ rv.date }}</text>
              <view class="review-stars">
                <text v-for="i2 in 5" :key="i2" class="star" :class="{ active: i2 <= rv.stars }">★</text>
              </view>
            </view>
            <text class="review-text">{{ rv.text }}</text>
          </view>
        </view>
      </view>
      <text class="link see-all" @tap="seeAllReviews">查看全部评价</text>
    </view>

    <view style="height: 80rpx" />
  </scroll-view>
</template>

<script>
import Header from '../../detail/components/Header.vue'
import ImageSlider from '../../detail/components/ImageSlider.vue'
export default {
  components: { Header, ImageSlider },
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
      distribution: { 5: 88, 4: 10, 3: 1, 2: 1, 1: 0 },
      reviews: [
        { name: 'Wade Warren', date: '2022-12-12', stars: 5, text: '体验很棒，专业且细心。', avatar: '/static/logo.png' },
        { name: 'Bessie Cooper', date: '2022-12-12', stars: 5, text: '沟通顺畅，准时到达，推荐！', avatar: '/static/logo.png' }
      ]
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
    }
  },
  onLoad() {
    const ec = this.getOpenerEventChannel && this.getOpenerEventChannel()
    if (ec) {
      ec.on('service-item', ({ item }) => {
        const normalized = this.normalizeItem(item)
        this.serviceItem = normalized
        this.images = (normalized.images && normalized.images.length ? normalized.images : [ '/static/logo.png' ])
        uni.setNavigationBarTitle({ title: normalized.name || '服务详情' })
        uni.setStorageSync('LAST_SERVICE_ITEM', normalized)
      })
    }
    if (!this.serviceItem._id) {
      const cached = uni.getStorageSync('LAST_SERVICE_ITEM')
      if (cached && cached._id) {
        this.serviceItem = cached
        this.images = (cached.images && cached.images.length ? cached.images : [ '/static/logo.png' ])
        uni.setNavigationBarTitle({ title: cached.name || '服务详情' })
      } else {
        this.images = ['/static/logo.png']
      }
    }
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
    toggleAbout() { this.aboutCollapsed = !this.aboutCollapsed },
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
.hero-info { position: absolute; left: 0; right: 0; bottom: 24rpx; padding: 20rpx 28rpx 16rpx; background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 100%); color: #fff; }
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
.review-list { margin-top: 16rpx; display: flex; flex-direction: column; gap: 18rpx; }
.review-item { display: flex; gap: 14rpx; }
.avatar { width: 64rpx; height: 64rpx; border-radius: 50%; background: #ddd; }
.review-body { flex: 1; }
.review-head { display: flex; align-items: center; gap: 10rpx; }
.review-name { font-size: 26rpx; font-weight: 600; color: #111; }
.review-date { margin-left: auto; color: #999; font-size: 22rpx; }
.review-stars .star { font-size: 22rpx; color: #bbb; }
.review-stars .star.active { color: #FFD54F; }
.review-text { margin-top: 6rpx; color: #444; font-size: 24rpx; line-height: 1.6; }
.see-all { display: inline-block; margin-top: 10rpx; }
</style>
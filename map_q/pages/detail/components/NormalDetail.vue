<!-- impeccable-disable border-accent-on-rounded -- section separator, not a rounded accent card -->
<template>
  <view class="story-page">
    <view class="story-nav" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="nav-button back" role="button" aria-label="返回" @tap="back"><view></view></view>
      <text class="nav-title">{{ categoryText }}</text>
      <view class="nav-button share" role="button" aria-label="分享" @tap="shareContent"><view></view></view>
    </view>

    <view v-if="heroMedia" class="hero">
      <image class="hero-image" :src="heroMedia" mode="aspectFill" @error="mediaFailed = true" />
      <view class="hero-shade"></view>
      <view class="hero-index"><view class="active"></view><view></view><view></view></view>
    </view>

    <view class="story-shell" :class="{ 'without-hero': !heroMedia }">
      <view class="story-head">
        <view class="heading-row">
          <text class="story-title">{{ title }}</text>
          <view class="type-chip">{{ categoryText }}</view>
        </view>
        <view class="author-row">
          <image class="avatar" :src="authorAvatar" mode="aspectFill" />
          <view class="author-copy">
            <view class="author-name-row"><text>{{ authorName }}</text><view v-if="isVerified" class="verified">✓</view></view>
            <text class="publish-time">{{ publishTime }}</text>
          </view>
          <view class="follow" :class="{ active: isFollowing }" @tap="toggleFollow">{{ isFollowing ? '已关注' : '关注' }}</view>
        </view>
      </view>

      <view class="body-section">
        <text v-if="summary" class="summary">{{ summary }}</text>
        <text class="body-copy">{{ description }}</text>
        <view v-if="tags.length" class="tags"><view v-for="tag in tags" :key="tag"># {{ tag }}</view></view>
      </view>

      <view v-if="locationText" class="place-row" @tap="navigateTo">
        <view class="pin"><view></view></view>
        <view class="place-copy"><text>{{ locationName }}</text><text>{{ locationText }}</text></view>
        <view class="chevron"></view>
      </view>

      <view class="metrics">
        <view><text>{{ formattedLikes }}</text><text>点赞</text></view>
        <view><text>{{ formattedCollects }}</text><text>收藏</text></view>
        <view><text>{{ formattedViews }}</text><text>浏览</text></view>
      </view>

      <view class="comment-section">
        <view class="section-heading"><text>评论</text><text>{{ comments.length }}</text></view>
        <view v-if="!comments.length" class="empty-comment"><text>还没有评论</text><text>说说你对这个地方的感受</text></view>
        <view v-for="comment in comments" :key="comment.id" class="comment">
          <image :src="comment.avatar || '/static/logo.png'" mode="aspectFill" />
          <view><text>{{ comment.name }}</text><text>{{ comment.content }}</text><text>{{ comment.time }}</text></view>
        </view>
      </view>
      <view class="bottom-space"></view>
    </view>

    <view class="action-bar">
      <view class="comment-entry" @tap="showCommentInput">说点什么…</view>
      <view class="icon-action" :class="{ active: isLiked }" @tap="toggleLike"><view class="heart"></view><text>{{ formattedLikes }}</text></view>
      <view class="icon-action" :class="{ active: isCollected }" @tap="toggleCollect"><view class="bookmark"></view><text>收藏</text></view>
    </view>
  </view>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useInteraction } from '../../../utils/interaction.js'
import { contentInteractionApi } from '../../../utils/api/contentInteraction.js'
import { shareActiveContent } from '../../../utils/contentShare.js'

const cardData = ref({})
const comments = ref([])
const statusBarHeight = ref(20)
const isLiked = ref(false)
const isCollected = ref(false)
const isFollowing = ref(false)
const mediaFailed = ref(false)
const interaction = useInteraction()
const id = computed(() => cardData.value.id || cardData.value._id || 'content-preview')
const title = computed(() => cardData.value.title || cardData.value.name || '附近的一次发现')
const author = computed(() => typeof cardData.value.author === 'object' ? cardData.value.author : { name: cardData.value.author })
const authorName = computed(() => author.value?.name || cardData.value.userName || '地图探索者')
const authorAvatar = computed(() => author.value?.avatar || cardData.value.avatar || '/static/logo.png')
const isVerified = computed(() => Boolean(author.value?.verified || cardData.value.verified))
const publishTime = computed(() => cardData.value.publishTime || cardData.value.createdAtText || '刚刚')
const heroMedia = computed(() => {
  if (mediaFailed.value) return ''
  const images = Array.isArray(cardData.value.images) ? cardData.value.images : []
  return [cardData.value.cover, cardData.value.coverUrl, cardData.value.thumbnail, ...images]
    .find(value => typeof value === 'string' && value.trim() && !/\/static\/logo\.png(?:\?|$)/i.test(value)) || ''
})
const summary = computed(() => cardData.value.summary || '')
const description = computed(() => cardData.value.description || cardData.value.content || '把这次发现留在地图上，也分享给来到这里的人。')
const tags = computed(() => Array.isArray(cardData.value.tags) ? cardData.value.tags.slice(0, 5) : [])
const categoryText = computed(() => ({ normal: '打卡', article: '图文', place: '地点' }[cardData.value.type] || '图文'))
const locationName = computed(() => cardData.value.location?.name || cardData.value.placeName || '内容所在位置')
const locationText = computed(() => {
  const location = cardData.value.location
  if (location?.address) return location.address
  if (cardData.value.address) return cardData.value.address
  if (Array.isArray(location?.coordinates)) return `${Number(location.coordinates[1]).toFixed(4)}, ${Number(location.coordinates[0]).toFixed(4)}`
  return ''
})
const compact = value => { const n = Number(value || 0); return n >= 10000 ? `${(n / 10000).toFixed(1)}万` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n) }
const formattedLikes = computed(() => compact(cardData.value.likes ?? cardData.value.interactionStats?.likes))
const formattedCollects = computed(() => compact(cardData.value.collects ?? cardData.value.favorites ?? cardData.value.interactionStats?.collects))
const formattedViews = computed(() => compact(cardData.value.views ?? cardData.value.reads ?? cardData.value.interactionStats?.views))

function back() { uni.navigateBack() }
function shareContent() { shareActiveContent() }
function toggleFollow() { isFollowing.value = contentInteractionApi.toggle(id.value, 'followed').followed }
function toggleLike() { isLiked.value = interaction.toggleLike(id.value, cardData.value); cardData.value.likes = Math.max(0, Number(cardData.value.likes || 0) + (isLiked.value ? 1 : -1)) }
function toggleCollect() { isCollected.value = interaction.toggleFavorite(id.value, cardData.value) }
function navigateTo() {
  const point = cardData.value.location?.coordinates
  if (!Array.isArray(point)) return
  uni.openLocation({ latitude: Number(point[1]), longitude: Number(point[0]), name: locationName.value })
}
function showCommentInput() {
  uni.showModal({ title: '发表评论', editable: true, placeholderText: '友善交流，分享真实体验', success: result => {
    if (!result.confirm || !result.content?.trim()) return
    const state = contentInteractionApi.addComment(id.value, result.content.trim())
    const item = state.comments[0]
    comments.value.unshift({ id: item.id, name: item.author?.name || '我', avatar: item.author?.avatar, content: item.content, time: '刚刚' })
  } })
}
onMounted(() => {
  cardData.value = uni.getStorageSync('CONTENT_DETAIL_ACTIVE_V1') || uni.getStorageSync('INDEX_LAST_ITEM') || {}
  const state = contentInteractionApi.getState(id.value)
  isLiked.value = interaction.isLiked(id.value)
  isCollected.value = interaction.isFavorited(id.value)
  isFollowing.value = state.followed
  comments.value = (state.comments || []).map(item => ({ id: item.id, name: item.author?.name || '用户', avatar: item.author?.avatar, content: item.content, time: '刚刚' }))
  try { statusBarHeight.value = (uni.getWindowInfo?.() || uni.getSystemInfoSync()).statusBarHeight || 20 } catch (error) {}
})
</script>

<style scoped>
.story-page{min-height:100vh;color:#171b1a;background:var(--color-page)}.story-nav{position:fixed;z-index:60;top:0;left:0;right:0;display:flex;align-items:center;justify-content:space-between;padding-left:16px;padding-right:68px;padding-bottom:10px;background:rgba(250,253,252,.82);backdrop-filter:blur(24px) saturate(125%);-webkit-backdrop-filter:blur(24px) saturate(125%);box-shadow:none}.nav-title{color:var(--color-text);text-shadow:none;font-weight:600;font-size:14px}.nav-button{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.92);box-shadow:0 8px 24px rgba(0, 0, 0, 0.1)}.nav-button.back view{width:10px;height:10px;border-left:2px solid var(--color-text);border-bottom:2px solid var(--color-text);transform:rotate(45deg)}.nav-button.share view{width:15px;height:15px;border:2px solid var(--color-text);border-radius:5px;position:relative}.nav-button.share view:after{content:'';position:absolute;width:7px;height:7px;right:-5px;top:-5px;border-top:2px solid var(--color-text);border-right:2px solid var(--color-text)}.hero{position:relative;background:#dfe5e2;height:46vh;min-height:280px;max-height:480px}.hero-image{width:100%;height:100%}.hero-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,14,13,.2),transparent 35%,rgba(10,14,13,.12))}.hero-index{position:absolute;left:50%;bottom:22px;transform:translateX(-50%);gap:7px;display:none}.hero-index view{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.5)}.hero-index .active{width:20px;border-radius:5px;background:#fff}.story-shell{position:relative;z-index:5;margin-top:-24px;overflow:hidden;background:rgba(255,255,255,.92);border-radius:30px 30px 0 0;backdrop-filter:blur(24px)}.story-shell.without-hero{margin-top:0;padding-top:calc(env(safe-area-inset-top) + 72px);border-radius:0}.story-head{padding:24px 20px 18px}.heading-row{display:flex;align-items:flex-start;gap:12px}.story-title{flex:1;letter-spacing:-.02em;font-size:24px;line-height:1.4;font-weight:650}.type-chip{padding:6px 10px;border:1px solid #dce3df;border-radius:999px;color:#53605d;font-size:11px;white-space:nowrap;min-height:0;align-self:flex-start}.author-row{margin-top:20px;display:flex;align-items:center;gap:11px}.avatar{width:42px;height:42px;border-radius:14px;background:#edf1ef}.author-copy{flex:1}.author-copy text{display:block}.author-name-row{display:flex;align-items:center;gap:5px;font-size:14px;font-weight:750}.verified{width:15px;height:15px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--color-primary);color:#fff;font-size:9px}.publish-time{margin-top:3px;color:#89928f;font-size:11px}.follow{min-width:58px;height:38px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;min-height:44px;background:#e0f2ec;color:#286c5c;border-radius:14px}.follow.active{background:#edf3f0;color:#4e5b58}.body-section{padding:4px 20px 24px}.summary,.body-copy{display:block}.summary{margin-bottom:14px;font-size:18px;line-height:1.55;font-weight:700}.body-copy{color:#3f4947;font-size:15px;line-height:1.85;white-space:pre-wrap}.tags{margin-top:18px;display:flex;flex-wrap:wrap;gap:8px}.tags view{padding:7px 11px;border-radius:10px;background:#f0f4f2;color:#177f76;font-size:12px}.place-row{margin:0 20px 24px;padding:14px;border-radius:16px;display:flex;align-items:center;gap:12px;background:#f0f8f6}.pin{width:40px;height:40px;border-radius:13px;display:flex;align-items:center;justify-content:center;background:#fff}.pin view{width:13px;height:13px;border:2px solid var(--color-primary);border-radius:50% 50% 50% 0;transform:rotate(-45deg)}.place-copy{flex:1}.place-copy text{display:block}.place-copy text:first-child{font-size:13px;font-weight:750}.place-copy text:last-child{margin-top:4px;color:#6c7875;font-size:11px}.chevron{width:8px;height:8px;border-top:2px solid #82908c;border-right:2px solid #82908c;transform:rotate(45deg)}.metrics{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid #edf0ee;border-bottom:1px solid var(--color-divider);margin:0 20px;padding:16px 0}.metrics view{text-align:center;border-right:1px solid #edf0ee}.metrics view:last-child{border:0}.metrics text{display:block}.metrics text:first-child{font-size:16px;font-weight:600}.metrics text:last-child{margin-top:5px;color:#89928f;font-size:11px}.comment-section{padding:24px 20px}.section-heading{display:flex;align-items:baseline;gap:8px;font-size:18px;font-weight:800}.section-heading text:last-child{color:#95a09c;font-size:12px}.empty-comment{padding:34px 0;text-align:center}.empty-comment text{display:block}.empty-comment text:first-child{font-size:14px;font-weight:700}.empty-comment text:last-child{margin-top:6px;color:#97a19e;font-size:12px}.comment{display:flex;gap:11px;padding:18px 0;border-bottom:1px solid #edf0ee}.comment image{width:36px;height:36px;border-radius:12px}.comment>view{flex:1}.comment text{display:block}.comment text:first-child{font-size:12px;font-weight:750}.comment text:nth-child(2){margin-top:6px;font-size:14px;line-height:1.6}.comment text:last-child{margin-top:6px;color:#99a29f;font-size:10px}.bottom-space{height:100px}.action-bar{position:fixed;left:0;right:0;bottom:0;padding:10px 16px calc(10px + env(safe-area-inset-bottom));display:flex;align-items:center;gap:10px;background:rgba(250,253,252,.92);backdrop-filter:blur(24px) saturate(125%);-webkit-backdrop-filter:blur(24px) saturate(125%);box-shadow:var(--shadow-float);border-top:1px solid rgba(255,255,255,.8);border-radius:24px 24px 0 0;z-index:80}.comment-entry{flex:1;height:46px;padding:0 17px;display:flex;align-items:center;font-size:13px;color:var(--color-text-body);border-radius:16px;background:#eaf0ed}.icon-action{min-width:46px;height:46px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;color:#8b9692;font-size:9px}.icon-action.active{color:#ef665b}.heart{width:15px;height:14px;position:relative;transform:rotate(-45deg);border-left:2px solid currentColor;border-bottom:2px solid currentColor;border-radius:2px}.heart:before,.heart:after{content:'';position:absolute;width:10px;height:10px;border:2px solid currentColor;border-radius:50%}.heart:before{left:-2px;top:-7px}.heart:after{right:-7px;bottom:-2px}.bookmark{width:14px;height:18px;border:2px solid currentColor;border-radius:3px 3px 1px 1px;clip-path:polygon(0 0,100% 0,100% 100%,50% 75%,0 100%)}
@media (prefers-reduced-motion:reduce){.story-page,.story-nav,.nav-button,.hero,.hero-image,.hero-shade,.hero-index,.story-shell,.follow,.action-bar,.comment-entry,.icon-action{animation:none!important;transition:none!important}}
</style>

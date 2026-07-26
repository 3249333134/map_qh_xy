<template>
  <view class="preview-page">
    <view class="preview-header" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="round-btn" @tap="goBack"><text class="back-icon">‹</text></view>
      <text class="counter">{{ current + 1 }} / {{ images.length }}</text>
      <view class="round-btn"><text class="more-icon">···</text></view>
    </view>

    <swiper class="media-swiper" :current="current" @change="onChange">
      <swiper-item v-for="(src, index) in images" :key="src + index" class="media-slide">
        <image :src="src" class="media-image" mode="aspectFit" />
      </swiper-item>
    </swiper>

    <view class="side-actions">
      <view class="side-action" :class="{ active: liked }" @tap="toggleLike"><text>{{ liked ? '♥' : '♡' }}</text></view>
      <view class="side-action" :class="{ active: collected }" @tap="toggleCollect"><text>{{ collected ? '★' : '☆' }}</text></view>
      <view class="side-action" @tap="share"><text>↗</text></view>
    </view>

    <view class="media-caption">{{ caption }}</view>
    <view class="comment-bar" :style="{ paddingBottom: safeBottom + 'px' }">
      <input v-model="comment" class="comment-input" placeholder="添加评论..." confirm-type="send" @confirm="sendComment" />
      <view class="mini-action" :class="{ active: liked }" @tap="toggleLike">♡</view>
      <view class="mini-action" :class="{ active: collected }" @tap="toggleCollect">☆</view>
      <view class="send-btn" :class="{ disabled: !comment.trim() }" @tap="sendComment">发送</view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useInteraction } from '../../utils/interaction.js'
import { getContentImages, getItemId } from '../../utils/contentResolver.js'

const images = ref(['/static/logo.png'])
const current = ref(0)
const comment = ref('')
const statusBarHeight = ref(24)
const safeBottom = ref(0)
const item = ref({})
const liked = ref(false)
const collected = ref(false)
const interaction = useInteraction()

const itemId = computed(() => getItemId(item.value) || 'media-preview')
const caption = computed(() => item.value.description || item.value.summary || `${item.value.name || item.value.title || '内容预览'}：查看用户上传的原始媒体。`)

onLoad(() => {
  try {
    const preview = uni.getStorageSync('MEDIA_PREVIEW_ITEM') || {}
    item.value = uni.getStorageSync('INDEX_LAST_ITEM') || {}
    images.value = Array.isArray(preview.images) && preview.images.length ? preview.images : getContentImages(item.value)
    current.value = Math.min(Number(preview.index || 0), images.value.length - 1)
    liked.value = interaction.isLiked(itemId.value)
    collected.value = interaction.isFavorited(itemId.value)
    const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
    statusBarHeight.value = info.statusBarHeight || info.safeAreaInsets?.top || 24
    safeBottom.value = info.safeAreaInsets?.bottom || Math.max(0, (info.screenHeight || 0) - (info.safeArea?.bottom || info.screenHeight || 0))
  } catch (e) {}
})

function onChange(event) { current.value = event.detail?.current || 0 }
function goBack() { uni.navigateBack() }
function toggleLike() { liked.value = interaction.toggleLike(itemId.value, item.value) }
function toggleCollect() { collected.value = interaction.toggleFavorite(itemId.value, item.value) }
function share() {
  uni.setClipboardData({ data: caption.value, success: () => uni.showToast({ title: '分享文案已复制', icon: 'none' }) })
}
function sendComment() {
  if (!comment.value.trim()) return
  comment.value = ''
  uni.showToast({ title: '评论已发送', icon: 'success' })
}
</script>

<style scoped>
.preview-page { position: relative; width: 100vw; height: 100vh; overflow: hidden; background: #050506; color: #fff; }
.preview-header { position: fixed; z-index: 10; left: 0; right: 0; top: 0; height: 54px; padding-left: 14px; padding-right: 14px; display: grid; grid-template-columns: 44px 1fr 44px; align-items: center; background: linear-gradient(180deg,rgba(0,0,0,.48),transparent); box-sizing: content-box; }
.round-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: rgba(255,255,255,.14); }
.back-icon { margin-top: -3px; font-size: 32px; line-height: 32px; }
.more-icon { font-size: 18px; letter-spacing: 1px; }
.counter { text-align: center; font-size: 14px; font-weight: 600; }
.media-swiper { position: absolute; inset: 0 0 132px; width: 100%; height: calc(100vh - 132px); }
.media-slide { display: flex; align-items: center; justify-content: center; }
.media-image { width: 100%; height: 100%; }
.side-actions { position: fixed; z-index: 8; right: 16px; bottom: 164px; display: flex; flex-direction: column; gap: 14px; }
.side-action { width: 46px; height: 46px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: rgba(255,255,255,.16); font-size: 22px; }
.side-action.active,.mini-action.active { color: #ff7043; }
.media-caption { position: fixed; z-index: 7; left: 16px; right: 78px; bottom: 88px; max-height: 66px; overflow: hidden; color: rgba(255,255,255,.92); font-size: 14px; line-height: 22px; }
.comment-bar { position: fixed; z-index: 12; left: 0; right: 0; bottom: 0; min-height: 70px; padding: 10px 12px; display: grid; grid-template-columns: 1fr 38px 38px 52px; gap: 8px; align-items: center; background: rgba(12,12,14,.96); box-sizing: border-box; }
.comment-input { height: 38px; padding: 0 14px; border-radius: 19px; color: #fff; background: rgba(255,255,255,.14); font-size: 13px; }
.mini-action { height: 38px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
.send-btn { height: 34px; display: flex; align-items: center; justify-content: center; border-radius: 17px; background: #ff7043; font-size: 13px; font-weight: 700; }
.send-btn.disabled { opacity: .42; }
</style>

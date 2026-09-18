<template>
  <view class="video-card app-card content-card" :class="{ 'is-placeholder': !coverImage && !isPlaying }" role="button" :aria-label="`播放视频：${cardTitle}`" :style="{ '--card-height': Math.max(height, 300) + 'rpx' }" @tap="openDetail">
    <view class="media-shell">
      <image v-if="coverImage && !isPlaying" class="cover" :src="coverImage" mode="aspectFill" @error="mediaFailed = true" />
      <video v-else-if="isPlaying && videoUrl" class="player" :src="videoUrl" autoplay controls object-fit="cover" @ended="isPlaying = false" />
      <view v-else class="fallback"><view class="fallback-mark"></view><text>{{ mediaFailed ? '封面加载失败' : '暂时没有视频封面' }}</text></view>
      <view class="shade"></view>
      <view v-if="!isPlaying" class="play" role="button" aria-label="播放视频" @tap.stop="play"><view></view></view>
      <text v-if="durationText && !isPlaying" class="duration">{{ durationText }}</text>
      <view class="caption">
        <text class="title">{{ cardTitle }}</text>
        <view class="meta"><text>{{ authorName }}</text><text v-if="likesText">{{ likesText }} 人喜欢</text></view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'VideoCard',
  props: {
    height: { type: Number, default: 360 },
    columnType: { type: String, default: 'right' },
    index: { type: Number, required: true },
    cardData: { type: Object, default: () => ({}) }
  },
  data() { return { isPlaying: false, mediaFailed: false } },
  computed: {
    cardTitle() { return this.cardData?.title || this.cardData?.name || '城市影像' },
    authorName() { const a = this.cardData?.author; return typeof a === 'string' ? a : a?.name || '地图创作者' },
    coverImage() {
      const d = this.cardData || {}; const media = Array.isArray(d.media) ? d.media[0] : null
      return [d.cover, d.coverUrl, d.thumbnail, d.poster, ...(Array.isArray(d.images) ? d.images : []), typeof media === 'string' ? media : media?.cover || media?.url].find(v => typeof v === 'string' && v.trim() && !/static\/logo\.png/i.test(v)) || ''
    },
    videoUrl() {
      const d = this.cardData || {}; const media = Array.isArray(d.media) ? d.media.find(v => v?.type === 'video') : null
      return [d.videoUrl, d.video, d.src, typeof media === 'string' ? media : media?.url].find(v => typeof v === 'string' && v.trim()) || ''
    },
    durationText() { const d = this.cardData?.duration; if (!d) return ''; if (typeof d !== 'number') return String(d); return `${Math.floor(d / 60)}:${String(d % 60).padStart(2, '0')}` },
    likesText() { const n = Number(this.cardData?.likes || 0); return n > 999 ? `${(n / 1000).toFixed(1)}k` : n ? String(n) : '' }
  },
  methods: {
    play() { this.openDetail() },
    openDetail() { this.$emit('media-tap', { cardData: this.cardData, index: this.index }) }
  }
}
</script>

<style scoped>
.video-card{width:100%;margin-bottom:24rpx;overflow:hidden;border-radius:30rpx;background:#111318;box-shadow:0 14rpx 34rpx rgba(0, 0, 0, 0.1)}
.media-shell{position:relative;width:100%;overflow:hidden;background:#15191f;height:230px;min-height:230px}
.cover,.player{display:block;width:100%;height:100%}.shade{position:absolute;inset:36% 0 0;background:linear-gradient(180deg,transparent,rgba(5,7,9,.8));pointer-events:none}
.fallback{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:14rpx;color:#9ba2ad;font-size:11px;background:#262b33;padding:36px 12px 18px;text-align:center}
.fallback-mark{width:52rpx;height:38rpx;border:3rpx solid currentColor;border-radius:10rpx;position:relative;display:none}.fallback-mark:after{content:'';position:absolute;left:14rpx;top:9rpx;width:0;height:0;border-top:8rpx solid transparent;border-bottom:8rpx solid transparent;border-left:13rpx solid currentColor}
.play{position:absolute;left:50%;top:42%;transform:translate(-50%,-50%);display:flex;align-items:center;justify-content:center;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.06);width:48px;height:48px;background:rgba(255,255,255,.9)}
.play:active{transform:translate(-50%,-50%) scale(.94)}.play view{margin-left:3px;width:0;height:0;border-top:9px solid transparent;border-bottom:9px solid transparent;border-left:14px solid #202020}
.duration{position:absolute;right:8px;top:8px;padding:3px 6px;border-radius:5px;background:rgba(12,15,18,.7);color:#fff;font-size:10px;font-variant-numeric:tabular-nums}
.caption{position:absolute;color:#fff;border-radius:14px;padding:10px;left:8px;right:8px;bottom:8px;background:rgba(18,27,24,.5);backdrop-filter:blur(12px)}.title{display:-webkit-box;overflow:hidden;-webkit-box-orient:vertical;-webkit-line-clamp:2;font-size:14px;font-weight:600;line-height:1.4}.meta{margin-top:6px;display:flex;align-items:center;justify-content:space-between;color:rgba(255,255,255,.72);font-size:11px;gap:8px;flex-wrap:wrap}
@media (prefers-reduced-motion:reduce){.play:active{transform:translate(-50%,-50%)}}
.play{transition:transform var(--motion-fast) var(--ease-standard),box-shadow var(--motion-fast) ease;top:42%;box-shadow:0 2px 8px rgba(0,0,0,.06);width:48px;height:48px;background:rgba(255,255,255,.9)}.play:active{transform:translate(-50%,-50%) scale(.92);box-shadow:0 5rpx 14rpx rgba(0, 0, 0, 0.1)}
.is-placeholder .media-shell,.is-placeholder .fallback { background: var(--color-surface-muted); }
.is-placeholder .fallback { color: var(--color-text-muted); }
.is-placeholder .shade { background: linear-gradient(180deg,transparent,#fff 80%); }
.is-placeholder .caption { color: var(--color-text); background:rgba(255,255,255,.86); }
.is-placeholder .meta { color: var(--color-text-body); }
.meta text:first-child { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.meta text,.fallback text { font-size: 11px; line-height: 1.4; }
</style>

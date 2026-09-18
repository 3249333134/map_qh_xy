<template>
  <scroll-view class="masonry-scroll" scroll-y :show-scrollbar="false" @scroll="handleScroll">
    <view v-if="!entries.length" class="masonry-empty">
      <view class="empty-pin"></view>
      <text class="empty-title">{{ emptyTitle }}</text>
      <text class="empty-copy">{{ emptyDescription }}</text>
    </view>

    <view v-else class="masonry-grid">
      <view v-for="(column, columnIndex) in columns" :key="columnIndex" class="masonry-column">
        <view
          v-for="item in column"
          :key="item.footprintId || item.sourceId"
          class="masonry-card"
          :class="[`type-${item.contentType}`, { selected: selectedId === item.footprintId, checked: isChecked(item), unavailable: item.availableState !== 'available' }]"
          role="button"
          tabindex="0"
          :aria-label="`${typeLabel(item.contentType)}，${item.title}`"
          :aria-pressed="managing ? isChecked(item) : undefined"
          @tap="handleTap(item)"
          @keyup.enter="handleTap(item)"
          @keyup.space.prevent="handleTap(item)"
        >
          <view class="masonry-media" :class="{ placeholder: !item.media?.length }">
            <image v-if="item.media?.[0]" :src="item.media[0]" mode="aspectFill" lazy-load :aria-label="`${item.title}预览图`" />
            <view v-else class="masonry-type-glyph" aria-hidden="true"><view class="masonry-camera-lens"></view></view>
            <view class="masonry-type-pill"><text>{{ typeLabel(item.contentType) }}</text></view>
            <view v-if="managing" class="masonry-check" :class="{ checked: isChecked(item) }"><view></view></view>
          </view>
          <view class="masonry-copy">
            <text class="masonry-title">{{ item.title }}</text>
            <text class="masonry-address">{{ item.address || item.author || `${typeLabel(item.contentType)}收藏` }}</text>
            <view class="masonry-meta">
              <text>{{ formatTime(item.createdAt) }}</text>
              <text v-if="item.duration">{{ item.duration }}</text>
              <text v-else-if="item.media?.length">{{ item.media.length }} 张</text>
            </view>
          </view>
        </view>
      </view>
    </view>
    <view class="masonry-bottom-spacer"></view>
  </scroll-view>
</template>

<script>
const TYPE_META = {
  photo: { label: '照片', glyph: '照' }, video: { label: '视频', glyph: '视' },
  article: { label: '文章', glyph: '文' }, music: { label: '音乐', glyph: '音' },
  place: { label: '地点', glyph: '地' }, service: { label: '服务', glyph: '服' },
  event: { label: '活动', glyph: '活' }, route: { label: '路线', glyph: '线' }
}

export default {
  name: 'FootprintMasonry',
  props: {
    entries: { type: Array, default: () => [] },
    selectedId: { type: String, default: '' },
    managing: { type: Boolean, default: false },
    selectedRecordIds: { type: Array, default: () => [] },
    emptyTitle: { type: String, default: '这里还没有内容' },
    emptyDescription: { type: String, default: '' }
  },
  emits: ['item-click', 'toggle-select', 'scroll-state-change'],
  computed: {
    columns() {
      return this.entries.reduce((result, item, index) => {
        result[index % 2].push(item)
        return result
      }, [[], []])
    }
  },
  methods: {
    typeLabel(type) { return TYPE_META[type]?.label || '记录' },
    typeGlyph(type) { return TYPE_META[type]?.glyph || '记' },
    isChecked(item) { return this.selectedRecordIds.includes(item.favoriteId) },
    handleTap(item) {
      if (this.managing) this.$emit('toggle-select', item)
      else this.$emit('item-click', item)
    },
    handleScroll(event) {
      const scrollTop = Number(event?.detail?.scrollTop || 0)
      this.$emit('scroll-state-change', { isAtTop: scrollTop <= 2, scrollTop })
    },
    formatTime(timestamp) {
      const date = new Date(Number(timestamp || 0))
      if (Number.isNaN(date.getTime())) return ''
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    }
  }
}
</script>

<style scoped>
.masonry-scroll { width: 100%; height: 100%; }
.masonry-grid { display: flex; gap: 12px; padding: 8px 14px 0; }
.masonry-column { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 12px; }
.masonry-card { --type: var(--color-text); overflow: hidden; transition: transform 160ms ease, box-shadow 160ms ease; background: rgba(255,255,255,.94); border-radius: 18px; border: 0; box-shadow: 0 4px 14px rgba(40,68,63,.05); }
.masonry-card.selected { box-shadow: none; }
.masonry-card:active { transform: scale(.988); }
.masonry-media { position: relative; min-height: 184rpx; background: var(--color-surface-raised); }
.masonry-media image { width: 100%; display: block; background: var(--color-surface-raised); height: 128px; }
.masonry-media.placeholder { display: flex; align-items: center; justify-content: center; background: var(--color-surface-raised); min-height: 90px; }
.masonry-type-glyph { width: 52rpx; height: 52rpx; display: flex; align-items: center; justify-content: center; border: 1rpx solid var(--color-border); border-radius: 14rpx; background: #ffffff; }
.masonry-camera-lens { position: relative; width: 26rpx; height: 20rpx; border: 2rpx solid var(--color-text-muted); border-radius: 5rpx; }
.masonry-camera-lens::before { content: ''; position: absolute; top: -7rpx; left: 6rpx; width: 10rpx; height: 5rpx; border-radius: 3rpx 3rpx 0 0; background: var(--color-text-muted); }
.masonry-camera-lens::after { content: ''; position: absolute; left: 6rpx; top: 4rpx; width: 7rpx; height: 7rpx; border: 2rpx solid var(--color-text-muted); border-radius: 50%; }
.masonry-type-pill { position: absolute; right: 12rpx; bottom: 12rpx; border-radius: 999rpx; backdrop-filter: blur(10px); font-weight: 500; font-size: 10px; background: rgba(255,255,255,.88); color: var(--color-text-body); padding: 3px 6px; }
.masonry-check { position: absolute; top: 12rpx; right: 12rpx; width: 44rpx; height: 44rpx; display: flex; align-items: center; justify-content: center; border: 2rpx solid rgba(255, 255, 255, 0.9); border-radius: 50%; background: rgba(17, 24, 39, 0.35); }
.masonry-check.checked { background: var(--color-text); }
.masonry-check view { width: 16rpx; height: 8rpx; border-left: 3rpx solid #fff; border-bottom: 3rpx solid #fff; transform: rotate(-45deg) translate(1rpx, -1rpx); opacity: 0; }
.masonry-check.checked view { opacity: 1; }
.masonry-copy { display: flex; flex-direction: column; padding: 10px 12px; gap: 5px; }
.masonry-title { display: -webkit-box; overflow: hidden; color: var(--color-text); font-weight: 600; line-height: 1.4; -webkit-box-orient: vertical; -webkit-line-clamp: 2; letter-spacing: 0.3rpx; font-size: 14px; }
.masonry-address { overflow: hidden; color: var(--color-text-muted); white-space: nowrap; text-overflow: ellipsis; font-size: 11px; }
.masonry-meta { display: flex; justify-content: space-between; gap: 8rpx; color: var(--color-text-muted); font-variant-numeric: tabular-nums; font-size: 10px; border-top: 0; padding-top: 2px; }
.masonry-empty { min-height: 420rpx; padding: 80rpx 56rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.empty-pin { width: 48rpx; height: 48rpx; margin-bottom: 24rpx; border: 6rpx solid var(--color-text-muted); border-radius: 50% 50% 50% 0; transform: rotate(-45deg); }
.empty-title { color: var(--color-text); font-size: 30rpx; font-weight: 600; }
.empty-copy { margin-top: 12rpx; color: var(--color-text-muted); font-size: 23rpx; line-height: 1.55; }
.masonry-bottom-spacer { height: calc(180rpx + env(safe-area-inset-bottom)); }
@media (prefers-reduced-motion: reduce) { .masonry-card { transition: none;  border: 1rpx solid rgba(255,255,255,.92); border-radius: 40rpx; background: rgba(255,255,255,.94); box-shadow: var(--shadow-card); } }
</style>

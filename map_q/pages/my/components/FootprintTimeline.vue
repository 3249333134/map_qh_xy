<template>
  <scroll-view
    class="timeline-scroll"
    scroll-y
    :scroll-into-view="scrollIntoView"
    :show-scrollbar="false"
    @scroll="handleScroll"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <view v-if="!groups.length" class="empty-state">
      <view class="empty-mark"><view class="empty-pin"></view></view>
      <text class="empty-title">{{ emptyTitle }}</text>
      <text class="empty-copy">{{ emptyDescription }}</text>
    </view>

    <view v-for="group in groups" :key="group.date" class="day-group">
      <view class="date-column">
        <text class="date-primary">{{ dateParts(group.date).primary }}</text>
        <text class="date-secondary">{{ dateParts(group.date).secondary }}</text>
      </view>

      <view class="entries-column">
        <view
          v-for="item in group.items"
          :id="recordDomId(item)"
          :key="item.footprintId || item.sourceId"
          class="timeline-entry"
          :class="[
            `type-${item.contentType}`,
            { selected: selectedId === item.footprintId, managing, checked: isChecked(item), unavailable: item.availableState !== 'available' }
          ]"
          role="button"
          tabindex="0"
          :aria-label="`${typeLabel(item.contentType)}：${item.title}`"
          :aria-pressed="managing ? isChecked(item) : undefined"
          @tap="handleEntryTap(item)"
          @keyup.enter="handleEntryTap(item)"
          @keyup.space.prevent="handleEntryTap(item)"
        >
          <text class="entry-time">{{ formatTime(item.createdAt) }}</text>
          <view class="timeline-node" aria-hidden="true">
            <text>{{ typeGlyph(item.contentType) }}</text>
          </view>
          <view class="entry-card">
            <view class="entry-heading">
              <view class="entry-title-block">
                <text class="entry-type">{{ typeLabel(item.contentType) }}</text>
                <text class="entry-title">{{ item.title }}</text>
              </view>
              <view v-if="managing" class="selection-control" :class="{ checked: isChecked(item) }">
                <view class="check-shape"></view>
              </view>
              <text v-else class="entry-duration">{{ item.duration || formatTime(item.createdAt) }}</text>
            </view>

            <view v-if="item.availableState !== 'available'" class="unavailable-note">
              原内容已失效，仍保留这条记录
            </view>

            <view v-if="item.media && item.media.length" class="media-strip">
              <image
                v-for="(media, mediaIndex) in item.media.slice(0, 3)"
                :key="`${item.sourceId}-${mediaIndex}`"
                class="media-thumb"
                :src="media"
                mode="aspectFill"
                lazy-load
                :aria-label="`${item.title}预览图${mediaIndex + 1}`"
              />
              <text class="media-count">{{ item.media.length }} 张</text>
            </view>
            <view v-else class="media-placeholder">
              <view class="placeholder-art" :class="`type-${item.contentType}`" aria-hidden="true">
                <view class="placeholder-lens"></view>
              </view>
              <text>{{ typeLabel(item.contentType) }}记录</text>
            </view>

            <view class="entry-meta">
              <view class="meta-copy">
                <view class="mini-pin" aria-hidden="true"></view>
                <text>{{ item.address || (item.hasLocation ? '已记录位置' : '未记录位置') }}</text>
              </view>
              <button
                v-if="item.hasLocation && !managing"
                class="map-action"
                aria-label="在地图上查看"
                @tap.stop="$emit('focus', item)"
              >地图</button>
            </view>
          </view>
        </view>
      </view>
    </view>
    <view class="bottom-spacer"></view>
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
  name: 'FootprintTimeline',
  props: {
    groups: { type: Array, default: () => [] },
    selectedId: { type: String, default: '' },
    scrollIntoView: { type: String, default: '' },
    managing: { type: Boolean, default: false },
    selectedRecordIds: { type: Array, default: () => [] },
    emptyTitle: { type: String, default: '这里还没有足迹' },
    emptyDescription: { type: String, default: '发布内容或保存地点后，会按时间出现在这里。' }
  },
  emits: ['item-click', 'focus', 'toggle-select', 'scroll-state-change', 'sheet-drag-start', 'sheet-drag-move', 'sheet-drag-end'],
  data() {
    return { scrollTop: 0, touchStartY: 0, draggingSheet: false }
  },
  methods: {
    typeLabel(type) { return TYPE_META[type]?.label || '记录' },
    typeGlyph(type) { return TYPE_META[type]?.glyph || '记' },
    dateParts(dateKey) {
      const date = new Date(`${dateKey}T00:00:00`)
      if (Number.isNaN(date.getTime())) return { primary: dateKey, secondary: '' }
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      return { primary: `${date.getMonth() + 1}月${date.getDate()}日`, secondary: weekdays[date.getDay()] }
    },
    formatTime(timestamp) {
      const date = new Date(Number(timestamp || 0))
      if (Number.isNaN(date.getTime())) return ''
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    },
    recordDomId(item) { return `footprint-${String(item.footprintId || item.sourceId).replace(/[^a-zA-Z0-9_-]/g, '-')}` },
    isChecked(item) { return this.selectedRecordIds.includes(item.favoriteId) },
    handleEntryTap(item) {
      if (this.managing) this.$emit('toggle-select', item)
      else this.$emit('item-click', item)
    },
    handleScroll(event) {
      this.scrollTop = Number(event?.detail?.scrollTop || 0)
      this.$emit('scroll-state-change', { isAtTop: this.scrollTop <= 2, scrollTop: this.scrollTop })
    },
    touchY(event) {
      const touch = event?.touches?.[0] || event?.changedTouches?.[0]
      return Number(touch?.clientY ?? touch?.pageY ?? 0)
    },
    handleTouchStart(event) {
      this.touchStartY = this.touchY(event)
      this.draggingSheet = false
    },
    handleTouchMove(event) {
      const currentY = this.touchY(event)
      if (this.scrollTop <= 2 && currentY - this.touchStartY > 8) {
        if (!this.draggingSheet) {
          this.draggingSheet = true
          this.$emit('sheet-drag-start', { startY: this.touchStartY })
        }
        this.$emit('sheet-drag-move', { currentY })
      }
    },
    handleTouchEnd(event) {
      if (!this.draggingSheet) return
      this.$emit('sheet-drag-end', { endY: this.touchY(event) })
      this.draggingSheet = false
    }
  }
}
</script>

<style scoped>
.timeline-scroll { width: 100%; height: 100%; }
.day-group { display: flex; padding: 10px 14px 16px; gap: 4px; }
.date-column { width: 68rpx; flex: 0 0 68rpx; padding-top: 18rpx; display: flex; flex-direction: column; gap: 2rpx; }
.date-primary { color: var(--color-text); font-size: 21rpx; font-weight: 600; }
.date-secondary { color: var(--color-text-muted); font-size: 20rpx; }
.entries-column { min-width: 0; flex: 1; position: relative; display: flex; flex-direction: column; gap: 18rpx; }
.entries-column::before { content: ''; position: absolute; left: 73rpx; top: 26rpx; bottom: -32rpx; width: 1rpx; background: var(--color-border); }
.timeline-entry { position: relative; display: flex; gap: 8rpx; align-items: flex-start; }
.entry-time { width: 48rpx; flex: 0 0 48rpx; padding-top: 16rpx; color: var(--color-text-muted); font-size: 19rpx; font-variant-numeric: tabular-nums; text-align: right; }
.timeline-node { width: 48rpx; height: 48rpx; flex: 0 0 48rpx; z-index: 1; display: flex; align-items: center; justify-content: center; border: 3rpx solid #ffffff; box-shadow: 0 3rpx 10rpx rgba(0, 0, 0, 0.08); background: #e0f2ec; color: #286c5c; border-radius: 10px; }
.timeline-node text { font-size: 18rpx; font-weight: 600; }
.entry-card { min-width: 0; flex: 1; transition: transform 160ms ease, box-shadow 160ms ease; position: relative; overflow: hidden; border-radius: 14px; border: 0; background: rgba(255,255,255,.72); box-shadow: none; padding: 12px; }
.entry-card > .entry-heading,
.entry-card > .unavailable-note,
.entry-card > .media-strip,
.entry-card > .media-placeholder,
.entry-card > .entry-meta { position: relative; z-index: 1; }
.timeline-entry:active .entry-card { transform: scale(.992); }
.timeline-entry.selected .entry-card { box-shadow: none; }
.entry-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 16rpx; }
.entry-title-block { min-width: 0; display: flex; flex-direction: column; gap: 6rpx; }
.entry-type { color: var(--color-text-muted); font-size: 20rpx; font-weight: 500; letter-spacing: 0.5rpx; }
.entry-title { display: -webkit-box; overflow: hidden; color: var(--color-text); font-weight: 600; line-height: 1.38; -webkit-box-orient: vertical; -webkit-line-clamp: 2; letter-spacing: 0.3rpx; font-size: 14px; }
.entry-duration { flex: 0 0 auto; color: var(--color-text-muted); font-size: 21rpx; font-variant-numeric: tabular-nums; }
.selection-control { width: 44rpx; height: 44rpx; flex: 0 0 44rpx; display: flex; align-items: center; justify-content: center; border: 2rpx solid #d1d5db; border-radius: 50%; background: #ffffff; }
.selection-control.checked { border-color: var(--color-text); background: var(--color-text); }
.check-shape { width: 15rpx; height: 8rpx; border-left: 3rpx solid transparent; border-bottom: 3rpx solid transparent; transform: rotate(-45deg); }
.selection-control.checked .check-shape { border-color: #fff; border-top: 0; border-right: 0; }
.media-strip { margin-top: 16rpx; display: flex; align-items: center; gap: 10rpx; }
.media-thumb { width: 92rpx; height: 82rpx; border: 2rpx solid #ffffff; border-radius: 14rpx; background: var(--color-surface-raised); }
.media-count { margin-left: 4rpx; color: var(--color-text-muted); font-size: 21rpx; }
.media-placeholder { margin-top: 12rpx; min-height: 52rpx; display: flex; align-items: center; gap: 12rpx; color: var(--color-text-muted); background: transparent; font-size: 21rpx; }
.placeholder-art { width: 52rpx; height: 52rpx; border: 1rpx solid var(--color-border); border-radius: 14rpx; display: flex; align-items: center; justify-content: center; background: #ffffff; }
.placeholder-lens { position: relative; width: 28rpx; height: 22rpx; border: 2rpx solid var(--color-text-muted); border-radius: 6rpx; }
.placeholder-lens::before { content: ''; position: absolute; top: -7rpx; left: 7rpx; width: 10rpx; height: 5rpx; border-radius: 3rpx 3rpx 0 0; background: var(--color-text-muted); }
.placeholder-lens::after { content: ''; position: absolute; left: 7rpx; top: 4rpx; width: 8rpx; height: 8rpx; border: 2rpx solid var(--color-text-muted); border-radius: 50%; }
.entry-meta { margin-top: 14rpx; display: flex; align-items: center; justify-content: space-between; gap: 10rpx; padding-top: 12rpx; border-top: 0; }
.meta-copy { min-width: 0; display: flex; align-items: center; gap: 9rpx; color: var(--color-text-muted); font-size: 22rpx; }
.meta-copy text { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.mini-pin { width: 14rpx; height: 14rpx; flex: 0 0 14rpx; border: 3rpx solid currentColor; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); }
.map-action { width: 88rpx; min-width: 88rpx; height: 72rpx; margin: -12rpx -4rpx -12rpx 0; padding: 0; border-radius: 22rpx; color: var(--color-text); background: var(--color-surface-muted); font-size: 21rpx; line-height: 72rpx; font-weight: 500; }
.map-action::after { border: 0; }
.unavailable-note { margin-top: 16rpx; padding: 12rpx 14rpx; border-radius: 12rpx; color: #dc2626; background: #fef2f2; font-size: 21rpx; }
.timeline-entry.unavailable .entry-card { opacity: .85; }
.empty-state { min-height: 420rpx; padding: 80rpx 56rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.empty-mark { width: 112rpx; height: 112rpx; margin-bottom: 26rpx; display: flex; align-items: center; justify-content: center; border-radius: 32rpx; background: var(--color-surface-muted); }
.empty-pin { width: 34rpx; height: 34rpx; border: 6rpx solid var(--color-text-muted); border-radius: 50% 50% 50% 0; transform: rotate(-45deg); }
.empty-title { color: var(--color-text); font-size: 30rpx; font-weight: 600; }
.empty-copy { max-width: 460rpx; margin-top: 12rpx; color: var(--color-text-muted); font-size: 23rpx; line-height: 1.55; }
.bottom-spacer { height: calc(180rpx + env(safe-area-inset-bottom)); }
@media (prefers-reduced-motion: reduce) { .entry-card { transition-duration: .01ms; } }

/* Timeline entries deliberately read as a list, not stacked cards. */
.timeline-group { padding: 16rpx 16rpx 0; }
.entries-column { gap: 10rpx; }
.entries-column::before { left: 62rpx; top: 22rpx; }
.entry-time { width: 42rpx; flex-basis: 42rpx; padding-top: 12rpx; font-size: 18rpx; }
.timeline-node { width: 40rpx; height: 40rpx; flex-basis: 40rpx; border-width: 2rpx; box-shadow: none; background: #e0f2ec; color: #286c5c; border-radius: 10px; }
.timeline-node text { font-size: 16rpx; }
.entry-card { border-color: var(--color-divider); border-radius: 14px; border: 0; background: rgba(255,255,255,.72); box-shadow: none; padding: 12px; }
.entry-title-block { gap: 3rpx; }
.entry-type { font-size: 18rpx; }
.entry-title { line-height: 1.35; font-size: 14px; }
.entry-duration { font-size: 19rpx; }
.media-placeholder { min-height: 42rpx; margin-top: 8rpx; gap: 8rpx; font-size: 19rpx; }
.placeholder-art { width: 42rpx; height: 42rpx; border-radius: 10rpx; }
.entry-meta { margin-top: 8rpx; padding-top: 8rpx; border-top: 0; }
.meta-copy { gap: 7rpx; font-size: 19rpx; }
.map-action { width: 68rpx; min-width: 68rpx; height: 52rpx; margin: -6rpx -2rpx -6rpx 0; border-radius: 9rpx; font-size: 19rpx; line-height: 52rpx; }
</style>

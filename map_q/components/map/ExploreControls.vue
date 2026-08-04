<template>
  <view
    class="explore-controls"
    :class="{ inline, compact }"
    :style="inline ? {} : { top: topOffset + 'px' }"
  >
    <view
      v-if="compact"
      class="compact-trigger"
      :class="{ open: quickPanelOpen }"
      role="button"
      :aria-expanded="quickPanelOpen"
      aria-label="打开地图筛选"
      @tap="toggleQuickPanel"
    >
      <view class="filter-glyph" aria-hidden="true">
        <view class="slider-line one"></view>
        <view class="slider-line two"></view>
        <view class="slider-line three"></view>
      </view>
      <view v-if="activeFilterCount" class="filter-count">{{ activeFilterCount }}</view>
    </view>

    <view v-if="locationState === 'denied' && !compact" class="permission-banner">
      <view class="permission-copy">
        <text class="permission-title">正在浏览{{ cityName }}</text>
        <text class="permission-desc">定位未开启，可手动选城或重新授权</text>
      </view>
      <view class="permission-action" role="button" aria-label="重新授权定位" @tap="$emit('request-location')">重新授权</view>
    </view>

    <view v-if="!compact || quickPanelOpen" class="tool-row" :class="{ 'compact-panel': compact }">
      <view class="tool-chip primary" role="button" aria-label="手动选择城市" @tap="openSheet('city')">
        <text class="pin-glyph"></text>
        <text>{{ cityName }}</text>
        <text class="chevron">⌄</text>
      </view>
      <view class="tool-chip" :class="{ active: timeRange.preset !== 'all' }" role="button" aria-label="筛选时间" @tap="openSheet('time')">
        <text>{{ timeLabel }}</text><text class="chevron">⌄</text>
      </view>
      <view class="tool-chip" :class="{ active: spatialFilter.mode === 'radius' }" role="button" aria-label="筛选空间范围" @tap="openSheet('space')">
        <text>{{ spaceLabel }}</text><text class="chevron">⌄</text>
      </view>
      <view v-if="compact" class="tool-chip icon-chip compact-action" role="button" aria-label="打开地图图层" @tap="openLayers">
        <text class="layers-glyph"></text>
      </view>
      <view v-if="compact" class="tool-chip icon-chip compact-action" role="button" aria-label="分享当前地图" @tap="shareMap">
        <text class="share-glyph"></text>
      </view>
      <view v-else class="tool-chip icon-chip" role="button" aria-label="更多地图操作" @tap="openSheet('more')"><text class="more-glyph">•••</text></view>
    </view>

    <view v-if="isRefreshing" class="refresh-pill"><view class="spinner"></view><text>正在刷新此区域</text></view>
    <view v-else-if="error" class="error-pill">
      <text>内容加载失败</text>
      <view class="retry-link" role="button" aria-label="重新加载地图内容" @tap="$emit('retry')">重试</view>
    </view>

    <view v-if="sheetType" class="sheet-mask" @tap="closeSheet">
      <view class="filter-sheet" @tap.stop>
        <view class="sheet-handle"></view>
        <view class="sheet-head">
          <text class="sheet-title">{{ sheetTitle }}</text>
          <view class="sheet-close" role="button" aria-label="关闭筛选" @tap="closeSheet">×</view>
        </view>

        <view v-if="sheetType === 'city'" class="option-grid">
          <view v-for="city in cities" :key="city.cityCode" class="option-card" :class="{ selected: city.cityName === cityName }" @tap="selectCity(city)">
            <text>{{ city.cityName }}</text>
          </view>
        </view>

        <view v-else-if="sheetType === 'time'" class="option-list">
          <view v-for="item in timeOptions" :key="item.value" class="option-row" :class="{ selected: timeRange.preset === item.value }" @tap="selectTime(item.value)">
            <text>{{ item.label }}</text><text v-if="timeRange.preset === item.value" class="check">✓</text>
          </view>
          <view v-if="timeRange.preset === 'custom'" class="date-row">
            <picker mode="date" :value="timeRange.start" @change="changeStart"><view class="date-field">{{ timeRange.start || '开始日期' }}</view></picker>
            <text>至</text>
            <picker mode="date" :value="timeRange.end" @change="changeEnd"><view class="date-field">{{ timeRange.end || '结束日期' }}</view></picker>
          </view>
        </view>

        <view v-else-if="sheetType === 'space'" class="option-list">
          <view class="option-row" :class="{ selected: spatialFilter.mode === 'bounds' }" @tap="selectSpace(0)">
            <text>当前可视区域</text><text v-if="spatialFilter.mode === 'bounds'" class="check">✓</text>
          </view>
          <view v-for="radius in [1,3,5,10]" :key="radius" class="option-row" :class="{ selected: spatialFilter.mode === 'radius' && spatialFilter.radiusKm === radius }" @tap="selectSpace(radius)">
            <text>附近 {{ radius }}km</text><text v-if="spatialFilter.mode === 'radius' && spatialFilter.radiusKm === radius" class="check">✓</text>
          </view>
        </view>
        <view v-else class="option-list more-list">
          <view class="option-row" @tap="openLayers">
            <view class="more-icon"><text class="layers-glyph"></text></view>
            <view class="more-copy"><text class="more-title">地图图层</text><text class="more-desc">控制内容、活动、服务和副本</text></view>
            <text class="more-arrow">›</text>
          </view>
          <view class="option-row" @tap="shareMap">
            <view class="more-icon"><text class="share-glyph"></text></view>
            <view class="more-copy"><text class="more-title">分享地图</text><text class="more-desc">分享当前视野和筛选条件</text></view>
            <text class="more-arrow">›</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { CITY_OPTIONS } from '@/utils/mapExploreState.js'

export default {
  props: {
    inline: { type: Boolean, default: false },
    compact: { type: Boolean, default: false },
    cityName: { type: String, default: '成都' },
    locationState: { type: String, default: 'idle' },
    timeRange: { type: Object, default: () => ({ preset: 'all', start: '', end: '' }) },
    spatialFilter: { type: Object, default: () => ({ mode: 'bounds', radiusKm: 5 }) },
    isRefreshing: { type: Boolean, default: false },
    error: { type: Object, default: null }
  },
  emits: ['city-select', 'time-change', 'space-change', 'layer-tap', 'share-tap', 'request-location', 'retry', 'sheet-state'],
  data() {
    return {
      sheetType: '',
      quickPanelOpen: false,
      topOffset: 12,
      cities: CITY_OPTIONS,
      timeOptions: [
        { value: 'all', label: '不限时间' },
        { value: 'today', label: '今天' },
        { value: 'week', label: '本周' },
        { value: 'custom', label: '自定义日期' }
      ]
    }
  },
  computed: {
    timeLabel() {
      return this.timeOptions.find(item => item.value === this.timeRange.preset)?.label || '不限时间'
    },
    spaceLabel() {
      return this.spatialFilter.mode === 'bounds' ? '可视区' : `${this.spatialFilter.radiusKm}km`
    },
    sheetTitle() {
      return this.sheetType === 'city' ? '选择城市' : this.sheetType === 'time' ? '时间范围' : this.sheetType === 'space' ? '空间范围' : '地图工具'
    },
    activeFilterCount() {
      let count = 0
      if (this.timeRange.preset !== 'all') count += 1
      if (this.spatialFilter.mode === 'radius') count += 1
      return count
    }
  },
  watch: {
    sheetType(value) {
      this.$emit('sheet-state', !!value)
    }
  },
  mounted() {
    try {
      const metrics = uni.getStorageSync('TOP_NAV_METRICS')
      const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
      this.topOffset = Number(metrics?.totalPx || info?.safeAreaInsets?.top || info?.statusBarHeight || 0) + 8
      // #ifdef H5
      this.topOffset = Number(info?.safeAreaInsets?.top || 0) + 12
      // #endif
    } catch (error) {
      this.topOffset = 72
    }
  },
  methods: {
    toggleQuickPanel() { this.quickPanelOpen = !this.quickPanelOpen },
    openSheet(type) {
      this.quickPanelOpen = false
      this.sheetType = type
    },
    closeSheet() { this.sheetType = '' },
    selectCity(city) {
      this.$emit('city-select', city)
      this.closeSheet()
    },
    selectTime(preset) {
      const now = new Date()
      let start = ''
      let end = ''
      if (preset === 'today') {
        start = now.toISOString().slice(0, 10)
        end = start
      } else if (preset === 'week') {
        const startDate = new Date(now)
        startDate.setDate(now.getDate() - ((now.getDay() + 6) % 7))
        const endDate = new Date(startDate)
        endDate.setDate(startDate.getDate() + 6)
        start = startDate.toISOString().slice(0, 10)
        end = endDate.toISOString().slice(0, 10)
      }
      this.$emit('time-change', { preset, start, end })
      if (preset !== 'custom') this.closeSheet()
    },
    changeStart(event) {
      this.$emit('time-change', { ...this.timeRange, preset: 'custom', start: event.detail.value })
    },
    changeEnd(event) {
      this.$emit('time-change', { ...this.timeRange, preset: 'custom', end: event.detail.value })
      if (this.timeRange.start) this.closeSheet()
    },
    selectSpace(radiusKm) {
      this.$emit('space-change', radiusKm ? { mode: 'radius', radiusKm } : { mode: 'bounds', radiusKm: 5 })
      this.closeSheet()
    },
    openLayers() {
      if (!this.compact) this.quickPanelOpen = false
      this.closeSheet()
      this.$emit('layer-tap')
    },
    shareMap() {
      if (!this.compact) this.quickPanelOpen = false
      this.closeSheet()
      this.$emit('share-tap')
    }
  }
}
</script>

<style scoped>
.explore-controls { position: fixed; left: 0; right: 0; z-index: 20; pointer-events: none; }
.explore-controls.inline {
  position: relative;
  left: auto;
  right: auto;
  z-index: 6;
  padding: 0 16px 10px;
}
.explore-controls.inline.compact {
  width: 48px;
  height: 48px;
  padding: 0;
  overflow: visible;
}
.compact-trigger {
  position: relative;
  z-index: 3;
  width: 48px;
  height: 48px;
  border: 1px solid rgba(234,88,12,.22);
  border-radius: 15px;
  background: linear-gradient(145deg,#fffaf7,#fff);
  box-shadow: 0 7px 20px rgba(15,23,42,.11);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  touch-action: manipulation;
  transition: transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease;
}
.compact-trigger:active {
  transform: scale(.96);
  background: #fff7ed;
  box-shadow: 0 4px 12px rgba(234,88,12,.16);
}
.compact-trigger.open {
  border-color: #ea580c;
  background: #ea580c;
  box-shadow: 0 8px 20px rgba(234,88,12,.28);
}
.compact-trigger.open .slider-line { background: rgba(255,255,255,.95); }
.compact-trigger.open .slider-line::after {
  border-color: #ea580c;
  background: rgba(255,255,255,.95);
}
.filter-glyph { width: 22px; height: 18px; display: flex; flex-direction: column; justify-content: space-between; }
.slider-line { position: relative; width: 22px; height: 2px; border-radius: 2px; background: #ea580c; }
.slider-line::after { content: ''; position: absolute; top: 50%; width: 6px; height: 6px; border: 2px solid #fff; border-radius: 50%; background: #ea580c; box-sizing: content-box; transform: translateY(-50%); }
.slider-line.one::after { left: 3px; }
.slider-line.two::after { right: 2px; }
.slider-line.three::after { left: 8px; }
.filter-count {
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border: 2px solid #fff;
  border-radius: 9px;
  background: #2563eb;
  color: #fff;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 800;
}
.explore-controls.inline .tool-row {
  width: 100%;
  margin: 0;
  border-color: rgba(148,163,184,.2);
  background: #fff;
  box-shadow: 0 6px 20px rgba(15,23,42,.07);
}
.explore-controls.inline.compact .tool-row.compact-panel {
  position: absolute;
  top: 0;
  right: 56px;
  z-index: 2;
  width: calc(100vw - 88px);
  min-height: 48px;
  margin: 0;
  padding: 2px;
  gap: 2px;
  overflow: hidden;
  border-color: rgba(148,163,184,.22);
  border-radius: 16px;
  background: rgba(255,255,255,.97);
  box-shadow: 0 10px 28px rgba(15,23,42,.14);
  transform-origin: right center;
  animation: compactPanelIn 180ms cubic-bezier(.2,.8,.2,1);
}
.explore-controls.inline.compact .compact-panel .tool-chip {
  height: 44px;
  padding: 0 8px;
  gap: 4px;
  border-radius: 14px;
  white-space: nowrap;
}
.explore-controls.inline.compact .compact-panel .tool-chip:first-child {
  overflow: hidden;
}
.explore-controls.inline.compact .compact-panel .tool-chip:first-child > text:nth-child(2) {
  overflow: hidden;
  text-overflow: ellipsis;
}
.explore-controls.inline.compact .compact-panel .chevron {
  display: none;
}
.explore-controls.inline.compact .compact-panel .tool-chip.icon-chip {
  width: 44px;
  min-width: 44px;
  padding: 0;
}
.explore-controls.inline.compact .compact-panel .compact-action {
  background: var(--color-page);
}
.explore-controls.inline.compact .compact-panel .compact-action:active {
  background: #ffedd5;
}
.explore-controls.inline .permission-banner { margin: 0 0 8px; }
.permission-banner,.tool-row,.refresh-pill,.error-pill,.sheet-mask { pointer-events: auto; }
.permission-banner { margin: 0 14px 10px; min-height: 58px; padding: 10px 10px 10px 14px; border: 1px solid rgba(234,88,12,.18); border-radius: 18px; background: rgba(255,255,255,.96); box-shadow: 0 10px 30px rgba(15,23,42,.12); display: flex; align-items: center; gap: 10px; backdrop-filter: blur(16px); }
.permission-copy { flex: 1; min-width: 0; }
.permission-title,.permission-desc { display: block; }
.permission-title { color: #0f172a; font-size: 14px; font-weight: 750; }
.permission-desc { margin-top: 2px; color: #64748b; font-size: 11px; }
.permission-action { min-width: 76px; height: 38px; padding: 0 12px; border-radius: 19px; background: #fff7ed; color: #c2410c; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; }
.tool-row { width: calc(100% - 28px); min-height: 48px; margin: 0 14px; padding: 3px; display: flex; align-items: center; gap: 4px; border: 1px solid rgba(255,255,255,.9); border-radius: 18px; background: rgba(255,255,255,.94); box-shadow: 0 10px 28px rgba(15,23,42,.12); box-sizing: border-box; backdrop-filter: blur(16px) saturate(135%); }
.tool-chip { min-width: 0; height: 42px; padding: 0 11px; display: flex; align-items: center; justify-content: center; gap: 5px; border: 0; border-radius: 15px; background: transparent; color: #475569; box-shadow: none; font-size: 12px; font-weight: 650; }
.tool-chip:first-child { flex: 1; justify-content: flex-start; }
.tool-chip.primary,.tool-chip.active { border-color: rgba(234,88,12,.22); color: #c2410c; background: #fffaf7; }
.tool-chip.icon-chip { width: 42px; padding: 0; }
.chevron { color: #94a3b8; font-size: 12px; }
.pin-glyph { width: 12px; height: 14px; border: 2px solid #ea580c; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-sizing: border-box; }
.layers-glyph { width: 18px; height: 14px; border: 2px solid #64748b; border-radius: 4px; box-shadow: 4px 4px 0 -2px #fff, 4px 4px 0 0 #64748b; box-sizing: border-box; }
.share-glyph { position: relative; width: 18px; height: 18px; border: 2px solid #64748b; border-radius: 5px; box-sizing: border-box; }
.share-glyph::after { content: ''; position: absolute; left: 6px; top: -7px; width: 7px; height: 7px; border-top: 2px solid #64748b; border-right: 2px solid #64748b; transform: rotate(-45deg); }
.more-glyph { color: #475569; font-size: 14px; font-weight: 900; letter-spacing: 1px; line-height: 1; }
.refresh-pill,.error-pill { width: max-content; max-width: calc(100% - 28px); margin: 10px auto 0; min-height: 36px; padding: 0 14px; border-radius: 18px; background: rgba(15,23,42,.86); color: #fff; display: flex; align-items: center; gap: 8px; font-size: 12px; box-shadow: 0 8px 24px rgba(15,23,42,.18); }
.error-pill { background: rgba(127,29,29,.92); }
.retry-link { min-height: 32px; padding: 0 4px; display: flex; align-items: center; color: #ffedd5; font-weight: 750; }
.spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.35); border-top-color: #fff; border-radius: 50%; animation: spin .8s linear infinite; }
.sheet-mask { position: fixed; inset: 0; z-index: 100; background: linear-gradient(to bottom,rgba(15,23,42,.08),rgba(15,23,42,.38)); display: flex; align-items: flex-end; }
.filter-sheet { width: 100%; max-height: 66vh; overflow: auto; padding: 10px 18px calc(env(safe-area-inset-bottom) + 24px); border: 1px solid rgba(255,255,255,.9); border-radius: 28px 28px 0 0; background: rgba(255,255,255,.98); box-shadow: 0 -18px 48px rgba(15,23,42,.2); backdrop-filter: blur(18px) saturate(130%); animation: sheetIn 220ms cubic-bezier(.2,.8,.2,1); }
.sheet-handle { width: 40px; height: 4px; margin: 0 auto 12px; border-radius: 2px; background: #cbd5e1; }
.sheet-head { min-height: 48px; display: flex; align-items: center; justify-content: space-between; }
.sheet-title { color: #0f172a; font-size: 18px; font-weight: 800; }
.sheet-close { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 22px; background: #f1f5f9; color: #64748b; font-size: 24px; }
.option-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; padding-top: 8px; }
.option-card { min-height: 48px; border: 1px solid #e2e8f0; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: #334155; font-size: 14px; }
.option-card.selected,.option-row.selected { border-color: #fb923c; color: #c2410c; background: #fff7ed; font-weight: 750; }
.option-list { padding-top: 4px; }
.option-row { min-height: 52px; padding: 0 14px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; color: #334155; font-size: 15px; }
.check { color: #ea580c; font-weight: 800; }
.date-row { padding: 14px 0 4px; display: flex; align-items: center; justify-content: space-between; gap: 8px; color: #64748b; }
.date-field { min-width: 118px; height: 44px; padding: 0 12px; border: 1px solid #e2e8f0; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #334155; font-size: 13px; }
.more-list .option-row { min-height: 72px; padding: 8px 4px; gap: 12px; }
.more-icon { width: 44px; height: 44px; flex: 0 0 44px; border-radius: 14px; background: #fff7ed; display: flex; align-items: center; justify-content: center; }
.more-copy { min-width: 0; flex: 1; }
.more-title,.more-desc { display: block; }
.more-title { color: #0f172a; font-size: 15px; font-weight: 750; }
.more-desc { margin-top: 3px; color: #64748b; font-size: 12px; }
.more-arrow { color: #94a3b8; font-size: 24px; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes compactPanelIn { from { opacity: 0; transform: translateX(10px) scaleX(.96); } to { opacity: 1; transform: translateX(0) scaleX(1); } }
@keyframes sheetIn { from { opacity: .7; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@media (prefers-reduced-motion: reduce) { .spinner,.compact-panel,.filter-sheet { animation: none; } }
</style>

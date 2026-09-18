<template>
  <view
    class="explore-controls"
    :class="{ inline, compact }"
    :style="inline ? {} : { top: topOffset + 'px' }"
  >
    <view
      v-if="compact"
      class="compact-trigger"
      :class="{ open: quickPanelOpen, social: compact }"
      role="button"
      :aria-expanded="quickPanelOpen"
      :aria-label="quickPanelOpen ? '收起地图社交场景' : '打开地图社交场景'"
      @tap="toggleQuickPanel"
    >
      <view class="filter-glyph" aria-hidden="true">
        <view class="slider-line one"></view>
        <view class="slider-line two"></view>
        <view class="slider-line three"></view>
      </view>
      <view v-if="activeFilterCount && !compact" class="filter-count">{{ activeFilterCount }}</view>
    </view>

    <scroll-view
      v-if="compact && quickPanelOpen"
      class="social-scene-scroll"
      scroll-x
      enhanced
      :show-scrollbar="false"
      :scroll-into-view="`social-${socialScene}`"
      aria-label="地图社交场景，可左右滑动"
    >
      <view class="social-scene-list">
        <view
          v-for="scene in socialScenes"
          :id="`social-${scene.id}`"
          :key="scene.id"
          class="social-scene-chip"
          :class="[{ selected: socialScene === scene.id }, scene.id]"
          role="button"
          :aria-label="`进入${scene.name}`"
          :aria-pressed="socialScene === scene.id"
          @tap.stop="selectSocialScene(scene.id)"
        >
          <view class="social-scene-icon" aria-hidden="true"><view class="social-icon-detail"></view></view>
          <text>{{ scene.name }}</text>
        </view>
      </view>
    </scroll-view>

    <view v-if="locationState === 'denied' && !compact" class="permission-banner">
      <view class="permission-copy">
        <text class="permission-title">正在浏览{{ cityName }}</text>
        <text class="permission-desc">定位未开启，可手动选城或重新授权</text>
      </view>
      <view class="permission-action" role="button" aria-label="重新授权定位" @tap="$emit('request-location')">重新授权</view>
    </view>

    <view v-if="!compact" class="tool-row">
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
    ,
    socialScene: { type: String, default: 'people' }
  },
  emits: ['city-select', 'time-change', 'space-change', 'layer-tap', 'share-tap', 'request-location', 'retry', 'sheet-state', 'social-scene-change'],
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
      ],
      socialScenes: [
        { id: 'people', name: '附近的人' },
        { id: 'checkin', name: '同城打卡' },
        { id: 'mate', name: '活动搭子' },
        { id: 'couple', name: '亲密共享' },
        { id: 'board', name: '留言板' }
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
    selectSocialScene(scene) {
      try { uni.setStorageSync('MAP_SOCIAL_SCENE_ENTRY_V1', scene) } catch (error) {}
      try { if (typeof uni.vibrateShort === 'function') uni.vibrateShort({ type: 'light' }) } catch (error) {}
      this.$emit('social-scene-change', scene)
    },
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
  width: 44px;
  height: 44px;
  padding: 0;
  overflow: visible;
}
.compact-trigger {
  position: relative;
  z-index: 3;
  width: 44px;
  height: 44px;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: #f4f4f2;
  box-shadow: none;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  touch-action: manipulation;
  transition: transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease;
}
.compact-trigger:active {
  transform: scale(.96);
  background: var(--color-surface-muted);
  box-shadow: none;
}
.compact-trigger.open {
  border-color: var(--color-primary);
  background: var(--color-primary);
  box-shadow: none;
}
.compact-trigger.open .slider-line { background: rgba(255,255,255,.95); }
.compact-trigger.open .slider-line::after {
  border-color: var(--color-primary);
  background: rgba(255,255,255,.95);
}
.compact-trigger.social::before {
  content: '';
  position: absolute;
  inset: -5px;
  border: 0;
  border-radius: 50%;
  pointer-events: none;
}
.filter-glyph { width: 20px; height: 16px; display: flex; flex-direction: column; justify-content: space-between; }
.slider-line { position: relative; width: 20px; height: 2px; border-radius: 2px; background: var(--color-primary); }
.slider-line::after { content: ''; position: absolute; top: 50%; width: 5px; height: 5px; border: 2px solid #fff; border-radius: 50%; background: var(--color-primary); box-sizing: content-box; transform: translateY(-50%); }
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
  background: var(--color-primary);
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
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.07);
}
.social-scene-scroll {
  position: absolute;
  top: -2px;
  right: 56px;
  z-index: 2;
  width: calc(100vw - 86px);
  height: 52px;
  white-space: nowrap;
  border-color: rgba(148,163,184,.22);
  border-radius: 18px;
  background: rgba(255,255,255,.96);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.1);
  transform-origin: right center;
  animation: compactPanelIn 180ms cubic-bezier(.2,.8,.2,1);
  pointer-events: auto;
}
.social-scene-list { display: inline-flex; min-width: 100%; height: 52px; padding: 4px; gap: 6px; box-sizing: border-box; }
.social-scene-chip { min-width: 112px; height: 44px; padding: 0 13px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: 1px solid rgba(34,52,47,.07); border-radius: 15px; color: #26332f; background: #fff; box-sizing: border-box; font-size: 13px; font-weight: 750; transition: color 160ms ease, background-color 160ms ease, transform 160ms ease; }
.social-scene-chip:active { transform: scale(.97); }
.social-scene-chip.selected { color: #fff; border-color: var(--color-text); background: var(--color-text); }
.social-scene-icon { position: relative; width: 24px; height: 24px; flex: 0 0 24px; border-radius: 8px; color: var(--color-primary); background: var(--color-surface-muted); }
.social-scene-chip.selected .social-scene-icon { color: #fff; background: var(--color-primary); }
.social-scene-icon::before,.social-scene-icon::after,.social-icon-detail::before,.social-icon-detail::after { content: ''; position: absolute; box-sizing: border-box; }
.people .social-scene-icon::before { left: 8px; top: 5px; width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
.people .social-scene-icon::after { left: 5px; bottom: 4px; width: 14px; height: 7px; border-radius: 8px 8px 4px 4px; background: currentColor; }
.checkin .social-scene-icon::before { left: 7px; top: 5px; width: 11px; height: 14px; border: 2px solid currentColor; border-radius: 3px; transform: rotate(-5deg); }
.mate .social-scene-icon::before { left: 5px; top: 11px; width: 14px; border-top: 2px solid currentColor; }
.mate .social-scene-icon::after { left: 11px; top: 5px; height: 14px; border-left: 2px solid currentColor; }
.couple .social-scene-icon::before { left: 5px; top: 7px; width: 14px; height: 11px; border-radius: 8px 8px 4px 4px; background: currentColor; }
.board .social-scene-icon::before { left: 5px; top: 5px; width: 14px; height: 14px; border: 2px solid currentColor; border-radius: 4px; }
.board .social-icon-detail::before { left: 9px; top: 9px; width: 7px; border-top: 2px solid currentColor; box-shadow: 0 4px 0 currentColor; }
.explore-controls.inline .permission-banner { margin: 0 0 8px; }
.permission-banner,.tool-row,.refresh-pill,.error-pill,.sheet-mask { pointer-events: auto; }
.permission-banner { margin: 0 14px 10px; min-height: 58px; padding: 10px 10px 10px 14px; border: 1px solid rgba(32,32,32,.18); border-radius: 18px; background: rgba(255,255,255,.96); box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1); display: flex; align-items: center; gap: 10px; backdrop-filter: blur(10px); }
.permission-copy { flex: 1; min-width: 0; }
.permission-title,.permission-desc { display: block; }
.permission-title { color: var(--color-text); font-size: 14px; font-weight: 750; }
.permission-desc { margin-top: 2px; color: var(--color-text-body); font-size: 11px; }
.permission-action { min-width: 76px; height: 38px; padding: 0 12px; border-radius: 19px; background: var(--color-primary-soft); color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; }
.tool-row { width: calc(100% - 28px); min-height: 48px; margin: 0 14px; padding: 3px; display: flex; align-items: center; gap: 4px; border: 1px solid rgba(255,255,255,.9); border-radius: 18px; background: rgba(255,255,255,.94); box-shadow: 0 10px 28px rgba(0, 0, 0, 0.1); box-sizing: border-box; backdrop-filter: blur(10px) saturate(100%); }
.tool-chip { min-width: 0; height: 42px; padding: 0 11px; display: flex; align-items: center; justify-content: center; gap: 5px; border: 0; border-radius: 15px; background: transparent; color: var(--color-text-body); box-shadow: none; font-size: 12px; font-weight: 650; }
.tool-chip:first-child { flex: 1; justify-content: flex-start; }
.tool-chip.primary,.tool-chip.active { border-color: rgba(32,32,32,.22); color: var(--color-primary); background: var(--color-primary-soft); }
.tool-chip.icon-chip { width: 42px; padding: 0; }
.chevron { color: var(--color-text-muted); font-size: 12px; }
.pin-glyph { width: 12px; height: 14px; border: 2px solid var(--color-primary); border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-sizing: border-box; }
.layers-glyph { width: 18px; height: 14px; border: 2px solid var(--color-text-body); border-radius: 4px; box-shadow: 4px 4px 0 -2px #fff, 4px 4px 0 0 #5c667a; box-sizing: border-box; }
.share-glyph { position: relative; width: 18px; height: 18px; border: 2px solid var(--color-text-body); border-radius: 5px; box-sizing: border-box; }
.share-glyph::after { content: ''; position: absolute; left: 6px; top: -7px; width: 7px; height: 7px; border-top: 2px solid var(--color-text-body); border-right: 2px solid var(--color-text-body); transform: rotate(-45deg); }
.more-glyph { color: var(--color-text-body); font-size: 14px; font-weight: 900; letter-spacing: 1px; line-height: 1; }
.refresh-pill,.error-pill { width: max-content; max-width: calc(100% - 28px); margin: 10px auto 0; min-height: 36px; padding: 0 14px; border-radius: 18px; background: rgba(15,23,42,.86); color: #fff; display: flex; align-items: center; gap: 8px; font-size: 12px; box-shadow: 0 8px 24px rgba(15,23,42,.18); }
.error-pill { background: rgba(127,29,29,.92); }
.retry-link { min-height: 32px; padding: 0 4px; display: flex; align-items: center; color: var(--color-primary-soft); font-weight: 750; }
.spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.35); border-top-color: #fff; border-radius: 50%; animation: spin .8s linear infinite; }
.sheet-mask { position: fixed; inset: 0; z-index: 100; background: linear-gradient(to bottom,rgba(15,23,42,.08),rgba(15,23,42,.38)); display: flex; align-items: flex-end; }
.filter-sheet { width: 100%; max-height: 66vh; overflow: auto; padding: 10px 18px calc(env(safe-area-inset-bottom) + 24px); border: 1px solid rgba(255,255,255,.9); border-radius: 28px 28px 0 0; background: rgba(255,255,255,.98); box-shadow: 0 -18px 48px rgba(0, 0, 0, 0.18); backdrop-filter: blur(10px) saturate(100%); animation: sheetIn 220ms cubic-bezier(.2,.8,.2,1); }
.sheet-handle { width: 40px; height: 4px; margin: 0 auto 12px; border-radius: 2px; background: #cbd5e1; }
.sheet-head { min-height: 48px; display: flex; align-items: center; justify-content: space-between; }
.sheet-title { color: var(--color-text); font-size: 18px; font-weight: 800; }
.sheet-close { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 22px; background: var(--color-surface-muted); color: var(--color-text-body); font-size: 24px; }
.option-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; padding-top: 8px; }
.option-card { min-height: 48px; border: 1px solid var(--color-border); border-radius: 14px; display: flex; align-items: center; justify-content: center; color: var(--color-text); font-size: 14px; }
.option-card.selected,.option-row.selected { border-color: rgba(32,32,32,.42); color: var(--color-primary); background: var(--color-primary-soft); font-weight: 750; }
.option-list { padding-top: 4px; }
.option-row { min-height: 52px; padding: 0 14px; border-bottom: 1px solid var(--color-surface-muted); display: flex; align-items: center; justify-content: space-between; color: var(--color-text); font-size: 15px; }
.check { color: var(--color-primary); font-weight: 800; }
.date-row { padding: 14px 0 4px; display: flex; align-items: center; justify-content: space-between; gap: 8px; color: var(--color-text-body); }
.date-field { min-width: 118px; height: 44px; padding: 0 12px; border: 1px solid var(--color-border); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--color-text); font-size: 13px; }
.more-list .option-row { min-height: 72px; padding: 8px 4px; gap: 12px; }
.more-icon { width: 44px; height: 44px; flex: 0 0 44px; border-radius: 14px; background: var(--color-primary-soft); display: flex; align-items: center; justify-content: center; }
.more-copy { min-width: 0; flex: 1; }
.more-title,.more-desc { display: block; }
.more-title { color: var(--color-text); font-size: 15px; font-weight: 750; }
.more-desc { margin-top: 3px; color: var(--color-text-body); font-size: 12px; }
.more-arrow { color: var(--color-text-muted); font-size: 24px; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes compactPanelIn { from { opacity: 0; transform: translateX(10px) scaleX(.96); } to { opacity: 1; transform: translateX(0) scaleX(1); } }
@keyframes sheetIn { from { opacity: .7; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@media (prefers-reduced-motion: reduce) { .spinner,.social-scene-scroll,.filter-sheet { animation: none; }.social-scene-chip { transition: none; } }
</style>

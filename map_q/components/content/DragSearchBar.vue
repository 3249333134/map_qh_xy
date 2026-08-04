<template>
  <view
    class="drag-area"
    catchtouchmove="true"
    @touchstart="onDragStart"
    @touchmove.stop.prevent="onDrag"
    @touchend="onDragEnd"
    @touchcancel="onDragEnd"
  >
    <view class="drag-handle" v-if="!isCollapsed">
      <view class="drag-indicator"></view>
    </view>
    <view class="search-box" catchtouchmove="true" @touchstart="onDragStart" @touchmove.stop.prevent="onDrag" @touchend="onDragEnd" @touchcancel="onDragEnd">
      <view
        class="search-input-wrapper"
        :class="{ collapsed: isCollapsed, 'detail-open': categoryActionExpanded && !isCollapsed, 'with-filter-button': hasFilterButton }"
        :style="isCollapsed ? collapsedSearchStyle : {}"
        @tap.stop="onSearchTap"
      >
        <view class="search-icon" aria-hidden="true"></view>
        <input
          class="search-input"
          :value="value"
          placeholder="搜索地点、频道或附近灵感"
          confirm-type="search"
          aria-label="搜索地点、频道或附近灵感"
          @input="onSearchInput"
          @focus="onSearchFocus"
        />
        <view v-if="!isCollapsed" class="ai-badge"><text>AI</text></view>
      </view>
      <view
        v-if="isCollapsed && !hasFilterButton"
        class="search-action-fixed"
        role="button"
        aria-label="打开地点详情"
        catchtouchmove="true"
        @tap.stop="onRightActionTap"
        @touchstart="onDragStart"
        @touchmove.stop.prevent="onDrag"
        @touchend="onDragEnd"
        @touchcancel="onDragEnd"
      >
        <view class="place-icon" aria-hidden="true"><view></view></view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  props: {
    isCollapsed: { type: Boolean, default: false },
    collapsedSearchStyle: { type: Object, default: () => ({}) },
    categoryActionExpanded: { type: Boolean, default: false },
    collapsedSearchWidth: { type: Number, default: 76 },
    collapsedGap: { type: Number, default: 8 },
    selectedPoint: { type: Object, default: null },
    hasFilterButton: { type: Boolean, default: false },
    expandedLeft: { type: Number, default: 0 }
    ,
    value: { type: String, default: '' }
  },
  emits: ['drag-start','drag','drag-end','search-input','search-focus','search-tap','right-action-tap'],
  methods: {
    onDragStart(e) { this.$emit('drag-start', e) },
    onDrag(e) { this.$emit('drag', e) },
    onDragEnd(e) { this.$emit('drag-end', e) },
    onSearchInput(e) { this.$emit('search-input', e) },
    onSearchFocus(e) {
      this.$emit('search-focus', e)
      this.$emit('search-tap', e)
    },
    onSearchTap() { this.$emit('search-tap') },
    onRightActionTap() { this.$emit('right-action-tap') },
    onCloseTap() { this.$emit('right-action-tap') }
  }
}
</script>

<style scoped>
.drag-area { padding: 8px 16px 12px; touch-action: manipulation; }
.drag-handle { display: flex; justify-content: center; min-height: 16px; padding: 2px 0 10px; }
.drag-indicator { width: 40px; height: 4px; background: #cbd5e1; border-radius: 999px; box-shadow: inset 0 1px 1px rgba(15,23,42,.08); }
.search-box { position: relative; }
.search-input-wrapper { display: flex; align-items: center; width: 100%; height: 48px; padding: 0 10px 0 17px; background: var(--color-page); border: 1px solid rgba(148,163,184,.28); border-radius: 24px; box-shadow: inset 0 1px 0 rgba(255,255,255,.9); transition: width 200ms cubic-bezier(.2,.8,.2,1), background-color 200ms ease, box-shadow 200ms ease; }
.search-input-wrapper.with-filter-button { width: calc(100% - 56px); }
.search-input-wrapper:active { background: #f8fafc; border-color: rgba(234,88,12,.24); }
.search-input-wrapper.collapsed { width: calc(100% - 72px); margin: 0; background: rgba(255,255,255,.96); border-color: rgba(255,255,255,.92); box-shadow: 0 10px 30px rgba(15,23,42,.15); backdrop-filter: blur(16px); }
.search-input-wrapper.detail-open { width: 100%; padding-right: 12px; }
.search-input-wrapper.detail-open .ai-badge { display: flex; }
.search-icon { position: relative; width: 15px; height: 15px; flex: 0 0 15px; margin-right: 12px; border: 2px solid #64748b; border-radius: 50%; box-sizing: border-box; }
.search-icon::after { content: ''; position: absolute; width: 6px; height: 2px; right: -5px; bottom: -2px; border-radius: 2px; background: #64748b; transform: rotate(45deg); }
.search-input { flex: 1; min-width: 0; height: 48px; font-size: 15px; color: #0f172a; background: transparent; }
.search-input::placeholder { color: #94a3b8; }
.ai-badge { display: flex; align-items: center; justify-content: center; min-width: 34px; height: 26px; margin-left: 8px; border: 1px solid rgba(234,88,12,.12); border-radius: 13px; background: linear-gradient(135deg,#fff7ed,#ffedd5); color: #c2410c; font-size: 11px; font-weight: 750; letter-spacing: .4px; }
.ai-badge text { font-size: 11px; line-height: 1; }
.search-action-fixed { position: absolute; right: 0; top: 50%; transform: translateY(-50%); width: 48px; height: 48px; border-radius: 15px; background: linear-gradient(145deg,var(--color-primary) 0%,#f97316 52%,#ea580c 100%); border: 2px solid rgba(255,255,255,.94); box-shadow: 0 8px 22px rgba(234,88,12,.3); display: flex; align-items: center; justify-content: center; color: #fff; transition: transform 160ms ease, box-shadow 160ms ease; }
.search-action-fixed:active { transform: translateY(-50%) scale(.96); box-shadow: 0 4px 14px rgba(234,88,12,.24); }
.place-icon { position: relative; width: 16px; height: 18px; }
.place-icon::before {
  content: '';
  position: absolute;
  left: 2px;
  top: 0;
  width: 12px;
  height: 12px;
  border: 1.75px solid #fff;
  border-radius: 50% 50% 50% 0;
  box-sizing: border-box;
  transform: rotate(-45deg);
}
.place-icon view {
  position: absolute;
  left: 6px;
  top: 4px;
  width: 4px;
  height: 4px;
  border: 1.5px solid #fff;
  border-radius: 50%;
  box-sizing: border-box;
}
@media (prefers-reduced-motion: reduce) { .search-input-wrapper,.search-action-fixed { transition: none; } }
</style>

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
        <view v-if="!isCollapsed" class="ai-badge"><text class="ai-label">AI</text></view>
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
        <view class="place-icon" aria-hidden="true"><view class="place-dot"></view></view>
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
.drag-area { padding: 8px 14px 6px; touch-action: manipulation; }
.drag-handle { display: flex; justify-content: center; min-height: 16px; padding: 0 0 10px; }
.drag-indicator { width: 32px; height: 4px; background: #c4c4bf; border-radius: 999px; box-shadow: none; }
.search-box { position: relative; min-height: 44px; border: 0; border-radius: 0; background: transparent; box-shadow: none; }
.search-input-wrapper { display: flex; align-items: center; width: 100%; height: 44px; padding: 0 10px 0 14px; border: 1px solid var(--color-border); transition: width 200ms cubic-bezier(.2,.8,.2,1), background-color 200ms ease, box-shadow 200ms ease; min-height: 44px;  background: var(--color-surface-glass); border-color: rgba(255,255,255,.9); border-radius: 18px; box-shadow: var(--shadow-card); }
.search-input-wrapper.with-filter-button { width: calc(100% - 52px); }
.search-input-wrapper:active { background: var(--color-page); border-color: rgba(32,32,32,.28); }
.search-input-wrapper.collapsed { width: calc(100% - 72px); margin: 0; backdrop-filter: blur(10px);  background: var(--color-surface-glass); border-color: rgba(255,255,255,.9); border-radius: 18px; box-shadow: var(--shadow-card); }
.search-input-wrapper.detail-open { width: 100%; padding-right: 12px; }
.search-input-wrapper.detail-open .ai-badge { display: flex; }
.search-icon { position: relative; width: 14px; height: 14px; flex: 0 0 15px; margin-right: 10px; border: 2px solid var(--color-text-body); border-radius: 50%; box-sizing: border-box; flex-basis: 14px; border-width: 1.75px; }
.search-icon::after { content: ''; position: absolute; width: 6px; height: 2px; right: -5px; bottom: -2px; border-radius: 2px; background: var(--color-text-body); transform: rotate(45deg); }
.search-input { flex: 1; min-width: 0; height: 44px; font-size: 13px; color: var(--color-text); background: transparent; }
.search-input::placeholder { color: var(--color-text-muted); }
.ai-badge { display: flex; align-items: center; justify-content: center; min-width: 28px; height: 26px; margin-left: 6px; border: 0; font-size: 11px; font-weight: 600; letter-spacing: .4px;  background: #e0f2ec; color: #286c5c; border-radius: 10px; }
.ai-label { font-size: 11px; line-height: 1; }
.search-action-fixed { position: absolute; right: 0; top: 50%; transform: translateY(-50%); width: 44px; height: 44px; border-radius: 14px; background: var(--color-primary); border: 0; box-shadow: none; display: flex; align-items: center; justify-content: center; color: #fff; transition: transform 160ms ease, box-shadow 160ms ease; }
.search-action-fixed:active { transform: translateY(-50%) scale(.96); box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1); }
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
.place-dot {
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

<template>
  <view class="category-tabs-wrap" :class="{ expanded: categoryActionExpanded }" catchtouchmove="true" @touchstart="onDragStart" @touchmove.stop.prevent="onDrag" @touchend="onDragEnd" @touchcancel="onDragEnd">
    <view v-if="categoryActionExpanded" class="selection-row">
      <view class="status-slot" aria-label="营业状态：营业中">
        <view class="status-dot" aria-hidden="true"></view>
        <text>营业中</text>
      </view>
      <view class="all-tab" @tap.stop="onCategoryChange('all')"><text>全部</text></view>
      <view class="selected-place">
        <view class="pin-dot" aria-hidden="true"></view>
        <text class="selected-place-text">{{ selectedPointName }}</text>
        <view class="close-icon" aria-label="关闭地点详情" @tap.stop="onCloseTap"></view>
      </view>
    </view>
    <scroll-view v-else class="category-tabs" scroll-x :show-scrollbar="false">
      <view
        v-for="category in categories"
        :key="category.id"
        :class="['category-tab', { active: category.id === activeCategory }]"
        @tap="onCategoryChange(category.id)"
      >
        <text class="tab-text">{{ category.name }}</text>
        <view class="tab-underline" v-if="category.id === activeCategory"></view>
      </view>
    </scroll-view>
    <view
      v-if="!categoryActionExpanded && showActionButton"
      class="category-action"
      role="button"
      aria-label="打开地点详情"
      @tap.stop="onRightActionTap"
    >
      <view class="action-place-icon" aria-hidden="true"><view></view></view>
      <text class="action-label">地点</text>
    </view>
  </view>
</template>

<script>
export default {
  props: {
    categories: { type: Array, default: () => [] },
    activeCategory: { type: String, default: 'all' },
    categoryActionExpanded: { type: Boolean, default: false },
    expandedLeft: { type: Number, default: 0 },
    selectedPoint: { type: Object, default: null },
    showActionButton: { type: Boolean, default: false }
  },
  emits: ['drag-start','drag','drag-end','category-change','right-action-tap','close-point-detail'],
  computed: {
    selectedPointName() {
      const point = this.selectedPoint && this.selectedPoint.point
      return (point && (point.name || point.title || point.address)) || '已选地点'
    }
  },
  methods: {
    onDragStart(e) { this.$emit('drag-start', e) },
    onDrag(e) { this.$emit('drag', e) },
    onDragEnd(e) { this.$emit('drag-end', e) },
    onCategoryChange(id) { this.$emit('category-change', id) },
    onRightActionTap() { this.$emit('right-action-tap') },
    onCloseTap() { this.$emit('close-point-detail') }
  }
}
</script>

<style scoped>
.category-tabs-wrap { position: relative; min-height: 50px; background: transparent; touch-action: manipulation; }

.category-tabs {
  display: flex;
  flex-wrap: nowrap;
  white-space: nowrap;
  padding: 0 66px 6px 14px;
  align-items: center;
  scroll-behavior: smooth;
}

.category-tab {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  min-width: 48px;
  height: 44px;
  margin-right: 2px;
  padding: 0 10px;
  font-size: 13px;
  background-color: transparent;
  color: var(--color-text-body);
  position: relative;
  border: 1px solid transparent;
  border-radius: 12px;
  transition: color .2s ease, background-color .2s ease, transform .2s ease;
  cursor: pointer;
  min-height: 44px;
  justify-content: center;
}

.category-tab:active {
  transform: scale(.96);
}

.category-tab.active {
  font-weight: 700;
  border-color: transparent;  color: #286c5c; background: #e0f2ec; border-radius: 16px; }

.tab-text {
  font-size: 13px;
  line-height: 20px;
  transition: all 0.2s ease;
}

.tab-underline {
  position: absolute;
  bottom: 2px;
  width: 12px;
  height: 3px;
  background: var(--color-primary);
  border-radius: 2rpx;
  animation: underlineExpand 0.25s ease;
  display: none;
}

@keyframes underlineExpand {
  from {
    width: 0;
  }
  to {
    width: 12px;
  }
}

.selection-row { position: relative; display: flex; align-items: center; gap: 10px; min-height: 52px; padding: 0 16px 8px; }
.all-tab { display: none; }
.all-tab text { font-size: 15px; }
.status-slot { display: flex; align-items: center; justify-content: center; flex: 0 0 auto; min-width: 72px; height: 40px; padding: 0 12px; gap: 6px; color: #15803d; background: #f0fdf4; border: 1px solid #dcfce7; border-radius: 14px; }
.status-slot text { font-size: 12px; line-height: 1; font-weight: 700; color: #15803d; white-space: nowrap; }
.status-dot { width: 7px; height: 7px; flex: 0 0 7px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 0 3px rgba(34,197,94,.12); }
.selected-place { display: flex; align-items: center; min-width: 0; flex: 1; height: 44px; padding: 0 6px 0 14px; border: 1px solid var(--color-border); color: var(--color-text);  background: var(--color-surface-glass); border-color: rgba(255,255,255,.92); border-radius: 18px; box-shadow: var(--shadow-card); }
.category-tabs-wrap.expanded .selected-place {
  position: relative;
  inset: auto;
  z-index: 1;
}
.pin-dot { position: relative; flex: 0 0 14px; width: 14px; height: 14px; margin-right: 9px; border: 4px solid var(--color-primary); border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-sizing: border-box; }
.selected-place-text { min-width: 0; flex: 1; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-size: 15px; font-weight: 700; color: var(--color-text); }
.close-icon { position: relative; flex: 0 0 38px; width: 38px; height: 38px; margin-left: 4px; border-radius: 12px; background: var(--color-surface-muted); }
.close-icon::before,.close-icon::after { content: ''; position: absolute; left: 11px; top: 17px; width: 14px; height: 2px; border-radius: 2px; background: var(--color-primary); }
.close-icon::before { transform: rotate(45deg); }
.close-icon::after { transform: rotate(-45deg); }
.close-icon:active { background: rgba(32,32,32,.16); }
.category-action { position: absolute; top: 0; right: 14px; z-index: 3; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; border: 1px solid var(--color-border); transition: transform 160ms ease, background-color 160ms ease;  background: var(--color-surface-glass); border-color: rgba(255,255,255,.92); border-radius: 18px; box-shadow: var(--shadow-card); }
.category-action:active { transform: scale(.96); background: var(--color-surface-muted); }
.action-place-icon { position: relative; flex: 0 0 16px; width: 16px; height: 18px; }
.action-place-icon::before { content: ''; position: absolute; left: 2px; top: 0; width: 12px; height: 12px; border: 1.8px solid var(--color-primary); border-radius: 50% 50% 50% 0; box-sizing: border-box; transform: rotate(-45deg); }
.action-place-icon view { position: absolute; left: 6px; top: 4px; width: 4px; height: 4px; border: 1.4px solid var(--color-primary); border-radius: 50%; box-sizing: border-box; }
.action-label { display: none; }
</style>

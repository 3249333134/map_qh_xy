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
    <scroll-view v-else class="category-tabs" scroll-x show-scrollbar="false">
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
  padding: 0 82px 6px 14px;
  align-items: center;
  scroll-behavior: smooth;
}

.category-tab {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  min-width: 58px;
  height: 44px;
  margin-right: 6px;
  padding: 0 15px;
  font-size: 14px;
  background-color: transparent;
  color: #64748b;
  position: relative;
  border: 1px solid transparent;
  border-radius: 22px;
  transition: color .2s ease, background-color .2s ease, transform .2s ease;
  cursor: pointer;
}

.category-tab:active {
  transform: scale(.96);
}

.category-tab.active {
  color: #9a3412;
  font-weight: 700;
  background: #fff7ed;
  border-color: rgba(234,88,12,.12);
}

.tab-text {
  font-size: 30rpx;
  line-height: 42px;
  transition: all 0.2s ease;
}

.tab-underline {
  position: absolute;
  bottom: 2px;
  width: 12px;
  height: 3px;
  background: #f97316;
  border-radius: 2rpx;
  animation: underlineExpand 0.25s ease;
}

@keyframes underlineExpand {
  from {
    width: 0;
  }
  to {
    width: 12px;
  }
}

.selection-row { position: relative; display: flex; align-items: center; gap: 10px; min-height: 48px; padding: 0 16px 8px; }
.all-tab { display: none; }
.all-tab text { font-size: 15px; }
.status-slot { display: flex; align-items: center; justify-content: center; flex: 0 0 auto; min-width: 66px; height: 34px; padding: 0 10px; gap: 6px; color: #15803d; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 17px; }
.status-slot text { font-size: 12px; line-height: 1; font-weight: 700; color: #15803d; white-space: nowrap; }
.status-dot { width: 7px; height: 7px; flex: 0 0 7px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 0 3px rgba(34,197,94,.12); }
.selected-place { display: flex; align-items: center; min-width: 0; flex: 1; height: 44px; padding: 0 8px 0 14px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 22px; color: #9a3412; }
.category-tabs-wrap.expanded .selected-place {
  position: absolute;
  top: -58px;
  left: 128px;
  right: 16px;
  z-index: 5;
  box-sizing: border-box;
}
.pin-dot { position: relative; flex: 0 0 14px; width: 14px; height: 14px; margin-right: 9px; border: 4px solid #ea580c; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-sizing: border-box; }
.selected-place-text { min-width: 0; flex: 1; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-size: 14px; font-weight: 600; color: #9a3412; }
.close-icon { position: relative; flex: 0 0 36px; width: 36px; height: 36px; margin-left: 4px; border-radius: 18px; background: rgba(234,88,12,.08); }
.close-icon::before,.close-icon::after { content: ''; position: absolute; left: 11px; top: 17px; width: 14px; height: 2px; border-radius: 2px; background: #c2410c; }
.close-icon::before { transform: rotate(45deg); }
.close-icon::after { transform: rotate(-45deg); }
.close-icon:active { background: rgba(234,88,12,.16); }
.category-action { position: absolute; top: 0; right: 14px; z-index: 3; display: flex; align-items: center; justify-content: center; gap: 4px; width: 62px; height: 44px; border: 2px solid rgba(255,255,255,.92); border-radius: 14px; background: linear-gradient(135deg,#ff7a45 0%,#f97316 48%,#ea580c 100%); box-shadow: 0 6px 16px rgba(234,88,12,.28), 0 0 0 1px rgba(234,88,12,.08); transition: transform 160ms ease, box-shadow 160ms ease; }
.category-action:active { transform: scale(.94); box-shadow: 0 3px 10px rgba(234,88,12,.22); }
.action-place-icon { position: relative; flex: 0 0 16px; width: 16px; height: 18px; }
.action-place-icon::before { content: ''; position: absolute; left: 2px; top: 0; width: 12px; height: 12px; border: 1.8px solid #fff; border-radius: 50% 50% 50% 0; box-sizing: border-box; transform: rotate(-45deg); }
.action-place-icon view { position: absolute; left: 6px; top: 4px; width: 4px; height: 4px; border: 1.4px solid #fff; border-radius: 50%; box-sizing: border-box; }
.action-label { color: #fff; font-size: 11px; font-weight: 700; line-height: 1; }
</style>

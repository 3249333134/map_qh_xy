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
      <view class="search-input-wrapper" :class="{ collapsed: isCollapsed }" :style="isCollapsed ? collapsedSearchStyle : {}" @tap.stop="onSearchTap">
        <text class="search-icon">🔍</text>
        <input 
          class="search-input" 
          placeholder="搜索" 
          confirm-type="search"
          @input="onSearchInput"
          @focus="onSearchFocus"
        />
      </view>
      <view 
        v-if="isCollapsed" 
        class="search-action-fixed" 
        :class="{ expanded: categoryActionExpanded }"
        :style="categoryActionExpanded ? { left: (collapsedSearchWidth + collapsedGap) + 'px', right: '0px', width: 'auto' } : {}"
        catchtouchmove="true"
        @tap.stop="onRightActionTap"
        @touchstart="onDragStart"
        @touchmove.stop.prevent="onDrag"
        @touchend="onDragEnd"
        @touchcancel="onDragEnd"
      >
        <text v-if="categoryActionExpanded && selectedPoint" class="category-action-text">{{ (selectedPoint.point && selectedPoint.point.name) || '' }}</text>
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
    selectedPoint: { type: Object, default: null }
  },
  emits: ['drag-start','drag','drag-end','search-input','search-focus','search-tap','right-action-tap'],
  methods: {
    onDragStart(e) { this.$emit('drag-start', e) },
    onDrag(e) { this.$emit('drag', e) },
    onDragEnd(e) { this.$emit('drag-end', e) },
    onSearchInput(e) { this.$emit('search-input', e) },
    onSearchFocus(e) { this.$emit('search-focus', e) },
    onSearchTap() { this.$emit('search-tap') },
    onRightActionTap() { this.$emit('right-action-tap') }
  }
}
</script>

<style scoped>
.drag-area { padding: 6px 15px; }
.drag-handle { display: flex; justify-content: center; padding: 2px 0; }
.drag-indicator { width: 40px; height: 5px; background-color: #ddd; border-radius: 3px; }
.search-box { margin-top: 2px; position: relative; }
.search-input-wrapper { display: flex; align-items: center; background-color: #fff; border-radius: 17px; padding: 0 15px; height: 34px; }
.search-input-wrapper.collapsed { width: calc(100% - 56px); margin: 0; }
.search-icon { margin-right: 10px; font-size: 16px; color: #999; }
.search-input { flex: 1; height: 34px; font-size: 14px; }
.search-action-fixed { position: absolute; right: 0; top: 50%; transform: translateY(-50%); width: 48px; height: 34px; border-radius: 10px; background: radial-gradient(circle at 50% 40%, #ff8a3d 0%, #ff6b35 60%, #ff4757 100%); border: 2px solid #ffffff; box-shadow: 0 4px 12px rgba(255, 71, 87, 0.25), 0 2px 8px rgba(255, 107, 53, 0.2); box-sizing: border-box; transition: left 200ms ease, right 200ms ease, width 200ms ease; display: flex; align-items: center; justify-content: center; }
.search-action-fixed.expanded { left: 0; right: 0; width: auto; }
.category-action-text { max-width: 100%; color: #fff; font-size: 14px; font-weight: 600; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; padding: 0 12px; }
</style>

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
        catchtouchmove="true"
        @tap.stop="onRightActionTap"
        @touchstart="onDragStart"
        @touchmove.stop.prevent="onDrag"
        @touchend="onDragEnd"
        @touchcancel="onDragEnd"
      />
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
    expandedLeft: { type: Number, default: 0 }
  },
  emits: ['drag-start','drag','drag-end','search-input','search-focus','search-tap','right-action-tap'],
  methods: {
    onDragStart(e) { this.$emit('drag-start', e) },
    onDrag(e) { this.$emit('drag', e) },
    onDragEnd(e) { this.$emit('drag-end', e) },
    onSearchInput(e) { this.$emit('search-input', e) },
    onSearchFocus(e) { this.$emit('search-focus', e) },
    onSearchTap() { this.$emit('search-tap') },
    onRightActionTap() { this.$emit('right-action-tap') },
    onCloseTap() { this.$emit('right-action-tap') }
  }
}
</script>

<style scoped>
.drag-area { padding: 6px 16px 4px; }
.drag-handle { display: flex; justify-content: center; padding: 4px 0; }
.drag-indicator { width: 32px; height: 3px; background-color: rgba(180, 180, 180, 0.35); border-radius: 2px; }
.search-box { margin-top: 2px; position: relative; }
.search-input-wrapper { display: flex; align-items: center; background: transparent; border-bottom: 1px solid rgba(0, 0, 0, 0.06); border-radius: 0; padding: 0 4px; height: 30px; }
.search-input-wrapper.collapsed { width: calc(100% - 48px); margin: 0; }
.search-icon { margin-right: 6px; font-size: 13px; color: #bbb; }
.search-input { flex: 1; height: 30px; font-size: 13px; background: transparent; }
.search-input::placeholder { color: #ccc; font-size: 13px; }
.search-action-fixed { position: absolute; right: 0; top: 50%; transform: translateY(-50%); width: 40px; height: 28px; border-radius: 14px; background: #ff8a65; border: none; box-shadow: 0 2px 6px rgba(255, 138, 101, 0.25); box-sizing: border-box; transition: left 200ms ease, right 200ms ease, width 200ms ease; display: flex; align-items: center; justify-content: center; }
.search-action-fixed.expanded { left: 0; right: 0; width: auto; border-radius: 14px; }
.category-action-text { max-width: 100%; color: #fff; font-size: 13px; font-weight: 500; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; padding: 0 12px; }
.category-action-close { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); color: rgba(255, 255, 255, 0.8); font-size: 13px; line-height: 1; }
</style>

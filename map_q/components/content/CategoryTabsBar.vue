<template>
  <view class="category-tabs-wrap" :class="{ expanded: categoryActionExpanded }" catchtouchmove="true" @touchstart="onDragStart" @touchmove.stop.prevent="onDrag" @touchend="onDragEnd" @touchcancel="onDragEnd">
    <scroll-view class="category-tabs" scroll-x show-scrollbar="false">
      <view 
        v-for="category in categories" 
        :key="category.id"
        :class="['category-tab', { active: category.id === activeCategory }]"
        @tap="onCategoryChange(category.id)"
      >
        {{ category.name }}
      </view>
      <view class="category-tabs-spacer"></view>
    </scroll-view>
    <view 
      class="category-action-fixed" 
      catchtouchmove="true"
      @tap.stop="onRightActionTap"
      @touchstart="onDragStart"
      @touchmove.stop.prevent="onDrag"
      @touchend="onDragEnd"
      @touchcancel="onDragEnd"
      :style="categoryActionExpanded ? { left: (localExpandedLeft || expandedLeft) + 'px', right: '15px' } : {}"
    >
      <text v-if="categoryActionExpanded && selectedPoint" class="category-action-text">{{ (selectedPoint.point && selectedPoint.point.name) || '' }}</text>
      <text v-if="categoryActionExpanded" class="category-action-close" @tap.stop="onCloseTap">❌</text>
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
    selectedPoint: { type: Object, default: null }
  },
  emits: ['drag-start','drag','drag-end','category-change','right-action-tap'],
  data() {
    return {
      localExpandedLeft: 0
    }
  },
  watch: {
    categoryActionExpanded(val) {
      if (val) {
        this.$nextTick(() => { this.updateExpandedLeft() })
      }
    },
    categories() {
      if (this.categoryActionExpanded) {
        this.$nextTick(() => { this.updateExpandedLeft() })
      }
    }
  },
  methods: {
    onDragStart(e) { this.$emit('drag-start', e) },
    onDrag(e) { this.$emit('drag', e) },
    onDragEnd(e) { this.$emit('drag-end', e) },
    onCategoryChange(id) { this.$emit('category-change', id) },
    onRightActionTap() { this.$emit('right-action-tap') },
    onCloseTap() { this.$emit('right-action-tap') },
    updateExpandedLeft() {
      try {
        const q = uni.createSelectorQuery().in(this)
        q.select('.category-tabs-wrap').boundingClientRect()
        q.select('.category-tabs .category-tab').boundingClientRect()
        q.exec(res => {
          const wrapRect = res && res[0]
          const firstTabRect = res && res[1]
          if (wrapRect && firstTabRect) {
            const baseGap = 4
            const marginRight = 10
            const left = Math.max(0, (firstTabRect.right - wrapRect.left) + marginRight + baseGap)
            this.localExpandedLeft = left
          }
        })
      } catch (e) {
        this.localExpandedLeft = Math.max(0, this.expandedLeft || 90)
      }
    }
  }
}
</script>

<style scoped>
.category-tabs { display: flex; flex-wrap: nowrap; white-space: nowrap; padding: 2px 9px; align-items: center; border-bottom: 1px solid #eee; }
.category-tabs-wrap { position: relative; margin-top: -10px; }
.category-tabs-wrap.expanded .category-tabs .category-tab:not(:first-child) { opacity: 0; pointer-events: none; }
.category-action-fixed { position: absolute; right: 15px; top: calc(50% + 6px); transform: translateY(-50%); width: 48px; height: 34px; border-radius: 10px; background: radial-gradient(circle at 50% 40%, #ff8a3d 0%, #ff6b35 60%, #ff4757 100%); border: 2px solid #ffffff; box-shadow: 0 4px 12px rgba(255, 71, 87, 0.25), 0 2px 8px rgba(255, 107, 53, 0.2); box-sizing: border-box; z-index: 2; display: flex; align-items: center; justify-content: center; transition: left 200ms ease, right 200ms ease, width 200ms ease; }
.category-tabs-wrap.expanded .category-action-fixed { width: auto; }
.category-tabs-spacer { display: inline-block; width: 52px; height: 34px; }
.category-tab { display: inline-flex; align-items: center; height: 34px; padding: 0 15px; margin-right: 10px; font-size: 14px; border-radius: 17px; background-color: #f0f0f0; color: #666; }
.category-tab.active { background-color: #2196F3; color: #fff; }
.category-action-text { max-width: 100%; color: #fff; font-size: 14px; font-weight: 600; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; padding: 0 12px; }
.category-action-close { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); color: #fff; font-size: 16px; line-height: 1; }
</style>

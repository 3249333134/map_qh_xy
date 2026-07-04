<template>
  <view class="category-tabs-wrap" :class="{ expanded: categoryActionExpanded }" catchtouchmove="true" @touchstart="onDragStart" @touchmove.stop.prevent="onDrag" @touchend="onDragEnd" @touchcancel="onDragEnd">
    <scroll-view class="category-tabs" scroll-x show-scrollbar="false">
      <view 
        v-for="category in categories" 
        :key="category.id"
        :class="['category-tab', { active: category.id === activeCategory }]"
        @tap="onCategoryChange(category.id)"
      >
        <text class="tab-text">{{ category.name }}</text>
        <view class="tab-underline" v-if="category.id === activeCategory"></view>
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
      <text v-if="!categoryActionExpanded" class="category-action-icon">📍</text>
      <text v-if="categoryActionExpanded && selectedPoint" class="category-action-text">{{ (selectedPoint.point && selectedPoint.point.name) || '' }}</text>
      <text v-if="categoryActionExpanded" class="category-action-close" @tap.stop="onCloseTap">✕</text>
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
.category-tabs-wrap { 
  position: relative; 
  margin-top: -10px; 
  background: transparent;
}

.category-tabs { 
  display: flex; 
  flex-wrap: nowrap; 
  white-space: nowrap; 
  padding: 4px 16px; 
  align-items: center; 
  scroll-behavior: smooth;
}

.category-tabs-wrap.expanded .category-tabs .category-tab:not(:first-child) { 
  opacity: 0; 
  pointer-events: none; 
}

.category-action-fixed { 
  position: absolute; 
  right: 15px; 
  top: calc(50% + 4px); 
  transform: translateY(-50%); 
  width: 36px; 
  height: 36px; 
  border-radius: 50%; 
  background: linear-gradient(135deg, #ff8a65 0%, #ff7043 100%); 
  border: 2px solid #fff; 
  box-shadow: 0 2px 10px rgba(255, 138, 101, 0.4); 
  box-sizing: border-box; 
  z-index: 2; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  transition: left 200ms ease, right 200ms ease, width 200ms ease, height 200ms ease, border-radius 200ms ease; 
}

.category-tabs-wrap.expanded .category-action-fixed { 
  width: auto; 
  height: 32px; 
  border-radius: 16px;
  border: none;
  box-shadow: 0 2px 8px rgba(255, 138, 101, 0.3);
}

.category-tabs-spacer { 
  display: inline-block; 
  width: 48px; 
  height: 32px; 
}

.category-tab { 
  display: inline-flex; 
  flex-direction: column; 
  align-items: center; 
  height: 40px; 
  padding: 0 16px; 
  font-size: 14px; 
  background-color: transparent; 
  color: #bbb; 
  position: relative;
  transition: all 0.2s ease;
  cursor: pointer;
}

.category-tab:active {
  opacity: 0.7;
}

.category-tab.active { 
  color: #212121;
  font-weight: 600;
}

.tab-text {
  font-size: 14px;
  line-height: 36px;
  transition: all 0.2s ease;
}

.tab-underline {
  position: absolute;
  bottom: 4px;
  width: 20px;
  height: 2px;
  background: #ff8a65;
  border-radius: 1px;
  animation: underlineExpand 0.25s ease;
}

@keyframes underlineExpand {
  from {
    width: 0;
  }
  to {
    width: 36rpx;
  }
}

.category-action-text { 
  max-width: 100%; 
  color: #fff; 
  font-size: 13px; 
  font-weight: 500; 
  overflow: hidden; 
  white-space: nowrap; 
  text-overflow: ellipsis; 
  padding: 0 14px; 
}

.category-action-icon {
  font-size: 14px;
  color: #fff;
}

.category-action-close { 
  position: absolute; 
  right: 10px; 
  top: 50%; 
  transform: translateY(-50%); 
  color: rgba(255, 255, 255, 0.8); 
  font-size: 13px; 
  line-height: 1; 
}
</style>

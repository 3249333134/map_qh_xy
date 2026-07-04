<template>
  <view 
    class="hotspot-card" 
    :class="{ highlighted: isHighlighted, dragging: isActuallyDragging }"
    :style="cardStyle"
    @tap="onTap"
    @longpress="onLongPress"
    @touchstart="onTouchStart"
    @touchmove.stop.prevent="onTouchMove"
    @touchend="onTouchEnd"
    @touchcancel="onTouchEnd"
  >
    <view class="card-cover">
      <image v-if="coverImage" class="cover-img" :src="coverImage" mode="aspectFill" />
      <view v-else class="cover-placeholder" :class="typeClass">
        <text class="placeholder-icon">{{ typeIcon }}</text>
      </view>
      <view class="badge" v-if="count > 1">
        <text class="badge-text">{{ count }}</text>
      </view>
    </view>
    <view class="card-info">
      <text class="card-title">{{ title }}</text>
      <text class="card-subtitle">{{ subtitle }}</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'HotspotCard',
  props: {
    item: {
      type: Object,
      required: true
    },
    isHighlighted: {
      type: Boolean,
      default: false
    },
    isDragging: {
      type: Boolean,
      default: false
    },
    scale: {
      type: Number,
      default: 1
    },
    left: {
      type: Number,
      default: 0
    },
    top: {
      type: Number,
      default: 0
    }
  },
  emits: ['tap', 'long-press', 'drag-start', 'drag-move', 'drag-end'],
  data() {
    return {
      internalDragging: false,
      startX: 0,
      startY: 0,
      hasMoved: false
    }
  },
  computed: {
    title() {
      return this.item.name || this.item.title || '未命名'
    },
    subtitle() {
      return this.item.author || this.item.address || '点击查看'
    },
    coverImage() {
      return this.item.cover || this.item.image || ''
    },
    count() {
      return this.item.count || 1
    },
    typeClass() {
      const type = this.item.type || 'normal'
      return `type-${type}`
    },
    typeIcon() {
      const iconMap = {
        normal: '📍',
        video: '▶',
        article: '📄',
        place: '🏪',
        event: '🎉',
        service: '🛎',
        track: '🧭'
      }
      return iconMap[this.item.type] || '📍'
    },
    cardStyle() {
      const baseWidth = 140
      const baseHeight = 180
      const s = this.scale
      return {
        width: `${baseWidth * s}rpx`,
        height: `${baseHeight * s}rpx`,
        left: `${this.left}px`,
        top: `${this.top}px`
      }
    },
    isActuallyDragging() {
      return this.isDragging || this.internalDragging
    }
  },
  methods: {
    onTap() {
      if (this.hasMoved) return
      this.$emit('tap', this.item)
    },
    onLongPress() {
      this.internalDragging = true
      this.$emit('long-press', this.item)
    },
    onTouchStart(e) {
      const touch = e.touches && e.touches[0]
      if (!touch) return
      this.startX = touch.clientX
      this.startY = touch.clientY
      this.hasMoved = false
      if (this.internalDragging || this.isDragging) {
        this.$emit('drag-start', { item: this.item, event: e })
      }
    },
    onTouchMove(e) {
      const touch = e.touches && e.touches[0]
      if (!touch) return
      const dx = Math.abs(touch.clientX - this.startX)
      const dy = Math.abs(touch.clientY - this.startY)
      if (dx > 5 || dy > 5) {
        this.hasMoved = true
      }
      if (this.internalDragging || this.isDragging) {
        this.$emit('drag-move', { item: this.item, event: e })
      }
    },
    onTouchEnd(e) {
      if (this.internalDragging) {
        this.$emit('drag-end', { item: this.item, event: e })
        this.internalDragging = false
      }
      setTimeout(() => {
        this.hasMoved = false
      }, 100)
    }
  }
}
</script>

<style scoped>
.hotspot-card {
  position: absolute;
  width: 140rpx;
  height: 180rpx;
  background: #fff;
  border-radius: 12rpx;
  overflow: hidden;
  border: 2rpx solid #ff8a65;
  z-index: 10;
}

.hotspot-card.highlighted {
  border-color: #ff8a65;
}

.card-cover {
  position: relative;
  width: 100%;
  height: 60%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-img {
  width: 100%;
  height: 100%;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e8e8e8;
}

.cover-placeholder.type-video {
  background: #333;
}

.placeholder-icon {
  font-size: 32rpx;
}

.badge {
  position: absolute;
  top: 6rpx;
  right: 6rpx;
  min-width: 28rpx;
  height: 28rpx;
  padding: 0 8rpx;
  background: #ff4757;
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.badge-text {
  font-size: 18rpx;
  color: #fff;
}

.card-info {
  padding: 6rpx 8rpx;
  height: 40%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.card-title {
  font-size: 20rpx;
  color: #000;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-subtitle {
  font-size: 16rpx;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

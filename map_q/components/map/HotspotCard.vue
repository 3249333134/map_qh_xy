<template>
  <view 
    class="hotspot-card"
    :class="{ 'hotspot-card-highlight': isHighlighted, 'hotspot-card-hidden': isHidden }"
    :style="cardStyle"
    @tap="onCardTap"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @touchcancel="onTouchEnd"
  >
    <view class="hotspot-cover">
      <image 
        v-if="coverImage" 
        class="cover-image" 
        :src="coverImage" 
        mode="aspectFill"
        @error="onImageError"
      />
      <view v-else class="cover-placeholder" :class="'cover-' + type">
        <text class="placeholder-icon">{{ typeIcon }}</text>
      </view>
      <view v-if="contentCount > 0" class="hotspot-badge">{{ contentCount }}</view>
      <view v-if="statusLabel" class="hotspot-status">{{ statusLabel }}</view>
    </view>
    <view class="hotspot-info">
      <text class="hotspot-title">{{ title }}</text>
      <text class="hotspot-author">{{ author }}</text>
    </view>
    <view v-if="isDragging" class="hotspot-drag-line"></view>
  </view>
</template>

<script>
export default {
  name: 'MapHotspotCard',
  props: {
    id: { type: String, required: true },
    title: { type: String, default: '' },
    author: { type: String, default: '' },
    type: { type: String, default: 'normal' },
    coverImage: { type: String, default: '' },
    contentCount: { type: Number, default: 0 },
    statusLabel: { type: String, default: '' },
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    width: { type: Number, default: 140 },
    height: { type: Number, default: 180 },
    isHighlighted: { type: Boolean, default: false },
    isHidden: { type: Boolean, default: false },
    scale: { type: Number, default: 16 }
  },
  data() {
    return {
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      longPressTimer: null,
      hasMoved: false
    }
  },
  computed: {
    typeIcon() {
      const icons = {
        normal: '📸',
        video: '🎬',
        article: '📝',
        place: '📍',
        event: '🎉',
        service: '💼',
        track: '🚶'
      }
      return icons[this.type] || '📌'
    },
    cardStyle() {
      const scaleFactor = this.scale < 14 ? 0.8 : this.scale > 18 ? 1.1 : 1
      const finalWidth = this.width * scaleFactor
      const finalHeight = this.height * scaleFactor
      
      return {
        left: this.currentX + 'px',
        top: this.currentY + 'px',
        width: finalWidth + 'rpx',
        height: finalHeight + 'rpx',
        transform: this.isDragging ? 'scale(1.1)' : 'scale(1)'
      }
    }
  },
  watch: {
    x(newVal) {
      if (!this.isDragging) {
        this.currentX = newVal
        this.startX = newVal
      }
    },
    y(newVal) {
      if (!this.isDragging) {
        this.currentY = newVal
        this.startY = newVal
      }
    }
  },
  mounted() {
    this.currentX = this.x
    this.currentY = this.y
    this.startX = this.x
    this.startY = this.y
  },
  methods: {
    onTouchStart(e) {
      this.hasMoved = false
      const touch = e.touches[0]
      this.dragStartX = touch.clientX
      this.dragStartY = touch.clientY
      
      this.longPressTimer = setTimeout(() => {
        if (!this.hasMoved) {
          this.isDragging = true
          uni.vibrateShort({ type: 'light' })
        }
      }, 500)
    },
    onTouchMove(e) {
      const touch = e.touches[0]
      const deltaX = touch.clientX - this.dragStartX
      const deltaY = touch.clientY - this.dragStartY
      
      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        this.hasMoved = true
        if (this.longPressTimer) {
          clearTimeout(this.longPressTimer)
          this.longPressTimer = null
        }
      }
      
      if (this.isDragging) {
        this.currentX = this.startX + deltaX
        this.currentY = this.startY + deltaY
      }
    },
    onTouchEnd(e) {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer)
        this.longPressTimer = null
      }
      
      if (this.isDragging) {
        this.isDragging = false
        this.startX = this.currentX
        this.startY = this.currentY
        
        this.$emit('drag-end', {
          id: this.id,
          x: this.currentX,
          y: this.currentY
        })
      }
    },
    onCardTap() {
      if (!this.isDragging && !this.hasMoved) {
        this.$emit('card-tap', { id: this.id, type: this.type })
      }
    },
    onImageError() {
      this.$emit('image-error', this.id)
    }
  }
}
</script>

<style scoped>
.hotspot-card {
  position: absolute;
  background: #ffffff;
  border-radius: 12rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  overflow: hidden;
  z-index: 50;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hotspot-card-highlight {
  box-shadow: 0 6rpx 20rpx rgba(255, 138, 101, 0.3);
  border: 2rpx solid #ff8a65;
}

.hotspot-card-hidden {
  opacity: 0;
  pointer-events: none;
}

.hotspot-cover {
  position: relative;
  width: 100%;
  padding-bottom: 60%;
}

.cover-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.cover-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-normal {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.cover-video {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

.cover-article {
  background: linear-gradient(135deg, #f8f8f8 0%, #e8e8e8 100%);
}

.cover-place, .cover-service {
  background: 
    linear-gradient(90deg, rgba(150, 150, 150, 0.08) 1rpx, transparent 1rpx),
    linear-gradient(rgba(150, 150, 150, 0.06) 1rpx, transparent 1rpx);
  background-size: 20rpx 20rpx;
  background-color: #f0f9f4;
}

.cover-event {
  background: linear-gradient(135deg, #fff0f3 0%, #ffdee9 100%);
}

.cover-track {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
}

.placeholder-icon {
  font-size: 32rpx;
}

.hotspot-badge {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  width: 28rpx;
  height: 28rpx;
  background: #ff2442;
  border-radius: 50%;
  color: #fff;
  font-size: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.hotspot-status {
  position: absolute;
  bottom: 8rpx;
  left: 8rpx;
  padding: 4rpx 10rpx;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 6rpx;
  color: #fff;
  font-size: 16rpx;
}

.hotspot-info {
  padding: 8rpx 10rpx;
}

.hotspot-title {
  display: block;
  font-size: 14rpx;
  color: #000;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hotspot-author {
  display: block;
  font-size: 12rpx;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 4rpx;
}

.hotspot-drag-line {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40rpx;
  height: 4rpx;
  background: #ccc;
  border-radius: 2rpx;
}
</style>
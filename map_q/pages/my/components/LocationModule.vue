<template>
  <view class="location-module">
    <view class="map-section">
      <!-- 只在页面就绪后渲染地图 -->
      <map
        v-if="isMapReady"
        :class="isFullyExpanded ? 'user-map-full-expanded' : 'user-map-optimized'"
        :latitude="mapCenter.latitude"
        :longitude="mapCenter.longitude"
        :scale="mapCenter.scale"
        :markers="mapMarkers"
        @markertap="handleMarkerTap"
        @callouttap="handleCalloutTap"
        @regionchange="handleRegionChange"
        @tap="handleMapTap"
        @touchstart="onMapTouchStart"
        @touchmove="onMapTouchMove"
        @touchend="onMapTouchEnd"
        show-location
        enable-zoom
        enable-scroll
        enable-rotate
        enable-3D
        :include-points="userLocations"
        :include-padding="includePadding"
      >
        <!-- 悬浮缩小卡片：基于 cover-view 锚定到每个标记点 -->
        <cover-view
          v-for="m in mapMarkers"
          :key="m.id"
          class="card card-floating"
          :marker-id="m.id"
          slot="callout"
          :style="cardScaleStyle"
        >
          <cover-view class="card-media" @touchstart="onCardTouchStart" @touchmove="onCardTouchMove" @touchend="onCardTouchEnd" @tap.stop="handleMediaTap(m)">
            <cover-image v-if="m.cover" class="card-media-img" :src="m.cover" />
            <cover-view v-else class="card-media-placeholder"></cover-view>
          </cover-view>
          <cover-view class="card-content">
            <cover-view class="card-title">{{ m.title }}</cover-view>
            <cover-view v-if="m.subtitle" class="card-author">{{ m.subtitle }}</cover-view>
            <cover-view class="card-footer">
              <cover-view class="card-location">{{ m.coords }}</cover-view>
              <cover-view v-if="m.likes !== undefined" class="card-stats">{{ m.likes }} 赞</cover-view>
            </cover-view>
            <!-- 服务卡片：保留右下角“预” -->
            <cover-view v-if="m.type === 'service'" class="cta-float">
              <cover-view class="reserve-big">预</cover-view>
            </cover-view>
          </cover-view>
        </cover-view>
      </map>
      
      <!-- 加载状态 -->
      <view v-else class="map-loading">
        <text>地图加载中...</text>
      </view>
      
      <!-- 移除信息栏，将其移到父组件 -->
    </view>
  </view>
</template>

<script>
export default {
  name: 'LocationModule',
  props: {
    userLocations: {
      type: Array,
      default: () => []
    },
    isFullyExpanded: {
      type: Boolean,
      default: false
    },
    scaleFactor: {
      type: Number,
      default: 0.6667 // 将卡片缩放到当前大小的 1/3（原始尺寸的 2/3）
    }
  },
  data() {
    return {
      isMapReady: false,
      includePadding: { left: 20, right: 20, top: 20, bottom: 0 },
      hasTappedOnce: false,
      _initDone: false,
      // 点击判定阈值（像素与毫秒）
      _tapThresholdPx: 12,
      _tapThresholdMs: 200,
      _touchStart: null,
      _mapDragging: false,
      // 新增：卡片拖动判定相关状态
      _cardDragging: false,
      _lastCardDragAt: 0,
      _dragThresholdPx: 14,
      _cardTouchStart: null,
      // 新增：拖动后的冷却时间窗口，避免拖动结束瞬时触发 tap
      _cardMoved: false,
      _lastDragAt: 0,
      _recentDragWindowMs: 200,
      // 严格点击资格判定（由 touchend 判定）
      _cardTapEligible: false,
      _lastCardTouchEnd: 0,
      // 新增：地图点击资格判定（由 map touchend 判定）
      _mapTapEligible: false,
      _lastMapTouchEnd: 0,
    }
  },
  
  mounted() {
    // 延迟初始化地图，避免过早调用
    this.$nextTick(() => {
      // 仅首次挂载初始化一次
      if (!this._initDone) {
        setTimeout(() => {
          this.isMapReady = true
          this._initDone = true
        }, 200)
      }
    })
  },
  
  computed: {
    // 添加mapCenter计算属性
    mapCenter() {
      if (this.userLocations && this.userLocations.length > 0) {
        const totalLat = this.userLocations.reduce((sum, loc) => sum + loc.latitude, 0)
        const totalLng = this.userLocations.reduce((sum, loc) => sum + loc.longitude, 0)
        return {
          latitude: totalLat / this.userLocations.length,
          longitude: totalLng / this.userLocations.length,
          scale: this.userLocations.length > 3 ? 8 : 12  // 根据地点数量调整缩放级别
        }
      }
      return {
        latitude: 39.9042,
        longitude: 116.4074,
        scale: 10
      }
    },
    
    mapMarkers() {
      return this.userLocations.map((location, index) => ({
        id: index,
        latitude: location.latitude,
        longitude: location.longitude,
        title: location.title,
        subtitle: location.subtitle || '',
        likes: typeof location.likes === 'number' ? location.likes : (parseInt(location.likes, 10) || undefined),
        cover: location.cover || '',
        coords: `${(location.latitude ?? 0).toFixed(2)}, ${(location.longitude ?? 0).toFixed(2)}`,
        // 新增：透传类型，便于区分服务与内容
        type: location.type || 'content',
        iconPath: '/static/marker.png',
        width: 20,
        height: 20,
        callout: {
          content: location.title,
          color: '#333',
          fontSize: 14,
          borderRadius: 8,
          bgColor: '#fff',
          padding: 8,
          display: 'BYCLICK'
        },
        customCallout: {
          display: 'ALWAYS',
          anchorX: 0,
          anchorY: -Math.round(12 * this.scaleFactor) // 调整更贴近标记：减少垂直偏移，让卡片更靠近标记（随缩放）
        }
      }))
    },
    cardScaleStyle() {
      return `transform: scale(${this.scaleFactor}); transform-origin: bottom center;`;
    }
  },
  methods: {
    handleCardTap(id) {
      this.$emit('marker-tap', id)
      this.hasTappedOnce = true
    },
    onMapTouchStart(e) {
      const t = e?.touches?.[0]
      if (!t) return
      this._touchStart = { x: t.pageX, y: t.pageY, time: Date.now() }
      this._mapDragging = false
      // 地图点击资格在新的触摸开始时复位
      this._mapTapEligible = false
    },
    onMapTouchMove(e) {
      const t = e?.touches?.[0]
      if (!t || !this._touchStart) return
      const dx = Math.abs(t.pageX - this._touchStart.x)
      const dy = Math.abs(t.pageY - this._touchStart.y)
      if (dx > this._tapThresholdPx || dy > this._tapThresholdPx) {
        this._mapDragging = true
      }
    },
    onMapTouchEnd(e) {
      const now = Date.now()
      const t = (e && (e.changedTouches && e.changedTouches[0])) || (e && (e.touches && e.touches[0]))
      if (this._touchStart && t) {
        const dx = Math.abs((t.pageX || t.clientX || 0) - this._touchStart.x)
        const dy = Math.abs((t.pageY || t.clientY || 0) - this._touchStart.y)
        const duration = now - this._touchStart.time
        if (dx > this._tapThresholdPx || dy > this._tapThresholdPx) {
          // 拖动结束：记录拖动时间窗口并拒绝点击资格
          this._lastDragAt = now
          this._mapTapEligible = false
        } else if (duration <= this._tapThresholdMs && (now - this._lastDragAt) >= this._recentDragWindowMs) {
          // 未拖动且在点击时间阈值内：授予点击资格
          this._mapTapEligible = true
          this._lastMapTouchEnd = now
        } else {
          this._mapTapEligible = false
        }
      } else {
        this._mapTapEligible = false
      }
      this._touchStart = null
      // 结束后复位拖动状态
      this._mapDragging = false
    },
    onCardTouchStart(e) {
      const t = (e && (e.touches && e.touches[0])) || (e && (e.changedTouches && e.changedTouches[0]))
      if (!t) return
      const x = t.pageX || t.clientX || 0
      const y = t.pageY || t.clientY || 0
      this._cardTouchStart = { x, y, time: Date.now() }
      this._cardDragging = false
      this._cardMoved = false
     },
    onCardTouchMove(e) {
      const t = (e && (e.touches && e.touches[0])) || (e && (e.changedTouches && e.changedTouches[0]))
      if (!t || !this._cardTouchStart) return
      const x = t.pageX || t.clientX || 0
      const y = t.pageY || t.clientY || 0
      const dx = x - this._cardTouchStart.x
      const dy = y - this._cardTouchStart.y
      this._cardMoved = true
      if (Math.abs(dx) > this._dragThresholdPx || Math.abs(dy) > this._dragThresholdPx) {
        this._cardDragging = true
      }
    },
    onCardTouchEnd() {
      const now = Date.now()
      if (this._cardMoved || this._cardDragging) {
        this._lastDragAt = now
        this._cardTapEligible = false
      } else {
        const startTime = (this._cardTouchStart && this._cardTouchStart.time) || now
        const duration = now - startTime
        // 未拖动且在点击时间阈值内，且不在拖动冷却窗口内，才允许后续 tap
        if (duration <= this._tapThresholdMs && (now - this._lastDragAt) >= this._recentDragWindowMs && !this._mapDragging) {
          this._cardTapEligible = true
          this._lastCardTouchEnd = now
        } else {
          this._cardTapEligible = false
        }
      }
      this._cardTouchStart = null
      this._cardDragging = false
    },
    handleMediaTap(m) {
      const now = Date.now()
      // 仅在 touchend 判定为有效点击资格的情况下，tap 才允许继续
      if (!this._cardTapEligible || (now - this._lastCardTouchEnd) > 300) {
        return
      }
      // 若当前处于地图拖动或卡片拖动状态，则不执行跳转，并复位标记
      if (this._mapDragging || this._cardDragging) {
        this._mapDragging = false
        this._cardDragging = false
        return
      }
      // 消费点击资格，避免重复触发
      this._cardTapEligible = false
      try {
        const item = m || {}
        if (item.type === 'service') {
          uni.setStorageSync('LAST_SERVICE_ITEM', item)
          uni.navigateTo({ url: '/pages/service/detail/index' })
        } else {
          uni.navigateTo({ url: '/pages/detail/index' })
        }
      } catch (e) {
        console.warn('跳转失败', e)
      }
    },
    handleCalloutTap(e) {
      // 地图点击：优先依据地图点击资格；若无资格但满足“不在拖拽且不在冷却窗口”，也允许跳转
      const now = Date.now()
      if (this._mapDragging) {
        this._mapDragging = false
        return
      }
      const hasRecentDrag = (now - this._lastDragAt) < this._recentDragWindowMs
      const eligible = this._mapTapEligible && (now - this._lastMapTouchEnd) <= 300
      if (!eligible) {
        if (hasRecentDrag) return
        // 若不在冷却窗口且未拖拽，则视为明确点击
      }
      // 消费地图点击资格
      this._mapTapEligible = false
      try {
        const markerIdRaw = e?.detail?.markerId ?? e?.markerId
        const markerId = typeof markerIdRaw === 'string' ? parseInt(markerIdRaw, 10) : markerIdRaw
        const m = this.mapMarkers.find(mm => mm.id === markerId)
        if (!m) return
        if (m.type === 'service') {
          uni.setStorageSync('LAST_SERVICE_ITEM', m)
          uni.navigateTo({ url: '/pages/service/detail/index' })
        } else {
          uni.navigateTo({ url: '/pages/detail/index' })
        }
      } catch (err) {
        console.warn('callout 跳转失败', err)
      }
    },
    handleMarkerTap(e) {
      const id = e?.detail?.markerId ?? e?.markerId ?? e?.detail?.id ?? e?.id
      this.$emit('marker-tap', id)
    },
    handleRegionChange(e) {
      try {
        const type = e?.type || e?.detail?.type
        const causedBy = e?.causedBy || e?.detail?.causedBy
        const isDragOrGesture = causedBy === 'drag' || causedBy === 'gesture'
        const isScale = causedBy === 'scale'
        if (type === 'begin' && (isDragOrGesture || isScale)) {
          this._mapDragging = true
          this._mapTapEligible = false
        }
        if (type === 'end' && (isDragOrGesture || isScale)) {
          this._mapDragging = false
          this._lastDragAt = Date.now()
          this._mapTapEligible = false
        }
      } catch (err) {
        console.warn('regionchange 处理异常', err)
      }
    },
    handleMapTap(e) {
      // 地图空白处点击占位
    }
  },
}
</script>

<style scoped>
/* 引入 CardItem 的样式结构并适配 cover-view */
.card {
  margin-bottom: 10px;
  border-radius: 6px;
  background-color: #fff;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  width: auto;
  display: flex;
  flex-direction: column;
}
.card-floating {
  padding: 0;
}
.card-media {
  background-color: #a0c4ff;
  height: 100px; /* 原 200rpx ~ 100px */
  width: 180px;  /* 基础宽度，缩放后为 360px */
}
.card-media-img {
  width: 100%;
  height: 100%;
  display: block;
}
.card-media-placeholder {
  width: 100%;
  height: 100%;
}
.card-content {
  padding: 8px; /* 原 16rpx ~ 8px */
  box-sizing: border-box;
}
.card-title {
  font-size: 14px; /* 原 28rpx ~ 14px */
  font-weight: 600;
  margin-bottom: 4px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-author {
  font-size: 12px; /* 原 24rpx ~ 12px */
  color: #666;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-location,
.card-stats {
  font-size: 12px; /* 原 24rpx ~ 12px */
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}


.location-module {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.map-section {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

/* 优化后的地图样式 - 完全填满 */
.user-map-optimized,
.user-map-full-expanded {
  width: 100%;
  height: 100%;
  border-radius: 0;
  position: absolute;
  top: 0;
  left: 0;
}

/* 悬浮缩小卡片样式（cover-view） */
.floating-card {
  display: flex;
  align-items: center;
  max-width: 160px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.12);
  padding: 6px 8px;
}
.card-img {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  margin-right: 6px;
}
.card-title {
  font-size: 12px;
  color: #333;
  font-weight: 600;
  line-height: 1.2;
}

/* 地图信息覆盖层 - 完全固定在导航栏上方，不受任何变换影响 */
.map-info {
  position: fixed !important; /* 相对于整个视窗固定 */
  bottom: 12px !important; /* 更贴近底部，减少空隙 */
  left: 15px !important;
  right: 15px !important;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  z-index: 9999 !important; /* 最高层级 */
  pointer-events: auto;
  /* 关键：完全脱离父元素变换影响 */
  transform: none !important;
  will-change: auto !important;
  contain: layout !important;
  isolation: isolate !important;
  transform-style: flat !important;
  backface-visibility: hidden !important;
  /* 确保在所有情况下都保持固定 */
  margin: 0 !important;
  top: auto !important;
}

.map-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 2px;
}

.map-desc {
  font-size: 13px;
  color: #666;
  display: block;
}

/* 响应式优化 */
@media (max-width: 750px) {
  .map-info {
    bottom: 60px !important;
    left: 12px !important;
    right: 12px !important;
    padding: 10px 14px;
  }
  
  .map-title {
    font-size: 14px;
  }
  
  .map-desc {
    font-size: 12px;
  }
}

.map-loading {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  color: #999;
}
.cta-float {
  position: absolute;
  right: 9px;
  bottom: 9px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  z-index: 1;
}
.reserve-big {
  width: 52px; /* 适配缩放后尺寸 */
  height: 27px;
  background: #FFC400;
  border-radius: 6px;
  color: #333;
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
}
</style>
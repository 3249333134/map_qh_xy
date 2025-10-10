<template>
  <view class="location-module">
    <view class="map-section" @touchstart.stop @touchmove.stop @touchend.stop>
      <!-- 只在页面就绪后渲染地图 -->
      <map
        v-if="isMapReady"
        :class="isFullyExpanded ? 'user-map-full-expanded' : 'user-map-optimized'"
        :latitude="mapCenter.latitude"
        :longitude="mapCenter.longitude"
        :scale="mapCenter.scale"
        :markers="mapMarkers"
        @markertap="handleMarkerTap"
        @regionchange="handleRegionChange"
        @tap="handleMapTap"
        @touchstart.stop
        @touchmove.stop
        @touchend.stop
        show-location
        enable-zoom
        enable-scroll
        enable-rotate
        enable-3D
        :include-points="userLocations"
        :include-padding="includePadding"
      ></map>
      
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
    }
  },
  data() {
    return {
      isMapReady: false,  // 地图就绪状态
      includePadding: {
        left: 20,
        right: 20,
        top: 20,
        bottom: 0 // 贴底显示，不为底部留白
      }
    }
  },
  
  mounted() {
    // 延迟初始化地图，避免过早调用
    this.$nextTick(() => {
      setTimeout(() => {
        this.isMapReady = true
      }, 200)
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
        iconPath: '/static/marker.png',
        width: 32,
        height: 32,
        callout: {
          content: location.title,
          color: '#333',
          fontSize: 14,
          borderRadius: 8,
          bgColor: '#fff',
          padding: 8,
          display: 'BYCLICK'
        }
      }))
    }
  },
  methods: {
    handleMarkerTap(e) {
      const markerId = e.detail.markerId
      const location = this.userLocations[markerId]
      
      // 优化标记点击反馈
      uni.showToast({
        title: `已选择: ${location.title}`,
        icon: 'none',
        duration: 1500
      })
      
      this.$emit('marker-tap', { location, markerId })
    },
    
    // 新增：地图区域变化处理
    handleRegionChange(e) {
      this.$emit('region-change', e.detail)
    },
    
    // 新增：地图点击处理
    handleMapTap(e) {
      this.$emit('map-tap', e.detail)
    }
  }
}
</script>

<style scoped>
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
</style>
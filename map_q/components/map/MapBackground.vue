<template>
  <view class="map-container" :style="{ height: height + 'px' }">
    <map
      id="map"
      class="map"
      :latitude="mapCenter.latitude"
      :longitude="mapCenter.longitude"
      :markers="(config && config.markers) || []"
      :polyline="(config && config.polyline) || []"
      :scale="currentScale"
      show-location
      :subkey="mapKey"
      @regionchange="onRegionChange"
      @updated="onMapUpdated"
      @error="onMapError"
      @markertap="onMarkerTap"
      @poitap="onPoiTap"
    ></map>
    <!-- 添加位置刷新按钮 -->
    <view class="location-btn" @tap="refreshLocation">
      <text class="location-icon">📍</text>
    </view>
  </view>
</template>

<script>
export default {
  props: {
    height: {
      type: Number,
      required: true
    },
    config: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      mapKey: 'ISSBZ-BQA6T-J2SXF-VSDGE-A7NZ5-U4B3K',
      mapContext: null,
      isInitialized: false,
      boundsFetchTimer: null,
      lastBoundsTime: 0,
      hasInitialBounds: false,
      retryCount: 0,
      maxRetries: 3,
      lastScale: null
    }
  },
  computed: {
    currentScale() {
      return (this.config && this.config.scale) || 18
    },
    mapCenter() {
      return {
        latitude: (this.config && this.config.latitude) || 39.9042,
        longitude: (this.config && this.config.longitude) || 116.4074
      }
    }
  },
  methods: {
    cleanup() {
      if (this.boundsFetchTimer) {
        clearTimeout(this.boundsFetchTimer);
        this.boundsFetchTimer = null;
      }
      this.mapContext = null;
      this.isInitialized = false;
    },
    
    onMapError(e) {
      console.error('地图加载错误:', e)
      if (this.retryCount < this.maxRetries) {
        this.retryCount++
        setTimeout(() => {
          this.initializeMap()
        }, 2000 * this.retryCount)
      } else {
        this.$emit('map-error', '地图加载失败，请检查网络连接')
      }
    },
    
    initializeMap() {
      try {
        this.mapContext = uni.createMapContext('map', this);
        console.log('地图上下文已创建:', this.mapContext);
        this.isInitialized = true;
        
        this.boundsFetchTimer = setTimeout(() => {
          this.getMapBounds();
          this.hasInitialBounds = true;
        }, 1000);
      } catch (error) {
        console.error('地图初始化失败:', error);
      }
    },
    
    refreshLocation() {
      this.$emit('refresh-location')
    },

    moveToLocation(latitude, longitude, scale = 16) {
      if (!latitude || !longitude) {
        console.error('定位失败：缺少有效的经纬度坐标')
        return Promise.reject(new Error('缺少有效的经纬度坐标'))
      }
      
      console.log(`地图定位到坐标: ${latitude}, ${longitude}`)
      
      return new Promise((resolve) => {
        this.$emit('move-to-location', {
          latitude,
          longitude,
          scale
        })
        
        setTimeout(() => {
          resolve({ latitude, longitude, scale })
        }, 300)
      })
    },

    showTrack(trackPoints, highEnergyPoints = []) {
      if (!trackPoints || !Array.isArray(trackPoints) || trackPoints.length < 2) {
        console.error('无效的轨迹数据')
        return
      }
      
      console.log('显示轨迹数据点数量:', trackPoints.length)
      console.log('高能点数量:', highEnergyPoints.length)
      
      const points = trackPoints.map(point => ({
        latitude: parseFloat(point[1]),
        longitude: parseFloat(point[0])
      }))
      
      console.log('转换后的points:', points)
      
      // 创建多条轨迹线，形成更丰富的视觉效果
      const polyline = []
      
      // 主轨迹线 - 带有渐变效果
      polyline.push({
        points: points,
        color: '#667eea',
        width: 10,
        dottedLine: false,
        arrowLine: true,
        borderColor: '#764ba2',
        borderWidth: 2
      })
      
      // 添加阴影轨迹线
      polyline.push({
        points: points,
        color: 'rgba(102, 126, 234, 0.3)',
        width: 16,
        dottedLine: false,
        arrowLine: false
      })
      
      if (this.config && this.config.polyline) {
        console.log('设置前的polyline:', this.config.polyline)
        this.config.polyline.length = 0
        this.config.polyline.push(...polyline)
        console.log('设置后的polyline:', this.config.polyline)
      }
      
      // 添加高能点标记
      this.updateHighEnergyMarkers(highEnergyPoints, points)
      
      this.$emit('show-track', polyline)
      
      const lats = trackPoints.map(p => parseFloat(p[1]))
      const lngs = trackPoints.map(p => parseFloat(p[0]))
      const centerLat = (Math.max(...lats) + Math.min(...lats)) / 2
      const centerLng = (Math.max(...lngs) + Math.min(...lngs)) / 2
      const latRange = Math.max(...lats) - Math.min(...lats)
      const lngRange = Math.max(...lngs) - Math.min(...lngs)
      
      // 根据范围计算合适的缩放级别
      let scale = 16
      const maxRange = Math.max(latRange, lngRange)
      if (maxRange > 0.1) {
        scale = 12
      } else if (maxRange > 0.05) {
        scale = 13
      } else if (maxRange > 0.02) {
        scale = 14
      } else if (maxRange > 0.01) {
        scale = 15
      }
      
      console.log('轨迹范围:', { latRange, lngRange, maxRange, scale })
      this.moveToLocation(centerLat, centerLng, scale)
    },
    
    updateHighEnergyMarkers(highEnergyPoints, trackPoints) {
      const markers = []
      
      // 添加起点标记
      if (trackPoints && trackPoints.length > 0) {
        markers.push({
          id: 'start_point',
          latitude: trackPoints[0].latitude,
          longitude: trackPoints[0].longitude,
          width: 30,
          height: 30,
          iconPath: '/static/marker.png',
          callout: {
            content: '起点',
            fontSize: 12,
            borderRadius: 8,
            bgColor: '#4CAF50',
            color: '#ffffff',
            padding: 6,
            display: 'ALWAYS'
          }
        })
      }
      
      // 添加终点标记
      if (trackPoints && trackPoints.length > 1) {
        markers.push({
          id: 'end_point',
          latitude: trackPoints[trackPoints.length - 1].latitude,
          longitude: trackPoints[trackPoints.length - 1].longitude,
          width: 30,
          height: 30,
          iconPath: '/static/marker-green.png',
          callout: {
            content: '终点',
            fontSize: 12,
            borderRadius: 8,
            bgColor: '#f44336',
            color: '#ffffff',
            padding: 6,
            display: 'ALWAYS'
          }
        })
      }
      
      // 添加高能点标记
      if (highEnergyPoints && Array.isArray(highEnergyPoints) && highEnergyPoints.length > 0) {
        console.log('更新高能点标记:', highEnergyPoints)
        
        highEnergyPoints.forEach((point, index) => {
          if (point.coordinate) {
            markers.push({
              id: `energy_${index}`,
              latitude: parseFloat(point.coordinate[1]),
              longitude: parseFloat(point.coordinate[0]),
              width: 24,
              height: 24,
              iconPath: '',
              callout: {
                content: point.label || `途经点${index + 1}`,
                fontSize: 11,
                borderRadius: 6,
                bgColor: '#2196F3',
                color: '#ffffff',
                padding: 4,
                display: 'ALWAYS'
              }
            })
          }
        })
      }
      
      if (this.config && this.config.markers) {
        this.config.markers.length = 0
        this.config.markers.push(...markers)
        console.log('地图标记已设置:', this.config.markers)
      }
    },

    onMapUpdated() {
      console.log('地图更新完成');
      if (this.isInitialized && !this.hasInitialBounds) {
        this.hasInitialBounds = true;
        this.debouncedGetBounds();
      }
    },
    onMarkerTap(e) {
      console.log('MapBackground onMarkerTap 触发:', e)
      const id = (e && e.detail && (e.detail.markerId || e.detail.markerid)) || e.markerId || e.markerid || null
      console.log('解析的markerId:', id)
      
      let marker = null
      const list = (this.config && Array.isArray(this.config.markers)) ? this.config.markers : []
      console.log('mapConfig.markers:', list)
      
      if (id != null) {
        marker = list.find(m => String(m.id) === String(id)) || null
      }
      console.log('找到的marker:', marker)
      
      this.$emit('markertap', { markerId: id, marker })
    },
    onPoiTap(e) {
      const detail = e && e.detail ? e.detail : {}
      const latitude = detail.latitude || (detail.location && detail.location.lat) || null
      const longitude = detail.longitude || (detail.location && detail.location.lng) || null
      const name = detail.name || '位置'
      const marker = (latitude && longitude) ? { latitude, longitude, customData: { name } } : null
      this.$emit('poi-tap', { detail, marker })
    },
    
    onRegionChange(e) {
      console.log('地图区域变化事件:', e);
      if (e.type === 'end' && (e.causedBy === 'drag' || e.causedBy === 'scale')) {
        const newScale = e.scale || this.lastScale || this.currentScale
        this.lastScale = newScale
        console.log('地图缩放级别:', newScale)
        this.debouncedGetBounds()
      }
    },
    
    debouncedGetBounds() {
      const now = Date.now();
      if (now - this.lastBoundsTime < 2000) { 
        console.log('防抖：跳过边界获取');
        return;
      }
      this.lastBoundsTime = now;
      
      if (this.boundsFetchTimer) {
        clearTimeout(this.boundsFetchTimer);
      }
      
      this.boundsFetchTimer = setTimeout(() => {
        this.getMapBounds();
      }, 1000);
    },
    
    getMapBounds() {
      if (!this.isInitialized || !this.mapContext) {
        console.log('地图未初始化，跳过边界获取');
        return;
      }
      
      console.log('开始获取地图区域...');
      
      const timeoutId = setTimeout(() => {
        console.error('获取地图区域超时');
        this.handleBoundsFailure();
      }, 5000);
      
      this.mapContext.getRegion({
        success: (res) => {
          clearTimeout(timeoutId);
          console.log('原始地图区域数据:', res);
          
          if (!res || !res.northeast || !res.southwest) {
            console.error('地图区域数据不完整:', res);
            this.handleBoundsFailure();
            return;
          }
          
          try {
            const bounds = {
              northeast: {
                latitude: parseFloat(res.northeast.latitude),
                longitude: parseFloat(res.northeast.longitude)
              },
              southwest: {
                latitude: parseFloat(res.southwest.latitude),
                longitude: parseFloat(res.southwest.longitude)
              },
              scale: this.lastScale || this.currentScale
            };
            
            console.log('处理后的地图可视区域:', bounds);
            
            if (this.validateBounds(bounds)) {
              console.log('发送区域变化事件给父组件');
              this.$emit('region-changed', bounds);
            } else {
              this.handleBoundsFailure();
            }
          } catch (error) {
            console.error('处理边界数据时出错:', error);
            this.handleBoundsFailure();
          }
        },
        fail: (error) => {
          clearTimeout(timeoutId);
          console.error('获取地图区域失败:', error);
          this.handleBoundsFailure();
        }
      });
    },
    
    validateBounds(bounds) {
      if (!bounds.northeast || !bounds.southwest) {
        console.error('边界数据缺失');
        return false;
      }
      
      const { northeast, southwest } = bounds;
      
      if (isNaN(northeast.latitude) || isNaN(northeast.longitude) ||
          isNaN(southwest.latitude) || isNaN(southwest.longitude)) {
        console.error('边界数据包含非数字值:', bounds);
        return false;
      }
      
      if (northeast.latitude <= southwest.latitude ||
          northeast.longitude <= southwest.longitude) {
        console.error('地图边界数据异常:', bounds);
        return false;
      }
      
      const latDiff = northeast.latitude - southwest.latitude;
      const lngDiff = northeast.longitude - southwest.longitude;
      
      if (latDiff > 10 || lngDiff > 10 || latDiff < 0.0001 || lngDiff < 0.0001) {
        console.error('地图边界范围异常:', { latDiff, lngDiff });
        return false;
      }
      
      return true;
    },
    
    handleBoundsFailure() {
      console.log('尝试使用fallback边界');
      const fallbackBounds = this.createFallbackBounds();
      if (fallbackBounds && this.validateBounds(fallbackBounds)) {
        console.log('使用fallback边界:', fallbackBounds);
        this.$emit('region-changed', fallbackBounds);
      } else {
        console.error('无法创建有效的fallback边界');
      }
    },
    
    createFallbackBounds() {
      const center = this.mapCenter
      if (!center || center.latitude == null || center.longitude == null ||
          isNaN(center.latitude) || isNaN(center.longitude)) {
        console.error('缺少或无效的地图中心点坐标', this.config)
        return null
      }
      const scale = Number(this.currentScale) || 16
      const latDelta = Math.max(0.001, 0.01 * (20 - scale) / 10)
      const lngDelta = Math.max(0.001, 0.01 * (20 - scale) / 10)
      return {
        northeast: {
          latitude: center.latitude + latDelta,
          longitude: center.longitude + lngDelta
        },
        southwest: {
          latitude: center.latitude - latDelta,
          longitude: center.longitude - lngDelta
        },
        scale
      }
    }
  }
}
</script>

<style>
.map-container {
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}

.map {
  width: 100%;
  height: 100%;
}

.location-btn {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  background-color: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  z-index: 10;
}

.location-icon {
  font-size: 24px;
}
</style>
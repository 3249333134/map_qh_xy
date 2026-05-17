<template>
  <view class="map-container" :style="{ height: height + 'px' }">
    <map
      id="map"
      class="map"
      :latitude="mapCenter.latitude"
      :longitude="mapCenter.longitude"
      :markers="(config && config.markers) || []"
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
      // 新增：记录最近一次地图的缩放级别，避免写入computed
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
    // 清理资源
    cleanup() {
      if (this.boundsFetchTimer) {
        clearTimeout(this.boundsFetchTimer);
        this.boundsFetchTimer = null;
      }
      this.mapContext = null;
      this.isInitialized = false;
    },
    
    // 地图错误处理（合并到最终 methods 中，避免被覆盖）
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
    
    // 初始化地图
    initializeMap() {
      try {
        this.mapContext = uni.createMapContext('map', this);
        console.log('地图上下文已创建:', this.mapContext);
        this.isInitialized = true;
        
        // 初始化完成后延迟获取边界
        this.boundsFetchTimer = setTimeout(() => {
          this.getMapBounds();
          this.hasInitialBounds = true; // 标记已获取初始边界
        }, 1000); // 增加延迟确保地图完全加载
      } catch (error) {
        console.error('地图初始化失败:', error);
      }
    },
    
    refreshLocation() {
      // 允许父页面在刷新定位时拉起系统定位权限并更新 mapConfig
      this.$emit('refresh-location')
    },

    // 添加地图定位方法
    moveToLocation(latitude, longitude, scale = 16) {
      if (!latitude || !longitude) {
        console.error('定位失败：缺少有效的经纬度坐标')
        return Promise.reject(new Error('缺少有效的经纬度坐标'))
      }
      
      console.log(`地图定位到坐标: ${latitude}, ${longitude}`)
      
      return new Promise((resolve) => {
        // 触发父组件更新地图配置
        this.$emit('move-to-location', {
          latitude,
          longitude,
          scale
        })
        
        // 等待地图更新完成
        setTimeout(() => {
          resolve({ latitude, longitude, scale })
        }, 300)
      })
    },

    // 地图更新完成事件
    onMapUpdated() {
      console.log('地图更新完成');
      // 只在初始化后的第一次更新获取边界，后续依赖regionchange事件
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
    
    // 地图区域变化事件
    onRegionChange(e) {
      console.log('地图区域变化事件:', e);
      if (e.type === 'end' && (e.causedBy === 'drag' || e.causedBy === 'scale')) {
        // 修复：记录缩放到数据字段，避免写入computed
        const newScale = e.scale || this.lastScale || this.currentScale
        this.lastScale = newScale
        console.log('地图缩放级别:', newScale)
        this.debouncedGetBounds()
      }
    },
    
    // 防抖获取边界
    debouncedGetBounds() {
      const now = Date.now();
      // 增加防抖时间到2000ms
      if (now - this.lastBoundsTime < 2000) { 
        console.log('防抖：跳过边界获取');
        return;
      }
      this.lastBoundsTime = now;
      
      if (this.boundsFetchTimer) {
        clearTimeout(this.boundsFetchTimer);
      }
      
      // 增加延迟时间，确保用户完全停止操作
      this.boundsFetchTimer = setTimeout(() => {
        this.getMapBounds();
      }, 1000);
    },
    
    // 获取地图可视区域边界
    getMapBounds() {
      if (!this.isInitialized || !this.mapContext) {
        console.log('地图未初始化，跳过边界获取');
        return;
      }
      
      console.log('开始获取地图区域...');
      
      // 添加超时处理
      const timeoutId = setTimeout(() => {
        console.error('获取地图区域超时');
        this.handleBoundsFailure();
      }, 5000);
      
      this.mapContext.getRegion({
        success: (res) => {
          clearTimeout(timeoutId);
          console.log('原始地图区域数据:', res);
          
          // 验证返回的数据
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
              // 修复：使用记录的缩放级别作为bounds的scale
              scale: this.lastScale || this.currentScale
            };
            
            console.log('处理后的地图可视区域:', bounds);
            
            // 验证边界数据的合理性
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
    
    // 验证边界数据
    validateBounds(bounds) {
      if (!bounds.northeast || !bounds.southwest) {
        console.error('边界数据缺失');
        return false;
      }
      
      const { northeast, southwest } = bounds;
      
      // 检查数据类型
      if (isNaN(northeast.latitude) || isNaN(northeast.longitude) ||
          isNaN(southwest.latitude) || isNaN(southwest.longitude)) {
        console.error('边界数据包含非数字值:', bounds);
        return false;
      }
      
      // 检查边界逻辑
      if (northeast.latitude <= southwest.latitude ||
          northeast.longitude <= southwest.longitude) {
        console.error('地图边界数据异常:', bounds);
        return false;
      }
      
      // 检查边界范围是否合理（避免过大或过小的范围）
      const latDiff = northeast.latitude - southwest.latitude;
      const lngDiff = northeast.longitude - southwest.longitude;
      
      if (latDiff > 10 || lngDiff > 10 || latDiff < 0.0001 || lngDiff < 0.0001) {
        console.error('地图边界范围异常:', { latDiff, lngDiff });
        return false;
      }
      
      return true;
    },
    
    // 处理边界获取失败
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
    
    // 创建fallback边界（基于当前地图中心点，防御空值）
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

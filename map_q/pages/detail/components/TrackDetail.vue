<template>
  <view class="detail-page track-detail">
    <!-- 地图区域 -->
    <view class="track-map">
      <map
        id="trackMap"
        class="map-view"
        :latitude="mapCenter.latitude"
        :longitude="mapCenter.longitude"
        :markers="markers"
        :polyline="polyline"
        :scale="14"
        show-location
      ></map>
      <view class="map-controls">
        <view class="control-btn" @tap="resetMapView">
          <text>重置</text>
        </view>
      </view>
    </view>

    <!-- 顶部导航 -->
    <view class="detail-nav">
      <view class="nav-back" @tap="back">
        <view class="back-btn">
          <text class="back-icon">‹</text>
        </view>
      </view>
      <text class="nav-title">路线详情</text>
      <view class="nav-actions">
        <view class="share-btn" @tap="shareContent">
          <text class="action-icon">↗</text>
        </view>
      </view>
    </view>

    <!-- 路线信息卡片 -->
    <view class="route-info-card">
      <view class="route-header">
        <text class="route-title">{{ trackData.name }}</text>
        <text class="route-author">by {{ trackData.author }}</text>
      </view>

      <view class="route-stats">
        <view class="stat-item">
          <text class="stat-icon">📏</text>
          <text class="stat-value">{{ trackData.distance || 0 }}km</text>
          <text class="stat-label">距离</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-icon">⏱</text>
          <text class="stat-value">{{ formattedDuration }}</text>
          <text class="stat-label">时长</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-icon">📍</text>
          <text class="stat-value">{{ waypointCount }}</text>
          <text class="stat-label">途经点</text>
        </view>
      </view>
    </view>

    <!-- 途经点列表 -->
    <view class="waypoints-section">
      <text class="section-title">途经地点</text>
      <view class="waypoints-list">
        <!-- 起点 -->
        <view class="waypoint-item start">
          <view class="waypoint-marker">
            <view class="marker-circle start-color"></view>
            <view class="marker-line"></view>
          </view>
          <view class="waypoint-info">
            <text class="waypoint-name">起点</text>
            <text class="waypoint-coord">{{ formattedStartCoord }}</text>
          </view>
        </view>

        <!-- 途经点 -->
        <view class="waypoint-item" v-for="(point, index) in middleWaypoints" :key="index">
          <view class="waypoint-marker">
            <view class="marker-circle middle-color"></view>
            <view class="marker-line"></view>
          </view>
          <view class="waypoint-info">
            <text class="waypoint-name">{{ point.label || `途经点 ${index + 1}` }}</text>
            <text class="waypoint-coord">{{ formatCoord(point.coordinate) }}</text>
          </view>
        </view>

        <!-- 终点 -->
        <view class="waypoint-item end">
          <view class="waypoint-marker">
            <view class="marker-circle end-color"></view>
          </view>
          <view class="waypoint-info">
            <text class="waypoint-name">终点</text>
            <text class="waypoint-coord">{{ formattedEndCoord }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 路线描述 -->
    <view class="route-desc" v-if="trackData.description">
      <text class="section-title">路线描述</text>
      <text class="desc-text">{{ trackData.description }}</text>
    </view>

    <!-- 底部占位 -->
    <view :style="{ height: bottomHeight + 'px' }"></view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <view class="bar-left">
        <view class="bar-action" @tap="toggleLike">
          <text :class="{ active: isLiked }">{{ isLiked ? '♥' : '♡' }}</text>
          <text>{{ trackData.likes || 0 }}</text>
        </view>
        <view class="bar-action" @tap="toggleCollect">
          <text :class="{ active: isCollected }">{{ isCollected ? '★' : '☆' }}</text>
          <text>收藏</text>
        </view>
      </view>
      <view class="bar-right" @tap="startNavigation">
        <text class="nav-icon">🧭</text>
        <text>开始导航</text>
      </view>
    </view>
  </view>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { ROUTE_PLANNER } from '../../../utils/routePlanner.js'

export default {
  name: 'TrackDetail',
  setup() {
    const trackData = ref({
      name: '路线名称',
      author: '用户',
      description: '',
      distance: 0,
      duration: 0,
      likes: 0,
      location: null,
      highEnergyPoints: []
    })

    const isLiked = ref(false)
    const isCollected = ref(false)
    const bottomHeight = ref(80)
    const mapCenter = ref({ latitude: 30.518937, longitude: 114.402672 })
    const markers = ref([])
    const polyline = ref([])
    const trackPoints = ref([])

    const formattedDuration = computed(() => {
      const mins = Math.round(trackData.value.duration || 0)
      if (mins >= 60) {
        const hours = Math.floor(mins / 60)
        const remainingMins = mins % 60
        return `${hours}h ${remainingMins}m`
      }
      return `${mins}分钟`
    })

    const waypointCount = computed(() => {
      return trackData.value.highEnergyPoints?.length || 0
    })

    const formattedStartCoord = computed(() => {
      if (!trackPoints.value || trackPoints.value.length === 0) return ''
      return formatCoord(trackPoints.value[0])
    })

    const formattedEndCoord = computed(() => {
      if (!trackPoints.value || trackPoints.value.length === 0) return ''
      return formatCoord(trackPoints.value[trackPoints.value.length - 1])
    })

    const middleWaypoints = computed(() => {
      return trackData.value.highEnergyPoints || []
    })

    const formatCoord = (coord) => {
      if (!coord || !Array.isArray(coord)) return ''
      return `${coord[1].toFixed(4)}, ${coord[0].toFixed(4)}`
    }

    const toggleLike = () => {
      isLiked.value = !isLiked.value
      trackData.value.likes = (trackData.value.likes || 0) + (isLiked.value ? 1 : -1)
    }

    const toggleCollect = () => {
      isCollected.value = !isCollected.value
      uni.showToast({
        title: isCollected.value ? '已收藏' : '取消收藏',
        icon: 'none'
      })
    }

    const resetMapView = () => {
      if (trackPoints.value && trackPoints.value.length > 0) {
        const lats = trackPoints.value.map(p => parseFloat(p[1]))
        const lngs = trackPoints.value.map(p => parseFloat(p[0]))
        mapCenter.value = {
          latitude: (Math.max(...lats) + Math.min(...lats)) / 2,
          longitude: (Math.max(...lngs) + Math.min(...lngs)) / 2
        }
      }
    }

    const startNavigation = () => {
      if (trackPoints.value && trackPoints.value.length > 0) {
        const end = trackPoints.value[trackPoints.value.length - 1]
        uni.openLocation({
          latitude: end[1],
          longitude: end[0],
          name: '目的地',
          fail: () => {
            uni.showToast({
              title: '导航功能暂不可用',
              icon: 'none'
            })
          }
        })
      }
    }

    const shareContent = () => {
      uni.showToast({
        title: '分享功能待实现',
        icon: 'none'
      })
    }

    const back = () => {
      uni.navigateBack()
    }

    const loadData = async () => {
      try {
        const item = uni.getStorageSync('INDEX_LAST_ITEM')
        if (item && item._id) {
          trackData.value.name = item.name || item.title || '路线名称'
          trackData.value.author = item.author || '用户'
          trackData.value.description = item.description || ''
          trackData.value.likes = item.likes || 0
          trackData.value.highEnergyPoints = item.highEnergyPoints || []

          // 从location提取轨迹点
          if (item.location && item.location.type === 'LineString' && item.location.coordinates) {
            trackPoints.value = item.location.coordinates
          }

          // 如果有轨迹点，先尝试获取真实路线
          if (trackPoints.value && trackPoints.value.length >= 2) {
            const start = trackPoints.value[0]
            const end = trackPoints.value[trackPoints.value.length - 1]
            try {
              const result = await ROUTE_PLANNER.getFixedRoute(start, end)
              if (result.success && result.path.length > 0) {
                trackPoints.value = result.path
                trackData.value.distance = result.distance
                trackData.value.duration = result.duration
              }
            } catch (e) {
              console.warn('获取真实路线失败，使用原始数据')
            }
          }

          // 更新地图
          updateMapView()
        }
      } catch (e) {
        console.warn('加载轨迹数据失败:', e)
      }
    }

    const updateMapView = () => {
      if (!trackPoints.value || trackPoints.value.length === 0) return

      // 计算中心点
      const lats = trackPoints.value.map(p => parseFloat(p[1]))
      const lngs = trackPoints.value.map(p => parseFloat(p[0]))
      mapCenter.value = {
        latitude: (Math.max(...lats) + Math.min(...lats)) / 2,
        longitude: (Math.max(...lngs) + Math.min(...lngs)) / 2
      }

      // 设置轨迹线
      polyline.value = [{
        points: trackPoints.value.map(p => ({
          latitude: parseFloat(p[1]),
          longitude: parseFloat(p[0])
        })),
        color: '#667eea',
        width: 5,
        dottedLine: false
      }]

      // 设置标记点
      markers.value = [
        {
          id: 0,
          latitude: parseFloat(trackPoints.value[0][1]),
          longitude: parseFloat(trackPoints.value[0][0]),
          width: 24,
          height: 24,
          iconPath: '/static/marker.png',
          callout: { content: '起点', display: 'ALWAYS', fontSize: 12, bgColor: '#22c55e', color: '#fff', padding: 6, borderRadius: 8 }
        },
        {
          id: 1,
          latitude: parseFloat(trackPoints.value[trackPoints.value.length - 1][1]),
          longitude: parseFloat(trackPoints.value[trackPoints.value.length - 1][0]),
          width: 24,
          height: 24,
          iconPath: '/static/marker-green.png',
          callout: { content: '终点', display: 'ALWAYS', fontSize: 12, bgColor: '#f97316', color: '#fff', padding: 6, borderRadius: 8 }
        }
      ]

      // 添加途经点标记
      if (trackData.value.highEnergyPoints) {
        trackData.value.highEnergyPoints.forEach((point, index) => {
          if (point.coordinate) {
            markers.value.push({
              id: 100 + index,
              latitude: parseFloat(point.coordinate[1]),
              longitude: parseFloat(point.coordinate[0]),
              width: 20,
              height: 20,
              callout: { content: point.label || `途经${index + 1}`, display: 'ALWAYS', fontSize: 11, bgColor: '#3b82f6', color: '#fff', padding: 4, borderRadius: 6 }
            })
          }
        })
      }
    }

    onMounted(() => {
      loadData()
    })

    return {
      trackData,
      isLiked,
      isCollected,
      bottomHeight,
      mapCenter,
      markers,
      polyline,
      formattedDuration,
      waypointCount,
      formattedStartCoord,
      formattedEndCoord,
      middleWaypoints,
      formatCoord,
      toggleLike,
      toggleCollect,
      resetMapView,
      startNavigation,
      shareContent,
      back
    }
  }
}
</script>

<style scoped>
.detail-page {
  min-height: 100vh;
  background: #f8f8f8;
}

.detail-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--status-bar-height) 24rpx 16rpx;
  background: transparent;
  z-index: 100;
}

.nav-back {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
}

.back-icon {
  font-size: 48rpx;
  font-weight: 300;
  color: #ffffff;
  position: relative;
  top: -4rpx;
}

.nav-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #ffffff;
}

.nav-actions {
  width: 80rpx;
  display: flex;
  justify-content: flex-end;
}

.share-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
}

.action-icon {
  font-size: 28rpx;
  color: #ffffff;
}

.track-map {
  height: 800rpx;
  position: relative;
  background: #e8f4ea;
}

.map-view {
  width: 100%;
  height: 100%;
}

.map-controls {
  position: absolute;
  right: 16px;
  bottom: 16px;
}

.control-btn {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.control-btn text {
  font-size: 12px;
  color: #333;
}

.route-info-card {
  margin: -40rpx 24rpx 24rpx;
  padding: 32rpx;
  background: #fff;
  border-radius: 32rpx;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  position: relative;
  z-index: 10;
}

.route-header {
  margin-bottom: 16px;
}

.route-title {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.route-author {
  font-size: 13px;
  color: #999;
}

.route-stats {
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-icon {
  font-size: 18px;
}

.stat-value {
  font-size: 16px;
  font-weight: 700;
  color: #333;
}

.stat-label {
  font-size: 11px;
  color: #999;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: #eee;
}

.waypoints-section {
  padding: 20px;
  background: #fff;
}

.section-title {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.waypoints-list {
  display: flex;
  flex-direction: column;
}

.waypoint-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 0;
}

.waypoint-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 16px;
}

.marker-circle {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 3px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
}

.start-color { background: #22c55e; }
.middle-color { background: #3b82f6; }
.end-color { background: #f97316; }

.marker-line {
  width: 2px;
  flex: 1;
  background: #ddd;
  margin: 4px 0;
  min-height: 20px;
}

.waypoint-item.end .marker-line {
  display: none;
}

.waypoint-info {
  flex: 1;
}

.waypoint-name {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}

.waypoint-coord {
  font-size: 12px;
  color: #999;
}

.route-desc {
  padding: 20px;
  background: #fff;
}

.desc-text {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 10px 16px;
  padding-bottom: calc(10px + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -1px 8px rgba(0, 0, 0, 0.05);
}

.bar-left {
  display: flex;
  gap: 20px;
}

.bar-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.bar-action text:first-child {
  font-size: 20px;
  color: #999;
}

.bar-action text:first-child.active {
  color: #ff4757;
}

.bar-action text:last-child {
  font-size: 10px;
  color: #999;
}

.bar-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 24px;
  background: #07c160;
  border-radius: 24px;
}

.nav-icon {
  font-size: 16px;
}

.bar-right text:last-child {
  font-size: 14px;
  color: #fff;
  font-weight: 500;
}
</style>

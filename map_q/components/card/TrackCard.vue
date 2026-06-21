<template>
  <view
    class="card track-card"
    :style="{ '--card-height': height + 'rpx' }">
    <!-- 卡片上半部分：地图轨迹预览 -->
    <view
      class="card-media track-media"
      @tap="handleMediaTap">
      <!-- 地图预览背景 -->
      <view class="track-map-preview">
        <!-- 地图背景 -->
        <view class="track-map-surface"></view>
        <!-- 轨迹线 -->
        <canvas
          v-if="hasTrackPoints"
          :canvas-id="canvasId"
          class="track-canvas"
          canvas-type="2d"
        ></canvas>
        <!-- 起点标记 -->
        <view v-if="startPoint" class="map-marker start-marker" :style="{ left: startPoint.x + 'px', top: startPoint.y + 'px' }"></view>
        <!-- 终点标记 -->
        <view v-if="endPoint" class="map-marker end-marker" :style="{ left: endPoint.x + 'px', top: endPoint.y + 'px' }"></view>
        <!-- 途经点标记 -->
        <view
          v-for="(point, index) in wayPoints"
          :key="index"
          class="map-marker way-marker"
          :style="{ left: point.x + 'px', top: point.y + 'px' }"
        ></view>
      </view>
      <!-- 叠加信息 -->
      <view class="track-overlay">
        <view class="track-icon">线</view>
        <view class="track-info">
          <text class="track-distance">{{ locationText }}</text>
          <text class="track-duration">{{ durationText }}</text>
        </view>
      </view>
    </view>
    <!-- 卡片下半部分 -->
    <view
      class="card-content"
      @tap="handleContentTap">
      <view class="card-title">{{ cardTitle }}</view>
      <view class="card-author">{{ cardAuthor }}</view>
      <view class="card-footer">
        <view class="card-location">{{ pointSummary }}</view>
        <view class="card-stats">
          <text class="track-badge">迹</text>
          <text class="likes">{{ cardStats }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { ROUTE_PLANNER } from '../../utils/routePlanner.js'

export default {
  name: 'TrackCard',
  props: {
    height: {
      type: Number,
      default: 200
    },
    columnType: {
      type: String,
      default: 'left'
    },
    index: {
      type: Number,
      required: true
    },
    cardData: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      canvasWidth: 0,
      canvasHeight: 0,
      startPoint: null,
      endPoint: null,
      wayPoints: [],
      realTrackPoints: []
    }
  },
  computed: {
    cardTitle() {
      return this.cardData && (this.cardData.name || this.cardData.title) ?
        (this.cardData.name || this.cardData.title) : '轨迹路线'
    },
    cardAuthor() {
      return this.cardData && this.cardData.author ? this.cardData.author : '用户'
    },
    cardStats() {
      if (this.cardData && this.cardData.likes) {
        return `${this.cardData.likes} 赞`
      }
      return '0 赞'
    },
    locationText() {
      if (this.cardData && this.cardData.distance) {
        return `${this.cardData.distance}km`
      }
      return '未知距离'
    },
    durationText() {
      return (this.cardData && this.cardData.duration) ? this.cardData.duration : '路线预览'
    },
    pointSummary() {
      const count = this.cardData && this.cardData.highEnergyPoints ? this.cardData.highEnergyPoints.length : 0
      return count > 0 ? `${count} 个途经点` : '轨迹路线'
    },
    canvasId() {
      return `trackPreviewCanvas_${this.index}_${this.cardData && this.cardData._id ? this.cardData._id : 'item'}`
    },
    hasTrackPoints() {
      // 优先使用真实道路路线
      if (this.realTrackPoints.length > 0) return true
      return this.cardData &&
             this.cardData.location &&
             this.cardData.location.coordinates &&
             this.cardData.location.coordinates.length > 0
    },
    trackPoints() {
      // 优先使用真实道路路线
      if (this.realTrackPoints.length > 0) {
        return this.realTrackPoints
      }
      if (!this.hasTrackPoints) return []
      return this.cardData.location.coordinates
    }
  },
  watch: {
    cardData: {
      handler() {
        this.$nextTick(async () => {
          await this.fetchRealTrack()
          this.initCanvas()
        })
      },
      immediate: true,
      deep: true
    }
  },
  mounted() {
    this.$nextTick(async () => {
      await this.fetchRealTrack()
      this.initCanvas()
    })
  },
  methods: {
    async fetchRealTrack() {
      if (this.realTrackPoints.length > 0) return
      try {
        console.log('轨迹卡片正在获取真实道路路线...')
        const routeResult = await ROUTE_PLANNER.getFixedRoute()
        if (routeResult.success && routeResult.path.length > 0) {
          console.log('轨迹卡片获取到真实道路路线，点数:', routeResult.path.length)
          this.realTrackPoints = routeResult.path
        }
      } catch (error) {
        console.error('轨迹卡片获取真实道路路线失败:', error)
      }
    },

    async initCanvas() {
      if (!this.hasTrackPoints) return

      try {
        const query = uni.createSelectorQuery().in(this)
        query.select('.track-canvas')
          .fields({ node: true, size: true })
          .exec((res) => {
            if (res && res[0] && res[0].node) {
              const canvas = res[0].node
              const ctx = canvas.getContext('2d')

              this.canvasWidth = res[0].width || 200
              this.canvasHeight = res[0].height || 200

              canvas.width = this.canvasWidth * 2
              canvas.height = this.canvasHeight * 2
              ctx.scale(2, 2)

              this.drawTrack(ctx)
            }
          })
      } catch (error) {
        console.error('初始化画布失败:', error)
      }
    },

    drawTrack(ctx) {
      const points = this.trackPoints
      if (points.length < 2) return
      this.startPoint = null
      this.endPoint = null
      this.wayPoints = []

      // 计算坐标范围
      let minLng = Infinity, maxLng = -Infinity
      let minLat = Infinity, maxLat = -Infinity

      points.forEach(point => {
        minLng = Math.min(minLng, point[0])
        maxLng = Math.max(maxLng, point[0])
        minLat = Math.min(minLat, point[1])
        maxLat = Math.max(maxLat, point[1])
      })

      // 添加边界
      const lngPadding = (maxLng - minLng) * 0.1 || 0.001
      const latPadding = (maxLat - minLat) * 0.1 || 0.001

      minLng -= lngPadding
      maxLng += lngPadding
      minLat -= latPadding
      maxLat += latPadding

      const lngRange = maxLng - minLng
      const latRange = maxLat - minLat

      // 转换坐标到画布位置
      const convertPoint = (lng, lat) => {
        const x = ((lng - minLng) / lngRange) * (this.canvasWidth - 30) + 15
        const y = ((maxLat - lat) / latRange) * (this.canvasHeight - 30) + 15
        return { x, y }
      }

      // 绘制轨迹阴影
      ctx.beginPath()
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.22)'
      ctx.lineWidth = 8
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      points.forEach((point, index) => {
        const { x, y } = convertPoint(point[0], point[1])
        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })
      ctx.stroke()

      // 绘制轨迹线
      ctx.beginPath()
      ctx.strokeStyle = '#0ea5e9'
      ctx.lineWidth = 4
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      points.forEach((point, index) => {
        const { x, y } = convertPoint(point[0], point[1])
        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })
      ctx.stroke()

      // 设置起点和终点
      if (points.length > 0) {
        const start = convertPoint(points[0][0], points[0][1])
        const end = convertPoint(points[points.length - 1][0], points[points.length - 1][1])
        this.startPoint = { x: start.x - 8, y: start.y - 8 }
        this.endPoint = { x: end.x - 8, y: end.y - 8 }
      }

      // 设置途经点（高能点）
      if (this.cardData.highEnergyPoints && this.cardData.highEnergyPoints.length > 0) {
        this.wayPoints = this.cardData.highEnergyPoints
          .filter(point => point.coordinate)
          .map(point => {
            const pos = convertPoint(point.coordinate[0], point.coordinate[1])
            return { x: pos.x - 6, y: pos.y - 6 }
          })
      }
    },

    // 上方媒体区域点击：在地图上显示轨迹
    handleMediaTap() {
      console.log('轨迹卡片媒体区域被点击，准备在地图上显示轨迹')
      this.$emit('media-tap', {
        cardData: this.cardData,
        index: this.index,
        type: 'track'
      })
    },

    // 下方内容区域点击：在地图上显示轨迹
    handleContentTap() {
      console.log('轨迹卡片内容区域被点击，准备在地图上显示轨迹')
      this.$emit('content-tap', {
        cardData: this.cardData,
        index: this.index,
        type: 'track'
      })
    }
  }
}
</script>

<style>
/* 轨迹卡片样式 */
.track-card {
  margin-bottom: 20rpx;
  border-radius: 16rpx;
  background-color: #fff;
  overflow: hidden;
  box-shadow: 0 8rpx 24rpx rgba(31, 41, 55, 0.08);
  width: 100%;
  box-sizing: border-box;
  border: 1rpx solid rgba(226, 232, 240, 0.9);
}

.track-card .card-content {
  padding: 18rpx;
  width: 100%;
  box-sizing: border-box;
}

.track-card .track-media {
  height: var(--card-height, 200rpx);
  width: 100%;
  position: relative;
  overflow: hidden;
}

/* 地图预览容器 */
.track-map-preview {
  width: 100%;
  height: 100%;
  position: relative;
}

/* 地图背景 */
.track-map-surface {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background:
    radial-gradient(circle at 75% 24%, rgba(34, 197, 94, 0.22), transparent 30%),
    linear-gradient(135deg, #e0f2fe 0%, #f0fdf4 56%, #f8fafc 100%);
  background-image:
    linear-gradient(90deg, rgba(100, 116, 139, 0.14) 1rpx, transparent 1rpx),
    linear-gradient(rgba(100, 116, 139, 0.12) 1rpx, transparent 1rpx),
    linear-gradient(32deg, transparent 0 42%, rgba(34, 197, 94, 0.24) 42% 46%, transparent 46% 100%),
    linear-gradient(128deg, transparent 0 58%, rgba(14, 165, 233, 0.2) 58% 62%, transparent 62% 100%);
  background-size: 34rpx 34rpx, 34rpx 34rpx, 100% 100%, 100% 100%;
}

/* 轨迹画布 */
.track-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* 地图标记点 */
.map-marker {
  position: absolute;
  width: 18rpx;
  height: 18rpx;
  border-radius: 50%;
  border: 4rpx solid #fff;
  box-shadow: 0 4rpx 10rpx rgba(15, 23, 42, 0.16);
  z-index: 10;
}

/* 起点标记 */
.start-marker {
  background: #22c55e;
  width: 22rpx;
  height: 22rpx;
}

/* 终点标记 */
.end-marker {
  background: #f97316;
  width: 22rpx;
  height: 22rpx;
}

/* 途经点标记 */
.way-marker {
  background: #0ea5e9;
  width: 14rpx;
  height: 14rpx;
  border-width: 3rpx;
}

/* 叠加信息层 */
.track-overlay {
  position: absolute;
  left: 12rpx;
  right: 12rpx;
  bottom: 12rpx;
  min-height: 54rpx;
  border-radius: 27rpx;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14rpx;
  box-sizing: border-box;
  box-shadow: 0 8rpx 18rpx rgba(15, 23, 42, 0.1);
}

.track-card .track-icon {
  flex: 0 0 auto;
  width: 34rpx;
  height: 34rpx;
  border-radius: 17rpx;
  color: #fff;
  background: #0ea5e9;
  font-size: 20rpx;
  font-weight: 700;
  line-height: 34rpx;
  text-align: center;
}

.track-info {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 8rpx;
}

.track-distance {
  color: #0f172a;
  font-size: 24rpx;
  font-weight: 700;
  white-space: nowrap;
}

.track-duration {
  color: #64748b;
  font-size: 21rpx;
  white-space: nowrap;
}

.track-card .card-title {
  font-size: 29rpx;
  font-weight: 700;
  line-height: 38rpx;
  margin-bottom: 8rpx;
  width: 100%;
  color: #1f2937;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.track-card .card-author {
  font-size: 23rpx;
  color: #64748b;
  line-height: 30rpx;
  margin-bottom: 12rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-card .card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10rpx;
  width: 100%;
}

.track-card .card-stats {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.track-card .track-badge {
  background: #e0f2fe;
  color: #0284c7;
  font-size: 21rpx;
  font-weight: 700;
  padding: 4rpx 10rpx;
  border-radius: 999rpx;
  min-width: 32rpx;
  text-align: center;
}

.track-card .likes {
  font-size: 22rpx;
  color: #64748b;
  white-space: nowrap;
}

.track-card .card-location {
  min-width: 0;
  flex: 1;
  font-size: 22rpx;
  color: #94a3b8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Compatibility for older rendered badge markup */
.track-card .track-badge.legacy {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 22rpx;
  font-weight: 600;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  min-width: 40rpx;
  text-align: center;
}
</style>

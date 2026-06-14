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
        <view class="map-background"></view>
        <!-- 轨迹线 -->
        <canvas 
          v-if="hasTrackPoints"
          canvas-id="trackPreviewCanvas"
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
        <view class="track-icon">🏃</view>
        <view class="track-info">
          <text class="track-distance">{{ locationText }}</text>
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
        <view class="card-location">轨迹路线</view> 
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
      
      // 绘制轨迹线
      ctx.beginPath()
      ctx.strokeStyle = '#667eea'
      ctx.lineWidth = 3
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
      
      // 绘制渐变阴影
      ctx.beginPath()
      ctx.strokeStyle = 'rgba(102, 126, 234, 0.3)'
      ctx.lineWidth = 6
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
  border-radius: 12rpx; 
  background-color: #fff; 
  overflow: hidden; 
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.1); 
  width: 100%; 
  box-sizing: border-box; 
} 

.track-card .card-content { 
  padding: 16rpx; 
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
.map-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #e8f4f8 0%, #f0f8f0 50%, #e8f4f8 100%);
  /* 添加网格效果 */
  background-image: 
    linear-gradient(90deg, rgba(200,220,240,0.3) 1px, transparent 1px),
    linear-gradient(rgba(200,220,240,0.3) 1px, transparent 1px);
  background-size: 20px 20px;
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
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 3px solid #fff;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  z-index: 10;
}

/* 起点标记 */
.start-marker {
  background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%);
  width: 20px;
  height: 20px;
  border-width: 3px solid #fff;
}

/* 终点标记 */
.end-marker {
  background: linear-gradient(135deg, #f44336 0%, #ff5722 100%);
  width: 20px;
  height: 20px;
  border-width: 3px solid #fff;
}

/* 途经点标记 */
.way-marker {
  background: linear-gradient(135deg, #2196F3 0%, #03A9F4 100%);
  width: 12px;
  height: 12px;
  border-width: 2px solid #fff;
}

/* 叠加信息层 */
.track-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60rpx;
  background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16rpx;
  box-sizing: border-box;
}

.track-card .track-icon {
  font-size: 40rpx;
}

.track-info {
  display: flex;
  align-items: center;
}

.track-distance {
  color: #fff;
  font-size: 28rpx;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

.track-card .card-title { 
  font-size: 28rpx; 
  font-weight: bold; 
  margin-bottom: 8rpx; 
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  color: #333;
} 

.track-card .card-author { 
  font-size: 24rpx; 
  color: #666; 
  margin-bottom: 12rpx; 
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
} 

.track-card .card-footer { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  width: 100%;
} 

.track-card .card-stats { 
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.track-card .track-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 22rpx;
  font-weight: 600;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  min-width: 40rpx;
  text-align: center;
}

.track-card .likes { 
  font-size: 24rpx; 
  color: #999; 
} 

.track-card .card-location { 
  font-size: 24rpx; 
  color: #999; 
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 60%;
} 
</style>
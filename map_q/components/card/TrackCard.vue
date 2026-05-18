<template> 
  <view 
    class="card track-card" 
    :style="{ '--card-height': height + 'rpx' }"> 
    <!-- 卡片上半部分：点击在地图上显示轨迹 --> 
    <view 
      class="card-media track-media"
      @tap="handleMediaTap">
      <view class="track-icon">🏃</view>
    </view> 
    <!-- 卡片下半部分：点击在地图上显示轨迹 -->
    <view 
      class="card-content"
      @tap="handleContentTap"> 
      <view class="card-title">{{ cardTitle }}</view> 
      <view class="card-author">{{ cardAuthor }}</view> 
      <view class="card-footer"> 
        <view class="card-location">{{ locationText }}</view> 
        <view class="card-stats">
          <text class="track-badge">迹</text>
          <text class="likes">{{ cardStats }}</text>
        </view> 
      </view> 
    </view> 
  </view> 
</template> 

<script> 
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
    } 
  },
  methods: {
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
  height: var(--card-height, 200rpx); 
  width: 100%; 
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
} 

.track-card .track-icon {
  font-size: 80rpx;
  opacity: 0.9;
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
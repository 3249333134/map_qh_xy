<template> 
  <view 
    class="card" 
    :style="{ '--card-height': height + 'rpx' }"> 
    <!-- 卡片上半部分：点击进入详情页并定位 --> 
    <view 
      class="card-media"
      @tap="handleMediaTap"
      @click="handleMediaTap"></view> 
    <!-- 卡片下半部分：点击只定位到地图 -->
    <view 
      class="card-content"
      @tap="handleContentTap"
      @click="handleContentTap"> 
      <view class="card-title">{{ cardTitle }}</view> 
      <view class="card-author">{{ cardAuthor }}</view> 
      <view class="card-footer"> 
        <view class="card-location">{{ locationText }}</view> 
        <view class="card-stats">{{ cardStats }}</view> 
      </view> 
    </view> 
  </view> 
</template> 

<script> 
export default { 
  name: 'CardItem', 
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
        (this.cardData.name || this.cardData.title) : '标题占位符' 
    }, 
    cardAuthor() { 
      return this.cardData && this.cardData.author ? this.cardData.author : '作者占位符' 
    }, 
    cardStats() { 
      if (this.cardData && this.cardData.likes) { 
        return `${this.cardData.likes} 赞` 
      } 
      return '0 赞' 
    }, 
    locationText() { 
      if (this.cardData && this.cardData.location && this.cardData.location.coordinates) { 
        const [lng, lat] = this.cardData.location.coordinates 
        return `${lat.toFixed(2)}, ${lng.toFixed(2)}` 
      } 
      return this.cardData && this.cardData.address ? this.cardData.address : '未知位置' 
    } 
  },
  methods: {
    // 上方媒体区域点击：进入详情页并定位
    handleMediaTap() {
      console.log('上方媒体区域被点击，准备跳转详情页并定位')
      this.$emit('media-tap', {
        cardData: this.cardData,
        index: this.index
      })
    },
    
    // 下方内容区域点击：只定位到地图
    handleContentTap() {
      console.log('下方内容区域被点击，准备定位到地图')
      this.$emit('content-tap', {
        cardData: this.cardData,
        index: this.index
      })
    }
  }
} 
</script> 

<style> 
/* 卡片样式 */ 
.card { 
  margin-bottom: 20rpx; 
  border-radius: 12rpx; 
  background-color: #fff; 
  overflow: hidden; 
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.1); 
  width: 100%; /* 确保卡片宽度为100% */
  box-sizing: border-box; /* 确保padding不会增加宽度 */
} 

.card-content { 
  padding: 16rpx; 
  width: 100%;
  box-sizing: border-box;
  cursor: pointer;
} 

.card-media { 
  background-color: #a0c4ff; 
  height: var(--card-height, 200rpx); 
  width: 100%; 
  cursor: pointer;
} 

.card-content { 
  padding: 16rpx; 
  width: 100%;
  box-sizing: border-box;
} 

.card-author { 
  font-size: 24rpx; 
  color: #666; 
  margin-bottom: 12rpx; 
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
} 

.card-footer { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  width: 100%;
} 

.card-stats { 
  font-size: 24rpx; 
  color: #999; 
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
} 

.card-location { 
  font-size: 24rpx; 
  color: #999; 
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 60%;
} 

.card-title { 
  font-size: 28rpx; 
  font-weight: bold; 
  margin-bottom: 8rpx; 
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
} 
</style>
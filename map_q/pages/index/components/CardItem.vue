<template> 
  <view 
    class="card" 
    :style="{ '--card-height': height + 'rpx' }"
    @tap="onCardTap"> 
    <!-- 卡片内容 --> 
    <view class="card-media"></view> 
    <view class="card-content"> 
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
      return this.cardData && this.cardData.name ? this.cardData.name : '标题占位符' 
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
    onCardTap() {
      this.$emit('card-tap', this.index)
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
} 

.card-media { 
  background-color: #a0c4ff; 
  height: var(--card-height, 200rpx); 
  width: 100%; 
} 

.card-content { 
  padding: 16rpx; 
} 

.card-title { 
  font-size: 28rpx; 
  font-weight: bold; 
  margin-bottom: 12rpx; 
  color: #333; 
  overflow: hidden; 
  text-overflow: ellipsis; 
  white-space: nowrap; 
} 

.card-author { 
  font-size: 24rpx; 
  color: #666; 
  margin-bottom: 12rpx; 
} 

.card-footer { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
} 

.card-stats { 
  font-size: 24rpx; 
  color: #999; 
} 

.card-location { 
  font-size: 24rpx; 
  color: #999; 
} 
</style>
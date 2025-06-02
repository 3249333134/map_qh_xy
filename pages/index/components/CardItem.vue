<template>
  <view 
    class="card"
    :style="{ '--card-height': height + 'rpx' }">
    <!-- 卡片内容 -->
    <view class="card-media"></view>
    <view class="card-content">
      <view class="card-title"></view>
      <view class="card-author"></view>
      <view class="card-footer">
        <view class="card-stats"></view>
        <view class="card-location"></view>
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
      required: true
    },
    columnType: {
      type: String,
      default: 'left'
    },
    index: {
      type: Number,
      required: true
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
  height: 40rpx;
  background-color: #ffadad;
  margin-bottom: 12rpx;
  border-radius: 4rpx;
}

.card-author {
  height: 30rpx;
  background-color: #caffbf;
  margin-bottom: 12rpx;
  border-radius: 4rpx;
  width: 60%;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-stats {
  height: 30rpx;
  width: 40%;
  background-color: #d3d3d3;
  border-radius: 4rpx;
}

.card-location {
  height: 30rpx;
  width: 30%;
  background-color: #fdffb6;
  border-radius: 4rpx;
}
</style>
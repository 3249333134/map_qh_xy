<template>
  <view class="search-box">
    <view class="search-input-wrapper">
      <view class="search-icon" aria-hidden="true"></view>
      <input 
        class="search-input" 
        :placeholder="placeholder"
        confirm-type="search"
        @input="onSearchInput"
      />
    </view>
  </view>
</template>

<script>
export default {
  name: 'SearchBox',
  props: {
    placeholder: {
      type: String,
      default: '搜索'
    }
  },
  methods: {
    onSearchInput(e) {
      this.$emit('search-input', e.detail.value)
    }
  }
}
</script>

<style scoped>
.search-box {
  padding: 20rpx;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 50rpx;
  padding: 0 30rpx;
  height: 80rpx;
}

.search-icon {
  width: 24rpx;
  height: 24rpx;
  border: 3rpx solid #999;
  border-radius: 50%;
  margin-right: 20rpx;
  position: relative;
}

.search-icon::after {
  content: '';
  position: absolute;
  width: 10rpx;
  height: 3rpx;
  right: -8rpx;
  bottom: -4rpx;
  border-radius: 3rpx;
  background: #999;
  transform: rotate(45deg);
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  border: none;
  background: transparent;
}
</style>

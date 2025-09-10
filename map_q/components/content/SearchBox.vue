<template>
  <view class="search-box">
    <view class="search-input-wrapper">
      <text class="search-icon">🔍</text>
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
  margin-right: 20rpx;
  font-size: 32rpx;
  color: #999;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  border: none;
  background: transparent;
}
</style>
<template>
  <view class="header">
    <view class="nav-bar">
      <view class="nav-left" @tap="goBack">
        <view class="back-btn">
          <text class="icon-back">‹</text>
        </view>
      </view>
      <view class="nav-center">
        <view class="user-info">
          <image class="avatar" :src="userInfo.avatar" mode="aspectFill"></image>
          <text class="username">{{ userInfo.name }}</text>
        </view>
      </view>
      <view class="nav-right">
        <view class="follow-btn" :class="{ followed: isFollowing }" @tap="toggleFollow">
          <text class="follow-text">{{ isFollowing ? '已关注' : '关注' }}</text>
        </view>
        <view class="share-btn" @tap="share">
          <text class="share-icon">⤴</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'Header',
  props: {
    userInfo: {
      type: Object,
      required: true
    },
    isFollowing: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    goBack() {
      this.$emit('back')
    },
    toggleFollow() {
      this.$emit('follow')
    },
    share() {
      this.$emit('share')
    }
  }
}
</script>

<style scoped>
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: transparent;
  padding-top: var(--status-bar-height);
}

.nav-bar {
  display: flex;
  align-items: center;
  height: 88rpx;
  padding: 0 24rpx;
}

.nav-left {
  flex-shrink: 0;
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

.icon-back {
  color: #ffffff;
  font-size: 48rpx;
  position: relative;
  top: -4rpx;
  font-weight: 300;
}

.nav-center {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.3);
  padding: 8rpx 20rpx;
  border-radius: 32rpx;
}

.avatar {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  margin-right: 12rpx;
  flex-shrink: 0;
  border: 2rpx solid rgba(255, 255, 255, 0.5);
}

.username {
  color: #ffffff;
  font-size: 26rpx;
  font-weight: 500;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex-shrink: 0;
}

.follow-btn {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 24rpx;
  padding: 8rpx 20rpx;
}

.follow-btn.followed {
  background: rgba(255, 255, 255, 0.15);
}

.follow-text {
  color: #ffffff;
  font-size: 24rpx;
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

.share-icon {
  color: #ffffff;
  font-size: 28rpx;
}
</style>
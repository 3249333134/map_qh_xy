<template>
  <view class="header">
    <view class="nav-bar">
      <view class="nav-left" @tap="goBack">
        <text class="icon-back">‹</text>
      </view>
      <view class="nav-center">
        <view class="user-info">
          <image class="avatar" :src="userInfo.avatar" mode="aspectFill"></image>
          <text class="username">{{ userInfo.name }}</text>
        </view>
      </view>
      <view class="nav-right">
        <view class="follow-btn" :class="{ followed: userInfo.isFollowed }" @tap="toggleFollow">
          <text>{{ userInfo.isFollowed ? '已关注' : '关注' }}</text>
        </view>
        <text class="share-icon" @tap="share">⤴</text>
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
    }
  },
  emits: ['back', 'follow', 'share'],
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
  background: #ffffff;
  padding-top: calc(var(--status-bar-height) + 29px);
}

.nav-bar {
  display: flex;
  align-items: center;
  height: 44px;
  padding: 0 16px;
}

.nav-center {
  flex: 1;
  display: flex;
  justify-content: flex-start;
  align-items: flex-end;
  margin-left: 0;
  padding-left: 8px;
  padding-bottom: 4px;
}

.nav-right {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  padding-bottom: 4px;
}

.user-info {
  display: flex;
  align-items: center;
}

.avatar {
  width: 39px;
  height: 39px;
  border-radius: 16px;
  margin-right: 8px;
  flex-shrink: 0;
}

.username {
  color: #000000;
  font-size: 16px;
  font-weight: 500;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 100%;
  margin-right: 80px;
}

.follow-btn {
  background: rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 16px;
  padding: 4px 12px;
}

.follow-btn.followed {
  background: rgba(0, 0, 0, 0.15);
}

.follow-btn text {
  color: #000000;
  font-size: 14px;
}

.icon-back {
  color: #000000;
  font-size: 36px;
  position: relative;
  top: -2px;
}

.share-icon {
  color: #000000;
  font-size: 20px;
}
</style>
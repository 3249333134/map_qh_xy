<template>
  <view class="profile-section">
    <view class="profile-content">
      <view class="avatar-container">
        <image class="avatar" :src="userInfo.avatar" mode="aspectFill" />
      </view>
      
      <view class="user-info">
        <text class="username">{{ userInfo.username }}</text>
        <text class="user-desc">{{ userInfo.description }}</text>
      </view>
      
      <view class="profile-stats">
        <view class="stat-item" v-for="(stat, index) in stats" :key="index">
          <text class="stat-number">{{ stat.number }}</text>
          <text class="stat-label">{{ stat.label }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'ProfileSection',
  props: {
    userInfo: {
      type: Object,
      default: () => ({
        avatar: '/static/logo.png',
        username: '用户名',
        description: '这里是用户描述信息'
      })
    },
    stats: {
      type: Array,
      default: () => [
        { number: 128, label: '关注' },
        { number: 256, label: '粉丝' },
        { number: 32, label: '动态' }
      ]
    }
  }
}
</script>

<style scoped>
.profile-section {
  width: 100%;
  height: 350px;
  background: linear-gradient(180deg, #e8e8e8 0%, #d0d0d0 100%);
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1;
}

.profile-content {
  padding: 80px 30px 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #333;
  height: 100%;
}

.avatar-container {
  margin-bottom: 20px;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 40px;
  border: 3px solid rgba(255, 255, 255, 0.8);
}

.user-info {
  text-align: center;
  margin-bottom: 30px;
}

.username {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8px;
}

.user-desc {
  font-size: 14px;
  color: #666;
  display: block;
}

.profile-stats {
  display: flex;
  justify-content: space-around;
  width: 100%;
  max-width: 300px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}
</style>
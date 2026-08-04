<template>
  <view class="page">
    <view class="status-spacer" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="nav-bar">
      <view class="nav-back" @tap="goBack">‹</view>
      <text class="nav-title">编辑资料</text>
      <view class="nav-right nav-btn" @tap="onSave">保存</view>
    </view>

    <scroll-view class="content" scroll-y show-scrollbar="false">
      <!-- 头像区域 -->
      <view class="avatar-area">
        <view class="avatar">
          <text class="avatar-text">用</text>
        </view>
        <view class="avatar-change" @tap="onChangeAvatar">更换头像</view>
      </view>

      <!-- 资料列表 -->
      <view class="list-card">
        <view class="list-row">
          <text class="row-label">用户名</text>
          <input class="row-input" v-model="username" placeholder="请输入用户名" />
        </view>
        <view class="list-row">
          <text class="row-label">个人描述</text>
          <input class="row-input" v-model="desc" placeholder="填写个人描述" />
        </view>
        <view class="list-row">
          <text class="row-label">地区</text>
          <view class="row-value-text" @tap="onPickRegion">{{ region }}<text class="row-arrow">›</text></view>
        </view>
        <view class="list-row last" @tap="onBg">
          <text class="row-label">主页背景</text>
          <view class="row-value-text">选择<text class="row-arrow">›</text></view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { profileApi } from '../../utils/api/social.js'

const statusBarHeight = ref(20)
onMounted(() => {
  try {
    const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
    statusBarHeight.value = info.statusBarHeight || 20
  } catch (e) {}
  const profile = profileApi.get()
  username.value = profile.username
  desc.value = profile.description
})

const goBack = () => uni.navigateBack()

const username = ref('用户名')
const desc = ref('这里是用户描述信息')
const region = ref('成都')

const onSave = () => {
  if (!username.value.trim()) return uni.showToast({ title: '用户名不能为空', icon: 'none' })
  profileApi.patch({ username: username.value.trim(), description: desc.value.trim() })
  uni.showToast({ title: '资料已保存', icon: 'success' })
  setTimeout(() => uni.navigateBack(), 400)
}
const onChangeAvatar = () => uni.showToast({ title: '更换头像', icon: 'none' })
const onPickRegion = () => uni.showToast({ title: '选择地区', icon: 'none' })
const onBg = () => uni.showToast({ title: '选择主页背景', icon: 'none' })
</script>

<style scoped>
.page {
  --brand-blue: var(--color-info);
  --brand-orange: var(--color-primary);
  --brand-purple: var(--color-info);
  --success: #24d06c;
  --text-primary: #222;
  --text-body: #5f646d;
  --text-secondary: #8a8f98;
  --surface-app: #f7f7f8;
  --surface-card: #fff;
  --surface-muted: #f0f1f3;
  --card-shadow: 0 1px 8px rgba(18, 24, 38, 0.06);
  min-height: 100vh;
  background: var(--surface-app);
  display: flex;
  flex-direction: column;
}

.status-spacer { width: 100%; }

.nav-bar {
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: var(--surface-card);
  border-bottom: 1rpx solid #f1f5f9;
}

.nav-back {
  position: absolute;
  left: 24rpx;
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44rpx;
  color: var(--text-primary);
  line-height: 44rpx;
}

.nav-title {
  font-size: 32rpx;
  font-weight: 700;
  color: var(--text-primary);
}

.nav-right {
  position: absolute;
  right: 24rpx;
}

.nav-btn {
  padding: 10rpx 28rpx;
  border-radius: 28rpx;
  color: #fff;
  font-size: 26rpx;
  font-weight: 600;
  background: linear-gradient(135deg, #ff8a4a 0%, #ff5b35 100%);
  line-height: 40rpx;
}

.content { flex: 1; }

.avatar-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 0 40rpx;
}

.avatar {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: var(--color-info);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--card-shadow);
}

.avatar-text {
  font-size: 56rpx;
  color: #fff;
  font-weight: 700;
}

.avatar-change {
  margin-top: 20rpx;
  padding: 12rpx 32rpx;
  border-radius: 28rpx;
  background: var(--surface-card);
  color: var(--brand-blue);
  font-size: 26rpx;
  font-weight: 600;
  box-shadow: var(--card-shadow);
}

.list-card {
  margin: 0 24rpx 24rpx;
  background: var(--surface-card);
  border-radius: 20rpx;
  box-shadow: var(--card-shadow);
  overflow: hidden;
}

.list-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 28rpx;
  border-bottom: 1rpx solid #f4f5f6;
  min-height: 48rpx;
}

.list-row.last { border-bottom: none; }

.row-label {
  font-size: 30rpx;
  color: var(--text-primary);
  font-weight: 500;
  flex-shrink: 0;
}

.row-input {
  flex: 1;
  text-align: right;
  font-size: 28rpx;
  color: var(--text-body);
  margin-left: 24rpx;
}

.row-value-text {
  display: flex;
  align-items: center;
  font-size: 28rpx;
  color: var(--text-secondary);
}

.row-arrow {
  font-size: 36rpx;
  color: var(--text-secondary);
  line-height: 36rpx;
  margin-left: 8rpx;
}
</style>

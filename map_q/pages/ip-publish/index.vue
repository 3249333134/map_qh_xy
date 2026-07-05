<template>
  <view class="ip-page">
    <!-- Fixed Top Navigation Bar -->
    <view class="nav-container" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="nav-bar" :style="{ paddingRight: rightPadding + 'rpx' }">
        <button class="nav-btn cancel" @click="goBack">取消</button>
        <view class="nav-center">
          <text class="nav-title">IP 内容发布</text>
          <text class="nav-icon">♛</text>
        </view>
        <button class="nav-btn submit" @click="handlePublish">发布</button>
      </view>
    </view>

    <!-- Scrollable Content -->
    <scroll-view class="content" scroll-y :style="{ paddingTop: totalNavHeight + 'px' }">
      <!-- IP Binding Card -->
      <view class="ip-card">
        <view class="avatar-wrap">
          <view class="avatar-ring">
            <view class="avatar-inner">
              <text class="avatar-placeholder">👤</text>
            </view>
          </view>
        </view>
        <view class="ip-info">
          <text class="ip-name">治愈系小怪兽</text>
          <text class="ip-desc">治愈系小怪兽 IP</text>
        </view>
        <button class="change-btn" @click="handleChangeIP">更换</button>
      </view>

      <!-- Text Input Area -->
      <view class="input-section">
        <view class="input-box">
          <textarea
            class="textarea"
            v-model="content"
            placeholder="分享你的 IP 故事、新作品或周边"
            maxlength="500"
            :rows="5"
          />
          <text class="word-count">{{ content.length }}/500</text>
        </view>
      </view>

      <!-- Image/Video Picker -->
      <view class="media-section">
        <view class="media-grid">
          <view v-for="(item, index) in mediaList" :key="index" class="media-item">
            <image v-if="item" class="media-image" :src="item" mode="aspectFill" />
            <button class="delete-btn" @click="removeMedia(index)">
              <text class="delete-icon">×</text>
            </button>
          </view>
          <button v-if="mediaList.length < 9" class="media-add" @click="addMedia">
            <text class="add-icon">+</text>
          </button>
        </view>
      </view>

      <!-- IP Exclusive Feature Section -->
      <view class="ip-section">
        <text class="section-title">IP 专属</text>

        <!-- IP Tags -->
        <view class="tag-block">
          <view class="tag-header">
            <text class="tag-title">IP 标签</text>
            <button class="edit-btn" @click="handleEditTags">编辑</button>
          </view>
          <view class="tag-list">
            <text v-for="(tag, index) in ipTags" :key="index" class="ip-tag" :style="tagStyle(index)">
              {{ tag }}
            </text>
          </view>
        </view>

        <!-- Copyright Toggle Row -->
        <view class="ip-row" @click="toggleCopyright">
          <view class="ip-row-left">
            <text class="ip-row-title">版权声明</text>
            <text class="ip-row-sub">发布后带版权保护标识</text>
          </view>
          <view class="toggle" :class="{ active: hasCopyright }">
            <view class="toggle-dot" />
          </view>
        </view>

        <!-- IP Series Classification Row -->
        <view class="ip-row" @click="handleSelectSeries">
          <text class="ip-row-title">选择 IP 系列</text>
          <view class="ip-row-right">
            <text class="ip-row-value">{{ selectedSeries }}</text>
            <text class="ip-row-arrow">›</text>
          </view>
        </view>

        <!-- Authorization Row -->
        <view class="ip-row" @click="handleSelectAuth">
          <text class="ip-row-title">授权方式</text>
          <view class="ip-row-right">
            <text class="ip-row-value">{{ authType }}</text>
            <text class="ip-row-arrow">›</text>
          </view>
        </view>
      </view>

      <view class="safe-bottom" />
    </scroll-view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      content: '',
      mediaList: [],
      ipTags: ['#小怪兽日常', '#原创 IP', '#治愈系'],
      hasCopyright: true,
      selectedSeries: '日常篇',
      authType: '禁止转载',
      statusBarHeight: 0,
      rightPadding: 40,
      totalNavHeight: 0
    }
  },
  created() {
    try {
      const windowInfo = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
      const windowWidth = windowInfo.windowWidth || 375
      const pxToRpx = 750 / windowWidth

      const metrics = uni.getStorageSync('TOP_NAV_METRICS') || null
      if (metrics) {
        this.statusBarHeight = metrics.statusPx || 0
      } else {
        this.statusBarHeight = (windowInfo && windowInfo.statusBarHeight) || 0
      }

      const navBarHeightPx = 88 / pxToRpx
      this.totalNavHeight = this.statusBarHeight + navBarHeightPx

      const menuBtnInfo = uni.getMenuButtonBoundingClientRect ? uni.getMenuButtonBoundingClientRect() : null
      if (menuBtnInfo) {
        const menuRight = windowWidth - menuBtnInfo.left
        this.rightPadding = Math.round(Math.max(menuRight + 32, 90) * pxToRpx)
      } else {
        this.rightPadding = 180
      }
    } catch (e) {
      this.statusBarHeight = 0
      this.rightPadding = 40
      this.totalNavHeight = 44
    }
  },
  methods: {
    goBack() {
      uni.navigateBack({ fail: () => uni.switchTab({ url: '/pages/index/index' }) })
    },
    handlePublish() {
      if (!this.content.trim() && this.mediaList.length === 0) {
        uni.showToast({ title: '请输入内容', icon: 'none' })
        return
      }
      uni.showToast({ title: '发布成功', icon: 'success' })
      setTimeout(() => this.goBack(), 1200)
    },
    addMedia() {
      uni.chooseImage({
        count: 9 - this.mediaList.length,
        success: (res) => {
          this.mediaList = [...this.mediaList, ...res.tempFilePaths]
        }
      })
    },
    removeMedia(index) {
      this.mediaList.splice(index, 1)
    },
    handleChangeIP() {
      uni.showToast({ title: '更换 IP', icon: 'none' })
    },
    handleEditTags() {
      uni.showToast({ title: '编辑标签', icon: 'none' })
    },
    toggleCopyright() {
      this.hasCopyright = !this.hasCopyright
    },
    handleSelectSeries() {
      const options = ['日常篇', '冒险篇', '节日篇', '限定篇']
      uni.showActionSheet({
        itemList: options,
        success: (res) => {
          this.selectedSeries = options[res.tapIndex]
        }
      })
    },
    handleSelectAuth() {
      const options = ['禁止转载', '署名转载', '商业授权']
      uni.showActionSheet({
        itemList: options,
        success: (res) => {
          this.authType = options[res.tapIndex]
        }
      })
    },
    tagStyle(index) {
      const colors = [
        { bg: 'rgba(255, 107, 157, 0.12)', color: '#FF6B9D' },
        { bg: 'rgba(196, 77, 255, 0.12)', color: '#C44DFF' },
        { bg: 'rgba(255, 107, 157, 0.12)', color: '#FF6B9D' }
      ]
      const c = colors[index % colors.length]
      return { background: c.bg, color: c.color }
    }
  }
}
</script>

<style scoped>
.ip-page {
  min-height: 100vh;
  background: #ffffff;
}

.nav-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: #ffffff;
  border-bottom: 1rpx solid #eeeeee;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: 0 40rpx;
}

.nav-btn {
  font-size: 28rpx;
  background: transparent;
  border: none;
  padding: 0;
  margin: 0;
  line-height: 1;
}

.nav-btn::after {
  border: none;
}

.nav-btn.cancel {
  color: #666666;
}

.nav-btn.submit {
  color: #ffffff;
  background: linear-gradient(135deg, #FF6B9D, #C44DFF);
  padding: 10rpx 28rpx;
  border-radius: 12rpx;
  font-weight: 600;
}

.nav-center {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.nav-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1A1A1A;
}

.nav-icon {
  font-size: 24rpx;
  background: linear-gradient(135deg, #FF6B9D, #C44DFF);
  -webkit-background-clip: text;
  color: transparent;
}

.content {
  padding-bottom: 32rpx;
  height: 100vh;
  box-sizing: border-box;
}

.ip-card {
  margin: 32rpx 40rpx 0;
  display: flex;
  align-items: center;
  padding: 32rpx;
  border-radius: 24rpx;
  background: rgba(255, 107, 157, 0.1);
}

.avatar-wrap {
  position: relative;
  width: 96rpx;
  height: 96rpx;
  flex-shrink: 0;
}

.avatar-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: linear-gradient(135deg, #FF6B9D, #C44DFF);
  padding: 4rpx;
}

.avatar-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-placeholder {
  font-size: 40rpx;
  color: #999999;
}

.ip-info {
  flex: 1;
  min-width: 0;
  margin-left: 24rpx;
}

.ip-name {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #1A1A1A;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ip-desc {
  display: block;
  font-size: 24rpx;
  color: #999999;
  margin-top: 8rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.change-btn {
  margin-left: 24rpx;
  font-size: 28rpx;
  color: #999999;
  background: transparent;
  padding: 0;
  flex-shrink: 0;
}

.change-btn::after {
  border: none;
}

.input-section {
  margin: 32rpx 40rpx 0;
}

.input-box {
  position: relative;
  border-radius: 16rpx;
  background: #F5F5F7;
  padding: 24rpx;
  min-height: 200rpx;
}

.textarea {
  width: 100%;
  min-height: 152rpx;
  font-size: 28rpx;
  line-height: 1.6;
  color: #1A1A1A;
  background: transparent;
  border: none;
  resize: none;
  outline: none;
}

.word-count {
  display: block;
  text-align: right;
  font-size: 24rpx;
  color: #999999;
  margin-top: 8rpx;
}

.media-section {
  margin: 32rpx 40rpx;
}

.media-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.media-item,
.media-add {
  width: calc((100% - 24rpx) / 3);
  aspect-ratio: 1;
  border-radius: 16rpx;
  overflow: hidden;
  position: relative;
}

.media-image {
  width: 100%;
  height: 100%;
}

.delete-btn {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0;
}

.delete-btn::after {
  border: none;
}

.delete-icon {
  color: #ffffff;
  font-size: 28rpx;
  line-height: 1;
}

.media-add {
  background: #F5F5F7;
  border: 2rpx dashed #EEEEEE;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-icon {
  font-size: 48rpx;
  color: #999999;
  line-height: 1;
}

.ip-section {
  margin: 0 40rpx;
}

.section-title {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #1A1A1A;
  margin-bottom: 24rpx;
}

.tag-block {
  margin-bottom: 32rpx;
}

.tag-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.tag-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #1A1A1A;
}

.edit-btn {
  font-size: 24rpx;
  color: #999999;
  background: transparent;
  padding: 0;
}

.edit-btn::after {
  border: none;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.ip-tag {
  font-size: 24rpx;
  padding: 8rpx 20rpx;
  border-radius: 12rpx;
}

.ip-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 0;
  border-bottom: 1rpx solid #F0F0F0;
}

.ip-row-left {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.ip-row-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #1A1A1A;
}

.ip-row-sub {
  font-size: 24rpx;
  color: #999999;
}

.ip-row-right {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.ip-row-value {
  font-size: 28rpx;
  color: #666666;
}

.ip-row-arrow {
  font-size: 32rpx;
  color: #999999;
}

.toggle {
  width: 88rpx;
  height: 48rpx;
  border-radius: 9999rpx;
  background: #e5e5e5;
  position: relative;
  transition: background 0.2s;
  flex-shrink: 0;
}

.toggle.active {
  background: linear-gradient(135deg, #FF6B9D, #C44DFF);
}

.toggle-dot {
  position: absolute;
  top: 4rpx;
  right: 4rpx;
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: #ffffff;
  transition: transform 0.2s;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.1);
}

.toggle.active .toggle-dot {
  transform: translateX(-40rpx);
}

.safe-bottom {
  height: calc(env(safe-area-inset-bottom) + 34rpx);
}
</style>

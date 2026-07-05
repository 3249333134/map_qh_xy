<template>
  <view class="publish-page">
    <!-- Fixed Top Navigation Bar -->
    <view class="nav-container" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="nav-bar" :style="{ paddingRight: rightPadding + 'rpx' }">
        <button class="nav-btn cancel" @click="goBack">取消</button>
        <text class="nav-title">发布动态</text>
        <button class="nav-btn submit" @click="handlePublish">发布</button>
      </view>
    </view>

    <!-- Scrollable Content Area -->
    <scroll-view class="content" scroll-y :style="{ paddingTop: totalNavHeight + 'px' }">
      <!-- Text Input Area -->
      <view class="input-section">
        <textarea
          class="textarea"
          v-model="content"
          placeholder="分享你的创作、想法或日常..."
          maxlength="500"
          :rows="5"
        />
        <text class="word-count">{{ content.length }}/500</text>
      </view>

      <!-- Image/Video Picker - 9-Grid Layout -->
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

      <!-- Feature Options List -->
      <view class="options-section">
        <view class="option-row" @click="handleTopic">
          <view class="option-left">
            <text class="option-icon">#</text>
            <text class="option-text">添加话题</text>
          </view>
          <text class="option-arrow">›</text>
        </view>
        <view class="option-row" @click="handleMention">
          <view class="option-left">
            <text class="option-icon">@</text>
            <text class="option-text">@好友</text>
          </view>
          <text class="option-arrow">›</text>
        </view>
        <view class="option-row" @click="handleLocation">
          <view class="option-left">
            <text class="option-icon">📍</text>
            <text class="option-text">添加位置</text>
          </view>
          <text class="option-arrow">›</text>
        </view>
        <view class="option-row" @click="handlePrivacy">
          <view class="option-left">
            <text class="option-icon">🔒</text>
            <text class="option-text">谁可以看</text>
          </view>
          <view class="option-right">
            <text class="option-value">{{ privacyText }}</text>
            <text class="option-arrow">›</text>
          </view>
        </view>
        <view class="option-row" @click="toggleOriginal">
          <view class="option-left">
            <text class="option-icon">✓</text>
            <text class="option-text">原创声明</text>
          </view>
          <view class="toggle" :class="{ active: isOriginal }">
            <view class="toggle-dot" />
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
      privacyText: '公开',
      isOriginal: true,
      statusBarHeight: 0,
      navBarHeight: 88,
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
        uni.showToast({ title: '请输入内容或添加图片', icon: 'none' })
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
    handleTopic() {
      uni.showToast({ title: '添加话题', icon: 'none' })
    },
    handleMention() {
      uni.showToast({ title: '@好友', icon: 'none' })
    },
    handleLocation() {
      uni.showToast({ title: '添加位置', icon: 'none' })
    },
    handlePrivacy() {
      const options = ['公开', '仅好友可见', '私密']
      uni.showActionSheet({
        itemList: options,
        success: (res) => {
          this.privacyText = options[res.tapIndex]
        }
      })
    },
    toggleOriginal() {
      this.isOriginal = !this.isOriginal
    }
  }
}
</script>

<style scoped>
.publish-page {
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
  padding: 12rpx 28rpx;
  border-radius: 9999rpx;
  font-weight: 600;
}

.nav-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1A1A1A;
}

.content {
  padding-bottom: 32rpx;
  height: 100vh;
  box-sizing: border-box;
}

.input-section {
  position: relative;
  margin: 32rpx 40rpx 0;
  max-height: 40vh;
}

.textarea {
  width: 100%;
  min-height: 240rpx;
  max-height: 40vh;
  font-size: 28rpx;
  line-height: 1.6;
  color: #1A1A1A;
  background: transparent;
  border: none;
  resize: none;
  outline: none;
}

.word-count {
  position: absolute;
  bottom: 16rpx;
  right: 0;
  font-size: 24rpx;
  color: #999999;
}

.media-section {
  margin: 32rpx 40rpx;
}

.media-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.media-item,
.media-add {
  width: calc((100% - 32rpx) / 3);
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

.options-section {
  margin: 40rpx 40rpx 0;
}

.option-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 96rpx;
  border-bottom: 1rpx solid #F0F0F0;
}

.option-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.option-icon {
  font-size: 32rpx;
  width: 40rpx;
  text-align: center;
}

.option-text {
  font-size: 28rpx;
  color: #1A1A1A;
}

.option-right {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.option-value {
  font-size: 26rpx;
  color: #999999;
}

.option-arrow {
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

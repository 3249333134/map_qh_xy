<template>
  <view class="sandbox-page">
    <!-- Top Navigation Bar -->
    <view class="nav-container" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="nav-bar" :style="{ paddingRight: rightPadding + 'rpx' }">
        <button class="nav-btn cancel" @click="goBack">取消</button>
        <view class="nav-center">
          <text class="nav-title">沙盒创作</text>
          <text class="nav-icon">⬡</text>
        </view>
        <button class="nav-btn save" @click="handleSave">保存</button>
      </view>
    </view>

    <!-- Scrollable Content -->
    <scroll-view class="content" scroll-y :style="{ paddingTop: totalNavHeight + 'px' }">
      <!-- Text Input Area -->
      <view class="input-section">
        <textarea
          class="textarea"
          v-model="content"
          placeholder="记录你的灵感草稿，仅自己可见"
          maxlength="500"
          :rows="5"
        />
        <text class="word-count">{{ content.length }}/500</text>
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

      <!-- Sandbox Exclusive Feature Section -->
      <view class="sandbox-section">
        <view class="sandbox-header">
          <text class="sandbox-icon">⬡</text>
          <text class="sandbox-title">沙盒功能</text>
        </view>

        <view class="sandbox-divider" />

        <!-- 沙盒分类 -->
        <view class="category-block">
          <text class="block-label">沙盒分类</text>
          <view class="category-list">
            <button
              v-for="(cat, index) in categories"
              :key="index"
              class="category-tag"
              :class="{ active: selectedCategory === cat }"
              @click="selectCategory(cat)"
            >
              {{ cat }}
            </button>
            <button class="category-tag custom" @click="addCustomCategory">
              <text class="plus">+</text>
              <text>自定义</text>
            </button>
          </view>
        </view>

        <view class="sandbox-divider" />

        <!-- 定时发布 -->
        <view class="row" @click="toggleSchedule">
          <view class="row-left">
            <text class="row-icon">⏰</text>
            <text class="row-text">定时发布</text>
          </view>
          <view class="toggle" :class="{ active: isScheduled }">
            <view class="toggle-dot" />
          </view>
        </view>

        <view v-if="isScheduled" class="schedule-picker" @click="pickScheduleTime">
          <text class="picker-label">{{ scheduleTime || '选择发布时间' }}</text>
          <text class="picker-arrow">›</text>
        </view>

        <view class="sandbox-divider" />

        <!-- 预览效果 -->
        <view class="row" @click="handlePreview">
          <view class="row-left">
            <text class="row-icon">👁</text>
            <text class="row-text">预览发布效果</text>
          </view>
          <text class="row-arrow">›</text>
        </view>

        <view class="sandbox-divider" />

        <!-- 测试分享 -->
        <view class="row" @click="handleTestShare">
          <view class="row-left column">
            <view class="row-title-wrap">
              <text class="row-icon">↗</text>
              <text class="row-text">分享给指定好友测试</text>
            </view>
            <text class="row-sub">仅受邀好友可见，不影响公开记录</text>
          </view>
          <text class="row-arrow">›</text>
        </view>
      </view>

      <view class="safe-bottom" />
    </scroll-view>

    <!-- Bottom Action Bar -->
    <view class="bottom-bar">
      <button class="bottom-btn draft" @click="handleDraft">存入草稿箱</button>
      <button class="bottom-btn publish" @click="handlePublish">发布到公开</button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      content: '',
      mediaList: [],
      categories: ['灵感', '待完善', '测试'],
      selectedCategory: '灵感',
      isScheduled: false,
      scheduleTime: '',
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
    handleSave() {
      uni.showToast({ title: '已保存', icon: 'success' })
    },
    handlePublish() {
      if (!this.content.trim() && this.mediaList.length === 0) {
        uni.showToast({ title: '请输入内容', icon: 'none' })
        return
      }
      uni.showToast({ title: '发布成功', icon: 'success' })
      setTimeout(() => this.goBack(), 1200)
    },
    handleDraft() {
      uni.showToast({ title: '已存入草稿箱', icon: 'success' })
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
    selectCategory(cat) {
      this.selectedCategory = cat
    },
    addCustomCategory() {
      uni.showModal({
        title: '自定义分类',
        editable: true,
        placeholderText: '输入分类名称',
        success: (res) => {
          if (res.confirm && res.content) {
            this.categories.push(res.content)
            this.selectedCategory = res.content
          }
        }
      })
    },
    toggleSchedule() {
      this.isScheduled = !this.isScheduled
    },
    pickScheduleTime() {
      const now = new Date()
      const pad = (n) => (n < 10 ? '0' + n : n)
      this.scheduleTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
      uni.showToast({ title: this.scheduleTime, icon: 'none' })
    },
    handlePreview() {
      uni.showToast({ title: '预览效果', icon: 'none' })
    },
    handleTestShare() {
      uni.showToast({ title: '选择测试好友', icon: 'none' })
    }
  }
}
</script>

<style scoped>
.sandbox-page {
  min-height: 100vh;
  background: #ffffff;
  padding-bottom: 140rpx;
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

.nav-btn.save {
  color: #ffffff;
  background: #C44DFF;
  padding: 10rpx 26rpx;
  border-radius: 9999rpx;
  font-weight: 500;
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
  font-size: 28rpx;
  color: #C44DFF;
}

.content {
  padding-bottom: 140rpx;
  height: 100vh;
  box-sizing: border-box;
}

.input-section {
  position: relative;
  margin: 32rpx 40rpx 0;
}

.textarea {
  width: 100%;
  min-height: 200rpx;
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
  bottom: 0;
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
  background: transparent;
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

.sandbox-section {
  margin: 0 40rpx;
  border-radius: 24rpx;
  overflow: hidden;
  background: rgba(196, 77, 255, 0.1);
}

.sandbox-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 32rpx 32rpx 20rpx;
}

.sandbox-icon {
  font-size: 28rpx;
  color: #C44DFF;
}

.sandbox-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #C44DFF;
}

.sandbox-divider {
  height: 1rpx;
  margin: 0 32rpx;
  background: rgba(196, 77, 255, 0.15);
}

.category-block {
  padding: 24rpx 32rpx;
}

.block-label {
  display: block;
  font-size: 24rpx;
  color: #666666;
  margin-bottom: 16rpx;
}

.category-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.category-tag {
  font-size: 24rpx;
  padding: 8rpx 24rpx;
  border-radius: 9999rpx;
  background: #F5F5F7;
  color: #666666;
  line-height: 1;
}

.category-tag::after {
  border: none;
}

.category-tag.active {
  background: #C44DFF;
  color: #ffffff;
}

.category-tag.custom {
  background: transparent;
  border: 1rpx dashed rgba(196, 77, 255, 0.4);
  color: #C44DFF;
  display: flex;
  align-items: center;
  gap: 4rpx;
}

.plus {
  font-size: 24rpx;
  font-weight: 700;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;
}

.row-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.row-left.column {
  flex-direction: column;
  align-items: flex-start;
  gap: 8rpx;
}

.row-title-wrap {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.row-icon {
  font-size: 28rpx;
  color: #C44DFF;
  width: 36rpx;
  text-align: center;
}

.row-text {
  font-size: 28rpx;
  color: #1A1A1A;
}

.row-sub {
  font-size: 22rpx;
  color: #999999;
  padding-left: 52rpx;
}

.row-arrow {
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
  background: #C44DFF;
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

.schedule-picker {
  margin: 0 32rpx 20rpx;
  padding: 20rpx 24rpx;
  border-radius: 16rpx;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.picker-label {
  font-size: 24rpx;
  color: #999999;
}

.picker-arrow {
  font-size: 28rpx;
  color: #999999;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 101;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 40rpx calc(24rpx + env(safe-area-inset-bottom));
  background: #ffffff;
  border-top: 1rpx solid #eeeeee;
}

.bottom-btn {
  font-size: 28rpx;
  border-radius: 9999rpx;
  padding: 0 32rpx;
  height: 80rpx;
  line-height: 80rpx;
}

.bottom-btn::after {
  border: none;
}

.bottom-btn.draft {
  color: #666666;
  background: transparent;
}

.bottom-btn.publish {
  color: #ffffff;
  background: linear-gradient(135deg, #FF6B9D, #C44DFF);
  font-weight: 600;
}

.safe-bottom {
  height: 120rpx;
}
</style>

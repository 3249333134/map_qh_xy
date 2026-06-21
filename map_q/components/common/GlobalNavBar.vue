<template>
  <view class="global-nav-bar" :class="{ 'is-transparent': transparent }">
    <!-- 状态栏占位 -->
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
    <!-- 导航栏主体 -->
    <view class="nav-bar" :style="{ height: navBarHeight + 'px' }">
      <view class="left-content">
        <slot name="left"></slot>
      </view>
      <view class="center-content">
        <slot name="center">
          <text v-if="title" class="nav-title">{{ title }}</text>
        </slot>
      </view>
      <view class="right-content">
        <slot name="right"></slot>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'GlobalNavBar',
  props: {
    title: {
      type: String,
      default: ''
    },
    transparent: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      statusBarHeight: 0,
      navBarHeight: 44 // 默认导航栏高度
    };
  },
  created() {
    // 优先读取全局缓存的度量，保证与原生导航一致
    try {
      const metrics = uni.getStorageSync('TOP_NAV_METRICS') || null
      if (metrics) {
        this.statusBarHeight = metrics.statusPx || 0
        this.navBarHeight = metrics.navPx || 44
        return
      }
    } catch (e) {}
    // 回退：直接读取窗口信息
    const windowInfo = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync();
    this.statusBarHeight = (windowInfo && windowInfo.statusBarHeight) || 0;
  }
};
</script>

<style scoped>
.global-nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 999;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e7e7e7;
}

.global-nav-bar.is-transparent {
  background-color: transparent;
  border-bottom: none;
}

.status-bar {
  width: 100%;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
}

.left-content,
.right-content {
  flex: 0 0 25%;
  display: flex;
  align-items: center;
}

.right-content {
  justify-content: flex-end;
}

.center-content {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.nav-title {
  font-size: 17px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
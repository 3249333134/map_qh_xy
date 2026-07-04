<template>
  <view>
    <!-- 全局弹出菜单组件（App级别兜底渲染） -->
    <PublishOverlay :show="showPublishOverlay" @close="closePublishOverlay" />
  </view>
</template>

<script>
import PublishOverlay from './components/PublishOverlay.vue'

export default {
  components: {
    PublishOverlay
  },
  data() {
    return {
      showPublishOverlay: false
    }
  },
  onLaunch: function() {
    console.log('App Launch')
    
    // 初始化全局数据
    this.globalData = {
      showPublishOverlay: false,
      QQ_MAP_KEY: 'ISSBZ-BQA6T-J2SXF-VSDGE-A7NZ5-U4B3K'
    }
    try { uni.setStorageSync('QQ_MAP_KEY', 'ISSBZ-BQA6T-J2SXF-VSDGE-A7NZ5-U4B3K') } catch (e) {}
    
    // 监听全局发布按钮点击事件
    uni.$on('showPublishOverlay', () => {
      console.log('收到showPublishOverlay事件')
      this.showPublishOverlay = true
      this.globalData.showPublishOverlay = true
    })
    
    // 全局错误处理
    uni.onError((error) => {
      console.warn('全局错误捕获:', error)
      // 过滤掉 jsbridge 相关的警告
      if (error.includes('jsbridge') && error.includes('too early')) {
        // 这类错误通常不影响功能，只是时序问题
        return
      }
    })
    this.initLocation()
    // 统一计算并缓存 TabBar 高度，供各页面直接绑定，确保与首页一致
    this.computeTabBarMetrics()
    // 统一计算并缓存顶部导航高度（状态栏 + 自定义导航栏）
    this.computeTopNavMetrics()
  },
  onShow: function() {
    console.log('App Show')
  },
  onHide: function() {
    console.log('App Hide')
  },
  methods: {
    async initLocation() {
      try {
        const setting = await uni.getSetting()
        const hasAuth = setting?.authSetting?.['scope.userLocation'] === true
        if (!hasAuth) {
          try {
            await uni.authorize({ scope: 'scope.userLocation' })
          } catch (e) {
            console.warn('未授权地理位置，使用默认坐标', e)
            uni.setStorageSync('USER_LOCATION', { latitude: 30.572269, longitude: 104.066541 })
            return
          }
        }
        const res = await uni.getLocation({ type: 'wgs84', isHighAccuracy: true })
        uni.setStorageSync('USER_LOCATION', { latitude: res.latitude, longitude: res.longitude })
      } catch (err) {
        console.error('启动时定位失败，使用默认坐标', err)
        uni.setStorageSync('USER_LOCATION', { latitude: 30.572269, longitude: 104.066541 })
      }
    },
    // 计算并缓存系统 TabBar 高度（rpx）与安全区（rpx），用于全局绑定
    computeTabBarMetrics() {
      try {
        const info = uni.getSystemInfoSync()
        const toRpx = (px) => Math.round((px * 750) / (info.screenWidth || info.windowWidth))
        // 自定义 TabBar 在 index.wxss 中为 86px
        const tabHeightPx = 86
        const safeBottomPx = info.safeArea ? (info.screenHeight - info.safeArea.bottom) : 0
        const tabHeightRpx = toRpx(tabHeightPx)
        const safeBottomRpx = Math.max(0, toRpx(safeBottomPx))
        const placeholderHeightPx = tabHeightPx + safeBottomPx
        const placeholderHeightRpx = tabHeightRpx + safeBottomRpx
        const metrics = { tabHeightPx, safeBottomPx, placeholderHeightPx, tabHeightRpx, safeBottomRpx, placeholderHeightRpx }
        uni.setStorageSync('TABBAR_METRICS', metrics)
        return metrics
      } catch (e) {
        console.warn('计算 TabBar 高度失败，使用默认值', e)
        const metrics = { tabHeightPx: 86, safeBottomPx: 0, placeholderHeightPx: 86, tabHeightRpx: 172, safeBottomRpx: 0, placeholderHeightRpx: 172 }
        uni.setStorageSync('TABBAR_METRICS', metrics)
        return metrics
      }
    },
    // 计算并缓存顶部导航高度（px）：状态栏 + 自定义导航栏
    computeTopNavMetrics() {
      try {
        const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
        const statusPx = (info && ((info.safeAreaInsets && info.safeAreaInsets.top) || (info.safeArea && info.safeArea.top) || info.statusBarHeight || 0)) || 0
        let navPx = 44
        try {
          // 使用胶囊按钮矩形精确计算导航栏高度，使之与原生一致
          const rect = typeof uni.getMenuButtonBoundingClientRect === 'function' ? uni.getMenuButtonBoundingClientRect() : null
          if (rect && rect.top && rect.bottom && rect.height) {
            const topGap = rect.top - statusPx
            const bottomGap = topGap // WeChat 原生上下间距通常一致
            navPx = Math.round(rect.height + topGap + bottomGap)
          }
        } catch (e2) {
          // 回退为 44px
        }
        const totalPx = statusPx + navPx
        const metrics = { statusPx, navPx, totalPx }
        uni.setStorageSync('TOP_NAV_METRICS', metrics)
        return metrics
      } catch (e) {
        console.warn('计算顶部导航高度失败，使用默认值', e)
        const metrics = { statusPx: 20, navPx: 44, totalPx: 64 }
        uni.setStorageSync('TOP_NAV_METRICS', metrics)
        return metrics
      }
    },
    // 关闭弹出菜单
    closePublishOverlay() {
      console.log('关闭弹出菜单')
      this.showPublishOverlay = false
      if (this.globalData) {
        this.globalData.showPublishOverlay = false
      }
    }
  }
}
</script>

<style>
@import url("/static/tabbar-plus-style.css");

page {
  background-color: #f8f8f8;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 28rpx;
  color: #1f2937;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

:root {
  --primary-color: #ff8a65;
  --primary-gradient: linear-gradient(135deg, #ff8a65 0%, #ff7043 100%);
  --primary-light: #fff8f5;
  --primary-dark: #e65100;
  
  --secondary-blue: #5c6bc0;
  --secondary-green: #66bb6a;
  --secondary-purple: #8e24aa;
  --secondary-orange: #ff8a65;
  
  --text-primary: #212121;
  --text-secondary: #757575;
  --text-tertiary: #bdbdbd;
  --text-white: #ffffff;
  
  --bg-primary: #ffffff;
  --bg-secondary: #fafafa;
  --bg-tertiary: #f5f5f5;
  --bg-card: rgba(255, 255, 255, 0.95);
  
  --border-color: transparent;
  
  --radius-sm: 6rpx;
  --radius-md: 12rpx;
  --radius-lg: 20rpx;
  --radius-xl: 28rpx;
  
  --shadow-sm: 0 1rpx 4rpx rgba(0, 0, 0, 0.03);
  --shadow-md: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  --shadow-lg: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 6rpx 16rpx rgba(0, 0, 0, 0.06);
}

.card {
  border-radius: var(--radius-md);
  background-color: var(--bg-card);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
}

.btn-primary {
  background: var(--primary-gradient);
  color: var(--text-white);
  border-radius: var(--radius-lg);
  font-weight: 600;
  box-shadow: 0 6rpx 14rpx rgba(255, 122, 69, 0.3);
}

.btn-primary:active {
  transform: scale(0.98);
  opacity: 0.9;
}

.tag {
  padding: 4rpx 12rpx;
  border-radius: var(--radius-sm);
  font-size: 20rpx;
  font-weight: 600;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes popIn {
  0% { transform: scale(0.5); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.fade-in {
  animation: fadeIn 0.3s ease;
}

.slide-up {
  animation: slideUp 0.3s ease;
}

.scale-in {
  animation: scaleIn 0.3s ease;
}

.uni-tabbar__item {
  color: #999;
}

.uni-tabbar__item.uni-tabbar__item--selected {
  color: #ff8a65;
  font-weight: 500;
}

.uni-tabbar__item-text {
  font-size: 28rpx;
  line-height: 1.8;
  transform: scale(0.9);
}

.uni-tabbar__item--selected .uni-tabbar__item-text {
  transform: scale(1);
  transition: transform 0.2s ease;
}

image {
  display: block;
}

view {
  box-sizing: border-box;
}

text {
  font-size: 28rpx;
  line-height: 1.5;
}
</style>

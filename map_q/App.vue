<template>
  <view>
  </view>
</template>

<script>
import { APP_CONFIG } from './utils/config.js'
import { bookingApi } from './utils/api/booking.js'
import { moderationApi } from './utils/api/creation.js'

export default {
  data() {
    return {}
  },
  onLaunch: function() {
    console.log('App Launch')
    
    this.globalData = {
      showPublishOverlay: false,
      QQ_MAP_KEY: APP_CONFIG.TENCENT_MAP.KEY
    }
    try { uni.setStorageSync('QQ_MAP_KEY', APP_CONFIG.TENCENT_MAP.KEY) } catch (e) {
      console.warn('存储地图密钥失败:', e)
    }
    
    // 全局错误处理
    uni.onError((error) => {
      console.warn('全局错误捕获:', error)
      // 过滤掉 jsbridge 相关的警告
      if (error.includes('jsbridge') && error.includes('too early')) {
        // 这类错误通常不影响功能，只是时序问题
        return
      }
    })
    // 统一计算并缓存 TabBar 高度，供各页面直接绑定，确保与首页一致
    this.computeTabBarMetrics()
    // 统一计算并缓存顶部导航高度（状态栏 + 自定义导航栏）
    this.computeTopNavMetrics()
  },
  onShow: function() {
    console.log('App Show')
    try {
      const changed = moderationApi.processDue(Date.now())
      if (changed.length) {
        const published = changed.filter(item => item.status === 'published').length
        uni.showToast({
          title: published ? `${published} 条内容已通过审核` : '定时内容已进入审核',
          icon: 'none',
          duration: 2600
        })
      }
    } catch (error) {
      console.warn('检查创作审核状态失败', error)
    }
    try {
      const due = bookingApi.collectDueReminders()
      if (due.length) {
        uni.showModal({
          title: '服务即将开始',
          content: `${due[0].title}将在一小时内开始，请检查地点与联系方式。`,
          confirmText: '知道了',
          showCancel: false
        })
      }
    } catch (error) {
      console.warn('检查预约提醒失败:', error)
    }
  },
  onHide: function() {
    console.log('App Hide')
  },
  methods: {
    // 计算并缓存系统 TabBar 高度（rpx）与安全区（rpx），用于全局绑定
    computeTabBarMetrics() {
      try {
        const info = typeof uni.getWindowInfo === 'function'
          ? uni.getWindowInfo()
          : uni.getSystemInfoSync()
        const toRpx = (px) => Math.round((px * 750) / (info.screenWidth || info.windowWidth))
        // 紧凑底栏：48px 触控主体 + 最多 10px 手势缓冲，总高与页面 116rpx 避让一致。
        const tabHeightPx = 48
        const rawSafeBottomPx = info.safeArea ? (info.screenHeight - info.safeArea.bottom) : 0
        const safeBottomPx = rawSafeBottomPx > 0 ? Math.min(rawSafeBottomPx, 10) : 0
        const tabHeightRpx = toRpx(tabHeightPx)
        const safeBottomRpx = Math.max(0, toRpx(safeBottomPx))
        const placeholderHeightPx = tabHeightPx + safeBottomPx
        const placeholderHeightRpx = tabHeightRpx + safeBottomRpx
        const metrics = { tabHeightPx, safeBottomPx, placeholderHeightPx, tabHeightRpx, safeBottomRpx, placeholderHeightRpx }
        uni.setStorageSync('TABBAR_METRICS', metrics)
        return metrics
      } catch (e) {
        console.warn('计算 TabBar 高度失败，使用默认值', e)
        const metrics = { tabHeightPx: 48, safeBottomPx: 0, placeholderHeightPx: 48, tabHeightRpx: 96, safeBottomRpx: 0, placeholderHeightRpx: 96 }
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
  }
}
</script>

<style>
@import url("/static/app-theme.css");

page {
  background-color: var(--color-page);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 28rpx;
  color: var(--color-text);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

:root {
  --primary-color: var(--color-primary);
  --primary-gradient: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  --primary-light: var(--color-primary-soft);
  --primary-dark: var(--color-primary-strong);
  --accent-color: var(--color-info);
  --accent-light: var(--color-info-soft);
  
  --secondary-blue: var(--color-info);
  --secondary-green: var(--color-success);
  --secondary-purple: var(--color-info);
  --secondary-orange: var(--color-primary);
  
  --text-primary: var(--color-text);
  --text-secondary: var(--color-text-body);
  --text-tertiary: var(--color-text-muted);
  --text-white: #ffffff;
  
  --bg-primary: var(--color-surface);
  --bg-secondary: var(--color-page);
  --bg-tertiary: var(--color-surface-soft);
  --bg-card: var(--color-surface);
  
  --border-color: var(--color-border);
  
  --radius-sm: 12rpx;
  --radius-md: var(--radius-card);
  --radius-lg: 28rpx;
  --radius-xl: 40rpx;
  
  --shadow-sm: 0 1rpx 4rpx rgba(0, 0, 0, 0.03);
  --shadow-md: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  --shadow-lg: var(--shadow-card);
  --shadow-xl: 0 24rpx 64rpx rgba(15, 23, 42, 0.12);
  --space-1: 8rpx;
  --space-2: 16rpx;
  --space-3: 24rpx;
  --space-4: 32rpx;
  --space-6: 48rpx;
  --surface-raised: rgba(255, 255, 255, 0.96);
  --surface-soft: #fffaf7;
  --border-soft: rgba(148, 163, 184, 0.22);
  --shadow-panel: 0 -16rpx 56rpx rgba(15, 23, 42, 0.12);
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
  color: #7A7E83;
}

.uni-tabbar__item.uni-tabbar__item--selected {
  color: var(--color-primary);
  font-weight: bold;
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

/* #ifdef MP-WEIXIN */
/*
 * Shared WeChat top-bar contract:
 * custom navigation content sits below the status bar, uses a 44px row,
 * and keeps all controls to the left of the native capsule.
 */
.status-spacer + .nav-bar,
.status-bar + .nav-bar {
  min-height: 44px;
  padding-right: 104px !important;
  box-sizing: border-box;
}

.status-spacer + .nav-bar > .nav-right,
.status-bar + .nav-bar > .nav-right {
  right: 104px !important;
}
/* #endif */

button,
input,
textarea,
view {
  -webkit-tap-highlight-color: transparent;
}

.card.map-card {
  border: 1rpx solid var(--border-soft);
  border-radius: 24rpx !important;
  box-shadow: var(--shadow-card);
  transform: translateZ(0);
  transition: transform 180ms var(--ease-standard), box-shadow 180ms var(--ease-standard);
}

.card.map-card:active {
  transform: scale(.985);
  box-shadow: 0 4rpx 16rpx rgba(15, 23, 42, 0.08);
}

@media (prefers-reduced-motion: reduce) {
  .card.map-card,
  .btn-primary,
  .fade-in,
  .slide-up,
  .scale-in {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

text {
  font-size: 28rpx;
  line-height: 1.5;
}
</style>

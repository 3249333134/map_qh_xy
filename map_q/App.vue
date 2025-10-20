<script>
export default {
  onLaunch: function() {
    console.log('App Launch')
    
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
        const basePx = 44
        const safeBottomPx = info.safeArea ? (info.screenHeight - info.safeArea.bottom) : 0
        const safeBottomRpx = Math.max(0, toRpx(safeBottomPx))
        const baseRpx = toRpx(basePx)
        // 取消微调，保证与 44px 导航栏精确一致
        const microAdjustRpx = 0
        const tabHeightRpx = baseRpx
        const placeholderHeightRpx = tabHeightRpx + safeBottomRpx
        const metrics = { tabHeightRpx, safeBottomRpx, microAdjustRpx, placeholderHeightRpx }
        uni.setStorageSync('TABBAR_METRICS', metrics)
        return metrics
      } catch (e) {
        console.warn('计算 TabBar 高度失败，使用默认值', e)
        const metrics = { tabHeightRpx: 100, safeBottomRpx: 0, microAdjustRpx: 0, placeholderHeightRpx: 100 }
        uni.setStorageSync('TABBAR_METRICS', metrics)
        return metrics
      }
    }
  }
}
</script>

<style>
/* 导入tabBar突出按钮样式 */
@import url("/static/tabbar-plus-style.css");

/* 全局样式 */
page {
  background-color: #f0f0f0;
}

/*每个页面公共css */
.uni-tabbar__item {
  color: #7A7E83;
}

.uni-tabbar__item.uni-tabbar__item--selected {
  color: #ffd700;
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
</style>

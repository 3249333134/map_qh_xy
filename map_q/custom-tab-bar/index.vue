<template>
  <view class="tabbar">
    <view
      class="tabbar-item"
      v-for="(item, index) in list"
      :key="item.text"
      :class="[{ active: selectedIndex === index }, { 'publish-item': item.type === 'publish' }]"
      @tap="onTap(item, index)"
    >
      <view v-if="item.type === 'publish'" class="publish-hit-area" @tap.stop="onTap(item, index)">
        <view class="plus-wrapper">
          <text class="plus-sign">+</text>
        </view>
      </view>
      <image v-else class="icon" :src="selectedIndex === index ? item.selectedIconPath : item.iconPath" mode="aspectFit" />
      <text class="label">{{ item.text }}</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'CustomTabBar',
  data() {
    return {
      selectedIndex: 0,
      list: [
        { pagePath: '/pages/index/index', text: '首页', iconPath: '/static/tabbar/home.png', selectedIconPath: '/static/tabbar/home-active.png' },
        { pagePath: '/pages/service/index', text: '服务', iconPath: '/static/tabbar/service.png', selectedIconPath: '/static/tabbar/service-active.png' },
        { pagePath: '/pages/plus/index', text: '发布', iconPath: '/static/tabbar/plus.png', selectedIconPath: '/static/tabbar/plus-active.png', type: 'publish' },
        { pagePath: '/pages/message/index', text: '消息', iconPath: '/static/tabbar/message.png', selectedIconPath: '/static/tabbar/message-active.png' },
        { pagePath: '/pages/my/index', text: '我的', iconPath: '/static/tabbar/my.png', selectedIconPath: '/static/tabbar/my-active.png' }
      ]
    }
  },
  created() {
    this.updateSelected()
  },
  mounted() {
    this.updateSelected()
  },
  methods: {
    updateSelected() {
      try {
        const pages = getCurrentPages()
        const page = pages[pages.length - 1]
        const route = '/' + page.route
        const idx = this.list.findIndex(i => i.pagePath === route)
        this.selectedIndex = idx >= 0 ? idx : 0
        try {
          const app = getApp()
          if (app && app.globalData) app.globalData.prevTabPath = route
        } catch (e2) {}
      } catch (e) {
        this.selectedIndex = 0
      }
    },
    onTap(item, index) {
      if (item.type === 'publish') {
        try {
          const app = getApp()
          if (app && app.globalData) app.globalData.showPublishOverlay = true
        } catch (e) {}
        try { uni.$emit('showPublishOverlay') } catch (e2) {}
        try {
          const app = getApp()
          if (app && app.globalData && app.globalData.__overlayHost && app.globalData.__overlayHost.showHandler) {
            app.globalData.__overlayHost.showHandler()
          }
        } catch (e3) {
          console.warn('调用globalData overlayHost失败:', e3)
        }
        try {
          const pages = getCurrentPages()
          const page = pages[pages.length - 1]
          if (page) {
            if (page.__overlayHost && page.__overlayHost.showHandler) {
              page.__overlayHost.showHandler()
            } else if (page.$vm && page.$vm.__overlayHost && page.$vm.__overlayHost.showHandler) {
              page.$vm.__overlayHost.showHandler()
            }
          }
        } catch (e4) {
          console.warn('调用页面overlayHost失败:', e4)
        }
        return
      }
      if (index !== this.selectedIndex) {
        try { uni.setStorageSync('contentArea.categoryActionExpanded', false) } catch (e) {}
        try { uni.$emit('collapseExpandableBars') } catch (e2) {}
        uni.switchTab({ url: item.pagePath })
      }
    }
  }
}
</script>

<style>
.tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-around;
  height: 66px;
  background-color: rgba(255,255,255,.96);
  border-top: 1px solid rgba(226,232,240,.82);
  box-shadow: 0 -8px 28px rgba(15,23,42,.08);
  backdrop-filter: blur(18px) saturate(135%);
  padding-bottom: env(safe-area-inset-bottom);
}
.tabbar-item {
  flex: 1;
  height: 56px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  transition: opacity 160ms ease, transform 160ms ease;
}
.tabbar-item:active { opacity: .72; transform: scale(.96); }
.icon {
  width: 24px;
  height: 24px;
}
.label {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}
.active .label {
  color: #ea580c;
  font-weight: 600;
}
.publish-item {
  position: relative;
  z-index: 100;
  overflow: visible;
}
.publish-item .label {
  display: none;
}
.publish-hit-area {
  position: relative;
  z-index: 100;
  width: 80px;
  height: 80px;
  margin-top: -30px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.plus-wrapper {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  border: 3px solid #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(255, 71, 87, 0.3),
              0 2px 8px rgba(255, 107, 53, 0.2),
              0 0 20px rgba(247, 147, 30, 0.1),
              0 8px 32px rgba(0, 0, 0, 0.1);
  transition: transform 0.15s ease;
}
.plus-wrapper:active {
  transform: scale(0.92);
}
.plus-sign { color: #fff; font-size: 32px; line-height: 1; pointer-events: none; }
@media screen and (max-width: 375px) {
  .publish-hit-area { width: 72px; height: 72px; }
  .plus-wrapper { width: 55px; height: 55px; }
  .plus-sign { font-size: 28px; }
}
@media screen and (min-width: 414px) {
  .publish-hit-area { width: 90px; height: 90px; }
  .plus-wrapper { width: 65px; height: 65px; }
  .plus-sign { font-size: 36px; }
}
</style>

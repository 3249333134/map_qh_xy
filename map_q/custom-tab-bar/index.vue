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
        <view class="plus-wrapper" :class="{ open: publishOpen }">
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
      publishOpen: false,
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
    try {
      uni.$on('publishOverlayOpened', this.handlePublishOpened)
      uni.$on('publishOverlayClosed', this.handlePublishClosed)
    } catch (e) {}
  },
  unmounted() {
    try {
      uni.$off('publishOverlayOpened', this.handlePublishOpened)
      uni.$off('publishOverlayClosed', this.handlePublishClosed)
    } catch (e) {}
  },
  methods: {
    handlePublishOpened() { this.publishOpen = true },
    handlePublishClosed() { this.publishOpen = false },
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
        this.publishOpen = !this.publishOpen
        try {
          const app = getApp()
          if (app && app.globalData) app.globalData.showPublishOverlay = this.publishOpen
        } catch (e) {}
        try { uni.$emit(this.publishOpen ? 'showPublishOverlay' : 'hidePublishOverlay') } catch (e2) {}
        try {
          const app = getApp()
          if (app && app.globalData && app.globalData.__overlayHost && app.globalData.__overlayHost.showHandler) {
            if (this.publishOpen) app.globalData.__overlayHost.showHandler()
            else app.globalData.__overlayHost.hideHandler()
          }
        } catch (e3) {
          console.warn('调用globalData overlayHost失败:', e3)
        }
        try {
          const pages = getCurrentPages()
          const page = pages[pages.length - 1]
          if (page) {
            if (page.__overlayHost && page.__overlayHost.showHandler) {
              if (this.publishOpen) page.__overlayHost.showHandler()
              else page.__overlayHost.hideHandler()
            } else if (page.$vm && page.$vm.__overlayHost && page.$vm.__overlayHost.showHandler) {
              if (this.publishOpen) page.$vm.__overlayHost.showHandler()
              else page.$vm.__overlayHost.hideHandler()
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
  height: 48px;
  background-color: rgba(255,255,255,.98);
  border-top: 1px solid var(--color-border);
  box-shadow: 0 -8px 24px rgba(15,23,42,.07);
  backdrop-filter: blur(18px) saturate(135%);
  padding-bottom: 10px;
  overflow: visible;
}
.tabbar-item {
  flex: 1;
  height: 48px;
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
  width: 23px;
  height: 23px;
}
.label {
  font-size: 11px;
  color: var(--color-text-body);
  margin-top: 0;
}
.active .label {
  color: var(--color-primary);
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
  height: 68px;
  margin-top: -22px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.plus-wrapper {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: #ea580c;
  border: 4px solid #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  overflow: hidden;
  opacity: 1;
  visibility: visible;
  box-shadow: 0 10px 26px rgba(234,88,12,.38);
  transition: transform var(--motion-fast) var(--ease-standard), opacity var(--motion-fast) ease;
}
.plus-wrapper:active {
  transform: scale(0.92);
}
.plus-sign { color: #fff; font-size: 36px; font-weight: 300; line-height: 1; pointer-events: none; transition: transform 180ms ease; }
.plus-wrapper.open { background: #c2410c; box-shadow: 0 10px 26px rgba(194,65,12,.42); }
.plus-wrapper.open .plus-sign { transform: rotate(45deg); }
@media screen and (max-width: 375px) {
  .publish-hit-area { width: 66px; height: 66px; }
  .plus-wrapper { width: 56px; height: 56px; }
  .plus-sign { font-size: 34px; }
}
@media screen and (min-width: 414px) {
  .publish-hit-area { width: 78px; height: 70px; }
  .plus-wrapper { width: 60px; height: 60px; }
  .plus-sign { font-size: 36px; }
}
</style>

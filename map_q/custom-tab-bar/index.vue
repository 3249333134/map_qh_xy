<template>
  <view class="tabbar">
    <view
      class="tabbar-item"
      v-for="(item, index) in list"
      :key="item.text"
      :class="[{ active: selectedIndex === index }, { 'publish-item': item.type === 'publish' }]"
      @tap="onTap(item, index)"
    >
      <view v-if="item.type === 'publish'" class="plus-wrapper">
        <text class="plus-sign">+</text>
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
    // 进入页面或切换时刷新选中态
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
        // 记录当前选中的 Tab，供 plus 页返回使用
        try {
          const app = getApp()
          if (app && app.globalData) app.globalData.prevTabPath = route
        } catch (e2) {}
      } catch (e) {
        // 兼容H5或非微信小程序环境
        this.selectedIndex = 0
      }
    },
    onTap(item, index) {
      if (item.type === 'publish') {
        // 仅在点击“+”时触发弹窗：优先直接驱动 App.vue 响应式状态
        try {
          const app = getApp()
          if (app && app.$vm && typeof app.$vm.showPublishOverlay !== 'undefined') {
            app.$vm.showPublishOverlay = true
            if (app.globalData) app.globalData.showPublishOverlay = true
            return
          }
        } catch (e) {}
        // 备选：事件总线（若上面不可用）
        try { uni.$emit('showPublishOverlay') } catch (e2) {}
        // 最终兜底：写入全局标记，页面挂载点将轮询同步
        try {
          const app = getApp()
          if (app && app.globalData) app.globalData.showPublishOverlay = true
        } catch (e3) {}
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
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-around;
  height: 86px;
  background-color: #ffffff;
  border-top: 1px solid #e6e6e6;
}
.tabbar-item {
  flex: 1;
  height: 56px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.icon {
  width: 24px;
  height: 24px;
}
.label {
  font-size: 12px;
  color: #7A7E83;
}
.active .label {
  color: #ffd700;
}
.publish-item {
  position: relative;
  z-index: 10;
}
.publish-item .label {
  display: none;
}
.plus-wrapper {
  width: 60px;
  height: 60px;
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  clip-path: circle(50% at 50% 50%);
  transform: translateY(-15px);
  background: radial-gradient(circle at 50% 40%, #ff8a3d 0%, #ff6b35 60%, #ff4757 100%);
  border: 3px solid #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(255, 71, 87, 0.3),
              0 2px 8px rgba(255, 107, 53, 0.2),
              0 0 20px rgba(247, 147, 30, 0.1),
              0 8px 32px rgba(0, 0, 0, 0.1);
}
.plus-sign { color: #fff; font-size: 32px; line-height: 1; }
@media screen and (max-width: 375px) {
  .plus-wrapper { width: 55px; height: 55px; transform: translateY(-12px); }
  .plus-sign { font-size: 28px; }
}
@media screen and (min-width: 414px) {
  .plus-wrapper { width: 65px; height: 65px; transform: translateY(-18px); }
  .plus-sign { font-size: 36px; }
}
</style>

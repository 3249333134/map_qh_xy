<template>
  <view class="tabbar">
    <view
      class="tabbar-item"
      v-for="(item, index) in list"
      :key="item.text"
      :class="{ active: selectedIndex === index }"
      @tap="onTap(item, index)"
    >
      <image class="icon" :src="selectedIndex === index ? item.selectedIconPath : item.iconPath" mode="aspectFit" />
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
      } catch (e) {
        // 兼容H5或非微信小程序环境
        this.selectedIndex = 0
      }
    },
    onTap(item, index) {
      if (item.type === 'publish') {
        // 直接触发全局弹窗，不进行页面跳转
        uni.$emit('showPublishOverlay')
        return
      }
      if (index !== this.selectedIndex) {
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
</style>
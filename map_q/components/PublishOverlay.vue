<template>
  <view class="publish-overlay" :class="{ active: show }" @click="close">
    <view class="menu-arc-container" @click.stop>
      <view class="menu-item item-1" @click="handleItemClick('sandbox')">
        <view class="icon-wrapper">
          <image src="/static/tabbar/service.png" class="menu-icon" />
        </view>
        <text class="menu-text">沙盒</text>
      </view>
      <view class="menu-item item-2" @click="handleItemClick('publish')">
        <view class="icon-wrapper">
          <image src="/static/tabbar/publish-icon.png" class="menu-icon" />
        </view>
        <text class="menu-text">发布</text>
      </view>
      <view class="menu-item item-3" @click="handleItemClick('original-ip')">
        <view class="icon-wrapper">
          <image src="/static/tabbar/my.png" class="menu-icon" />
        </view>
        <text class="menu-text">原创IP</text>
      </view>
    </view>
    <view class="close-button-container" @click.stop="close">
      <view class="close-button">
        <image src="/static/tabbar/close.png" class="close-icon" />
      </view>
    </view>
  </view>
</template>

<script>
export default {
  props: {
    show: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    close() {
      this.$emit('close');
    },
    handleItemClick(item) {
      console.log(`Clicked on ${item}`);
      
      // 根据不同的功能项执行不同的操作
      switch(item) {
        case 'sandbox':
          this.handleSandbox();
          break;
        case 'publish':
          this.handlePublish();
          break;
        case 'original-ip':
          this.handleOriginalIP();
          break;
        default:
          console.log('Unknown item:', item);
      }
      
      this.close();
    },
    handleSandbox() {
      // 沙盒功能 - 可以跳转到相应页面或执行相应操作
      uni.showToast({
        title: '进入沙盒模式',
        icon: 'success'
      });
      // 如果需要跳转到特定页面，可以使用：
      // uni.navigateTo({ url: '/pages/sandbox/index' });
    },
    handlePublish() {
      // 发布功能 - 可以跳转到发布页面
      uni.showToast({
        title: '开始发布内容',
        icon: 'success'
      });
      // 如果需要跳转到发布页面，可以使用：
      // uni.navigateTo({ url: '/pages/publish/index' });
    },
    handleOriginalIP() {
      // 原创IP功能
      uni.showToast({
        title: '创建原创IP',
        icon: 'success'
      });
      // 如果需要跳转到原创IP页面，可以使用：
      // uni.navigateTo({ url: '/pages/original-ip/index' });
    }
  }
};
</script>

<style scoped>
.publish-overlay {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 1004; /* Ensure it's above the tab bar */
  pointer-events: none;
}

.publish-overlay.active {
  opacity: 1;
  pointer-events: auto;
}

.menu-arc-container {
  position: absolute;
  bottom: 30px; /* Adjust as needed */
  left: 50%;
  transform: translateX(-50%);
  width: 280px; /* Diameter of the arc */
  height: 140px; /* Half the diameter */
  border-top-left-radius: 140px;
  border-top-right-radius: 140px;
  background: radial-gradient(circle at 50% 100%, rgba(29, 29, 31, 0.95), rgba(44, 44, 46, 0.85));
  box-shadow: 0 -5px 20px rgba(0, 0, 0, 0.2);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 20px;
  transition: transform 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55);
  transform-origin: bottom center;
  transform: translateX(-50%) scale(0.5);
}

.publish-overlay.active .menu-arc-container {
  transform: translateX(-50%) scale(1);
}

.menu-item {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.icon-wrapper {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 8px;
}

.menu-icon {
  width: 28px;
  height: 28px;
}

.menu-text {
  color: white;
  font-size: 12px;
}

/* Positioning items along the arc */
.item-1 { transform: rotate(-60deg) translate(110px) rotate(60deg); }
.item-2 { transform: translate(0, -25px); } /* Center item */
.item-3 { transform: rotate(60deg) translate(110px) rotate(-60deg); }

.close-button-container {
    position: absolute;
    bottom: 30px; /* Match the arc container's bottom */
    left: 50%;
    transform: translateX(-50%);
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background-color: #ff4d4f;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    z-index: 1005;
    transition: transform 0.3s ease;
}

.publish-overlay.active .close-button-container {
    transform: translateX(-50%) rotate(45deg);
}

.close-button {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
}

.close-icon {
  width: 24px;
  height: 24px;
}
</style>
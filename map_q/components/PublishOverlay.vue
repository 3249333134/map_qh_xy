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
      <!-- 中央凹口遮罩，使半圆底部呈现凹形效果 -->
      <view class="arc-notch-mask" />
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
  z-index: 10050; /* Ensure it's above the custom tab bar */
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
  width: 300px; /* Diameter of the arc */
  height: 150px; /* Half the diameter */
  border-top-left-radius: 150px;
  border-top-right-radius: 150px;
  background: radial-gradient(circle at 50% 100%, rgba(35, 35, 37, 0.96), rgba(48, 48, 52, 0.88));
  box-shadow: 0 -6px 22px rgba(0, 0, 0, 0.22);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 24px;
  transition: transform 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55);
  transform-origin: bottom center;
  transform: translateX(-50%) scale(0.5);
  overflow: visible;
}

.publish-overlay.active .menu-arc-container {
  transform: translateX(-50%) scale(1);
}

/* 顶部粉紫色光晕边缘 */
.menu-arc-container::before {
  content: '';
  position: absolute;
  top: -6px;
  left: -6px;
  right: -6px;
  height: 156px;
  border-top-left-radius: 156px;
  border-top-right-radius: 156px;
  background: radial-gradient( 90px 60px at 85% 100%, rgba(255, 105, 180, 0.45), transparent 70% ),
              radial-gradient( 90px 60px at 15% 100%, rgba(255, 105, 180, 0.45), transparent 70% );
  filter: blur(10px);
  pointer-events: none;
}

/* 底部凹口遮罩：用白色圆形遮住半圆底部中心，形成凹口 */
.arc-notch-mask {
  position: absolute;
  bottom: -18px; /* 让遮罩略微压住半圆底部 */
  left: 50%;
  transform: translateX(-50%);
  width: 84px;
  height: 42px;
  background: #ffffff; /* 与底部 TabBar 背景一致 */
  border-bottom-left-radius: 42px;
  border-bottom-right-radius: 42px;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.12);
  z-index: 0;
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
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background-color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 8px;
  box-shadow: 0 6px 16px rgba(0,0,0,0.18);
}

.menu-icon {
  width: 30px;
  height: 30px;
}

.menu-text {
  color: white;
  font-size: 12px;
}

/* Positioning items along the arc */
.item-1 { transform: rotate(-55deg) translate(120px) rotate(55deg); }
.item-2 { transform: translate(0, -28px); } /* Center item */
.item-3 { transform: rotate(55deg) translate(120px) rotate(-55deg); }

/* 弹出动效：图标轻微放大回弹，文本淡入 */
.publish-overlay.active .item-1 .icon-wrapper { animation: popIn 280ms both 60ms; }
.publish-overlay.active .item-2 .icon-wrapper { animation: popIn 280ms both 120ms; }
.publish-overlay.active .item-3 .icon-wrapper { animation: popIn 280ms both 180ms; }
.publish-overlay.active .menu-text { animation: fadeUp 220ms both 160ms; }

@keyframes popIn {
  0% { transform: scale(0.6); opacity: 0; }
  60% { transform: scale(1.08); opacity: 1; }
  100% { transform: scale(1); }
}
@keyframes fadeUp {
  0% { opacity: 0; transform: translateY(6px); }
  100% { opacity: 1; transform: translateY(0); }
}

.close-button-container {
    position: absolute;
    bottom: 30px; /* Match the arc container's bottom */
    left: 50%;
    transform: translateX(-50%);
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background-image: linear-gradient(135deg, #ff4d8f 0%, #c13cff 100%);
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    z-index: 1005;
    transition: transform 0.3s ease;
    box-shadow: 0 8px 24px rgba(193, 60, 255, 0.28);
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
  width: 26px;
  height: 26px;
}
</style>
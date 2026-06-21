<template>
  <view class="publish-overlay" :class="{ active: show }" @click="close">
    <view class="menu-arc-container" @click.stop>
      <view class="menu-item item-1" @click="handleItemClick('sandbox')">
        <view class="rect-btn rect-small"><text class="btn-text">沙盒</text></view>
      </view>
      <view class="menu-item item-2" @click="handleItemClick('publish')">
        <view class="rect-btn rect-large"><text class="btn-text">发布</text></view>
      </view>
      <view class="menu-item item-3" @click="handleItemClick('original-ip')">
        <view class="rect-btn rect-small"><text class="btn-text">原创IP</text></view>
      </view>
      <!-- 移除半圆的凹口遮罩，改用圆角矩形背景 -->
    </view>
    <view class="close-button-container" @click.stop="close">
      <view class="close-button" />
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
  /* 中间关闭按钮的水平微调（向右为正） */
  --close-x-offset: 0.5px;
}

.publish-overlay.active {
  opacity: 1;
  pointer-events: auto;
}

.menu-arc-container {
  position: absolute;
  /* 让矩形覆盖你框出的大区域：上边距和下边距可调 */
  top: 110px;
  /* 底边对齐到关闭按钮圆心（close: bottom 30px, 半径 28px => 58px）*/
  bottom: 58px;
  left: 8px;
  right: 8px;
  border-radius: 24px; /* 圆角 */
  background: linear-gradient(180deg, rgba(40,42,46,0.95) 0%, rgba(52,54,58,0.9) 100%);
  box-shadow: 0 -6px 22px rgba(0, 0, 0, 0.22);
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto;
  justify-items: center;
  align-items: center;
  align-content: end; /* 将两排按钮整体压到容器底部 */
  row-gap: 10px;
  column-gap: 3px;
  /* 将列间距同时作为切口居中参考 */
  --inner-gap: 3px;
  padding: 24px 24px 10px 24px; /* 底部内边距缩小，贴近关闭按钮 */
  --bottom-pad: 10px;          /* 下方按钮到底部灰色区域的距离（与上面 padding 底值一致） */
  transition: transform 0.3s ease;
  transform-origin: center;
  transform: scale(0.96);
  overflow: visible;
  /* 切割圆参数（用于底部两个按钮“被圆切割”真实挖孔） */
  --cut-size: 72px;            /* 扩散更明显：圆直径稍大 */
  --corner-x-offset: calc(var(--inner-gap) / 2);      /* 让左右切口以中缝为中心对齐 */
  --cut-y-offset: var(--bottom-pad); /* 竖直对齐到“+”圆心：从中心向外扩散 */
}

.publish-overlay.active .menu-arc-container { transform: scale(1); }

/* 顶部轻微光晕（适配圆角矩形） */
.menu-arc-container::before {
  content: '';
  position: absolute;
  inset: -6px -6px auto -6px;
  height: 100px;
  border-radius: 28px;
  background: radial-gradient( 160px 100px at 80% 0%, rgba(255, 105, 180, 0.35), transparent 78% ),
              radial-gradient( 160px 100px at 50% 0%, rgba(255, 105, 180, 0.35), transparent 78% ),
              radial-gradient( 160px 100px at 20% 0%, rgba(255, 105, 180, 0.35), transparent 78% );
  filter: blur(12px);
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
  position: relative; /* 在矩形容器内按网格布局 */
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

/* 新的矩形按钮样式 */
.rect-btn {
  width: 100%;
  min-width: 120px;
  background: rgba(255,255,255,0.92);
  color: #222;
  border-radius: 12px;
  box-shadow: 0 6px 16px rgba(0,0,0,0.18);
  display: flex;
  align-items: center;
  justify-content: center;
}
.rect-large { height: 80px; font-size: 16px; font-weight: 600; }
.rect-small { height: 54px; font-size: 15px; }
.btn-text { color: #222; }

/* 取消沿弧线的定位，改为矩形内水平分布 */
.item-1, .item-2, .item-3 { transform: none; }
/* 发布单独占据上排并居中，沙盒/原创位于下排左右 */
.item-2 { grid-row: 1; grid-column: 1 / span 2; }
.item-1 { grid-row: 2; grid-column: 1; }
.item-3 { grid-row: 2; grid-column: 2; }

/* 在底部两个按钮上使用 mask 真实“挖孔”，显示后方背景 */
.item-1 .rect-btn {
  -webkit-mask-image:
    radial-gradient(circle calc(var(--cut-size) / 2) at calc(100% + var(--corner-x-offset)) calc(100% + var(--cut-y-offset)), transparent 98%, #000 100%);
  mask-image:
    radial-gradient(circle calc(var(--cut-size) / 2) at calc(100% + var(--corner-x-offset)) calc(100% + var(--cut-y-offset)), transparent 98%, #000 100%);
}
.item-3 .rect-btn {
  -webkit-mask-image:
    radial-gradient(circle calc(var(--cut-size) / 2) at calc(0% - var(--corner-x-offset)) calc(100% + var(--cut-y-offset)), transparent 98%, #000 100%);
  mask-image:
    radial-gradient(circle calc(var(--cut-size) / 2) at calc(0% - var(--corner-x-offset)) calc(100% + var(--cut-y-offset)), transparent 98%, #000 100%);
}

/* 弹出动效：矩形轻微放大回弹，文本淡入 */
.publish-overlay.active .item-2 .rect-btn { animation: popIn 280ms both 60ms; }
.publish-overlay.active .item-1 .rect-btn { animation: popIn 280ms both 120ms; }
.publish-overlay.active .item-3 .rect-btn { animation: popIn 280ms both 180ms; }

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
    transform: translateX(calc(-50% + var(--close-x-offset, 4px)));
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
    transform: translateX(calc(-50% + var(--close-x-offset, 4px)));
}

.close-button {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
}

/* 使用伪元素绘制白色“✕” */
.close-button::before,
.close-button::after {
  content: '';
  position: absolute;
  width: 26px;
  height: 3px;
  background: #ffffff;
  border-radius: 2px;
  box-shadow: 0 0 6px rgba(255, 255, 255, 0.25);
}
.close-button::before { transform: rotate(45deg); }
.close-button::after { transform: rotate(-45deg); }
</style>
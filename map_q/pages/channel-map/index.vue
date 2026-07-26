<template>
  <view class="channel-map-page">
    <!-- 地图背景层（纯 CSS 模拟） -->
    <view class="map-bg">
      <view class="map-grid"></view>
      <view class="map-road road-h1"></view>
      <view class="map-road road-h2"></view>
      <view class="map-road road-v1"></view>
      <view class="map-road road-v2"></view>
      <view class="map-block block-a"></view>
      <view class="map-block block-b"></view>
      <view class="map-block block-c"></view>

      <!-- 地图标记点 + 标签 -->
      <view class="map-marker marker-1">
        <view class="marker-dot brand-blue"></view>
        <view class="marker-pulse pulse-blue"></view>
        <text class="marker-label">成都</text>
      </view>
      <view class="map-marker marker-2">
        <view class="marker-dot brand-orange"></view>
        <view class="marker-pulse pulse-orange"></view>
        <text class="marker-label active">春熙路频道</text>
      </view>
      <view class="map-marker marker-3">
        <view class="marker-dot brand-purple"></view>
        <text class="marker-label">环球中心</text>
      </view>

      <!-- 频道边界（虚线圈） -->
      <view class="channel-boundary"></view>
    </view>

    <!-- 自定义导航栏 -->
    <view class="status-spacer" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="nav-bar">
      <view class="nav-back" @tap="goBack">‹</view>
      <text class="nav-title">地图频道</text>
      <view class="nav-right join-btn" @tap="joinChannel">加入</view>
    </view>

    <!-- 底部 sheet -->
    <view class="bottom-sheet">
      <view class="drag-handle"></view>

      <view class="sheet-body">
        <!-- 左侧树形导航 -->
        <scroll-view class="tree-nav" scroll-y show-scrollbar="false">
          <view
            v-for="node in treeNodes"
            :key="node.id"
            class="tree-node"
            :class="{ active: node.id === activeNode }"
            @tap="selectNode(node.id)"
          >
            <view class="tree-bar"></view>
            <view class="tree-node-head">
              <text class="tree-name">{{ node.name }}</text>
              <text v-if="node.tag" class="tree-tag">{{ node.tag }}</text>
            </view>
            <view v-if="node.children && node.children.length" class="tree-sub">
              <text
                v-for="child in node.children"
                :key="child"
                class="tree-sub-item"
              >· {{ child }}</text>
            </view>
          </view>
        </scroll-view>

        <!-- 右侧详情卡片 -->
        <view class="detail-card">
          <view class="detail-head">
            <view class="detail-icon">
              <text class="detail-icon-text">副</text>
            </view>
            <view class="detail-head-text">
              <text class="detail-title">{{ detail.title }}</text>
              <text class="detail-sub">{{ detail.subtitle }}</text>
            </view>
          </view>

          <text class="detail-desc">{{ detail.desc }}</text>

          <view class="chip-row">
            <view
              v-for="chip in detail.chips"
              :key="chip.label"
              class="chip"
              :class="{ selected: chip.selected, orange: chip.color === 'orange', purple: chip.color === 'purple' }"
              @tap="toggleChip(chip)"
            >
              <text class="chip-text">{{ chip.label }}</text>
            </view>
          </view>

          <view class="detail-meta">
            <view class="meta-item">
              <text class="meta-num">{{ detail.stats.scope }}</text>
              <text class="meta-label">范围(km²)</text>
            </view>
            <view class="meta-divider"></view>
            <view class="meta-item">
              <text class="meta-num">{{ detail.stats.layers }}</text>
              <text class="meta-label">图层</text>
            </view>
            <view class="meta-divider"></view>
            <view class="meta-item">
              <text class="meta-num">{{ detail.stats.online }}</text>
              <text class="meta-label">在线</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const statusBarHeight = ref(20)

const treeNodes = ref([
  {
    id: 'chengdu',
    name: '成都',
    tag: '城市',
    children: ['锦江', '武侯', '高新']
  },
  {
    id: 'chunxi',
    name: '春熙路',
    tag: '频道',
    children: ['活动', '商铺', '地标']
  },
  {
    id: 'global',
    name: '环球中心',
    tag: '频道',
    children: ['购物', '餐饮']
  }
])

const activeNode = ref('chengdu')

const detail = ref({
  title: '春熙路副本',
  subtitle: '地理围栏频道副本',
  desc: '进入频道后地图范围锁定在频道边界内，只加载副本内容、服务和发言气泡。',
  stats: { scope: '2.4', layers: '6', online: '128' },
  chips: [
    { label: '区域热点', selected: true, color: 'blue' },
    { label: '商铺优惠', selected: false, color: 'orange' }
  ]
})

onMounted(() => {
  try {
    const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
    statusBarHeight.value = info.statusBarHeight || 20
  } catch (e) {}
})

const goBack = () => uni.navigateBack()

const selectNode = (id) => {
  activeNode.value = id
}

const toggleChip = (chip) => {
  chip.selected = !chip.selected
}

const joinChannel = () => {
  uni.showToast({ title: '已加入春熙路频道', icon: 'none' })
}
</script>

<style scoped>
.channel-map-page {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #e8ecf1;
  --brand-blue: #248cf5;
  --brand-orange: #ff7043;
  --brand-purple: #7650c8;
  --success: #24d06c;
  --text-primary: #222;
  --text-body: #5f646d;
  --text-secondary: #8a8f98;
  --surface-card: #ffffff;
  --surface-muted: #f0f1f3;
}

/* 地图背景 */
.map-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(160deg, #eef1f5 0%, #e3e8ee 60%, #d9dfe7 100%);
  overflow: hidden;
}

.map-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(36, 140, 245, 0.06) 1rpx, transparent 1rpx),
    linear-gradient(90deg, rgba(36, 140, 245, 0.06) 1rpx, transparent 1rpx);
  background-size: 80rpx 80rpx;
}

.map-road {
  position: absolute;
  background: #ffffff;
  opacity: 0.85;
  border-radius: 6rpx;
}

.road-h1 { left: 0; right: 0; top: 220rpx; height: 14rpx; }
.road-h2 { left: 0; right: 0; top: 560rpx; height: 10rpx; }
.road-v1 { top: 0; bottom: 0; left: 240rpx; width: 12rpx; }
.road-v2 { top: 0; bottom: 0; left: 520rpx; width: 8rpx; }

.map-block {
  position: absolute;
  background: rgba(36, 140, 245, 0.05);
  border: 2rpx solid rgba(36, 140, 245, 0.1);
  border-radius: 12rpx;
}
.block-a { top: 260rpx; left: 60rpx; width: 160rpx; height: 120rpx; }
.block-b { top: 260rpx; left: 280rpx; width: 220rpx; height: 280rpx; }
.block-c { top: 600rpx; left: 560rpx; width: 150rpx; height: 150rpx; }

/* 频道边界 */
.channel-boundary {
  position: absolute;
  top: 200rpx;
  left: 80rpx;
  width: 460rpx;
  height: 440rpx;
  border: 4rpx dashed rgba(255, 112, 67, 0.6);
  border-radius: 40rpx;
  background: rgba(255, 112, 67, 0.04);
}

/* 标记点 */
.map-marker {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.marker-1 { top: 180rpx; left: 150rpx; }
.marker-2 { top: 360rpx; left: 330rpx; }
.marker-3 { top: 620rpx; left: 560rpx; }

.marker-dot {
  width: 28rpx;
  height: 28rpx;
  border-radius: 50%;
  border: 6rpx solid #ffffff;
  box-shadow: 0 4rpx 12rpx rgba(18, 24, 38, 0.2);
  z-index: 2;
}
.brand-blue { background: #248cf5; }
.brand-orange { background: #ff7043; }
.brand-purple { background: #7650c8; }

.marker-pulse {
  position: absolute;
  top: -8rpx;
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  opacity: 0.5;
  animation: pulse 2.2s ease-out infinite;
}
.pulse-blue { background: #248cf5; }
.pulse-orange { background: #ff7043; }

@keyframes pulse {
  0% { transform: scale(0.6); opacity: 0.6; }
  100% { transform: scale(2.2); opacity: 0; }
}

.marker-label {
  margin-top: 12rpx;
  padding: 4rpx 16rpx;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 999rpx;
  font-size: 22rpx;
  color: #5f646d;
  box-shadow: 0 1px 8px rgba(18, 24, 38, 0.06);
}
.marker-label.active {
  background: linear-gradient(135deg, #ff8a4a 0%, #ff5b35 100%);
  color: #ffffff;
  font-weight: 700;
}

/* 导航栏 */
.status-spacer {
  position: relative;
  z-index: 10;
  background: transparent;
}

.nav-bar {
  position: relative;
  z-index: 10;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(20rpx);
  border-bottom: 1rpx solid rgba(241, 241, 241, 0.6);
}

.nav-back {
  position: absolute;
  left: 24rpx;
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 52rpx;
  color: #222;
  font-weight: 300;
  line-height: 1;
}

.nav-title {
  font-size: 34rpx;
  font-weight: 800;
  color: #222;
}

.nav-right {
  position: absolute;
  right: 28rpx;
}

.join-btn {
  padding: 0 32rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #ff8a4a 0%, #ff5b35 100%);
  color: #ffffff;
  font-size: 26rpx;
  font-weight: 700;
  box-shadow: 0 4rpx 14rpx rgba(255, 91, 53, 0.3);
}

/* 底部 sheet */
.bottom-sheet {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 720rpx;
  background: #ffffff;
  border-radius: 32rpx 32rpx 0 0;
  box-shadow: 0 -8rpx 30rpx rgba(18, 24, 38, 0.1);
  display: flex;
  flex-direction: column;
  z-index: 20;
}

.drag-handle {
  width: 72rpx;
  height: 8rpx;
  border-radius: 4rpx;
  background: #d9dde3;
  margin: 20rpx auto 8rpx;
  flex-shrink: 0;
}

.sheet-body {
  flex: 1;
  display: flex;
  min-height: 0;
}

/* 左侧树形导航 */
.tree-nav {
  width: 240rpx;
  flex-shrink: 0;
  background: #f7f7f8;
  border-right: 1rpx solid #f0f1f3;
}

.tree-node {
  position: relative;
  padding: 28rpx 24rpx 28rpx 28rpx;
  border-bottom: 1rpx solid #f0f1f3;
}

.tree-bar {
  position: absolute;
  left: 0;
  top: 24rpx;
  bottom: 24rpx;
  width: 6rpx;
  border-radius: 0 6rpx 6rpx 0;
  background: transparent;
}

.tree-node.active {
  background: #ffffff;
}
.tree-node.active .tree-bar {
  background: linear-gradient(180deg, #ff8a4a 0%, #ff5b35 100%);
}
.tree-node.active .tree-name {
  color: #222;
  font-weight: 800;
}

.tree-node-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8rpx;
}

.tree-name {
  font-size: 28rpx;
  color: #8a8f98;
  font-weight: 600;
}

.tree-tag {
  font-size: 18rpx;
  color: #8a8f98;
  background: #e8eaee;
  padding: 2rpx 10rpx;
  border-radius: 999rpx;
}
.tree-node.active .tree-tag {
  color: #ff5b35;
  background: rgba(255, 112, 67, 0.12);
}

.tree-sub {
  margin-top: 12rpx;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}
.tree-sub-item {
  font-size: 22rpx;
  color: #8a8f98;
  line-height: 30rpx;
}

/* 右侧详情卡片 */
.detail-card {
  flex: 1;
  padding: 28rpx;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.detail-head {
  display: flex;
  align-items: center;
  gap: 18rpx;
  margin-bottom: 22rpx;
}

.detail-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 20rpx;
  background: linear-gradient(135deg, #ff8a4a 0%, #ff5b35 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4rpx 14rpx rgba(255, 91, 53, 0.28);
}
.detail-icon-text {
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 800;
}

.detail-head-text {
  flex: 1;
  min-width: 0;
}
.detail-title {
  display: block;
  font-size: 32rpx;
  font-weight: 800;
  color: #222;
  line-height: 40rpx;
}
.detail-sub {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #8a8f98;
}

.detail-desc {
  font-size: 25rpx;
  color: #5f646d;
  line-height: 40rpx;
  margin-bottom: 24rpx;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 26rpx;
}

.chip {
  padding: 10rpx 26rpx;
  border-radius: 999rpx;
  background: #f0f1f3;
  border: 2rpx solid transparent;
}
.chip-text {
  font-size: 24rpx;
  color: #5f646d;
}
.chip.selected {
  background: rgba(36, 140, 245, 0.1);
  border-color: #248cf5;
}
.chip.selected .chip-text {
  color: #248cf5;
  font-weight: 700;
}
.chip.selected.orange {
  background: rgba(255, 112, 67, 0.12);
  border-color: #ff7043;
}
.chip.selected.orange .chip-text {
  color: #ff5b35;
}
.chip.selected.purple {
  background: rgba(118, 80, 200, 0.12);
  border-color: #7650c8;
}
.chip.selected.purple .chip-text {
  color: #7650c8;
}

.detail-meta {
  margin-top: auto;
  display: flex;
  align-items: center;
  background: #f7f7f8;
  border-radius: 18rpx;
  padding: 22rpx 0;
}
.meta-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.meta-num {
  font-size: 34rpx;
  font-weight: 800;
  color: #222;
  line-height: 1;
}
.meta-label {
  margin-top: 10rpx;
  font-size: 20rpx;
  color: #8a8f98;
}
.meta-divider {
  width: 1rpx;
  height: 48rpx;
  background: #e8eaee;
}
</style>

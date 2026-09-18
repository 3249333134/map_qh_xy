<template>
  <view class="store-nav-detail" :style="themeStyle">
    <!-- 全屏实景地图背景 -->
    <view class="nav-map-bg">
      <!-- 顶部导航 -->
      <view class="detail-nav overlay-nav">
        <view class="status-spacer" :style="{ height: statusBarHeight + 'px' }"></view>
        <view class="nav-row">
          <view class="nav-back" @tap="back">
            <text class="back-icon">‹</text>
          </view>
          <text class="nav-title">门店详情导航</text>
          <view class="nav-setting" @tap="openSetting">
            <text class="setting-icon">⚙</text>
          </view>
        </view>
      </view>

      <!-- 门店点位标记 -->
      <view class="store-marker">
        <view class="marker-pulse"></view>
        <view class="marker-avatar">
          <view class="avatar-inner">
            <text class="avatar-icon">{{ themeIcon }}</text>
          </view>
          <view class="marker-direction"></view>
        </view>
        <view class="distance-bubble">
          <text class="distance-value">{{ distanceKm }}Km</text>
        </view>
      </view>

      <!-- 绿色虚线定位引导 -->
      <view class="guide-line">
        <view class="guide-path"></view>
        <view class="guide-endpoint start"></view>
        <view class="guide-endpoint end"></view>
      </view>

      <!-- 底部门店名标签 -->
      <view class="store-name-chip">
        <text class="chip-text">{{ storeName }}</text>
        <text class="chip-addr">{{ storeAddress }}</text>
      </view>
    </view>

    <!-- 底部磨砂调节面板 -->
    <view class="glass-panel" :class="{ collapsed: isCollapsed }">
      <!-- 面板头部：门店名 + 收起 -->
      <view class="panel-head" @tap="togglePanel">
        <view class="head-left">
          <text class="head-name">{{ storeName }}</text>
          <text class="head-status">● 营业中</text>
        </view>
        <view class="head-collapse">
          <text class="collapse-icon">{{ isCollapsed ? '▲' : '▼' }}</text>
        </view>
      </view>

      <!-- Speed/Height 参数切换 Tab -->
      <view class="metric-tabs">
        <view class="metric-tab" :class="{ active: activeMetric === 'time' }" @tap="activeMetric = 'time'">
          <text>用餐时长</text>
        </view>
        <view class="metric-tab" :class="{ active: activeMetric === 'people' }" @tap="activeMetric = 'people'">
          <text>桌位人数</text>
        </view>
      </view>

      <!-- 大数字参数显示 -->
      <view class="metric-display">
        <text class="metric-number">{{ activeMetric === 'time' ? timeValue : peopleValue }}</text>
        <text class="metric-unit">{{ activeMetric === 'time' ? '小时' : '人' }}</text>
      </view>

      <!-- 刻度滑块 -->
      <view class="scale-ruler">
        <view class="scale-ticks">
          <view class="tick" v-for="i in 11" :key="i" :class="{ big: i === 1 || i === 6 || i === 11, active: i === currentTickIndex }"></view>
        </view>
        <view class="scale-nav">
          <view class="scale-btn prev" @tap="stepMetric(-1)">
            <text>‹</text>
          </view>
          <view class="scale-btn next" @tap="stepMetric(1)">
            <text>›</text>
          </view>
        </view>
      </view>

      <!-- 价格联动 -->
      <view class="price-row">
        <view class="price-block">
          <text class="price-label">套餐价</text>
          <text class="price-value">¥{{ dealPrice }}</text>
        </view>
        <view class="price-arrow">→</view>
        <view class="price-block">
          <text class="price-label">实时总价</text>
          <text class="price-value total">¥{{ totalPrice }}</text>
        </view>
      </view>

      <!-- 确认预约按钮 -->
      <view class="confirm-btn" @tap="confirmBooking">
        <text class="confirm-text">确认预约 · {{ peopleValue }}人 · {{ timeValue }}小时</text>
        <text class="confirm-arrow">››</text>
      </view>

      <!-- 关闭面板 X -->
      <view class="panel-close-btn" @tap="togglePanel">
        <text>×</text>
      </view>
    </view>

    <!-- 底部占位 -->
    <view :style="{ height: (bottomHeight + 40) + 'px' }"></view>
  </view>
</template>

<script>
import { ref, computed, onMounted } from 'vue'

const THEMES = {
  cateen:  { name: '餐饮', icon: '🍲', color: '#10b981', deep: '#059669', glow: 'rgba(16,185,129,0.35)', bg: 'rgba(16,185,129,0.16)' },
  beauty:  { name: '丽人', icon: '💅', color: '#ec4899', deep: '#db2777', glow: 'rgba(236,72,153,0.35)', bg: 'rgba(236,72,153,0.16)' },
  fitness: { name: '健身', icon: '🏋', color: '#f97316', deep: '#ea580c', glow: 'rgba(249,115,22,0.35)', bg: 'rgba(249,115,22,0.16)' },
  game:    { name: '娱乐', icon: '🎮', color: '#8b5cf6', deep: '#7c3aed', glow: 'rgba(139,92,246,0.35)', bg: 'rgba(139,92,246,0.16)' },
  massage: { name: '养生', icon: '💆', color: '#3b82f6', deep: '#2563eb', glow: 'rgba(59,130,246,0.35)', bg: 'rgba(59,130,246,0.16)' }
}

const CATEGORY_RULES = [
  { keys: ['美甲', '美容', '丽人', 'spa', 'hair', '美发'], theme: 'beauty' },
  { keys: ['健身', '游泳', '瑜伽', '私教'], theme: 'fitness' },
  { keys: ['密室', '桌游', '剧本', 'ktv', '网咖', '娱乐'], theme: 'game' },
  { keys: ['按摩', '足浴', '养生', 'spa会所', '推拿'], theme: 'massage' },
  { keys: ['火锅', '西餐', '奶茶', '咖啡', '烧烤', '日料', '餐'], theme: 'cateen' }
]

export default {
  name: 'TrackDetail',
  setup() {
    const storeData = ref({
      name: '渝椒·老火锅',
      author: '',
      description: '',
      address: '四川省成都市锦江区春熙路 88 号',
      distance: 2.1,
      category: '火锅',
      bookDeal: null,
      bookPrice: 168,
      people: 2
    })

    const bottomHeight = ref(80)
    const statusBarHeight = ref(20)
    const distanceKm = ref('2.1')
    const activeMetric = ref('people')
    const isCollapsed = ref(false)
    const timeValue = ref(2)   // 用餐时长（小时）
    const peopleValue = ref(4) // 桌位人数
    const dealPrice = ref(168)
    const basePeople = ref(2)

    // 品类主题
    const themeKey = computed(() => {
      const raw = (storeData.value.category || storeData.value.name || '').toLowerCase()
      for (let i = 0; i < CATEGORY_RULES.length; i++) {
        const rule = CATEGORY_RULES[i]
        for (let k = 0; k < rule.keys.length; k++) {
          if (raw.indexOf(rule.keys[k]) !== -1) return rule.theme
        }
      }
      return 'cateen'
    })
    const theme = computed(() => THEMES[themeKey.value] || THEMES.cateen)
    const themeStyle = computed(() => ({
      '--tc': theme.value.color,
      '--tc-deep': theme.value.deep,
      '--tc-glow': theme.value.glow,
      '--tc-bg': theme.value.bg
    }))
    const themeIcon = computed(() => theme.value.icon)

    const storeName = computed(() => storeData.value.name || '门店名称')
    const storeAddress = computed(() => storeData.value.address || '四川省成都市锦江区')

    // 价格联动：按人数缩放套餐价
    const perPerson = computed(() => {
      if (basePeople.value <= 0) return dealPrice.value
      return Math.round(dealPrice.value / basePeople.value)
    })
    const totalPrice = computed(() => perPerson.value * peopleValue.value)

    const currentTickIndex = computed(() => {
      if (activeMetric.value === 'time') {
        return Math.min(10, Math.max(1, timeValue.value))
      }
      return Math.min(10, Math.max(1, peopleValue.value))
    })

    const stepMetric = (dir) => {
      if (activeMetric.value === 'time') {
        let v = timeValue.value + dir
        v = Math.max(1, Math.min(10, v))
        timeValue.value = v
      } else {
        let v = peopleValue.value + dir
        v = Math.max(1, Math.min(10, v))
        peopleValue.value = v
      }
    }

    const togglePanel = () => {
      isCollapsed.value = !isCollapsed.value
    }

    const openSetting = () => {
      uni.showToast({ title: '设置功能待实现', icon: 'none' })
    }

    // 确认预约 → 提交订单
    const confirmBooking = () => {
      uni.showModal({
        title: '确认预约',
        content: `${storeName.value}\n${peopleValue.value}人 · ${timeValue.value}小时 · 合计 ¥${totalPrice.value}`,
        confirmText: '提交订单',
        success: (res) => {
          if (res.confirm) {
            const orders = uni.getStorageSync('ACTIVE_BOOKINGS') || []
            const order = {
              id: `bk_${Date.now()}`,
              name: storeName.value,
              address: storeAddress.value,
              category: theme.value.name,
              people: peopleValue.value,
              duration: timeValue.value,
              price: totalPrice.value,
              time: new Date().toISOString(),
              status: 'pending'
            }
            uni.setStorageSync('ACTIVE_BOOKINGS', [order, ...orders])
            uni.showToast({ title: '预约成功，已加入待服务', icon: 'success' })
            setTimeout(() => uni.navigateBack(), 600)
          }
        }
      })
    }

    const back = () => {
      uni.navigateBack()
    }

    const loadData = () => {
      try {
        const item = uni.getStorageSync('INDEX_LAST_ITEM') || uni.getStorageSync('SERVICE_LAST_ITEM') || uni.getStorageSync('CONTENT_DETAIL_ACTIVE_V1')
        if (item && (item._id || item.name)) {
          storeData.value = { ...storeData.value, ...item }
          if (item.distance) distanceKm.value = Number(item.distance).toFixed(1)
          if (item.address) storeData.value.address = item.address
          if (item.category) storeData.value.category = item.category
          const deal = item.bookDeal
          if (deal && deal.price) {
            dealPrice.value = Number(deal.price)
            basePeople.value = Number(item.people || 2) || 2
          } else if (item.price) {
            dealPrice.value = Number(item.price)
          }
          if (item.people) peopleValue.value = Number(item.people)
        }
      } catch (e) {
        console.warn('加载门店导航数据失败:', e)
      }
    }

    onMounted(() => {
      loadData()
      try {
        const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
        statusBarHeight.value = info.statusBarHeight || 20
      } catch (e) {}
    })

    return {
      storeData,
      bottomHeight,
      statusBarHeight,
      distanceKm,
      activeMetric,
      isCollapsed,
      timeValue,
      peopleValue,
      dealPrice,
      themeStyle,
      themeIcon,
      storeName,
      storeAddress,
      totalPrice,
      currentTickIndex,
      stepMetric,
      togglePanel,
      openSetting,
      confirmBooking,
      back
    }
  }
}
</script>

<style scoped>
.store-nav-detail {
  --tc: #10b981;
  --tc-deep: #059669;
  --tc-glow: rgba(16, 185, 129, 0.35);
  --tc-bg: rgba(16, 185, 129, 0.16);
  min-height: 100vh;
  background: #0b1220;
  position: relative;
  overflow: hidden;
}

/* ========= 全屏实景地图背景 ========= */
.nav-map-bg {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1500rpx;
  overflow: hidden;
  background:
    radial-gradient(circle at 22% 68%, var(--tc-glow) 0%, transparent 48%),
    radial-gradient(circle at 78% 32%, rgba(251,146,60,0.16) 0%, transparent 40%),
    linear-gradient(180deg, #16233b 0%, #101c30 60%, #0b1220 100%);
}

/* 商圈街道网格 */
.nav-map-bg::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(90deg, rgba(148,163,184,0.1) 1px, transparent 1px),
    linear-gradient(rgba(148,163,184,0.1) 1px, transparent 1px);
  background-size: 80rpx 80rpx;
  mask-image: linear-gradient(180deg, black 0%, transparent 90%);
  -webkit-mask-image: linear-gradient(180deg, black 0%, transparent 90%);
}

/* 商圈楼宇剪影 */
.nav-map-bg::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 66%;
  background:
    radial-gradient(ellipse 90rpx 300rpx at 18% 100%, rgba(100,116,139,0.5) 0 40%, transparent 52%),
    linear-gradient(180deg, transparent 40%, rgba(100,116,139,0.4) 40% 44%, transparent 44%) 18% 100% / 20rpx 620rpx no-repeat,
    radial-gradient(ellipse 110rpx 340rpx at 38% 100%, rgba(148,163,184,0.4) 0 40%, transparent 52%),
    linear-gradient(180deg, transparent 32%, rgba(148,163,184,0.34) 32% 36%, transparent 36%) 38% 100% / 24rpx 700rpx no-repeat,
    radial-gradient(ellipse 80rpx 260rpx at 58% 100%, rgba(100,116,139,0.45) 0 40%, transparent 52%),
    linear-gradient(180deg, transparent 48%, rgba(100,116,139,0.38) 48% 52%, transparent 52%) 58% 100% / 18rpx 540rpx no-repeat,
    radial-gradient(ellipse 100rpx 320rpx at 76% 100%, rgba(148,163,184,0.42) 0 40%, transparent 52%),
    linear-gradient(180deg, transparent 36%, rgba(148,163,184,0.36) 36% 40%, transparent 40%) 76% 100% / 22rpx 660rpx no-repeat,
    radial-gradient(ellipse 90rpx 280rpx at 92% 100%, rgba(100,116,139,0.4) 0 40%, transparent 52%);
  opacity: 0.9;
  filter: blur(0.5px);
}

/* ========= 顶部导航 ========= */
.overlay-nav {
  position: relative;
  z-index: 20;
}

.nav-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 28rpx;
}

.nav-back,
.nav-setting {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-icon {
  font-size: 44rpx;
  color: #ffffff;
  font-weight: bold;
  line-height: 44rpx;
  margin-right: 4rpx;
}

.setting-icon {
  font-size: 36rpx;
  color: #ffffff;
}

.nav-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.5rpx;
  text-shadow: 0 2rpx 10rpx rgba(0,0,0,0.5);
}

/* ========= 门店点位 ========= */
.store-marker {
  position: absolute;
  left: 52%;
  top: 30%;
  z-index: 15;
  transform: translate(-50%, -50%);
}

.marker-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 12rpx 30rpx rgba(0, 0, 0, 0.1);
}

.marker-avatar::before {
  content: '';
  position: absolute;
  inset: 7rpx;
  border-radius: 50%;
  background: var(--color-text);
}

.avatar-inner {
  position: relative;
  z-index: 2;
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: linear-gradient(140deg, var(--tc) 0%, var(--tc-deep) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-icon {
  font-size: 32rpx;
}

.marker-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 180rpx;
  height: 180rpx;
  border-radius: 50%;
  background: radial-gradient(circle, var(--tc-glow) 0%, rgba(16,185,129,0.06) 55%, transparent 100%);
}

.marker-direction {
  position: absolute;
  bottom: -12rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 13rpx solid transparent;
  border-right: 13rpx solid transparent;
  border-top: 15rpx solid #ffffff;
  filter: drop-shadow(0 4rpx 4rpx rgba(0,0,0,0.2));
}

.distance-bubble {
  position: absolute;
  top: 50%;
  left: calc(100% + 26rpx);
  transform: translateY(-50%);
  padding: 12rpx 22rpx;
  background: rgba(17, 24, 39, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(10px);
  border-radius: 22rpx;
  white-space: nowrap;
}

.distance-value {
  font-size: 28rpx;
  font-weight: 700;
  color: var(--tc);
}

/* 绿色虚线定位引导 */
.guide-line {
  position: absolute;
  top: 26%;
  left: 52%;
  width: 6rpx;
  height: 560rpx;
  z-index: 10;
}

.guide-path {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 6rpx;
  height: 100%;
  background-image: repeating-linear-gradient(180deg, var(--tc) 0 18rpx, transparent 18rpx 36rpx);
  opacity: 0.75;
}

.guide-endpoint {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  background: var(--tc);
  box-shadow: 0 0 0 8rpx var(--tc-bg);
}

.guide-endpoint.start { top: 0; }
.guide-endpoint.end { bottom: 0; background: #ffffff; box-shadow: 0 0 0 8rpx var(--tc-glow); }

/* 底部门店名标签 */
.store-name-chip {
  position: absolute;
  left: 50%;
  bottom: 260rpx;
  transform: translateX(-50%);
  z-index: 14;
  padding: 20rpx 32rpx;
  background: rgba(17, 24, 39, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 28rpx;
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
  box-shadow: 0 14rpx 30rpx rgba(0, 0, 0, 0.1);
  max-width: 560rpx;
}

.chip-text {
  font-size: 30rpx;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.5rpx;
}

.chip-addr {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.55);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 480rpx;
}

/* ========= 底部磨砂调节面板 ========= */
.glass-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  padding: 28rpx 32rpx 40rpx;
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
  background: rgba(17, 24, 39, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-bottom: none;
  border-radius: 48rpx 48rpx 0 0;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 -20rpx 60rpx rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.glass-panel.collapsed {
  transform: translateY(calc(100% - 110rpx));
}

/* 面板头部 */
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 22rpx;
}

.head-left {
  display: flex;
  align-items: center;
  gap: 14rpx;
  min-width: 0;
}

.head-name {
  font-size: 28rpx;
  font-weight: 700;
  color: #ffffff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 380rpx;
}

.head-status {
  font-size: 20rpx;
  color: var(--tc);
  flex-shrink: 0;
}

.head-collapse {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
}

.collapse-icon {
  font-size: 22rpx;
  color: var(--color-text-muted);
}

/* 参数切换 Tab */
.metric-tabs {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.metric-tab {
  padding: 14rpx 30rpx;
  border-radius: 40rpx;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.metric-tab text {
  font-size: 26rpx;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
}

.metric-tab.active {
  background: #ffffff;
}

.metric-tab.active text {
  color: var(--color-text);
  font-weight: 700;
}

/* 大数字 */
.metric-display {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 14rpx;
  margin-bottom: 24rpx;
}

.metric-number {
  font-size: 110rpx;
  font-weight: 800;
  color: #ffffff;
  line-height: 1;
  letter-spacing: 2rpx;
  font-family: "SF Mono", Consolas, monospace;
}

.metric-unit {
  font-size: 40rpx;
  font-weight: 600;
  color: var(--tc);
  letter-spacing: 2rpx;
  margin-bottom: 12rpx;
}

/* 刻度滑块 */
.scale-ruler {
  padding: 0 16rpx 8rpx;
  position: relative;
}

.scale-ticks {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 72rpx;
  padding: 0 60rpx;
}

.tick {
  width: 4rpx;
  height: 24rpx;
  border-radius: 4rpx;
  background: rgba(255, 255, 255, 0.22);
  transition: all 0.2s ease;
}

.tick.big {
  height: 40rpx;
  width: 5rpx;
}

.tick.active {
  background: var(--tc);
  height: 52rpx;
  width: 6rpx;
  box-shadow: 0 0 12rpx var(--tc-glow);
}

.scale-nav {
  position: absolute;
  left: 50%;
  top: 58%;
  transform: translate(-50%, -50%);
  display: flex;
  gap: 4rpx;
  padding: 8rpx 10rpx;
  background: rgba(17, 24, 39, 0.9);
  border-radius: 40rpx;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.scale-btn {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.scale-btn.prev {
  background: rgba(255, 255, 255, 0.1);
}

.scale-btn.next {
  background: #ffffff;
}

.scale-btn text {
  font-size: 42rpx;
  font-weight: bold;
  color: #ffffff;
  line-height: 42rpx;
}

.scale-btn.next text {
  color: var(--color-text);
  margin-left: 4rpx;
}

/* 价格联动 */
.price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  padding: 22rpx 26rpx;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 26rpx;
  margin-bottom: 20rpx;
}

.price-block {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.price-label {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.5);
}

.price-value {
  font-size: 36rpx;
  font-weight: 800;
  color: #ffffff;
  font-family: "SF Mono", Consolas, monospace;
}

.price-value.total {
  color: var(--tc);
}

.price-arrow {
  font-size: 34rpx;
  color: var(--tc);
  font-weight: 700;
}

/* 确认预约按钮 */
.confirm-btn {
  height: 100rpx;
  border-radius: 50rpx;
  background: linear-gradient(135deg, var(--tc) 0%, var(--tc-deep) 100%);
  box-shadow: 0 14rpx 34rpx var(--tc-glow);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}

.confirm-text {
  font-size: 32rpx;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 1rpx;
}

.confirm-arrow {
  font-size: 30rpx;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 700;
  letter-spacing: 2rpx;
}

/* 关闭面板 X */
.panel-close-btn {
  position: absolute;
  top: 24rpx;
  right: 24rpx;
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
}

.panel-close-btn text {
  font-size: 40rpx;
  color: var(--color-text-muted);
  line-height: 40rpx;
}
</style>

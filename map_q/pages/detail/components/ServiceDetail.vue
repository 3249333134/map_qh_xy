<template>
  <view class="store-detail-page" :class="{ light: !isDark }" :style="themeStyle">
    <!-- 顶部沉浸导航 -->
    <view class="detail-nav immersive">
      <view class="status-spacer" :style="{ height: statusBarHeight + 'px' }"></view>
      <view class="nav-row">
        <view class="nav-back" @tap="back">
          <text class="back-icon">‹</text>
        </view>
        <text class="nav-title">{{ serviceData.name || '门店详情' }}</text>
        <view class="nav-actions">
          <view class="nav-icon-btn" @tap="toggleTheme">
            <text class="nav-icon">{{ isDark ? '☀' : '☾' }}</text>
          </view>
          <view class="nav-icon-btn" @tap="toggleCollect">
            <text class="nav-icon" :class="{ active: isCollected }">{{ isCollected ? '★' : '☆' }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 实景全屏虚化背景 -->
    <view class="store-bg" :style="{ paddingTop: statusBarHeight + 'px' }">
      <image v-if="storeImage" class="bg-img" :src="storeImage" mode="aspectFill" />
      <view class="bg-scene"></view>
      <view class="bg-tint"></view>

      <!-- 顶部通知气泡 -->
      <view class="notif-bubble" :style="{ top: (statusBarHeight + 80) + 'px' }" v-if="showNotification" @tap="showNotification = false">
        <view class="notif-avatar">{{ themeIcon }}</view>
        <view class="notif-body">
          <text class="notif-title">「{{ serviceData.name }}」上新套餐</text>
          <text class="notif-sub">今日到店预约立减 ¥20 ›</text>
        </view>
        <view class="notif-close">
          <text>×</text>
        </view>
      </view>

      <!-- 门店基础信息悬浮卡 -->
      <view class="store-info-card">
        <text class="store-name">{{ serviceData.name || '门店名称' }}</text>
        <view class="store-meta-row">
          <view class="star-chip">
            <text class="star-icon">★</text>
            <text class="star-value">{{ ratingValue }}</text>
          </view>
          <view class="cat-chip">
            <text class="cat-text">{{ categoryName }}</text>
          </view>
          <view class="dist-chip">
            <text class="dist-text">⎋ {{ distanceKm }} km</text>
          </view>
        </view>
        <view class="store-hours-row">
          <view class="hours-item">
            <text class="hours-label">营业时间</text>
            <text class="hours-value">{{ openingHours }}</text>
          </view>
          <view class="hours-item right">
            <text class="hours-label">人均</text>
            <text class="hours-value">¥{{ perPerson }}</text>
          </view>
        </view>
        <view class="store-badges">
          <view class="badge" v-for="b in badges" :key="b">
            <text>{{ b }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 内容区 -->
    <view class="store-content">
      <!-- Price / Pickup Time -->
      <view class="pt-row glass">
        <view class="pt-block">
          <text class="pt-label">Price · 套餐总价</text>
          <text class="pt-value price">¥{{ selectedDealPrice }}</text>
        </view>
        <view class="pt-block right">
          <text class="pt-label">Pickup Time · 到店时段</text>
          <text class="pt-value">{{ pickupTime }}</text>
        </view>
      </view>

      <!-- 地址双点位 -->
      <view class="addr-section glass">
        <view class="addr-item">
          <view class="addr-dot my-dot"></view>
          <view class="addr-info">
            <text class="addr-label">我的位置</text>
            <text class="addr-value">当前定位 · {{ myLocationText }}</text>
          </view>
        </view>
        <view class="addr-line">
          <view class="line-dash"></view>
          <view class="line-mid">{{ distanceKm }} km</view>
          <view class="line-dash"></view>
        </view>
        <view class="addr-item">
          <view class="addr-dot store-dot"></view>
          <view class="addr-info">
            <text class="addr-label">门店地址</text>
            <text class="addr-value">{{ addressText }}</text>
          </view>
        </view>
      </view>

      <!-- 预约剩余名额进度条 -->
      <view class="quota-section glass">
        <view class="quota-head">
          <text class="quota-label">预约剩余名额</text>
          <text class="quota-value">{{ quotaPercent }}%</text>
        </view>
        <view class="quota-bar">
          <view class="quota-fill" :style="{ width: quotaPercent + '%' }"></view>
          <view class="quota-glow" :style="{ left: quotaPercent + '%' }"></view>
        </view>
        <text class="quota-sub">今日剩余 {{ quotaLeft }} 个时段 · 先到先得</text>
      </view>

      <!-- 套餐列表 -->
      <view class="deal-section">
        <view class="section-head">
          <text class="section-title">精选{{ categoryName }}套餐</text>
          <text class="section-more">查看全部 ›</text>
        </view>
        <view class="deal-list">
          <view
            class="deal-item glass"
            v-for="d in deals"
            :key="d.id"
            :class="{ active: selectedDeal === d.id }"
            @tap="selectDeal(d)">
            <view class="deal-thumb" :style="{ background: themeDealBg }">
              <text class="deal-thumb-icon">{{ d.icon }}</text>
            </view>
            <view class="deal-info">
              <text class="deal-name">{{ d.name }}</text>
              <text class="deal-desc">{{ d.desc }}</text>
            </view>
            <view class="deal-right">
              <text class="deal-price">¥{{ d.price }}</text>
              <view class="deal-add" :class="{ checked: selectedDeal === d.id }">
                <text>{{ selectedDeal === d.id ? '✓' : '+' }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 门店简介 -->
      <view class="intro-section glass">
        <text class="intro-title">门店简介</text>
        <text class="intro-text">{{ serviceData.description || '门店提供专业到店服务，支持在线预约、到店核销，高峰期建议提前预约时段。' }}</text>
      </view>

      <!-- 底部占位 -->
      <view :style="{ height: (bottomHeight + 40) + 'px' }"></view>
    </view>

    <!-- 底部悬浮行动按钮 -->
    <view class="bottom-cta">
      <view class="cta-left">
        <text class="cta-price">¥{{ selectedDealPrice }}</text>
        <text class="cta-people">{{ people }}人 · {{ pickupTime }}</text>
      </view>
      <view class="cta-btn" :class="{ disabled: !canBook }" @tap="handleBook">
        <text class="cta-text">{{ canBook ? '立即预约到店' : '已约满' }}</text>
        <text class="cta-arrow">››</text>
      </view>
    </view>
  </view>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { normalizeServiceCategory } from '../../../utils/serviceCatalog.js'
import { useInteraction } from '../../../utils/interaction.js'
import { shareActiveContent } from '../../../utils/contentShare.js'

// 品类差异化主题
const THEMES = {
  cateen:   { name: '餐饮',  icon: '餐', color: '#0f9f92', deep: '#087f75', glow: 'rgba(15,159,146,0.28)', bg: 'rgba(15,159,146,0.12)' },
  beauty:   { name: '丽人',  icon: '丽', color: '#c85c82', deep: '#a84368', glow: 'rgba(200,92,130,0.25)', bg: 'rgba(200,92,130,0.12)' },
  fitness:  { name: '健身',  icon: '健', color: '#3f7ea8', deep: '#2d6388', glow: 'rgba(63,126,168,0.25)', bg: 'rgba(63,126,168,0.12)' },
  game:     { name: '休闲',  icon: '玩', color: '#6b74c9', deep: '#5059ad', glow: 'rgba(107,116,201,0.25)', bg: 'rgba(107,116,201,0.12)' },
  massage:  { name: '探店',  icon: '探', color: '#9a7437', deep: '#795824', glow: 'rgba(154,116,55,0.25)', bg: 'rgba(154,116,55,0.12)' }
}

const CATEGORY_RULES = [
  { keys: ['美甲', '美容', '丽人', 'spa', 'hair', '美发'], theme: 'beauty' },
  { keys: ['健身', '游泳', '瑜伽', '私教'], theme: 'fitness' },
  { keys: ['密室', '桌游', '剧本', 'ktv', '网咖', '娱乐'], theme: 'game' },
  { keys: ['按摩', '足浴', '养生', 'spa会所', '推拿'], theme: 'massage' },
  { keys: ['火锅', '西餐', '奶茶', '咖啡', '烧烤', '日料', '餐'], theme: 'cateen' }
]

const DEALS_BY_THEME = {
  cateen: [
    { id: 'd1', name: '双人火锅套餐', desc: '招牌锅底 · 精选涮品 8 份', price: 168, icon: '🥘' },
    { id: 'd2', name: '四人聚餐套餐', desc: '鸳鸯锅 · 涮品 16 份 · 饮品 4 杯', price: 328, icon: '🍢' },
    { id: 'd3', name: '单人尝鲜套餐', desc: '午市专享 · 一荤两素', price: 58, icon: '🍜' }
  ],
  beauty: [
    { id: 'd1', name: '精致美甲套餐', desc: '基础修护 + 纯色甲油胶', price: 128, icon: '💅' },
    { id: 'd2', name: 'SPA 深层护理', desc: '全身精油 · 90 分钟', price: 298, icon: '🧖' },
    { id: 'd3', name: '眉眼精修套餐', desc: '眉形设计 + 纹绣体验', price: 388, icon: '✨' }
  ],
  fitness: [
    { id: 'd1', name: '私教体验课', desc: '1v1 体测 + 训练计划', price: 99, icon: '🏋' },
    { id: 'd2', name: '月卡畅游', desc: '游泳馆 30 天不限次', price: 399, icon: '🏊' },
    { id: 'd3', name: '团课周卡', desc: '瑜伽 / 搏击任选', price: 199, icon: '🧘' }
  ],
  game: [
    { id: 'd1', name: '双人密室逃脱', desc: '60 分钟 · 恐怖主题任选', price: 198, icon: '🔦' },
    { id: 'd2', name: '四人桌游畅玩', desc: '3 小时 · 含饮品小食', price: 128, icon: '🎲' },
    { id: 'd3', name: '包厢欢唱 3h', desc: 'KTV 中包 · 含果盘', price: 268, icon: '🎤' }
  ],
  massage: [
    { id: 'd1', name: '肩颈舒缓按摩', desc: '45 分钟 · 专业技师', price: 158, icon: '💆' },
    { id: 'd2', name: '全身足浴套餐', desc: '60 分钟 · 药浴 + 足底', price: 128, icon: '🦶' },
    { id: 'd3', name: '经络推拿 90min', desc: '全身经络 · 深度放松', price: 268, icon: '🧘' }
  ]
}

export default {
  name: 'ServiceDetail',
  setup() {
    const serviceData = ref({
      name: '渝椒·老火锅',
      title: '',
      author: '渝椒老火锅',
      description: '',
      rating: 4.8,
      price: 168,
      likes: 0,
      location: null,
      address: '四川省成都市锦江区春熙路 88 号',
      category: '火锅'
    })

    const isCollected = ref(false)
    const showNotification = ref(true)
    const isDark = ref(true)
    const bottomHeight = ref(80)
    const statusBarHeight = ref(20)
    const selectedDeal = ref('d1')
    const people = ref(2)
    const pickupTime = ref('19:30')
    const quotaPercent = ref(76)
    const distanceKm = ref('2.1')
    const myLocationText = ref('锦江区·春熙路')
    const interaction = useInteraction()

    // 品类主题识别
    const themeKey = computed(() => {
      const category = normalizeServiceCategory(serviceData.value.serviceCategory || serviceData.value.category)
      return { food: 'cateen', leisure: 'game', beauty: 'beauty', fitness: 'fitness', visit: 'massage' }[category] || 'cateen'
    })
    const theme = computed(() => THEMES[themeKey.value] || THEMES.cateen)

    const themeStyle = computed(() => ({
      '--tc': theme.value.color,
      '--tc-deep': theme.value.deep,
      '--tc-glow': theme.value.glow,
      '--tc-bg': theme.value.bg
    }))
    const themeIcon = computed(() => theme.value.icon)
    const categoryName = computed(() => theme.value.name)
    const themeDealBg = computed(() => theme.value.bg)

    const deals = computed(() => DEALS_BY_THEME[themeKey.value] || DEALS_BY_THEME.cateen)
    const selectedDealObj = computed(() => {
      return deals.value.find(d => d.id === selectedDeal.value) || deals.value[0]
    })
    const selectedDealPrice = computed(() => {
      const base = selectedDealObj.value ? selectedDealObj.value.price : 0
      return base * people.value
    })

    const ratingValue = computed(() => {
      const raw = Number(serviceData.value.rating || serviceData.value.score || 4.8)
      return raw.toFixed(1)
    })
    const openingHours = computed(() => serviceData.value.openingHours || '10:00 - 22:00')
    const perPerson = computed(() => Number(serviceData.value.price || 88))
    const addressText = computed(() => serviceData.value.address || serviceData.value.location?.address || '四川省成都市锦江区')
    const storeImage = computed(() => {
      const imgs = serviceData.value.media || serviceData.value.images || []
      return imgs.length ? imgs[0].url || imgs[0] : ''
    })
    const quotaLeft = computed(() => Math.max(0, Math.round(quotaPercent.value / 10)))
    const badges = computed(() => {
      const supplied = serviceData.value.highlights || serviceData.value.service?.highlights
      if (Array.isArray(supplied) && supplied.length) return supplied
      const base = ['预约免排队', '支持到店核销']
      if (themeKey.value === 'cateen') return ['新店开业', ...base]
      if (themeKey.value === 'beauty') return ['金牌技师', ...base]
      if (themeKey.value === 'fitness') return ['单次体验', ...base]
      return base
    })

    const canBook = computed(() => quotaPercent.value < 100)

    const selectDeal = (d) => {
      selectedDeal.value = d.id
    }

    const toggleTheme = () => {
      isDark.value = !isDark.value
    }

    const toggleCollect = () => {
      const cardId = serviceData.value._id || serviceData.value.id
      isCollected.value = interaction.toggleFavorite(cardId, serviceData.value)
      uni.showToast({ title: isCollected.value ? '已收藏门店' : '取消收藏', icon: 'none' })
    }

    // 一键预约 → 跳转地图参数调节页
    const handleBook = () => {
      if (!canBook.value) {
        uni.showToast({ title: '今日已约满，请改日再约', icon: 'none' })
        return
      }
      // 透传门店数据到调节页
      const carry = { ...serviceData.value, type: 'service', bookDeal: selectedDealObj.value, bookPrice: selectedDealPrice.value, people: people.value, quotaPercent: quotaPercent.value }
      uni.setStorageSync('INDEX_LAST_ITEM', carry)
      uni.setStorageSync('BOOKING_ITEM', carry)
      uni.setStorageSync('SERVICE_LAST_ITEM', carry)
      uni.navigateTo({
        url: `/pages/service-params/index?id=${encodeURIComponent(carry._id || carry.id || '')}&category=${encodeURIComponent(carry.serviceCategory || carry.category || 'food')}`
      })
    }

    const back = () => {
      uni.navigateBack()
    }

    const loadData = () => {
      try {
        const item = uni.getStorageSync('SERVICE_LAST_ITEM') || uni.getStorageSync('INDEX_LAST_ITEM') || uni.getStorageSync('CONTENT_DETAIL_ACTIVE_V1')
        if (item && item._id) {
          serviceData.value = { ...serviceData.value, ...item }
          const cardId = item._id || item.id
          isCollected.value = interaction.isFavorited(cardId)
          if (item.distance) distanceKm.value = Number(item.distance).toFixed(1)
          if (item.address) serviceData.value.address = item.address
          if (item.category) serviceData.value.category = item.category
        }
      } catch (e) {
        console.warn('加载门店数据失败:', e)
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
      serviceData,
      isCollected,
      showNotification,
      isDark,
      bottomHeight,
      statusBarHeight,
      selectedDeal,
      people,
      pickupTime,
      quotaPercent,
      distanceKm,
      myLocationText,
      themeIcon,
      categoryName,
      themeDealBg,
      deals,
      selectedDealPrice,
      ratingValue,
      openingHours,
      perPerson,
      addressText,
      storeImage,
      quotaLeft,
      badges,
      canBook,
      themeStyle,
      selectDeal,
      toggleTheme,
      toggleCollect,
      handleBook,
      back
    }
  }
}
</script>

<style scoped>
.store-detail-page {
  --tc: #10b981;
  --tc-deep: #059669;
  --tc-glow: rgba(16, 185, 129, 0.35);
  --tc-bg: rgba(16, 185, 129, 0.16);
  min-height: 100vh;
  background: #0b1220;
  transition: background 0.3s ease;
}

.store-detail-page.light {
  background: #eef1f5;
}

/* ========= 沉浸式导航 ========= */
.detail-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.detail-nav.immersive {
  background: linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 100%);
}

.nav-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
}

.nav-back,
.nav-icon-btn {
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
}

.back-icon {
  font-size: 30px;
  font-weight: bold;
  color: #ffffff;
  line-height: 30px;
}

.nav-title {
  flex: 1;
  min-width: 0;
  margin: 0 12px;
  font-size: 17px;
  font-weight: 600;
  color: #ffffff;
  max-width: 360rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-shadow: 0 1px 4px rgba(0,0,0,0.4);
}

.nav-actions {
  flex-shrink: 0;
  display: flex;
  gap: 10px;
}

.nav-icon {
  font-size: 18px;
  color: #ffffff;
}

.nav-icon.active {
  color: #ffd76a;
}

/* ========= 实景全屏虚化背景 ========= */
.store-bg {
  min-height: 400px;
  position: relative;
  height: 700rpx;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.bg-img {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 100%;
  width: 100%;
  filter: blur(6px) brightness(0.75);
  transform: scale(1.1);
}

.bg-scene {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 70% 40% at 50% 100%, var(--tc-glow) 0%, transparent 70%),
    radial-gradient(circle 320rpx at 24% 62%, rgba(255,255,255,0.1) 0%, transparent 60%),
    radial-gradient(circle 420rpx at 78% 38%, rgba(251,146,60,0.16) 0%, transparent 60%),
    linear-gradient(180deg, var(--color-text) 0%, #1e293b 55%, var(--color-text) 100%);
}

.store-detail-page.light .bg-scene {
  background:
    radial-gradient(ellipse 70% 40% at 50% 100%, var(--tc-glow) 0%, transparent 70%),
    radial-gradient(circle 320rpx at 24% 62%, rgba(255,255,255,0.5) 0%, transparent 60%),
    radial-gradient(circle 420rpx at 78% 38%, rgba(251,146,60,0.18) 0%, transparent 60%),
    linear-gradient(180deg, #dbe2ea 0%, #c3cdd8 55%, #dbe2ea 100%);
}

.bg-tint {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 30%, rgba(11, 18, 32, 0.55) 80%, #0b1220 100%);
}

.store-detail-page.light .bg-tint {
  background: linear-gradient(180deg, transparent 30%, rgba(238, 241, 245, 0.55) 80%, #eef1f5 100%);
}

/* 顶部通知气泡 */
.notif-bubble {
  position: absolute;
  top: 0;
  left: 24rpx;
  right: 24rpx;
  z-index: 30;
  padding: 16rpx 20rpx;
  background: rgba(17, 24, 39, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24rpx;
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  gap: 16rpx;
  box-shadow: 0 12rpx 28rpx rgba(0, 0, 0, 0.1);
}

.store-detail-page.light .notif-bubble {
  background: rgba(255, 255, 255, 0.78);
  border-color: rgba(255, 255, 255, 0.7);
}

.notif-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 18rpx;
  background: linear-gradient(140deg, var(--tc), var(--tc-deep));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  flex-shrink: 0;
}

.notif-body {
  flex: 1;
  min-width: 0;
}

.notif-title {
  display: block;
  font-size: 24rpx;
  font-weight: 600;
  color: #ffffff;
  line-height: 1.4;
}

.store-detail-page.light .notif-title { color: var(--color-text); }

.notif-sub {
  display: block;
  font-size: 20rpx;
  color: var(--tc);
  margin-top: 4rpx;
}

.notif-close {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.store-detail-page.light .notif-close { background: rgba(0,0,0,0.06); }

.notif-close text {
  font-size: 32rpx;
  color: var(--color-text-muted);
  line-height: 32rpx;
}

/* 门店基础信息悬浮卡 */
.store-info-card {
  position: relative;
  z-index: 20;
  margin: 0 24rpx 28rpx;
  padding: 28rpx 30rpx 26rpx;
  background: rgba(17, 24, 39, 0.68);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 18rpx 40rpx rgba(0, 0, 0, 0.1);
  border-radius: 24px;
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
}

.store-detail-page.light .store-info-card {
  background: rgba(255, 255, 255, 0.82);
  border-color: rgba(255, 255, 255, 0.85);
  box-shadow: 0 14rpx 32rpx rgba(0, 0, 0, 0.1);
}

.store-name {
  display: block;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: 0.5rpx;
  margin-bottom: 16rpx;
  font-size: 24px;
  line-height: 1.4;
}

.store-detail-page.light .store-name { color: var(--color-text); }

.store-meta-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.star-chip,
.cat-chip,
.dist-chip {
  padding: 8rpx 16rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  gap: 6rpx;
}

.star-chip {
  background: rgba(250, 204, 21, 0.16);
  border: 1px solid rgba(250, 204, 21, 0.3);
}

.star-icon {
  font-size: 20rpx;
  color: #facc15;
}

.star-value {
  font-size: 22rpx;
  font-weight: 700;
  color: #fde68a;
}

.cat-chip {
  background: var(--tc-bg);
  border: 1px solid var(--tc-glow);
}

.cat-text {
  font-size: 22rpx;
  font-weight: 600;
  color: var(--tc);
}

.dist-chip {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.store-detail-page.light .dist-chip {
  background: rgba(15, 23, 42, 0.06);
  border-color: rgba(15, 23, 42, 0.08);
}

.dist-text {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.8);
}

.store-detail-page.light .dist-text { color: var(--color-text-body); }

.store-hours-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 0;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 16rpx;
}

.store-detail-page.light .store-hours-row {
  border-color: rgba(15, 23, 42, 0.08);
}

.hours-item { display: flex; flex-direction: column; gap: 4rpx; }
.hours-item.right { align-items: flex-end; }

.hours-label {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.5);
}

.store-detail-page.light .hours-label { color: var(--color-text-muted); }

.hours-value {
  font-size: 26rpx;
  font-weight: 600;
  color: #ffffff;
}

.store-detail-page.light .hours-value { color: var(--color-text); }

.store-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}

.badge {
  padding: 6rpx 14rpx;
  border-radius: 16rpx;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.store-detail-page.light .badge {
  background: rgba(15, 23, 42, 0.05);
  border-color: rgba(15, 23, 42, 0.07);
}

.badge text {
  font-size: 18rpx;
  color: rgba(255, 255, 255, 0.7);
}

.store-detail-page.light .badge text { color: var(--color-text-muted); }

/* ========= 内容区 ========= */
.store-content {
  position: relative;
  padding: 0 24rpx;
  margin-top: -4rpx;
}

.glass {
  background: rgba(17, 24, 39, 0.68);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 14rpx 34rpx rgba(0, 0, 0, 0.1);
  border-radius: 22px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.store-detail-page.light .glass {
  background: rgba(255, 255, 255, 0.86);
  border-color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 12rpx 28rpx rgba(0, 0, 0, 0.08);
}

/* Price / Pickup Time */
.pt-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 30rpx;
  margin-bottom: 20rpx;
}

.pt-block { display: flex; flex-direction: column; gap: 6rpx; }
.pt-block.right { align-items: flex-end; }

.pt-label {
  font-size: 20rpx;
  color: var(--tc);
  font-weight: 600;
  letter-spacing: 0.5rpx;
}

.pt-value {
  font-size: 44rpx;
  font-weight: 800;
  color: #ffffff;
  line-height: 1.1;
}

.store-detail-page.light .pt-value { color: var(--color-text); }

.pt-value.price {
  color: var(--tc);
  font-family: "SF Mono", Consolas, monospace;
}

.store-detail-page.light .pt-value.price { color: var(--tc-deep); }

/* 地址双点位 */
.addr-section {
  padding: 26rpx 28rpx;
  margin-bottom: 20rpx;
}

.addr-item {
  display: flex;
  align-items: center;
  gap: 18rpx;
}

.addr-dot {
  width: 28rpx;
  height: 28rpx;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 0 8rpx rgba(0, 0, 0, 0.06);
}

.my-dot { background: #60a5fa; box-shadow: 0 0 0 8rpx rgba(0, 0, 0, 0.1); }
.store-dot { background: var(--tc); box-shadow: 0 0 0 8rpx var(--tc-bg); }

.addr-info { flex: 1; min-width: 0; }

.addr-label {
  display: block;
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 4rpx;
}

.store-detail-page.light .addr-label { color: var(--color-text-muted); }

.addr-value {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: #ffffff;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.store-detail-page.light .addr-value { color: var(--color-text); }

.addr-line {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin: 16rpx 0 16rpx 14rpx;
  position: relative;
}

.line-dash {
  flex: 1;
  height: 2rpx;
  background-image: repeating-linear-gradient(90deg, var(--tc) 0 10rpx, transparent 10rpx 20rpx);
  opacity: 0.6;
}

.line-mid {
  font-size: 20rpx;
  font-weight: 700;
  color: var(--tc);
  padding: 4rpx 14rpx;
  border-radius: 20rpx;
  background: var(--tc-bg);
}

/* 进度条 */
.quota-section {
  padding: 26rpx 28rpx;
  margin-bottom: 28rpx;
}

.quota-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.quota-label {
  font-size: 26rpx;
  font-weight: 600;
  color: #ffffff;
}

.store-detail-page.light .quota-label { color: var(--color-text); }

.quota-value {
  font-size: 30rpx;
  font-weight: 800;
  color: var(--tc);
}

.quota-bar {
  height: 18rpx;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 10rpx;
  position: relative;
  overflow: visible;
  margin-bottom: 12rpx;
}

.store-detail-page.light .quota-bar { background: rgba(15, 23, 42, 0.08); }

.quota-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--tc), var(--tc-deep));
  border-radius: 10rpx;
  transition: width 0.4s ease;
}

.quota-glow {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 30rpx;
  height: 30rpx;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 0 0 8rpx var(--tc-glow);
  transition: left 0.4s ease;
}

.quota-sub {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.5);
}

.store-detail-page.light .quota-sub { color: var(--color-text-muted); }

/* 套餐列表 */
.deal-section {
  margin-bottom: 24rpx;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #ffffff;
}

.store-detail-page.light .section-title { color: var(--color-text); }

.section-more {
  font-size: 22rpx;
  color: var(--tc);
}

.deal-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.deal-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 22rpx 24rpx;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.deal-item.active {
  border-color: var(--tc-glow);
  box-shadow: 0 0 0 1px var(--tc-glow), 0 14rpx 30rpx rgba(0, 0, 0, 0.1);
}

.deal-thumb {
  width: 108rpx;
  height: 108rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.deal-thumb-icon {
  font-size: 48rpx;
}

.deal-info {
  flex: 1;
  min-width: 0;
}

.deal-name {
  display: block;
  font-size: 27rpx;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 6rpx;
}

.store-detail-page.light .deal-name { color: var(--color-text); }

.deal-desc {
  display: block;
  font-size: 21rpx;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.store-detail-page.light .deal-desc { color: var(--color-text-muted); }

.deal-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12rpx;
  flex-shrink: 0;
}

.deal-price {
  font-size: 30rpx;
  font-weight: 800;
  color: var(--tc);
  font-family: "SF Mono", Consolas, monospace;
}

.deal-add {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  border: 2rpx solid var(--tc-glow);
  display: flex;
  align-items: center;
  justify-content: center;
}

.deal-add text {
  font-size: 30rpx;
  color: var(--tc);
  line-height: 30rpx;
}

.deal-add.checked {
  background: var(--tc);
  border-color: var(--tc);
}

.deal-add.checked text {
  color: #ffffff;
}

/* 门店简介 */
.intro-section {
  padding: 26rpx 28rpx;
  margin-bottom: 20rpx;
}

.intro-title {
  display: block;
  font-size: 26rpx;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 12rpx;
}

.store-detail-page.light .intro-title { color: var(--color-text); }

.intro-text {
  display: block;
  font-size: 23rpx;
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.7;
}

.store-detail-page.light .intro-text { color: var(--color-text-body); }

/* ========= 底部悬浮行动按钮 ========= */
.bottom-cta {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16rpx 24rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: rgba(11, 18, 32, 0.78);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  gap: 20rpx;
  z-index: 200;
  border-radius: 24px 24px 0 0;
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
}

.store-detail-page.light .bottom-cta {
  background: rgba(255, 255, 255, 0.86);
  border-top-color: rgba(15, 23, 42, 0.06);
}

.cta-left {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  flex-shrink: 0;
  padding-left: 8rpx;
}

.cta-price {
  font-size: 40rpx;
  font-weight: 800;
  color: var(--tc);
  font-family: "SF Mono", Consolas, monospace;
  line-height: 1;
}

.store-detail-page.light .cta-price { color: var(--tc-deep); }

.cta-people {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.55);
}

.store-detail-page.light .cta-people { color: var(--color-text-muted); }

.cta-btn {
  flex: 1;
  height: 100rpx;
  background: linear-gradient(135deg, var(--tc) 0%, var(--tc-deep) 100%);
  box-shadow: 0 12rpx 30rpx var(--tc-glow);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  min-height: 48px;
  border-radius: 16px;
}

.cta-btn.disabled {
  background: var(--color-text-muted);
  box-shadow: none;
}

.cta-text {
  font-size: 32rpx;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 2rpx;
}

.cta-arrow {
  font-size: 30rpx;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 700;
  letter-spacing: 2rpx;
}
</style>

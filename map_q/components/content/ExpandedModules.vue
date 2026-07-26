<template>
  <scroll-view class="expanded-modules" scroll-y :style="{ height: height + 'px' }" @scroll="onScroll">
    <view class="modules-header">
      <view class="header-kicker-row">
        <text class="header-kicker">附近地点</text>
        <view class="open-badge"><view class="status-dot"></view><text>营业中</text></view>
      </view>
      <view class="title-row">
        <text class="header-title">{{ headerTitle }}</text>
        <view class="header-nav" @tap="onNavigate({ type: 'point' })"><text>去这里</text><view class="arrow-icon"></view></view>
      </view>
      <text class="header-address">{{ addressText }}</text>
      <view class="stats-row">
        <text class="stat strong">4.8 分</text>
        <text class="dot">•</text>
        <text class="stat">10.8 万人来过</text>
        <text class="dot">•</text>
        <text class="stat">距你 1.2km</text>
      </view>
    </view>

    <swiper class="image-swiper" :indicator-dots="true" circular :autoplay="false">
      <swiper-item v-for="(img, i) in gallerySlides" :key="i">
        <image v-if="img" :src="img" class="slide-img" mode="aspectFill" @tap="onImageTap(img)" />
        <view v-else class="map-placeholder">
          <view class="route-line route-one"></view><view class="route-line route-two"></view><view class="route-line route-three"></view>
          <view class="place-marker"><view></view></view>
          <view class="placeholder-copy"><text class="placeholder-label">地点影像待补充</text><text class="placeholder-hint">先看看附近的人都在分享什么</text></view>
        </view>
      </swiper-item>
    </swiper>

    <view class="description">
      <text class="desc-text">{{ description }}</text>
    </view>

    <view class="subtabs">
      <view v-for="t in tabs" :key="t.id" :class="['subtab',{ active: t.id===activeTab }]" @tap="selectTab(t.id)">{{ t.name }}</view>
    </view>

    <view v-for="section in sections" :key="section.id" class="module">
      <view class="module-title">{{ section.name }}</view>
      <view class="module-list">
        <view v-for="item in section.items" :key="item.id" class="list-item" @tap="onItemTap(item)">
          <view class="item-cover"><view class="item-cover-line"></view><text>{{ section.name.slice(0, 1) }}</text></view>
          <view class="item-left">
            <view class="item-name">{{ item.title }}</view>
            <view class="item-desc">{{ item.desc }}</view>
          </view>
          <view class="item-actions">
            <view class="price" v-if="item.price">￥{{ item.price }}</view>
            <button class="btn-secondary" @tap.stop="onNavigate(item)">导航</button>
            <button class="btn-primary" @tap.stop="onReserve(item)">预约</button>
          </view>
        </view>
      </view>
    </view>
  </scroll-view>
  
</template>

<script>
export default {
  props: {
    height: { type: Number, default: 0 },
    selectedPoint: { type: Object, default: null }
  },
  emits: ['item-tap','reserve','navigate'],
  data() {
    return {
      images: [
        '/static/logo.png',
        '/static/logo.png',
        '/static/logo.png'
      ],
      description: '这里是地点简介，包含历史、特色与注意事项等信息，帮助你更好地了解。',
      tabs: [
        { id: 'overview', name: '概览' },
        { id: '热门', name: '热门' },
        { id: '项目', name: '项目' }
      ],
      activeTab: 'overview',
      sections: [
        { id: 'hot', name: '热门推荐', items: [
          { id: 'h1', title: '不见人精品展', desc: '当代艺术 | 今日 10:00-18:00', price: 29 },
          { id: 'h2', title: '城市影像展', desc: '摄影 | 周末 10:00-20:00', price: 56.7 },
          { id: 'h3', title: '夜间市集', desc: '文创 | 周五 18:00-23:00', price: 0 }
        ]},
        { id: 'ticket', name: '门票', items: [
          { id: 't1', title: '联票套餐A', desc: '3馆通票 | 有效期7天', price: 422 },
          { id: 't2', title: '常规门票', desc: '单馆门票 | 当日有效', price: 39 }
        ]},
        { id: 'food', name: '美食', items: [
          { id: 'f1', title: '人气咖啡店', desc: '拿铁/卡布/甜点', price: 28.4 },
          { id: 'f2', title: '地道小吃', desc: '串串/钵钵鸡/冷吃', price: 12 }
        ]},
        { id: 'shopping', name: '购物', items: [
          { id: 's1', title: '文创礼品店', desc: '文具/饰品/周边', price: 29 },
          { id: 's2', title: '潮流集合店', desc: '服饰/鞋履/配件', price: 391 }
        ]},
        { id: 'sight', name: '景点', items: [
          { id: 'si1', title: '中心广场', desc: '打卡地标 | 免费', price: 0 },
          { id: 'si2', title: '城市博物馆', desc: '常设展 | 周一闭馆', price: 29 }
        ]},
        { id: 'traffic', name: '交通', items: [
          { id: 'tr1', title: '地铁站A口', desc: '步行 300m | 2号线' },
          { id: 'tr2', title: '公交站B', desc: '步行 200m | 33/61路' }
        ]},
        { id: 'project', name: '项目', items: [
          { id: 'p1', title: '城市更新计划', desc: '公示期 | 2025Q1' },
          { id: 'p2', title: '临展招募', desc: '申请中 | 截止3/31' }
        ]}
      ],
      resolvedAddress: ''
    }
  },
  computed: {
    headerTitle() {
      const p = this.selectedPoint && this.selectedPoint.point
      const name = p && (p.name || p.title || p.poiName)
      if (name && String(name).trim()) return String(name).trim()
      const addr = p && (p.address || p.detailAddress || p.fullAddress)
      if (addr && String(addr).trim()) return String(addr).trim()
      if (this.resolvedAddress && String(this.resolvedAddress).trim()) return String(this.resolvedAddress).trim()
      return '正在解析地址…'
    },
    addressText() {
      const p = this.selectedPoint && this.selectedPoint.point
      const name = p && (p.name || p.title || p.poiName)
      const addr = p && (p.address || p.detailAddress || p.fullAddress)
      if (name && addr) return String(addr).trim()
      if (name && this.resolvedAddress) return String(this.resolvedAddress).trim()
      return ''
    },
    galleryImages() {
      const imgs = this.selectedPoint && this.selectedPoint.point && Array.isArray(this.selectedPoint.point.images) ? this.selectedPoint.point.images : []
      return imgs
    },
    gallerySlides() {
      return this.galleryImages.length ? this.galleryImages : [null]
    }
  },
  watch: {
    selectedPoint: {
      handler(val) {
        const p = val && val.point
        const addr = p && (p.address || p.detailAddress || p.fullAddress)
        if (addr && String(addr).trim()) { this.resolvedAddress = String(addr).trim(); return }
        const coords = p && p.location && Array.isArray(p.location.coordinates) ? p.location.coordinates : null
        if (coords && coords.length === 2) {
          const [lng, lat] = coords
          this.fetchReverseAddress(lat, lng)
        } else {
          const m = val && val.marker
          if (m && typeof m.latitude === 'number' && typeof m.longitude === 'number') {
            this.fetchReverseAddress(m.latitude, m.longitude)
          } else {
            this.resolvedAddress = ''
          }
        }
      },
      deep: true,
      immediate: true
    }
  },
  methods: {
    selectTab(id) { this.activeTab = id },
    onScroll() {},
    onImageTap(img) { this.$emit('item-tap', { type: 'image', src: img }) },
    onItemTap(item) { this.$emit('item-tap', item) },
    onReserve(item) { this.$emit('reserve', { item }) },
    onNavigate(item) { this.$emit('navigate', { item }) },
    fetchReverseAddress(lat, lng) {
      try {
        const app = (typeof getApp === 'function') ? getApp() : null
        const envKey = (app && app.globalData && app.globalData.QQ_MAP_KEY) || uni.getStorageSync('QQ_MAP_KEY') || (typeof process !== 'undefined' && process.env && process.env.QQ_MAP_KEY) || ''
        const qqKey = envKey || 'ISSBZ-BQA6T-J2SXF-VSDGE-A7NZ5-U4B3K'
        if (qqKey) {
          uni.request({
            url: `https://apis.map.qq.com/ws/geocoder/v1/?location=${lat},${lng}&key=${qqKey}&get_poi=0`,
            method: 'GET',
            success: (res) => {
              const c = res?.data?.result?.address_component
              const txt = this.formatQQAddress(c) || res?.data?.result?.address || ''
              this.resolvedAddress = txt || ''
            },
            fail: () => { this.requestNominatim(lat, lng) }
          })
          return
        }
        this.requestNominatim(lat, lng)
      } catch (e) { this.resolvedAddress = '' }
    },
    requestNominatim(lat, lng) {
      uni.request({
        url: `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        method: 'GET',
        header: { 'Accept-Language': 'zh-CN' },
        success: (res) => {
          const a = res?.data?.address
          const txt = this.formatNominatimAddress(a) || res?.data?.display_name || ''
          this.resolvedAddress = txt || ''
        },
        fail: () => { this.resolvedAddress = '' }
      })
    },
    formatQQAddress(c) {
      if (!c) return ''
      const province = c.province || ''
      const city = c.city || ''
      const district = c.district || ''
      const street = c.street || ''
      const streetNumber = c.street_number || ''
      const town = c.town || ''
      return `${province}${city}${district}${street}${streetNumber || ''}${town ? (' ' + town) : ''}`.trim()
    },
    formatNominatimAddress(a) {
      if (!a) return ''
      const province = a.province || a.state || ''
      const city = a.city || a.town || a.village || ''
      const district = a.county || a.state_district || ''
      const road = a.road || ''
      const residential = a.residential || a.suburb || a.neighbourhood || ''
      const house = a.house_number || ''
      return `${province}${city}${district}${road}${residential}${house}`.trim()
    }
  }
}
</script>

<style scoped>
.expanded-modules { width: 100%; box-sizing: border-box; background: #f8fafc; }
.modules-header { position: relative; padding: 12px 16px 10px; background: #fff; }
.header-kicker-row,.title-row,.stats-row,.header-nav,.open-badge { display: flex; align-items: center; }
.header-kicker-row { min-height: 40px; padding-right: 92px; }
.header-kicker-row,.title-row { justify-content: space-between; gap: 12px; }
.header-kicker { font-size: 12px; color: #64748b; font-weight: 600; }
.header-kicker-row .open-badge { display: none; }
.open-badge { gap: 5px; padding: 4px 8px; background: #f0fdf4; border-radius: 999px; color: #15803d; }
.open-badge text { font-size: 11px; font-weight: 600; }
.status-dot { width: 6px; height: 6px; background: #22c55e; border-radius: 50%; }
.title-row { position: absolute; top: 12px; right: 16px; justify-content: flex-end; margin-top: 0; }
.header-title { display: none; }
.header-nav { flex: 0 0 auto; min-height: 40px; padding: 0 12px; gap: 6px; color: #c2410c; background: #fff7ed; border-radius: 20px; }
.header-nav text { font-size: 13px; font-weight: 650; }
.arrow-icon { width: 7px; height: 7px; border-top: 1.5px solid #c2410c; border-right: 1.5px solid #c2410c; transform: rotate(45deg); }
.header-address { font-size: 13px; color: #64748b; margin-top: 2px; display: block; line-height: 1.5; }
.stats-row { margin-top: 8px; color: #64748b; font-size: 12px; }
.stat { font-size: 12px; }.stat.strong { color: #ea580c; font-weight: 700; }.dot { margin: 0 7px; color: #cbd5e1; }
.image-swiper { width: 100%; height: 190px; padding: 10px 16px 0; box-sizing: border-box; background: #fff; }
.slide-img,.map-placeholder { width: 100%; height: 100%; border-radius: 16px; overflow: hidden; }
.slide-img { background: #e2e8f0; }
.map-placeholder { position: relative; background: linear-gradient(145deg,#e0f2fe 0%,#f0fdf4 52%,#fff7ed 100%); }
.route-line { position: absolute; height: 4px; border-radius: 4px; background: rgba(255,255,255,.9); transform-origin: left center; }
.route-one { width: 120%; left: -10%; top: 34%; transform: rotate(14deg); }.route-two { width: 92%; left: 14%; top: 56%; transform: rotate(-19deg); }.route-three { width: 70%; left: 42%; top: 10%; transform: rotate(68deg); }
.place-marker { position: absolute; left: 54%; top: 38%; width: 34px; height: 34px; background: #ea580c; border: 4px solid #fff; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 8px 18px rgba(234,88,12,.25); }
.place-marker view { width: 10px; height: 10px; margin: 8px; border-radius: 50%; background: #fff; }
.placeholder-copy { position: absolute; left: 14px; bottom: 12px; display: flex; flex-direction: column; padding: 8px 10px; border-radius: 10px; background: rgba(255,255,255,.88); }
.placeholder-label { font-size: 13px; color: #0f172a; font-weight: 700; }.placeholder-hint { margin-top: 2px; font-size: 11px; color: #64748b; }
.description { padding: 12px 16px; background: #fff; }
.desc-text { font-size: 14px; color: #475569; line-height: 1.65; }
.subtabs { display: flex; padding: 4px 16px 14px; background: #fff; }
.subtab { min-height: 36px; padding: 0 16px; margin-right: 8px; border-radius: 18px; background: #f1f5f9; color: #64748b; font-size: 13px; display: flex; align-items: center; justify-content: center; }
.subtab.active { background: #eff6ff; color: #1d4ed8; font-weight: 650; box-shadow: inset 0 0 0 1px #bfdbfe; }
.module { padding: 16px 16px 0; }.module:last-child { padding-bottom: 24px; }
.module-title { padding-bottom: 10px; color: #0f172a; font-size: 16px; font-weight: 700; }
.module-list { display: flex; flex-direction: column; gap: 10px; }
.list-item { display: flex; align-items: center; gap: 10px; min-height: 76px; background: #fff; border: 1px solid #eef2f7; border-radius: 14px; padding: 10px; box-shadow: 0 4px 14px rgba(15,23,42,.04); }
.item-cover { position: relative; flex: 0 0 52px; width: 52px; height: 52px; border-radius: 12px; overflow: hidden; display: flex; align-items: center; justify-content: center; background: linear-gradient(145deg,#ffedd5,#fed7aa); color: #c2410c; }
.item-cover-line { position: absolute; width: 70px; height: 8px; background: rgba(255,255,255,.65); transform: rotate(-28deg); }.item-cover text { position: relative; z-index: 1; font-size: 16px; font-weight: 800; }
.item-left { min-width: 0; flex: 1; display: flex; flex-direction: column; }.item-name { font-size: 14px; color: #0f172a; font-weight: 650; }.item-desc { font-size: 12px; color: #64748b; margin-top: 4px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.item-actions { flex: 0 0 auto; display: flex; gap: 6px; align-items: center; }.price { color: #ea580c; font-size: 14px; font-weight: 750; }
.btn-secondary,.btn-primary { min-width: 48px; min-height: 38px; margin: 0; padding: 0 10px; border-radius: 10px; font-size: 12px; line-height: 38px; }
.btn-secondary { background: #fff; color: #c2410c; border: 1px solid #fed7aa; }.btn-primary { background: #ea580c; color: #fff; border: none; }
.btn-secondary::after,.btn-primary::after { border: none; }.btn-secondary:active,.btn-primary:active { opacity: .78; }
</style>

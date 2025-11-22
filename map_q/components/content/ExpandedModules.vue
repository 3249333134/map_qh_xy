<template>
  <scroll-view class="expanded-modules" scroll-y :style="{ height: height + 'px' }" @scroll="onScroll">
    <view class="modules-header">
      <text class="header-title">{{ headerTitle }}</text>
      <view class="stats-row">
        <text class="stat">评分 4.8</text>
        <text class="dot">•</text>
        <text class="stat">人气 10.8万</text>
        <text class="dot">•</text>
        <text class="stat">营业中</text>
      </view>
    </view>

    <swiper class="image-swiper" :indicator-dots="true" circular :autoplay="false">
      <swiper-item v-for="(img, i) in galleryImages" :key="i">
        <image :src="img" class="slide-img" mode="aspectFill" @tap="onImageTap(img)" />
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
      const addr = p && (p.address || p.detailAddress || p.fullAddress)
      if (addr && String(addr).trim()) return String(addr).trim()
      if (this.resolvedAddress && String(this.resolvedAddress).trim()) return String(this.resolvedAddress).trim()
      return '正在解析地址…'
    },
    galleryImages() {
      const imgs = this.selectedPoint && this.selectedPoint.point && Array.isArray(this.selectedPoint.point.images) ? this.selectedPoint.point.images : []
      return imgs.length ? imgs : this.images
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
.expanded-modules { width: 100%; box-sizing: border-box; background: #f8f8f8; }
.modules-header { padding: 10px 15px; }
.header-title { font-size: 16px; font-weight: 600; color: #333; }
.stats-row { margin-top: 6px; display: flex; align-items: center; color: #888; font-size: 12px; }
.dot { margin: 0 6px; }
.image-swiper { width: 100%; height: 180px; padding: 10px 10px 0; box-sizing: border-box; }
.slide-img { width: 100%; height: 100%; border-radius: 12px; background: #ddd; }
.description { padding: 8px 15px; }
.desc-text { font-size: 13px; color: #555; line-height: 1.6; }
.subtabs { display: flex; padding: 0 15px 10px; }
.subtab { padding: 6px 12px; margin-right: 8px; border-radius: 14px; background: #f0f0f0; color: #666; font-size: 13px; }
.subtab.active { background: #2196F3; color: #fff; }
.module { padding: 0 10px 10px; }
.module-title { padding: 0 5px 8px; color: #444; font-size: 14px; font-weight: 600; }
.module-list { display: flex; flex-direction: column; gap: 10px; }
.list-item { display: flex; align-items: center; justify-content: space-between; background: #fff; border-radius: 10px; padding: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.item-left { display: flex; flex-direction: column; }
.item-name { font-size: 14px; color: #333; font-weight: 600; }
.item-desc { font-size: 12px; color: #888; margin-top: 4px; }
.item-actions { display: flex; gap: 8px; align-items: center; }
.price { color: #ff6b35; font-weight: 600; }
.btn-secondary { background: #ffffff; color: #ff6b35; border: 1px solid #ffd1c0; border-radius: 8px; padding: 6px 10px; font-size: 12px; }
.btn-primary { background: linear-gradient(90deg,#ff8a3d,#ff6b35,#ff4757); color: #fff; border: none; border-radius: 8px; padding: 6px 10px; font-size: 12px; }
</style>

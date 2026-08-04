<template>
  <scroll-view class="expanded-modules" scroll-y :style="{ height: height + 'px' }" @scroll="onScroll">
    <view class="modules-header">
      <view class="header-kicker-row">
        <text class="header-kicker">{{ typeLabel }}详情</text>
        <view class="open-badge"><view class="status-dot"></view><text>{{ statusLabel }}</text></view>
      </view>
      <view class="detail-summary-row">
        <view class="detail-copy">
          <text class="header-address">{{ addressText }}</text>
          <view class="stats-row">
            <text class="stat strong">{{ ratingText }}</text>
            <text class="dot">•</text>
            <text class="stat">{{ popularityText }}</text>
            <text class="dot">•</text>
            <text class="stat">{{ distanceText }}</text>
          </view>
        </view>
        <view class="header-nav" @tap="onNavigate({ type: 'point' })"><text>去这里</text><view class="arrow-icon"></view></view>
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
      <text class="desc-text">{{ placeDescription }}</text>
    </view>

    <view v-if="detailType === 'service'" class="typed-detail service-detail">
      <view class="identity-row">
        <view class="identity-mark">服</view>
        <view class="identity-copy">
          <text class="identity-title">{{ providerName }}</text>
          <text class="identity-sub">{{ verificationLabel }} · {{ serviceAreaText }}</text>
        </view>
        <text class="price-text">¥{{ servicePrice }}<text>/次</text></text>
      </view>
      <text class="typed-title">可预约时间</text>
      <view class="slot-list">
        <view v-for="slot in serviceSlots" :key="slot.id" class="slot-chip" :class="{ disabled: !slot.available, active: selectedSlotId === slot.id }" @tap="selectServiceSlot(slot)">
          <text>{{ slot.date.slice(5) }}</text><text>{{ slot.time }}</text>
        </view>
      </view>
      <view class="policy-card">
        <text>取消：{{ servicePolicies.cancellation }}</text>
        <text>改期：{{ servicePolicies.reschedule }}</text>
        <text>退款：{{ servicePolicies.refund }}</text>
      </view>
      <view class="secondary-actions">
        <view @tap="consultService">咨询</view>
        <view :class="{ active: serviceCollected }" @tap="toggleServiceAction('collected')">{{ serviceCollected ? '已收藏' : '收藏' }}</view>
        <view :class="{ active: providerFollowed }" @tap="toggleServiceAction('followed')">{{ providerFollowed ? '已关注' : '关注' }}</view>
      </view>
      <view class="primary-action" :class="{ disabled: !selectedSlotId }" @tap="reserveSelectedService">预约这项服务</view>
    </view>

    <view v-else-if="detailType === 'track'" class="typed-detail track-detail">
      <view class="track-stats">
        <view><text>{{ trackDistance }}</text><text>公里</text></view>
        <view><text>{{ trackDuration }}</text><text>分钟</text></view>
        <view><text>{{ trackDifficulty }}</text><text>难度</text></view>
      </view>
      <text class="typed-title">路线节点</text>
      <view class="node-list">
        <view v-for="(node,index) in trackNodes" :key="node.id || index" class="node-row" @tap="focusNode(node)">
          <view class="node-index">{{ index + 1 }}</view>
          <view class="node-copy"><text>{{ node.name || node.label }}</text><text>{{ node.note || '路线关键节点' }}</text></view>
          <view class="chevron"></view>
        </view>
      </view>
      <view class="primary-action" @tap="copyTrack">复制为我的路线</view>
    </view>

    <view v-else>
      <view class="place-tools">
        <view @tap="submitCorrection">地点纠错</view>
        <view @tap="contactPlace">联系地点</view>
      </view>
      <view class="subtabs">
        <view v-for="t in tabs" :key="t.id" :class="['subtab',{ active: t.id===activeTab }]" @tap="selectTab(t.id)">{{ t.name }}</view>
      </view>
    </view>

    <view v-for="section in detailType === 'place' ? sections : []" :key="section.id" class="module">
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
import { contentInteractionApi } from '../../utils/api/contentInteraction.js'

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
      defaultDescription: '这里汇集地点介绍、附近内容、活动与服务，帮助你在出发前快速了解。',
      tabs: [
        { id: 'overview', name: '概览' },
        { id: '热门', name: '热门' },
        { id: '项目', name: '项目' }
      ],
      activeTab: 'overview',
      selectedSlotId: '',
      serviceCollected: false,
      providerFollowed: false,
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
    pointData() {
      return (this.selectedPoint && this.selectedPoint.point) || {}
    },
    detailType() {
      const kind = this.pointData.type
      return kind === 'service' || kind === 'track' ? kind : 'place'
    },
    typeLabel() {
      const labels = { place: '地点', service: '服务', event: '活动', replica: '地图副本' }
      return labels[this.pointData.type] || '地点'
    },
    statusLabel() {
      if (this.pointData.status === 'closed') return '已休息'
      if (this.pointData.status === 'upcoming') return '即将开始'
      return this.pointData.openingStatus || '可探索'
    },
    ratingText() {
      const value = Number(this.pointData.rating || 4.8)
      return `${value.toFixed(1)} 分`
    },
    popularityText() {
      const likes = Number(this.pointData.likes || this.pointData.visits || 0)
      if (likes >= 10000) return `${(likes / 10000).toFixed(1)} 万人关注`
      return likes > 0 ? `${likes} 人关注` : '附近热门'
    },
    distanceText() {
      return this.pointData.distanceText || this.pointData.distance || '地图范围内'
    },
    placeDescription() {
      return this.pointData.description || this.pointData.summary || this.defaultDescription
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
    },
    providerName() {
      return this.pointData.provider?.name || this.pointData.author || '认证服务者'
    },
    verificationLabel() {
      return this.pointData.verification?.label || (this.pointData.verified === false ? '身份待认证' : '主体已认证')
    },
    serviceAreaText() {
      return this.pointData.serviceArea?.description || '到店或附近上门'
    },
    servicePrice() {
      return Number(this.pointData.pricing?.amount || this.pointData.price || 88)
    },
    serviceSlots() {
      const slots = this.pointData.availableSlots || this.pointData.service?.availableSlots
      if (Array.isArray(slots) && slots.length) return slots
      const date = new Date().toISOString().slice(0, 10)
      return ['09:30','14:00','16:30','19:30'].map((time,index) => ({ id: `inline_${index}`, date, time, available: index !== 2 }))
    },
    servicePolicies() {
      return this.pointData.policies || this.pointData.service?.policies || { cancellation: '开始前24小时免费取消', reschedule: '开始前12小时可改期', refund: '符合规则时原路退回' }
    },
    trackDistance() {
      return Number(this.pointData.distance || this.pointData.track?.distanceKm || 8.6)
    },
    trackDuration() {
      return Number.parseInt(this.pointData.duration || this.pointData.track?.durationMinutes, 10) || 52
    },
    trackDifficulty() {
      return this.pointData.difficulty || this.pointData.track?.difficulty || '轻松'
    },
    trackNodes() {
      const nodes = this.pointData.track?.nodes || this.pointData.highEnergyPoints || []
      return Array.isArray(nodes) ? nodes : []
    }
  },
  watch: {
    selectedPoint: {
      handler(val) {
        const p = val && val.point
        if (p) {
          const actionState = contentInteractionApi.getState(p._id || p.id || 'inline_detail')
          this.serviceCollected = actionState.collected
          this.providerFollowed = actionState.followed
        }
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
    onReserve(item) { this.$emit('reserve', { item, cardData: this.pointData }) },
    onNavigate(item) { this.$emit('navigate', { item }) },
    selectServiceSlot(slot) {
      if (!slot.available) return uni.showToast({ title: '该时段已约满', icon: 'none' })
      this.selectedSlotId = slot.id
    },
    reserveSelectedService() {
      if (!this.selectedSlotId) return uni.showToast({ title: '请先选择可预约时间', icon: 'none' })
      const slot = this.serviceSlots.find(item => item.id === this.selectedSlotId)
      this.$emit('reserve', { cardData: this.pointData, slot })
    },
    consultService() {
      const name = this.providerName || '服务助手'
      uni.navigateTo({ url: `/pages/chat/index?name=${encodeURIComponent(name)}&serviceId=${encodeURIComponent(this.pointData._id || this.pointData.id || '')}` })
    },
    toggleServiceAction(field) {
      const id = this.pointData._id || this.pointData.id || 'inline_service'
      const state = contentInteractionApi.toggle(id, field)
      this.serviceCollected = state.collected
      this.providerFollowed = state.followed
      uni.showToast({ title: field === 'collected' ? (state.collected ? '已收藏' : '已取消收藏') : (state.followed ? '已关注' : '已取消关注'), icon: 'none' })
    },
    submitCorrection() {
      uni.showModal({
        title: '地点纠错',
        content: '请说明名称、地址或营业信息中需要修正的内容。',
        editable: true,
        placeholderText: '填写纠错说明',
        success: result => {
          const content = String(result.content || '').trim()
          if (!result.confirm || !content) return
          try {
            const list = uni.getStorageSync('PLACE_CORRECTIONS_V1') || []
            uni.setStorageSync('PLACE_CORRECTIONS_V1', [{ id: `correction_${Date.now()}`, pointId: this.pointData._id || this.pointData.id, content, status: 'pending', createdAt: Date.now() }, ...list])
            uni.showToast({ title: '纠错已提交', icon: 'none' })
          } catch (error) {
            uni.showToast({ title: '提交失败，请重试', icon: 'none' })
          }
        }
      })
    },
    contactPlace() {
      const phone = this.pointData.phone || this.pointData.place?.phone
      if (!phone) return uni.showToast({ title: '该地点暂未提供联系电话', icon: 'none' })
      uni.makePhoneCall({ phoneNumber: String(phone), fail: () => uni.showToast({ title: '无法调起电话，请检查设备权限', icon: 'none' }) })
    },
    focusNode(node) {
      this.$emit('navigate', { type: 'node', node, cardData: this.pointData })
    },
    copyTrack() {
      try {
        const copies = uni.getStorageSync('COPIED_TRACKS_V1') || []
        if (!copies.some(item => item._id === this.pointData._id)) uni.setStorageSync('COPIED_TRACKS_V1', [{ ...this.pointData, copiedAt: Date.now() }, ...copies])
        uni.showToast({ title: '已复制到我的路线', icon: 'none' })
      } catch (error) {
        uni.showToast({ title: '复制失败，请重试', icon: 'none' })
      }
    },
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
.expanded-modules { width: 100%; box-sizing: border-box; background: var(--color-page); }
.modules-header { position: relative; padding: 14px 16px 12px; background: #fff; }
.header-kicker-row,.detail-summary-row,.stats-row,.header-nav,.open-badge { display: flex; align-items: center; }
.header-kicker-row { min-height: 28px; padding-right: 0; }
.header-kicker-row { justify-content: space-between; gap: 12px; }
.header-kicker { font-size: 12px; color: #64748b; font-weight: 600; }
.header-kicker-row .open-badge { display: flex; }
.open-badge { gap: 5px; padding: 4px 8px; background: #f0fdf4; border-radius: 999px; color: #15803d; }
.open-badge text { font-size: 11px; font-weight: 600; }
.status-dot { width: 6px; height: 6px; background: #22c55e; border-radius: 50%; }
.detail-summary-row { justify-content: space-between; gap: 12px; margin-top: 8px; }
.detail-copy { flex: 1; min-width: 0; }
.header-nav { flex: 0 0 auto; min-width: 76px; min-height: 44px; padding: 0 14px; justify-content: center; gap: 6px; color: #fff; background: #ea580c; border-radius: 15px; box-shadow: 0 6px 16px rgba(234,88,12,.2); }
.header-nav text { color: #fff; font-size: 13px; font-weight: 700; }
.arrow-icon { width: 7px; height: 7px; border-top: 1.5px solid #fff; border-right: 1.5px solid #fff; transform: rotate(45deg); }
.header-address { font-size: 13px; color: #64748b; display: block; line-height: 1.5; }
.stats-row { margin-top: 8px; color: #64748b; font-size: 12px; }
.stat { font-size: 12px; }.stat.strong { color: #ea580c; font-weight: 700; }.dot { margin: 0 7px; color: #cbd5e1; }
.image-swiper { width: 100%; height: 176px; padding: 8px 16px 0; box-sizing: border-box; background: #fff; }
.slide-img,.map-placeholder { width: 100%; height: 100%; border-radius: 16px; overflow: hidden; }
.slide-img { background: #e2e8f0; }
.map-placeholder { position: relative; background: linear-gradient(145deg,#e0f2fe,#f0fdf4 52%,#fff7ed); }
.route-line { position: absolute; height: 4px; border-radius: 4px; background: rgba(255,255,255,.9); transform-origin: left center; }
.route-one { width: 120%; left: -10%; top: 34%; transform: rotate(14deg); }.route-two { width: 92%; left: 14%; top: 56%; transform: rotate(-19deg); }.route-three { width: 70%; left: 42%; top: 10%; transform: rotate(68deg); }
.place-marker { position: absolute; left: 54%; top: 38%; width: 34px; height: 34px; background: #ea580c; border: 4px solid #fff; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 8px 18px rgba(234,88,12,.25); }
.place-marker view { width: 10px; height: 10px; margin: 8px; border-radius: 50%; background: #fff; }
.placeholder-copy { position: absolute; left: 14px; bottom: 12px; display: flex; flex-direction: column; padding: 8px 10px; border-radius: 10px; background: rgba(255,255,255,.88); }
.placeholder-label { font-size: 13px; color: #0f172a; font-weight: 700; }.placeholder-hint { margin-top: 2px; font-size: 11px; color: #64748b; }
.description { padding: 12px 16px; background: #fff; }
.desc-text { font-size: 14px; color: #475569; line-height: 1.65; }
.typed-detail { padding: 2px 16px 26px; background: #fff; }.identity-row { display: flex; align-items: center; gap: 10px; padding: 14px 0; border-top: 1px solid #f1f5f9; }.identity-mark { flex: 0 0 44px; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 14px; color: #fff; background: #0f9f92; font-size: 16px; font-weight: 800; }.identity-copy { flex: 1; min-width: 0; }.identity-title,.identity-sub,.price-text,.policy-card text,.slot-chip text,.node-copy text,.track-stats text { display: block; }.identity-title { color: #0f172a; font-size: 15px; font-weight: 750; }.identity-sub { margin-top: 4px; color: #64748b; font-size: 11px; }.price-text { color: #ea580c; font-size: 20px; font-weight: 800; }.price-text text { display: inline; font-size: 11px; font-weight: 600; }
.typed-title { display: block; margin: 14px 0 10px; color: #0f172a; font-size: 15px; font-weight: 750; }.slot-list { display: flex; gap: 8px; overflow-x: auto; }.slot-chip { flex: 0 0 64px; min-height: 52px; border: 1px solid #e2e8f0; border-radius: 13px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #475569; background: #fff; }.slot-chip text { font-size: 11px; line-height: 18px; }.slot-chip.active { border-color: #ea580c; color: #c2410c; background: #fff7ed; }.slot-chip.disabled { opacity: .38; }
.policy-card { margin-top: 14px; padding: 12px; border-radius: 14px; background: var(--color-page); }.policy-card text { color: #64748b; font-size: 11px; line-height: 20px; }.primary-action { min-height: 48px; margin-top: 16px; border-radius: 15px; display: flex; align-items: center; justify-content: center; color: #fff; background: #ea580c; font-size: 14px; font-weight: 750; box-shadow: 0 7px 18px rgba(234,88,12,.2); }.primary-action.disabled { opacity: .42; box-shadow: none; }
.track-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; padding: 14px 0; border-top: 1px solid #f1f5f9; }.track-stats view { min-height: 66px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 14px; background: var(--color-page); }.track-stats text:first-child { color: #0f172a; font-size: 18px; font-weight: 800; }.track-stats text:last-child { margin-top: 3px; color: #64748b; font-size: 10px; }.node-row { min-height: 58px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid #f1f5f9; }.node-index { flex: 0 0 30px; width: 30px; height: 30px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #1d4ed8; background: #eff6ff; font-size: 12px; font-weight: 750; }.node-copy { flex: 1; }.node-copy text:first-child { color: #0f172a; font-size: 13px; font-weight: 700; }.node-copy text:last-child { margin-top: 3px; color: #64748b; font-size: 11px; }.chevron { width: 7px; height: 7px; margin-right: 6px; border-top: 2px solid #94a3b8; border-right: 2px solid #94a3b8; transform: rotate(45deg); }
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

<template>
  <view class="detail-wrap">
    <view class="detail-header">
      <text class="detail-title">{{ (point && point.name) || '位置' }}</text>
      <view class="detail-actions">
        <button class="detail-btn" @tap="handleClose">关闭</button>
        <button class="detail-btn primary" @tap="handleNavigate">导航</button>
      </view>
    </view>

    <view class="detail-body">
      <text class="detail-address">{{ (point && point.address) || '' }}</text>
      
      <view class="services-section">
        <view class="section-header">
          <text class="section-title">📍 周边服务</text>
        </view>
        
        <view v-if="safeServices.length > 0" class="services-list">
          <view 
            v-for="(service, idx) in safeServices" 
            :key="idx" 
            class="service-item"
            @tap="handleServiceTap(service)"
          >
            <view class="service-icon">
              <text>{{ getServiceIcon(service.category) }}</text>
            </view>
            <view class="service-info">
              <text class="service-name">{{ service.name || '服务' }}</text>
              <text class="service-meta">{{ (service.author || '未知') }} | {{ (service.category || '全部服务') }}</text>
            </view>
            <view class="service-right">
              <text class="service-price" v-if="service.price">{{ service.price }}</text>
              <text class="service-arrow">›</text>
            </view>
          </view>
        </view>
        
        <view v-else class="no-services">
          <text class="empty-text">暂无相关服务</text>
        </view>
      </view>
      
      <view class="detail-footer">
        <text class="detail-desc">{{ (point && point.description) || '这里是地点简介' }}</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'ServicePointDetail',
  props: {
    point: { type: Object, default: null },
    marker: { type: Object, default: null },
    services: { type: Array, default: () => [] }
  },
  data() {
    return {
      fallback: '/static/logo.png'
    }
  },
  computed: {
    safeServices() {
      if (!this.services || !Array.isArray(this.services)) {
        return []
      }
      return this.services
    }
  },
  methods: {
    getServiceIcon(category) {
      const icons = {
        '维修服务': '🔧',
        '清洁服务': '🧹',
        '配送服务': '🚚',
        '家政服务': '🏠',
        '全部服务': '✨',
        'default': '💼'
      }
      return icons[category] || icons['default']
    },
    handleServiceTap(service) {
      console.log('点击服务:', service)
      if (!service) return
      uni.setStorageSync('SERVICE_LAST_ITEM', service)
      uni.navigateTo({
        url: `/pages/service/detail/index?id=${service._id || service.id || ''}&source=service`
      })
    },
    handleClose() {
      this.$emit('close')
    },
    handleNavigate() {
      this.$emit('navigate')
    }
  }
}
</script>

<style scoped>
.detail-wrap { background:#fff; border-radius:12px; box-shadow:0 6px 20px rgba(0,0,0,0.12); padding:12px; }
.detail-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
.detail-title { font-size:16px; font-weight:600; color:#333; }
.detail-actions { display:flex; gap:8px; }
.detail-btn { padding:6px 12px; border-radius:6px; border:1px solid #ddd; background:#f7f7f7; font-size:13px; }
.detail-btn.primary { background:#ff7a45; color:#fff; border-color:#ff7a45; }

.detail-body { color:#666; font-size:13px; }
.detail-address { display:block; margin-bottom:12px; color:#999; font-size:12px; padding-left:20px; background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23999'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/%3E%3C/svg%3E") no-repeat left center; background-size:16px; }

.services-section { margin-bottom:12px; }
.section-header { margin-bottom:8px; }
.section-title { font-size:14px; font-weight:600; color:#333; }

.services-list { display:flex; flex-direction:column; gap:8px; }
.service-item { display:flex; align-items:center; padding:10px; background:#f8f8f8; border-radius:8px; }
.service-item:active { background:#f0f0f0; }
.service-icon { width:40px; height:40px; display:flex; align-items:center; justify-content:center; font-size:20px; }
.service-info { flex:1; margin-left:10px; }
.service-name { display:block; font-size:14px; font-weight:500; color:#333; }
.service-meta { display:block; font-size:12px; color:#999; margin-top:2px; }
.service-right { display:flex; flex-direction:column; align-items:flex-end; }
.service-price { font-size:14px; font-weight:600; color:#ff7a45; }
.service-arrow { font-size:18px; color:#ccc; margin-top:4px; }

.no-services { text-align:center; padding:20px; background:#f8f8f8; border-radius:8px; }
.empty-text { color:#999; font-size:13px; }

.detail-footer { padding-top:12px; border-top:1px solid #eee; }
.detail-desc { color:#666; font-size:13px; line-height:1.5; }
</style>

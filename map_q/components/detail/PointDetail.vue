<template>
  <view class="detail-wrap">
    <view class="detail-header">
      <text class="detail-title">{{ point?.name || '位置' }}</text>
      <view class="detail-actions">
        <button class="detail-btn" @tap="$emit('close')">关闭</button>
        <button class="detail-btn primary" @tap="$emit('navigate')">导航</button>
      </view>
    </view>

    <swiper class="detail-swiper" indicator-dots circular :autoplay="false">
      <swiper-item v-for="(img,idx) in images" :key="idx">
        <image 
          :src="img" 
          class="slider-img" 
          mode="aspectFill" 
          @error="onImgError(idx)"
        />
      </swiper-item>
    </swiper>

    <view class="detail-body">
      <text class="detail-line">{{ point?.address || '' }}</text>
      <text class="detail-line">{{ point?.description || '' }}</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'PointDetail',
  props: {
    point: { type: Object, default: null },
    marker: { type: Object, default: null }
  },
  data() {
    return {
      fallback: '/static/logo.png',
      localImages: []
    }
  },
  computed: {
    images() { return this.localImages.length ? this.localImages : [this.fallback, this.fallback] }
  },
  watch: {
    point: {
      handler(val) {
        const arr = (val && Array.isArray(val.images)) ? val.images.slice(0) : []
        this.localImages = (arr && arr.length) ? arr : []
      },
      deep: true,
      immediate: true
    }
  },
  methods: {
    onImgError(idx) {
      if (Array.isArray(this.localImages)) {
        this.$set ? this.$set(this.localImages, idx, this.fallback) : (this.localImages[idx] = this.fallback)
      }
    }
  }
}
</script>

<style scoped>
.detail-wrap { background:#fff; border-radius:12px; box-shadow:0 6px 20px rgba(0,0,0,0.12); padding:12px; }
.detail-header { display:flex; justify-content:space-between; align-items:center; }
.detail-title { font-size:16px; font-weight:600; color:#333; }
.detail-actions { display:flex; gap:8px; }
.detail-btn { padding:6px 12px; border-radius:6px; border:1px solid #ddd; background:#f7f7f7; }
.detail-btn.primary { background:#ff7a45; color:#fff; border-color:#ff7a45; }
.detail-swiper { width:100%; height:160px; margin:10px 0; }
.slider-img { width:100%; height:100%; border-radius:10px; background:#eee; }
.detail-body { margin-top:8px; color:#666; font-size:13px; }
.detail-line { display:block; margin-bottom:4px; }
</style>

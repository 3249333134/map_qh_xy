<template>
  <scroll-view class="tool-panel" scroll-y :style="{ height: height + 'px' }">
    <view class="panel-head">
      <view>
        <text class="eyebrow">地图工具</text>
        <text class="panel-title">{{ isLayers ? '锚点与图层' : '地图分享' }}</text>
      </view>
      <view class="close-button" role="button" aria-label="关闭地图工具" @tap="$emit('close')">
        <view class="close-glyph"></view>
      </view>
    </view>

    <template v-if="isLayers">
      <view class="summary-card layer-summary">
        <view class="summary-icon layers-icon"><view></view><view></view><view></view></view>
        <view class="summary-copy">
          <text class="summary-title">智能图层</text>
          <text class="summary-desc">已显示 {{ enabledCount }} 个图层，切换后立即更新上方地图</text>
        </view>
        <view class="all-toggle" role="button" aria-label="切换全部地图图层" @tap="toggleAll">
          {{ allEnabled ? '全关' : '全开' }}
        </view>
      </view>

      <view class="section-label">图层内容</view>
      <view class="option-card">
        <view
          v-for="(item, index) in layerOptions"
          :key="item.key"
          class="option-row"
          :class="{ last: index === layerOptions.length - 1 }"
          role="switch"
          :aria-checked="isLayerEnabled(item.key)"
          @tap="toggleLayer(item.key)"
        >
          <view class="option-icon" :style="{ background: item.color }">{{ item.short }}</view>
          <view class="option-main">
            <text class="option-name">{{ item.name }}</text>
            <text class="option-desc">{{ item.desc }}</text>
          </view>
          <view class="switch-control" :class="{ on: isLayerEnabled(item.key) }">
            <view class="switch-thumb"></view>
          </view>
        </view>
      </view>
    </template>

    <template v-else>
      <view class="summary-card share-summary">
        <view class="share-mark">
          <view class="share-node top"></view>
          <view class="share-node left"></view>
          <view class="share-node right"></view>
          <view class="share-line first"></view>
          <view class="share-line second"></view>
        </view>
        <view class="summary-copy">
          <text class="summary-title">{{ snapshot.center.cityName }}地图探索</text>
          <text class="summary-desc">{{ timeLabel }} · {{ spaceLabel }} · {{ snapshot.layers.length }} 个图层</text>
        </view>
      </view>

      <view class="context-chips">
        <view class="context-chip orange">当前视野</view>
        <view class="context-chip blue">地图锚点</view>
        <view class="context-chip purple">筛选条件</view>
      </view>

      <view class="section-label">分享方式</view>
      <view class="option-card">
        <button class="option-row share-button" open-type="share" @tap="onFriendShare">
          <view class="option-icon friend">友</view>
          <view class="option-main">
            <text class="option-name">分享给好友</text>
            <text class="option-desc">微信好友或群聊</text>
          </view>
          <view class="row-arrow"></view>
        </button>
        <view class="option-row" role="button" aria-label="生成地图海报" @tap="generatePoster">
          <view class="option-icon poster">图</view>
          <view class="option-main">
            <text class="option-name">生成海报</text>
            <text class="option-desc">保存地图快照到本地相册</text>
          </view>
          <view class="row-arrow"></view>
        </view>
        <view class="option-row last" role="button" aria-label="复制地图链接" @tap="copyLink">
          <view class="option-icon link">链</view>
          <view class="option-main">
            <text class="option-name">复制地图链接</text>
            <text class="option-desc">接收方打开后恢复相同地图视野</text>
          </view>
          <view class="row-arrow"></view>
        </view>
      </view>
      <canvas canvas-id="inlineSharePoster" class="poster-canvas"></canvas>
    </template>

    <view class="bottom-space"></view>
  </scroll-view>
</template>

<script>
import { encodeShareSnapshot } from '../../utils/mapExploreState.js'

export default {
  props: {
    mode: { type: String, default: '' },
    height: { type: Number, default: 0 },
    layers: { type: Array, default: () => [] },
    snapshot: {
      type: Object,
      default: () => ({
        center: { cityName: '成都' },
        timeRange: { preset: 'all' },
        spatialFilter: { mode: 'bounds', radiusKm: 5 },
        layers: []
      })
    }
  },
  emits: ['close', 'layers-change'],
  data() {
    return {
      layerOptions: [
        { key: 'content', short: '文', name: '内容', desc: '图片、视频与文章锚点', color: '#248cf5' },
        { key: 'place', short: '地', name: '地点', desc: '地点百科与兴趣 POI', color: '#22c55e' },
        { key: 'service', short: '服', name: '服务', desc: '可预约服务与商家', color: '#0f9f92' },
        { key: 'event', short: '活', name: '活动', desc: '正在进行与即将开始', color: '#7c3aed' },
        { key: 'route', short: '线', name: '路线', desc: '步行、骑行和主题轨迹', color: '#ff6b45' },
        { key: 'replica', short: '副', name: '地图副本', desc: '景区、展会与沉浸空间', color: '#f59e0b' }
      ]
    }
  },
  computed: {
    isLayers() { return this.mode === 'layers' },
    enabledCount() { return this.layerOptions.filter(item => this.isLayerEnabled(item.key)).length },
    allEnabled() { return this.enabledCount === this.layerOptions.length },
    timeLabel() {
      const labels = { all: '不限时间', today: '今天', week: '本周', custom: '自定义时间' }
      return labels[this.snapshot.timeRange?.preset] || '不限时间'
    },
    spaceLabel() {
      const filter = this.snapshot.spatialFilter || {}
      return filter.mode === 'radius' ? `附近 ${filter.radiusKm || 5}km` : '当前可视区'
    }
  },
  methods: {
    isLayerEnabled(key) { return this.layers.includes(key) },
    toggleLayer(key) {
      const next = this.isLayerEnabled(key)
        ? this.layers.filter(item => item !== key)
        : [...this.layers, key]
      this.$emit('layers-change', next)
    },
    toggleAll() {
      this.$emit('layers-change', this.allEnabled ? [] : this.layerOptions.map(item => item.key))
    },
    sharePath() {
      return `/pages/index/index?map=${encodeShareSnapshot(this.snapshot)}`
    },
    onFriendShare() {
      // #ifdef H5
      this.copyLink()
      // #endif
    },
    copyLink() {
      uni.setClipboardData({
        data: this.sharePath(),
        success: () => uni.showToast({ title: '地图链接已复制', icon: 'success' }),
        fail: () => uni.showToast({ title: '复制失败，请重试', icon: 'none' })
      })
    },
    generatePoster() {
      try {
        const context = uni.createCanvasContext('inlineSharePoster', this)
        context.setFillStyle('#fff7ed')
        context.fillRect(0, 0, 320, 500)
        context.setFillStyle('#ea580c')
        context.fillRect(0, 0, 320, 12)
        context.setFillStyle('#0f172a')
        context.setFontSize(24)
        context.fillText(`${this.snapshot.center.cityName}地图探索`, 24, 64)
        context.setFillStyle('#64748b')
        context.setFontSize(14)
        context.fillText(`${this.timeLabel} · ${this.spaceLabel}`, 24, 94)
        context.setFillStyle('#e2e8f0')
        context.fillRect(24, 126, 272, 260)
        context.setFillStyle('#f97316')
        ;[[72,190],[164,248],[240,176],[214,330]].forEach(([x,y]) => {
          context.beginPath()
          context.arc(x, y, 8, 0, Math.PI * 2)
          context.fill()
        })
        context.setFillStyle('#334155')
        context.setFontSize(14)
        context.fillText('打开足迹，继续探索这张地图', 24, 430)
        context.draw(false, () => {
          uni.canvasToTempFilePath({
            canvasId: 'inlineSharePoster',
            success: result => {
              uni.saveImageToPhotosAlbum({
                filePath: result.tempFilePath,
                success: () => uni.showToast({ title: '海报已保存', icon: 'success' }),
                fail: () => uni.showToast({ title: '保存失败，请检查相册权限', icon: 'none' })
              })
            },
            fail: () => uni.showToast({ title: '海报生成失败，请重试', icon: 'none' })
          }, this)
        })
      } catch (error) {
        uni.showToast({ title: '当前平台暂不支持生成海报', icon: 'none' })
      }
    }
  }
}
</script>

<style scoped>
.tool-panel { width: 100%; box-sizing: border-box; background: var(--color-page); }
.panel-head { position: sticky; top: 0; z-index: 2; min-height: 72px; padding: 12px 20px; display: flex; align-items: center; justify-content: space-between; background: rgba(248,250,252,.96); border-bottom: 1px solid rgba(148,163,184,.16); backdrop-filter: blur(14px); box-sizing: border-box; }
.eyebrow,.panel-title { display: block; }
.eyebrow { color: #ea580c; font-size: 11px; font-weight: 750; letter-spacing: .6px; }
.panel-title { margin-top: 2px; color: #0f172a; font-size: 22px; font-weight: 800; }
.close-button { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 15px; background: #fff; box-shadow: 0 4px 14px rgba(15,23,42,.08); }
.close-glyph { position: relative; width: 18px; height: 18px; transform: rotate(45deg); }
.close-glyph::before,.close-glyph::after { content: ''; position: absolute; left: 8px; top: 1px; width: 2px; height: 16px; border-radius: 2px; background: #64748b; }
.close-glyph::after { transform: rotate(90deg); }
.summary-card { margin: 12px 16px 0; min-height: 84px; padding: 14px; display: flex; align-items: center; gap: 14px; border: 1px solid rgba(148,163,184,.16); border-radius: 20px; background: #fff; box-shadow: 0 8px 24px rgba(15,23,42,.06); box-sizing: border-box; }
.summary-copy,.option-main { flex: 1; min-width: 0; }
.summary-title,.summary-desc,.option-name,.option-desc { display: block; }
.summary-title { color: #0f172a; font-size: 16px; font-weight: 800; }
.summary-desc { margin-top: 4px; color: #64748b; font-size: 12px; line-height: 1.45; }
.summary-icon,.share-mark { width: 48px; height: 48px; flex: 0 0 48px; border-radius: 16px; background: #eff6ff; position: relative; }
.layers-icon view { position: absolute; left: 13px; width: 22px; height: 12px; border: 2px solid #2563eb; border-radius: 5px; box-sizing: border-box; }
.layers-icon view:nth-child(1) { top: 10px; }
.layers-icon view:nth-child(2) { top: 17px; background: #eff6ff; }
.layers-icon view:nth-child(3) { top: 24px; background: #eff6ff; }
.all-toggle { min-width: 48px; height: 36px; padding: 0 10px; display: flex; align-items: center; justify-content: center; border-radius: 18px; background: #fff7ed; color: #c2410c; font-size: 12px; font-weight: 750; }
.section-label { margin: 20px 20px 10px; color: #334155; font-size: 15px; font-weight: 800; }
.option-card { margin: 0 16px; overflow: hidden; border: 1px solid rgba(148,163,184,.14); border-radius: 20px; background: #fff; box-shadow: 0 8px 24px rgba(15,23,42,.05); }
.option-row { width: 100%; min-height: 72px; padding: 10px 14px; display: flex; align-items: center; gap: 12px; border: 0; border-bottom: 1px solid #f1f5f9; border-radius: 0; background: #fff; text-align: left; box-sizing: border-box; }
.option-row.last { border-bottom: 0; }
.option-row:active { background: #fffaf7; }
.option-icon { width: 42px; height: 42px; flex: 0 0 42px; display: flex; align-items: center; justify-content: center; border-radius: 13px; color: #fff; font-size: 14px; font-weight: 800; }
.option-name { color: #0f172a; font-size: 15px; font-weight: 750; }
.option-desc { margin-top: 3px; color: #94a3b8; font-size: 12px; }
.switch-control { position: relative; width: 48px; height: 28px; flex: 0 0 48px; border-radius: 14px; background: #e2e8f0; transition: background-color 180ms ease; }
.switch-control.on { background: #22c55e; }
.switch-thumb { position: absolute; left: 3px; top: 3px; width: 22px; height: 22px; border-radius: 50%; background: #fff; box-shadow: 0 2px 6px rgba(15,23,42,.18); transition: transform 180ms ease; }
.switch-control.on .switch-thumb { transform: translateX(20px); }
.share-mark { background: #eff6ff; }
.share-node { position: absolute; width: 9px; height: 9px; border: 2px solid #fff; border-radius: 50%; background: #ea580c; z-index: 2; }
.share-node.top { left: 20px; top: 7px; }
.share-node.left { left: 8px; top: 28px; }
.share-node.right { right: 7px; top: 28px; }
.share-line { position: absolute; left: 15px; top: 23px; width: 20px; height: 2px; background: #ea580c; transform-origin: left center; }
.share-line.first { transform: rotate(-56deg); }
.share-line.second { transform: rotate(56deg); }
.context-chips { margin: 12px 16px 0; display: flex; gap: 8px; }
.context-chip { min-height: 32px; padding: 0 12px; display: flex; align-items: center; border-radius: 16px; font-size: 12px; font-weight: 700; }
.context-chip.orange { background: #fff7ed; color: #c2410c; }
.context-chip.blue { background: #eff6ff; color: #2563eb; }
.context-chip.purple { background: #f5f3ff; color: var(--color-info); }
.friend { background: #22c55e; }
.poster { background: #ff6b45; }
.link { background: var(--color-info); }
.share-button { margin: 0; line-height: normal; }
.share-button::after { border: 0; }
.row-arrow { width: 10px; height: 10px; flex: 0 0 10px; border-top: 2px solid #cbd5e1; border-right: 2px solid #cbd5e1; transform: rotate(45deg); }
.poster-canvas { position: fixed; left: -9999px; top: -9999px; width: 320px; height: 500px; }
.bottom-space { height: calc(28px + env(safe-area-inset-bottom)); }
@media (prefers-reduced-motion: reduce) { .switch-control,.switch-thumb { transition: none; } }
</style>

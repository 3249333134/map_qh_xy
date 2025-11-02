<template>
  <view class="location-module">
    <view class="map-section">
      <!-- 只在页面就绪后渲染地图 -->
      <map
        v-if="isMapReady"
        id="userMap"
        :class="isFullyExpanded ? 'user-map-full-expanded' : 'user-map-optimized'"
        :latitude="mapCenter.latitude"
        :longitude="mapCenter.longitude"
        :scale="mapCenter.scale"
        :markers="mapMarkers"
        @markertap="handleMarkerTap"
        @callouttap="handleCalloutTap"
        @regionchange="handleRegionChange"
        @tap="handleMapTap"
        @touchstart="onMapTouchStart"
        @touchmove="onMapTouchMove"
        @touchend="onMapTouchEnd"
        show-location
        enable-zoom
        enable-scroll
        enable-rotate
        enable-3D
        :include-points="userLocations"
        :include-padding="includePadding"
      >
        <!-- 悬浮缩小卡片：基于 cover-view 锚定到每个标记点 -->
        <template v-for="m in mapMarkers" :key="m.id">
          <!-- 新增：低缩放时使用圆形聚合气泡，仅显示聚合数量，形成分层聚合形态 -->
          <cover-view
            v-if="zoomTier === 'bubble' && m.clusterCount > 0"
            :key="`bubble-${m.id}`"
            class="cluster-bubble"
            :marker-id="m.id"
            slot="callout"
          >
            <cover-view class="cluster-bubble-count">{{ clusterLabel(m.clusterCount) }}</cover-view>
          </cover-view>
          
          <!-- 中高缩放时显示缩略图卡片（中缩放隐藏文本，高缩放显示文本） -->
          <cover-view
            v-else
            :key="m.id"
            class="card card-floating"
            :marker-id="m.id"
            slot="callout"
            :style="cardScaleStyle"
          >
            <cover-view class="card-media" @touchstart="onCardTouchStart" @touchmove="onCardTouchMove" @touchend="onCardTouchEnd" @tap.stop="handleMediaTap(m)">
              <cover-image v-if="m.cover" class="card-media-img" :src="m.cover" />
              <cover-view v-else class="card-media-placeholder"></cover-view>
            </cover-view>
            <cover-view class="card-content">
              <cover-view v-if="showText" class="card-title">{{ m.title }}</cover-view>
              <cover-view v-if="showText && m.subtitle" class="card-author">{{ m.subtitle }}</cover-view>
              <!-- 移除地点与点赞，仅保留名字与作者。服务卡片保留右下角“预”。 -->
              <cover-view v-if="m.type === 'service'" class="cta-float">
                <cover-view class="reserve-big">预</cover-view>
              </cover-view>
            </cover-view>
            <!-- 聚合数量徽标：右上角（在非气泡形态下保留显示） -->
            <cover-view v-if="m.clusterCount && m.clusterCount > 0" class="cluster-count-badge">{{ clusterLabel(m.clusterCount) }}</cover-view>
          </cover-view>
        </template>
      </map>
      
      <!-- 加载状态 -->
      <view v-else class="map-loading">
        <text>地图加载中...</text>
      </view>
      
      <!-- 移除信息栏，将其移到父组件 -->
    </view>
  </view>
</template>

<script>
export default {
  name: 'LocationModule',
  props: {
    userLocations: {
      type: Array,
      default: () => []
    },
    isFullyExpanded: {
      type: Boolean,
      default: false
    },
    scaleFactor: {
      type: Number,
      default: 0.6667 // 将卡片缩放到当前大小的 1/3（原始尺寸的 2/3）
    }
  },
    data() {
      return {
        isMapReady: false,
        includePadding: { left: 20, right: 20, top: 20, bottom: 0 },
        hasTappedOnce: false,
        _initDone: false,
        // 缩放结束后的延迟刷新定时器，避免需要再拖动才更新
        _pendingRefreshTimer: null,
      // 点击判定阈值（像素与毫秒）
      _tapThresholdPx: 12,
      _tapThresholdMs: 200,
      _touchStart: null,
      _mapDragging: false,
      // 新增：卡片拖动判定相关状态
      _cardDragging: false,
      _lastCardDragAt: 0,
      _dragThresholdPx: 14,
      _cardTouchStart: null,
      // 新增：拖动后的冷却时间窗口，避免拖动结束瞬时触发 tap
      _cardMoved: false,
      _lastDragAt: 0,
      _recentDragWindowMs: 200,
      // 严格点击资格判定（由 touchend 判定）
      _cardTapEligible: false,
      _lastCardTouchEnd: 0,
      // 新增：地图点击资格判定（由 map touchend 判定）
      _mapTapEligible: false,
      _lastMapTouchEnd: 0,
        // 新增：MapContext 和缩放/视野状态
        mapCtx: null,
        currentScale: null,
        currentRegion: null,
        // 提升解除聚合的缩放门槛：更高的缩放才完全散开
        showAllThresholdScale: 13,
        // 新增：按“初始缩放 + 差值”解除聚合（比例控制）
        initialScale: null,
        initialMaxDistanceKm: 0,
        // 在初始缩放基础上再放大多少级完全散开（可调）
        unclusterDelta: 2,
      }
    },
  
  mounted() {
    // 延迟初始化地图，避免过早调用
    this.$nextTick(() => {
      // 仅首次挂载初始化一次
      if (!this._initDone) {
        setTimeout(() => {
          this.isMapReady = true
          this._initDone = true
          // 初始化 MapContext 并获取当前缩放与视野范围
          try {
            // 微信环境优先使用 wx.createMapContext，其它环境回退到 uni.createMapContext
            // @ts-ignore
            this.mapCtx = (typeof wx !== 'undefined' && wx.createMapContext) ? wx.createMapContext('userMap') : uni.createMapContext('userMap', this)
          } catch (e) {
            this.mapCtx = uni.createMapContext('userMap', this)
          }
          this.updateScaleAndRegion()
        }, 200)
      }
    })
  },
  
  computed: {
    // 添加mapCenter计算属性
    mapCenter() {
      if (this.userLocations && this.userLocations.length > 0) {
        // 基于最远两点（用包围盒对角线近似）计算初始缩放
        const lats = this.userLocations.map(l => l.latitude)
        const lngs = this.userLocations.map(l => l.longitude)
        const minLat = Math.min(...lats)
        const maxLat = Math.max(...lats)
        const minLng = Math.min(...lngs)
        const maxLng = Math.max(...lngs)
        const centerLat = (minLat + maxLat) / 2
        const centerLng = (minLng + maxLng) / 2
        const diagKm = this.computeDistanceKm(minLat, minLng, maxLat, maxLng)
        const initScale = this.distanceToScale(diagKm)
        // 记录初始距离与缩放，供后续比例控制聚合
        this.initialMaxDistanceKm = diagKm
        this.initialScale = initScale
        return {
          latitude: centerLat,
          longitude: centerLng,
          scale: initScale
        }
      }
      return {
        latitude: 39.9042,
        longitude: 116.4074,
        scale: 10
      }
    },

    // 新增：根据当前缩放和视野进行网格聚合，仅保留点赞最高项，并记录聚合数量
    visibleLocations() {
      const hasScale = typeof this.currentScale === 'number' && !isNaN(this.currentScale)
      const scale = hasScale ? this.currentScale : ((this.mapCenter && this.mapCenter.scale) || null)
      const locs = Array.isArray(this.userLocations) ? this.userLocations.slice() : []
      const region = this.currentRegion
      const inView = region ? locs.filter(l => {
        try {
          const sw = region.southwest || {}
          const ne = region.northeast || {}
          const lat = l.latitude
          const lng = l.longitude
          return lat >= (sw.latitude ?? -90) && lat <= (ne.latitude ?? 90) && lng >= (sw.longitude ?? -180) && lng <= (ne.longitude ?? 180)
        } catch (_) {
          return true
        }
      }) : locs
      // 解除聚合条件：达到“初始缩放 + 差值”，或当前视野已足够小
      const unclusterScale = (typeof this.initialScale === 'number' && !Number.isNaN(this.initialScale))
        ? (this.initialScale + (this.unclusterDelta || 2))
        : this.showAllThresholdScale
      if ((scale != null && scale >= unclusterScale) || this.isSmallRegion(region)) {
        return inView.map(l => ({ ...l, clusterCount: 0 }))
      }
      const { latSize, lngSize, swLat, swLng } = this.getCellSizesForScale(scale)
      const buckets = new Map()
      inView.forEach((l) => {
        const likesNum = typeof l.likes === 'number' ? l.likes : (parseInt(l.likes, 10) || 0)
        const latIdx = Math.floor(((l.latitude || 0) - (swLat || 0)) / latSize)
        const lngIdx = Math.floor(((l.longitude || 0) - (swLng || 0)) / lngSize)
        const key = `${latIdx}_${lngIdx}`
        const arr = buckets.get(key) || []
        arr.push({ loc: l, likes: likesNum })
        buckets.set(key, arr)
      })
      const result = []
      buckets.forEach(arr => {
        arr.sort((a, b) => this.getHotness(b.loc) - this.getHotness(a.loc))
        const top = arr[0].loc
        const count = Math.max(0, arr.length - 1)
        result.push({ ...top, clusterCount: count })
      })
      return result
    },
    
    mapMarkers() {
      return this.visibleLocations.map((location, index) => ({
        id: index,
        latitude: location.latitude,
        longitude: location.longitude,
        title: location.title,
        subtitle: location.subtitle || '',
        likes: typeof location.likes === 'number' ? location.likes : (parseInt(location.likes, 10) || undefined),
        cover: location.cover || '',
        coords: `${(location.latitude ?? 0).toFixed(2)}, ${(location.longitude ?? 0).toFixed(2)}`,
        // 新增：透传类型，便于区分服务与内容
        type: location.type || 'content',
        clusterCount: location.clusterCount || 0,
        iconPath: '/static/marker.png',
        width: 20,
        height: 20,
        callout: {
          content: location.title,
          color: '#333',
          fontSize: 14,
          borderRadius: 8,
          bgColor: '#fff',
          padding: 8,
          display: 'BYCLICK'
        },
        customCallout: {
          display: 'ALWAYS',
          anchorX: 0,
          anchorY: -Math.round(12 * this.scaleFactor) // 调整更贴近标记：减少垂直偏移，让卡片更靠近标记（随缩放）
        }
      }))
    },
    cardScaleStyle() {
      return `transform: scale(${this.scaleFactor}); transform-origin: bottom center;`;
    },
    // 新增：是否显示文本（标题/作者），严格按缩放门槛；仅在无法获取缩放值时，使用小视野后备
    showText() {
      // 统一样式要求：所有缩放状态都显示标题与作者
      return true
    },
    // 新增：缩放分层，用于切换不同的聚合形态（低缩放：气泡；中缩放：仅图片；高缩放：图片+文本）
    zoomTier() {
      // 统一样式要求：所有缩放状态都使用“图片+名称+作者”的卡片形态
      return 'card'
    }
  },
  methods: {
    handleCardTap(id) {
      this.$emit('marker-tap', id)
      this.hasTappedOnce = true
    },
    onMapTouchStart(e) {
      const t = e?.touches?.[0]
      if (!t) return
      this._touchStart = { x: t.pageX, y: t.pageY, time: Date.now() }
      this._mapDragging = false
      // 地图点击资格在新的触摸开始时复位
      this._mapTapEligible = false
    },
    onMapTouchMove(e) {
      const t = e?.touches?.[0]
      if (!t || !this._touchStart) return
      const dx = Math.abs(t.pageX - this._touchStart.x)
      const dy = Math.abs(t.pageY - this._touchStart.y)
      if (dx > this._tapThresholdPx || dy > this._tapThresholdPx) {
        this._mapDragging = true
      }
    },
    onMapTouchEnd(e) {
      const now = Date.now()
      const t = (e && (e.changedTouches && e.changedTouches[0])) || (e && (e.touches && e.touches[0]))
      if (this._touchStart && t) {
        const dx = Math.abs((t.pageX || t.clientX || 0) - this._touchStart.x)
        const dy = Math.abs((t.pageY || t.clientY || 0) - this._touchStart.y)
        const duration = now - this._touchStart.time
        if (dx > this._tapThresholdPx || dy > this._tapThresholdPx) {
          // 拖动结束：记录拖动时间窗口并拒绝点击资格
          this._lastDragAt = now
          this._mapTapEligible = false
        } else if (duration <= this._tapThresholdMs && (now - this._lastDragAt) >= this._recentDragWindowMs) {
          // 未拖动且在点击时间阈值内：授予点击资格
          this._mapTapEligible = true
          this._lastMapTouchEnd = now
        } else {
          this._mapTapEligible = false
        }
      } else {
        this._mapTapEligible = false
      }
      this._touchStart = null
      // 结束后复位拖动状态
      this._mapDragging = false
    },
    onCardTouchStart(e) {
      const t = (e && (e.touches && e.touches[0])) || (e && (e.changedTouches && e.changedTouches[0]))
      if (!t) return
      const x = t.pageX || t.clientX || 0
      const y = t.pageY || t.clientY || 0
      this._cardTouchStart = { x, y, time: Date.now() }
      this._cardDragging = false
      this._cardMoved = false
     },
    onCardTouchMove(e) {
      const t = (e && (e.touches && e.touches[0])) || (e && (e.changedTouches && e.changedTouches[0]))
      if (!t || !this._cardTouchStart) return
      const x = t.pageX || t.clientX || 0
      const y = t.pageY || t.clientY || 0
      const dx = x - this._cardTouchStart.x
      const dy = y - this._cardTouchStart.y
      this._cardMoved = true
      if (Math.abs(dx) > this._dragThresholdPx || Math.abs(dy) > this._dragThresholdPx) {
        this._cardDragging = true
      }
    },
    onCardTouchEnd() {
      const now = Date.now()
      if (this._cardMoved || this._cardDragging) {
        this._lastDragAt = now
        this._cardTapEligible = false
      } else {
        const startTime = (this._cardTouchStart && this._cardTouchStart.time) || now
        const duration = now - startTime
        // 未拖动且在点击时间阈值内，且不在拖动冷却窗口内，才允许后续 tap
        if (duration <= this._tapThresholdMs && (now - this._lastDragAt) >= this._recentDragWindowMs && !this._mapDragging) {
          this._cardTapEligible = true
          this._lastCardTouchEnd = now
        } else {
          this._cardTapEligible = false
        }
      }
      this._cardTouchStart = null
      this._cardDragging = false
    },
    handleMediaTap(m) {
      const now = Date.now()
      // 仅在 touchend 判定为有效点击资格的情况下，tap 才允许继续
      if (!this._cardTapEligible || (now - this._lastCardTouchEnd) > 300) {
        return
      }
      // 若当前处于地图拖动或卡片拖动状态，则不执行跳转，并复位标记
      if (this._mapDragging || this._cardDragging) {
        this._mapDragging = false
        this._cardDragging = false
        return
      }
      // 消费点击资格，避免重复触发
      this._cardTapEligible = false
      try {
        const item = m || {}
        if (item.type === 'service') {
          uni.setStorageSync('LAST_SERVICE_ITEM', item)
          uni.navigateTo({ url: '/pages/service/detail/index' })
        } else {
          uni.navigateTo({ url: '/pages/detail/index' })
        }
      } catch (e) {
        console.warn('跳转失败', e)
      }
    },
    handleCalloutTap(e) {
      // 地图点击：优先依据地图点击资格；若无资格但满足“不在拖拽且不在冷却窗口”，也允许跳转
      const now = Date.now()
      if (this._mapDragging) {
        this._mapDragging = false
        return
      }
      const hasRecentDrag = (now - this._lastDragAt) < this._recentDragWindowMs
      const eligible = this._mapTapEligible && (now - this._lastMapTouchEnd) <= 300
      if (!eligible) {
        if (hasRecentDrag) return
        // 若不在冷却窗口且未拖拽，则视为明确点击
      }
      // 消费地图点击资格
      this._mapTapEligible = false
      try {
        const markerIdRaw = e?.detail?.markerId ?? e?.markerId
        const markerId = typeof markerIdRaw === 'string' ? parseInt(markerIdRaw, 10) : markerIdRaw
        const m = this.mapMarkers.find(mm => mm.id === markerId)
        if (!m) return
        if (m.type === 'service') {
          uni.setStorageSync('LAST_SERVICE_ITEM', m)
          uni.navigateTo({ url: '/pages/service/detail/index' })
        } else {
          uni.navigateTo({ url: '/pages/detail/index' })
        }
      } catch (err) {
        console.warn('callout 跳转失败', err)
      }
    },
    handleMarkerTap(e) {
      const id = e?.detail?.markerId ?? e?.markerId ?? e?.detail?.id ?? e?.id
      this.$emit('marker-tap', id)
    },
    handleRegionChange(e) {
      try {
        const type = e?.type || e?.detail?.type
        const causedBy = e?.causedBy || e?.detail?.causedBy
        const isDragOrGesture = causedBy === 'drag' || causedBy === 'gesture'
        const isScale = causedBy === 'scale'
        if (type === 'begin' && (isDragOrGesture || isScale)) {
          this._mapDragging = true
          this._mapTapEligible = false
        }
        if (type === 'end' && (isDragOrGesture || isScale)) {
          this._mapDragging = false
          this._lastDragAt = Date.now()
          this._mapTapEligible = false
          // 结束缩放或拖动后更新当前缩放级别和视野范围，用于动态聚合显示
          // 优先使用事件中的缩放值，兼容不同地图内核
          const newScale = e?.scale ?? e?.detail?.scale
          if (typeof newScale === 'number' && !Number.isNaN(newScale)) {
            this.currentScale = parseInt(newScale, 10)
            console.log('[Map] currentScale(event) =', this.currentScale)
            // 立即用近似方法更新当前视野，避免必须再拖动才刷新聚合
            const center = this.currentRegion
              ? {
                  latitude: (this.currentRegion.southwest.latitude + this.currentRegion.northeast.latitude) / 2,
                  longitude: (this.currentRegion.southwest.longitude + this.currentRegion.northeast.longitude) / 2
                }
              : { latitude: this.mapCenter.latitude, longitude: this.mapCenter.longitude }
            this.currentRegion = this.approximateRegionFromScale(center.latitude, center.longitude, this.currentScale)
            // 触发重新计算
            this.$forceUpdate()
          }
          this.updateScaleAndRegion()
        }
      } catch (err) {
        console.warn('regionchange 处理异常', err)
      }
    },
    handleMapTap(e) {
      // 地图空白处点击占位
    },
    // 新增：更新缩放和视野范围
    updateScaleAndRegion() {
      if (!this.mapCtx) return
      try {
        this.mapCtx.getScale({
          success: (res) => {
            const s = (res && (res.scale ?? res.value)) || null
            if (s) {
              this.currentScale = parseInt(s, 10)
              console.log('[Map] currentScale =', this.currentScale)
            }
          }
        })
        this.mapCtx.getRegion({
          success: (res) => {
            this.currentRegion = res || null
            try {
              const r = this.currentRegion
              const latSpan = r && r.southwest && r.northeast ? Math.abs((r.northeast.latitude ?? 0) - (r.southwest.latitude ?? 0)) : null
              const lngSpan = r && r.southwest && r.northeast ? Math.abs((r.northeast.longitude ?? 0) - (r.southwest.longitude ?? 0)) : null
              console.log('[Map] region spans:', { latSpan, lngSpan })
            } catch (_) {}
          }
        })
      } catch (e) {
        // 忽略
      }
    },
    // 新增：视野是否足够小（用于在无法获取准确缩放时，仍能体现“阶梯感”）
    isSmallRegion(region) {
      try {
        const r = region || this.currentRegion
        if (!r || !r.southwest || !r.northeast) return false
        const latSpan = Math.abs((r.northeast.latitude ?? 0) - (r.southwest.latitude ?? 0))
        const lngSpan = Math.abs((r.northeast.longitude ?? 0) - (r.southwest.longitude ?? 0))
        // 收紧阈值：仅在极小视野（接近街区/楼宇级别）时才解除聚合
        return latSpan <= 0.01 && lngSpan <= 0.01
      } catch (_) {
        return false
      }
    },
    // 新增：不同缩放级别对应的网格尺寸（经纬度度数）
    getCellSizeForScale(scale) {
      const s = parseInt(scale, 10) || 10
      if (s <= 6) return 1.0
      if (s <= 8) return 0.5
      if (s <= 10) return 0.2
      if (s <= 12) return 0.1
      if (s <= 13) return 0.06
      return 0.04
    },
    // 新增：不同缩放级别对应的网格尺寸（优先依据当前视野范围动态计算；无视野时回退到固定阶梯粒度）
    getCellSizesForScale(scale) {
       const s = parseInt(scale, 10) || 10
       const r = this.currentRegion
       if (r && r.southwest && r.northeast) {
         const latSpan = Math.abs((r.northeast.latitude ?? 0) - (r.southwest.latitude ?? 0))
         const lngSpan = Math.abs((r.northeast.longitude ?? 0) - (r.southwest.longitude ?? 0))
         // 更强的“阶梯感”：低缩放更粗，高缩放更细
         const div = s <= 6 ? 1 : (s <= 8 ? 2 : (s <= 10 ? 3 : (s <= 12 ? 6 : (s <= 13 ? 10 : 16))))
         // 每档设置最小网格度数下限，避免在 include-points 导致视野很小时过度细分（高缩放档位进一步降低下限，便于解除聚合）
         const floorDeg = s <= 6 ? 0.8 : (s <= 8 ? 0.5 : (s <= 10 ? 0.3 : (s <= 12 ? 0.15 : (s <= 13 ? 0.06 : 0.02))))
         const latSize = Math.max(latSpan / div, floorDeg)
         const lngSize = Math.max(lngSpan / div, floorDeg)
         return { latSize: Math.max(latSize, 1e-6), lngSize: Math.max(lngSize, 1e-6), swLat: r.southwest.latitude, swLng: r.southwest.longitude }
       }
       const fixed = this.getCellSizeForScale(s)
       return { latSize: fixed, lngSize: fixed, swLat: 0, swLng: 0 }
     },
    // 新增：热度评分（优先使用显式 hotness，其次使用 likes）
    getHotness(loc) {
      if (!loc) return 0
      const hot = typeof loc.hotness === 'number' ? loc.hotness : parseFloat(loc.hotness)
      if (!Number.isNaN(hot)) return hot
      const likes = typeof loc.likes === 'number' ? loc.likes : (parseInt(loc.likes, 10) || 0)
      return likes
    },
    // 新增：聚合数量标签（上限 99+，显示总收纳数量 = clusterCount + 1）
    clusterLabel(count) {
      const n = (typeof count === 'number') ? count : (parseInt(count, 10) || 0)
      const total = n + 1
      return total > 99 ? '99+' : String(total)
    },
    // 新增：根据经纬度计算两点球面距离（公里）
    computeDistanceKm(lat1, lng1, lat2, lng2) {
      const toRad = (d) => (d * Math.PI) / 180
      const R = 6371 // 地球半径 km
      const dLat = toRad(lat2 - lat1)
      const dLng = toRad(lng2 - lng1)
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      return R * c
    },
    // 新增：按距离映射到微信地图缩放级别的经验函数
    // 近似规则：远距用低缩放，近距用高缩放
    distanceToScale(distKm) {
      const d = Math.max(0, distKm || 0)
      if (d > 1000) return 4
      if (d > 400) return 5
      if (d > 200) return 6
      if (d > 100) return 8
      if (d > 50) return 10
      if (d > 20) return 12
      if (d > 8) return 13
      if (d > 3) return 14
      if (d > 1) return 15
      if (d > 0.3) return 16
      return 17
    },
    // 新增：根据缩放级别近似一个视野范围（避免依赖异步 getRegion）
    approximateRegionFromScale(centerLat, centerLng, scale) {
      const span = this.getApproxSpanForScale(scale || 10)
      const halfLat = span.lat / 2
      const halfLng = span.lng / 2
      return {
        southwest: { latitude: centerLat - halfLat, longitude: centerLng - halfLng },
        northeast: { latitude: centerLat + halfLat, longitude: centerLng + halfLng }
      }
    },
    // 新增：缩放到经纬度跨度的近似映射（经验值）
    getApproxSpanForScale(s) {
      const ss = parseInt(s, 10) || 10
      if (ss <= 4) return { lat: 35, lng: 35 }
      if (ss <= 5) return { lat: 20, lng: 20 }
      if (ss <= 6) return { lat: 12, lng: 12 }
      if (ss <= 8) return { lat: 8, lng: 8 }
      if (ss <= 10) return { lat: 3, lng: 3 }
      if (ss <= 12) return { lat: 1.2, lng: 1.2 }
      if (ss <= 13) return { lat: 0.5, lng: 0.5 }
      if (ss <= 14) return { lat: 0.2, lng: 0.2 }
      if (ss <= 15) return { lat: 0.08, lng: 0.08 }
      if (ss <= 16) return { lat: 0.03, lng: 0.03 }
      if (ss <= 17) return { lat: 0.015, lng: 0.015 }
      return { lat: 0.008, lng: 0.008 }
    }
  },
}
</script>

<style scoped>
/* 引入 CardItem 的样式结构并适配 cover-view */
.card {
  margin-bottom: 10px;
  border-radius: 6px;
  background-color: #fff;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  width: auto;
  display: flex;
  flex-direction: column;
}
.card-floating {
  padding: 0;
}
.card-media {
  background-color: #a0c4ff;
  height: 120px; /* 正方形尺寸 */
  width: 120px;  /* 正方形尺寸 */
  border-radius: 12px; /* 视觉更贴近示例 */
  overflow: hidden;
}
.card-content {
  padding: 6px; /* 更紧凑 */
  box-sizing: border-box;
}
.card-title {
  font-size: 14px; /* 原 28rpx ~ 14px */
  font-weight: 600;
  margin-bottom: 4px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-author {
  font-size: 12px; /* 原 24rpx ~ 12px */
  color: #666;
  margin-bottom: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* 移除 card-footer 的展示（地点与点赞） */
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-location,
.card-stats {
  font-size: 12px; /* 原 24rpx ~ 12px */
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}


.location-module {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.map-section {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

/* 优化后的地图样式 - 完全填满 */
.user-map-optimized,
.user-map-full-expanded {
  width: 100%;
  height: 100%;
  border-radius: 0;
  position: absolute;
  top: 0;
  left: 0;
}

/* 悬浮缩小卡片样式（cover-view） */
.floating-card {
  display: flex;
  align-items: center;
  max-width: 160px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.12);
  padding: 6px 8px;
}
.card-img {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  margin-right: 6px;
}
.card-title {
  font-size: 12px;
  color: #333;
  font-weight: 600;
  line-height: 1.2;
}

/* 地图信息覆盖层 - 完全固定在导航栏上方，不受任何变换影响 */
.map-info {
  position: fixed !important; /* 相对于整个视窗固定 */
  bottom: 12px !important; /* 更贴近底部，减少空隙 */
  left: 15px !important;
  right: 15px !important;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  z-index: 9999 !important; /* 最高层级 */
  pointer-events: auto;
  /* 关键：完全脱离父元素变换影响 */
  transform: none !important;
  will-change: auto !important;
  contain: layout !important;
  isolation: isolate !important;
  transform-style: flat !important;
  backface-visibility: hidden !important;
  /* 确保在所有情况下都保持固定 */
  margin: 0 !important;
  top: auto !important;
}

.map-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 2px;
}

.map-desc {
  font-size: 13px;
  color: #666;
  display: block;
}

/* 响应式优化 */
@media (max-width: 750px) {
  .map-info {
    bottom: 60px !important;
    left: 12px !important;
    right: 12px !important;
    padding: 10px 14px;
  }
  
  .map-title {
    font-size: 14px;
  }
  
  .map-desc {
    font-size: 12px;
  }
}

.map-loading {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  color: #999;
}
.cta-float {
  position: absolute;
  right: 9px;
  bottom: 9px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  z-index: 1;
}
.reserve-big {
  width: 52px; /* 适配缩放后尺寸 */
  height: 27px;
  background: #FFC400;
  border-radius: 6px;
  color: #333;
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
}

/* 新增：聚合数量徽标样式 */
.cluster-count-badge {
  position: absolute;
  right: 9px;
  top: 9px;
  background: #FF4D4F; /* 红色醒目 */
  color: #fff;
  font-size: 12px;
  border-radius: 999px;
  padding: 2px 6px;
  z-index: 2;
  font-weight: 700;
}

/* 新增：低缩放聚合气泡样式（与卡片形态区分） */
.cluster-bubble {
  width: 48px;
  height: 48px;
  border-radius: 999px;
  background: #fff;
  box-shadow: 0 4px 14px rgba(0,0,0,0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #FF4D4F;
}
.cluster-bubble-count {
  color: #FF4D4F;
  font-weight: 800;
  font-size: 14px;
}
</style>
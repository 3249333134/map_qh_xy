<template>
  <view class="hotspot-container" v-if="visible">
    <view 
      class="test-card" 
      style="position: absolute; left: 50px; top: 100px; width: 70px; height: 90px; background: red; z-index: 100;"
    >
      <text style="color: white; font-size: 12px; padding: 10px;">测试卡片</text>
    </view>
    <HotspotCard
      v-for="(item, index) in positionedItems"
      :key="item.id || item._id || index"
      :item="item"
      :is-highlighted="highlightedId === (item.id || item._id)"
      :is-dragging="draggingId === (item.id || item._id)"
      :scale="cardScale"
      :left="item._x"
      :top="item._y"
      :style="{ animationDelay: (index * 0.05) + 's' }"
      class="hotspot-card-item"
      @tap="onCardTap"
      @long-press="onCardLongPress"
      @drag-start="onCardDragStart"
      @drag-move="onCardDragMove"
      @drag-end="onCardDragEnd"
    />
  </view>
</template>

<script>
import HotspotCard from './HotspotCard.vue'

export default {
  name: 'HotspotCardsContainer',
  components: { HotspotCard },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    items: {
      type: Array,
      default: () => []
    },
    mapCenter: {
      type: Object,
      default: () => ({ latitude: 0, longitude: 0 })
    },
    mapScale: {
      type: Number,
      default: 16
    },
    mapWidth: {
      type: Number,
      default: 375
    },
    mapHeight: {
      type: Number,
      default: 600
    },
    highlightedId: {
      type: [String, Number],
      default: null
    },
    mapBounds: {
      type: Object,
      default: null
    }
  },
  emits: ['card-tap', 'card-long-press', 'highlight-change'],
  data() {
    return {
      draggingId: null,
      dragStartX: 0,
      dragStartY: 0,
      dragItemStartX: 0,
      dragItemStartY: 0,
      customPositions: {},
      positionedItems: []
    }
  },
  computed: {
    cardScale() {
      const baseScale = 16
      const scale = this.mapScale || 16
      const diff = scale - baseScale
      const result = 1 - diff * 0.08
      return Math.max(0.7, Math.min(1.2, result))
    }
  },
  watch: {
    items: {
      handler() {
        this.calculatePositions()
      },
      deep: true,
      immediate: true
    },
    mapCenter: {
      handler() {
        this.calculatePositions()
      },
      deep: true
    },
    mapScale() {
      this.calculatePositions()
    },
    mapBounds: {
      handler() {
        this.calculatePositions()
      },
      deep: true
    },
    visible(val) {
      if (val) {
        this.$nextTick(() => {
          this.calculatePositions()
        })
      }
    }
  },
  mounted() {
    if (this.visible) {
      this.$nextTick(() => {
        this.calculatePositions()
      })
    }
  },
  methods: {
    calculatePositions() {
      if (!this.items || this.items.length === 0) {
        this.positionedItems = []
        return
      }

      const cardW = 70
      const cardH = 90
      const safeTop = 70
      const safeBottom = 100
      const safeLeft = 15
      const safeRight = 15

      const w = this.mapWidth || 375
      const h = this.mapHeight || 600

      const bounds = this.mapBounds
      let items = this.items
        .filter(item => {
          if (!item || !item.location || !item.location.coordinates) return false
          if (item.location.type === 'LineString') return false
          return true
        })
        .slice(0, 6)
        .map(item => ({ ...item }))

      if (bounds && bounds.northeast && bounds.southwest) {
        const neLat = bounds.northeast.latitude
        const neLng = bounds.northeast.longitude
        const swLat = bounds.southwest.latitude
        const swLng = bounds.southwest.longitude
        const latRange = neLat - swLat
        const lngRange = neLng - swLng

        if (latRange > 0 && lngRange > 0) {
          items.forEach((item, index) => {
            const coords = item.location.coordinates
            const lng = coords[0]
            const lat = coords[1]

            const xRatio = (lng - swLng) / lngRange
            const yRatio = (neLat - lat) / latRange

            let x = xRatio * w - cardW / 2
            let y = yRatio * h - cardH - 40

            const id = item.id || item._id || index
            if (this.customPositions[id]) {
              x = this.customPositions[id].x
              y = this.customPositions[id].y
            }

            x = Math.max(safeLeft, Math.min(w - cardW - safeRight, x))
            y = Math.max(safeTop, Math.min(h - cardH - safeBottom, y))

            item._x = x
            item._y = y
          })

          items = this.resolveOverlap(items, cardW, cardH, safeTop, safeBottom, safeLeft, safeRight, w, h)
          this.positionedItems = items
          return
        }
      }

      const cols = items.length <= 3 ? 1 : 2
      const rows = Math.ceil(items.length / cols)
      const totalW = cols * cardW + (cols - 1) * 16
      let startX = w - totalW - safeRight - 10
      let startY = safeTop + 20

      if (items.length <= 2) {
        startX = w - cardW - safeRight - 10
        startY = safeTop + 60
      }

      items.forEach((item, index) => {
        const id = item.id || item._id || index
        const col = index % cols
        const row = Math.floor(index / cols)

        if (this.customPositions[id]) {
          item._x = this.customPositions[id].x
          item._y = this.customPositions[id].y
        } else {
          item._x = startX + col * (cardW + 16)
          item._y = startY + row * (cardH + 16)
        }

        item._x = Math.max(safeLeft, Math.min(w - cardW - safeRight, item._x))
        item._y = Math.max(safeTop, Math.min(h - cardH - safeBottom, item._y))
      })

      this.positionedItems = items
    },

    resolveOverlap(items, cardW, cardH, safeTop, safeBottom, safeLeft, safeRight, w, h) {
      const gap = 8
      let changed = true
      let iterations = 0
      const maxIterations = 20

      while (changed && iterations < maxIterations) {
        changed = false
        iterations++

        for (let i = 0; i < items.length; i++) {
          for (let j = i + 1; j < items.length; j++) {
            const a = items[i]
            const b = items[j]
            const idA = a.id || a._id
            const idB = b.id || b._id
            if (this.customPositions[idA] || this.customPositions[idB]) continue

            const overlapX = (a._x < b._x + cardW + gap) && (a._x + cardW + gap > b._x)
            const overlapY = (a._y < b._y + cardH + gap) && (a._y + cardH + gap > b._y)

            if (overlapX && overlapY) {
              const dx = (b._x + cardW / 2) - (a._x + cardW / 2)
              const dy = (b._y + cardH / 2) - (a._y + cardH / 2)

              if (Math.abs(dx) > Math.abs(dy)) {
                const push = (cardW + gap - Math.abs(dx)) / 2
                if (dx >= 0) {
                  b._x += push
                  a._x -= push
                } else {
                  b._x -= push
                  a._x += push
                }
              } else {
                const push = (cardH + gap - Math.abs(dy)) / 2
                if (dy >= 0) {
                  b._y += push
                  a._y -= push
                } else {
                  b._y -= push
                  a._y += push
                }
              }
              changed = true
            }
          }
        }

        items.forEach(item => {
          const id = item.id || item._id
          if (this.customPositions[id]) return
          item._x = Math.max(safeLeft, Math.min(w - cardW - safeRight, item._x))
          item._y = Math.max(safeTop, Math.min(h - cardH - safeBottom, item._y))
        })
      }

      return items
    },

    onCardTap(item) {
      this.$emit('card-tap', item)
    },

    onCardLongPress(item) {
      const id = item.id || item._id
      this.draggingId = id
      this.$emit('card-long-press', item)
      uni.vibrateShort && uni.vibrateShort({ type: 'light' })
    },

    onCardDragStart({ item, event }) {
      const id = item.id || item._id
      const touch = event.touches && event.touches[0]
      if (!touch) return
      this.dragStartX = touch.clientX
      this.dragStartY = touch.clientY
      const found = this.positionedItems.find(i => (i.id || i._id) === id)
      if (found) {
        this.dragItemStartX = found._x
        this.dragItemStartY = found._y
      }
    },

    onCardDragMove({ item, event }) {
      const id = item.id || item._id
      const touch = event.touches && event.touches[0]
      if (!touch) return

      const dx = touch.clientX - this.dragStartX
      const dy = touch.clientY - this.dragStartY

      const found = this.positionedItems.find(i => (i.id || i._id) === id)
      if (found) {
        const cardW = 70
        const cardH = 90
        const w = this.mapWidth || 375
        const h = this.mapHeight || 600

        found._x = Math.max(10, Math.min(w - cardW - 10, this.dragItemStartX + dx))
        found._y = Math.max(60, Math.min(h - cardH - 80, this.dragItemStartY + dy))
      }
    },

    onCardDragEnd({ item }) {
      const id = item.id || item._id
      const found = this.positionedItems.find(i => (i.id || i._id) === id)
      if (found) {
        this.customPositions[id] = { x: found._x, y: found._y }
      }
      this.draggingId = null
    },

    highlightCard(id) {
      this.$emit('highlight-change', id)
    }
  }
}
</script>

<style scoped>
.hotspot-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 9999;
  width: 100%;
  height: 100%;
}

.hotspot-container :deep(.hotspot-card-item) {
  pointer-events: auto;
}

.test-card {
  pointer-events: auto;
}
</style>

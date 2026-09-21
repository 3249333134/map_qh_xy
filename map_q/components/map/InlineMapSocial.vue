<template>
  <view class="inline-social" :style="{ bottom: bottomOffset + 88 + 'px' }">
    <view v-if="scene === 'board'" class="board-actions">
      <text>长按地图选点，留下图文或视频</text>
      <view role="button" aria-label="创建留言板" @tap="$emit('create-board')">＋ 留言</view>
    </view>

    <view class="map-tools">
      <view v-if="toolsOpen" class="tool-list">
        <view role="button" aria-label="重新定位" @tap="$emit('locate')">定位</view>
        <view role="button" aria-label="放大地图" @tap="$emit('zoom', 1)">＋</view>
        <view role="button" aria-label="缩小地图" @tap="$emit('zoom', -1)">−</view>
        <view role="button" aria-label="打开地图图层" @tap="$emit('layers')">图层</view>
      </view>
      <view class="tools-toggle" role="button" aria-label="地图工具" :aria-expanded="toolsOpen" @tap="toolsOpen = !toolsOpen">{{ toolsOpen ? '收起' : '•••' }}</view>
    </view>

    <view v-if="selected" class="selected-card">
      <view class="selected-copy">
        <text>{{ selected.customData.title }}</text>
        <text>{{ selected.customData.subtitle }}</text>
      </view>
      <view class="selected-action" role="button" :aria-label="`查看${selected.customData.title}`" @tap="$emit('open-selected', selected)">查看</view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'InlineMapSocial',
  props: {
    scene: { type: String, default: 'people' },
    selected: { type: Object, default: null },
    bottomOffset: { type: Number, default: 86 }
  },
  emits: ['locate', 'zoom', 'layers', 'create-board', 'open-selected'],
  data() { return { toolsOpen: false } },
  watch: { scene() { this.toolsOpen = false } }
}
</script>

<style scoped>
.inline-social { position: absolute; z-index: 45; left: 16px; right: 16px; pointer-events: none; }
.map-tools { position: absolute; right: 0; bottom: 88px; display: flex; flex-direction: column; gap: 8px; pointer-events: auto; }
.tool-list { display: flex; flex-direction: column; gap: 8px; }
.tool-list>view,.tools-toggle { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 50%; color: var(--color-text); background: rgba(255,255,255,.96); box-shadow: 0 4px 14px rgba(0,0,0,.08); font-size: 12px; }
.tool-list>view:active,.tools-toggle:active,.selected-action:active { opacity: .7; }
.selected-card { display: flex; align-items: center; gap: 12px; padding: 12px; min-height: 64px; box-sizing: border-box; border-radius: 20px; background: rgba(255,255,255,.96); box-shadow: 0 8px 24px rgba(0,0,0,.1); pointer-events: auto; }
.selected-copy { min-width: 0; flex: 1; }
.selected-copy text { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--color-text); }
.selected-copy text:first-child { font-size: 15px; font-weight: 800; }
.selected-copy text:last-child { margin-top: 4px; color: #68736f; font-size: 11px; }
.selected-action { min-width: 62px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 15px; color: #fff; background: var(--color-text); font-size: 13px; }
.board-actions { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; padding: 10px 12px; border-radius: 16px; background: rgba(255,255,255,.96); font-size: 12px; color: #68736f; pointer-events: auto; }
.board-actions>view { flex-shrink: 0; padding: 8px; color: var(--color-text); font-weight: 700; }
</style>

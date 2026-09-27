<template>
  <view class="inline-social">
    <view v-if="scene === 'board'" class="board-actions" :style="{ bottom: bottomOffset + 96 + 'px' }"><text>长按地图选点，留下图文或视频</text><view role="button" @tap="$emit('create-board')">＋ 留言</view></view>

    <view v-if="scene !== 'people'" class="map-tools" :style="{ bottom: bottomOffset + (selected ? 228 : 214) + 'px' }">
      <view v-if="toolsOpen" class="tool-list"><view role="button" aria-label="重新定位" @tap="$emit('locate')">定位</view><view role="button" aria-label="放大地图" @tap="$emit('zoom', 1)">＋</view><view role="button" aria-label="缩小地图" @tap="$emit('zoom', -1)">−</view><view role="button" aria-label="打开地图图层" @tap="$emit('layers')">图层</view></view>
      <view class="tools-toggle" role="button" aria-label="地图工具" :aria-expanded="toolsOpen" @tap="toolsOpen = !toolsOpen">{{ toolsOpen ? '收起' : '•••' }}</view>
    </view>

    <view v-if="selected" class="selected-card" :style="{ bottom: bottomOffset + 96 + 'px' }">
      <view class="selected-main">
        <image v-if="selected.customData.avatar" class="selected-avatar" :src="selected.customData.avatar" mode="aspectFill" />
        <view v-else class="initial-avatar">{{ selected.customData.title?.charAt(0) }}</view>
        <view class="selected-copy"><view class="name-row"><text class="name">{{ selected.customData.title }}</text><text v-if="selected.customData.online" class="online-label">在线</text></view><text class="subtitle">{{ selected.customData.subtitle }}</text></view>
        <view class="close-card" role="button" aria-label="关闭人物卡片" @tap="$emit('dismiss-selected')">×</view>
      </view>
      <view class="selected-actions"><text class="selected-note">{{ scene === 'people' ? '演示人物 · 兴趣资料' : '发现身边的新鲜事' }}</text><view v-if="scene === 'people'" class="follow-button" role="button" @tap="$emit('follow-user', selected)">关注</view><view class="profile-button" role="button" @tap="$emit('open-selected', selected)">查看{{ scene === 'people' ? '资料' : '详情' }} ↗</view></view>
    </view>


  </view>
</template>
<script>
export default {
  name: 'InlineMapSocial',
  props: {
    scene: { type: String, default: 'people' }, selected: { type: Object, default: null },
    bottomOffset: { type: Number, default: 86 }
  },
  emits: ['locate', 'zoom', 'layers', 'create-board', 'open-selected', 'dismiss-selected', 'follow-user'],
  data() { return { toolsOpen: false } },
  watch: { scene() { this.toolsOpen = false } }
}
</script>
<style scoped>
.inline-social { position: absolute; z-index: 45; inset: 0; pointer-events: none; color: #263d32; }
.map-tools { position: absolute; right: 14px; display: flex; flex-direction: column; gap: 8px; pointer-events: auto; }
.tool-list { display: flex; flex-direction: column; gap: 8px; }
.tools-toggle,.tool-list>view { display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: 16px; background: rgba(255,255,255,.96); box-shadow: 0 3px 12px rgba(35,69,47,.07); font-size: 12px; }
.tools-toggle.locate { background: #e5f2d7; }
.locate-glyph { width: 15px; height: 15px; border: 2px solid #426744; border-radius: 50%; position: relative; }
.locate-glyph::after { content: ''; position: absolute; width: 5px; height: 5px; background: #426744; border-radius: 50%; left: 5px; top: 5px; }
.selected-card { position: absolute; left: 16px; right: 16px; padding: 12px; border: 1px solid white; border-radius: 22px; background: rgba(255,255,255,.98); box-shadow: 0 6px 20px rgba(35,69,47,.08); pointer-events: auto; }
.selected-main { display: flex; align-items: center; gap: 10px; }.selected-avatar,.initial-avatar { width: 50px; height: 50px; border-radius: 50%; flex-shrink: 0; }.initial-avatar { display: flex; align-items: center; justify-content: center; background: #e0efda; font-size: 20px; }
.selected-copy { flex: 1; min-width: 0; }.name-row { display: flex; gap: 7px; align-items: center; }.name { font-size: 16px; font-weight: 700; }.online-label { font-size: 10px; color: #629566; }.subtitle { display: block; margin-top: 5px; font-size: 11px; color: #7f8f80; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.close-card { width: 36px; height: 44px; display: flex; align-items: center; justify-content: center; color: #8a988d; font-size: 24px; }.selected-actions { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 8px; }.selected-note { font-size: 10px; color: #839181; }.follow-button { margin-left: auto; min-height: 40px; padding: 0 10px; display: flex; align-items: center; color: #557b55; font-size: 12px; }
.profile-button { padding: 0 15px; min-height: 40px; display: flex; align-items: center; border-radius: 13px; background: #dfedcf; color: #395e3f; font-size: 12px; font-weight: 600; }
.board-actions { position: absolute; left: 16px; right: 16px; display: flex; justify-content: space-between; padding: 12px; border-radius: 16px; background: white; font-size: 12px; pointer-events: auto; }
</style>

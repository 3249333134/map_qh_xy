<template>
  <view class="inline-social">
    <view class="top-shade"></view>
    <view class="social-header" :style="{ paddingTop: statusBar + 'px' }">
      <view class="back-button" role="button" aria-label="退出地图社交" @tap="$emit('close')"><view class="back-glyph"></view></view>
      <view class="header-copy"><text class="scene-title">{{ activeScene.name }}</text><text class="scene-description">{{ activeScene.description }}</text></view>
    </view>

    <scroll-view class="scene-scroll" scroll-x enhanced :show-scrollbar="false" :scroll-into-view="`inline-${scene}`" :style="{ top: statusBar + 74 + 'px' }">
      <view class="scene-list">
        <view v-for="item in scenes" :id="`inline-${item.id}`" :key="item.id" class="scene-chip" :class="[{ active: scene === item.id }, item.id]" role="button" :aria-label="`切换到${item.name}`" :aria-pressed="scene === item.id" @tap="selectScene(item.id)">
          <view class="scene-icon"><view class="icon-detail"></view></view><text>{{ item.name }}</text>
        </view>
      </view>
    </scroll-view>

    <view v-if="scene === 'board'" class="board-tip"><text>长按地图选点</text><text>图文和视频会聚合为一个留言板标记</text></view>

    <view class="side-tools">
      <view role="button" aria-label="重新定位" @tap="$emit('locate')"><view class="locate-icon"></view></view>
      <view role="button" aria-label="放大地图" @tap="$emit('zoom', 1)"><view class="plus-icon"></view></view>
      <view role="button" aria-label="缩小地图" @tap="$emit('zoom', -1)"><view class="minus-icon"></view></view>
    </view>

    <view v-if="selected" class="selected-card">
      <view class="selected-mark" :class="selected.customData.kind"><view></view></view>
      <view class="selected-copy"><text>{{ selected.customData.title }}</text><text>{{ selected.customData.subtitle }}</text></view>
      <view class="selected-action" role="button" :aria-label="`查看${selected.customData.title}`" @tap="$emit('open-selected', selected)">查看</view>
    </view>
    <view v-else class="action-dock">
      <view class="dock-secondary" role="button" aria-label="筛选地图社交内容"><view class="filter-icon"></view><text>筛选</text></view>
      <view class="dock-primary" role="button" :aria-label="scene === 'board' ? '创建留言板' : '探索附近'" @tap="scene === 'board' ? $emit('create-board') : $emit('locate')">
        <view :class="scene === 'board' ? 'add-icon' : 'radar-icon'"></view><text>{{ scene === 'board' ? '创建留言板' : '探索附近' }}</text>
      </view>
      <view class="dock-secondary" role="button" aria-label="打开地图图层" @tap="$emit('layers')"><view class="layers-icon"></view><text>图层</text></view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'InlineMapSocial',
  props: {
    scene: { type: String, default: 'people' },
    selected: { type: Object, default: null }
  },
  emits: ['close', 'scene-change', 'locate', 'zoom', 'layers', 'create-board', 'open-selected'],
  data() {
    return {
      statusBar: 20,
      scenes: [
        { id: 'people', name: '附近的人', description: '发现此刻在附近的人' },
        { id: 'checkin', name: '同城打卡', description: '看看城市正在发生什么' },
        { id: 'mate', name: '活动搭子', description: '寻找同频同行者' },
        { id: 'couple', name: '亲密共享', description: '只显示双方授权的位置' },
        { id: 'board', name: '留言板', description: '把内容留在真实地点' }
      ]
    }
  },
  computed: {
    activeScene() { return this.scenes.find(item => item.id === this.scene) || this.scenes[0] }
  },
  mounted() {
    try { this.statusBar = (uni.getWindowInfo?.() || uni.getSystemInfoSync()).statusBarHeight || 20 } catch (error) {}
  },
  methods: {
    selectScene(scene) {
      try { if (typeof uni.vibrateShort === 'function') uni.vibrateShort({ type: 'light' }) } catch (error) {}
      this.$emit('scene-change', scene)
    }
  }
}
</script>

<style scoped>
.inline-social { position: absolute; z-index: 45; inset: 0; pointer-events: none; }
.top-shade { position: absolute; left: 0; right: 0; top: 0; height: 210px; background: linear-gradient(180deg,rgba(249,251,250,.98),rgba(249,251,250,.72) 62%,transparent); }
.social-header { position: absolute; z-index: 2; left: 0; right: 0; top: 0; min-height: 68px; padding-left: 16px; padding-right: 88px; display: flex; align-items: center; gap: 12px; box-sizing: content-box; pointer-events: auto; }
.back-button { width: 48px; height: 48px; flex: 0 0 48px; display: flex; align-items: center; justify-content: center; border-radius: 18px; background: rgba(255,255,255,.94); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1); }
.back-button:active { opacity: .72; }
.back-glyph { width: 11px; height: 11px; border-left: 2px solid var(--color-text); border-bottom: 2px solid var(--color-text); transform: rotate(45deg); }
.header-copy { min-width: 0; flex: 1; }
.scene-title,.scene-description { display: block; }
.scene-title { color: var(--color-text); font-size: 24px; line-height: 1.2; font-weight: 900; letter-spacing: -.5px; }
.scene-description { margin-top: 4px; color: #68736f; font-size: 12px; font-weight: 600; }
.scene-scroll { position: absolute; z-index: 3; left: 0; right: 0; height: 58px; white-space: nowrap; pointer-events: auto; }
.scene-list { display: inline-flex; min-width: 100%; padding: 4px 16px 10px; gap: 8px; box-sizing: border-box; }
.scene-chip { min-width: 116px; height: 44px; padding: 0 14px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; border-radius: 16px; color: #33403c; background: rgba(255,255,255,.96); box-shadow: 0 7px 20px rgba(0, 0, 0, 0.1); font-size: 13px; font-weight: 750; box-sizing: border-box; }
.scene-chip:active { opacity: .74; }
.scene-chip.active { color: #fff; background: var(--color-text); }
.scene-icon { position: relative; width: 24px; height: 24px; flex: 0 0 24px; border-radius: 8px; color: var(--color-primary); background: #e7f8f4; }
.scene-chip.active .scene-icon { color: #fff; background: var(--color-primary); }
.scene-icon::before,.scene-icon::after,.icon-detail::before { content: ''; position: absolute; box-sizing: border-box; }
.people .scene-icon::before { left: 8px; top: 5px; width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
.people .scene-icon::after { left: 5px; bottom: 4px; width: 14px; height: 7px; border-radius: 8px 8px 4px 4px; background: currentColor; }
.checkin .scene-icon::before { left: 7px; top: 5px; width: 11px; height: 14px; border: 2px solid currentColor; border-radius: 3px; transform: rotate(-5deg); }
.mate .scene-icon::before { left: 5px; top: 11px; width: 14px; border-top: 2px solid currentColor; }.mate .scene-icon::after { left: 11px; top: 5px; height: 14px; border-left: 2px solid currentColor; }
.couple .scene-icon::before { left: 5px; top: 7px; width: 14px; height: 11px; border-radius: 8px 8px 4px 4px; background: currentColor; }
.board .scene-icon::before { left: 5px; top: 5px; width: 14px; height: 14px; border: 2px solid currentColor; border-radius: 4px; }.board .icon-detail::before { left: 9px; top: 9px; width: 7px; border-top: 2px solid currentColor; box-shadow: 0 4px 0 currentColor; }
.board-tip { position: absolute; z-index: 3; left: 50%; top: 164px; transform: translateX(-50%); width: max-content; max-width: 78vw; padding: 10px 14px; border-radius: 14px; color: #fff; background: rgba(23,32,30,.86); text-align: center; pointer-events: none; }.board-tip text { display: block; }.board-tip text:first-child { font-size: 13px; font-weight: 800; }.board-tip text:last-child { margin-top: 2px; color: rgba(255,255,255,.74); font-size: 10px; }
.side-tools { position: absolute; z-index: 3; right: 16px; bottom: 184px; display: grid; gap: 8px; pointer-events: auto; }.side-tools>view { width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: rgba(255,255,255,.96); box-shadow: 0 8px 22px rgba(0, 0, 0, 0.1); }.side-tools>view:active { opacity: .72; }
.locate-icon { position: relative; width: 17px; height: 17px; border: 3px solid var(--color-text); border-radius: 50%; box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.08); }.locate-icon::after { content: ''; position: absolute; left: 5px; top: 5px; width: 7px; height: 7px; border-radius: 50%; background: var(--color-primary); }
.plus-icon,.minus-icon { position: relative; width: 19px; border-top: 2px solid var(--color-text); }.plus-icon::after { content: ''; position: absolute; left: 8px; top: -10px; height: 18px; border-left: 2px solid var(--color-text); }
.action-dock,.selected-card { position: absolute; z-index: 4; left: 16px; right: 16px; bottom: calc(84px + env(safe-area-inset-bottom)); min-height: 68px; padding: 7px; border-radius: 24px; color: var(--color-text); background: rgba(255,255,255,.96); box-shadow: 0 18px 42px rgba(0, 0, 0, 0.1); pointer-events: auto; box-sizing: border-box; animation: dockIn 220ms cubic-bezier(.2,.8,.2,1); }
.action-dock { display: grid; grid-template-columns: 64px 1fr 64px; align-items: center; gap: 7px; }
.dock-secondary,.dock-primary { min-height: 54px; border-radius: 18px; display: flex; align-items: center; justify-content: center; }.dock-secondary { flex-direction: column; gap: 3px; color: #64706c; font-size: 10px; }.dock-primary { gap: 9px; color: #fff; background: var(--color-text); font-size: 14px; font-weight: 800; }.dock-secondary:active,.dock-primary:active { opacity: .74; }
.filter-icon { position: relative; width: 16px; height: 16px; border: 2px solid currentColor; border-radius: 50%; }.filter-icon::after { content: ''; position: absolute; right: -5px; bottom: -3px; width: 7px; border-top: 2px solid currentColor; transform: rotate(45deg); }
.layers-icon { width: 19px; height: 12px; border: 2px solid currentColor; border-radius: 4px; transform: skewY(-14deg); box-shadow: 0 6px 0 -2px #fff,0 8px 0 currentColor; }
.radar-icon { position: relative; width: 19px; height: 19px; border: 2px solid var(--color-primary); border-radius: 50%; }.radar-icon::after { content: ''; position: absolute; left: 6px; top: 6px; width: 7px; height: 7px; border-radius: 50%; background: var(--color-primary); }
.add-icon { position: relative; width: 18px; height: 18px; }.add-icon::before,.add-icon::after { content: ''; position: absolute; border-radius: 2px; background: #fff; }.add-icon::before { left: 0; top: 8px; width: 18px; height: 2px; }.add-icon::after { left: 8px; top: 0; width: 2px; height: 18px; }
.selected-card { display: flex; align-items: center; gap: 12px; padding: 12px; }.selected-mark { width: 48px; height: 48px; flex: 0 0 48px; display: flex; align-items: center; justify-content: center; border-radius: 16px; color: var(--color-primary); background: #e7f8f4; }.selected-mark view { width: 15px; height: 15px; border: 3px solid currentColor; border-radius: 50%; }.selected-copy { min-width: 0; flex: 1; }.selected-copy text { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.selected-copy text:first-child { font-size: 15px; font-weight: 800; }.selected-copy text:last-child { margin-top: 3px; color: #68736f; font-size: 11px; }.selected-action { min-width: 62px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 15px; color: #fff; background: var(--color-text); font-size: 13px; font-weight: 750; }
@keyframes dockIn { from { opacity: .4; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
@media (prefers-reduced-motion: reduce) { .action-dock,.selected-card { animation: none; } }
</style>

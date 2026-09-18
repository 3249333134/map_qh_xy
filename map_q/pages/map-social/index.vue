<!-- impeccable-disable border-accent-on-rounded -- plus control glyph, not a card border -->
<template>
  <view class="page">
    <map class="map" :latitude="state.latitude" :longitude="state.longitude" :scale="state.scale" :markers="markers" show-location @markertap="selectMarker" @longpress="pickBoardLocation"></map>
    <view class="top-scrim"></view>
    <view class="header" :style="{ paddingTop: statusBar + 'px' }">
      <view class="back" aria-label="返回" @tap="goBack"><view></view></view>
      <view class="heading"><text>{{ activeScene.name }}</text><text>{{ activeScene.description }}</text></view>
      <view class="more"><view></view><view></view><view></view></view>
    </view>
    <scroll-view scroll-x :show-scrollbar="false" class="scenes" :style="{ top: statusBar + 75 + 'px' }"><view class="scene-list">
      <view v-for="item in scenes" :key="item.id" class="scene mq-pressable" :class="{ active: state.scene === item.id }" role="button" :aria-label="`切换到${item.name}`" @tap="changeScene(item.id)"><view class="scene-icon" :class="item.id"></view><text>{{ item.name }}</text></view>
    </view></scroll-view>

    <view v-if="state.scene === 'board'" class="board-hint"><text>长按地图选点</text><text>一个留言板聚合全部图文与视频</text></view>

    <view class="side-tools">
      <view aria-label="定位" @tap="locate"><view class="locate-icon"></view></view>
      <view aria-label="放大" @tap="state.scale = Math.min(18, state.scale + 1)"><view class="plus"></view></view>
      <view aria-label="缩小" @tap="state.scale = Math.max(11, state.scale - 1)"><view class="minus"></view></view>
    </view>

    <view v-if="selected" :key="selected.id" class="selected-card">
      <view class="selected-avatar"><image src="/static/logo.png" mode="aspectFill" /></view>
      <view class="selected-copy"><text>{{ selected.customData.title }}</text><text>{{ selected.customData.subtitle }}</text></view>
      <view class="open mq-pressable" role="button" :aria-label="`查看${selected.customData.title}`" @tap="openSelected">查看</view>
    </view>
    <view v-else class="bottom-dock" :class="{ board: state.scene === 'board' }">
      <view class="dock-action mq-pressable" role="button" aria-label="筛选地图内容"><view class="search-icon"></view><text>筛选</text></view>
      <view class="primary mq-pressable" role="button" :aria-label="state.scene === 'board' ? '创建地图留言板' : '探索附近'" @tap="state.scene === 'board' ? createBoard() : locate()"><view :class="state.scene === 'board' ? 'add-icon' : 'radar-icon'"></view><text>{{ state.scene === 'board' ? '创建留言板' : '探索附近' }}</text></view>
      <view class="dock-action mq-pressable" role="button" aria-label="切换地图图层"><view class="layers-icon"></view><text>图层</text></view>
    </view>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { onLoad, onShow, onHide } from '@dcloudio/uni-app'
import { messageBoardApi } from '../../utils/api/messageBoard.js'
const KEY = 'MAP_SOCIAL_STATE_V1', statusBar = ref(20), selected = ref(null)
const scenes = [
  { id:'people', name:'附近的人', description:'发现此刻在附近的人' },
  { id:'checkin', name:'同城打卡', description:'看看城市正在发生什么' },
  { id:'mate', name:'活动搭子', description:'寻找同频同行者' },
  { id:'couple', name:'亲密共享', description:'只显示双方授权的位置' },
  { id:'board', name:'地图留言板', description:'把内容留在真实地点' }
]
const state = reactive({ scene:'people', latitude:30.572269, longitude:104.066541, scale:13, picked:null })
const activeScene = computed(() => scenes.find(i => i.id === state.scene) || scenes[0])
const demo = {
  people:[['阿蓝','300m · 现在在线'],['林野','1.2km · 城市漫步'],['小北','860m · 看展中']],
  checkin:[['太古里夜景','23人刚刚打卡'],['望平街咖啡','12条新动态'],['江滩日落','今日热度上升']],
  mate:[['周末 Livehouse','还缺 2 位同行者'],['城市骑行','周六 09:00 集合'],['公园飞盘','还可加入 4 人']],
  couple:[['亲密共享','对方已授权 · 48m']]
}
const offsets = [[.004,-.004],[-.006,.006],[.009,.003],[-.003,-.009]]
const markers = computed(() => {
  if (state.scene === 'board') return messageBoardApi.list().map((b,i) => ({ id:1000+i, latitude:b.location.coordinates[1], longitude:b.location.coordinates[0], iconPath:'/static/marker-green.png', width:46, height:54, customData:{ kind:'board', id:b.id, title:b.title, subtitle:`${b.itemCount} 条内容 · ${b.location.address || '地图留言板'}` } }))
  return (demo[state.scene] || []).map((v,i) => ({ id:i+1, latitude:state.latitude+offsets[i][0], longitude:state.longitude+offsets[i][1], iconPath:i === 0 ? '/static/marker-purple.png' : '/static/marker-blue.png', width:i === 0 ? 54 : 44, height:i === 0 ? 62 : 52, customData:{ kind:state.scene, id:`${state.scene}_${i}`, title:v[0], subtitle:v[1] } }))
})
function persist(){ uni.setStorageSync(KEY,{...state}) }
function changeScene(id){ state.scene=id; selected.value=null; try{uni.setStorageSync('MAP_SOCIAL_SCENE_ENTRY_V1',id)}catch(e){} persist() }
function selectMarker(e){ selected.value=markers.value.find(i => String(i.id) === String(e.detail?.markerId)) || null }
function openSelected(){ if(selected.value?.customData.kind === 'board') uni.navigateTo({url:`/pages/message-board-detail/index?id=${encodeURIComponent(selected.value.customData.id)}`}); else uni.showModal({title:selected.value.customData.title,content:selected.value.customData.subtitle,showCancel:false}) }
function pickBoardLocation(e){ if(state.scene !== 'board') return; state.picked={longitude:Number(e.detail?.longitude || state.longitude),latitude:Number(e.detail?.latitude || state.latitude)}; createBoard() }
function createBoard(){ const point=state.picked || {longitude:state.longitude,latitude:state.latitude}; uni.setStorageSync('MESSAGE_BOARD_PICKED_LOCATION',point); uni.navigateTo({url:'/pages/message-board-editor/index'}) }
function locate(){ uni.getLocation({type:'gcj02',success:r=>{state.latitude=r.latitude;state.longitude=r.longitude;state.scale=15;persist()},fail:()=>uni.showToast({title:'定位未授权，请在系统设置中开启',icon:'none'})}) }
function goBack(){ uni.navigateBack() }
onLoad(options=>{ try{Object.assign(state,uni.getStorageSync(KEY)||{});const requested=String(options?.scene||'');if(scenes.some(item=>item.id===requested))state.scene=requested;statusBar.value=(uni.getWindowInfo?.()||uni.getSystemInfoSync()).statusBarHeight||20}catch(e){} }); onShow(()=>{selected.value=null}); onHide(persist)
</script>

<style scoped>
.page,.map{position:absolute;inset:0;width:100%;height:100%;overflow:hidden}.top-scrim{position:absolute;z-index:3;left:0;right:0;top:0;height:190px;background:linear-gradient(180deg,rgba(247,249,247,.98) 0%,rgba(247,249,247,.82) 56%,transparent)}
.header{position:absolute;z-index:6;left:0;right:0;top:0;padding-left:16px;padding-right:16px;padding-bottom:10px;display:flex;align-items:center;gap:12px}.back,.more{width:46px;height:46px;flex:0 0 46px;border-radius:16px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.92);box-shadow:0 8px 24px rgba(0, 0, 0, 0.1)}.back>view{width:10px;height:10px;border-left:2px solid #1c2523;border-bottom:2px solid #1c2523;transform:rotate(45deg)}.more{gap:4px}.more view{width:4px;height:4px;border-radius:50%;background:#1c2523}.heading{flex:1;min-width:0}.heading text{display:block}.heading text:first-child{color:var(--color-text);font-size:23px;font-weight:900;letter-spacing:-.5px}.heading text:last-child{margin-top:2px;color:#68736f;font-size:11px}
.scenes{position:absolute;z-index:7;left:0;right:0;white-space:nowrap}.scene-list{display:inline-flex;gap:8px;padding:4px 16px 14px}.scene{height:44px;padding:0 14px;display:flex;align-items:center;gap:8px;border-radius:15px;background:rgba(255,255,255,.94);box-shadow:0 7px 20px rgba(0, 0, 0, 0.1);color:#323c39;font-size:12px;font-weight:650}.scene.active{background:var(--color-text);color:#fff}.scene-icon{width:23px;height:23px;border-radius:8px;position:relative;background:#edf2f0}.scene.active .scene-icon{background:#14b9a2}.scene-icon:before,.scene-icon:after{content:'';position:absolute}.people:before{left:8px;top:5px;width:7px;height:7px;border-radius:50%;background:currentColor}.people:after{left:5px;bottom:4px;width:13px;height:7px;border-radius:8px 8px 4px 4px;background:currentColor}.checkin:before{left:6px;top:4px;width:10px;height:12px;border:2px solid currentColor;border-radius:3px;transform:rotate(-5deg)}.mate:before{left:5px;top:10px;width:13px;border-top:3px solid currentColor}.mate:after{left:10px;top:5px;height:13px;border-left:3px solid currentColor}.couple:before{left:6px;top:7px;width:11px;height:9px;border-radius:8px 8px 3px 3px;background:currentColor}.board:before{left:5px;top:5px;width:13px;height:13px;border:2px solid currentColor;border-radius:3px}.board:after{left:9px;top:9px;width:7px;border-top:2px solid currentColor;box-shadow:0 4px 0 currentColor}
.board-hint{position:absolute;z-index:6;left:50%;top:168px;width:max-content;max-width:78vw;transform:translateX(-50%);padding:10px 14px;border-radius:14px;background:rgba(23,32,30,.82);color:#fff;text-align:center}.board-hint text{display:block}.board-hint text:first-child{font-size:12px;font-weight:750}.board-hint text:last-child{margin-top:2px;color:rgba(255,255,255,.68);font-size:9px}
.side-tools{position:absolute;z-index:7;right:16px;bottom:184px;display:grid;gap:8px}.side-tools>view{width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.94);box-shadow:0 8px 22px rgba(0, 0, 0, 0.1)}.plus,.minus{position:relative;width:18px;border-top:2px solid var(--color-text)}.plus:after{content:'';position:absolute;left:8px;top:-10px;height:18px;border-left:2px solid var(--color-text)}.locate-icon{width:16px;height:16px;border:3px solid var(--color-text);border-radius:50%;box-shadow:0 0 0 3px rgba(0, 0, 0, 0.09);position:relative}.locate-icon:after{content:'';position:absolute;left:5px;top:5px;width:6px;height:6px;border-radius:50%;background:#14b9a2}
.selected-card{position:absolute;z-index:8;left:16px;right:16px;bottom:calc(24px + env(safe-area-inset-bottom));padding:14px;border-radius:22px;display:flex;align-items:center;gap:12px;background:rgba(255,255,255,.95);box-shadow:0 18px 42px rgba(0, 0, 0, 0.1)}.selected-avatar{width:54px;height:54px;border:3px solid #fff;border-radius:50%;overflow:hidden;box-shadow:0 5px 14px rgba(0, 0, 0, 0.1)}.selected-avatar image{width:100%;height:100%}.selected-copy{flex:1;min-width:0}.selected-copy text{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.selected-copy text:first-child{font-size:14px;font-weight:800}.selected-copy text:last-child{margin-top:4px;color:#74807c;font-size:10px}.open{min-width:60px;height:44px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:var(--color-text);color:#fff;font-size:12px;font-weight:750}
.bottom-dock{position:absolute;z-index:8;left:18px;right:18px;bottom:calc(20px + env(safe-area-inset-bottom));height:68px;padding:7px;border-radius:24px;display:grid;grid-template-columns:64px 1fr 64px;align-items:center;gap:7px;background:rgba(255,255,255,.93);box-shadow:0 18px 42px rgba(0, 0, 0, 0.1)}.dock-action,.primary{height:54px;border-radius:18px;display:flex;align-items:center;justify-content:center}.dock-action{flex-direction:column;gap:3px;color:#6b7773;font-size:9px}.primary{gap:9px;background:var(--color-text);color:#fff;font-size:13px;font-weight:800}.board .primary{background:#f45f58}.search-icon{width:15px;height:15px;border:2px solid currentColor;border-radius:50%;position:relative}.search-icon:after{content:'';position:absolute;right:-5px;bottom:-3px;width:7px;border-top:2px solid currentColor;transform:rotate(45deg)}.layers-icon{width:19px;height:12px;border:2px solid currentColor;border-radius:4px;transform:skewY(-14deg);box-shadow:0 5px 0 -1px #fff,0 7px 0 currentColor}.radar-icon{width:19px;height:19px;border:2px solid var(--color-primary);border-radius:50%;position:relative}.radar-icon:after{content:'';position:absolute;left:6px;top:6px;width:7px;height:7px;border-radius:50%;background:var(--color-primary)}.add-icon{width:18px;height:18px;position:relative}.add-icon:before,.add-icon:after{content:'';position:absolute;background:#fff;border-radius:2px}.add-icon:before{left:0;top:8px;width:18px;height:2px}.add-icon:after{left:8px;top:0;width:2px;height:18px}
.selected-card{animation:mq-focus-enter var(--motion-emphasized) var(--ease-out)}.bottom-dock{animation:mq-sheet-enter var(--motion-emphasized) var(--ease-out)}@media (prefers-reduced-motion:reduce){.selected-card,.bottom-dock{animation:none}}
</style>

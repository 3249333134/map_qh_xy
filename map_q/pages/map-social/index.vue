<!-- impeccable-disable border-accent-on-rounded -- plus control glyph, not a card border -->
<template>
  <view class="page">
    <map class="map" :latitude="state.latitude" :longitude="state.longitude" :scale="state.scale" :markers="markers" show-location @markertap="selectMarker" @longpress="pickBoardLocation"></map>
    <view class="top-scrim"></view>

    <!-- 顶部：品牌 + 城市 + 用户数 -->
    <view class="header" :style="{ paddingTop: statusBar + 'px' }">
      <view class="back" aria-label="返回" @tap="goBack"><view></view></view>
      <view class="heading">
        <view class="title-row">
          <text class="brand">附近</text>
          <text class="divider">·</text>
          <text class="city">{{ cityName }}</text>
        </view>
        <text class="meta">{{ nearbyCount }} 位此刻在附近</text>
      </view>
      <view class="more" aria-label="更多"><view></view><view></view><view></view></view>
    </view>

    <!-- 场景切换 -->
    <scroll-view scroll-x :show-scrollbar="false" class="scenes" :style="{ top: statusBar + 78 + 'px' }">
      <view class="scene-list">
        <view v-for="item in scenes" :key="item.id" class="scene mq-pressable" :class="{ active: state.scene === item.id }" role="button" :aria-label="`切换到${item.name}`" @tap="changeScene(item.id)">
          <view class="scene-icon" :class="item.id"></view>
          <text>{{ item.name }}</text>
        </view>
      </view>
    </scroll-view>

    <view v-if="state.scene === 'board'" class="board-hint">
      <text>长按地图选点</text>
      <text>一个留言板聚合全部图文与视频</text>
    </view>

    <view class="side-tools">
      <view aria-label="定位" @tap="locate"><view class="locate-icon"></view></view>
      <view aria-label="放大" @tap="state.scale = Math.min(18, state.scale + 1)"><view class="plus"></view></view>
      <view aria-label="缩小" @tap="state.scale = Math.max(11, state.scale - 1)"><view class="minus"></view></view>
    </view>

    <!-- 选中用户卡片：增强版，带打招呼/关注按钮 -->
    <view v-if="selected" :key="selected.id" class="selected-card">
      <view class="selected-avatar" :style="{ background: selectedAvatarColor }">
        <text class="avatar-initial">{{ selectedInitial }}</text>
        <view class="online-dot"></view>
      </view>
      <view class="selected-copy">
        <view class="name-row">
          <text class="name">{{ selected.customData.title }}</text>
          <view class="user-tag">{{ selectedTag }}</view>
        </view>
        <text class="subtitle">{{ selected.customData.subtitle }}</text>
      </view>
      <view class="action-col">
        <view class="action-btn primary mq-pressable" role="button" aria-label="打招呼" @tap="openSelected">
          <view class="wave-icon"></view><text>打招呼</text>
        </view>
        <view class="action-btn ghost mq-pressable" role="button" aria-label="关注" @tap="followSelected">
          <view class="plus-small"></view><text>关注</text>
        </view>
      </view>
    </view>

    <!-- 附近的人：横向滑动用户卡片列表 -->
    <view v-else-if="state.scene === 'people'" class="nearby-list">
      <view class="list-header">
        <text class="list-title">附近的人</text>
        <text class="list-hint">左滑查看更多</text>
      </view>
      <scroll-view scroll-x :show-scrollbar="false" class="nearby-scroll">
        <view class="nearby-track">
          <view v-for="(user, idx) in nearbyUsers" :key="idx" class="nearby-card mq-pressable" :class="{ first: idx === 0 }" role="button" :aria-label="`查看${user.name}的主页`" @tap="selectUser(user, idx)">
            <view class="card-avatar" :style="{ background: user.color }">
              <text class="avatar-initial">{{ user.initial }}</text>
              <view v-if="user.online" class="online-pulse"></view>
            </view>
            <view class="card-info">
              <text class="card-name">{{ user.name }}</text>
              <view class="card-tag">{{ user.tag }}</view>
              <view class="card-foot">
                <view class="distance-dot"></view>
                <text class="card-distance">{{ user.distance }}</text>
              </view>
            </view>
          </view>
          <view class="nearby-card nearby-end">
            <view class="end-icon"></view>
            <text class="end-text">查看更多</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 其他场景：保留原 bottom-dock -->
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

// 附近的人：扩展 mock 数据，匹配参考图的卡片风格
const palette = ['#286c5c', '#3a7d6e', '#5b8a7e', '#7a9d8e', '#4a8b78', '#62a892']
const nearbyUsers = ref([
  { name:'阿蓝',   distance:'300m',  tag:'现在在线', initial:'阿', color:palette[0], online:true },
  { name:'林野',   distance:'1.2km', tag:'城市漫步', initial:'林', color:palette[1], online:false },
  { name:'小北',   distance:'860m',  tag:'看展中',   initial:'小', color:palette[2], online:true },
  { name:'青禾',   distance:'1.5km', tag:'咖啡时间', initial:'青', color:palette[3], online:false },
  { name:'知白',   distance:'2.1km', tag:'通勤路上', initial:'知', color:palette[4], online:false },
  { name:'南风',   distance:'450m',  tag:'寻找搭子', initial:'南', color:palette[5], online:true }
])
const cityName = ref('成都市')
const nearbyCount = computed(() => nearbyUsers.value.length)

const demo = {
  people: nearbyUsers.value.map(u => [u.name, `${u.distance} · ${u.tag}`]),
  checkin:[['太古里夜景','23人刚刚打卡'],['望平街咖啡','12条新动态'],['江滩日落','今日热度上升']],
  mate:[['周末 Livehouse','还缺 2 位同行者'],['城市骑行','周六 09:00 集合'],['公园飞盘','还可加入 4 人']],
  couple:[['亲密共享','对方已授权 · 48m']]
}
const offsets = [[.004,-.004],[-.006,.006],[.009,.003],[-.003,-.009],[.002,.008],[-.008,-.002]]

const markers = computed(() => {
  if (state.scene === 'board') {
    return messageBoardApi.list().map((b,i) => ({
      id:1000+i,
      latitude:b.location.coordinates[1],
      longitude:b.location.coordinates[0],
      iconPath:'/static/marker-green.png',
      width:46, height:54,
      customData:{ kind:'board', id:b.id, title:b.title, subtitle:`${b.itemCount} 条内容 · ${b.location.address || '地图留言板'}` }
    }))
  }
  return (demo[state.scene] || []).map((v,i) => ({
    id:i+1,
    latitude:state.latitude+offsets[i % offsets.length][0],
    longitude:state.longitude+offsets[i % offsets.length][1],
    iconPath:i === 0 ? '/static/marker-purple.png' : '/static/marker-blue.png',
    width:i === 0 ? 54 : 44,
    height:i === 0 ? 62 : 52,
    callout:{
      content: v[0] + ' · ' + (v[1].split(' · ')[0] || ''),
      color:'#1c2523',
      fontSize:11,
      borderRadius:10,
      borderWidth:0,
      bgColor:'#ffffff',
      padding:6,
      display:'ALWAYS',
      textAlign:'center'
    },
    customData:{ kind:state.scene, id:`${state.scene}_${i}`, title:v[0], subtitle:v[1] }
  }))
})

// 选中卡片相关计算属性
const selectedAvatarColor = computed(() => {
  if (!selected.value) return palette[0]
  const idx = nearbyUsers.value.findIndex(u => u.name === selected.value.customData.title)
  return idx >= 0 ? nearbyUsers.value[idx].color : palette[0]
})
const selectedInitial = computed(() => selected.value ? selected.value.customData.title.charAt(0) : '')
const selectedTag = computed(() => {
  if (!selected.value) return '现在在线'
  const parts = selected.value.customData.subtitle.split('·')
  return parts[1]?.trim() || '现在在线'
})

function persist(){ uni.setStorageSync(KEY,{...state}) }
function changeScene(id){ state.scene=id; selected.value=null; try{uni.setStorageSync('MAP_SOCIAL_SCENE_ENTRY_V1',id)}catch(e){} persist() }
function selectMarker(e){ selected.value=markers.value.find(i => String(i.id) === String(e.detail?.markerId)) || null }
function selectUser(user, idx){
  selected.value = {
    id: idx + 1,
    customData: {
      title: user.name,
      subtitle: `${user.distance} · ${user.tag}`,
      kind: 'people',
      id: `people_${idx}`
    }
  }
}
function openSelected(){
  if (selected.value?.customData.kind === 'board') {
    uni.navigateTo({url:`/pages/message-board-detail/index?id=${encodeURIComponent(selected.value.customData.id)}`})
  } else {
    uni.showModal({title:selected.value.customData.title, content:`想和 ${selected.value.customData.title} 打个招呼吗？`, confirmText:'发送招呼', success:r=>{ if(r.confirm) uni.showToast({title:'招呼已发出', icon:'success'}) }})
  }
}
function followSelected(){
  uni.showToast({ title:`已关注 ${selected.value?.customData.title || ''}`, icon:'success' })
}
function pickBoardLocation(e){ if(state.scene !== 'board') return; state.picked={longitude:Number(e.detail?.longitude || state.longitude),latitude:Number(e.detail?.latitude || state.latitude)}; createBoard() }
function createBoard(){ const point=state.picked || {longitude:state.longitude,latitude:state.latitude}; uni.setStorageSync('MESSAGE_BOARD_PICKED_LOCATION',point); uni.navigateTo({url:'/pages/message-board-editor/index'}) }
function locate(){ uni.getLocation({type:'gcj02',success:r=>{state.latitude=r.latitude;state.longitude=r.longitude;state.scale=15;persist()},fail:()=>uni.showToast({title:'定位未授权，请在系统设置中开启',icon:'none'})}) }
function goBack(){ uni.navigateBack() }
onLoad(options=>{ try{Object.assign(state,uni.getStorageSync(KEY)||{});const requested=String(options?.scene||'');if(scenes.some(item=>item.id===requested))state.scene=requested;statusBar.value=(uni.getWindowInfo?.()||uni.getSystemInfoSync()).statusBarHeight||20}catch(e){} }); onShow(()=>{selected.value=null}); onHide(persist)
</script>

<style scoped>
.page,.map{position:absolute;inset:0;width:100%;height:100%;overflow:hidden}
.top-scrim{position:absolute;z-index:3;left:0;right:0;top:0;height:210px;background:linear-gradient(180deg,rgba(247,249,247,.98) 0%,rgba(247,249,247,.82) 56%,transparent)}

/* ===== 顶部 header：品牌 + 城市 + 用户数 ===== */
.header{position:absolute;z-index:6;left:0;right:0;top:0;padding-left:16px;padding-right:16px;padding-bottom:10px;display:flex;align-items:center;gap:12px}
.back,.more{width:40px;height:40px;flex:0 0 40px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.94);box-shadow:0 6px 18px rgba(0,0,0,.08)}
.back>view{width:10px;height:10px;border-left:2px solid #1c2523;border-bottom:2px solid #1c2523;transform:rotate(45deg);margin-left:3px}
.more{gap:4px}
.more view{width:4px;height:4px;border-radius:50%;background:#1c2523}
.heading{flex:1;min-width:0}
.title-row{display:flex;align-items:baseline;gap:8px}
.brand{color:var(--color-text);font-size:22px;font-weight:900;letter-spacing:-.5px}
.divider{color:#bcc6c0;font-size:14px;font-weight:400}
.city{color:#3a7d6e;font-size:15px;font-weight:600}
.meta{display:block;margin-top:3px;color:#68736f;font-size:11px}

/* ===== 场景切换 ===== */
.scenes{position:absolute;z-index:7;left:0;right:0;white-space:nowrap}
.scene-list{display:inline-flex;gap:8px;padding:4px 16px 14px}
.scene{height:38px;padding:0 12px;display:flex;align-items:center;gap:7px;border-radius:13px;background:rgba(255,255,255,.94);box-shadow:0 5px 14px rgba(0,0,0,.08);color:#323c39;font-size:11px;font-weight:650}
.scene.active{background:var(--color-text);color:#fff}
.scene-icon{width:20px;height:20px;border-radius:7px;position:relative;background:#edf2f0}
.scene.active .scene-icon{background:#286c5c}
.scene-icon:before,.scene-icon:after{content:'';position:absolute}
.people:before{left:7px;top:4px;width:6px;height:6px;border-radius:50%;background:currentColor}
.people:after{left:4px;bottom:3px;width:12px;height:6px;border-radius:7px 7px 4px 4px;background:currentColor}
.checkin:before{left:5px;top:3px;width:9px;height:11px;border:2px solid currentColor;border-radius:3px;transform:rotate(-5deg)}
.mate:before{left:4px;top:9px;width:12px;border-top:3px solid currentColor}
.mate:after{left:9px;top:4px;height:12px;border-left:3px solid currentColor}
.couple:before{left:5px;top:6px;width:10px;height:8px;border-radius:7px 7px 3px 3px;background:currentColor}
.board:before{left:4px;top:4px;width:12px;height:12px;border:2px solid currentColor;border-radius:3px}
.board:after{left:8px;top:8px;width:6px;border-top:2px solid currentColor;box-shadow:0 4px 0 currentColor}

.board-hint{position:absolute;z-index:6;left:50%;top:170px;width:max-content;max-width:78vw;transform:translateX(-50%);padding:10px 14px;border-radius:14px;background:rgba(23,32,30,.82);color:#fff;text-align:center}
.board-hint text{display:block}
.board-hint text:first-child{font-size:12px;font-weight:750}
.board-hint text:last-child{margin-top:2px;color:rgba(255,255,255,.68);font-size:9px}

.side-tools{position:absolute;z-index:7;right:14px;bottom:220px;display:grid;gap:8px}
.side-tools>view{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.94);box-shadow:0 6px 16px rgba(0,0,0,.08)}
.plus,.minus{position:relative;width:18px;border-top:2px solid var(--color-text)}
.plus:after{content:'';position:absolute;left:8px;top:-10px;height:18px;border-left:2px solid var(--color-text)}
.locate-icon{width:16px;height:16px;border:3px solid var(--color-text);border-radius:50%;position:relative}
.locate-icon:after{content:'';position:absolute;left:5px;top:5px;width:6px;height:6px;border-radius:50%;background:#286c5c}

/* ===== 选中用户卡片：增强版 ===== */
.selected-card{position:absolute;z-index:8;left:16px;right:16px;bottom:calc(24px + env(safe-area-inset-bottom));padding:14px;border-radius:22px;display:flex;align-items:center;gap:14px;background:rgba(255,255,255,.97);box-shadow:0 18px 42px rgba(0,0,0,.12);animation:mq-focus-enter var(--motion-emphasized) var(--ease-out)}
.selected-avatar{width:56px;height:56px;flex:0 0 56px;border-radius:50%;display:flex;align-items:center;justify-content:center;position:relative;box-shadow:0 5px 14px rgba(0,0,0,.12)}
.avatar-initial{color:#fff;font-size:22px;font-weight:700}
.online-dot{position:absolute;right:2px;bottom:2px;width:12px;height:12px;border-radius:50%;background:#22c55e;border:2px solid #fff}
.selected-copy{flex:1;min-width:0}
.name-row{display:flex;align-items:center;gap:8px}
.name{font-size:16px;font-weight:700;color:var(--color-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.user-tag{flex-shrink:0;padding:2px 7px;border-radius:5px;background:#e0f2ec;color:#286c5c;font-size:10px;font-weight:600}
.subtitle{display:block;margin-top:5px;color:#74807c;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.action-col{display:flex;flex-direction:column;gap:6px;flex-shrink:0}
.action-btn{height:34px;padding:0 12px;border-radius:11px;display:flex;align-items:center;justify-content:center;gap:5px;font-size:11px;font-weight:600}
.action-btn.primary{background:#286c5c;color:#fff}
.action-btn.ghost{background:#f3f8f5;color:#286c5c;border:1px solid #dcebe4}
.wave-icon{width:13px;height:9px;position:relative}
.wave-icon:before,.wave-icon:after{content:'';position:absolute;border:1.5px solid currentColor;border-radius:50%;border-right:0;border-bottom:0}
.wave-icon:before{left:0;top:0;width:6px;height:6px;transform:rotate(-45deg)}
.wave-icon:after{left:5px;top:0;width:6px;height:6px;transform:rotate(-45deg)}
.plus-small{width:10px;height:10px;position:relative}
.plus-small:before,.plus-small:after{content:'';position:absolute;background:currentColor;border-radius:1px}
.plus-small:before{left:0;top:4px;width:10px;height:2px}
.plus-small:after{left:4px;top:0;width:2px;height:10px}

/* ===== 附近的人：横向滑动卡片列表 ===== */
.nearby-list{position:absolute;z-index:8;left:0;right:0;bottom:calc(20px + env(safe-area-inset-bottom));padding:0 0 4px;background:transparent}
.list-header{display:flex;align-items:baseline;justify-content:space-between;padding:0 18px 8px}
.list-title{color:var(--color-text);font-size:13px;font-weight:700}
.list-hint{color:#9ca8a3;font-size:10px}
.nearby-scroll{width:100%}
.nearby-track{display:inline-flex;gap:10px;padding:4px 16px 10px}
.nearby-card{width:140px;flex-shrink:0;padding:12px 12px 10px;border-radius:16px;background:rgba(255,255,255,.96);box-shadow:0 8px 20px rgba(0,0,0,.08);display:flex;flex-direction:column;gap:10px}
.nearby-card.first{box-shadow:0 10px 24px rgba(40,108,92,.16),0 4px 8px rgba(0,0,0,.04)}
.card-avatar{width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;position:relative;box-shadow:0 4px 10px rgba(0,0,0,.08)}
.online-pulse{position:absolute;right:0;bottom:0;width:11px;height:11px;border-radius:50%;background:#22c55e;border:2px solid #fff}
.card-info{display:flex;flex-direction:column;gap:5px;min-width:0}
.card-name{font-size:13px;font-weight:700;color:var(--color-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.card-tag{align-self:flex-start;padding:2px 6px;border-radius:4px;background:#e0f2ec;color:#286c5c;font-size:9px;font-weight:600;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.card-foot{display:flex;align-items:center;gap:4px;margin-top:2px}
.distance-dot{width:4px;height:4px;border-radius:50%;background:#286c5c;flex-shrink:0}
.card-distance{font-size:10px;color:#68736f;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nearby-end{width:80px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:rgba(255,255,255,.6);border:1px dashed rgba(40,108,92,.25)}
.end-icon{width:24px;height:24px;border-radius:50%;border:2px solid #286c5c;display:flex;align-items:center;justify-content:center;position:relative}
.end-icon:before,.end-icon:after{content:'';position:absolute;background:#286c5c;border-radius:1px}
.end-icon:before{left:6px;top:4px;width:8px;height:2px}
.end-icon:after{left:9px;top:1px;width:2px;height:8px}
.end-text{font-size:10px;color:#286c5c;font-weight:600}

/* ===== 其他场景保留原 bottom-dock ===== */
.bottom-dock{position:absolute;z-index:8;left:18px;right:18px;bottom:calc(20px + env(safe-area-inset-bottom));height:68px;padding:7px;border-radius:24px;display:grid;grid-template-columns:64px 1fr 64px;align-items:center;gap:7px;background:rgba(255,255,255,.93);box-shadow:0 18px 42px rgba(0,0,0,.1);animation:mq-sheet-enter var(--motion-emphasized) var(--ease-out)}
.dock-action,.primary{height:54px;border-radius:18px;display:flex;align-items:center;justify-content:center}
.dock-action{flex-direction:column;gap:3px;color:#6b7773;font-size:9px}
.primary{gap:9px;background:var(--color-text);color:#fff;font-size:13px;font-weight:800}
.board .primary{background:#f45f58}
.search-icon{width:15px;height:15px;border:2px solid currentColor;border-radius:50%;position:relative}
.search-icon:after{content:'';position:absolute;right:-5px;bottom:-3px;width:7px;border-top:2px solid currentColor;transform:rotate(45deg)}
.layers-icon{width:19px;height:12px;border:2px solid currentColor;border-radius:4px;transform:skewY(-14deg);box-shadow:0 5px 0 -1px #fff,0 7px 0 currentColor}
.radar-icon{width:19px;height:19px;border:2px solid var(--color-primary);border-radius:50%;position:relative}
.radar-icon:after{content:'';position:absolute;left:6px;top:6px;width:7px;height:7px;border-radius:50%;background:var(--color-primary)}
.add-icon{width:18px;height:18px;position:relative}
.add-icon:before,.add-icon:after{content:'';position:absolute;background:#fff;border-radius:2px}
.add-icon:before{left:0;top:8px;width:18px;height:2px}
.add-icon:after{left:8px;top:0;width:2px;height:18px}

.selected-card{animation:mq-focus-enter var(--motion-emphasized) var(--ease-out)}
@media (prefers-reduced-motion:reduce){.selected-card,.bottom-dock{animation:none}}
</style>

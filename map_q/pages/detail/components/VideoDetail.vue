<template>
  <view class="video-experience" :style="{ paddingTop: safeTop + 'px', paddingBottom: safeBottom + 'px' }">
    <view class="video-stage" :class="{ compact: drawer }" @touchstart="touchStart" @touchend="touchEnd" @touchcancel="touchCancel">
      <image v-if="current.cover && !coverFailed" class="video-backdrop" :src="current.cover" mode="aspectFill" @error="coverFailed = true" />
      <view v-if="current.cover && !coverFailed" class="backdrop-tint" />
      <video v-if="current.videoUrl" :key="current.id + ':' + playbackGeneration + ':' + retryVersion" id="feed-video" class="feed-player" :style="playerStyle" :src="current.videoUrl" :poster="coverFailed ? '' : current.cover" :initial-time="time" :controls="false" :show-center-play-btn="false" :show-fullscreen-btn="false" :autoplay="true" :object-fit="drawer ? 'contain' : fit" :loop="true" :enable-play-gesture="false" :vslide-gesture="false" :show-progress="false" @play="playbackHandlers.play" @pause="playbackHandlers.pause" @waiting="playbackHandlers.waiting" @timeupdate="playbackHandlers.time" @loadedmetadata="playbackHandlers.metadata" @error="playbackHandlers.error" @tap="togglePlay" />
      <image v-else-if="current.cover && !coverFailed" class="feed-player" :src="current.cover" mode="aspectFit" @error="coverFailed = true" />
      <view v-if="!drawer" class="video-shade" />
      <view class="video-gesture-surface" @touchstart.stop="touchStart" @touchmove.stop.prevent="touchMove" @touchend.stop="touchEnd" @touchcancel.stop="touchCancel" @tap.stop="togglePlay" />
      <view class="video-top">
        <button class="glass-control" aria-label="返回" @tap.stop="back"><image class="nav-icon" src="/static/video-ui/back.svg" /></button>
        <view class="feed-heading"><text>推荐</text><view class="feed-heading-line" /></view>
      </view>
      <view v-if="!current.videoUrl || playError" class="play-message" :class="{ 'empty-media': !current.videoUrl }"><image class="empty-film" src="/static/video-ui/film.svg" />
        <text class="empty-title">{{ playError ? '视频暂时无法播放' : '暂无视频画面' }}</text><text class="empty-copy">{{ playError ? '可以重试，或继续探索下一条' : '上滑继续浏览，地点与评论仍可查看' }}</text>
        <button v-if="current.videoUrl" @tap.stop="retryPlayback">重新播放</button>
        <button v-if="!drawer" @tap.stop="move(1)">继续探索 <text>↑</text></button>
      </view>
      <button v-else-if="!playing && !buffering" class="center-play" aria-label="播放视频" @tap.stop="togglePlay"><image class="pause-icon" src="/static/video-ui/play.svg" /></button>
      <text v-if="buffering && current.videoUrl && !playError" class="buffer-label">正在加载…</text>
      <view v-if="!drawer" class="video-rail">
        <button class="rail-action" aria-label="点赞" @tap.stop="toggle('liked')"><image class="rail-icon" :src="state.liked ? '/static/video-ui/heart-active.svg' : '/static/video-ui/heart.svg'" /><text class="rail-label">{{ countLabel(likes) }}</text></button>
        <button class="rail-action" aria-label="评论" @tap.stop="openDrawer('comments')"><image class="rail-icon" src="/static/video-ui/comment.svg" /><text class="rail-label">{{ state.comments.length || '评论' }}</text></button>
        <button class="rail-action" aria-label="收藏" @tap.stop="toggle('collected')"><image class="rail-icon bookmark-icon" :src="state.collected ? '/static/video-ui/bookmark-active.svg' : '/static/video-ui/bookmark.svg'" /><text class="rail-label">{{ state.collected ? '已收藏' : '收藏' }}</text></button>
        <button class="rail-action" aria-label="位置" @tap.stop="openDrawer('map')"><image class="rail-icon pin-icon" src="/static/video-ui/pin.svg" /><text class="rail-label">位置</text></button>
        <button class="rail-action" aria-label="分享" @tap.stop="shareActiveContent"><image class="rail-icon" src="/static/video-ui/share.svg" /><text class="rail-label">分享</text></button>
        <button class="rail-action creator-action" :aria-label="state.followed ? '取消关注' : '关注作者'" @tap.stop="toggle('followed')"><image class="rail-avatar" :src="avatarSource" /><view class="follow-dot" :class="{ followed: state.followed }">{{ state.followed ? '✓' : '+' }}</view></button>
      </view>
      <view v-if="!drawer" class="video-caption"><text class="video-author">@{{ current.author?.name || '创作者' }}</text><text class="video-copy">{{ current.title }}</text><text v-if="feedError" class="feed-status" @tap.stop="loadMore">加载失败 · 点击重试</text><text v-else-if="loading" class="feed-status">正在加载视频…</text><text v-else-if="index === videos.length - 1" class="feed-status" @tap.stop="loadMore">{{ hasMore ? '点击加载更多视频' : '已到最后一条 · 下滑回看' }}</text></view>
      <slider v-if="current.videoUrl && !playError" class="video-progress" :value="time" :max="Math.max(duration, 1)" :block-size="6" activeColor="#ffffff" backgroundColor="rgba(255,255,255,.3)" @change="seek" @touchstart.stop @touchend.stop />
    </view>
    <view v-if="drawer" class="video-drawer">
      <view class="drawer-handle" /><view class="drawer-toolbar"><view class="drawer-tabs"><button :class="{ active: drawer === 'comments' }" @tap="openDrawer('comments')">评论 {{ state.comments.length }}</button><button :class="{ active: drawer === 'map' }" @tap="openDrawer('map')">地点</button></view><button class="drawer-close" aria-label="关闭抽屉" @tap="closeDrawer"><image class="close-icon" src="/static/video-ui/close.svg" /></button></view>
      <template v-if="drawer === 'map'">
        <view v-if="current.location" class="map-canvas">
          <map :key="mapRevision" id="video-location-map" class="video-map" :latitude="current.location.latitude" :longitude="current.location.longitude" :markers="markers" :scale="16" :subkey="mapKey" :enable-scroll="true" :enable-zoom="true" @error="mapError = true" />
          <view class="location-card"><view class="location-badge"><image src="/static/video-ui/pin-dark.svg" /></view><view class="location-copy"><text class="location-title">{{ current.location.name || '视频拍摄地点' }}</text><text class="location-address">{{ current.location.address || '作者标注的位置' }}</text></view><button class="recenter-button" aria-label="回到该地点" @tap="recenter"><image src="/static/video-ui/locate.svg" /></button></view>
        </view>
        <view v-else class="drawer-empty"><text>作者暂未标注位置</text><text v-if="current.address">{{ current.address }}</text></view>
        <text v-if="mapError" class="map-warning">地图暂时无法加载，请检查网络或地图配置</text>
      </template>
      <template v-else>
        <scroll-view class="video-comments" scroll-y><view v-if="!state.comments.length" class="drawer-empty"><text>还没有评论</text><text>分享你看到的风景</text></view><view v-for="comment in state.comments" :key="comment.id" class="video-comment"><image :src="comment.author?.avatar || '/static/logo.png'" /><view class="comment-body"><text class="comment-author">{{ comment.author?.name || '我' }}</text><text>{{ comment.content }}</text><view class="comment-tools"><button @tap="replyTo = comment">回复</button><button @tap="likeComment(comment.id)">{{ comment.liked ? '♥' : '♡' }} {{ comment.likeCount || '' }}</button></view></view></view></scroll-view>
        <view class="comment-compose" :style="{ marginBottom: keyboardHeight + 'px' }"><button v-if="replyTo" class="cancel-reply" @tap="replyTo = null">×</button><input v-model="draft" :placeholder="replyTo ? '回复 ' + (replyTo.author?.name || '我') : '友善交流，分享你的看法'" :adjust-position="false" :maxlength="500" confirm-type="send" @confirm="sendComment" @keyboardheightchange="keyboardHeight = Number($event.detail.height || 0)" @blur="keyboardHeight = 0" /><button :disabled="!draft.trim()" @tap="sendComment">发送</button></view>
      </template>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, getCurrentInstance } from 'vue'
import { onHide, onShow, onBackPress } from '@dcloudio/uni-app'
import { contentInteractionApi } from '../../../utils/api/contentInteraction.js'
import { shareActiveContent } from '../../../utils/contentShare.js'
import { createVideoFeed } from '../../../utils/videoFeed.js'
import { getQqMapKey } from '../../../utils/mapKey.js'
const props = defineProps({ detail: { type: Object, required: true } })
const emit = defineEmits(['active-change'])
const feed = createVideoFeed()
const videos = ref([feed.seed(props.detail)]), index = ref(0)
const current = computed(() => videos.value[index.value])
const state = ref(contentInteractionApi.getState(current.value.id))
const drawer = ref(''), playing = ref(false), playError = ref(false), retryVersion = ref(0)
const time = ref(0), duration = ref(1), fit = ref('cover')
const loading = ref(false), hasMore = ref(true), feedError = ref(false)
const draft = ref(''), replyTo = ref(null), keyboardHeight = ref(0), mapError = ref(false)
const mapRevision = ref(0), playbackGeneration = ref(0)
const componentScope = getCurrentInstance()?.proxy
const buffering = ref(true), coverFailed = ref(false), viewportWidth = ref(390), viewportHeight = ref(844), aspect = ref(16 / 9)
const playerStyle = computed(() => {
  if (!drawer.value && fit.value === 'cover') return {}
  const stageHeight = (viewportHeight.value - safeTop.value - safeBottom.value) * (drawer.value ? 0.4 : 1)
  const width = Math.min(viewportWidth.value, stageHeight * aspect.value)
  const height = width / aspect.value
  return { width: width + 'px', height: height + 'px', left: (viewportWidth.value - width) / 2 + 'px', top: (stageHeight - height) / 2 + 'px' }
})
const safeTop = ref(0), safeBottom = ref(0), mapKey = getQqMapKey()
const avatarSource = computed(() => { const avatar = current.value.author?.avatar; return avatar && !/static\/logo\.png/i.test(avatar) ? avatar : '/static/video-ui/user.svg' })
function countLabel(value) { return value >= 10000 ? (value / 10000).toFixed(1) + '万' : value >= 1000 ? (value / 1000).toFixed(1) + 'k' : String(value) }
const likes = computed(() => Math.max(0, Number(current.value.interactionStats?.likes || 0) + (state.value.liked ? 1 : 0)))
const markers = computed(() => current.value.location ? [{ id: 1, ...current.value.location, iconPath: '/static/video-ui/map-pin.png', width: 32, height: 44, callout: { content: current.value.location.name || '视频标注地点', display: 'ALWAYS', padding: 8, borderRadius: 10 } }] : [])
let start = null, suppressTapUntil = 0, alive = true, visible = true, navigationEpoch = 0, lastSaved = -1, resume = false, switching = false, pendingLoad = null
const context = () => uni.createVideoContext('feed-video', componentScope)
function save() { if (!current.value.id) return; const all = uni.getStorageSync('VIDEO_PROGRESS_V1') || {}; all[current.value.id] = { currentTime: time.value, updatedAt: Date.now() }; uni.setStorageSync('VIDEO_PROGRESS_V1', all) }
function activate() {
  playbackGeneration.value++
  draft.value = ''; replyTo.value = null
  state.value = contentInteractionApi.getState(current.value.id)
  duration.value = Number(current.value.duration || 0)
  const saved = Number((uni.getStorageSync('VIDEO_PROGRESS_V1') || {})[current.value.id]?.currentTime || 0)
  time.value = Number.isFinite(saved) && saved >= 0 && (!duration.value || saved < duration.value) ? saved : 0
  fit.value = 'contain'; aspect.value = 16 / 9
  playing.value = false; playError.value = false; buffering.value = Boolean(current.value.videoUrl); coverFailed.value = false; lastSaved = -1
  uni.setStorageSync('CONTENT_DETAIL_ACTIVE_V1', current.value)
  emit('active-change', current.value)
}
function loadMore() {
  if (pendingLoad) return pendingLoad
  if (!hasMore.value || !alive) return Promise.resolve()
  loading.value = true; feedError.value = false
  pendingLoad = (async () => {
    try {
      let rounds = 0
      do {
        const result = await feed.next()
        if (!alive) return
        videos.value.push(...result.list); hasMore.value = result.hasMore
        if (result.list.length) break
      } while (hasMore.value && ++rounds < 3)
    } catch { if (alive) feedError.value = true }
    finally { loading.value = false; pendingLoad = null }
  })()
  return pendingLoad
}
async function move(direction) {
  if (drawer.value || switching || !visible || !alive) return
  switching = true
  const epoch = navigationEpoch
  try {
    const next = index.value + direction
    if (next < 0) { uni.showToast({ title: '已经是第一条视频', icon: 'none' }); return }
    if (next >= videos.value.length) await loadMore()
    if (!alive || !visible || epoch !== navigationEpoch || drawer.value) return
    if (next >= videos.value.length) { uni.showToast({ title: feedError.value ? '加载失败，请点击重试' : hasMore.value ? '暂未找到下一条，请继续上滑' : '已到最后一条，下滑回看', icon: 'none' }); return }
    save(); context().pause(); index.value = next; activate()
    await nextTick()
    if (alive && index.value >= videos.value.length - 2) loadMore()
  } finally { switching = false }
}
const playbackHandlers = computed(() => {
  const id = current.value.id, version = retryVersion.value, generation = playbackGeneration.value
  const accept = () => alive && visible && current.value.id === id && retryVersion.value === version && playbackGeneration.value === generation
  return {
    play: () => { if (!accept()) return; playing.value = true; playError.value = false; buffering.value = false },
    pause: () => { if (accept()) playing.value = false },
    waiting: () => { if (accept()) buffering.value = true },
    time: event => { if (!accept()) return; buffering.value = false; timeUpdate(event) },
    metadata: event => { if (!accept()) return; buffering.value = false; metadata(event) },
    error: () => { if (!accept()) return; playError.value = true; playing.value = false; buffering.value = false }
  }
})
function touchPoint(point) {
  if (!point) return null
  const x = point.clientX ?? point.pageX ?? point.x
  const y = point.clientY ?? point.pageY ?? point.y
  return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null
}
function touchStart(e) { start = e.touches?.length === 1 ? touchPoint(e.touches[0]) : null }
function touchMove(e) { if (e.touches?.length !== 1) touchCancel() }
function touchCancel() { start = null }
function touchEnd(e) {
  const origin = start, point = touchPoint(e.changedTouches?.[0])
  start = null
  if (drawer.value || !origin || !point) return
  const y = point.y - origin.y, x = point.x - origin.x
  if (Math.abs(y) > 60 && Math.abs(y) > Math.abs(x) * 1.3) {
    suppressTapUntil = Date.now() + 400
    return move(y < 0 ? 1 : -1)
  }
}
function retryPlayback() { playError.value = false; buffering.value = true; retryVersion.value++ }
function togglePlay() { if (!current.value.videoUrl || Date.now() < suppressTapUntil) return; playing.value ? context().pause() : context().play() }
function timeUpdate(e) { time.value = Number(e.detail.currentTime || 0); duration.value = Number(e.detail.duration || duration.value); const bucket = Math.floor(time.value / 5); if (bucket !== lastSaved) { save(); lastSaved = bucket } }
function metadata(e) {
  duration.value = Number(e.detail.duration || duration.value)
  if (e.detail.width > 0 && e.detail.height > 0) aspect.value = e.detail.width / e.detail.height
  fit.value = aspect.value > 1 ? 'contain' : 'cover'
  if (duration.value > 0 && time.value >= duration.value) { time.value = 0; context().seek(0); save() }
}
function seek(e) { time.value = e.detail.value; context().seek(time.value); save() }
function toggle(field) { state.value = contentInteractionApi.toggle(current.value.id, field) }
function likeComment(id) { state.value = contentInteractionApi.toggleCommentLike(current.value.id, id) }
function sendComment() { if (!draft.value.trim()) return; state.value = contentInteractionApi.addComment(current.value.id, replyTo.value ? `回复 ${replyTo.value.author?.name || '我'}：${draft.value}` : draft.value, replyTo.value?.id || ''); draft.value = ''; replyTo.value = null; uni.hideKeyboard() }
function openDrawer(kind) { touchCancel(); drawer.value = kind; keyboardHeight.value = 0; mapError.value = false; uni.hideKeyboard() }
function closeDrawer() { drawer.value = ''; keyboardHeight.value = 0; uni.hideKeyboard() }
function recenter() {
  if (!current.value.location) return
  // Recreate only the map at its declared center; supported in DevTools and on device.
  mapError.value = false
  mapRevision.value += 1
}
function resizeVideo(event) { viewportWidth.value = event.size?.windowWidth || viewportWidth.value; viewportHeight.value = event.size?.windowHeight || viewportHeight.value }
function back() { if (drawer.value) return closeDrawer(); visible = false; navigationEpoch++; save(); context().pause(); uni.navigateBack({ fail: () => uni.switchTab({ url: '/pages/index/index' }) }) }
onBackPress(() => { if (drawer.value) { closeDrawer(); return true } return false })
onHide(() => { resume = playing.value; visible = false; navigationEpoch++; save(); context().pause() })
onShow(() => { visible = true; if (resume) { nextTick(() => context().play()); resume = false } })
onMounted(() => { uni.setNavigationBarColor?.({ frontColor: '#ffffff', backgroundColor: '#101313' }); const info = uni.getWindowInfo ? uni.getWindowInfo() : uni.getSystemInfoSync(); viewportWidth.value = info.windowWidth || 390; viewportHeight.value = info.windowHeight || 844; safeTop.value = info.statusBarHeight || 0; safeBottom.value = info.safeAreaInsets?.bottom || 0; activate(); loadMore(); uni.onWindowResize?.(resizeVideo) })
onBeforeUnmount(() => { uni.offWindowResize?.(resizeVideo); uni.setNavigationBarColor?.({ frontColor: '#000000', backgroundColor: '#ffffff' }); alive = false; navigationEpoch++; save(); context().pause() })
</script>

<style scoped>
.video-experience { position:fixed; inset:0; display:flex; flex-direction:column; box-sizing:border-box; overflow:hidden; color:#fff; background:#101313; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
.video-experience button { margin:0; padding:0; border:0; line-height:1.3; font-size:13px; border-radius:0; }
.video-experience button:after { border:0; }
.video-stage { position:relative; flex:1; min-height:0; overflow:hidden; background:#171c1d; }
.video-stage.compact { flex:0 0 40%; background:#101313; }
.feed-player { position:absolute; inset:0; width:100%; height:100%; }
.video-gesture-surface { position:absolute; inset:0; z-index:1; touch-action:none; }
.video-top,.video-rail,.video-caption,.video-progress,.center-play,.play-message { z-index:2; }
.video-shade { position:absolute; inset:0; pointer-events:none; background:linear-gradient(180deg,rgba(0,0,0,.2),transparent 22%,transparent 55%,rgba(0,0,0,.62)); }
.video-top { position:absolute; left:14px; right:14px; top:8px; height:44px; display:flex; align-items:center; pointer-events:none; }
.video-top .glass-control { pointer-events:auto; }
.glass-control { width:44px; height:44px; display:flex; align-items:center; justify-content:center; background:transparent; }
.nav-icon { width:23px; height:23px; }
.feed-heading { position:absolute; left:calc(50% - 24px); top:10px; display:flex; align-items:center; flex-direction:column; gap:8px; font-size:14px; font-weight:600; text-shadow:0 1px 5px rgba(0,0,0,.24); }
.feed-heading-line { width:18px; height:2px; border-radius:2px; background:rgba(255,255,255,.9); }
.center-play { position:absolute; top:calc(50% - 24px); left:calc(50% - 24px); width:48px; height:48px; background:transparent; }
.pause-icon { width:42px; height:42px; opacity:.8; }
.video-rail { position:absolute; right:12px; top:82px; bottom:54px; display:flex; flex-direction:column; justify-content:flex-end; gap:12px; width:44px; }
.rail-action { width:44px; min-height:44px; display:flex; align-items:center; flex-direction:column; justify-content:center; gap:5px; background:transparent; color:#fff; text-shadow:0 1px 4px rgba(0,0,0,.4); }
.rail-action:active { opacity:.7; }
.rail-icon { width:26px; height:26px; }
.bookmark-icon { width:25px; height:27px; }
.pin-icon { width:25px; height:27px; }
.rail-label { font-size:10px; font-weight:400; line-height:12px; }
.creator-action { position:relative; flex-shrink:0; min-height:46px; padding-bottom:6px!important; }
.rail-avatar { width:34px; height:34px; border-radius:50%; border:1.5px solid #fff; background:#617169; box-sizing:border-box; }
.follow-dot { position:absolute; left:calc(50% - 8px); bottom:0; width:16px; height:16px; border-radius:50%; background:#fff; color:#c977bc; font-size:16px; line-height:15px; font-weight:700; text-shadow:none; }
.follow-dot.followed { background:#d8eee3; color:#315c47; font-size:11px; }
.video-caption { position:absolute; left:18px; right:78px; bottom:38px; display:flex; flex-direction:column; gap:7px; text-shadow:0 1px 5px rgba(0,0,0,.3); }
.video-author { font-size:13px; font-weight:600; }
.video-copy { font-size:12px; line-height:1.6; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
.feed-status { font-size:10px; color:#cdd5d1; padding:4px 0; }
.video-progress { position:absolute; bottom:4px; left:13px; right:13px; margin:0; opacity:.75; }
.play-message { position:absolute; top:43%; left:24px; right:70px; transform:translateY(-50%); display:flex; flex-direction:column; align-items:center; gap:8px; text-align:center; }
.empty-film { width:40px; height:40px; margin-bottom:8px; opacity:.7; }
.empty-title { font-size:14px; font-weight:500; color:#e1e7e4; }
.empty-copy { font-size:11px; line-height:1.6; color:#9ca9a3; }
.play-message button { display:flex; gap:10px; align-items:center; padding:11px 18px; margin-top:12px; border-radius:24px; background:rgba(255,255,255,.08); color:#e6eee9; backdrop-filter:blur(16px); font-size:11px; }
.video-drawer { position:relative; flex:0 0 60%; min-height:0; display:flex; flex-direction:column; background:#f6f8f7; color:#263a30; border-radius:26px 26px 0 0; overflow:hidden; box-sizing:border-box; }
.drawer-handle { width:28px; height:3px; margin:9px auto 0; border-radius:3px; background:#cdd5d1; flex-shrink:0; }
.drawer-toolbar { height:48px; display:flex; align-items:center; justify-content:space-between; padding:0 14px 0 20px; background:rgba(249,251,250,.9); backdrop-filter:blur(20px); flex-shrink:0; }
.drawer-tabs { display:flex; gap:22px; height:100%; }
.drawer-tabs button { position:relative; display:flex; align-items:center; justify-content:center; padding:0 2px; min-height:44px; background:transparent; color:#87918b; font-size:13px; }
.drawer-tabs button.active { color:#253b30; font-weight:600; }
.drawer-tabs button.active:before { content:""; position:absolute; height:2px; border-radius:2px; width:16px; left:calc(50% - 8px); bottom:2px; background:#5b7c68; }
.drawer-close { display:flex; align-items:center; justify-content:center; width:40px; height:40px; background:transparent; }
.close-icon { width:18px; height:18px; }
.map-canvas { position:relative; flex:1; min-height:0; overflow:hidden; background:#e7eeea; }
.video-map { position:absolute; inset:0; width:100%; height:100%; }
.location-card { position:absolute; z-index:2; left:12px; right:12px; bottom:34px; display:flex; align-items:center; gap:10px; padding:12px; min-height:44px; border-radius:20px; background:rgba(255,255,255,.9); backdrop-filter:blur(24px); box-shadow:0 8px 24px rgba(37,59,46,.12); }
.location-badge { display:flex; align-items:center; justify-content:center; width:36px; height:40px; flex-shrink:0; border-radius:12px; background:#e8f0eb; }
.location-badge image { width:22px; height:22px; }
.location-copy { flex:1; min-width:0; display:flex; flex-direction:column; gap:5px; }
.location-title { font-size:13px; font-weight:600; line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.location-address { font-size:11px; line-height:1.5; color:#708075; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.recenter-button { display:flex; align-items:center; justify-content:center; width:44px; height:44px; background:#eef3ef; border-radius:50%!important; flex-shrink:0; }
.recenter-button image { width:21px; height:21px; }
.drawer-empty { display:flex; flex:1; min-height:180px; align-items:center; justify-content:center; flex-direction:column; gap:8px; color:#607268; font-size:13px; }
.drawer-empty text+text { color:#849188; font-size:11px; }
.map-warning { padding:8px 16px; font-size:11px; color:#8b4535; }
.video-comments { flex:1; min-height:0; height:0; }
.video-comment { display:flex; gap:10px; padding:14px 18px; }
.video-comment>image { width:30px; height:30px; border-radius:50%; flex-shrink:0; }
.comment-body { flex:1; display:flex; flex-direction:column; gap:6px; font-size:13px; line-height:1.5; }
.comment-author { font-size:11px; color:#7c8b82; }
.comment-tools { display:flex; gap:16px; }
.comment-tools button { background:transparent; color:#718378; font-size:11px; }
.comment-compose { display:flex; align-items:center; padding:10px 14px; gap:10px; background:rgba(255,255,255,.85); flex-shrink:0; }
.comment-compose input { flex:1; min-width:0; height:38px; background:#edf1ee; border-radius:22px; padding:0 14px; font-size:12px; }
.comment-compose button { padding:10px 14px; background:#3b604b; color:#fff; border-radius:22px; font-size:12px; }
.comment-compose button[disabled] { opacity:.4; }
.compact .play-message { top:55%; left:24px; right:24px; gap:4px; }
.compact .empty-film { width:28px; height:28px; margin:0; }
.compact .empty-title { font-size:12px; }
.compact .empty-copy { display:none; }
.compact .play-message button { margin-top:6px; padding:8px 14px; }
.compact .video-top { top:4px; }
@media (max-height:680px) { .video-rail { top:68px; bottom:54px; gap:8px; } .rail-icon { width:25px; height:25px; } .rail-action { min-height:40px; } }
.empty-media { top:47%; gap:6px; }
.empty-media .empty-film { width:30px; height:30px; opacity:.45; margin-bottom:5px; }
.empty-media .empty-title { font-size:12px; font-weight:400; color:#bdc9c2; }
.empty-media .empty-copy { max-width:200px; font-size:10px; color:#91a198; }
.empty-media button { margin-top:5px; padding:8px 12px; background:transparent; backdrop-filter:none; color:#a8bdb1; }
.compact .empty-media { top:55%; }
.video-backdrop { position:absolute; inset:-8%; width:116%; height:116%; filter:blur(28px); opacity:.65; pointer-events:none; }
.backdrop-tint { position:absolute; inset:0; background:rgba(8,16,12,.35); pointer-events:none; }
.buffer-label { position:absolute; left:0; right:0; top:58%; text-align:center; font-size:11px; color:#fff; text-shadow:0 1px 6px #000; pointer-events:none; }
/* #ifdef H5 */
.video-stage { overflow:clip; }
/* #endif */
</style>

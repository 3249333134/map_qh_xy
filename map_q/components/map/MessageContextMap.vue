<template>
  <view class="chat-map-context">
    <view class="chat-map-window">
      <map v-if="context.location" :key="mapIdentity" class="chat-context-map" :latitude="context.location.latitude" :longitude="context.location.longitude" :scale="context.radius ? 12 : 14" :markers="markers" :circles="circles" :include-points="[context.location]" :include-padding="[topInset, 28, 36, 28]" :subkey="mapKey" :enable-scroll="true" :enable-zoom="true" @markertap="$emit('open')" @error="mapFailed = true" />
      <view v-else-if="context.kind === 'direct'" class="chat-pair" :style="{ paddingTop: topInset + 'px' }">
        <view class="chat-person"><image src="/static/video-ui/user.svg" /><text>我</text></view>
        <view class="chat-pair-link"><view /><view /><view /></view>
        <view class="chat-person"><image src="/static/video-ui/user.svg" /><text>{{ context.title }}</text></view>
      </view>
      <view v-else class="chat-map-empty" :style="{ paddingTop: topInset + 'px' }"><image src="/static/video-ui/pin-dark.svg" /><text>{{ context.title }}</text></view>
      <view class="chat-map-label" @tap="$emit('open')">
        <text v-if="context.location" class="chat-map-name">{{ context.title }}</text>
        <text class="chat-map-description">{{ mapFailed ? '地图暂时无法加载' : context.subtitle }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { getQqMapKey } from '../../utils/mapKey.js'
const props = defineProps({ context: { type: Object, required: true }, topInset: { type: Number, default: 100 }, focusRevision: { type: Number, default: 0 } })
defineEmits(['open'])
const mapKey = getQqMapKey(), mapFailed = ref(false)
const mapIdentity = computed(() => `${props.context.channelId || ''}:${props.context.location?.latitude}:${props.context.location?.longitude}:${props.focusRevision}`)
watch(mapIdentity, () => { mapFailed.value = false })
const markers = computed(() => props.context.location ? [{ id: 1, ...props.context.location, iconPath: '/static/video-ui/map-pin.png', width: 24, height: 33 }] : [])
const circles = computed(() => props.context.location && props.context.radius ? [{ ...props.context.location, radius: props.context.radius, color: '#397D68AA', fillColor: '#5EB79E24', strokeWidth: 2 }] : [])
</script>

<style scoped>
.chat-map-context { position:absolute; top:0; left:0; right:0; height:23%; box-sizing:border-box; background:#eaf2ee; }
.chat-map-window { position:relative; height:100%; min-height:0; overflow:hidden; }
.chat-context-map { width:100%; height:100%; }
.chat-map-label { position:absolute; left:12px; bottom:6px; max-width:70%; display:flex; flex-direction:column; gap:2px; padding:5px 10px; border-radius:12px; background:rgba(255,255,255,.9); backdrop-filter:blur(16px); }
.chat-map-name { font-size:12px; font-weight:600; color:#285d4e; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
.chat-map-description { font-size:10px; color:#536c61; }
.chat-pair { display:flex; align-items:center; justify-content:center; gap:18px; padding-top:2px; }
.chat-person { display:flex; flex-direction:column; align-items:center; gap:2px; width:84px; }
.chat-person image { width:28px; height:28px; border-radius:50%; background:#537d6e; }
.chat-person text { font-size:11px; color:#285d4e; max-width:84px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.chat-pair-link { display:flex; gap:5px; }
.chat-pair-link view { width:4px; height:4px; border-radius:50%; background:#98b7a9; }
.chat-map-empty { display:flex; align-items:center; justify-content:center; gap:8px; padding-top:10px; font-size:13px; color:#416858; }
.chat-map-empty image { width:22px; height:22px; }
@media (orientation:landscape) { .chat-map-context { height:100%; right:64%; } }
</style>

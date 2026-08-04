<template>
  <view class="media-block">
    <view class="section-head">
      <view>
        <text class="section-title">图片或视频</text>
        <text class="section-hint">最多 9 张图片或 1 个视频，不能混合</text>
      </view>
      <text class="media-count">{{ activeTasks.length }}/{{ mediaLimit }}</text>
    </view>

    <view class="media-grid">
      <view v-for="task in activeTasks" :key="task.id" class="media-card">
        <image v-if="task.kind === 'image'" class="media-preview" :src="task.previewPath" mode="aspectFill" />
        <video v-else class="media-preview" :src="task.previewPath" :controls="false" />
        <view class="media-state" :class="task.status">
          <text>{{ statusText(task) }}</text>
          <view v-if="task.status === MEDIA_STATUS.UPLOADING" class="progress-track"><view :style="{ width: task.progress + '%' }"></view></view>
        </view>
        <view class="media-actions">
          <view v-if="canRetry(task)" class="media-action retry" @tap.stop="retry(task)">重试</view>
          <view class="media-action remove" @tap.stop="remove(task)">删除</view>
        </view>
      </view>
      <view v-if="canAddImage" class="add-card" role="button" aria-label="添加图片" @tap="chooseImages">
        <view class="image-glyph"><view></view></view><text>图片</text>
      </view>
      <view v-if="canAddVideo" class="add-card" role="button" aria-label="添加视频" @tap="chooseVideo">
        <view class="video-glyph"></view><text>视频</text>
      </view>
    </view>
    <text v-if="error" class="field-error" role="alert">{{ error }}</text>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { mediaUploadApi, MEDIA_STATUS } from '../../utils/api/mediaUpload.js'

const props = defineProps({
  modelValue: { type: Array, default: () => [] }
})
const emit = defineEmits(['update:modelValue'])
const error = ref('')
const activeTasks = computed(() => props.modelValue.filter(item => item.status !== MEDIA_STATUS.CANCELLED))
const hasVideo = computed(() => activeTasks.value.some(item => item.kind === 'video'))
const hasImage = computed(() => activeTasks.value.some(item => item.kind === 'image'))
const mediaLimit = computed(() => hasVideo.value ? 1 : 9)
const canAddImage = computed(() => !hasVideo.value && activeTasks.value.length < 9)
const canAddVideo = computed(() => activeTasks.value.length === 0)

function replaceTask(next) {
  emit('update:modelValue', props.modelValue.map(item => item.id === next.id ? next : item))
}
async function start(tasks) {
  error.value = ''
  try {
    mediaUploadApi.validateSelection(activeTasks.value, tasks)
    emit('update:modelValue', [...props.modelValue, ...tasks])
    for (const task of tasks) await mediaUploadApi.upload(task, replaceTask)
  } catch (cause) {
    error.value = cause.message || '媒体处理失败，请重试'
  }
}
function chooseImages() {
  uni.chooseImage({
    count: 9 - activeTasks.value.length,
    success: result => start(mediaUploadApi.createTasks(result.tempFilePaths || [], 'image')),
    fail: cause => {
      if (!String(cause?.errMsg || '').includes('cancel')) error.value = '无法选择图片，请检查相册权限'
    }
  })
}
function chooseVideo() {
  uni.chooseVideo({
    compressed: true,
    success: result => start(mediaUploadApi.createTasks([result.tempFilePath], 'video')),
    fail: cause => {
      if (!String(cause?.errMsg || '').includes('cancel')) error.value = '无法选择视频，请检查相册权限'
    }
  })
}
function canRetry(task) {
  return [MEDIA_STATUS.FAILED, MEDIA_STATUS.NEEDS_RESELECT].includes(task.status)
}
async function retry(task) {
  if (task.status === MEDIA_STATUS.NEEDS_RESELECT) {
    error.value = '该临时媒体已失效，请删除后重新选择'
    return
  }
  await mediaUploadApi.retry(task, replaceTask)
}
function remove(task) {
  replaceTask(mediaUploadApi.cancel(task))
}
function statusText(task) {
  return {
    queued: '等待上传',
    uploading: `上传中 ${task.progress}%`,
    succeeded: '上传完成',
    failed: task.error || '上传失败',
    needs_reselect: '需重新选择'
  }[task.status] || ''
}
</script>

<style scoped>
.media-block { padding: 16px; border: 1px solid #eef2f7; border-radius: 20px; background: #fff; box-shadow: 0 8px 24px rgba(15,23,42,.05); }
.section-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }.section-title,.section-hint { display: block; }.section-title { color: #0f172a; font-size: 16px; font-weight: 750; }.section-hint { margin-top: 4px; color: #64748b; font-size: 11px; }.media-count { color: #94a3b8; font-size: 12px; font-variant-numeric: tabular-nums; }
.media-grid { margin-top: 14px; display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 9px; }.media-card,.add-card { position: relative; aspect-ratio: 1; overflow: hidden; border-radius: 15px; }.media-card { background: #e2e8f0; }.media-preview { width: 100%; height: 100%; }.media-state { position: absolute; left: 6px; right: 6px; bottom: 50px; padding: 5px 6px; border-radius: 9px; color: #fff; background: rgba(15,23,42,.78); font-size: 9px; }.media-state.succeeded { color: #166534; background: rgba(240,253,244,.94); }.media-state.failed,.media-state.needs_reselect { color: #991b1b; background: rgba(254,242,242,.96); }.progress-track { height: 3px; margin-top: 4px; overflow: hidden; border-radius: 2px; background: rgba(255,255,255,.28); }.progress-track view { height: 100%; background: #fb923c; transition: width 150ms ease; }.media-actions { position: absolute; left: 5px; right: 5px; bottom: 4px; display: flex; justify-content: flex-end; gap: 5px; }.media-action { min-width: 44px; height: 44px; padding: 0 7px; display: flex; align-items: center; justify-content: center; border-radius: 11px; color: #fff; background: rgba(15,23,42,.84); font-size: 10px; box-sizing: border-box; }.media-action.retry { color: #9a3412; background: #fff7ed; }
.add-card { min-height: 96px; border: 1px dashed #cbd5e1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 7px; color: #64748b; background: var(--color-page); font-size: 11px; }.image-glyph { position: relative; width: 24px; height: 20px; border: 2px solid #64748b; border-radius: 5px; }.image-glyph::before { content: ''; position: absolute; left: 4px; top: 4px; width: 4px; height: 4px; border-radius: 50%; background: #fb923c; }.image-glyph view { position: absolute; left: 4px; right: 4px; bottom: 3px; height: 7px; border-left: 2px solid #64748b; border-top: 2px solid #64748b; transform: skew(-28deg); }.video-glyph { position: relative; width: 25px; height: 20px; border: 2px solid #64748b; border-radius: 5px; }.video-glyph::after { content: ''; position: absolute; right: 6px; top: 4px; border-left: 7px solid #fb923c; border-top: 5px solid transparent; border-bottom: 5px solid transparent; }.field-error { display: block; margin-top: 10px; color: #b91c1c; font-size: 12px; }
@media (prefers-reduced-motion: reduce) { .progress-track view { transition: none; } }
</style>

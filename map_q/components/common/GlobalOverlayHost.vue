<template>
  <!-- 将全局发布弹窗挂载到每个页面的根容器中 -->
  <PublishOverlay :show="visible" @close="closeHandler" />
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import PublishOverlay from '../PublishOverlay.vue'

const visible = ref(false)

const showHandler = () => { visible.value = true }
const closeHandler = () => {
  visible.value = false
  try {
    const app = getApp()
    if (app && app.globalData) app.globalData.showPublishOverlay = false
  } catch (e) {}
}
let pollTimer = null

onMounted(() => {
  try { uni.$on('showPublishOverlay', showHandler) } catch (e) {}
  // 轮询全局标记以感知自定义 TabBar（原生环境）写入的触发
  try {
    const app = getApp()
    pollTimer = setInterval(() => {
      const shouldShow = !!(app && app.globalData && app.globalData.showPublishOverlay)
      if (visible.value !== shouldShow) visible.value = shouldShow
    }, 100)
  } catch (e2) {}
})
onBeforeUnmount(() => {
  try { uni.$off('showPublishOverlay', showHandler) } catch (e) {}
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
})
</script>

<style scoped>
/* 由 PublishOverlay 自身控制定位与层级 */
</style>
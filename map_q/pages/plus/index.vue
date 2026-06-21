<template>
  <view class="plus-page">
    <!-- 页面内容隐藏，只用于触发弹窗 -->
  </view>
</template>

<script>
export default {
  name: 'PlusPage',
  onShow() {
    // 页面显示时立即触发全局弹出菜单
    console.log('Plus页面显示，触发弹出菜单')
    
    // 使用nextTick确保页面完全加载后再触发事件
    this.$nextTick(() => {
      uni.$emit('showPublishOverlay')
      
      // 延迟返回原来的 Tab（如果有记录），避免固定跳到首页
      setTimeout(() => {
        const app = getApp && getApp()
        const prev = app && app.globalData && app.globalData.prevTabPath
        // 如果有页面栈，优先返回上一页（navigateTo场景）
        uni.navigateBack({
          fail: () => {
            if (prev && typeof prev === 'string') {
              const target = prev.startsWith('/') ? prev : '/' + prev
              uni.switchTab({ url: target })
            }
            // 没有 prev 就不再强制跳首页，留在当前发布页也能看到弹窗
          }
        })
      }, 300)
    })
  }
}
</script>

<style scoped>
.plus-page {
  /* 隐藏页面内容 */
  opacity: 0;
  height: 100vh;
}
</style>
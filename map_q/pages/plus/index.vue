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
      
      // 延迟返回上一页，确保弹窗已经显示
      setTimeout(() => {
        uni.navigateBack({
          fail: () => {
            // 如果没有上一页，跳转到首页
            uni.switchTab({
              url: '/pages/index/index'
            })
          }
        })
      }, 300) // 增加延迟时间，确保弹窗显示
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
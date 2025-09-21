<template>
  <DetailPage />
</template>

<script>
import DetailPage from './components/DetailPage.vue';

export default {
  name: 'DetailIndex',
  components: {
    DetailPage
  },
  onLoad(options) {
    console.log('Detail page loaded with options:', options);
    // 这里可以处理页面加载时的参数传递
    // 如果需要将options传递给DetailPage组件，需要通过props传递
  }
};
</script>

<style>
/* 页面级样式 */
page {
  background-color: #f8f8f8;
}
</style>
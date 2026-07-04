<template>
  <view class="detail-page-wrapper">
    <NormalDetail v-if="cardType === 'normal'" />
    <ServiceDetail v-else-if="cardType === 'service'" />
    <VideoDetail v-else-if="cardType === 'video'" />
    <ArticleDetail v-else-if="cardType === 'article'" />
    <PlaceDetail v-else-if="cardType === 'place'" />
    <EventDetail v-else-if="cardType === 'event'" />
    <TrackDetail v-else-if="cardType === 'track'" />
    <NormalDetail v-else />
  </view>
</template>

<script>
import { ref, onMounted } from 'vue'
import NormalDetail from './components/NormalDetail.vue'
import ServiceDetail from './components/ServiceDetail.vue'
import VideoDetail from './components/VideoDetail.vue'
import ArticleDetail from './components/ArticleDetail.vue'
import PlaceDetail from './components/PlaceDetail.vue'
import EventDetail from './components/EventDetail.vue'
import TrackDetail from './components/TrackDetail.vue'

export default {
  name: 'DetailIndex',
  components: {
    NormalDetail,
    ServiceDetail,
    VideoDetail,
    ArticleDetail,
    PlaceDetail,
    EventDetail,
    TrackDetail
  },
  setup() {
    const cardType = ref('')

    const detectCardType = () => {
      try {
        const pages = getCurrentPages()
        const currentPage = pages[pages.length - 1]
        const options = currentPage?.options || {}

        if (options.type) {
          cardType.value = options.type
          return
        }

        const item = uni.getStorageSync('INDEX_LAST_ITEM')
        if (item && item.type) {
          cardType.value = item.type
          return
        }

        cardType.value = ''
      } catch (e) {
        console.warn('检测卡片类型失败:', e)
        cardType.value = ''
      }
    }

    onMounted(() => {
      detectCardType()
    })

    return {
      cardType
    }
  }
}
</script>

<style>
.detail-page-wrapper {
  min-height: 100vh;
  background: #f8f8f8;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
}

.loading-state text {
  font-size: 14px;
  color: #999;
}
</style>

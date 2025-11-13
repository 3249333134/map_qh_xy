<template>
  <scroll-view 
    class="cards-container"
    scroll-y
    @scrolltolower="$emit('load-more')"
    @scroll="onScroll"
    :scroll-top="scrollTop"
    :scroll-with-animation="scrollWithAnimation"
    :style="{ height: cardsContainerHeight + 'px' }"
  >
    <view class="cards-grid">
      <view class="cards-column">
        <template v-if="useServiceCard">
          <service-card-item
            v-for="(item, index) in leftColumnData"
            :key="'left-svc-' + (item._id || '') + '-' + index"
            :index="index"
            :card-data="item"
            :height="getColumnItemHeight('left', index)"
            column-type="left"
            @media-tap="$emit('media-tap', $event)"
            @content-tap="$emit('content-tap', $event)"
            @reserve="$emit('reserve', $event)"
          />
        </template>
        <template v-else>
          <card-item
            v-for="(item, index) in leftColumnData"
            :key="'left-base-' + (item._id || '') + '-' + index"
            :index="index"
            :card-data="item"
            :height="getColumnItemHeight('left', index)"
            column-type="left"
            @media-tap="$emit('media-tap', $event)"
            @content-tap="$emit('content-tap', $event)"
          />
        </template>
      </view>
      <view class="cards-column">
        <template v-if="useServiceCard">
          <service-card-item
            v-for="(item, index) in rightColumnData"
            :key="'right-svc-' + (item._id || '') + '-' + index"
            :index="leftColumnData.length + index"
            :card-data="item"
            :height="getColumnItemHeight('right', index)"
            column-type="right"
            @media-tap="$emit('media-tap', $event)"
            @content-tap="$emit('content-tap', $event)"
            @reserve="$emit('reserve', $event)"
          />
        </template>
        <template v-else>
          <card-item
            v-for="(item, index) in rightColumnData"
            :key="'right-base-' + (item._id || '') + '-' + index"
            :index="leftColumnData.length + index"
            :card-data="item"
            :height="getColumnItemHeight('right', index)"
            column-type="right"
            @media-tap="$emit('media-tap', $event)"
            @content-tap="$emit('content-tap', $event)"
          />
        </template>
      </view>
    </view>
    <view class="loading-more" v-if="isLoading"><text>加载中...</text></view>
    <view class="loading-done" v-if="!hasMoreData && (leftColumnData.length + rightColumnData.length) > 0"><text>已加载全部内容</text></view>
  </scroll-view>
</template>

<script>
import CardItem from '../card/CardItem.vue'
import ServiceCardItem from '../card/ServiceCardItem.vue'

export default {
  components: { CardItem, ServiceCardItem },
  props: {
    scrollTop: { type: Number, default: 0 },
    scrollWithAnimation: { type: Boolean, default: true },
    cardsContainerHeight: { type: Number, default: 0 },
    isLoading: { type: Boolean, default: false },
    hasMoreData: { type: Boolean, default: true },
    leftColumnData: { type: Array, default: () => [] },
    rightColumnData: { type: Array, default: () => [] },
    useServiceCard: { type: Boolean, default: false },
    getColumnItemHeight: { type: Function, required: true }
  },
  emits: ['load-more','scroll','media-tap','content-tap','reserve'],
  methods: {
    onScroll(e) { this.$emit('scroll', e) }
  }
}
</script>

<style scoped>
.cards-container { overflow: hidden; }
.cards-grid { display: flex; padding: 10px; width: 100%; box-sizing: border-box; }
.cards-column { flex: 0 0 50%; padding: 0 5px; width: 50%; box-sizing: border-box; }
.loading-more { text-align: center; padding: 15px 0; color: #666; }
.loading-done { text-align: center; padding: 15px 0; color: #999; font-size: 12px; }
</style>

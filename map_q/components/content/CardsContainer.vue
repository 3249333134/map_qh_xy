<template>
  <scroll-view 
    class="cards-container"
    scroll-y
    @scrolltolower="$emit('load-more')"
    @scroll="onScroll"
    :scroll-top="scrollTop"
    :scroll-with-animation="scrollWithAnimation"
    :style="{ height: cardsContainerHeight + 'px' }"
    ref="scrollViewRef"
  >
    <view v-if="isLoading && totalCount === 0" class="skeleton-container">
      <view class="skeleton-card" v-for="i in 6" :key="i">
        <view class="skeleton-cover"></view>
        <view class="skeleton-body">
          <view class="skeleton-line skeleton-title"></view>
          <view class="skeleton-line skeleton-subtitle"></view>
          <view class="skeleton-line skeleton-desc"></view>
          <view class="skeleton-footer">
            <view class="skeleton-line skeleton-location"></view>
            <view class="skeleton-actions">
              <view class="skeleton-btn"></view>
              <view class="skeleton-btn"></view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view v-else-if="totalCount === 0 && !isLoading" class="empty-state">
      <view class="empty-icon">📭</view>
      <text class="empty-title">暂无内容</text>
      <text class="empty-desc">去发布第一条动态吧</text>
      <view class="empty-btn" @tap="goPublish">
        <text>去发布</text>
      </view>
    </view>

    <view v-else class="cards-grid">
      <view class="cards-column">
        <template v-if="useServiceCard">
          <service-card-item
            v-for="(item, index) in leftColumnData"
            :key="'left-svc-' + (item._id || '') + '-' + index"
            :index="index"
            :card-data="item"
            :height="getColumnItemHeight('left', index)"
            column-type="left"
            :class="{ 'card-highlight': isHighlighted(item._id) }"
            @media-tap="$emit('media-tap', $event)"
            @content-tap="$emit('content-tap', $event)"
            @reserve="$emit('reserve', $event)"
          />
        </template>
        <template v-else>
          <template v-for="(item, index) in leftColumnData" :key="'left-base-' + (item._id || '') + '-' + index">
            <track-card
              v-if="item.type === 'track'"
              :index="index"
              :card-data="item"
              :height="getColumnItemHeight('left', index)"
              column-type="left"
              :class="{ 'card-highlight': isHighlighted(item._id) }"
              @media-tap="$emit('media-tap', $event)"
              @content-tap="$emit('content-tap', $event)"
            />
            <video-card
              v-else-if="item.type === 'video'"
              :index="index"
              :card-data="item"
              :height="getColumnItemHeight('left', index)"
              column-type="left"
              :class="{ 'card-highlight': isHighlighted(item._id) }"
              @media-tap="$emit('media-tap', $event)"
              @content-tap="$emit('content-tap', $event)"
            />
            <article-card
              v-else-if="item.type === 'article'"
              :index="index"
              :card-data="item"
              :height="getColumnItemHeight('left', index)"
              column-type="left"
              :class="{ 'card-highlight': isHighlighted(item._id) }"
              @media-tap="$emit('media-tap', $event)"
              @content-tap="$emit('content-tap', $event)"
            />
            <place-card
              v-else-if="item.type === 'place'"
              :index="index"
              :card-data="item"
              :height="getColumnItemHeight('left', index)"
              column-type="left"
              :class="{ 'card-highlight': isHighlighted(item._id) }"
              @media-tap="$emit('media-tap', $event)"
              @content-tap="$emit('content-tap', $event)"
            />
            <event-card
              v-else-if="item.type === 'event'"
              :index="index"
              :card-data="item"
              :height="getColumnItemHeight('left', index)"
              column-type="left"
              :class="{ 'card-highlight': isHighlighted(item._id) }"
              @media-tap="$emit('media-tap', $event)"
              @content-tap="$emit('content-tap', $event)"
            />
            <service-card-item
              v-else-if="item.type === 'service'"
              :index="index"
              :card-data="item"
              :height="getColumnItemHeight('left', index)"
              column-type="left"
              :class="{ 'card-highlight': isHighlighted(item._id) }"
              @media-tap="$emit('media-tap', $event)"
              @content-tap="$emit('content-tap', $event)"
              @reserve="$emit('reserve', $event)"
            />
            <card-item
              v-else
              :index="index"
              :card-data="item"
              :height="getColumnItemHeight('left', index)"
              column-type="left"
              :class="{ 'card-highlight': isHighlighted(item._id) }"
              @media-tap="$emit('media-tap', $event)"
              @content-tap="$emit('content-tap', $event)"
            />
          </template>
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
            :class="{ 'card-highlight': isHighlighted(item._id) }"
            @media-tap="$emit('media-tap', $event)"
            @content-tap="$emit('content-tap', $event)"
            @reserve="$emit('reserve', $event)"
          />
        </template>
        <template v-else>
          <template v-for="(item, index) in rightColumnData" :key="'right-base-' + (item._id || '') + '-' + index">
            <track-card
              v-if="item.type === 'track'"
              :index="leftColumnData.length + index"
              :card-data="item"
              :height="getColumnItemHeight('right', index)"
              column-type="right"
              :class="{ 'card-highlight': isHighlighted(item._id) }"
              @media-tap="$emit('media-tap', $event)"
              @content-tap="$emit('content-tap', $event)"
            />
            <video-card
              v-else-if="item.type === 'video'"
              :index="leftColumnData.length + index"
              :card-data="item"
              :height="getColumnItemHeight('right', index)"
              column-type="right"
              :class="{ 'card-highlight': isHighlighted(item._id) }"
              @media-tap="$emit('media-tap', $event)"
              @content-tap="$emit('content-tap', $event)"
            />
            <article-card
              v-else-if="item.type === 'article'"
              :index="leftColumnData.length + index"
              :card-data="item"
              :height="getColumnItemHeight('right', index)"
              column-type="right"
              :class="{ 'card-highlight': isHighlighted(item._id) }"
              @media-tap="$emit('media-tap', $event)"
              @content-tap="$emit('content-tap', $event)"
            />
            <place-card
              v-else-if="item.type === 'place'"
              :index="leftColumnData.length + index"
              :card-data="item"
              :height="getColumnItemHeight('right', index)"
              column-type="right"
              :class="{ 'card-highlight': isHighlighted(item._id) }"
              @media-tap="$emit('media-tap', $event)"
              @content-tap="$emit('content-tap', $event)"
            />
            <event-card
              v-else-if="item.type === 'event'"
              :index="leftColumnData.length + index"
              :card-data="item"
              :height="getColumnItemHeight('right', index)"
              column-type="right"
              :class="{ 'card-highlight': isHighlighted(item._id) }"
              @media-tap="$emit('media-tap', $event)"
              @content-tap="$emit('content-tap', $event)"
            />
            <service-card-item
              v-else-if="item.type === 'service'"
              :index="leftColumnData.length + index"
              :card-data="item"
              :height="getColumnItemHeight('right', index)"
              column-type="right"
              :class="{ 'card-highlight': isHighlighted(item._id) }"
              @media-tap="$emit('media-tap', $event)"
              @content-tap="$emit('content-tap', $event)"
              @reserve="$emit('reserve', $event)"
            />
            <card-item
              v-else
              :index="leftColumnData.length + index"
              :card-data="item"
              :height="getColumnItemHeight('right', index)"
              column-type="right"
              :class="{ 'card-highlight': isHighlighted(item._id) }"
              @media-tap="$emit('media-tap', $event)"
              @content-tap="$emit('content-tap', $event)"
            />
          </template>
        </template>
      </view>
    </view>
    <view class="loading-more" v-if="isLoading && totalCount > 0">
      <view class="loading-spinner"></view>
      <text>加载中...</text>
    </view>
    <view class="loading-done" v-if="!hasMoreData && totalCount > 0"><text>已加载全部内容</text></view>
  </scroll-view>
</template>

<script>
import CardItem from '../card/CardItem.vue'
import ServiceCardItem from '../card/ServiceCardItem.vue'
import TrackCard from '../card/TrackCard.vue'
import VideoCard from '../card/VideoCard.vue'
import ArticleCard from '../card/ArticleCard.vue'
import PlaceCard from '../card/PlaceCard.vue'
import EventCard from '../card/EventCard.vue'

export default {
  components: { CardItem, ServiceCardItem, TrackCard, VideoCard, ArticleCard, PlaceCard, EventCard },
  props: {
    scrollTop: { type: Number, default: 0 },
    scrollWithAnimation: { type: Boolean, default: true },
    cardsContainerHeight: { type: Number, default: 0 },
    isLoading: { type: Boolean, default: false },
    hasMoreData: { type: Boolean, default: true },
    leftColumnData: { type: Array, default: () => [] },
    rightColumnData: { type: Array, default: () => [] },
    useServiceCard: { type: Boolean, default: false },
    getColumnItemHeight: { type: Function, required: true },
    highlightedCardId: { type: [String, Number], default: null }
  },
  emits: ['load-more','scroll','media-tap','content-tap','reserve'],
  computed: {
    totalCount() {
      return this.leftColumnData.length + this.rightColumnData.length
    }
  },
  methods: {
    onScroll(e) { this.$emit('scroll', e) },
    goPublish() {
      uni.switchTab({ url: '/pages/plus/index' })
    },
    isHighlighted(cardId) {
      return cardId && this.highlightedCardId && String(cardId) === String(this.highlightedCardId)
    },
    scrollToCard(cardId) {
      let targetIndex = -1
      this.leftColumnData.forEach((item, index) => {
        if (String(item._id) === String(cardId)) {
          targetIndex = index
        }
      })
      if (targetIndex === -1) {
        this.rightColumnData.forEach((item, index) => {
          if (String(item._id) === String(cardId)) {
            targetIndex = index
          }
        })
      }
      if (targetIndex !== -1) {
        let scrollTop = 0
        for (let i = 0; i < targetIndex; i++) {
          scrollTop += this.getColumnItemHeight('left', i) + 20
        }
        this.$emit('scroll-to-card', { cardId, scrollTop })
      }
    }
  }
}
</script>

<style scoped>
.cards-container { overflow: hidden; }
.cards-grid { display: flex; padding: 4px 8px; width: 100%; box-sizing: border-box; }
.cards-column { flex: 0 0 50%; padding: 0 4px; width: 50%; box-sizing: border-box; }

.card-highlight {
  box-shadow: 0 4rpx 20rpx rgba(255, 138, 101, 0.25) !important;
  transform: scale(1.01);
  transition: all 0.3s ease;
}

.card-highlight::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4rpx;
  background: var(--primary-color);
  border-top-left-radius: 12rpx;
  border-top-right-radius: 12rpx;
}

.skeleton-container {
  display: flex;
  flex-wrap: wrap;
  padding: 10px;
}

.skeleton-card {
  width: calc(50% - 10px);
  margin: 0 5px 20px;
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.08);
}

.skeleton-cover {
  height: 200rpx;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeletonWave 1.5s infinite;
}

.skeleton-body {
  padding: 16rpx;
}

.skeleton-line {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeletonWave 1.5s infinite;
  border-radius: 4rpx;
  margin-bottom: 10rpx;
}

.skeleton-title {
  height: 36rpx;
  width: 80%;
}

.skeleton-subtitle {
  height: 28rpx;
  width: 60%;
}

.skeleton-desc {
  height: 24rpx;
  width: 90%;
}

.skeleton-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12rpx;
}

.skeleton-location {
  height: 24rpx;
  width: 50%;
}

.skeleton-actions {
  display: flex;
  gap: 12rpx;
}

.skeleton-btn {
  width: 36rpx;
  height: 36rpx;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeletonWave 1.5s infinite;
  border-radius: 8rpx;
}

@keyframes skeletonWave {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 40rpx;
}

.empty-icon {
  font-size: 100rpx;
  margin-bottom: 30rpx;
}

.empty-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
}

.empty-desc {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 40rpx;
}

.empty-btn {
  padding: 16rpx 48rpx;
  background: linear-gradient(135deg, #ff7a45 0%, #ff6b35 100%);
  border-radius: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(255, 122, 69, 0.3);
}

.empty-btn text {
  font-size: 28rpx;
  color: #fff;
  font-weight: 600;
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  padding: 20px 0;
  color: #666;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f0f0f0;
  border-top-color: #ff7a45;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-done { text-align: center; padding: 15px 0; color: #999; font-size: 12px; }
</style>
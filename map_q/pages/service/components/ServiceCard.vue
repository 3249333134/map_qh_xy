<template>
  <base-card
    :card-data="cardData"
    :title="cardTitle"
    :description="cardDescription"
    :author="cardAuthor"
    :location="cardLocation"
    :stats="cardStats"
    :height="height"
    :show-actions="true"
    :index="index"
    @card-tap="onCardTap"
  >
    <!-- 自定义媒体内容 -->
    <template #media="{ data }">
      <view class="service-media">
        <text class="service-icon">{{ getServiceIcon(data.category) }}</text>
        <view class="service-badge" v-if="data.rating">
          <text class="rating-text">{{ data.rating }}⭐</text>
        </view>
      </view>
    </template>
    
    <!-- 自定义底部内容 -->
    <template #footer="{ data }">
      <view class="service-footer">
        <view class="service-location">
          <text class="location-icon">📍</text>
          <text class="location-text">{{ cardLocation }}</text>
        </view>
        <view class="service-price">
          <text class="price-text">{{ data.price || '面议' }}</text>
        </view>
      </view>
    </template>
    
    <!-- 自定义操作区域 -->
    <template #actions="{ data }">
      <view class="service-actions">
        <view class="action-btn" @tap="onCallService">
          <text class="action-icon">📞</text>
          <text class="action-text">联系</text>
        </view>
        <view class="action-btn" @tap="onBookService">
          <text class="action-icon">📅</text>
          <text class="action-text">预约</text>
        </view>
        <view class="action-btn" @tap="onViewDetail">
          <text class="action-icon">👁️</text>
          <text class="action-text">详情</text>
        </view>
      </view>
    </template>
  </base-card>
</template>

<script>
import BaseCard from '../../../components/BaseCard.vue'

export default {
  name: 'ServiceCard',
  components: {
    BaseCard
  },
  props: {
    cardData: {
      type: Object,
      default: () => ({})
    },
    height: {
      type: Number,
      default: 200
    },
    index: {
      type: Number,
      default: 0
    }
  },
  
  computed: {
    cardTitle() {
      return this.cardData.name || this.cardData.title || '服务项目'
    },
    
    cardDescription() {
      return this.cardData.description || ''
    },
    
    cardAuthor() {
      return this.cardData.provider || this.cardData.author || ''
    },
    
    cardLocation() {
      return this.cardData.address || ''
    },
    
    cardStats() {
      const rating = this.cardData.rating || 0
      return `评分 ${rating}`
    }
  },
  
  methods: {
    // 获取服务图标
    getServiceIcon(category) {
      const icons = {
        repair: '🔧',
        clean: '🧹',
        delivery: '🚚',
        default: '🛠️'
      }
      return icons[category] || icons.default
    },
    
    onCardTap(payload) {
      this.$emit('card-tap', payload)
    },
    
    // 联系服务
    onCallService(e) {
      e.stopPropagation()
      uni.showToast({
        title: '拨打电话',
        icon: 'none'
      })
    },
    
    // 预约服务
    onBookService(e) {
      e.stopPropagation()
      uni.showToast({
        title: '预约服务',
        icon: 'none'
      })
    },
    
    // 查看详情
    onViewDetail(e) {
      e.stopPropagation()
      uni.showToast({
        title: '查看详情',
        icon: 'none'
      })
    }
  }
}
</script>

<style scoped>
.service-media {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.service-icon {
  font-size: 36px;
}

.service-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 2px 6px;
}

.rating-text {
  font-size: 10px;
  color: #333;
}

.service-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.service-location {
  display: flex;
  align-items: center;
  flex: 1;
}

.location-icon {
  font-size: 10px;
  margin-right: 4px;
}

.location-text {
  font-size: 11px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.service-price {
  flex-shrink: 0;
}

.price-text {
  font-size: 12px;
  color: #2196F3;
  font-weight: bold;
}

.service-actions {
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.action-btn:active {
  background-color: #f0f0f0;
}

.action-icon {
  font-size: 16px;
  margin-bottom: 2px;
}

.action-text {
  font-size: 10px;
  color: #666;
}
</style>
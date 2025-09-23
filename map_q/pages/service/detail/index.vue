<template>
  <view class="page">
    <view class="header">
      <text class="title">{{ serviceItem.name || '服务详情' }}</text>
      <text class="subtitle">{{ serviceItem.author || '未知提供商' }}</text>
    </view>

    <view class="section">
      <view class="row">
        <text class="label">地址</text>
        <text class="value">{{ serviceItem.address || '暂无地址' }}</text>
      </view>
      <view class="row">
        <text class="label">描述</text>
        <text class="value">{{ serviceItem.description || '暂无描述' }}</text>
      </view>
    </view>

    <view class="section">
      <text class="block-title">位置</text>
      <view class="map-wrap">
        <map
          :latitude="latitude"
          :longitude="longitude"
          :scale="18"
          :markers="markers"
          style="width: 100%; height: 240rpx"
          @markertap="onMarkerTap"
        />
      </view>
    </view>

    <view class="bottom-bar">
      <button class="btn" type="primary" @tap="onNavigate">导航到这里</button>
      <button class="btn" @tap="onShare">分享</button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      serviceItem: {
        _id: '',
        name: '',
        author: '',
        address: '',
        description: '',
        location: null
      }
    }
  },
  computed: {
    longitude() {
      const loc = this.serviceItem.location
      return loc && Array.isArray(loc.coordinates) ? loc.coordinates[0] : 104.066541
    },
    latitude() {
      const loc = this.serviceItem.location
      return loc && Array.isArray(loc.coordinates) ? loc.coordinates[1] : 30.572269
    },
    markers() {
      return [
        {
          id: 1,
          latitude: this.latitude,
          longitude: this.longitude,
          iconPath: '/static/marker.png',
          width: 36,
          height: 36,
          callout: {
            content: this.serviceItem.name || '服务点位',
            color: '#000000',
            fontSize: 12,
            borderRadius: 4,
            padding: 6,
            display: 'BYCLICK'
          }
        }
      ]
    }
  },
  onLoad() {
    // 1) 优先从 eventChannel 接收
    const ec = this.getOpenerEventChannel && this.getOpenerEventChannel()
    if (ec) {
      ec.on('service-item', ({ item }) => {
        const normalized = this.normalizeItem(item)
        this.serviceItem = normalized
        uni.setNavigationBarTitle({ title: normalized.name || '服务详情' })
        uni.setStorageSync('LAST_SERVICE_ITEM', normalized)
      })
    }
    // 2) 兜底：从缓存读取
    if (!this.serviceItem._id) {
      const cached = uni.getStorageSync('LAST_SERVICE_ITEM')
      if (cached && cached._id) {
        this.serviceItem = cached
        uni.setNavigationBarTitle({ title: cached.name || '服务详情' })
      }
    }
  },
  methods: {
    normalizeItem(item) {
      if (!item) return {}
      const id = item._id || item.id || `id_${Date.now()}_${Math.random()}`
      const name = item.name || item.title || '服务'
      const author = item.author || '未知提供商'
      const address = item.address || '暂无地址'
      const description = item.description || ''
      let location = item.location
      if (!location && item.coordinates && Array.isArray(item.coordinates)) {
        // 兼容坐标直接在节点上
        location = { type: 'Point', coordinates: item.coordinates }
      }
      return { _id: id, name, author, address, description, location }
    },
    onMarkerTap() {
      uni.showToast({ title: this.serviceItem.name || '服务点位', icon: 'none' })
    },
    onNavigate() {
      // 打开系统地图导航
      uni.openLocation({
        latitude: this.latitude,
        longitude: this.longitude,
        name: this.serviceItem.name || '服务点位',
        address: this.serviceItem.address || ''
      })
    },
    onShare() {
      uni.setClipboardData({
        data: `${this.serviceItem.name} - ${this.serviceItem.address || ''}`,
        success: () => uni.showToast({ title: '已复制', icon: 'none' })
      })
    }
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 120rpx;
}
.header {
  padding: 24rpx 28rpx;
  background: #ffffff;
  border-bottom: 1rpx solid #f0f0f0;
}
.title {
  font-size: 34rpx;
  font-weight: 600;
  color: #111;
}
.subtitle {
  margin-top: 8rpx;
  font-size: 26rpx;
  color: #888;
}
.section {
  margin-top: 16rpx;
  background: #fff;
  padding: 20rpx 28rpx;
}
.row {
  display: flex;
  margin-bottom: 14rpx;
}
.label {
  width: 120rpx;
  color: #666;
  font-size: 26rpx;
}
.value {
  flex: 1;
  color: #333;
  font-size: 26rpx;
  line-height: 1.6;
}
.block-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #222;
  margin-bottom: 12rpx;
}
.map-wrap {
  border: 1rpx solid #eee;
  border-radius: 8rpx;
  overflow: hidden;
}
.bottom-bar {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  display: flex;
  gap: 16rpx;
  padding: 16rpx;
  background: rgba(255,255,255,0.96);
  box-shadow: 0 -6rpx 16rpx rgba(0,0,0,0.04);
}
.btn {
  flex: 1;
}
</style>
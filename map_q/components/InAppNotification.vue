<template>
  <view 
    v-if="visible" 
    class="notification"
    :class="{ show: showAnimation }"
    @click="handleClick"
  >
    <image class="notification-avatar" :src="notification.avatar" mode="aspectFill" />
    <view class="notification-content">
      <text class="notification-title">{{ notification.title }}</text>
      <text class="notification-text">{{ notification.content }}</text>
    </view>
    <view class="notification-close" @click.stop="close">
      <uni-icons type="clear" size="16" color="#999" />
    </view>
  </view>
</template>

<script>
export default {
  name: 'InAppNotification',
  data() {
    return {
      visible: false,
      showAnimation: false,
      notification: {},
      timer: null
    }
  },
  
  mounted() {
    // 监听通知事件
    this.$messageManager.addListener('in-app-notification', this.show)
  },
  
  beforeDestroy() {
    this.$messageManager.removeListener('in-app-notification', this.show)
    if (this.timer) {
      clearTimeout(this.timer)
    }
  },
  
  methods: {
    show(notification) {
      this.notification = notification
      this.visible = true
      
      this.$nextTick(() => {
        this.showAnimation = true
      })
      
      // 自动隐藏
      this.timer = setTimeout(() => {
        this.close()
      }, notification.duration || 3000)
    },
    
    close() {
      this.showAnimation = false
      setTimeout(() => {
        this.visible = false
      }, 300)
      
      if (this.timer) {
        clearTimeout(this.timer)
        this.timer = null
      }
    },
    
    handleClick() {
      this.$emit('click', this.notification)
      this.close()
    }
  }
}
</script>

<style scoped>
.notification {
  position: fixed;
  top: -100px;
  left: 15px;
  right: 15px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  padding: 12px 15px;
  gap: 12px;
  z-index: 9999;
  transition: all 0.3s ease;
}

.notification.show {
  top: calc(var(--status-bar-height) + 10px);
}

.notification-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  display: block;
  margin-bottom: 2px;
}

.notification-text {
  font-size: 12px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notification-close {
  padding: 4px;
}
</style>
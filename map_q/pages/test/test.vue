<template>
  <view class="test-page">
    <view class="test-header">
      <text class="test-title">卡片点击测试页面</text>
    </view>
    
    <view class="test-content">
      <!-- 测试卡片 -->
      <view class="test-card" @tap="onCardTap">
        <view class="test-media" @tap.stop="showDetail">
          <image 
            src="/static/test-image.jpg" 
            mode="aspectFill"
            class="test-image"
            @tap.stop="showDetail"
          />
          <text class="test-hint">点击图片查看详情</text>
        </view>
        <view class="test-info">
          <text class="test-name">测试卡片</text>
          <text class="test-desc">点击测试</text>
        </view>
      </view>
      
      <!-- 日志显示区域 -->
      <view class="log-area">
        <text class="log-title">事件日志:</text>
        <view class="log-list">
          <text 
            v-for="(log, index) in logs" 
            :key="index" 
            class="log-item"
          >
            {{ log }}
          </text>
        </view>
      </view>
    </view>
    
    <!-- 详情弹窗 -->
    <view v-if="showModal" class="test-modal" @tap="closeModal">
      <view class="test-modal-content" @tap.stop>
        <text class="modal-title">详情页面</text>
        <text class="modal-text">详情弹窗显示成功！</text>
        <button class="close-btn" @tap="closeModal">关闭</button>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'TestPage',
  data() {
    return {
      logs: [],
      showModal: false
    }
  },
  methods: {
    addLog(message) {
      const timestamp = new Date().toLocaleTimeString()
      this.logs.unshift(`[${timestamp}] ${message}`)
      if (this.logs.length > 10) {
        this.logs.pop()
      }
    },
    
    onCardTap() {
      this.addLog('卡片被点击 - 应该定位到地图')
      console.log('Card tap event triggered')
    },
    
    showDetail() {
      this.addLog('图片区域被点击 - 正在显示详情')
      console.log('Show detail event triggered')
      this.showModal = true
    },
    
    closeModal() {
      this.addLog('关闭详情弹窗')
      console.log('Close modal event triggered')
      this.showModal = false
    }
  }
}
</script>

<style>
.test-page {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.test-header {
  text-align: center;
  margin-bottom: 30px;
}

.test-title {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.test-card {
  background-color: #fff;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.test-media {
  position: relative;
  height: 200px;
  background-color: #eee;
  display: flex;
  align-items: center;
  justify-content: center;
}

.test-image {
  width: 100%;
  height: 100%;
}

.test-hint {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 5px 10px;
  border-radius: 15px;
  font-size: 12px;
}

.test-info {
  padding: 15px;
}

.test-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 5px;
}

.test-desc {
  font-size: 14px;
  color: #666;
}

.log-area {
  background-color: #fff;
  border-radius: 12px;
  padding: 15px;
  margin-top: 20px;
}

.log-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 10px;
}

.log-list {
  max-height: 200px;
  overflow-y: auto;
}

.log-item {
  display: block;
  padding: 5px 0;
  border-bottom: 1px solid #eee;
  font-size: 12px;
  color: #666;
}

.test-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.test-modal-content {
  background-color: #fff;
  border-radius: 12px;
  padding: 30px;
  margin: 20px;
  text-align: center;
}

.modal-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 15px;
}

.modal-text {
  font-size: 14px;
  color: #666;
  display: block;
  margin-bottom: 20px;
}

.close-btn {
  background-color: #007aff;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 20px;
  font-size: 14px;
}
</style>
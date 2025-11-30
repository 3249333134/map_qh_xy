<template>
  <view class="message-page">
    <!-- 顶部占位：使用自定义导航栏总高度（状态栏+导航栏） -->
    <view class="status-bar" :style="{ height: topOffset + 'px' }"></view>
    
    <!-- 搜索栏 -->
    <view class="search-container">
      <view class="search-bar">
        <text class="search-icon">🔍</text>
        <text class="search-placeholder">Search</text>
      </view>
      <view class="add-btn" @click="showAddMenu = !showAddMenu">
        <text class="add-icon">+</text>
      </view>
    </view>

    <!-- 添加菜单弹窗 -->
    <view v-if="showAddMenu" class="add-menu-overlay" @click="showAddMenu = false">
      <view class="add-menu" @click.stop>
        <view class="menu-item" @click="addFriend">
          <text>添加朋友</text>
        </view>
        <view class="menu-item" @click="createGroup">
          <text>发起群聊</text>
        </view>
        <view class="menu-item" @click="scanQR">
          <text>扫一扫</text>
        </view>
      </view>
    </view>

    <!-- 三个功能区块 -->
    <view class="function-blocks">
      <view class="block">
        <text class="block-title">频道与朋友</text>
      </view>
      <view class="block">
        <text class="block-title">关注与粉丝</text>
      </view>
      <view class="block">
        <text class="block-title">点赞与评论</text>
      </view>
    </view>

    <!-- 主要内容区域 -->
    <view class="main-content">
      <!-- 左侧气泡列表 -->
      <view class="bubble-list">
        <view 
          v-for="(bubble, index) in bubbles" 
          :key="bubble.id"
          class="bubble-item"
          :class="{ active: selectedBubble === bubble.id, dragging: dragIndex === index }"
          :style="{ backgroundColor: bubble.color, transform: dragIndex === index ? `translateY(${dragOffset}px)` : 'none' }"
          @click="selectBubble(bubble.id)"
          @touchstart="startDrag($event, index)"
          @touchmove="onDrag($event)"
          @touchend="endDrag"
        >
          <text class="bubble-text">{{ bubble.id }}</text>
        </view>
      </view>

      <!-- 右侧消息列表（scroll-view，高度=窗口-顶部占位-功能区-底部TabBar） -->
      <scroll-view 
        class="message-list" 
        scroll-y 
        show-scrollbar="false" 
        scroll-with-animation
        :style="{ height: listHeight + 'px' }"
      >
        <view 
          v-for="(message, index) in currentMessages" 
          :key="message"
          class="message-item-container"
          @touchstart="startSwipe($event, index)"
          @touchmove="onSwipe($event)"
          @touchend="endSwipe"
        >
          <!-- 头像固定不动 -->
          <view class="message-avatar" :style="{ backgroundColor: getAvatarColor(index) }"></view>
          
          <!-- 可滑动的内容区域（灰色框+操作按钮） -->
          <view class="message-slide-area">
            <view 
              class="message-content-wrapper"
              :style="{ transform: swipeIndex === index ? `translateX(${swipeOffset}px)` : 'translateX(0)' }"
            >
              <!-- 灰色消息框 -->
              <view class="message-placeholder">
                <view class="message-content"></view>
              </view>
              
              <!-- 操作按钮紧跟在灰色框后面 -->
              <view class="swipe-actions">
                <view class="action-btn pin-btn" @click="pinMessage(index)">
                  <text class="action-text">置顶</text>
                </view>
                <view class="action-btn unread-btn" @click="markUnread(index)">
                  <text class="action-text">未读</text>
                </view>
                <view class="action-btn delete-btn" @click="deleteMessage(index)">
                  <text class="action-text">删除</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>
    <!-- 全局发布弹窗挂载点 -->
    <GlobalOverlayHost />
  </view>
</template>

<script>
import GlobalOverlayHost from '../../components/common/GlobalOverlayHost.vue'
export default {
  components: { GlobalOverlayHost },
  data() {
    return {
      topOffset: 0,
      bottomOffset: 0,
      listHeight: 0,
      showAddMenu: false,
      selectedBubble: 1,
      bubbles: [
        { id: 1, color: '#007AFF' },
        { id: 2, color: '#34C759' },
        { id: 3, color: '#FF9500' },
        { id: 4, color: '#FF3B30' }
      ],
      messageData: {
        1: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        2: [1, 2, 3, 4, 5],
        3: [1, 2, 3, 4, 5, 6],
        4: [1, 2, 3, 4]
      },
      // 拖拽相关数据
      dragIndex: -1,
      dragOffset: 0,
      startY: 0,
      isDragging: false,
      // 右滑相关数据
      swipeIndex: -1,
      swipeOffset: 0,
      startX: 0,
      isSwipping: false
    }
  },
  created() {
    try {
      const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
      const statusPx = (info && ((info.safeAreaInsets && info.safeAreaInsets.top) || (info.safeArea && info.safeArea.top) || info.statusBarHeight || 0)) || 0
      // 轻微上移补偿：允许向上再贴近一点（默认6px，可通过缓存覆写）
      const topComp = uni.getStorageSync('TOP_COMPENSATION_PX')
      const compPx = (typeof topComp === 'number' && topComp >= 0 && topComp <= 20) ? topComp : 6
      this.topOffset = Math.max(statusPx - compPx, 0)

      const tabMetrics = uni.getStorageSync('TABBAR_METRICS') || null
      if (tabMetrics && typeof tabMetrics.tabHeightPx === 'number') {
        this.bottomOffset = tabMetrics.tabHeightPx
      } else {
        this.bottomOffset = 86
      }
    } catch (e) {
      this.topOffset = 20
      this.bottomOffset = 86
    }
  },
  onReady() {
    try {
      const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
      const winH = (info && (info.windowHeight || (info.safeArea && info.safeArea.height))) || 0
      const q = uni.createSelectorQuery().in(this)
      q.select('.search-container').boundingClientRect()
      q.select('.function-blocks').boundingClientRect()
      q.exec(res => {
        const searchH = (res && res[0] && res[0].height) ? res[0].height : 0
        const blocksH = (res && res[1] && res[1].height) ? res[1].height : 0
        const calc = Math.round(winH - this.topOffset - searchH - blocksH - this.bottomOffset)
        this.listHeight = Math.max(120, calc)
      })
    } catch (e) {
      // 回退：给一个保守高度，避免滚动区域撑到TabBar
      this.listHeight = 500
    }
  },
  computed: {
    currentMessages() {
      return this.messageData[this.selectedBubble] || []
    }
  },
  methods: {
    addFriend() {
      this.showAddMenu = false
    },
    createGroup() {
      this.showAddMenu = false
    },
    scanQR() {
      this.showAddMenu = false
    },
    selectBubble(bubbleId) {
      if (!this.isDragging) {
        this.selectedBubble = bubbleId
      }
    },
    getAvatarColor(index) {
      const colors = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE', '#FF2D92', '#5AC8FA', '#FFCC00'];
      return colors[index % colors.length];
    },
    // 拖拽相关方法
    startDrag(event, index) {
      this.dragIndex = index
      this.startY = event.touches[0].clientY
      this.dragOffset = 0
      this.isDragging = false
      event.preventDefault()
    },
    onDrag(event) {
      if (this.dragIndex === -1) return
      
      const currentY = event.touches[0].clientY
      this.dragOffset = currentY - this.startY
      this.isDragging = true
      
      // 计算目标位置
      const itemHeight = 65 // 气泡项高度 + 间距
      const targetIndex = Math.round(this.dragOffset / itemHeight)
      const newIndex = Math.max(0, Math.min(this.bubbles.length - 1, this.dragIndex + targetIndex))
      
      event.preventDefault()
    },
    endDrag() {
      if (this.dragIndex === -1) return
      
      const itemHeight = 65
      const targetIndex = Math.round(this.dragOffset / itemHeight)
      const newIndex = Math.max(0, Math.min(this.bubbles.length - 1, this.dragIndex + targetIndex))
      
      if (newIndex !== this.dragIndex) {
        // 重新排序数组
        const draggedItem = this.bubbles[this.dragIndex]
        const newBubbles = [...this.bubbles]
        newBubbles.splice(this.dragIndex, 1)
        newBubbles.splice(newIndex, 0, draggedItem)
        this.bubbles = newBubbles
      }
      
      // 重置拖拽状态
      this.dragIndex = -1
      this.dragOffset = 0
      
      // 延迟重置isDragging，避免点击事件触发
      setTimeout(() => {
        this.isDragging = false
      }, 100)
    },
    // 右滑相关方法
    startSwipe(event, index) {
      // 如果其他消息项正在滑动，先重置
      if (this.swipeIndex !== -1 && this.swipeIndex !== index) {
        this.resetSwipe()
      }
      
      this.swipeIndex = index
      this.startX = event.touches[0].clientX
      this.swipeOffset = 0
      this.isSwipping = false
      event.preventDefault()
    },
    onSwipe(event) {
      if (this.swipeIndex === -1) return
      
      const currentX = event.touches[0].clientX
      const deltaX = currentX - this.startX
      
      // 只允许向左滑动
      if (deltaX < 0) {
        this.swipeOffset = Math.max(deltaX, -180) // 最大滑动距离180px
        this.isSwipping = true
      }
      
      event.preventDefault()
    },
    endSwipe() {
      if (this.swipeIndex === -1) return
      
      // 如果滑动距离小于60px，自动回弹
      if (this.swipeOffset > -60) {
        this.resetSwipe()
      } else {
        // 保持在显示操作按钮的位置
        this.swipeOffset = -180
      }
      
      setTimeout(() => {
        this.isSwipping = false
      }, 100)
    },
    resetSwipe() {
      this.swipeIndex = -1
      this.swipeOffset = 0
    },
    // 操作方法
    pinMessage(index) {
      console.log('置顶消息:', index)
      // 这里添加置顶逻辑
      this.resetSwipe()
    },
    markUnread(index) {
      console.log('标为未读:', index)
      // 这里添加标为未读逻辑
      this.resetSwipe()
    },
    deleteMessage(index) {
      console.log('删除消息:', index)
      // 这里添加删除逻辑
      const messages = [...this.messageData[this.selectedBubble]]
      messages.splice(index, 1)
      this.messageData[this.selectedBubble] = messages
      this.resetSwipe()
    }
  },
  onShow() {
    try {
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar().setData({ selected: 3 })
      } else {
        const pages = getCurrentPages()
        const page = pages[pages.length - 1]
        if (page && typeof page.getTabBar === 'function' && page.getTabBar()) {
          page.getTabBar().setData({ selected: 3 })
        }
      }
    } catch (e) {}
  },
  
}
</script>

<style scoped>
.message-page {
  height: 100vh;
  background: white;
  display: flex;
  flex-direction: column;
  padding-top: 0;
  position: relative;
  overscroll-behavior-y: none;
}

/* 状态栏占位 */
.status-bar {
  background: transparent;
}

/* 右上角悬浮按钮 */
.floating-buttons {
  position: absolute;
  right: 20px;
  display: flex;
  gap: 10px;
  z-index: 100;
}

.floating-btn {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.floating-icon {
  color: #333;
  font-size: 16px;
  font-weight: bold;
}

/* 搜索栏 */
.search-container {
  padding: 0 20px 10px 10px;
  padding-right: 100px;
  display: flex;
  gap: 10px;
  background: #f8f9fa;
}

.search-bar {
  flex: 1;
  height: 36px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 18px;
  display: flex;
  align-items: center;
  padding: 0 15px;
  gap: 8px;
}

.search-icon {
  font-size: 14px;
  opacity: 0.7;
}

.search-placeholder {
  color: rgba(0, 0, 0, 0.6);
  font-size: 14px;
}

.add-btn {
  width: 36px;
  height: 36px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-icon {
  color: #333;
  font-size: 18px;
  font-weight: bold;
}

/* 添加菜单 */
.add-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding-top: 90px;
  padding-right: 5px;
}

.add-menu {
  background: white;
  border-radius: 12px;
  padding: 15px;
  margin: 0;
  min-width: 100px;
  max-width: 120px;
  position: relative;
}

.menu-item {
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
  text-align: center;
}

.menu-item:last-child {
  border-bottom: none;
}

/* 功能区块 */
.function-blocks {
  display: flex;
  gap: 10px;
  padding: 0 20px 15px;
  background: #f8f9fa;
}

.block {
  flex: 1;
  height: 70px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.block-title {
  font-size: 14px;
  color: #333;
  text-align: center;
}

/* 主要内容区域 */
.main-content {
  flex: 1;
  display: flex;
  background: white;
  margin: 0;
  border-radius: 0;
  overflow: visible;
}

/* 左侧气泡列表 */
.bubble-list {
  width: 60px;
  background: white;
  padding: 15px 5px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  border-right: 1px solid #e0e0e0;
}

.bubble-item {
  width: 50px;
  height: 50px;
  border-radius: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  z-index: 1;
}

.bubble-item.active {
  border-color: #333;
  transform: scale(1.1);
}

.bubble-item.dragging {
  z-index: 10;
  opacity: 0.8;
  transform: scale(1.1);
  transition: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.bubble-text {
  color: white;
  font-size: 16px;
  font-weight: bold;
  pointer-events: none;
}

/* 右侧消息列表 */
.message-list {
  flex: 1;
  padding: 5px;
  /* 高度由内联样式控制，确保底部不越过TabBar */
  background: white;
  overscroll-behavior-y: contain;
  -webkit-overflow-scrolling: touch;
}

.message-item-container {
  height: 55px;
  width: 100%;
  border-bottom: 1px solid #f0f0f0;
  background: white;
  margin-bottom: 5px;
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  flex-shrink: 0;
  position: relative;
  z-index: 3;
}

.message-slide-area {
  flex: 1;
  height: 50px;
  overflow: hidden;
  position: relative;
}

.message-content-wrapper {
  display: flex;
  height: 100%;
  transition: transform 0.3s ease;
  position: relative;
  z-index: 2;
}

.message-placeholder {
  width: 100%; /* 当前是100%，你可以改为固定宽度如 320px */
  height: 60px;
  background: #f5f5f5;
  border-radius: 8px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  flex-shrink: 0;
}

.message-content {
  flex: 1;
  height: 30px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

/* 操作按钮紧跟在灰色框后面 */
.swipe-actions {
  display: flex;
  height: 100%;
  flex-shrink: 0;
  width: 180px;
}

.action-btn {
  width: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  cursor: pointer;
}

.pin-btn {
  background: #FF9500;
}

.unread-btn {
  background: #007AFF;
}

.delete-btn {
  background: #FF3B30;
}

.action-text {
  color: white;
  font-size: 12px;
  font-weight: 500;
}
</style>

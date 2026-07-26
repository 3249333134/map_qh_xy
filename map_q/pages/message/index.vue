<template>
  <view class="message-page">
    <!-- 顶部占位：使用自定义导航栏总高度（状态栏+导航栏） -->
    <view class="status-bar" :style="{ height: topOffset + 'px' }"></view>

    <view class="page-heading">
      <view><text class="page-title">消息</text><text class="page-subtitle">继续你在城市里的连接</text></view>
    </view>

    <!-- 搜索栏 -->
    <view
      class="search-container"
      :style="{
        paddingRight: capsuleRightInset + 'px',
        paddingTop: capsuleTopPadding + 'px',
        minHeight: headerRowMinHeight + 'px'
      }"
    >
      <view class="search-bar" @tap="openMessageSearch">
        <view class="search-icon" aria-hidden="true"></view>
        <text class="search-placeholder">搜索频道、朋友和消息</text>
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
      <view class="block block-channel" @tap="openChannelMap">
        <view class="block-icon channel-icon"><view></view></view>
        <text class="block-title">频道与朋友</text><text class="block-meta">12 个活跃</text>
      </view>
      <view class="block block-follow">
        <view class="block-icon people-icon"><view></view></view>
        <text class="block-title">关注与粉丝</text><text class="block-meta">3 个新朋友</text>
      </view>
      <view class="block block-reaction">
        <view class="block-icon heart-icon"></view>
        <text class="block-title">互动通知</text><text class="block-meta">8 条未读</text>
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
          <text class="bubble-text">{{ bubble.short }}</text>
          <view v-if="bubble.unread" class="bubble-badge">{{ bubble.unread }}</view>
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
          :key="message.id"
          class="message-item-container"
          @touchstart="startSwipe($event, index)"
          @touchmove="onSwipe($event)"
          @touchend="endSwipe"
        >
          <!-- 头像固定不动 -->
          <view class="message-avatar" :style="{ background: message.avatarBg }"><text>{{ message.avatar }}</text></view>

          <!-- 可滑动的内容区域（灰色框+操作按钮） -->
          <view class="message-slide-area">
            <view
              class="message-content-wrapper"
              :style="{ transform: swipeIndex === index ? `translateX(${swipeOffset}px)` : 'translateX(0)' }"
            >
              <view class="message-placeholder" @tap="openChat(message)">
                <view class="message-copy">
                  <view class="message-title-row"><text class="message-name">{{ message.name }}</text><text class="message-time">{{ message.time }}</text></view>
                  <view class="message-preview-row"><text class="message-preview">{{ message.preview }}</text><view v-if="message.unread" class="unread-dot">{{ message.unread }}</view></view>
                </view>
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
      capsuleRightInset: 20,
      capsuleTopPadding: 12,
      headerRowMinHeight: 70,
      bottomOffset: 0,
      listHeight: 0,
      showAddMenu: false,
      selectedBubble: 1,
      bubbles: [
        { id: 1, short: '城', color: '#2563EB', unread: 4 },
        { id: 2, short: '摄', color: '#0F766E', unread: 2 },
        { id: 3, short: '展', color: '#C2410C', unread: 0 },
        { id: 4, short: '友', color: '#7C3AED', unread: 1 }
      ],
      messageData: {
        1: [
          { id: 'c1', name: '成都城市漫游', preview: '周六的街巷摄影路线已经更新', time: '09:42', unread: 3, avatar: '成', avatarBg: 'linear-gradient(145deg,#60a5fa,#2563eb)' },
          { id: 'c2', name: '亚新大厦 · 同地点', preview: '阿岚：楼下的新展今天开幕', time: '08:16', unread: 1, avatar: '亚', avatarBg: 'linear-gradient(145deg,#fdba74,#ea580c)' },
          { id: 'c3', name: '地图共建审核', preview: '你提交的地标已通过 3 人确认', time: '昨天', unread: 0, avatar: '图', avatarBg: 'linear-gradient(145deg,#86efac,#16a34a)' },
          { id: 'c4', name: '栗子', preview: '收藏了你的「春熙路夜游」', time: '周二', unread: 0, avatar: '栗', avatarBg: 'linear-gradient(145deg,#c4b5fd,#7c3aed)' }
        ],
        2: [
          { id: 'p1', name: '成都街拍小组', preview: '本周主题：雨后的城市倒影', time: '10:20', unread: 2, avatar: '摄', avatarBg: 'linear-gradient(145deg,#5eead4,#0f766e)' },
          { id: 'p2', name: '光影记录者', preview: '分享了一条新的拍摄路线', time: '昨天', unread: 0, avatar: '光', avatarBg: 'linear-gradient(145deg,#93c5fd,#1d4ed8)' }
        ],
        3: [{ id: 'e1', name: '城市艺术展', preview: '报名成功，入场码已生成', time: '11:05', unread: 0, avatar: '展', avatarBg: 'linear-gradient(145deg,#fdba74,#c2410c)' }],
        4: [{ id: 'f1', name: '新的朋友', preview: '小满通过地点频道关注了你', time: '昨天', unread: 1, avatar: '友', avatarBg: 'linear-gradient(145deg,#d8b4fe,#7c3aed)' }]
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

      try {
        const capsule = typeof uni.getMenuButtonBoundingClientRect === 'function'
          ? uni.getMenuButtonBoundingClientRect()
          : null
        const windowWidth = Number((info && (info.windowWidth || info.screenWidth)) || 0)
        if (capsule && windowWidth > 0 && Number(capsule.left) > 0) {
          this.capsuleRightInset = Math.max(20, Math.round(windowWidth - Number(capsule.left) + 8))
          const capsuleTop = Number(capsule.top)
          const capsuleHeight = Number(capsule.height) || 44
          if (Number.isFinite(capsuleTop)) {
            this.capsuleTopPadding = Math.max(
              4,
              Math.round(capsuleTop - this.topOffset + ((capsuleHeight - 44) / 2))
            )
            this.headerRowMinHeight = this.capsuleTopPadding + 44 + 14
          }
        }
      } catch (e2) {
        this.capsuleRightInset = 20
      }

      const tabMetrics = uni.getStorageSync('TABBAR_METRICS') || null
      if (tabMetrics && typeof tabMetrics.tabHeightPx === 'number') {
        this.bottomOffset = tabMetrics.tabHeightPx
      } else {
        this.bottomOffset = 64
      }
    } catch (e) {
      this.topOffset = 20
      this.bottomOffset = 64
    }
  },
  onReady() {
    try {
      const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
      const winH = (info && (info.windowHeight || (info.safeArea && info.safeArea.height))) || 0
      const q = uni.createSelectorQuery().in(this)
      q.select('.page-heading').boundingClientRect()
      q.select('.search-container').boundingClientRect()
      q.select('.function-blocks').boundingClientRect()
      q.exec(res => {
        const headingH = (res && res[0] && res[0].height) ? res[0].height : 0
        const searchH = (res && res[1] && res[1].height) ? res[1].height : 0
        const blocksH = (res && res[2] && res[2].height) ? res[2].height : 0
        const calc = Math.round(winH - this.topOffset - headingH - searchH - blocksH - this.bottomOffset)
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
    openMessageSearch() { uni.navigateTo({ url: '/pages/message-search/index' }) },
    openChannelMap() { uni.navigateTo({ url: '/pages/channel-map/index' }) },
    openChat(message) { uni.navigateTo({ url: `/pages/chat/index?name=${encodeURIComponent(message.name || '')}` }) },
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
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  padding-top: 0;
  position: relative;
  overscroll-behavior-y: none;
}
.page-heading { display:none; }
.page-title { display:block; font-size:26px; line-height:1.2; font-weight:750; color:#0f172a; }.page-subtitle { display:block; margin-top:3px; font-size:12px; color:#64748b; }

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
  padding: 12px 20px 14px;
  display: flex;
  gap: 10px;
  background: #f8fafc;
  min-height: 70px;
  align-items: flex-start;
}

.search-bar {
  flex: 1;
  min-width: 0;
  height: 44px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 22px;
  display: flex;
  align-items: center;
  padding: 0 15px;
  gap: 8px;
}

.search-icon { position:relative; width:15px; height:15px; border:2px solid #64748b; border-radius:50%; box-sizing:border-box; }
.search-icon::after { content:''; position:absolute; right:-5px; bottom:-2px; width:6px; height:2px; background:#64748b; border-radius:2px; transform:rotate(45deg); }

.search-placeholder {
  color: #94a3b8;
  font-size: 14px;
}

.add-btn {
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-icon {
  color: #c2410c;
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
  padding-right: 10px;
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
  gap: 8px;
  padding: 0 20px 16px;
  background: #f8fafc;
}

.block {
  flex: 1;
  min-height: 92px;
  background: #fff;
  border: 1px solid #eef2f7;
  border-radius: 16px;
  display: flex;
  flex-direction:column;
  align-items: flex-start;
  justify-content: center;
  padding:10px;
  box-shadow:0 4px 14px rgba(15,23,42,.04);
}
.block-icon { position:relative; width:28px; height:28px; margin-bottom:8px; border-radius:9px; background:#eff6ff; }.block-follow .block-icon{background:#ecfdf5}.block-reaction .block-icon{background:#fff7ed}
.channel-icon::before,.channel-icon::after,.channel-icon view { content:''; position:absolute; left:7px; width:14px; height:3px; border:1.5px solid #2563eb; border-radius:3px; box-sizing:border-box; }.channel-icon::before{top:7px}.channel-icon view{top:12px}.channel-icon::after{top:17px}
.people-icon::before,.people-icon::after { content:''; position:absolute; border-radius:50%; background:#059669; }.people-icon::before{width:8px;height:8px;left:10px;top:6px}.people-icon::after{width:16px;height:8px;left:6px;top:15px;border-radius:8px 8px 4px 4px}
.heart-icon::before { content:''; position:absolute; width:13px; height:13px; left:8px; top:7px; background:#ea580c; transform:rotate(45deg); border-radius:2px 7px 2px 7px; }

.block-title {
  font-size: 12px;
  color: #0f172a;
  font-weight:650;
  white-space:nowrap;
}
.block-meta { font-size:10px; color:#94a3b8; white-space:nowrap; }

/* 主要内容区域 */
.main-content {
  flex: 1;
  display: flex;
  background: #fff;
  margin: 0;
  border-radius: 22px 22px 0 0;
  overflow: visible;
}

/* 左侧气泡列表 */
.bubble-list {
  width: 70px;
  background: #f8fafc;
  padding: 16px 10px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  border-right: 1px solid #eef2f7;
}

.bubble-item {
  width: 48px;
  height: 48px;
  border-radius: 16px;
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
  border-color: #fff;
  box-shadow:0 0 0 2px #ea580c,0 6px 14px rgba(15,23,42,.12);
  transform: scale(1.03);
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
.bubble-badge { position:absolute; right:-5px; top:-5px; min-width:18px; height:18px; padding:0 4px; border:2px solid #fff; border-radius:9px; background:#ef4444; color:#fff; font-size:9px; line-height:14px; text-align:center; }

/* 右侧消息列表 */
.message-list {
  flex: 1;
  padding: 6px 12px;
  /* 高度由内联样式控制，确保底部不越过TabBar */
  background: white;
  overscroll-behavior-y: contain;
  -webkit-overflow-scrolling: touch;
}

.message-item-container {
  height: 76px;
  width: 100%;
  border-bottom: 1px solid #f1f5f9;
  background: white;
  margin-bottom: 5px;
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
}

.message-avatar {
  width: 48px;
  height: 48px;
  border-radius: 15px;
  flex-shrink: 0;
  position: relative;
  z-index: 3;
}
.message-avatar { display:flex; align-items:center; justify-content:center; color:#fff; }.message-avatar text{font-size:16px;font-weight:750;color:#fff}

.message-slide-area {
  flex: 1;
  height: 64px;
  overflow: hidden;
  position: relative;
}

.message-content-wrapper {
  display: flex;
  width: 100%;
  height: 100%;
  transition: transform 0.3s ease;
  position: relative;
  z-index: 2;
}

.message-placeholder {
  width: 100%;
  height: 64px;
  background: #fff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  flex-shrink: 0;
  box-sizing: border-box;
}

.message-copy{width:100%;min-width:0}.message-title-row,.message-preview-row{display:flex;align-items:center;gap:8px}.message-name{min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:15px;font-weight:650;color:#0f172a}.message-time{font-size:10px;color:#94a3b8}.message-preview-row{margin-top:5px}.message-preview{min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;color:#64748b}.unread-dot{min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:#ea580c;color:#fff;font-size:9px;line-height:18px;text-align:center}

/* 操作按钮紧跟在灰色框后面 */
.swipe-actions {
  position: absolute;
  left: 100%;
  top: 0;
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

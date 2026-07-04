<template>
  <view class="message-page">
    <!-- 顶部占位：使用自定义导航栏总高度（状态栏+导航栏） -->
    <view class="status-bar" :style="{ height: topOffset + 'px' }"></view>

    <!-- 搜索栏 -->
    <view class="search-container">
      <view class="search-bar">
        <text class="search-icon">🔍</text>
        <text class="search-placeholder">搜索消息/联系人</text>
      </view>
      <view class="add-btn" @click="showAddMenu = !showAddMenu">
        <text class="add-icon">+</text>
      </view>
    </view>

    <!-- 添加菜单浮层 -->
    <view
      v-if="showAddMenu"
      class="add-menu-overlay"
      :style="{ paddingTop: (topOffset + 52) + 'px' }"
      @click="showAddMenu = false"
    >
      <view class="add-menu" @click.stop>
        <view class="menu-item" @click="addFriend">
          <text class="menu-icon">👤</text>
          <text class="menu-text">添加朋友</text>
        </view>
        <view class="menu-item" @click="createGroup">
          <text class="menu-icon">👥</text>
          <text class="menu-text">发起群聊</text>
        </view>
        <view class="menu-item" @click="scanQR">
          <text class="menu-icon">📷</text>
          <text class="menu-text">扫一扫</text>
        </view>
        <view class="menu-item" @click="createChannel">
          <text class="menu-icon">🔔</text>
          <text class="menu-text">创建频道</text>
        </view>
        <view class="menu-item" @click="nearbyPeople">
          <text class="menu-icon">📍</text>
          <text class="menu-text">附近的人</text>
        </view>
      </view>
    </view>

    <!-- 三个Tab切换栏 -->
    <view class="tab-bar">
      <view
        v-for="(tab, index) in tabs"
        :key="index"
        class="tab-item"
        :class="{ active: activeTab === index }"
        @click="switchTab(index)"
      >
        <text class="tab-text">{{ tab }}</text>
      </view>
      <view class="tab-indicator" :style="{ transform: 'translateX(' + (activeTab * 100) + '%)' }">
        <view class="indicator-line"></view>
      </view>
    </view>

    <!-- 主要内容区域 -->
    <view class="main-content">
      <!-- 左侧气泡频道栏 -->
      <view class="bubble-list" :style="{ height: listHeight + 'px' }">
        <scroll-view class="bubble-scroll" scroll-y show-scrollbar="false">
          <!-- 固定频道 -->
          <view
            v-for="bubble in currentTabData.fixed"
            :key="'fixed-' + bubble.id"
            class="bubble-item"
            :class="{ active: selectedBubble === bubble.id }"
            :style="{ backgroundColor: bubble.color }"
            @click="selectBubble(bubble.id)"
          >
            <text v-if="bubble.pinned" class="bubble-pin">📌</text>
            <text class="bubble-icon">{{ bubble.icon }}</text>
            <view v-if="bubble.unread" class="bubble-badge">
              <text class="badge-text">{{ bubble.unread > 99 ? '99+' : bubble.unread }}</text>
            </view>
            <text v-if="bubble.muted" class="bubble-muted">🔇</text>
            <view v-if="selectedBubble === bubble.id" class="bubble-bar"></view>
          </view>

          <!-- 分割线 + 用户频道（可拖拽，仅Tab1） -->
          <template v-if="currentTabData.user.length">
            <view class="bubble-divider"></view>
            <view
              v-for="(bubble, index) in currentTabData.user"
              :key="'user-' + bubble.id"
              class="bubble-item draggable"
              :class="{ active: selectedBubble === bubble.id, dragging: dragIndex === index }"
              :style="{
                backgroundColor: bubble.color,
                transform: dragIndex === index
                  ? `translateY(${dragOffset}px) scale(1.1)`
                  : (selectedBubble === bubble.id ? 'scale(1.1)' : 'none')
              }"
              @click="selectBubble(bubble.id)"
              @touchstart="startDrag($event, index)"
              @touchmove="onDrag($event)"
              @touchend="endDrag"
            >
              <text v-if="bubble.pinned" class="bubble-pin">📌</text>
              <text class="bubble-icon">{{ bubble.icon }}</text>
              <view v-if="bubble.unread" class="bubble-badge">
                <text class="badge-text">{{ bubble.unread > 99 ? '99+' : bubble.unread }}</text>
              </view>
              <text v-if="bubble.muted" class="bubble-muted">🔇</text>
              <view v-if="selectedBubble === bubble.id" class="bubble-bar"></view>
            </view>
          </template>
        </scroll-view>

        <!-- 底部固定频道 -->
        <template v-if="currentTabData.bottom.length">
          <view class="bubble-divider"></view>
          <view
            v-for="bubble in currentTabData.bottom"
            :key="'bottom-' + bubble.id"
            class="bubble-item bottom"
            :class="{ active: selectedBubble === bubble.id }"
            :style="{ backgroundColor: bubble.color }"
            @click="selectBubble(bubble.id)"
          >
            <text class="bubble-icon">{{ bubble.icon }}</text>
            <view v-if="selectedBubble === bubble.id" class="bubble-bar"></view>
          </view>
        </template>
      </view>

      <!-- 右侧消息列表 -->
      <scroll-view
        class="message-list"
        scroll-y
        show-scrollbar="false"
        scroll-with-animation
        refresher-enabled
        :refresher-triggered="isRefreshing"
        @refresherrefresh="onRefresh"
        :style="{ height: listHeight + 'px' }"
      >
        <!-- 刷新提示条 -->
        <view v-if="refreshTip" class="refresh-tip">{{ refreshTip }}</view>

        <!-- 空状态 -->
        <view v-if="currentMessages.length === 0" class="empty-state">
          <text class="empty-icon">✉️</text>
          <text class="empty-text">暂无消息</text>
          <view class="empty-btn">去发现看看 ></view>
        </view>

        <!-- 消息项列表 -->
        <view
          v-for="(message, index) in currentMessages"
          :key="(selectedBubble) + '-' + index"
          class="message-item-container"
          @touchstart="startSwipe($event, index)"
          @touchmove="onSwipe($event)"
          @touchend="endSwipe"
          @longpress="onMessageLongPress(index)"
        >
          <!-- 头像固定不动 -->
          <view class="message-avatar" :style="{ backgroundColor: message.avatar }">
            <text class="avatar-text">{{ message.name.charAt(0) }}</text>
          </view>

          <!-- 可滑动的内容区域（消息内容 + 操作按钮） -->
          <view class="message-slide-area">
            <view
              class="message-content-wrapper"
              :style="{ transform: swipeIndex === index ? `translateX(${swipeOffset}px)` : 'translateX(0)' }"
            >
              <!-- 消息内容 -->
              <view class="message-content">
                <view class="msg-top">
                  <text class="msg-name">{{ message.name }}</text>
                  <text class="msg-time">{{ message.time }}</text>
                </view>
                <view class="msg-bottom">
                  <text class="msg-preview">{{ message.preview }}</text>
                  <view class="msg-right">
                    <text v-if="message.muted" class="msg-muted">🔕</text>
                    <view v-if="message.actionBtn" class="msg-action-btn" @click.stop="onActionBtn(index)">
                      <text class="action-btn-text">{{ message.actionBtn }}</text>
                    </view>
                    <view v-else-if="message.unread" class="msg-unread">
                      <text class="unread-text">{{ message.unread > 99 ? '99+' : message.unread }}</text>
                    </view>
                  </view>
                </view>
              </view>

              <!-- 左滑操作按钮 -->
              <view class="swipe-actions">
                <view class="action-btn pin-btn" @click.stop="pinMessage(index)">
                  <text class="action-text">置顶</text>
                </view>
                <view class="action-btn unread-btn" @click.stop="markUnread(index)">
                  <text class="action-text">未读</text>
                </view>
                <view class="action-btn delete-btn" @click.stop="deleteMessage(index)">
                  <text class="action-text">删除</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 长按底部操作菜单 -->
    <view v-if="showActionSheet" class="action-sheet-overlay" @click="closeActionSheet">
      <view class="action-sheet" @click.stop>
        <view class="sheet-item" @click="sheetPin">置顶会话</view>
        <view class="sheet-item" @click="sheetUnread">标为未读</view>
        <view class="sheet-item" @click="sheetMute">消息免打扰</view>
        <view class="sheet-item" @click="sheetStar">设为特别关注</view>
        <view class="sheet-item danger" @click="sheetDelete">删除会话</view>
        <view class="sheet-cancel" @click="closeActionSheet">取消</view>
      </view>
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
      activeTab: 0,
      tabs: ['频道与朋友', '关注与粉丝', '点赞与评论'],
      selectedBubble: 'notice',
      // Tab1 - 频道与朋友
      tab1: {
        fixed: [
          { id: 'notice', icon: '🔔', name: '消息通知', color: '#007AFF', unread: 3, pinned: true },
          { id: 'nearby', icon: '📍', name: '附近动态', color: '#34C759', unread: 5, pinned: true }
        ],
        user: [
          { id: 'city', icon: '🏙', name: '城市探店', color: '#FF9500', unread: 2 },
          { id: 'outdoor', icon: '🏃', name: '户外运动', color: '#FF3B30', muted: true },
          { id: 'food', icon: '🍜', name: '美食分享', color: '#AF52DE', unread: 99 },
          { id: 'photo', icon: '📷', name: '摄影交流', color: '#5AC8FA' }
        ],
        bottom: [
          { id: 'more', icon: '➕', name: '更多频道', color: '#999999' }
        ]
      },
      // Tab2 - 关注与粉丝
      tab2: {
        fixed: [
          { id: 'follow', icon: '👤', name: '关注', color: '#007AFF', unread: 1 },
          { id: 'fans', icon: '👥', name: '粉丝', color: '#34C759' },
          { id: 'newfans', icon: '🆕', name: '新粉丝', color: '#FF9500', unread: 4 }
        ],
        user: [],
        bottom: []
      },
      // Tab3 - 点赞与评论
      tab3: {
        fixed: [
          { id: 'like', icon: '❤️', name: '点赞', color: '#FF3B30', unread: 8 },
          { id: 'comment', icon: '💬', name: '评论', color: '#007AFF', unread: 3 },
          { id: 'atme', icon: '📢', name: '@我', color: '#FF9500', unread: 1 }
        ],
        user: [],
        bottom: []
      },
      // 消息数据（按气泡id索引）
      messageData: {
        notice: [
          { name: '系统通知', avatar: '#007AFF', time: '10:00', preview: '系统：您有一条新的活动通知', unread: 3 },
          { name: '服务助手', avatar: '#FF9500', time: '昨天', preview: '您的预约已确认，请准时到店', unread: 0 }
        ],
        nearby: [
          { name: '附近动态', avatar: '#34C759', time: '5分钟前', preview: '3条新动态，点击查看', unread: 5 }
        ],
        city: [
          { name: '城市探店', avatar: '#FF9500', time: '12:30', preview: '小王：推荐一家超赞的咖啡馆[图片]', unread: 2, pinned: true },
          { name: '美食分享群', avatar: '#AF52DE', time: '昨天', preview: '[语音 15"] 今晚火锅约吗', unread: 5, muted: true },
          { name: '张三', avatar: '#34C759', time: '昨天', preview: '[位置] 春熙路', unread: 0 },
          { name: '李四', avatar: '#007AFF', time: '周一', preview: '好的没问题', unread: 0 }
        ],
        outdoor: [],
        food: [],
        photo: [],
        more: [],
        follow: [
          { name: '小明', avatar: '#FF9500', time: '1小时前', preview: '发布了新内容：周末骑行日记', unread: 1 },
          { name: '旅行达人', avatar: '#AF52DE', time: '3小时前', preview: '发布了新内容：西藏自驾游攻略', unread: 0 }
        ],
        fans: [],
        newfans: [
          { name: '小红的吃货日记', avatar: '#FF2D92', time: '今天', preview: '关注了你，点击回关', unread: 4, actionBtn: '回关' }
        ],
        like: [
          { name: '小明', avatar: '#FF9500', time: '10分钟前', preview: '赞了你的动态：今天的咖啡馆探店', unread: 3 },
          { name: '阿强', avatar: '#34C759', time: '1小时前', preview: '赞了你的动态：周末爬山', unread: 5 }
        ],
        comment: [
          { name: '旅行达人', avatar: '#AF52DE', time: '30分钟前', preview: '评论：这家店我也去过，确实不错！', unread: 3 }
        ],
        atme: [
          { name: '小王', avatar: '#5AC8FA', time: '2小时前', preview: '在评论里@了你：@你看看这个', unread: 1 }
        ]
      },
      // 拖拽相关数据（仅Tab1用户频道）
      dragIndex: -1,
      dragOffset: 0,
      startY: 0,
      isDragging: false,
      // 左滑相关数据
      swipeIndex: -1,
      swipeOffset: 0,
      startX: 0,
      isSwipping: false,
      // 长按操作菜单
      showActionSheet: false,
      actionSheetTarget: -1,
      // 下拉刷新
      isRefreshing: false,
      refreshTip: ''
    }
  },
  computed: {
    currentTabData() {
      return this['tab' + (this.activeTab + 1)]
    },
    currentMessages() {
      return this.messageData[this.selectedBubble] || []
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
      q.select('.tab-bar').boundingClientRect()
      q.exec(res => {
        const searchH = (res && res[0] && res[0].height) ? res[0].height : 0
        const tabH = (res && res[1] && res[1].height) ? res[1].height : 0
        const calc = Math.round(winH - this.topOffset - searchH - tabH - this.bottomOffset)
        this.listHeight = Math.max(120, calc)
      })
    } catch (e) {
      // 回退：给一个保守高度，避免滚动区域撑到TabBar
      this.listHeight = 500
    }
  },
  methods: {
    // Tab切换
    switchTab(index) {
      if (this.activeTab === index) return
      this.activeTab = index
      const tabData = this['tab' + (index + 1)]
      const first = tabData.fixed[0] || tabData.user[0] || tabData.bottom[0]
      if (first) this.selectedBubble = first.id
      this.resetSwipe()
    },
    // 气泡选择
    selectBubble(bubbleId) {
      if (!this.isDragging) {
        this.selectedBubble = bubbleId
        this.resetSwipe()
      }
    },
    // 添加菜单项
    addFriend() { this.showAddMenu = false },
    createGroup() { this.showAddMenu = false },
    scanQR() { this.showAddMenu = false },
    createChannel() { this.showAddMenu = false },
    nearbyPeople() { this.showAddMenu = false },
    // 消息项操作按钮（如"回关"）
    onActionBtn(index) {
      // 此处可扩展回关逻辑
    },
    // ===== 拖拽排序（仅Tab1用户频道） =====
    startDrag(event, index) {
      if (this.activeTab !== 0) return
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
      event.preventDefault()
    },
    endDrag() {
      if (this.dragIndex === -1) return
      const itemHeight = 65 // 气泡项高度 + 间距
      const targetIndex = Math.round(this.dragOffset / itemHeight)
      const newIndex = Math.max(0, Math.min(this.tab1.user.length - 1, this.dragIndex + targetIndex))
      if (newIndex !== this.dragIndex) {
        const draggedItem = this.tab1.user[this.dragIndex]
        const newArr = [...this.tab1.user]
        newArr.splice(this.dragIndex, 1)
        newArr.splice(newIndex, 0, draggedItem)
        this.tab1.user = newArr
      }
      this.dragIndex = -1
      this.dragOffset = 0
      // 延迟重置isDragging，避免点击事件触发
      setTimeout(() => {
        this.isDragging = false
      }, 100)
    },
    // ===== 左滑操作 =====
    startSwipe(event, index) {
      // 如果其他消息项正在滑动，先重置
      if (this.swipeIndex !== -1 && this.swipeIndex !== index) {
        this.resetSwipe()
      }
      this.swipeIndex = index
      this.startX = event.touches[0].clientX
      this.swipeOffset = 0
      this.isSwipping = false
    },
    onSwipe(event) {
      if (this.swipeIndex === -1) return
      const currentX = event.touches[0].clientX
      const deltaX = currentX - this.startX
      // 只允许向左滑动
      if (deltaX < 0) {
        this.swipeOffset = Math.max(deltaX, -180) // 最大滑动距离180px
        this.isSwipping = true
        event.preventDefault()
      }
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
    // 左滑操作方法
    pinMessage(index) {
      this.resetSwipe()
    },
    markUnread(index) {
      this.resetSwipe()
    },
    deleteMessage(index) {
      const list = [...(this.messageData[this.selectedBubble] || [])]
      list.splice(index, 1)
      this.messageData[this.selectedBubble] = list
      this.resetSwipe()
    },
    // ===== 长按底部菜单 =====
    onMessageLongPress(index) {
      this.actionSheetTarget = index
      this.showActionSheet = true
      this.resetSwipe()
    },
    closeActionSheet() {
      this.showActionSheet = false
      this.actionSheetTarget = -1
    },
    sheetPin() { this.closeActionSheet() },
    sheetUnread() { this.closeActionSheet() },
    sheetMute() { this.closeActionSheet() },
    sheetStar() { this.closeActionSheet() },
    sheetDelete() {
      if (this.actionSheetTarget >= 0) {
        const list = [...(this.messageData[this.selectedBubble] || [])]
        list.splice(this.actionSheetTarget, 1)
        this.messageData[this.selectedBubble] = list
      }
      this.closeActionSheet()
    },
    // ===== 下拉刷新 =====
    onRefresh() {
      this.isRefreshing = true
      setTimeout(() => {
        this.isRefreshing = false
        this.refreshTip = '3条新消息'
        setTimeout(() => { this.refreshTip = '' }, 2000)
      }, 1000)
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
  }
}
</script>

<style scoped>
.message-page {
  height: 100vh;
  background: #f8f9fa;
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

/* ===== 搜索栏 ===== */
.search-container {
  padding: 10rpx 20rpx 16rpx 20rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: #f8f9fa;
}

.search-bar {
  flex: 1;
  height: 64rpx;
  background: #e8e8ea;
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  padding: 0 24rpx;
  gap: 12rpx;
}

.search-icon {
  font-size: 28rpx;
  opacity: 0.7;
}

.search-placeholder {
  color: #999;
  font-size: 26rpx;
}

.add-btn {
  width: 64rpx;
  height: 64rpx;
  background: #e8e8ea;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.add-icon {
  color: #333;
  font-size: 36rpx;
  font-weight: bold;
}

/* ===== 添加菜单浮层 ===== */
.add-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding-right: 20rpx;
}

.add-menu {
  background: #fff;
  border-radius: 16rpx;
  padding: 8rpx 0;
  width: 240rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.2);
}

.menu-item {
  padding: 24rpx 28rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-icon {
  font-size: 30rpx;
}

.menu-text {
  color: #333;
  font-size: 26rpx;
}

/* ===== Tab切换栏 ===== */
.tab-bar {
  display: flex;
  position: relative;
  background: #f8f9fa;
  border-bottom: 1rpx solid #ececec;
  padding: 8rpx 20rpx 0 20rpx;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 20rpx 0;
}

.tab-text {
  color: #999;
  font-size: 28rpx;
}

.tab-item.active .tab-text {
  color: #ff8a65;
  font-weight: bold;
}

.tab-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 33.33%;
  height: 6rpx;
  display: flex;
  justify-content: center;
  transition: transform 0.3s ease;
}

.indicator-line {
  width: 48rpx;
  height: 6rpx;
  background: #ff8a65;
  border-radius: 3rpx;
}

/* ===== 主要内容区域 ===== */
.main-content {
  flex: 1;
  display: flex;
  background: #fff;
  overflow: visible;
}

/* ===== 左侧气泡频道栏 ===== */
.bubble-list {
  width: 90rpx;
  background: #fff;
  display: flex;
  flex-direction: column;
  border-right: 1rpx solid #ececec;
  flex-shrink: 0;
}

.bubble-scroll {
  flex: 1;
  padding: 16rpx 0;
}

.bubble-item {
  width: 70rpx;
  height: 70rpx;
  border-radius: 50%;
  margin: 16rpx 10rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3rpx solid transparent;
  transition: transform 0.2s ease;
  position: relative;
  z-index: 1;
}

.bubble-item.active {
  border-color: #333;
  transform: scale(1.15);
}

.bubble-item.dragging {
  z-index: 10;
  opacity: 0.85;
  transition: none;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.3);
}

.bubble-icon {
  font-size: 34rpx;
  pointer-events: none;
}

.bubble-pin {
  position: absolute;
  top: -10rpx;
  left: -8rpx;
  font-size: 20rpx;
  z-index: 2;
}

.bubble-badge {
  position: absolute;
  top: -12rpx;
  right: -12rpx;
  min-width: 28rpx;
  height: 28rpx;
  padding: 0 6rpx;
  background: #FF3B30;
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid #fff;
  z-index: 2;
}

.badge-text {
  color: #fff;
  font-size: 18rpx;
  font-weight: bold;
  line-height: 1;
}

.bubble-muted {
  position: absolute;
  bottom: -6rpx;
  right: -6rpx;
  font-size: 18rpx;
  background: #fff;
  border-radius: 50%;
  width: 22rpx;
  height: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.bubble-bar {
  position: absolute;
  left: -10rpx;
  top: 6rpx;
  bottom: 6rpx;
  width: 6rpx;
  background: #ff8a65;
  border-radius: 3rpx;
  z-index: 2;
}

.bubble-divider {
  width: 30rpx;
  height: 1rpx;
  background: #ececec;
  margin: 8rpx auto;
}

/* ===== 右侧消息列表 ===== */
.message-list {
  flex: 1;
  background: #fff;
  overscroll-behavior-y: contain;
  -webkit-overflow-scrolling: touch;
}

.refresh-tip {
  background: #fff7e6;
  color: #ff8a65;
  text-align: center;
  padding: 16rpx 0;
  font-size: 24rpx;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 160rpx 0 0 0;
}

.empty-icon {
  font-size: 96rpx;
  margin-bottom: 24rpx;
  opacity: 0.6;
}

.empty-text {
  color: #999;
  font-size: 28rpx;
  margin-bottom: 32rpx;
}

.empty-btn {
  color: #ff8a65;
  font-size: 26rpx;
  padding: 16rpx 40rpx;
  border: 1rpx solid #ff8a65;
  border-radius: 32rpx;
}

/* 消息项 */
.message-item-container {
  height: 130rpx;
  width: 100%;
  border-bottom: 1rpx solid #f0f0f0;
  background: #fff;
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding-left: 20rpx;
}

.message-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 8rpx;
  flex-shrink: 0;
  position: relative;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-text {
  color: #fff;
  font-size: 32rpx;
  font-weight: bold;
}

.message-slide-area {
  flex: 1;
  height: 100rpx;
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

.message-content {
  width: 100%;
  height: 100%;
  background: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-right: 20rpx;
  flex-shrink: 0;
  box-sizing: border-box;
}

.msg-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8rpx;
}

.msg-name {
  color: #333;
  font-size: 30rpx;
  font-weight: bold;
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.msg-time {
  color: #999;
  font-size: 22rpx;
  flex-shrink: 0;
  margin-left: 16rpx;
}

.msg-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.msg-preview {
  color: #999;
  font-size: 24rpx;
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.msg-right {
  display: flex;
  align-items: center;
  gap: 8rpx;
  flex-shrink: 0;
  margin-left: 16rpx;
}

.msg-muted {
  font-size: 24rpx;
  opacity: 0.7;
}

.msg-action-btn {
  background: #ff8a65;
  border-radius: 24rpx;
  padding: 6rpx 20rpx;
}

.action-btn-text {
  color: #fff;
  font-size: 22rpx;
}

.msg-unread {
  min-width: 32rpx;
  height: 32rpx;
  padding: 0 8rpx;
  background: #FF3B30;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.unread-text {
  color: #fff;
  font-size: 20rpx;
  font-weight: bold;
  line-height: 1;
}

/* 左滑操作按钮 */
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
  color: #fff;
  font-size: 24rpx;
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
  color: #fff;
  font-size: 24rpx;
  font-weight: 500;
}

/* ===== 长按底部操作菜单 ===== */
.action-sheet-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  display: flex;
  align-items: flex-end;
}

.action-sheet {
  width: 100%;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  padding-bottom: env(safe-area-inset-bottom);
}

.sheet-item {
  padding: 30rpx 0;
  text-align: center;
  color: #333;
  font-size: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.sheet-item.danger {
  color: #FF3B30;
}

.sheet-cancel {
  margin-top: 16rpx;
  padding: 30rpx 0;
  text-align: center;
  color: #999;
  font-size: 30rpx;
  border-top: 8rpx solid #f5f5f5;
}
</style>

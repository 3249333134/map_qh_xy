<template>
  <view class="message-page">
    <view class="status-bar" :style="{ height: topOffset + 'px' }"></view>

    <view class="top-area" :style="{ paddingRight: rightPadding + 'rpx' }">
      <view class="search-bar" :class="{ active: isSearching }" @click="enterSearch">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="#9A9A9A" stroke-width="2" stroke-linecap="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          v-if="isSearching"
          class="search-input"
          v-model="searchKeyword"
          focus
          placeholder="搜索消息/联系人"
          confirm-type="search"
        />
        <text v-else class="search-placeholder">搜索消息/联系人</text>
        <view v-if="searchKeyword" class="clear-search" @click.stop="searchKeyword = ''">
          <svg viewBox="0 0 16 16" fill="none" stroke="#999" stroke-width="1.8" stroke-linecap="round">
            <line x1="4" y1="4" x2="12" y2="12"></line>
            <line x1="12" y1="4" x2="4" y2="12"></line>
          </svg>
        </view>
      </view>
      <text v-if="isSearching" class="cancel-search" @click="leaveSearch">取消</text>
      <template v-else>
        <view class="round-tool" @click="showAddMenu = !showAddMenu">
          <svg viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" stroke-linecap="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </view>
        <view class="more-dots" @click="showAddMenu = !showAddMenu">
          <svg viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="4" r="1.6" fill="#6C6C6C"></circle>
            <circle cx="10" cy="10" r="1.6" fill="#6C6C6C"></circle>
            <circle cx="10" cy="16" r="1.6" fill="#6C6C6C"></circle>
          </svg>
        </view>
        <view class="user-entry" @click="showToast('联系人资料')">
          <svg viewBox="0 0 24 24" fill="none" stroke="#777" stroke-width="1.7" stroke-linecap="round">
            <circle cx="12" cy="8" r="4"></circle>
            <path d="M5 21v-1c0-3.2 3.1-5.8 7-5.8s7 2.6 7 5.8v1"></path>
          </svg>
        </view>
      </template>
    </view>

    <view v-if="showAddMenu" class="add-menu-mask" :style="{ paddingTop: (topOffset + 56) + 'px' }" @click="showAddMenu = false">
      <view class="add-menu" @click.stop>
        <view v-for="item in addActions" :key="item.label" class="menu-item" @click="onAddAction(item.label)">
          <svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="1.8" stroke-linecap="round" v-html="item.icon"></svg>
          <text>{{ item.label }}</text>
        </view>
      </view>
    </view>

    <view v-if="!isSearching" class="tab-bar">
      <view
        v-for="(tab, index) in tabs"
        :key="tab"
        class="tab-item"
        :class="{ active: activeTab === index }"
        @click="switchTab(index)"
      >
        <text>{{ tab }}</text>
      </view>
      <view class="tab-indicator" :style="{ transform: 'translateX(' + activeTab * 100 + '%)' }">
        <view class="indicator-line"></view>
      </view>
    </view>

    <view v-if="isSearching" class="search-panel" :style="{ height: searchHeight + 'px' }">
      <view v-if="!searchKeyword" class="search-hints">
        <text class="section-title">最近搜索</text>
        <view class="hint-tags">
          <text v-for="item in recentSearches" :key="item" class="hint-tag" @click="searchKeyword = item">{{ item }}</text>
        </view>
      </view>
      <view v-else-if="searchResults.length" class="search-results">
        <view v-for="item in searchResults" :key="item.id" class="result-item" @click="openConversation(item)">
          <view class="result-avatar" :style="{ background: item.avatarColor }">
            <text>{{ item.avatarText }}</text>
          </view>
          <view class="result-copy">
            <text class="result-name">{{ item.name }}</text>
            <text class="result-preview">{{ item.preview }}</text>
          </view>
          <text class="result-time">{{ item.time }}</text>
        </view>
      </view>
      <view v-else class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="#C9C9C9" stroke-width="1.4" stroke-linecap="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <text class="empty-title">没有找到相关消息</text>
        <text class="empty-desc">换个关键词试试看</text>
      </view>
    </view>

    <view v-else class="main-content">
      <view class="channel-rail" :style="{ height: listHeight + 'px' }">
        <scroll-view class="channel-scroll" scroll-y show-scrollbar="false">
          <view
            v-for="channel in currentTabData.channels"
            :key="channel.id"
            class="channel-dot"
            :class="{ active: selectedBubble === channel.id, dragging: dragId === channel.id }"
            :style="{ background: channel.bgColor }"
            @click="selectBubble(channel.id)"
            @longpress="startChannelHint(channel)"
          >
            <view class="channel-icon" :style="{ color: channel.iconColor }">
              <svg v-if="channel.svgIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" v-html="channel.svgIcon"></svg>
              <text v-else>{{ channel.iconChar }}</text>
            </view>
            <view v-if="channel.unread" class="channel-badge">
              <text>{{ channel.unread > 99 ? '99+' : channel.unread }}</text>
            </view>
            <view v-if="selectedBubble === channel.id" class="channel-active-bar"></view>
          </view>
        </scroll-view>
        <view class="rail-add" @click="showToast('添加频道')">
          <svg viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2" stroke-linecap="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </view>
      </view>

      <scroll-view
        class="conversation-list"
        scroll-y
        refresher-enabled
        :refresher-triggered="isRefreshing"
        @refresherrefresh="onRefresh"
        :style="{ height: listHeight + 'px' }"
        show-scrollbar="false"
      >
        <view v-if="refreshTip" class="refresh-tip">{{ refreshTip }}</view>

        <view v-if="currentMessages.length === 0" class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="#C9C9C9" stroke-width="1.4" stroke-linecap="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"></path>
          </svg>
          <text class="empty-title">暂无消息</text>
          <view class="empty-action" @click="showToast('去发现看看')">去发现看看</view>
        </view>

        <view
          v-for="(message, index) in currentMessages"
          :key="message.id"
          class="conversation-row"
          :class="{ pinned: message.pinned }"
          @touchstart="startSwipe($event, index)"
          @touchmove="onSwipe($event)"
          @touchend="endSwipe"
          @longpress="onMessageLongPress(index)"
          @click="openConversation(message)"
        >
          <view class="conversation-avatar" :style="{ background: message.avatarColor }">
            <svg v-if="message.avatarIcon" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" v-html="message.avatarIcon"></svg>
            <text v-else>{{ message.avatarText }}</text>
          </view>
          <view class="slide-mask">
            <view class="slide-inner" :style="{ transform: swipeIndex === index ? 'translateX(' + swipeOffset + 'px)' : 'translateX(0)' }">
              <view class="conversation-main">
                <view class="conv-top">
                  <view class="conv-name-line">
                    <text v-if="message.pinned" class="pin-dot"></text>
                    <text class="conv-name">{{ message.name }}</text>
                    <text v-if="message.muted" class="muted-icon">免</text>
                  </view>
                  <text class="conv-time">{{ message.time }}</text>
                </view>
                <view class="conv-bottom">
                  <text class="conv-preview">{{ message.preview }}</text>
                  <view class="conv-right">
                    <view v-if="message.actionBtn" class="inline-action" @click.stop="onInlineAction(index, message)">{{ message.actionBtn }}</view>
                    <view v-else-if="message.unread" class="unread-badge">{{ message.unread > 99 ? '99+' : message.unread }}</view>
                  </view>
                </view>
              </view>
              <view class="swipe-actions">
                <view class="swipe-btn pin" @click.stop="pinMessage(index)">置顶</view>
                <view class="swipe-btn read" @click.stop="markUnread(index)">{{ message.unread ? '已读' : '未读' }}</view>
                <view class="swipe-btn delete" @click.stop="deleteMessage(index)">删除</view>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <view v-if="showActionSheet" class="sheet-mask" @click="closeActionSheet">
      <view class="action-sheet" @click.stop>
        <view class="sheet-handle"></view>
        <view class="sheet-item" @click="sheetPin">置顶会话</view>
        <view class="sheet-item" @click="sheetUnread">标为未读</view>
        <view class="sheet-item" @click="sheetMute">消息免打扰</view>
        <view class="sheet-item" @click="sheetStar">设为特别关注</view>
        <view class="sheet-item danger" @click="sheetDelete">删除会话</view>
        <view class="sheet-cancel" @click="closeActionSheet">取消</view>
      </view>
    </view>

    <GlobalOverlayHost />
  </view>
</template>

<script>
import GlobalOverlayHost from '../../components/common/GlobalOverlayHost.vue'

const ICONS = {
  bell: '<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>',
  location: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>',
  mountain: '<path d="M3 20h18L14 7l-4 7-2-3-5 9z"/>',
  runner: '<circle cx="17" cy="4" r="2"/><path d="M15.5 13.5l2.5-2.5"/><path d="M8 21l3-7 3 2 4-5"/><path d="M6 14l3-5 4 2"/>',
  food: '<path d="M4 2v8a3 3 0 006 0V2"/><line x1="7" y1="2" x2="7" y2="11"/><path d="M20 2v20"/><path d="M16 2v8a4 4 0 004 4"/>',
  camera: '<path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 20v-1c0-3.31 3.58-6 8-6s8 2.69 8 6v1"/>',
  users: '<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 000-7.8z"/>',
  comment: '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>',
  at: '<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 006 0 10 10 0 10-4 8"/>',
  plusUser: '<path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>',
  scan: '<path d="M3 7V5a2 2 0 012-2h2"/><path d="M17 3h2a2 2 0 012 2v2"/><path d="M21 17v2a2 2 0 01-2 2h-2"/><path d="M7 21H5a2 2 0 01-2-2v-2"/>'
}

export default {
  components: { GlobalOverlayHost },
  data() {
    return {
      topOffset: 0,
      bottomOffset: 86,
      rightPadding: 180,
      listHeight: 520,
      searchHeight: 520,
      isSearching: false,
      searchKeyword: '',
      showAddMenu: false,
      showActionSheet: false,
      actionSheetTarget: -1,
      activeTab: 0,
      selectedBubble: 'notice',
      dragId: '',
      swipeIndex: -1,
      swipeOffset: 0,
      startX: 0,
      isSwipping: false,
      isRefreshing: false,
      refreshTip: '',
      tabs: ['频道与朋友', '关注与粉丝', '点赞与评论'],
      recentSearches: ['系统通知', '小王', '周末爬山'],
      addActions: [
        { label: '添加朋友', icon: ICONS.plusUser },
        { label: '发起群聊', icon: ICONS.users },
        { label: '扫一扫', icon: ICONS.scan },
        { label: '创建频道', icon: ICONS.bell },
        { label: '附近的人', icon: ICONS.location }
      ],
      tabData: [
        {
          channels: [
            { id: 'notice', svgIcon: ICONS.bell, bgColor: '#4A90D9', iconColor: '#fff', unread: 3 },
            { id: 'nearby', svgIcon: ICONS.location, bgColor: '#34C759', iconColor: '#fff', unread: 5 },
            { id: 'city', svgIcon: ICONS.mountain, bgColor: '#FF9500', iconColor: '#fff', unread: 2 },
            { id: 'outdoor', svgIcon: ICONS.runner, bgColor: '#FF3B30', iconColor: '#fff', unread: 100 },
            { id: 'food', svgIcon: ICONS.food, bgColor: '#AF52DE', iconColor: '#fff' },
            { id: 'photo', svgIcon: ICONS.camera, bgColor: '#5AC8FA', iconColor: '#fff' }
          ]
        },
        {
          channels: [
            { id: 'follow', svgIcon: ICONS.user, bgColor: '#4A90D9', iconColor: '#fff', unread: 1 },
            { id: 'fans', svgIcon: ICONS.users, bgColor: '#34C759', iconColor: '#fff' },
            { id: 'newfans', iconChar: '新', bgColor: '#FF9500', iconColor: '#fff', unread: 4 }
          ]
        },
        {
          channels: [
            { id: 'like', svgIcon: ICONS.heart, bgColor: '#FF6B6B', iconColor: '#fff', unread: 8 },
            { id: 'comment', svgIcon: ICONS.comment, bgColor: '#4A90D9', iconColor: '#fff', unread: 3 },
            { id: 'atme', svgIcon: ICONS.at, bgColor: '#FF9500', iconColor: '#fff', unread: 1 }
          ]
        }
      ],
      messageData: {
        notice: [
          { id: 'system', type: 'system_notice', name: '系统通知', avatarColor: '#4A90D9', avatarText: '系', time: '10:30', preview: '系统：您有一条新的活动通知', unread: 1, pinned: true },
          { id: 'assistant', type: 'assistant', name: '服务助手', avatarColor: '#FF9500', avatarText: '服', time: '09:15', preview: '您的预约已确认，请准时到店', unread: 1 },
          { id: 'friend-wang', type: 'direct', name: '小王', avatarColor: '#34C759', avatarText: '王', time: '昨天', preview: '好的，明天见！' },
          { id: 'food-group', type: 'group', name: '美食探店群', avatarColor: '#FF7F3F', avatarText: '群', time: '昨天', preview: '李明：这家店真的很推荐...', muted: true },
          { id: 'activity', type: 'system_notice', name: '活动通知', avatarColor: '#FF3B30', avatarText: '活', time: '周一', preview: '您参与的周末徒步活动已更新集合点' }
        ],
        nearby: [
          { id: 'nearby-1', type: 'channel', name: '附近动态', avatarColor: '#34C759', avatarText: '近', time: '5分钟前', preview: '3条新动态，点击查看', unread: 5, actionBtn: '查看' }
        ],
        city: [
          { id: 'city-1', type: 'channel', name: '城市探店', avatarColor: '#FF9500', avatarText: '探', time: '12:30', preview: '小王：推荐一家超赞的咖啡馆[图片]', unread: 2, pinned: true },
          { id: 'city-2', type: 'group', name: '美食分享群', avatarColor: '#AF52DE', avatarText: '美', time: '昨天', preview: '[语音 15\"] 今晚火锅约吗', unread: 5, muted: true },
          { id: 'city-3', type: 'direct', name: '张三', avatarColor: '#34C759', avatarText: '张', time: '昨天', preview: '[位置] 春熙路' }
        ],
        outdoor: [],
        food: [],
        photo: [],
        follow: [
          { id: 'follow-1', type: 'direct', name: '小明', avatarColor: '#FF9500', avatarText: '明', time: '1小时前', preview: '发布了新内容：周末骑行日记', unread: 1 },
          { id: 'follow-2', type: 'direct', name: '旅行达人', avatarColor: '#AF52DE', avatarText: '旅', time: '3小时前', preview: '发布了新内容：西藏自驾游攻略' }
        ],
        fans: [],
        newfans: [
          { id: 'fan-1', type: 'direct', name: '小红的吃货日记', avatarColor: '#FF2D92', avatarText: '吃', time: '今天', preview: '关注了你，点击回关', unread: 4, actionBtn: '回关' }
        ],
        like: [
          { id: 'like-1', type: 'direct', name: '小明', avatarColor: '#FF9500', avatarText: '明', time: '10分钟前', preview: '赞了你的动态：今天的咖啡馆探店', unread: 3 },
          { id: 'like-2', type: 'direct', name: '阿强', avatarColor: '#34C759', avatarText: '强', time: '1小时前', preview: '赞了你的动态：周末爬山', unread: 5 }
        ],
        comment: [
          { id: 'comment-1', type: 'direct', name: '旅行达人', avatarColor: '#AF52DE', avatarText: '旅', time: '30分钟前', preview: '评论：这家店我也去过，确实不错！', unread: 3 }
        ],
        atme: [
          { id: 'at-1', type: 'direct', name: '小王', avatarColor: '#5AC8FA', avatarText: '王', time: '2小时前', preview: '在评论里@了你：@你看看这个', unread: 1 }
        ]
      }
    }
  },
  computed: {
    currentTabData() {
      return this.tabData[this.activeTab]
    },
    currentMessages() {
      return this.messageData[this.selectedBubble] || []
    },
    allMessages() {
      return Object.keys(this.messageData).reduce((arr, key) => arr.concat(this.messageData[key]), [])
    },
    searchResults() {
      const keyword = this.searchKeyword.trim().toLowerCase()
      if (!keyword) return []
      return this.allMessages.filter(item => {
        return item.name.toLowerCase().includes(keyword) || item.preview.toLowerCase().includes(keyword)
      })
    }
  },
  created() {
    this.initMetrics()
  },
  onReady() {
    this.calcHeights()
  },
  onShow() {
    try {
      const tab = typeof this.getTabBar === 'function' ? this.getTabBar() : null
      if (tab && tab.setData) tab.setData({ selected: 3 })
    } catch (e) {}
  },
  methods: {
    initMetrics() {
      try {
        const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
        const statusPx = (info && ((info.safeAreaInsets && info.safeAreaInsets.top) || info.statusBarHeight || 0)) || 0
        this.topOffset = Math.max(statusPx - 6, 0)
        const metrics = uni.getStorageSync('TABBAR_METRICS') || null
        this.bottomOffset = metrics && metrics.tabHeightPx ? metrics.tabHeightPx : 86
        const menu = uni.getMenuButtonBoundingClientRect ? uni.getMenuButtonBoundingClientRect() : null
        if (menu) {
          const windowWidth = info.windowWidth || 375
          this.rightPadding = Math.round(Math.max(windowWidth - menu.left + 28, 90) * (750 / windowWidth))
        }
      } catch (e) {}
    },
    calcHeights() {
      try {
        const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
        const winH = info.windowHeight || 700
        const q = uni.createSelectorQuery().in(this)
        q.select('.top-area').boundingClientRect()
        q.select('.tab-bar').boundingClientRect()
        q.exec(res => {
          const topH = (res && res[0] && res[0].height) || 56
          const tabH = (res && res[1] && res[1].height) || 50
          this.listHeight = Math.max(220, Math.round(winH - this.topOffset - topH - tabH - this.bottomOffset))
          this.searchHeight = Math.max(220, Math.round(winH - this.topOffset - topH - this.bottomOffset))
        })
      } catch (e) {}
    },
    enterSearch() {
      this.isSearching = true
      this.resetSwipe()
      this.$nextTick(this.calcHeights)
    },
    leaveSearch() {
      this.isSearching = false
      this.searchKeyword = ''
      this.$nextTick(this.calcHeights)
    },
    switchTab(index) {
      if (this.activeTab === index) return
      this.activeTab = index
      const first = this.currentTabData.channels[0]
      if (first) this.selectedBubble = first.id
      this.resetSwipe()
    },
    selectBubble(id) {
      this.selectedBubble = id
      this.resetSwipe()
    },
    openConversation(message) {
      if (this.isSwipping) return
      this.leaveSearch()
      if (message.type === 'system_notice' || message.type === 'assistant') {
        uni.navigateTo({ url: `/pages/notification/index?source=${encodeURIComponent(message.id || 'notice')}` })
        return
      }
      const url = `/pages/chat/index?name=${encodeURIComponent(message.name)}&avatar=${encodeURIComponent(message.avatarColor || '')}&text=${encodeURIComponent(message.avatarText || '')}&type=${encodeURIComponent(message.type || 'direct')}`
      uni.navigateTo({ url })
    },
    onAddAction(label) {
      this.showAddMenu = false
      this.showToast(label)
    },
    showToast(title) {
      uni.showToast({ title, icon: 'none' })
    },
    startChannelHint(channel) {
      this.dragId = channel.id
      uni.showToast({ title: '长按后可拖拽排序', icon: 'none' })
      setTimeout(() => { this.dragId = '' }, 600)
    },
    startSwipe(event, index) {
      this.swipeIndex = index
      this.startX = event.touches[0].clientX
      this.swipeOffset = 0
      this.isSwipping = false
    },
    onSwipe(event) {
      if (this.swipeIndex === -1) return
      const deltaX = event.touches[0].clientX - this.startX
      if (deltaX < -8) {
        this.swipeOffset = Math.max(deltaX, -180)
        this.isSwipping = true
      }
    },
    endSwipe() {
      if (this.swipeIndex === -1) return
      this.swipeOffset = this.swipeOffset < -60 ? -180 : 0
      if (this.swipeOffset === 0) this.swipeIndex = -1
      setTimeout(() => { this.isSwipping = false }, 120)
    },
    resetSwipe() {
      this.swipeIndex = -1
      this.swipeOffset = 0
    },
    onInlineAction(index, message) {
      if (message.actionBtn === '回关') {
        this.currentMessages.splice(index, 1)
        this.showToast('已回关')
      } else {
        this.showToast(message.actionBtn)
      }
    },
    pinMessage(index) {
      const list = this.messageData[this.selectedBubble] || []
      const item = list[index]
      item.pinned = !item.pinned
      list.splice(index, 1)
      item.pinned ? list.unshift(item) : list.push(item)
      this.resetSwipe()
      this.showToast(item.pinned ? '已置顶' : '已取消置顶')
    },
    markUnread(index) {
      const item = this.currentMessages[index]
      item.unread = item.unread ? 0 : 1
      this.resetSwipe()
      this.showToast(item.unread ? '已标为未读' : '已标为已读')
    },
    deleteMessage(index) {
      this.currentMessages.splice(index, 1)
      this.resetSwipe()
      this.showToast('已删除')
    },
    onMessageLongPress(index) {
      this.actionSheetTarget = index
      this.showActionSheet = true
      this.resetSwipe()
    },
    closeActionSheet() {
      this.showActionSheet = false
      this.actionSheetTarget = -1
    },
    sheetPin() {
      if (this.actionSheetTarget >= 0) this.pinMessage(this.actionSheetTarget)
      this.closeActionSheet()
    },
    sheetUnread() {
      if (this.actionSheetTarget >= 0) this.markUnread(this.actionSheetTarget)
      this.closeActionSheet()
    },
    sheetMute() {
      const item = this.currentMessages[this.actionSheetTarget]
      if (item) {
        item.muted = !item.muted
        this.showToast(item.muted ? '已免打扰' : '已开启通知')
      }
      this.closeActionSheet()
    },
    sheetStar() {
      this.showToast('已设为特别关注')
      this.closeActionSheet()
    },
    sheetDelete() {
      if (this.actionSheetTarget >= 0) this.deleteMessage(this.actionSheetTarget)
      this.closeActionSheet()
    },
    onRefresh() {
      this.isRefreshing = true
      setTimeout(() => {
        this.isRefreshing = false
        this.refreshTip = '已同步，发现 3 条新消息'
        setTimeout(() => { this.refreshTip = '' }, 1800)
      }, 800)
    }
  }
}
</script>

<style scoped>
.message-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fff;
  color: #1f1f1f;
  overflow: hidden;
}

.status-bar,
.top-area,
.tab-bar {
  flex-shrink: 0;
}

.top-area {
  display: flex;
  align-items: center;
  gap: 14rpx;
  padding: 12rpx 86rpx 14rpx 24rpx;
  background: #fff;
}

.search-bar {
  flex: 1;
  min-width: 0;
  height: 64rpx;
  border-radius: 32rpx;
  background: #F3F3F5;
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 0 20rpx;
}

.search-bar.active {
  background: #F0F0F3;
}

.search-icon {
  width: 32rpx;
  height: 32rpx;
  flex-shrink: 0;
}

.search-placeholder,
.search-input {
  flex: 1;
  font-size: 26rpx;
  color: #9A9A9A;
}

.search-input {
  color: #222;
  height: 64rpx;
}

.clear-search {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  background: #E1E1E5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-search svg,
.round-tool svg,
.more-dots svg,
.user-entry svg,
.rail-add svg {
  width: 34rpx;
  height: 34rpx;
}

.cancel-search {
  font-size: 28rpx;
  color: #FF6B35;
  padding: 0 4rpx;
}

.round-tool,
.user-entry {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: #F3F3F5;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.more-dots {
  width: 40rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.add-menu-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.28);
  display: flex;
  justify-content: flex-end;
  padding-right: 22rpx;
}

.add-menu {
  width: 280rpx;
  background: #fff;
  border-radius: 18rpx;
  box-shadow: 0 12rpx 40rpx rgba(0, 0, 0, 0.18);
  overflow: hidden;
}

.menu-item {
  height: 88rpx;
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 0 26rpx;
  border-bottom: 1rpx solid #F0F0F0;
  font-size: 28rpx;
  color: #333;
}

.menu-item:last-child {
  border-bottom: 0;
}

.menu-icon {
  width: 36rpx;
  height: 36rpx;
}

.tab-bar {
  position: relative;
  display: flex;
  height: 88rpx;
  border-bottom: 1rpx solid #F0F0F0;
}

.tab-item {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #999;
  font-size: 28rpx;
}

.tab-item.active {
  color: #FF6B35;
  font-weight: 700;
}

.tab-indicator {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 33.33%;
  height: 6rpx;
  display: flex;
  justify-content: center;
  transition: transform 0.25s ease;
}

.indicator-line {
  width: 42rpx;
  height: 5rpx;
  border-radius: 3rpx;
  background: #FF6B35;
}

.main-content {
  flex: 1;
  min-height: 0;
  display: flex;
  background: #fff;
}

.channel-rail {
  width: 128rpx;
  background: #F5F5F7;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.channel-scroll {
  flex: 1;
  width: 100%;
  padding-top: 18rpx;
}

.channel-dot {
  width: 82rpx;
  height: 82rpx;
  border-radius: 50%;
  margin: 10rpx auto 20rpx;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.channel-dot.active {
  transform: scale(1.08);
  box-shadow: 0 10rpx 22rpx rgba(255, 107, 53, 0.24);
}

.channel-dot.dragging {
  transform: scale(1.14);
}

.channel-icon svg {
  width: 40rpx;
  height: 40rpx;
}

.channel-icon text {
  font-size: 28rpx;
  font-weight: 800;
}

.channel-badge {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  min-width: 30rpx;
  height: 30rpx;
  padding: 0 7rpx;
  border-radius: 18rpx;
  background: #FF3838;
  border: 3rpx solid #F5F5F7;
  display: flex;
  align-items: center;
  justify-content: center;
}

.channel-badge text {
  color: #fff;
  font-size: 18rpx;
  font-weight: 700;
}

.channel-active-bar {
  position: absolute;
  left: -16rpx;
  top: 18rpx;
  bottom: 18rpx;
  width: 6rpx;
  border-radius: 3rpx;
  background: #FF6B35;
}

.rail-add {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: #E8E8EB;
  margin: 16rpx 0 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.conversation-list {
  flex: 1;
  background: #fff;
}

.refresh-tip {
  height: 56rpx;
  line-height: 56rpx;
  text-align: center;
  background: #FFF4EB;
  color: #FF6B35;
  font-size: 24rpx;
}

.conversation-row {
  min-height: 126rpx;
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 16rpx 18rpx 16rpx 24rpx;
  background: #fff;
  border-bottom: 1rpx solid #F1F1F1;
}

.conversation-row.pinned {
  background: #FFF9F4;
}

.conversation-avatar,
.result-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.conversation-avatar text,
.result-avatar text {
  color: #fff;
  font-size: 28rpx;
  font-weight: 800;
}

.conversation-avatar svg {
  width: 42rpx;
  height: 42rpx;
}

.slide-mask {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.slide-inner {
  display: flex;
  width: calc(100% + 360rpx);
  transition: transform 0.24s ease;
}

.conversation-main {
  width: calc(100% - 360rpx);
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.conv-top,
.conv-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
}

.conv-top {
  margin-bottom: 10rpx;
}

.conv-name-line {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.pin-dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: #FF6B35;
  flex-shrink: 0;
}

.conv-name {
  font-size: 30rpx;
  font-weight: 800;
  color: #202020;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.muted-icon {
  padding: 2rpx 8rpx;
  border-radius: 10rpx;
  background: #ECECEF;
  color: #9A9A9A;
  font-size: 18rpx;
  flex-shrink: 0;
}

.conv-time {
  color: #999;
  font-size: 24rpx;
  margin-left: 16rpx;
  flex-shrink: 0;
}

.conv-preview {
  flex: 1;
  color: #6B6B6B;
  font-size: 26rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  min-width: 0;
}

.conv-right {
  margin-left: 14rpx;
  flex-shrink: 0;
}

.inline-action {
  height: 42rpx;
  line-height: 42rpx;
  padding: 0 20rpx;
  border-radius: 22rpx;
  background: #FF6B35;
  color: #fff;
  font-size: 22rpx;
  font-weight: 700;
}

.unread-badge {
  min-width: 32rpx;
  height: 32rpx;
  padding: 0 8rpx;
  border-radius: 18rpx;
  background: #FF3838;
  color: #fff;
  font-size: 20rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.swipe-actions {
  width: 360rpx;
  display: flex;
}

.swipe-btn {
  width: 120rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 24rpx;
  font-weight: 700;
}

.swipe-btn.pin { background: #FF9500; }
.swipe-btn.read { background: #4A90D9; }
.swipe-btn.delete { background: #FF3838; }

.search-panel {
  background: #fff;
  padding: 28rpx 28rpx 0;
}

.section-title {
  display: block;
  color: #999;
  font-size: 24rpx;
  margin-bottom: 20rpx;
}

.hint-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 18rpx;
}

.hint-tag {
  padding: 12rpx 24rpx;
  border-radius: 28rpx;
  background: #F5F5F7;
  color: #555;
  font-size: 26rpx;
}

.result-item {
  min-height: 112rpx;
  display: flex;
  align-items: center;
  gap: 18rpx;
  border-bottom: 1rpx solid #F1F1F1;
}

.result-copy {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.result-name {
  font-size: 30rpx;
  font-weight: 700;
  color: #222;
}

.result-preview {
  color: #777;
  font-size: 25rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.result-time {
  font-size: 23rpx;
  color: #999;
}

.empty-state {
  min-height: 420rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18rpx;
  color: #999;
}

.empty-icon {
  width: 90rpx;
  height: 90rpx;
}

.empty-title {
  font-size: 28rpx;
  color: #999;
}

.empty-desc {
  color: #B6B6B6;
  font-size: 24rpx;
}

.empty-action {
  height: 56rpx;
  line-height: 56rpx;
  padding: 0 34rpx;
  border-radius: 30rpx;
  border: 1rpx solid #FF6B35;
  color: #FF6B35;
  font-size: 24rpx;
}

.sheet-mask {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(0, 0, 0, 0.42);
  display: flex;
  align-items: flex-end;
}

.action-sheet {
  width: 100%;
  padding-bottom: env(safe-area-inset-bottom);
  background: #fff;
  border-radius: 28rpx 28rpx 0 0;
  overflow: hidden;
}

.sheet-handle {
  width: 66rpx;
  height: 7rpx;
  border-radius: 4rpx;
  background: #D9D9D9;
  margin: 18rpx auto;
}

.sheet-item,
.sheet-cancel {
  height: 92rpx;
  line-height: 92rpx;
  text-align: center;
  font-size: 30rpx;
  color: #333;
  border-top: 1rpx solid #F1F1F1;
}

.sheet-item.danger {
  color: #FF3838;
}

.sheet-cancel {
  margin-top: 12rpx;
  border-top: 10rpx solid #F5F5F7;
  color: #999;
}
</style>

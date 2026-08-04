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
        <view class="round-tool" aria-label="新建会话" @click="showAddMenu = !showAddMenu">
          <view class="css-add-icon"></view>
        </view>
        <view class="user-entry" aria-label="联系人" @click="openContacts">
          <view class="css-user-icon"><view class="css-user-head"></view><view class="css-user-body"></view></view>
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
        <text v-if="tabUnreadCounts[index]" class="tab-unread">{{ tabUnreadCounts[index] > 99 ? '99+' : tabUnreadCounts[index] }}</text>
      </view>
      <view class="tab-indicator" :style="{ transform: 'translateX(' + activeTab * 100 + '%)' }">
        <view class="indicator-line"></view>
      </view>
    </view>

    <view v-if="isSearching" class="search-panel" :style="{ height: searchHeight + 'px' }">
      <view v-if="!searchKeyword" class="search-hints">
        <template v-if="searchMode === 'people'">
          <view class="result-group-head"><text>联系人与附近的人</text><text>模糊位置</text></view>
          <view v-for="item in peopleSuggestions" :key="item.id" class="result-item" @click="openConversation(item)">
            <view class="result-avatar" :style="{ background: item.avatarColor }"><text>{{ item.avatarText }}</text></view>
            <view class="result-copy">
              <text class="result-name">{{ item.name }}</text>
              <text class="result-preview">{{ item.preview }}</text>
            </view>
            <text class="result-time">{{ item.time }}</text>
          </view>
        </template>
        <template v-else>
          <text class="section-title">最近搜索</text>
          <view class="hint-tags">
            <text v-for="item in recentSearches" :key="item" class="hint-tag" @click="searchKeyword = item">{{ item }}</text>
          </view>
        </template>
      </view>
      <scroll-view v-else-if="searchResults.length" class="search-results" scroll-y show-scrollbar="false">
        <view v-for="group in searchGroups" :key="group.key" class="result-group">
          <view class="result-group-head">
            <text>{{ group.label }}</text>
            <text>{{ group.items.length }}</text>
          </view>
          <view v-for="item in group.items" :key="item.id" class="result-item" @click="openConversation(item)">
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
      </scroll-view>
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
              <text>{{ channel.iconChar }}</text>
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
        :scroll-top="currentScrollTop"
        @scroll="onConversationScroll"
        show-scrollbar="false"
      >
        <view v-if="refreshTip" class="refresh-tip">{{ refreshTip }}</view>

        <view v-if="currentChannelSummary" class="channel-summary">
          <view class="summary-top">
            <view class="summary-avatar">{{ selectedChannelShort }}</view>
            <view class="summary-copy">
              <view class="summary-title-row">
                <text class="summary-title">{{ currentChannelSummary.name }}</text>
                <text v-if="currentChannelSummary.muted" class="summary-state">免打扰</text>
              </view>
              <text class="summary-desc">{{ currentChannelSummary.locationName }} · {{ currentChannelSummary.members }} 位成员 · {{ currentChannelSummary.active }} 人近期活跃</text>
            </view>
            <view class="summary-action" @click="openSelectedChannel">进入</view>
          </view>
          <view v-if="currentChannelActivity.length && currentMessages.length <= 1" class="summary-activity">
            <view v-for="activity in currentChannelActivity" :key="activity.id" class="activity-row" @click="openSelectedChannel(activity.id)">
              <view class="activity-dot"></view>
              <text class="activity-title">{{ activity.title }}</text>
              <text class="activity-meta">{{ activity.count }} 条 · {{ activity.freshness }}</text>
            </view>
          </view>
        </view>

        <view v-if="currentMessages.length === 0" class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="#C9C9C9" stroke-width="1.4" stroke-linecap="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"></path>
          </svg>
          <text class="empty-title">{{ emptyStateCopy.title }}</text>
          <text class="empty-desc">{{ emptyStateCopy.desc }}</text>
          <view class="empty-action" @click="handleEmptyAction">{{ emptyStateCopy.action }}</view>
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
                    <text v-if="message.starred" class="state-tag star">星标</text>
                    <text v-if="message.muted" class="muted-icon">免</text>
                    <text v-if="message.orderStatus" class="state-tag order">{{ message.orderStatus }}</text>
                  </view>
                  <text class="conv-time">{{ message.time }}</text>
                </view>
                <view class="conv-bottom">
                  <text class="conv-preview" :class="{ failed: message.deliveryState === 'failed' }">
                    {{ message.draft ? `[草稿] ${message.draft}` : (message.deliveryState === 'failed' ? `[发送失败] ${message.preview}` : message.preview) }}
                  </text>
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

    <view v-if="undoConversation" class="undo-bar">
      <text>已清除“{{ undoConversation.title }}”</text>
      <text class="undo-action" @click="undoDelete">撤销</text>
    </view>

    <GlobalOverlayHost />
  </view>
</template>

<script>
import GlobalOverlayHost from '../../components/common/GlobalOverlayHost.vue'
import { conversationApi, channelApi, socialViewStateApi } from '../../utils/api/social.js'
import { setChannelOpenCommand } from '../../utils/channelOpenCommand.js'

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
      searchMode: 'all',
      showAddMenu: false,
      showActionSheet: false,
      actionSheetTarget: -1,
      activeTab: 0,
      selectedBubble: 'nearby',
      dragId: '',
      swipeIndex: -1,
      swipeOffset: 0,
      startX: 0,
      isSwipping: false,
      isRefreshing: false,
      refreshTip: '',
      currentScrollTop: 0,
      scrollOffsets: {},
      undoConversation: null,
      undoTimer: null,
      tabs: ['地图频道', '私信', '系统通知'],
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
            { id: 'nearby', iconChar: '近', bgColor: '#22C55E', iconColor: '#fff', unread: 5 },
            { id: 'city', iconChar: '城', bgColor: '#FF9500', iconColor: '#fff', unread: 2 },
            { id: 'outdoor', iconChar: '户', bgColor: '#FF4D4F', iconColor: '#fff', unread: 100 },
            { id: 'food', iconChar: '食', bgColor: '#8B5CF6', iconColor: '#fff' },
            { id: 'photo', iconChar: '摄', bgColor: '#38A7E8', iconColor: '#fff' }
          ]
        },
        {
          channels: [
            { id: 'follow', iconChar: '友', bgColor: '#3D8BFF', iconColor: '#fff', unread: 1 },
            { id: 'fans', iconChar: '粉', bgColor: '#22C55E', iconColor: '#fff' },
            { id: 'newfans', iconChar: '新', bgColor: '#FF9500', iconColor: '#fff', unread: 4 }
          ]
        },
        {
          channels: [
            { id: 'notice', iconChar: '系', bgColor: '#3D8BFF', iconColor: '#fff', unread: 3 },
            { id: 'like', iconChar: '赞', bgColor: '#FF6B6B', iconColor: '#fff', unread: 8 },
            { id: 'comment', iconChar: '评', bgColor: '#3D8BFF', iconColor: '#fff', unread: 3 },
            { id: 'atme', iconChar: '@', bgColor: '#FF9500', iconColor: '#fff', unread: 1 }
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
    tabUnreadCounts() {
      const overview = conversationApi.unreadOverview()
      return [overview.channel, overview.direct, overview.system]
    },
    currentTabData() {
      return this.tabData[this.activeTab]
    },
    currentChannelSummary() {
      if (this.activeTab !== 0) return null
      return channelApi.summary(this.selectedBubble)
    },
    currentChannelActivity() {
      if (!this.currentChannelSummary) return []
      return channelApi.recentActivity(this.selectedBubble, 3)
    },
    selectedChannelShort() {
      const selected = this.currentTabData.channels.find(item => item.id === this.selectedBubble)
      return selected?.iconChar || String(this.currentChannelSummary?.name || '频').slice(0, 1)
    },
    peopleSuggestions() {
      return [
        { id: 'near-person-1', type: 'contact', name: '安安', avatarColor: '#8B5CF6', avatarText: '安', time: '约 500m', preview: '共同兴趣：摄影、城市漫步' },
        { id: 'near-person-2', type: 'contact', name: '木早', avatarColor: '#3D8BFF', avatarText: '木', time: '约 1.2km', preview: '共同频道：成都街拍兴趣频道' },
        { id: 'near-person-3', type: 'contact', name: '林屿', avatarColor: '#22C55E', avatarText: '林', time: '今天活跃', preview: '共同兴趣：展览、咖啡' }
      ]
    },
    emptyStateCopy() {
      if (this.activeTab === 0) return { title: '这个频道还没有新消息', desc: '可以进入频道查看线程，或发现更多地图频道', action: '发现地图频道' }
      if (this.activeTab === 1) return { title: '暂时没有私信', desc: '从联系人或附近公开用户开始会话', action: '发起私信' }
      return { title: '没有新的系统通知', desc: '预约、审核和互动进度会显示在这里', action: '检查通知' }
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
      const source = this.searchMode === 'people'
        ? this.allMessages.concat(this.peopleSuggestions)
        : this.allMessages
      return source.filter(item => {
        return item.name.toLowerCase().includes(keyword) || item.preview.toLowerCase().includes(keyword)
      })
    },
    searchGroups() {
      const definitions = [
        { key: 'channel', label: '地图频道', test: item => item.type === 'channel' },
        { key: 'direct', label: '私信与成员', test: item => item.type === 'direct' || item.type === 'group' || item.type === 'contact' },
        { key: 'system', label: '系统与服务', test: item => item.type === 'system_notice' || item.type === 'assistant' }
      ]
      return definitions
        .map(group => ({ ...group, items: this.searchResults.filter(group.test) }))
        .filter(group => group.items.length)
    }
  },
  created() {
    this.initMetrics()
    conversationApi.hydrateLegacy(this.messageData)
    this.restoreHomeState()
    this.restoreConversationState()
    channelApi.archiveExpired()
  },
  onReady() {
    this.calcHeights()
  },
  onShow() {
    this.restoreHomeState()
    this.restoreConversationState()
    try {
      const tab = typeof this.getTabBar === 'function' ? this.getTabBar() : null
      if (tab && tab.setData) tab.setData({ selected: 3 })
    } catch (e) {}
  },
  onHide() {
    this.persistHomeState()
  },
  onUnload() {
    this.persistHomeState()
    if (this.undoTimer) clearTimeout(this.undoTimer)
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
      this.searchMode = 'all'
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
      this.currentScrollTop = Number(this.scrollOffsets[this.selectedBubble] || 0)
      this.resetSwipe()
      this.persistHomeState()
    },
    selectBubble(id) {
      this.selectedBubble = id
      this.currentScrollTop = Number(this.scrollOffsets[id] || 0)
      this.resetSwipe()
      this.persistHomeState()
    },
    openConversation(message) {
      if (this.isSwipping) return
      this.leaveSearch()
      conversationApi.touch(message.id)
      if (message.type === 'contact') {
        uni.navigateTo({
          url: `/pages/contact-profile/index?id=${encodeURIComponent(message.id)}&name=${encodeURIComponent(message.name)}&avatar=${encodeURIComponent(message.avatarText || '')}`
        })
        return
      }
      if (message.type === 'system_notice' || message.type === 'assistant') {
        conversationApi.markRead(message.id)
        uni.navigateTo({ url: `/pages/notification/index?source=${encodeURIComponent(message.id || 'notice')}` })
        return
      }
      if (message.type === 'channel') {
        setChannelOpenCommand({ channelId: message.id.replace(/-\d+$/, ''), source: 'message_home' })
        uni.navigateTo({ url: `/pages/channel-detail/index?id=${encodeURIComponent(message.id.replace(/-\d+$/, ''))}` })
        return
      }
      conversationApi.markRead(message.id)
      const url = `/pages/chat/index?id=${encodeURIComponent(message.id)}&name=${encodeURIComponent(message.name)}&avatar=${encodeURIComponent(message.avatarColor || '')}&text=${encodeURIComponent(message.avatarText || '')}&type=${encodeURIComponent(message.type || 'direct')}`
      uni.navigateTo({ url })
    },
    onAddAction(label) {
      this.showAddMenu = false
      if (label === '添加朋友') return this.openContacts()
      if (label === '附近的人') {
        this.searchMode = 'people'
        this.isSearching = true
        this.searchKeyword = ''
        this.$nextTick(this.calcHeights)
        return
      }
      if (label === '发起群聊') return this.createGroupConversation()
      if (label === '创建频道') return this.createMapChannel()
      if (label === '扫一扫') return this.scanContactCode()
    },
    openContacts() {
      this.searchMode = 'people'
      this.isSearching = true
      this.searchKeyword = ''
      this.resetSwipe()
      this.$nextTick(this.calcHeights)
    },
    createGroupConversation() {
      const choices = this.peopleSuggestions.map(item => item.name)
      uni.showActionSheet({
        itemList: choices,
        success: ({ tapIndex }) => {
          const target = this.peopleSuggestions[tapIndex]
          if (!target) return
          const group = conversationApi.createGroup({ title: `我和${target.name}的群聊`, participants: [target.id] })
          this.messageData.follow = conversationApi.list('follow').map(item => this.toMessageItem(item))
          this.activeTab = 1
          this.selectedBubble = 'follow'
          this.persistHomeState()
          uni.navigateTo({
            url: `/pages/chat/index?id=${encodeURIComponent(group.id)}&name=${encodeURIComponent(group.title)}&type=group&text=群`
          })
        }
      })
    },
    createMapChannel() {
      uni.showModal({
        title: '创建地图频道',
        editable: true,
        placeholderText: '输入频道名称',
        confirmText: '创建',
        success: ({ confirm, content }) => {
          if (!confirm) return
          const name = String(content || '').trim()
          if (!name) return uni.showToast({ title: '请输入频道名称', icon: 'none' })
          const channel = channelApi.create({ name, scope: 'interest' })
          this.tabData[0].channels.push({ id: channel.id, iconChar: name.slice(0, 1), bgColor: '#3D8BFF', iconColor: '#fff', unread: 0 })
          this.messageData[channel.id] = []
          this.activeTab = 0
          this.selectedBubble = channel.id
          this.persistHomeState()
          uni.navigateTo({ url: `/pages/channel-detail/index?id=${encodeURIComponent(channel.id)}` })
        }
      })
    },
    scanContactCode() {
      if (typeof uni.scanCode !== 'function') {
        uni.showModal({ title: '当前环境不支持扫码', content: '请在微信小程序中使用扫一扫，或通过联系人搜索添加。', showCancel: false })
        return
      }
      uni.scanCode({
        success: ({ result }) => {
          uni.showModal({ title: '已识别', content: result || '未发现可用内容', showCancel: false })
        },
        fail: (error) => {
          const message = /cancel/i.test(String(error?.errMsg || '')) ? '已取消扫码' : '扫码失败，请检查相机权限后重试'
          uni.showToast({ title: message, icon: 'none' })
        }
      })
    },
    showToast(title) {
      uni.showToast({ title, icon: 'none' })
    },
    startChannelHint(channel) {
      this.dragId = channel.id
      const list = this.currentTabData.channels
      const index = list.findIndex(item => item.id === channel.id)
      if (index > 0) list.unshift(...list.splice(index, 1))
      this.persistHomeState()
      uni.showToast({ title: '已移到快捷栏顶部', icon: 'none' })
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
      conversationApi.patch(item.id, { pinned: item.pinned })
      this.resetSwipe()
      this.showToast(item.pinned ? '已置顶' : '已取消置顶')
    },
    markUnread(index) {
      const item = this.currentMessages[index]
      item.unread = item.unread ? 0 : 1
      conversationApi.markRead(item.id, !!item.unread)
      this.resetSwipe()
      this.showToast(item.unread ? '已标为未读' : '已标为已读')
    },
    deleteMessage(index) {
      const item = this.currentMessages[index]
      if (!item) return
      uni.showModal({
        title: '清除本地会话',
        content: '只会清除当前设备上的会话记录，频道和对方不会被删除。',
        confirmText: '清除',
        confirmColor: '#E5484D',
        success: ({ confirm }) => {
          if (!confirm) return
          this.currentMessages.splice(index, 1)
          this.undoConversation = conversationApi.removeLocalWithSnapshot(item.id) || {
            id: item.id,
            title: item.name
          }
          this.resetSwipe()
          if (this.undoTimer) clearTimeout(this.undoTimer)
          this.undoTimer = setTimeout(() => {
            this.undoConversation = null
            this.undoTimer = null
          }, 4500)
        }
      })
    },
    undoDelete() {
      if (!this.undoConversation) return
      conversationApi.restore(this.undoConversation)
      const restored = this.undoConversation
      this.undoConversation = null
      if (this.undoTimer) clearTimeout(this.undoTimer)
      this.undoTimer = null
      this.restoreConversationState()
      uni.showToast({ title: `已恢复“${restored.title || '会话'}”`, icon: 'none' })
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
        conversationApi.patch(item.id, { muted: item.muted })
        this.showToast(item.muted ? '已免打扰' : '已开启通知')
      }
      this.closeActionSheet()
    },
    sheetStar() {
      const item = this.currentMessages[this.actionSheetTarget]
      if (item) {
        item.starred = !item.starred
        conversationApi.patch(item.id, { starred: item.starred })
        this.showToast(item.starred ? '已加入星标快捷栏' : '已取消星标')
      }
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
    },
    onConversationScroll(event) {
      const top = Number(event?.detail?.scrollTop || 0)
      this.scrollOffsets[this.selectedBubble] = top
    },
    openSelectedChannel(threadId = '') {
      if (!this.currentChannelSummary) return
      setChannelOpenCommand({
        channelId: this.currentChannelSummary.id,
        source: 'message_home',
        focusThreadId: threadId || ''
      })
      uni.navigateTo({ url: `/pages/channel-detail/index?id=${encodeURIComponent(this.currentChannelSummary.id)}` })
    },
    handleEmptyAction() {
      if (this.activeTab === 0) {
        this.searchMode = 'all'
        this.isSearching = true
        this.searchKeyword = '频道'
        this.$nextTick(this.calcHeights)
        return
      }
      if (this.activeTab === 1) return this.openContacts()
      uni.navigateTo({ url: '/pages/notification/index' })
    },
    persistHomeState() {
      const railOrder = {}
      this.tabData.forEach((tab, index) => {
        railOrder[index] = tab.channels.map(item => item.id)
      })
      socialViewStateApi.patchMessageHome({
        activeTab: this.activeTab,
        selectedBubble: this.selectedBubble,
        railOrder,
        scrollOffsets: this.scrollOffsets,
        searchMode: this.searchMode
      })
    },
    restoreHomeState() {
      const saved = socialViewStateApi.getMessageHome()
      this.activeTab = Math.max(0, Math.min(2, Number(saved.activeTab || 0)))
      this.scrollOffsets = saved.scrollOffsets && typeof saved.scrollOffsets === 'object' ? saved.scrollOffsets : {}
      this.searchMode = saved.searchMode || 'all'
      Object.keys(saved.railOrder || {}).forEach((key) => {
        const tab = this.tabData[Number(key)]
        const order = saved.railOrder[key]
        if (!tab || !Array.isArray(order)) return
        tab.channels.sort((a, b) => {
          const ai = order.indexOf(a.id)
          const bi = order.indexOf(b.id)
          return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi)
        })
      })
      const valid = this.currentTabData.channels.some(item => item.id === saved.selectedBubble)
      this.selectedBubble = valid ? saved.selectedBubble : (this.currentTabData.channels[0]?.id || '')
      this.currentScrollTop = Number(this.scrollOffsets[this.selectedBubble] || 0)
    },
    toMessageItem(item) {
      return {
        id: item.id,
        type: item.kind === 'system' ? (item.id === 'assistant' ? 'assistant' : 'system_notice') : item.kind,
        name: item.title,
        avatarColor: item.avatarColor || '#3D8BFF',
        avatarText: item.avatarText || String(item.title || '').slice(0, 1),
        time: item.time || '刚刚',
        preview: item.lastMessage,
        unread: item.unreadCount,
        pinned: item.pinned,
        starred: item.starred,
        muted: item.muted,
        draft: item.draft,
        deliveryState: item.deliveryState,
        orderStatus: item.orderStatus,
        actionBtn: item.actionBtn
      }
    },
    restoreConversationState() {
      Object.keys(this.messageData).forEach((bucketId) => {
        const stored = conversationApi.list(bucketId)
        if (!stored.length) return
        this.messageData[bucketId] = stored.map(item => this.toMessageItem(item))
      })
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
  background: #f3f3f5;
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 0 20rpx;
}

.search-bar.active {
  background: #f0f0f3;
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
  color: #9a9a9a;
}

.search-input {
  color: #9a9a9a;
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
  color: var(--color-primary);
  padding: 0 4rpx;
}

.round-tool,
.user-entry {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: #f3f3f5;
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
  border-bottom: 1rpx solid #f1f5f9;
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
  border-bottom: 1rpx solid #f1f5f9;
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
  color: var(--color-primary);
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
  background: var(--color-primary);
}

.main-content {
  flex: 1;
  min-height: 0;
  display: flex;
  background: #fff;
}

.channel-rail {
  width: 128rpx;
  background: var(--color-page);
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
  background: #ff3838;
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
  background: var(--color-primary);
}

.rail-add {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: #e8e8eb;
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
  background: #fff4eb;
  color: var(--color-primary);
  font-size: 24rpx;
}

.conversation-row {
  min-height: 126rpx;
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 16rpx 18rpx 16rpx 24rpx;
  background: #fff;
  border-bottom: 1rpx solid #f1f5f9;
}

.conversation-row.pinned {
  background: #fff9f4;
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
  background: var(--color-primary);
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
  background: #ececef;
  color: #9a9a9a;
  font-size: 18rpx;
  flex-shrink: 0;
}

.state-tag {
  flex-shrink: 0;
  padding: 2rpx 8rpx;
  border-radius: 9rpx;
  font-size: 18rpx;
  line-height: 26rpx;
}

.state-tag.star {
  color: #A85B00;
  background: #fff1d6;
}

.state-tag.order {
  color: #1769AA;
  background: #eaf4ff;
}

.conv-preview.failed {
  color: #D63C3C;
}

.conv-time {
  color: #999;
  font-size: 24rpx;
  margin-left: 16rpx;
  flex-shrink: 0;
}

.conv-preview {
  flex: 1;
  color: #6b6b6b;
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
  background: var(--color-primary);
  color: #fff;
  font-size: 22rpx;
  font-weight: 700;
}

.unread-badge {
  min-width: 32rpx;
  height: 32rpx;
  padding: 0 8rpx;
  border-radius: 18rpx;
  background: #ff3838;
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

.swipe-btn.pin { background: #ff9500; }
.swipe-btn.read { background: #4a90d9; }
.swipe-btn.delete { background: #ff3838; }

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
  background: var(--color-page);
  color: #555;
  font-size: 26rpx;
}

.result-item {
  min-height: 112rpx;
  display: flex;
  align-items: center;
  gap: 18rpx;
  border-bottom: 1rpx solid #f1f5f9;
}

.result-group {
  margin-bottom: 18rpx;
}

.result-group-head {
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #7b8493;
  font-size: 23rpx;
  border-bottom: 1rpx solid #f1f5f9;
}

.result-group-head text:first-child {
  color: #2a3140;
  font-weight: 700;
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
  color: #b6b6b6;
  font-size: 24rpx;
}

.empty-action {
  height: 56rpx;
  line-height: 56rpx;
  padding: 0 34rpx;
  border-radius: 30rpx;
  border: 1rpx solid var(--color-primary);
  color: var(--color-primary);
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
  border-top: 1rpx solid #f1f5f9;
}

.sheet-item.danger {
  color: #ff3838;
}

.sheet-cancel {
  margin-top: 12rpx;
  border-top: 10rpx solid #F5F5F7;
  color: #333;
}

.round-tool,
.user-entry {
  width: 88rpx;
  height: 88rpx;
  border-radius: 24rpx;
  background: #F3F5F8;
  border: .03125rem solid #E8EBF0;
}

.round-tool:active,
.user-entry:active,
.summary-action:active,
.empty-action:active {
  opacity: 0.72;
}

.css-add-icon {
  width: 34rpx;
  height: 34rpx;
  position: relative;
}

.css-add-icon::before,
.css-add-icon::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  background: #3d8bff;
  border-radius: 3rpx;
  transform: translate(-50%, -50%);
}

.css-add-icon::before {
  width: 34rpx;
  height: 4rpx;
}

.css-add-icon::after {
  width: 4rpx;
  height: 34rpx;
}

.css-user-icon {
  width: 38rpx;
  height: 38rpx;
  position: relative;
}

.css-user-head {
  width: 15rpx;
  height: 15rpx;
  position: absolute;
  left: 12rpx;
  top: 1rpx;
  border: 4rpx solid #667085;
  border-radius: 50%;
  box-sizing: border-box;
}

.css-user-body {
  width: 32rpx;
  height: 17rpx;
  position: absolute;
  left: 3rpx;
  bottom: 1rpx;
  border: 4rpx solid #667085;
  border-bottom: 0;
  border-radius: 20rpx 20rpx 0 0;
  box-sizing: border-box;
}

.tab-item {
  gap: 8rpx;
}

.tab-unread {
  min-width: 28rpx;
  height: 28rpx;
  padding: 0 7rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16rpx;
  color: #fff;
  background: #ff4d4f;
  font-size: 18rpx;
  font-weight: 700;
  box-sizing: border-box;
}

.channel-rail {
  width: 112rpx;
  background: var(--color-page);
  border-right: .03125rem solid #ECEEF2;
}

.channel-dot {
  width: 88rpx;
  height: 88rpx;
  margin: 8rpx auto 16rpx;
  border-radius: 28rpx;
  border: 4rpx solid transparent;
  box-shadow: none;
  box-sizing: border-box;
}

.channel-dot.active {
  transform: none;
  border-color: rgba(255, 107, 53, 0.30);
  box-shadow: 0 8rpx 20rpx rgba(23, 32, 51, 0.14);
}

.channel-icon text {
  font-size: 28rpx;
  font-weight: 800;
}

.channel-active-bar {
  left: -12rpx;
  top: 20rpx;
  bottom: 20rpx;
}

.channel-summary {
  margin: 20rpx 20rpx 8rpx;
  padding: 22rpx;
  border: .03125rem solid #E9EDF3;
  border-radius: 24rpx;
  background: var(--color-page);
}

.summary-top {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.summary-avatar {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #fff;
  background: #3d8bff;
  border-radius: 20rpx;
  font-size: 28rpx;
  font-weight: 800;
}

.summary-copy {
  flex: 1;
  min-width: 0;
}

.summary-title-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.summary-title {
  color: #172033;
  font-size: 29rpx;
  font-weight: 800;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.summary-state {
  flex-shrink: 0;
  padding: 3rpx 10rpx;
  border-radius: 12rpx;
  color: #667085;
  background: #e9edf3;
  font-size: 19rpx;
}

.summary-desc {
  display: block;
  margin-top: 7rpx;
  color: #667085;
  font-size: 22rpx;
  line-height: 1.45;
}

.summary-action {
  min-width: 82rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 18rpx;
  color: #fff;
  background: var(--color-primary);
  font-size: 24rpx;
  font-weight: 700;
}

.summary-activity {
  margin-top: 18rpx;
  padding-top: 10rpx;
  border-top: .03125rem solid #E9EDF3;
}

.activity-row {
  min-height: 58rpx;
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.activity-dot {
  width: 10rpx;
  height: 10rpx;
  flex-shrink: 0;
  border-radius: 50%;
  background: #3d8bff;
}

.activity-title {
  flex: 1;
  min-width: 0;
  color: #344054;
  font-size: 23rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.activity-meta {
  color: #98a2b3;
  font-size: 20rpx;
}

.empty-state {
  min-height: 360rpx;
  padding: 40rpx;
  box-sizing: border-box;
}

.empty-title {
  color: #344054;
  font-weight: 700;
}

.empty-desc {
  max-width: 420rpx;
  color: #98a2b3;
  line-height: 1.55;
  text-align: center;
}

.empty-action {
  min-height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: normal;
}

.undo-bar {
  position: fixed;
  left: 28rpx;
  right: 28rpx;
  bottom: calc(118rpx + env(safe-area-inset-bottom));
  z-index: 2200;
  min-height: 80rpx;
  padding: 0 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 20rpx;
  color: #fff;
  background: #172033;
  box-shadow: 0 12rpx 32rpx rgba(23, 32, 51, 0.24);
  font-size: 24rpx;
}

.undo-action {
  min-width: 88rpx;
  min-height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  color: #FFB38F;
  font-weight: 700;
}
</style>

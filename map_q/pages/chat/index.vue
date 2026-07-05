<template>
  <view class="chat-page">
    <view class="chat-header" :style="{ paddingTop: topOffset + 'px' }">
      <view class="header-row">
        <view class="header-btn left" @click="goBack">
          <svg viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 18l-6-6 6-6"></path>
          </svg>
        </view>
        <view class="title-block">
          <text class="chat-title">{{ chatName }}</text>
          <view class="presence-line">
            <view class="presence-dot" :class="{ offline: !isOnline }"></view>
            <text>{{ presenceText }}</text>
          </view>
        </view>
        <view class="header-btn right" @click="showMoreMenu = !showMoreMenu">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="5" r="1.8" fill="#666"></circle>
            <circle cx="12" cy="12" r="1.8" fill="#666"></circle>
            <circle cx="12" cy="19" r="1.8" fill="#666"></circle>
          </svg>
        </view>
      </view>
    </view>

    <view v-if="showMoreMenu" class="more-mask" @click="showMoreMenu = false">
      <view class="more-menu" :style="{ top: (topOffset + 54) + 'px' }" @click.stop>
        <view v-for="item in moreActions" :key="item.key" class="more-item" @click="onMenuAction(item.key)">
          <svg viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="1.8" stroke-linecap="round" v-html="item.icon"></svg>
          <text>{{ item.label }}</text>
        </view>
      </view>
    </view>

    <scroll-view
      class="message-scroll"
      scroll-y
      scroll-with-animation
      :scroll-into-view="scrollToId"
      :style="{ height: chatHeight + 'px' }"
      show-scrollbar="false"
    >
      <view class="date-pill">今天 10:30</view>

      <view
        v-for="(msg, index) in messages"
        :id="'msg-' + index"
        :key="'msg-' + index"
        class="message-row"
        :class="{ mine: msg.fromMe }"
        @longpress="onMessageLongPress(msg)"
      >
        <view v-if="!msg.fromMe" class="avatar other" :style="{ background: avatarColor }">
          <text>{{ avatarText }}</text>
        </view>

        <view class="bubble-area" :class="{ mine: msg.fromMe }">
          <view v-if="msg.type === 'text'" class="bubble text-bubble" :class="{ mine: msg.fromMe }">
            <text>{{ msg.content }}</text>
          </view>

          <view v-else-if="msg.type === 'voice'" class="bubble voice-bubble" :class="{ mine: msg.fromMe }" @click="playVoice(msg)">
            <svg viewBox="0 0 24 24" fill="none" :stroke="msg.fromMe ? '#fff' : '#666'" stroke-width="1.8" stroke-linecap="round">
              <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
              <path d="M19 5a10 10 0 010 14"></path>
            </svg>
            <view class="wave-bars">
              <view v-for="bar in 3" :key="bar" :style="{ height: (12 + bar * 5) + 'rpx' }"></view>
            </view>
            <text>{{ msg.duration }}"</text>
          </view>

          <view v-else-if="msg.type === 'image'" class="image-card" :class="{ mine: msg.fromMe }">
            <svg viewBox="0 0 24 24" fill="none" :stroke="msg.fromMe ? 'rgba(255,255,255,.78)' : '#A8A8A8'" stroke-width="1.4" stroke-linecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <path d="M21 15l-5-5L5 21"></path>
            </svg>
            <text>[图片]</text>
          </view>

          <view v-else-if="msg.type === 'location'" class="location-card" :class="{ mine: msg.fromMe }" @click="showToast('查看位置')">
            <view class="location-copy">
              <text class="location-title">{{ msg.title }}</text>
              <text class="location-desc">{{ msg.desc }}</text>
            </view>
            <view class="location-pin">
              <svg viewBox="0 0 24 24" fill="none" stroke="#FF6B35" stroke-width="2" stroke-linecap="round">
                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </view>
          </view>

          <view v-else-if="msg.type === 'card'" class="activity-card">
            <view class="card-head">
              <text>{{ msg.card.title }}</text>
            </view>
            <view class="card-body">
              <view v-for="row in msg.card.rows" :key="row.label" class="card-row">
                <text class="card-label">{{ row.label }}</text>
                <text class="card-value">{{ row.value }}</text>
              </view>
              <view class="card-action" @click="showToast(msg.card.action)">{{ msg.card.action }}</view>
            </view>
          </view>

          <view class="status-line" :class="{ mine: msg.fromMe }">
            <text>{{ msg.time }}</text>
            <text v-if="msg.fromMe" class="send-state">{{ msg.status || '已读' }}</text>
          </view>
        </view>

        <view v-if="msg.fromMe" class="avatar mine-avatar">
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round">
            <circle cx="12" cy="8" r="4"></circle>
            <path d="M5 21v-1c0-3.2 3.1-5.8 7-5.8s7 2.6 7 5.8v1"></path>
          </svg>
        </view>
      </view>

      <view id="msg-bottom" class="scroll-bottom"></view>
    </scroll-view>

    <view class="input-panel" :style="{ paddingBottom: safeBottom + 'px' }">
      <view class="input-row">
        <view class="plus-btn" @click="toggleToolbar">
          <svg viewBox="0 0 24 24" fill="none" stroke="#8A8A8E" stroke-width="1.8" stroke-linecap="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
        </view>
        <input
          v-if="!isVoiceMode"
          class="message-input"
          v-model="inputText"
          placeholder="输入消息..."
          confirm-type="send"
          :focus="inputFocused"
          @focus="onInputFocus"
          @confirm="sendMessage"
        />
        <view v-else class="voice-input" :class="{ recording: isRecording }" @touchstart="startRecording" @touchend="endRecording" @touchmove="cancelRecording">
          <text>{{ isRecording ? '松开发送' : '按住说话' }}</text>
        </view>
        <view class="send-btn" :class="{ disabled: !inputText.trim() && !isVoiceMode }" @click="sendMessage">
          <text>发送</text>
        </view>
      </view>

      <view v-if="showToolbar" class="tool-panel">
        <view v-for="tool in tools" :key="tool.key" class="tool-item" @click="onTool(tool.key)">
          <view class="tool-icon" :style="{ background: tool.color }">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" v-html="tool.icon"></svg>
          </view>
          <text>{{ tool.label }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
const ICONS = {
  search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  mute: '<path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19 5a10 10 0 010 14"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M5 21v-1c0-3.2 3.1-5.8 7-5.8s7 2.6 7 5.8v1"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
  camera: '<path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>',
  location: '<path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  file: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/>',
  mic: '<path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><path d="M12 19v4"/>'
}

export default {
  data() {
    return {
      topOffset: 0,
      safeBottom: 0,
      chatHeight: 520,
      chatName: '聊天',
      chatType: 'direct',
      avatarColor: '#5AC8FA',
      avatarText: '王',
      isOnline: true,
      showMoreMenu: false,
      isMuted: false,
      inputText: '',
      inputFocused: false,
      isVoiceMode: false,
      isRecording: false,
      showToolbar: false,
      scrollToId: 'msg-bottom',
      messages: [],
      moreActions: [
        { key: 'search', label: '搜索聊天记录', icon: ICONS.search },
        { key: 'mute', label: '消息免打扰', icon: ICONS.mute },
        { key: 'clear', label: '清空聊天记录', icon: ICONS.trash },
        { key: 'profile', label: '查看资料', icon: ICONS.user }
      ],
      tools: [
        { key: 'image', label: '照片', color: '#34C759', icon: ICONS.image },
        { key: 'camera', label: '拍摄', color: '#4A90D9', icon: ICONS.camera },
        { key: 'location', label: '位置', color: '#FF9500', icon: ICONS.location },
        { key: 'event', label: '活动', color: '#FF6B35', icon: ICONS.calendar },
        { key: 'file', label: '文件', color: '#AF52DE', icon: ICONS.file },
        { key: 'voice', label: '语音', color: '#5AC8FA', icon: ICONS.mic }
      ]
    }
  },
  computed: {
    presenceText() {
      if (this.chatType === 'group') return '6人在线'
      return this.isOnline ? '在线' : '离线'
    }
  },
  onLoad(options) {
    this.chatName = decodeURIComponent(options.name || '聊天')
    this.avatarColor = decodeURIComponent(options.avatar || '#5AC8FA')
    this.avatarText = decodeURIComponent(options.text || this.chatName.slice(0, 1) || '聊')
    this.chatType = decodeURIComponent(options.type || 'direct')
    this.initMetrics()
    this.loadMessages()
  },
  onReady() {
    this.calcChatHeight()
    this.scrollBottom()
  },
  methods: {
    initMetrics() {
      try {
        const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
        this.topOffset = Math.max(((info.safeAreaInsets && info.safeAreaInsets.top) || info.statusBarHeight || 0) - 6, 0)
        this.safeBottom = (info.safeAreaInsets && info.safeAreaInsets.bottom) || 0
      } catch (e) {
        this.topOffset = 20
      }
    },
    calcChatHeight() {
      try {
        const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
        const toolH = this.showToolbar ? 188 : 0
        this.chatHeight = Math.max(260, Math.round((info.windowHeight || 700) - this.topOffset - 58 - 66 - this.safeBottom - toolH))
      } catch (e) {}
    },
    loadMessages() {
      if (this.chatName === '小王') {
        this.messages = [
          { type: 'text', content: '在吗？周末有空一起爬山吗', fromMe: false, time: '10:30' },
          { type: 'text', content: '在的！哪座山？', fromMe: true, time: '10:31', status: '已读' },
          { type: 'text', content: '想去青城山，上次听你说想去', fromMe: false, time: '10:36' },
          { type: 'text', content: '对对对！我一直想去', fromMe: true, time: '10:38', status: '已读' },
          { type: 'text', content: '那就这周六早上8点出发？', fromMe: false, time: '10:42' },
          { type: 'text', content: '没问题，到时候你开车还是我开车？', fromMe: true, time: '10:45', status: '已读' },
          { type: 'text', content: '我开车吧，你家顺路', fromMe: false, time: '10:58' },
          { type: 'text', content: '好的，明天见！', fromMe: true, time: '11:02', status: '已读' }
        ]
      } else if (this.chatType === 'group' || this.chatName.indexOf('群') !== -1) {
        this.messages = [
          { type: 'text', content: '这家店真的很推荐，周末要不要一起去？', fromMe: false, time: '09:18' },
          { type: 'image', fromMe: false, time: '09:19' },
          { type: 'text', content: '看起来不错，算我一个', fromMe: true, time: '09:22', status: '已读' },
          { type: 'voice', duration: 12, fromMe: false, time: '09:25' }
        ]
      } else {
        this.messages = [
          { type: 'text', content: `你好，我是${this.chatName}`, fromMe: false, time: '10:30' },
          { type: 'text', content: '你好！', fromMe: true, time: '10:31', status: '已读' },
          {
            type: 'card',
            fromMe: false,
            time: '10:33',
            card: {
              title: '周末城市徒步',
              rows: [
                { label: '时间', value: '周六 08:00' },
                { label: '集合点', value: '天府广场南门' }
              ],
              action: '查看活动'
            }
          }
        ]
      }
    },
    goBack() {
      uni.navigateBack()
    },
    scrollBottom() {
      this.$nextTick(() => {
        this.scrollToId = ''
        this.$nextTick(() => { this.scrollToId = 'msg-bottom' })
      })
    },
    getCurrentTime() {
      const now = new Date()
      return `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`
    },
    sendMessage() {
      const text = this.inputText.trim()
      if (!text || this.isVoiceMode) return
      this.messages.push({ type: 'text', content: text, fromMe: true, time: this.getCurrentTime(), status: '发送中' })
      this.inputText = ''
      this.showToolbar = false
      this.calcChatHeight()
      this.scrollBottom()
      const index = this.messages.length - 1
      setTimeout(() => {
        if (this.messages[index]) this.messages[index].status = '已读'
        this.simulateReply()
      }, 700)
    },
    simulateReply() {
      setTimeout(() => {
        const replies = ['收到，我稍后处理', '好的没问题', '了解了，谢谢', '这个可以的']
        const content = replies[Math.floor(Math.random() * replies.length)]
        this.messages.push({ type: 'text', content, fromMe: false, time: this.getCurrentTime() })
        this.scrollBottom()
      }, 900)
    },
    toggleToolbar() {
      this.showToolbar = !this.showToolbar
      this.inputFocused = false
      this.$nextTick(this.calcChatHeight)
    },
    onInputFocus() {
      this.showToolbar = false
      this.$nextTick(this.calcChatHeight)
    },
    onTool(key) {
      if (key === 'image') {
        this.messages.push({ type: 'image', fromMe: true, time: this.getCurrentTime(), status: '已发送' })
      } else if (key === 'location') {
        this.messages.push({ type: 'location', title: '当前位置', desc: '成都市锦江区春熙路', fromMe: true, time: this.getCurrentTime(), status: '已发送' })
      } else if (key === 'event') {
        this.messages.push({
          type: 'card',
          fromMe: true,
          time: this.getCurrentTime(),
          status: '已发送',
          card: {
            title: '活动邀请',
            rows: [
              { label: '活动', value: '周末青城山徒步' },
              { label: '时间', value: '周六 08:00' }
            ],
            action: '查看邀请'
          }
        })
      } else if (key === 'voice') {
        this.isVoiceMode = !this.isVoiceMode
        this.showToolbar = false
      } else {
        this.showToast(key === 'camera' ? '拍摄功能开发中' : '文件发送功能开发中')
      }
      this.showToolbar = false
      this.calcChatHeight()
      this.scrollBottom()
    },
    startRecording() {
      this.isRecording = true
    },
    endRecording() {
      if (!this.isRecording) return
      this.isRecording = false
      this.messages.push({ type: 'voice', duration: Math.floor(3 + Math.random() * 12), fromMe: true, time: this.getCurrentTime(), status: '已发送' })
      this.scrollBottom()
    },
    cancelRecording() {
      this.isRecording = false
    },
    playVoice(msg) {
      this.showToast(`播放语音 ${msg.duration}"`)
    },
    onMenuAction(key) {
      this.showMoreMenu = false
      if (key === 'mute') {
        this.isMuted = !this.isMuted
        this.moreActions[1].label = this.isMuted ? '开启通知' : '消息免打扰'
        this.showToast(this.isMuted ? '已开启免打扰' : '已关闭免打扰')
      } else if (key === 'clear') {
        uni.showModal({
          title: '确认清空',
          content: '确定要清空所有聊天记录吗？',
          success: res => {
            if (res.confirm) this.messages = []
          }
        })
      } else {
        this.showToast(key === 'search' ? '搜索聊天记录' : '查看资料')
      }
    },
    onMessageLongPress() {
      this.showToast('可复制、转发或删除该消息')
    },
    showToast(title) {
      uni.showToast({ title, icon: 'none' })
    }
  }
}
</script>

<style scoped>
.chat-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #F4F4F6;
  overflow: hidden;
}

.chat-header {
  background: #fff;
  border-bottom: 1rpx solid #EEEEEE;
  flex-shrink: 0;
  z-index: 20;
}

.header-row {
  height: 88rpx;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-btn {
  position: absolute;
  top: 12rpx;
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-btn.left {
  left: 18rpx;
}

.header-btn.right {
  right: 22rpx;
}

.header-btn svg {
  width: 40rpx;
  height: 40rpx;
}

.title-block {
  max-width: 420rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
}

.chat-title {
  max-width: 420rpx;
  color: #1A1A1A;
  font-size: 34rpx;
  font-weight: 800;
  line-height: 40rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.presence-line {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 4rpx;
  color: #999;
  font-size: 22rpx;
}

.presence-dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: #2FC765;
}

.presence-dot.offline {
  background: #B8B8B8;
}

.more-mask {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.24);
}

.more-menu {
  position: absolute;
  right: 22rpx;
  width: 300rpx;
  background: #fff;
  border-radius: 18rpx;
  box-shadow: 0 12rpx 40rpx rgba(0, 0, 0, 0.16);
  overflow: hidden;
}

.more-item {
  height: 86rpx;
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 0 24rpx;
  border-bottom: 1rpx solid #F1F1F1;
}

.more-item:last-child {
  border-bottom: 0;
}

.more-item svg {
  width: 34rpx;
  height: 34rpx;
}

.more-item text {
  color: #333;
  font-size: 27rpx;
}

.message-scroll {
  flex: 1;
  padding: 24rpx 22rpx 0;
  box-sizing: border-box;
  background: #F4F4F6;
}

.date-pill {
  align-self: center;
  width: max-content;
  max-width: 260rpx;
  height: 44rpx;
  line-height: 44rpx;
  padding: 0 28rpx;
  margin: 0 auto 24rpx;
  border-radius: 24rpx;
  background: #E8E8EB;
  color: #999;
  font-size: 23rpx;
  text-align: center;
}

.message-row {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.message-row.mine {
  justify-content: flex-end;
}

.avatar {
  width: 58rpx;
  height: 58rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar text {
  color: #167A94;
  font-size: 24rpx;
  font-weight: 800;
}

.mine-avatar {
  background: #FF8A3D;
}

.mine-avatar svg {
  width: 34rpx;
  height: 34rpx;
}

.bubble-area {
  max-width: 70%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.bubble-area.mine {
  align-items: flex-end;
}

.bubble {
  padding: 20rpx 24rpx;
  border-radius: 20rpx;
  box-sizing: border-box;
  word-break: break-all;
}

.text-bubble {
  background: #fff;
  border-top-left-radius: 6rpx;
}

.bubble.mine {
  background: #FF7540;
  border-top-left-radius: 20rpx;
  border-top-right-radius: 6rpx;
}

.bubble text {
  color: #202020;
  font-size: 29rpx;
  line-height: 1.55;
}

.bubble.mine text {
  color: #fff;
}

.voice-bubble {
  min-width: 180rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
  background: #fff;
}

.voice-bubble svg {
  width: 32rpx;
  height: 32rpx;
}

.voice-bubble.mine {
  background: #FF7540;
}

.wave-bars {
  display: flex;
  align-items: center;
  gap: 5rpx;
}

.wave-bars view {
  width: 5rpx;
  border-radius: 3rpx;
  background: #999;
}

.voice-bubble.mine .wave-bars view {
  background: rgba(255, 255, 255, 0.75);
}

.image-card {
  width: 300rpx;
  height: 220rpx;
  border-radius: 20rpx;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
}

.image-card.mine {
  background: #FF7540;
}

.image-card svg {
  width: 64rpx;
  height: 64rpx;
}

.image-card text {
  color: #999;
  font-size: 24rpx;
}

.image-card.mine text {
  color: rgba(255, 255, 255, 0.86);
}

.location-card,
.activity-card {
  width: 360rpx;
  border-radius: 20rpx;
  background: #fff;
  overflow: hidden;
}

.location-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22rpx;
  box-sizing: border-box;
}

.location-card.mine {
  background: #FFF7F2;
}

.location-copy {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  min-width: 0;
}

.location-title {
  color: #222;
  font-size: 28rpx;
  font-weight: 800;
}

.location-desc {
  color: #777;
  font-size: 23rpx;
}

.location-pin {
  width: 58rpx;
  height: 58rpx;
  border-radius: 16rpx;
  background: #FFE9DE;
  display: flex;
  align-items: center;
  justify-content: center;
}

.location-pin svg {
  width: 34rpx;
  height: 34rpx;
}

.card-head {
  min-height: 82rpx;
  background: #FF7540;
  display: flex;
  align-items: center;
  padding: 0 24rpx;
}

.card-head text {
  color: #fff;
  font-size: 30rpx;
  font-weight: 800;
}

.card-body {
  padding: 20rpx 24rpx 24rpx;
}

.card-row {
  display: flex;
  gap: 12rpx;
  margin-bottom: 12rpx;
}

.card-label {
  color: #777;
  font-size: 25rpx;
  flex-shrink: 0;
}

.card-value {
  color: #222;
  font-size: 25rpx;
}

.card-action {
  height: 58rpx;
  line-height: 58rpx;
  border-radius: 14rpx;
  background: #FF7540;
  text-align: center;
  color: #fff;
  font-size: 25rpx;
  font-weight: 700;
  margin-top: 14rpx;
}

.status-line {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 8rpx 8rpx 0;
  color: #A0A0A0;
  font-size: 21rpx;
}

.status-line.mine {
  justify-content: flex-end;
}

.send-state {
  color: #B2B2B2;
}

.scroll-bottom {
  height: 24rpx;
}

.input-panel {
  flex-shrink: 0;
  background: #fff;
  border-top: 1rpx solid #ECECEC;
}

.input-row {
  min-height: 82rpx;
  display: flex;
  align-items: center;
  gap: 14rpx;
  padding: 12rpx 18rpx;
  box-sizing: border-box;
}

.plus-btn {
  width: 58rpx;
  height: 58rpx;
  border-radius: 50%;
  border: 1rpx solid #E2E2E2;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.plus-btn svg {
  width: 42rpx;
  height: 42rpx;
}

.message-input,
.voice-input {
  flex: 1;
  height: 58rpx;
  border-radius: 30rpx;
  background: #F3F3F5;
  padding: 0 26rpx;
  box-sizing: border-box;
  color: #222;
  font-size: 28rpx;
}

.voice-input {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #777;
}

.voice-input.recording {
  background: #FF7540;
  color: #fff;
}

.send-btn {
  width: 90rpx;
  height: 58rpx;
  border-radius: 28rpx;
  background: #FF7540;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.send-btn.disabled {
  opacity: 0.58;
}

.send-btn text {
  color: #fff;
  font-size: 27rpx;
  font-weight: 700;
}

.tool-panel {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  row-gap: 24rpx;
  padding: 20rpx 20rpx 26rpx;
  border-top: 1rpx solid #F0F0F0;
}

.tool-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
}

.tool-icon {
  width: 82rpx;
  height: 82rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tool-icon svg {
  width: 40rpx;
  height: 40rpx;
}

.tool-item text {
  color: #666;
  font-size: 23rpx;
}
</style>

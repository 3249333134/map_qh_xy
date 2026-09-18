<template>
  <view class="message-board-card" :class="{ expanded: isExpanded }">
    <!-- 头部：点位信息 + 留言总数 + 展开/收起 -->
    <view class="board-header">
      <view class="header-left">
        <view class="board-location-dot"></view>
        <view class="board-title-area">
          <text class="board-title">{{ pointName }}</text>
          <text class="board-address">{{ pointAddress }}</text>
        </view>
      </view>
      <view class="header-right">
        <view class="message-count-badge">
          <text class="count-num">{{ messages.length }}</text>
          <text class="count-label">条留言</text>
        </view>
        <view class="expand-btn" @tap="toggleExpand">
          <text class="expand-icon">{{ isExpanded ? '▲' : '▼' }}</text>
        </view>
      </view>
    </view>

    <!-- 留言墙主体：错落便签 -->
    <scroll-view class="board-wall" scroll-y :show-scrollbar="false" v-if="isExpanded">
      <view class="wall-bg"></view>
      <view class="wall-messages">
        <!-- 便利贴类型（文字） -->
        <view
          class="sticky-note"
          v-for="msg in textMessages"
          :key="'t'+msg.id"
          :style="getNoteStyle(msg)"
          @tap="openMessageDetail(msg)">
          <view class="note-pin"></view>
          <view class="note-content">
            <text class="note-text">{{ msg.content }}</text>
          </view>
          <view class="note-author">
            <view class="author-avatar">{{ msg.authorAvatar }}</view>
            <text class="author-name">{{ msg.author }}</text>
          </view>
          <view class="note-actions">
            <view class="action-btn" @tap.stop="toggleLike(msg)">
              <text class="action-icon" :class="{ liked: msg.liked }">♡</text>
              <text class="action-count">{{ msg.likes }}</text>
            </view>
          </view>
        </view>

        <!-- 拍立得照片类型 -->
        <view
          class="polaroid-note"
          v-for="msg in imageMessages"
          :key="'i'+msg.id"
          :style="getNoteStyle(msg)"
          @tap="openMessageDetail(msg)">
          <view class="polaroid-frame">
            <image v-if="msg.image" class="polaroid-img" :src="msg.image" mode="aspectFill" />
            <view v-else class="polaroid-emoji">
              <text>{{ msg.emoji || '📷' }}</text>
            </view>
            <view class="polaroid-tape"></view>
          </view>
          <view class="polaroid-caption">
            <text class="caption-text">{{ msg.content }}</text>
          </view>
          <view class="polaroid-footer">
            <view class="author-mini">
              <text class="mini-avatar">{{ msg.authorAvatar }}</text>
              <text class="mini-name">{{ msg.author }}</text>
            </view>
            <view class="like-mini" @tap.stop="toggleLike(msg)">
              <text class="like-icon" :class="{ liked: msg.liked }">♡</text>
              <text class="like-num">{{ msg.likes }}</text>
            </view>
          </view>
        </view>

        <!-- 视频便签类型 -->
        <view
          class="video-note"
          v-for="msg in videoMessages"
          :key="'v'+msg.id"
          :style="getNoteStyle(msg)"
          @tap="openMessageDetail(msg)">
          <view class="video-thumb">
            <view class="play-icon">
              <text>▶</text>
            </view>
            <view class="video-duration">{{ msg.duration }}</view>
          </view>
          <view class="video-info">
            <text class="video-title">{{ msg.content }}</text>
            <view class="video-meta">
              <view class="author-mini">
                <text class="mini-avatar">{{ msg.authorAvatar }}</text>
                <text class="mini-name">{{ msg.author }}</text>
              </view>
              <text class="video-views">{{ msg.views }}次播放</text>
            </view>
          </view>
        </view>

        <!-- 扇形/圆形异形便签 -->
        <view
          class="odd-shape-note"
          v-for="msg in shapeMessages"
          :key="'s'+msg.id"
          :style="getNoteStyle(msg)"
          @tap="openMessageDetail(msg)">
          <view class="shape-body" :class="msg.shapeType">
            <text class="shape-text">{{ msg.content }}</text>
            <view class="shape-decoration">{{ msg.decoration }}</view>
          </view>
        </view>
      </view>

      <!-- 底部新增便签提示 -->
      <view class="add-note-hint" @tap="openAddNote">
        <view class="plus-icon">+</view>
        <text class="hint-text">写下你的留言，贴在这面墙上</text>
      </view>
    </scroll-view>

    <!-- 收起状态：预览3条最新 -->
    <view class="board-preview" v-else @tap="toggleExpand">
      <view class="preview-item" v-for="(msg, i) in previewMessages" :key="'p'+i">
        <view class="preview-dot" v-if="i < previewMessages.length - 1"></view>
        <view class="preview-avatar">{{ msg.authorAvatar }}</view>
        <text class="preview-text">{{ msg.content }}</text>
        <text class="preview-time">{{ msg.time }}</text>
      </view>
      <view class="preview-more">
        <text>查看全部 {{ messages.length }} 条留言 ›</text>
      </view>
      <!-- 快速操作按钮 -->
      <view class="quick-actions">
        <view class="qa-btn" @tap.stop="openAddNote">
          <text class="qa-icon">✏</text>
          <text class="qa-text">写便签</text>
        </view>
        <view class="qa-btn" @tap.stop="openCamera">
          <text class="qa-icon">📷</text>
          <text class="qa-text">拍立得</text>
        </view>
        <view class="qa-btn" @tap.stop="openVideo">
          <text class="qa-icon">🎬</text>
          <text class="qa-text">视频</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'MessageBoardCard',
  props: {
    pointName: {
      type: String,
      default: '打卡点'
    },
    pointAddress: {
      type: String,
      default: '未知地址'
    }
  },
  setup(props) {
    const isExpanded = ref(false)
    const activeTab = ref('text')
    const selectedStyle = ref('sticky')
    const selectedColor = ref('#FEF3C7')
    const selectedFont = ref('handwriting')

    // Mock 留言数据
    const messages = ref([
      {
        id: 1,
        type: 'text',
        content: '这家店的拿铁真的绝了！☕ 老板人超好，还给我画了小熊猫～下次还来！',
        author: '拿铁爱好者',
        authorAvatar: '🐻',
        likes: 128,
        liked: false,
        time: '2小时前',
        color: '#FEF3C7',
        rotation: -3,
        shape: 'sticky',
        x: 15, y: 20
      },
      {
        id: 2,
        type: 'image',
        content: '打卡成功！光线真的很好 🌞',
        image: '',
        emoji: '📸',
        author: '摄影日记',
        authorAvatar: '📷',
        likes: 56,
        liked: false,
        time: '5小时前',
        rotation: 2,
        x: 55, y: 15
      },
      {
        id: 3,
        type: 'text',
        content: '一个人的午后时光，治愈',
        author: '孤独美食家',
        authorAvatar: '🍜',
        likes: 42,
        liked: true,
        time: '昨天',
        color: '#DBEAFE',
        rotation: 1,
        shape: 'sticky',
        x: 70, y: 40
      },
      {
        id: 4,
        type: 'video',
        content: '探店Vlog #01',
        duration: '02:34',
        views: 892,
        author: '小视频日记',
        authorAvatar: '🎬',
        time: '昨天',
        rotation: -2,
        x: 20, y: 45
      },
      {
        id: 5,
        type: 'text',
        content: '今天心情不错，记录一下！✨',
        author: '快乐星球',
        authorAvatar: '🌟',
        likes: 15,
        liked: false,
        time: '2天前',
        color: '#FCE7F3',
        rotation: 4,
        shape: 'sticky',
        x: 40, y: 55
      },
      {
        id: 6,
        type: 'image',
        content: '窗外的风景，太美了！',
        image: '',
        emoji: '🏙',
        author: '城市漫步者',
        authorAvatar: '🚶',
        likes: 88,
        liked: false,
        time: '3天前',
        rotation: -1,
        x: 65, y: 60
      },
      {
        id: 7,
        type: 'shape',
        content: '到此一游！',
        author: '游客小王',
        authorAvatar: '🧑',
        likes: 23,
        liked: false,
        time: '3天前',
        shapeType: 'fan',
        decoration: '🌸',
        rotation: 5,
        x: 25, y: 65
      },
      {
        id: 8,
        type: 'text',
        content: '这家店的招牌菜真的好吃 👍',
        author: '吃货本人',
        authorAvatar: '🍴',
        likes: 67,
        liked: true,
        time: '1周前',
        color: '#D1FAE5',
        rotation: -2,
        shape: 'sticky',
        x: 75, y: 75
      }
    ])

    // 分组计算
    const textMessages = computed(() => messages.value.filter(m => m.type === 'text'))
    const imageMessages = computed(() => messages.value.filter(m => m.type === 'image'))
    const videoMessages = computed(() => messages.value.filter(m => m.type === 'video'))
    const shapeMessages = computed(() => messages.value.filter(m => m.type === 'shape'))

    // 预览消息（取最新3条）
    const previewMessages = computed(() => messages.value.slice(0, 3))

    // 便签样式计算
    const getNoteStyle = (msg) => {
      const x = msg.x || 20
      const y = msg.y || 20
      const rotation = msg.rotation || 0
      return {
        left: x + '%',
        top: y + '%',
        transform: `rotate(${rotation}deg)`,
        zIndex: Math.round(y)
      }
    }

    // 交互方法
    const toggleExpand = () => {
      isExpanded.value = !isExpanded.value
      if (isExpanded.value) {
        uni.showToast({ title: '已进入AR留言墙模式', icon: 'none' })
      }
    }

    const openMessageDetail = (msg) => {
      uni.showToast({ title: `查看留言详情：${msg.author}`, icon: 'none', duration: 800 })
    }

    const toggleLike = (msg) => {
      msg.liked = !msg.liked
      msg.likes += msg.liked ? 1 : -1
    }

    const openAddNote = () => {
      uni.showToast({ title: '打开便签编辑器', icon: 'none', duration: 800 })
    }

    const openCamera = () => {
      uni.showToast({ title: '打开相机拍立得模式', icon: 'none', duration: 800 })
    }

    const openVideo = () => {
      uni.showToast({ title: '打开视频录制', icon: 'none', duration: 800 })
    }

    return {
      isExpanded,
      activeTab,
      selectedStyle,
      selectedColor,
      selectedFont,
      messages,
      textMessages,
      imageMessages,
      videoMessages,
      shapeMessages,
      previewMessages,
      getNoteStyle,
      toggleExpand,
      openMessageDetail,
      toggleLike,
      openAddNote,
      openCamera,
      openVideo
    }
  }
}
</script>

<style scoped>
.message-board-card {
  width: 100%;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.9);
}

.message-board-card.expanded {
  max-height: 600px;
  display: flex;
  flex-direction: column;
}

/* ========== 头部 ========== */
.board-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 24px 16px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%);
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.board-location-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.board-title-area {
  flex: 1;
  min-width: 0;
}

.board-title {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.3;
}

.board-address {
  display: block;
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.message-count-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: rgba(16, 185, 129, 0.12);
  border-radius: 16px;
}

.count-num {
  font-size: 16px;
  font-weight: 800;
  color: #059669;
}

.count-label {
  font-size: 12px;
  color: #059669;
}

.expand-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
}

.expand-icon {
  font-size: 12px;
  color: var(--color-text-body);
}

/* ========== 留言墙主体 ========== */
.board-wall {
  flex: 1;
  position: relative;
  max-height: 480px;
}

.wall-bg {
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(15, 23, 42, 0.03) 40px, rgba(15, 23, 42, 0.03) 41px),
    repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(15, 23, 42, 0.03) 40px, rgba(15, 23, 42, 0.03) 41px);
  pointer-events: none;
}

.wall-messages {
  position: relative;
  padding: 20px;
  min-height: 440px;
}

/* 便利贴样式 */
.sticky-note {
  position: absolute;
  width: 140px;
  background: #FEF3C7;
  padding: 24px 16px 16px;
  border-radius: 4px;
  box-shadow: 4px 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  cursor: pointer;
}

.sticky-note:active {
  transform: scale(1.05) rotate(0deg) !important;
  z-index: 100 !important;
}

.note-pin {
  position: absolute;
  top: 6px;
  left: 50%;
  transform: translateX(-50%);
  width: 16px;
  height: 16px;
  background: radial-gradient(circle at 30% 30%, #fca5a5, #ef4444);
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.note-content {
  margin-bottom: 12px;
}

.note-text {
  font-size: 12px;
  line-height: 1.5;
  color: var(--color-text);
  font-family: "Comic Sans MS", "Marker Felt", cursive;
  word-break: break-all;
}

.note-author {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.author-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
}

.author-name {
  font-size: 10px;
  color: var(--color-text-muted);
  font-weight: 500;
}

.note-actions {
  display: flex;
  justify-content: flex-end;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 10px;
}

.action-icon {
  font-size: 12px;
  color: var(--color-text-muted);
}

.action-icon.liked {
  color: #ef4444;
}

.action-count {
  font-size: 10px;
  color: var(--color-text-muted);
}

/* 拍立得样式 */
.polaroid-note {
  position: absolute;
  width: 120px;
  background: #ffffff;
  padding: 8px 8px 20px;
  border-radius: 4px;
  box-shadow: 4px 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.polaroid-note:active {
  transform: scale(1.05) rotate(0deg) !important;
  z-index: 100 !important;
}

.polaroid-frame {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  background: var(--color-surface-muted);
  border-radius: 2px;
  overflow: hidden;
}

.polaroid-img {
  width: 100%;
  height: 100%;
}

.polaroid-emoji {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  background: #dbeafe;
}

.polaroid-tape {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%) rotate(-5deg);
  width: 40px;
  height: 16px;
  background: rgba(253, 224, 71, 0.7);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.polaroid-caption {
  padding: 6px 4px;
}

.caption-text {
  font-size: 11px;
  color: var(--color-text);
  font-family: "Comic Sans MS", cursive;
  word-break: break-all;
}

.polaroid-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px;
  border-top: 1px solid var(--color-surface-muted);
}

.author-mini {
  display: flex;
  align-items: center;
  gap: 4px;
}

.mini-avatar {
  font-size: 10px;
}

.mini-name {
  font-size: 10px;
  color: var(--color-text-muted);
}

.like-mini {
  display: flex;
  align-items: center;
  gap: 2px;
}

.like-icon {
  font-size: 11px;
  color: var(--color-text-muted);
}

.like-icon.liked {
  color: #ef4444;
}

.like-num {
  font-size: 10px;
  color: var(--color-text-muted);
}

/* 视频便签 */
.video-note {
  position: absolute;
  width: 150px;
  background: var(--color-text);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 4px 4px 16px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.video-note:active {
  transform: scale(1.05) rotate(0deg) !important;
  z-index: 100 !important;
}

.video-thumb {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: var(--color-text);
}

.play-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.play-icon text {
  font-size: 14px;
  color: var(--color-text);
  margin-left: 2px;
}

.video-duration {
  position: absolute;
  bottom: 6px;
  right: 6px;
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 4px;
  font-size: 10px;
  color: #ffffff;
}

.video-info {
  padding: 8px 10px;
}

.video-title {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.video-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.video-views {
  font-size: 10px;
  color: var(--color-text-muted);
}

/* 异形便签 */
.odd-shape-note {
  position: absolute;
  width: 100px;
  transition: all 0.2s ease;
}

.odd-shape-note:active {
  transform: scale(1.1) !important;
  z-index: 100 !important;
}

.shape-body {
  position: relative;
  width: 100%;
  padding: 16px 12px;
  text-align: center;
}

.shape-body.fan {
  background: #FCE7F3;
  border-radius: 0 0 50% 50%;
  padding: 24px 10px 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.shape-body.circle {
  background: #FEF3C7;
  border-radius: 50%;
  aspect-ratio: 1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.shape-text {
  font-size: 11px;
  color: var(--color-text);
  font-family: "Comic Sans MS", cursive;
  line-height: 1.4;
  word-break: break-all;
}

.shape-decoration {
  position: absolute;
  top: -8px;
  right: -4px;
  font-size: 20px;
}

/* 新增便签提示 */
.add-note-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px;
  margin: 16px 20px;
  background: rgba(16, 185, 129, 0.08);
  border: 2px dashed rgba(16, 185, 129, 0.3);
  border-radius: 16px;
}

.plus-icon {
  width: 28px;
  height: 28px;
  background: #10b981;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #ffffff;
  font-weight: 700;
}

.hint-text {
  font-size: 14px;
  color: #059669;
  font-weight: 500;
}

/* ========== 预览模式 ========== */
.board-preview {
  padding: 20px 24px;
}

.preview-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 0;
  position: relative;
}

.preview-item:not(:last-child) {
  border-bottom: 1px dashed rgba(15, 23, 42, 0.06);
}

.preview-dot {
  position: absolute;
  left: 20px;
  top: 40px;
  bottom: -12px;
  width: 2px;
  background: rgba(15, 23, 42, 0.1);
}

.preview-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-surface-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.preview-text {
  flex: 1;
  font-size: 14px;
  color: var(--color-text);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.preview-time {
  font-size: 11px;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.preview-more {
  text-align: center;
  padding: 12px 0 16px;
  font-size: 13px;
  color: #059669;
  font-weight: 600;
}

/* 快捷操作按钮 */
.quick-actions {
  display: flex;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
}

.qa-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 8px;
  background: rgba(16, 185, 129, 0.08);
  border-radius: 12px;
}

.qa-icon {
  font-size: 22px;
}

.qa-text {
  font-size: 12px;
  color: #059669;
  font-weight: 600;
}
</style>

<template>
  <view class="notice-page">
    <view class="notice-header" :style="{ paddingTop: topOffset + 'px' }">
      <view class="nav-row">
        <view class="back-btn" @click="goBack">
          <svg viewBox="0 0 24 24" fill="none" stroke="#222" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 18l-6-6 6-6"></path>
          </svg>
        </view>
        <text class="page-title">系统通知</text>
        <text class="read-all" @click="markAllRead">全部已读</text>
      </view>
    </view>

    <scroll-view class="notice-list" scroll-y show-scrollbar="false" :style="{ height: listHeight + 'px' }">
      <view
        v-for="(item, index) in visibleNotices"
        :key="item.id"
        class="notice-item"
        :class="{ read: !item.unread }"
        @click="openNotice(item)"
        @longpress="openSheet(index)"
      >
        <view class="unread-dot" :class="{ hidden: !item.unread }"></view>
        <view class="notice-icon" :style="{ background: item.iconBg }">
          <svg viewBox="0 0 24 24" fill="none" :stroke="item.iconColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" v-html="item.icon"></svg>
        </view>
        <view class="notice-copy">
          <view class="notice-top">
            <text class="notice-title">{{ item.title }}</text>
            <text class="notice-time">{{ item.time }}</text>
          </view>
          <text class="notice-content">{{ item.content }}</text>
        </view>
      </view>

      <view class="load-more" @click="loadMore">
        <text>{{ hasMore ? '查看更多通知' : '没有更多通知' }}</text>
        <svg v-if="hasMore" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2" stroke-linecap="round">
          <path d="M6 9l6 6 6-6"></path>
        </svg>
      </view>
    </scroll-view>

    <view v-if="showSheet" class="sheet-mask" @click="closeSheet">
      <view class="action-sheet" @click.stop>
        <view class="sheet-handle"></view>
        <view class="sheet-item" @click="markCurrentRead">标为已读</view>
        <view class="sheet-item" @click="muteCurrent">不再提醒此类通知</view>
        <view class="sheet-item danger" @click="deleteCurrent">删除通知</view>
        <view class="sheet-cancel" @click="closeSheet">取消</view>
      </view>
    </view>
  </view>
</template>

<script>
const ICONS = {
  bell: '<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>',
  star: '<polygon points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3 12 2"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 000-7.8z"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  user: '<path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>',
  comment: '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>'
}

export default {
  data() {
    return {
      topOffset: 0,
      listHeight: 640,
      visibleCount: 5,
      showSheet: false,
      sheetIndex: -1,
      notices: [
        {
          id: 'activity-1',
          category: 'activity',
          title: '活动通知',
          content: '您参与的「周末城市徒步」活动将在明天上午9:00开始，请准时参加集合点：天府广场南门',
          time: '2小时前',
          unread: true,
          icon: ICONS.bell,
          iconBg: '#EEF4FF',
          iconColor: '#3D8BFF',
          targetType: 'activity',
          targetId: 'walk-weekend'
        },
        {
          id: 'interaction-1',
          category: 'interaction',
          title: '互动通知',
          content: '小王等3人赞了你的动态「周末爬山计划」',
          time: '3小时前',
          unread: true,
          icon: ICONS.star,
          iconBg: '#FFF2ED',
          iconColor: '#FF6B35',
          targetType: 'post',
          targetId: 'post-1'
        },
        {
          id: 'comment-1',
          category: 'comment',
          title: '评论通知',
          content: '李明评论了你的动态："这个计划不错，算我一个！"',
          time: '5小时前',
          unread: true,
          icon: ICONS.heart,
          iconBg: '#FFF0F3',
          iconColor: '#FF3B60',
          targetType: 'comment',
          targetId: 'comment-1'
        },
        {
          id: 'audit-1',
          category: 'audit',
          title: '系统通知',
          content: '您的内容已通过审核，已公开发布',
          time: '昨天',
          unread: false,
          icon: ICONS.check,
          iconBg: '#EFFAF2',
          iconColor: '#34C759',
          targetType: 'post',
          targetId: 'post-2'
        },
        {
          id: 'fans-1',
          category: 'fans',
          title: '粉丝通知',
          content: '设计师小林 开始关注了你',
          time: '昨天',
          unread: false,
          icon: ICONS.user,
          iconBg: '#F7F0FF',
          iconColor: '#A06BFF',
          targetType: 'profile',
          targetId: 'user-1'
        },
        {
          id: 'service-1',
          category: 'service',
          title: '服务助手',
          content: '您的预约已确认，请于明天15:30前往春熙路旗舰店',
          time: '周一',
          unread: false,
          icon: ICONS.comment,
          iconBg: '#FFF5E8',
          iconColor: '#FF9500',
          targetType: 'service',
          targetId: 'booking-1'
        },
        {
          id: 'activity-2',
          category: 'activity',
          title: '活动通知',
          content: '「城市夜跑」报名即将截止，已有38人加入',
          time: '周日',
          unread: false,
          icon: ICONS.bell,
          iconBg: '#EEF4FF',
          iconColor: '#3D8BFF',
          targetType: 'activity',
          targetId: 'run-night'
        }
      ]
    }
  },
  computed: {
    visibleNotices() {
      return this.notices.slice(0, this.visibleCount)
    },
    hasMore() {
      return this.visibleCount < this.notices.length
    }
  },
  created() {
    try {
      const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
      this.topOffset = Math.max(((info.safeAreaInsets && info.safeAreaInsets.top) || info.statusBarHeight || 0) - 6, 0)
    } catch (e) {
      this.topOffset = 20
    }
  },
  onReady() {
    try {
      const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
      this.listHeight = Math.max(300, Math.round((info.windowHeight || 700) - this.topOffset - 52))
    } catch (e) {}
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    markAllRead() {
      this.notices.forEach(item => { item.unread = false })
      uni.showToast({ title: '已全部标为已读', icon: 'none' })
    },
    openNotice(item) {
      item.unread = false
      uni.showToast({ title: '查看详情', icon: 'none' })
    },
    loadMore() {
      if (!this.hasMore) return
      this.visibleCount = Math.min(this.visibleCount + 3, this.notices.length)
    },
    openSheet(index) {
      this.sheetIndex = index
      this.showSheet = true
    },
    closeSheet() {
      this.showSheet = false
      this.sheetIndex = -1
    },
    markCurrentRead() {
      const item = this.visibleNotices[this.sheetIndex]
      if (item) item.unread = false
      this.closeSheet()
    },
    muteCurrent() {
      const item = this.visibleNotices[this.sheetIndex]
      uni.showToast({ title: item ? '已不再提醒此类通知' : '已设置', icon: 'none' })
      this.closeSheet()
    },
    deleteCurrent() {
      const item = this.visibleNotices[this.sheetIndex]
      if (item) {
        const index = this.notices.findIndex(n => n.id === item.id)
        if (index >= 0) this.notices.splice(index, 1)
      }
      this.closeSheet()
    }
  }
}
</script>

<style scoped>
.notice-page {
  height: 100vh;
  background: #fff;
  color: #1f1f1f;
  overflow: hidden;
}

.notice-header {
  background: #fff;
  border-bottom: 1rpx solid #EFEFEF;
}

.nav-row {
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.back-btn {
  position: absolute;
  left: 28rpx;
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-btn svg {
  width: 38rpx;
  height: 38rpx;
}

.page-title {
  font-size: 34rpx;
  font-weight: 800;
  color: #161616;
}

.read-all {
  position: absolute;
  right: 30rpx;
  color: #FF6B35;
  font-size: 28rpx;
}

.notice-list {
  background: #fff;
}

.notice-item {
  min-height: 132rpx;
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  padding: 24rpx 28rpx 24rpx 36rpx;
  border-bottom: 1rpx solid #F1F1F1;
  position: relative;
  background: #fff;
}

.notice-item.read {
  opacity: 0.46;
}

.unread-dot {
  position: absolute;
  left: 18rpx;
  top: 58rpx;
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: #3D8BFF;
}

.unread-dot.hidden {
  opacity: 0;
}

.notice-icon {
  width: 68rpx;
  height: 68rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notice-icon svg {
  width: 38rpx;
  height: 38rpx;
}

.notice-copy {
  flex: 1;
  min-width: 0;
}

.notice-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10rpx;
  gap: 16rpx;
}

.notice-title {
  font-size: 30rpx;
  font-weight: 800;
  color: #202020;
}

.notice-time {
  color: #999;
  font-size: 24rpx;
  flex-shrink: 0;
}

.notice-content {
  color: #6F6F6F;
  font-size: 27rpx;
  line-height: 1.55;
}

.load-more {
  height: 150rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  color: #999;
  font-size: 28rpx;
}

.load-more svg {
  width: 26rpx;
  height: 26rpx;
}

.sheet-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
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

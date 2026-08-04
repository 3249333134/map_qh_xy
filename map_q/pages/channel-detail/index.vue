<template>
  <view class="channel-page">
    <view class="status-space" :style="{ height: statusBarHeight + 'px' }" />
    <view class="nav">
      <button class="nav-button" aria-label="返回" @tap="goBack">
        <view class="back-icon" />
      </button>
      <text class="nav-title">地图频道</text>
      <button class="nav-button" aria-label="更多操作" @tap="openMore">
        <view class="more-icon"><text /><text /><text /></view>
      </button>
    </view>

    <map
      v-if="channel"
      class="channel-map"
      :latitude="channel.location.latitude"
      :longitude="channel.location.longitude"
      :scale="14"
      :markers="markers"
      :circles="circles"
      enable-scroll
      enable-zoom
      show-location
    />

    <scroll-view class="content" scroll-y show-scrollbar="false">
      <view v-if="channel" class="channel-card">
        <view class="identity">
          <view class="channel-avatar">{{ channel.name.slice(0, 1) }}</view>
          <view class="identity-copy">
            <view class="title-row">
              <text class="channel-name">{{ channel.name }}</text>
              <text v-if="channel.archiveState === 'archived'" class="archive-tag">只读归档</text>
            </view>
            <text class="channel-desc">{{ channel.description }}</text>
          </view>
        </view>
        <view class="stats">
          <view><text>{{ channel.members }}</text><text>成员</text></view>
          <view><text>{{ channel.online }}</text><text>近期活跃</text></view>
          <view><text>{{ channel.threads.length }}</text><text>子线程</text></view>
        </view>
        <view class="actions">
          <button class="primary" :disabled="channel.archiveState === 'archived'" @tap="openThread">
            {{ channel.archiveState === 'archived' ? '查看归档' : '进入频道' }}
          </button>
          <button :class="{ active: channel.starred }" @tap="toggleStar">{{ channel.starred ? '已星标' : '星标' }}</button>
          <button :class="{ active: channel.notificationSetting === 'none' }" @tap="toggleMute">
            {{ channel.notificationSetting === 'none' ? '已免打扰' : '通知' }}
          </button>
        </view>
      </view>

      <view v-if="channel" class="section">
        <view class="section-head">
          <text>频道线程</text>
          <text>{{ channel.archiveState === 'archived' ? '历史只读' : '选择讨论主题' }}</text>
        </view>
        <view v-for="thread in channel.threads" :key="thread.id" class="row" @tap="openThread(thread)">
          <view class="thread-icon" />
          <view class="row-copy">
            <text>{{ thread.title }}</text>
            <text>{{ thread.count }} 条消息</text>
          </view>
          <view class="chevron" />
        </view>
      </view>

      <view v-if="channel" class="section">
        <view class="section-head"><text>频道信息</text><text>公开透明</text></view>
        <view class="info-row"><text>所属范围</text><text>{{ channel.location.name }}</text></view>
        <view class="info-row"><text>所有者</text><text>{{ channel.owner === 'platform' ? '平台' : '频道所有者' }}</text></view>
        <view class="info-row"><text>管理员</text><text>{{ channel.admins.length }} 人</text></view>
        <view class="info-row"><text>我的角色</text><text>{{ channel.owner === 'self' ? '所有者' : channel.admins.includes('self') ? '管理员' : '成员' }}</text></view>
      </view>

      <view v-if="channel" class="section">
        <view class="section-head"><text>频道规则</text><text>加入即表示同意</text></view>
        <view v-for="(rule, index) in channel.rules" :key="rule" class="rule-row">
          <text>{{ index + 1 }}</text><text>{{ rule }}</text>
        </view>
      </view>

      <button
        v-if="channel && channel.membershipState === 'joined'"
        class="exit-button"
        @tap="leaveChannel"
      >退出频道</button>
      <button v-else-if="channel" class="join-button" @tap="joinChannel">加入频道</button>
      <view class="bottom-space" />
    </scroll-view>

    <view v-if="!channel" class="error-state">
      <text>频道暂时无法加载</text>
      <button @tap="loadChannel">重新加载</button>
    </view>
  </view>
</template>

<script>
import { channelApi } from '../../utils/api/social.js'
import { consumeChannelOpenCommand } from '../../utils/channelOpenCommand.js'

export default {
  data() {
    return {
      statusBarHeight: 20,
      channelId: 'city',
      channel: null
    }
  },
  computed: {
    markers() {
      if (!this.channel) return []
      return [{
        id: 1,
        latitude: this.channel.location.latitude,
        longitude: this.channel.location.longitude,
        iconPath: '/static/marker-blue.png',
        width: 34,
        height: 42,
        callout: {
          content: this.channel.name,
          color: '#172033',
          fontSize: 13,
          borderRadius: 8,
          bgColor: '#FFFFFF',
          padding: 7,
          display: 'ALWAYS'
        }
      }]
    },
    circles() {
      if (!this.channel) return []
      return [{
        latitude: this.channel.location.latitude,
        longitude: this.channel.location.longitude,
        radius: 650,
        color: '#3D8BFF88',
        fillColor: '#3D8BFF16',
        strokeWidth: 2
      }]
    }
  },
  onLoad(options) {
    try {
      const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
      this.statusBarHeight = info.statusBarHeight || 20
    } catch (e) {}
    const command = consumeChannelOpenCommand()
    this.channelId = command?.channelId || decodeURIComponent(options.id || 'city')
    this.loadChannel()
  },
  methods: {
    loadChannel() {
      this.channel = channelApi.get(this.channelId) || channelApi.get('city')
    },
    goBack() { uni.navigateBack() },
    openThread(thread) {
      if (!this.channel) return
      const focusThread = thread?.id || this.channel.threads[0]?.id || ''
      uni.navigateTo({
        url: `/pages/chat/index?id=${encodeURIComponent(this.channel.id)}&name=${encodeURIComponent(this.channel.name)}&type=channel&text=${encodeURIComponent(this.channel.name.slice(0, 1))}&thread=${encodeURIComponent(focusThread)}`
      })
    },
    toggleStar() {
      this.channel = channelApi.patch(this.channel.id, { starred: !this.channel.starred })
      uni.showToast({ title: this.channel.starred ? '已加入星标快捷栏' : '已取消星标', icon: 'none' })
    },
    toggleMute() {
      const next = this.channel.notificationSetting === 'none' ? 'important' : 'none'
      this.channel = channelApi.patch(this.channel.id, { notificationSetting: next })
      uni.showToast({ title: next === 'none' ? '已开启免打扰' : '仅接收重要通知', icon: 'none' })
    },
    joinChannel() {
      this.channel = channelApi.join(this.channel.id)
      uni.showToast({ title: '已加入频道', icon: 'success' })
    },
    leaveChannel() {
      uni.showModal({
        title: '退出频道',
        content: '退出后仍可查看公开内容，但不会再接收频道通知。',
        confirmText: '退出',
        confirmColor: '#E5484D',
        success: ({ confirm }) => {
          if (!confirm) return
          const result = channelApi.exit(this.channel.id)
          if (!result.ok) return uni.showToast({ title: result.reason, icon: 'none' })
          this.loadChannel()
        }
      })
    },
    openMore() {
      uni.showActionSheet({
        itemList: ['举报频道', this.channel?.blocked ? '解除屏蔽' : '屏蔽频道'],
        success: ({ tapIndex }) => {
          if (tapIndex === 0) return uni.showToast({ title: '举报已提交审核', icon: 'none' })
          this.channel = channelApi.patch(this.channel.id, { blocked: !this.channel.blocked })
          uni.showToast({ title: this.channel.blocked ? '已屏蔽频道' : '已解除屏蔽', icon: 'none' })
        }
      })
    }
  }
}
</script>

<style scoped>
.channel-page {
  height: 100vh;
  background: #F5F6F8;
  color: #172033;
  overflow: hidden;
}

.status-space,
.nav {
  background: #fff;
}

.nav {
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18rpx;
  border-bottom: .03125rem solid #ECEEF2;
}

.nav-button {
  width: 72rpx;
  height: 72rpx;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-button::after,
.actions button::after,
.exit-button::after,
.join-button::after,
.error-state button::after {
  border: 0;
}

.back-icon {
  width: 20rpx;
  height: 20rpx;
  border-left: 4rpx solid #172033;
  border-bottom: 4rpx solid #172033;
  transform: rotate(45deg);
}

.more-icon {
  display: flex;
  gap: 5rpx;
}

.more-icon text {
  width: 7rpx;
  height: 7rpx;
  border-radius: 50%;
  background: #172033;
}

.nav-title {
  font-size: 32rpx;
  font-weight: 700;
}

.channel-map {
  width: 100%;
  height: 30vh;
  min-height: 360rpx;
}

.content {
  height: calc(70vh - 88rpx);
  box-sizing: border-box;
}

.channel-card,
.section {
  margin: 20rpx;
  padding: 24rpx;
  border-radius: 22rpx;
  background: #fff;
  box-shadow: 0 6rpx 20rpx rgba(21, 35, 58, 0.05);
}

.identity {
  display: flex;
  gap: 20rpx;
}

.channel-avatar {
  width: 86rpx;
  height: 86rpx;
  flex-shrink: 0;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eaf4ff;
  color: #2478D3;
  font-size: 34rpx;
  font-weight: 800;
}

.identity-copy {
  min-width: 0;
  flex: 1;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.channel-name {
  font-size: 32rpx;
  font-weight: 800;
}

.archive-tag {
  padding: 4rpx 10rpx;
  border-radius: 10rpx;
  background: #F0F1F3;
  color: #697386;
  font-size: 19rpx;
}

.channel-desc {
  display: block;
  margin-top: 8rpx;
  color: #697386;
  font-size: 24rpx;
  line-height: 1.55;
}

.stats {
  margin-top: 24rpx;
  padding: 20rpx 0;
  display: flex;
  border-top: 1rpx solid #EEF0F3;
}

.stats view {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5rpx;
}

.stats view text:first-child {
  font-size: 29rpx;
  font-weight: 800;
}

.stats view text:last-child {
  color: #8B94A5;
  font-size: 21rpx;
}

.actions {
  display: flex;
  gap: 12rpx;
}

.actions button {
  min-width: 104rpx;
  height: 76rpx;
  margin: 0;
  padding: 0 22rpx;
  border: 1rpx solid #DFE4EA;
  border-radius: 38rpx;
  background: #fff;
  color: #526071;
  font-size: 24rpx;
  line-height: 76rpx;
}

.actions button.primary {
  flex: 1;
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: #fff;
  font-weight: 700;
}

.actions button.active {
  border-color: #BFD9F5;
  background: #EEF6FF;
  color: #2478D3;
}

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 10rpx;
}

.section-head text:first-child {
  font-size: 29rpx;
  font-weight: 800;
}

.section-head text:last-child {
  color: #929BAA;
  font-size: 21rpx;
}

.row,
.info-row,
.rule-row {
  min-height: 88rpx;
  display: flex;
  align-items: center;
  border-bottom: 1rpx solid #EEF0F3;
}

.row:last-child,
.info-row:last-child,
.rule-row:last-child {
  border-bottom: 0;
}

.thread-icon {
  width: 42rpx;
  height: 34rpx;
  margin-right: 18rpx;
  border: 3rpx solid #3D8BFF;
  border-radius: 12rpx;
  position: relative;
}

.thread-icon::after {
  content: '';
  position: absolute;
  left: 7rpx;
  bottom: -8rpx;
  width: 10rpx;
  height: 10rpx;
  border-left: 3rpx solid #3D8BFF;
  border-bottom: 3rpx solid #3D8BFF;
  transform: skewY(-35deg);
  background: #fff;
}

.row-copy {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5rpx;
}

.row-copy text:first-child {
  font-size: 26rpx;
  font-weight: 650;
}

.row-copy text:last-child {
  color: #929BAA;
  font-size: 21rpx;
}

.chevron {
  width: 14rpx;
  height: 14rpx;
  border-right: 3rpx solid #B1B8C2;
  border-top: 3rpx solid #B1B8C2;
  transform: rotate(45deg);
}

.info-row {
  justify-content: space-between;
  font-size: 25rpx;
}

.info-row text:first-child {
  color: #697386;
}

.rule-row {
  gap: 16rpx;
}

.rule-row text:first-child {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F0F6FC;
  color: #2478D3;
  font-size: 20rpx;
}

.rule-row text:last-child {
  font-size: 25rpx;
}

.exit-button,
.join-button {
  height: 88rpx;
  margin: 20rpx;
  border-radius: 44rpx;
  font-size: 27rpx;
  line-height: 88rpx;
}

.exit-button {
  background: #fff;
  color: #D63C3C;
}

.join-button {
  background: var(--color-primary);
  color: #fff;
}

.bottom-space {
  height: calc(48rpx + env(safe-area-inset-bottom));
}

.error-state {
  position: absolute;
  inset: 200rpx 0 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24rpx;
  color: #697386;
}

.error-state button {
  width: 200rpx;
  height: 80rpx;
  border-radius: 40rpx;
  background: var(--color-primary);
  color: #fff;
  line-height: 80rpx;
  font-size: 25rpx;
}

</style>

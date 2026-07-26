<template>
  <view class="perm-page">
    <view class="status-spacer" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="nav-bar">
      <view class="nav-back" @tap="goBack">‹</view>
      <text class="nav-title">权限角色</text>
      <view class="nav-right save-btn" @tap="save">保存</view>
    </view>

    <scroll-view class="perm-scroll" scroll-y show-scrollbar="false">
      <!-- 角色列表 -->
      <view class="group-label">频道角色（{{ roles.length }}）</view>
      <view class="role-list">
        <view
          v-for="role in roles"
          :key="role.id"
          class="role-row"
          @tap="openRole(role)"
        >
          <view class="role-rank" :class="role.color">
            <text class="rank-text">{{ role.rank }}</text>
          </view>
          <view class="role-main">
            <view class="role-title-row">
              <text class="role-title">{{ role.name }}</text>
              <view class="role-count" :class="{ muted: role.countMuted }">
                <text class="count-text">{{ role.count }}</text>
              </view>
            </view>
            <text class="role-desc">{{ role.desc }}</text>
          </view>
          <text class="role-arrow">›</text>
        </view>
      </view>

      <!-- 权限矩阵提示 -->
      <view class="matrix-hint">
        <view class="hint-dot"></view>
        <text class="hint-text">角色按从高到低排列，下级角色继承上级的只读权限。</text>
      </view>

      <!-- 审核策略卡片 -->
      <view class="group-label">审核策略</view>
      <view class="audit-card">
        <view class="audit-head">
          <view class="audit-icon">
            <text class="audit-icon-text">审</text>
          </view>
          <view class="audit-head-text">
            <text class="audit-title">内容审核</text>
            <text class="audit-sub">频道级统一策略</text>
          </view>
        </view>
        <text class="audit-desc">频道发言、评论和共建内容接入自动审核+举报+人工干预。</text>

        <view class="toggle-list">
          <view
            v-for="item in auditToggles"
            :key="item.id"
            class="toggle-row"
            @tap="toggleAudit(item)"
          >
            <view class="toggle-meta">
              <text class="toggle-name">{{ item.name }}</text>
              <text class="toggle-sub">{{ item.sub }}</text>
            </view>
            <view class="switch" :class="{ on: item.on }">
              <view class="switch-knob"></view>
            </view>
          </view>
        </view>
      </view>

      <view class="footer-hint">
        <text class="footer-text">保存后策略立即生效，历史内容会按新策略回扫。</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const statusBarHeight = ref(20)

const roles = ref([
  {
    id: 'owner',
    rank: '01',
    color: 'orange',
    name: '频道所有者',
    count: '1',
    countMuted: false,
    desc: '创建子频道、分配角色、数据导出'
  },
  {
    id: 'admin',
    rank: '02',
    color: 'purple',
    name: '管理员',
    count: '3',
    countMuted: false,
    desc: '置顶/删除、成员审核、关键词屏蔽'
  },
  {
    id: 'member',
    rank: '03',
    color: 'blue',
    name: '成员',
    count: '1280',
    countMuted: false,
    desc: '发言、互动、申请贡献者'
  },
  {
    id: 'guest',
    rank: '04',
    color: 'gray',
    name: '访客',
    count: '公开',
    countMuted: true,
    desc: '只读 / 24小时临时访问'
  }
])

const auditToggles = ref([
  { id: 'auto', name: '自动审核', sub: '敏感词与图片机器审核', on: true },
  { id: 'report', name: '举报', sub: '成员可举报内容', on: true },
  { id: 'manual', name: '人工干预', sub: '主理人复核争议内容', on: false }
])

onMounted(() => {
  try {
    const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
    statusBarHeight.value = info.statusBarHeight || 20
  } catch (e) {}
})

const goBack = () => uni.navigateBack()

const save = () => {
  uni.showToast({ title: '权限已保存', icon: 'none' })
  setTimeout(() => uni.navigateBack(), 600)
}

const openRole = (role) => {
  uni.showToast({ title: '查看 ' + role.name, icon: 'none' })
}

const toggleAudit = (item) => {
  item.on = !item.on
}
</script>

<style scoped>
.perm-page {
  min-height: 100vh;
  background: #f7f7f8;
  display: flex;
  flex-direction: column;
}

.status-spacer {
  background: #ffffff;
}

.nav-bar {
  position: relative;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border-bottom: 1rpx solid #f0f1f3;
}

.nav-back {
  position: absolute;
  left: 24rpx;
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 52rpx;
  color: #222;
  font-weight: 300;
  line-height: 1;
}

.nav-title {
  font-size: 34rpx;
  font-weight: 800;
  color: #222;
}

.nav-right {
  position: absolute;
  right: 28rpx;
}

.save-btn {
  padding: 0 30rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #ff8a4a 0%, #ff5b35 100%);
  color: #ffffff;
  font-size: 26rpx;
  font-weight: 700;
  box-shadow: 0 4rpx 14rpx rgba(255, 91, 53, 0.3);
}

.perm-scroll {
  flex: 1;
  padding: 28rpx;
  box-sizing: border-box;
}

.group-label {
  font-size: 26rpx;
  color: #8a8f98;
  font-weight: 700;
  margin: 0 8rpx 18rpx;
}

/* 角色列表 */
.role-list {
  background: #ffffff;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 1px 8px rgba(18, 24, 38, 0.06);
}

.role-row {
  display: flex;
  align-items: center;
  gap: 22rpx;
  padding: 28rpx 24rpx;
  border-bottom: 1rpx solid #f4f5f7;
}
.role-row:last-child {
  border-bottom: none;
}

.role-rank {
  width: 76rpx;
  height: 76rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.role-rank.orange {
  background: rgba(255, 112, 67, 0.12);
}
.role-rank.orange .rank-text { color: #ff5b35; }
.role-rank.purple {
  background: rgba(118, 80, 200, 0.12);
}
.role-rank.purple .rank-text { color: #7650c8; }
.role-rank.blue {
  background: rgba(36, 140, 245, 0.12);
}
.role-rank.blue .rank-text { color: #248cf5; }
.role-rank.gray {
  background: #f0f1f3;
}
.role-rank.gray .rank-text { color: #8a8f98; }

.rank-text {
  font-size: 28rpx;
  font-weight: 800;
}

.role-main {
  flex: 1;
  min-width: 0;
}
.role-title-row {
  display: flex;
  align-items: center;
  gap: 14rpx;
}
.role-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #222;
}
.role-count {
  padding: 4rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(36, 140, 245, 0.1);
}
.role-count.muted {
  background: #f0f1f3;
}
.count-text {
  font-size: 22rpx;
  color: #248cf5;
  font-weight: 700;
}
.role-count.muted .count-text {
  color: #8a8f98;
}

.role-desc {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #8a8f98;
  line-height: 34rpx;
}

.role-arrow {
  font-size: 40rpx;
  color: #c4c9d2;
  line-height: 1;
}

/* 权限矩阵提示 */
.matrix-hint {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  margin: 22rpx 8rpx 36rpx;
}
.hint-dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: #ff7043;
  margin-top: 12rpx;
  flex-shrink: 0;
}
.hint-text {
  font-size: 22rpx;
  color: #8a8f98;
  line-height: 34rpx;
}

/* 审核策略卡片 */
.audit-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: 0 1px 8px rgba(18, 24, 38, 0.06);
}

.audit-head {
  display: flex;
  align-items: center;
  gap: 18rpx;
  margin-bottom: 18rpx;
}
.audit-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 20rpx;
  background: linear-gradient(135deg, #248cf5 0%, #7650c8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.audit-icon-text {
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 800;
}
.audit-head-text {
  flex: 1;
}
.audit-title {
  display: block;
  font-size: 30rpx;
  font-weight: 800;
  color: #222;
}
.audit-sub {
  display: block;
  margin-top: 4rpx;
  font-size: 22rpx;
  color: #8a8f98;
}

.audit-desc {
  display: block;
  font-size: 25rpx;
  color: #5f646d;
  line-height: 40rpx;
  margin-bottom: 8rpx;
}

/* 开关列表 */
.toggle-list {
  margin-top: 16rpx;
  border-top: 1rpx solid #f4f5f7;
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f4f5f7;
}
.toggle-row:last-child {
  border-bottom: none;
}

.toggle-meta {
  flex: 1;
  min-width: 0;
}
.toggle-name {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #222;
}
.toggle-sub {
  display: block;
  margin-top: 4rpx;
  font-size: 22rpx;
  color: #8a8f98;
}

/* 自定义 toggle 开关 */
.switch {
  width: 88rpx;
  height: 50rpx;
  border-radius: 999rpx;
  background: #d9dde3;
  position: relative;
  flex-shrink: 0;
  transition: background 0.25s;
}
.switch.on {
  background: linear-gradient(135deg, #ff8a4a 0%, #ff5b35 100%);
}
.switch-knob {
  position: absolute;
  top: 4rpx;
  left: 4rpx;
  width: 42rpx;
  height: 42rpx;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
  transition: transform 0.25s;
}
.switch.on .switch-knob {
  transform: translateX(38rpx);
}

.footer-hint {
  margin: 22rpx 8rpx 40rpx;
}
.footer-text {
  font-size: 22rpx;
  color: #a8adb6;
  line-height: 36rpx;
}
</style>

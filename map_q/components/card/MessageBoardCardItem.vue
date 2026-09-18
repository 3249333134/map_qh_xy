<template>
  <view class="board-card app-card content-card" role="button" :aria-label="`打开留言板：${title}`" @tap="openDetail">
    <view class="preview">
      <view class="eyebrow"><view class="live-dot"></view><text>地图留言板</text></view>
      <view class="count"><text>{{ itemCount }}</text><text>条内容</text></view>
      <view class="paper paper-a"><view class="pin"></view><text>{{ previewText }}</text></view>
      <view class="paper photo"><view class="photo-image"><view class="sun"></view><view class="mountain"></view></view></view>
      <view class="paper video"><view class="play"></view></view>
      <view class="spark spark-a"></view><view class="spark spark-b"></view>
    </view>
    <view class="body">
      <text class="title">{{ title }}</text>
      <view class="status-row"><text class="status">公开可见 · 可继续添加</text><text class="distance">{{ distance }}</text></view>
      <view class="footer">
        <text class="location">{{ address }}</text>
        <view class="write mq-pressable" role="button" aria-label="继续添加留言" @tap.stop="addItem"><view class="write-icon"></view><text>写留言</text></view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'MessageBoardCardItem',
  props: {
    height: { type: Number, default: 330 },
    columnType: { type: String, default: 'left' },
    index: { type: Number, required: true },
    cardData: { type: Object, default: () => ({}) }
  },
  computed: {
    id() { return this.cardData?._id || this.cardData?.id || `board_${this.index}` },
    title() { return this.cardData?.title || this.cardData?.name || '城市留言板' },
    itemCount() { return this.cardData?.itemCount || this.cardData?.messageCount || this.cardData?.items?.length || this.cardData?.messages?.length || 1 },
    previewText() { const i = this.cardData?.items?.[0] || this.cardData?.messages?.[0]; return i?.text || i?.content || this.cardData?.description || '把此刻留在这里' },
    address() { return this.cardData?.location?.address || this.cardData?.address || '地图选点' },
    distance() { const value = Number(this.cardData?.distance); return value ? `${value < 1 ? Math.round(value * 1000) + 'm' : value.toFixed(1) + 'km'}` : '附近' }
  },
  methods: {
    openDetail() { uni.navigateTo({ url: `/pages/message-board-detail/index?id=${encodeURIComponent(this.id)}` }) },
    addItem() { uni.navigateTo({ url: `/pages/message-board-editor/index?id=${encodeURIComponent(this.id)}` }) }
  }
}
</script>

<style scoped>
.board-card{width:100%;margin-bottom:24rpx;overflow:hidden;border-radius:30rpx;background:#fff;box-shadow:0 12rpx 34rpx rgba(0, 0, 0, 0.1)}
.preview{position:relative;height:224rpx;overflow:hidden;background:#eef9f5}
.eyebrow{position:absolute;z-index:5;left:18rpx;top:18rpx;height:40rpx;padding:0 15rpx;display:flex;align-items:center;gap:8rpx;border-radius:14rpx;background:rgba(23,31,30,.86);color:#fff;font-size:19rpx;font-weight:700}.live-dot{width:9rpx;height:9rpx;border-radius:50%;background:#4ee1bd}
.count{position:absolute;z-index:5;right:16rpx;top:16rpx;height:42rpx;padding:0 14rpx;display:flex;align-items:baseline;gap:4rpx;border-radius:14rpx;background:rgba(255,255,255,.9);color:var(--color-primary)}.count text:first-child{font-size:24rpx;font-weight:850}.count text:last-child{font-size:17rpx}
.paper{position:absolute;box-sizing:border-box;box-shadow:6rpx 9rpx 18rpx rgba(0, 0, 0, 0.1)}.paper-a{left:30rpx;top:84rpx;width:132rpx;min-height:88rpx;padding:25rpx 15rpx 14rpx;transform:rotate(-5deg);background:#fff2aa;color:#454031;font-size:18rpx;line-height:1.35}.pin{position:absolute;left:60rpx;top:10rpx;width:12rpx;height:12rpx;border-radius:50%;background:#f46e67;box-shadow:0 3rpx 5rpx rgba(0, 0, 0, 0.1)}
.photo{left:185rpx;top:69rpx;width:94rpx;height:116rpx;padding:8rpx;transform:rotate(4deg);background:#fff}.photo-image{position:relative;width:100%;height:82rpx;overflow:hidden;background:#cfe5e6}.sun{position:absolute;right:10rpx;top:10rpx;width:15rpx;height:15rpx;border-radius:50%;background:#f8c969}.mountain{position:absolute;left:6rpx;right:6rpx;bottom:-25rpx;height:65rpx;transform:rotate(12deg);background:#749c92}
.video{right:34rpx;top:91rpx;width:112rpx;height:82rpx;border-radius:12rpx;transform:rotate(-4deg);display:flex;align-items:center;justify-content:center;background:#172027}.play{width:43rpx;height:43rpx;border-radius:50%;background:#fff;position:relative}.play:after{content:'';position:absolute;left:17rpx;top:12rpx;width:0;height:0;border-top:9rpx solid transparent;border-bottom:9rpx solid transparent;border-left:14rpx solid #172027}
.spark{position:absolute;width:11rpx;height:11rpx;border-radius:50%;background:var(--color-primary)}.spark-a{right:154rpx;bottom:23rpx}.spark-b{right:20rpx;bottom:20rpx;width:18rpx;height:18rpx;background:#f5a9c3}
.body{padding:20rpx 20rpx 18rpx}.title{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#18201f;font-size:28rpx;font-weight:800}.status-row,.footer{display:flex;align-items:center;justify-content:space-between}.status-row{margin-top:10rpx}.status{color:var(--color-primary);font-size:18rpx;font-weight:650}.distance{color:#87918f;font-size:18rpx}.footer{min-height:55rpx;margin-top:14rpx;padding-top:14rpx;border-top:1rpx solid #edf1ef;gap:10rpx}.location{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#8b9492;font-size:18rpx}.write{min-width:112rpx;height:46rpx;padding:0 17rpx;display:flex;align-items:center;justify-content:center;gap:8rpx;border-radius:23rpx;background:#0bb49e;color:#fff;font-size:19rpx;font-weight:750;box-shadow:0 8rpx 18rpx rgba(0, 0, 0, 0.1)}.write-icon{width:17rpx;height:17rpx;border:2rpx solid currentColor;border-radius:4rpx;transform:rotate(-8deg)}
</style>

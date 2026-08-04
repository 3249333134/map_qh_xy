<template>
  <scroll-view class="inline-results" scroll-y :style="{ height: height + 'px' }">
    <view class="results-body">
      <view class="ai-summary-card">
        <view class="summary-ai"><text>AI</text></view>
        <view class="summary-copy">
          <text class="summary-title">为你找到 2 个兴趣 POI、1 条轨迹和 3 条用户内容。</text>
          <text class="summary-hint">结果会同步高亮地图锚点。</text>
        </view>
      </view>

      <view class="results-heading">
        <text class="heading-title">搜索结果</text>
        <view class="exit-search" role="button" aria-label="退出搜索" @tap.stop="$emit('exit')">
          <text>退出搜索</text>
        </view>
      </view>

      <view class="result-list">
        <view v-for="item in results" :key="item.id" class="result-row">
          <view class="result-thumb" :class="item.type">
            <text>{{ item.icon }}</text>
          </view>
          <view class="result-main">
            <text class="result-title">{{ item.title }}</text>
            <text class="result-desc">{{ item.description }}</text>
          </view>
          <view
            class="result-action"
            role="button"
            :aria-label="`${item.action}${item.title}`"
            @tap.stop="$emit('result-tap', item)"
          >
            <text>{{ item.action }}</text>
          </view>
        </view>
      </view>

      <view class="map-link-card">
        <text class="map-link-title">地图联动状态</text>
        <text class="map-link-copy">兴趣 POI 与轨迹结果会同步高亮首页地图锚点，用户内容进入对应详情页。</text>
      </view>
    </view>
  </scroll-view>
</template>

<script>
export default {
  props: {
    height: { type: Number, default: 0 },
    keyword: { type: String, default: '' }
  },
  emits: ['exit', 'result-tap'],
  data() {
    return {
      results: [
        {
          id: 'poi-1',
          type: 'poi',
          icon: 'POI',
          title: '猫咖兴趣 POI',
          description: '距离 820m · 服务可预约',
          action: '定位'
        },
        {
          id: 'track-1',
          type: 'track',
          icon: '轨迹',
          title: '城市夜景摄影路线',
          description: '8.6km · 52分钟 · 轨迹',
          action: '路线'
        },
        {
          id: 'content-1',
          type: 'content',
          icon: '图',
          title: '用户上传图片内容',
          description: '同频道 24 条相关内容',
          action: '查看'
        }
      ]
    }
  }
}
</script>

<style scoped>
.inline-results {
  width: 100%;
  box-sizing: border-box;
  background: #f7f7f8;
}

.results-body {
  padding: 12px 14px 28px;
  box-sizing: border-box;
}

.ai-summary-card,
.result-row,
.map-link-card {
  background: #fff;
  border: 1px solid rgba(148,163,184,.12);
  box-shadow: 0 5px 16px rgba(15,23,42,.05);
}

.ai-summary-card {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-radius: 14px;
}

.summary-ai {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 46px;
  width: 46px;
  height: 46px;
  border-radius: 11px;
  background: linear-gradient(145deg,#3b82f6,var(--color-info));
  color: #fff;
}

.summary-ai text {
  font-size: 16px;
  font-weight: 800;
}

.summary-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.summary-title {
  color: #171717;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.45;
}

.summary-hint {
  margin-top: 5px;
  color: #9ca3af;
  font-size: 12px;
}

.results-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 64px;
}

.heading-title {
  color: #171717;
  font-size: 17px;
  font-weight: 750;
}

.exit-search {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 82px;
  min-height: 44px;
  padding: 0 14px;
  border-radius: 22px;
  background: #fff7ed;
  color: #c2410c;
  box-sizing: border-box;
}

.exit-search text {
  font-size: 13px;
  font-weight: 700;
}

.exit-search:active {
  background: #ffedd5;
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.result-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 96px;
  padding: 12px;
  border-radius: 12px;
  box-sizing: border-box;
}

.result-thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 76px;
  width: 76px;
  height: 76px;
  border-radius: 11px;
  color: #fff;
}

.result-thumb.poi {
  background: #25c990;
}

.result-thumb.track {
  background: var(--color-primary);
}

.result-thumb.content {
  background: linear-gradient(145deg,#52b7ea,var(--color-info));
}

.result-thumb text {
  color: #fff;
  font-size: 16px;
  font-weight: 800;
}

.result-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.result-title {
  color: #171717;
  font-size: 16px;
  font-weight: 700;
}

.result-desc {
  margin-top: 5px;
  color: #9ca3af;
  font-size: 12px;
  line-height: 1.4;
}

.result-action {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 64px;
  min-width: 64px;
  min-height: 44px;
  border-radius: 22px;
  background: #eff6ff;
  color: var(--color-info);
}

.result-action text {
  font-size: 14px;
  font-weight: 700;
}

.result-action:active {
  background: #dbeafe;
}

.map-link-card {
  display: flex;
  flex-direction: column;
  margin-top: 28px;
  padding: 17px;
  border-radius: 12px;
}

.map-link-title {
  color: #171717;
  font-size: 16px;
  font-weight: 750;
}

.map-link-copy {
  margin-top: 10px;
  color: #8b919b;
  font-size: 13px;
  line-height: 1.65;
}
</style>

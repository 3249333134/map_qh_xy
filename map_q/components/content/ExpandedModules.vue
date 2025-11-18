<template>
  <scroll-view class="expanded-modules" scroll-y :style="{ height: height + 'px' }" @scroll="onScroll">
    <view class="modules-header">
      <text class="header-title">{{ headerTitle }}</text>
      <view class="stats-row">
        <text class="stat">评分 4.8</text>
        <text class="dot">•</text>
        <text class="stat">人气 10.8万</text>
        <text class="dot">•</text>
        <text class="stat">营业中</text>
      </view>
    </view>

    <scroll-view class="image-slider" scroll-x show-scrollbar="false">
      <image v-for="img in images" :key="img" :src="img" class="slider-img" mode="aspectFill" @tap="onImageTap(img)" />
    </scroll-view>

    <view class="description">
      <text class="desc-text">{{ description }}</text>
    </view>

    <view class="subtabs">
      <view v-for="t in tabs" :key="t.id" :class="['subtab',{ active: t.id===activeTab }]" @tap="selectTab(t.id)">{{ t.name }}</view>
    </view>

    <view v-for="section in sections" :key="section.id" class="module">
      <view class="module-title">{{ section.name }}</view>
      <view class="module-list">
        <view v-for="item in section.items" :key="item.id" class="list-item" @tap="onItemTap(item)">
          <view class="item-left">
            <view class="item-name">{{ item.title }}</view>
            <view class="item-desc">{{ item.desc }}</view>
          </view>
          <view class="item-actions">
            <view class="price" v-if="item.price">￥{{ item.price }}</view>
            <button class="btn-secondary" @tap.stop="onNavigate(item)">导航</button>
            <button class="btn-primary" @tap.stop="onReserve(item)">预约</button>
          </view>
        </view>
      </view>
    </view>
  </scroll-view>
  
</template>

<script>
export default {
  props: {
    height: { type: Number, default: 0 },
    selectedPoint: { type: Object, default: null }
  },
  emits: ['item-tap','reserve','navigate'],
  data() {
    return {
      images: [
        '/static/logo.png',
        '/static/logo.png',
        '/static/logo.png'
      ],
      description: '这里是地点简介，包含历史、特色与注意事项等信息，帮助你更好地了解。',
      tabs: [
        { id: 'overview', name: '概览' },
        { id: '热门', name: '热门' },
        { id: '项目', name: '项目' }
      ],
      activeTab: 'overview',
      sections: [
        { id: 'hot', name: '热门推荐', items: [
          { id: 'h1', title: '不见人精品展', desc: '当代艺术 | 今日 10:00-18:00', price: 29 },
          { id: 'h2', title: '城市影像展', desc: '摄影 | 周末 10:00-20:00', price: 56.7 },
          { id: 'h3', title: '夜间市集', desc: '文创 | 周五 18:00-23:00', price: 0 }
        ]},
        { id: 'ticket', name: '门票', items: [
          { id: 't1', title: '联票套餐A', desc: '3馆通票 | 有效期7天', price: 422 },
          { id: 't2', title: '常规门票', desc: '单馆门票 | 当日有效', price: 39 }
        ]},
        { id: 'food', name: '美食', items: [
          { id: 'f1', title: '人气咖啡店', desc: '拿铁/卡布/甜点', price: 28.4 },
          { id: 'f2', title: '地道小吃', desc: '串串/钵钵鸡/冷吃', price: 12 }
        ]},
        { id: 'shopping', name: '购物', items: [
          { id: 's1', title: '文创礼品店', desc: '文具/饰品/周边', price: 29 },
          { id: 's2', title: '潮流集合店', desc: '服饰/鞋履/配件', price: 391 }
        ]},
        { id: 'sight', name: '景点', items: [
          { id: 'si1', title: '中心广场', desc: '打卡地标 | 免费', price: 0 },
          { id: 'si2', title: '城市博物馆', desc: '常设展 | 周一闭馆', price: 29 }
        ]},
        { id: 'traffic', name: '交通', items: [
          { id: 'tr1', title: '地铁站A口', desc: '步行 300m | 2号线' },
          { id: 'tr2', title: '公交站B', desc: '步行 200m | 33/61路' }
        ]},
        { id: 'project', name: '项目', items: [
          { id: 'p1', title: '城市更新计划', desc: '公示期 | 2025Q1' },
          { id: 'p2', title: '临展招募', desc: '申请中 | 截止3/31' }
        ]}
      ]
    }
  },
  computed: {
    headerTitle() {
      const n = this.selectedPoint && this.selectedPoint.point && this.selectedPoint.point.name
      return n || '当前位置'
    }
  },
  methods: {
    selectTab(id) { this.activeTab = id },
    onScroll() {},
    onImageTap(img) { this.$emit('item-tap', { type: 'image', src: img }) },
    onItemTap(item) { this.$emit('item-tap', item) },
    onReserve(item) { this.$emit('reserve', { item }) },
    onNavigate(item) { this.$emit('navigate', { item }) }
  }
}
</script>

<style scoped>
.expanded-modules { width: 100%; box-sizing: border-box; background: #f8f8f8; }
.modules-header { padding: 10px 15px; }
.header-title { font-size: 16px; font-weight: 600; color: #333; }
.stats-row { margin-top: 6px; display: flex; align-items: center; color: #888; font-size: 12px; }
.dot { margin: 0 6px; }
.image-slider { display: flex; padding: 10px 10px 0; }
.slider-img { width: 75%; height: 160px; border-radius: 12px; margin-right: 10px; background: #ddd; }
.description { padding: 8px 15px; }
.desc-text { font-size: 13px; color: #555; line-height: 1.6; }
.subtabs { display: flex; padding: 0 15px 10px; }
.subtab { padding: 6px 12px; margin-right: 8px; border-radius: 14px; background: #f0f0f0; color: #666; font-size: 13px; }
.subtab.active { background: #2196F3; color: #fff; }
.module { padding: 0 10px 10px; }
.module-title { padding: 0 5px 8px; color: #444; font-size: 14px; font-weight: 600; }
.module-list { display: flex; flex-direction: column; gap: 10px; }
.list-item { display: flex; align-items: center; justify-content: space-between; background: #fff; border-radius: 10px; padding: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.item-left { display: flex; flex-direction: column; }
.item-name { font-size: 14px; color: #333; font-weight: 600; }
.item-desc { font-size: 12px; color: #888; margin-top: 4px; }
.item-actions { display: flex; gap: 8px; align-items: center; }
.price { color: #ff6b35; font-weight: 600; }
.btn-secondary { background: #ffffff; color: #ff6b35; border: 1px solid #ffd1c0; border-radius: 8px; padding: 6px 10px; font-size: 12px; }
.btn-primary { background: linear-gradient(90deg,#ff8a3d,#ff6b35,#ff4757); color: #fff; border: none; border-radius: 8px; padding: 6px 10px; font-size: 12px; }
</style>

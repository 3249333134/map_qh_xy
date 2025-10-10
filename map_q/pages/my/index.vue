<template>
  <view class="my-page">
    <!-- 个人信息区域 -->
    <ProfileSection 
      :userInfo="userInfo" 
      :stats="profileStats" 
    />
    
    <!-- 内容区域 - 只在页面就绪后渲染 -->
    <ContentSection 
      v-if="isPageReady"
      ref="contentSection"
      :translateY="contentTranslateY"
      :activeModule="activeModule"
      :is-scroll-at-top="activeModule === 'favorite' ? favoriteScrollAtTop : (activeModule === 'date' ? dateScrollAtTop : true)"
      @drag-start="handleDragStart"
      @drag-move="handleDragMove"
      @drag-end="handleDragEnd"
      @update-translate-y="handleUpdateTranslateY"
      @switch-module="switchModule"
      @settings-click="handleSettingsClick"
    >
      <!-- 位置模块 - 保持原有拖拽功能 -->
      <LocationModule 
        v-if="activeModule === 'location'"
        :userLocations="userLocations"
        :isFullyExpanded="isFullyExpanded"
        @marker-tap="handleMarkerTap"
      />
      
      <!-- 日期模块 - 添加滚动状态监听 -->
      <DateModule 
        v-if="activeModule === 'date'"
        :scheduleData="scheduleData"
        @event-click="handleEventClick"
        @scroll-state-change="handleDateScrollChange"
      />
      
      <!-- 收藏模块 - 移除内容拖拽事件监听器 -->
      <FavoriteModule 
        v-if="activeModule === 'favorite'"
        :favoriteData="favoriteData"
        @item-click="handleFavoriteItemClick"
        @scroll-state-change="handleFavoriteScrollChange"
      />
    </ContentSection>
    
    <!-- 地图信息覆盖层 - 独立于ContentSection，不受transform影响 -->
    <view class="map-info-overlay" v-if="isPageReady && activeModule === 'location'">
      <text class="map-title">我的足迹地图</text>
      <text class="map-desc">我的内容轨迹 ({{ userLocations.length }}个地点)</text>
    </view>
  </view>
</template>

<script>
// 导入组件
import ProfileSection from './components/ProfileSection.vue'
import ContentSection from './components/ContentSection.vue'
import LocationModule from './components/LocationModule.vue'
import DateModule from './components/DateModule.vue'
import FavoriteModule from './components/FavoriteModule.vue'

export default {
  name: 'MyPage',
  // 注册组件
  components: {
    ProfileSection,
    ContentSection,
    LocationModule,
    DateModule,
    FavoriteModule
  },
  
  data() {
    return {
      // 页面状态
      isPageReady: false,
      
      // 页面基础数据
      screenHeight: 0,
      
      // 展开位微调：向上展开距离（像素），用于“加宽”（增大内容可视高度）
      expandUpDistancePx: 305,
      
      // 日程滚动状态
      dateScrollAtTop: true,
      
      // 收藏滚动状态
      favoriteScrollAtTop: true,
      
      // 位置配置
      positions: {
        default: 350,     // 默认位置（1/2状态）
        middle: 200,      // 中间位置
        top: 50          // 顶部位置（右上角退出位置）
      },
      
      contentTranslateY: 350,  // 初始位置为默认状态
      activeModule: 'favorite',  // 改为默认激活收藏模块
      
      // 拖拽相关
      startY: 0,
      startTranslateY: 0,
      isDragging: false,
      dragThreshold: 5,  // 降低拖拽阈值，提高灵敏度
      dragStartTime: 0,
      
      // 用户信息
      userInfo: {
        avatar: '/static/logo.png',
        username: '用户名',
        description: '这里是用户描述信息'
      },
      
      // 个人资料统计 - 修改为数组格式
      profileStats: [
        { number: 128, label: '关注' },
        { number: 256, label: '粉丝' },
        { number: 32, label: '动态' }
      ],
      
      // 用户位置数据
      userLocations: [
        {
          id: 1,
          title: '北京市',
          latitude: 39.9042,
          longitude: 116.4074,
          address: '北京市朝阳区',
          visitCount: 15,
          lastVisit: '2024-01-15'
        },
        {
          id: 2,
          title: '上海市',
          latitude: 31.2304,
          longitude: 121.4737,
          address: '上海市浦东新区',
          visitCount: 8,
          lastVisit: '2024-01-10'
        }
      ],
      
      // 日程数据
      scheduleData: [
        {
          id: 1,
          title: '会议',
          time: '09:00',
          date: '2024-01-20',
          location: '会议室A',
          content: '项目讨论会议'
        },
        {
          id: 2,
          title: '午餐',
          time: '12:30',
          date: '2024-01-20',
          location: '餐厅',
          content: '与客户午餐'
        }
      ],
      
      // 收藏数据 - 添加测试数据
      // 确保 favoriteData 格式正确
      favoriteData: {
        photos: [
          {
            id: 1,
            title: '美丽的日落',
            icon: '🌅',
            author: '摄影师小王',
            location: '成都市锦江区',
            likes: 128,
            time: '2024-01-15 18:30'
          },
          {
            id: 2,
            title: '城市夜景',
            icon: '🌃',
            author: '夜拍达人',
            location: '成都市武侯区',
            likes: 89,
            time: '2024-01-14 20:15'
          },
          {
            id: 3,
            title: '春天的花朵',
            icon: '🌸',
            author: '花卉爱好者',
            location: '成都市青羊区',
            likes: 156,
            time: '2024-01-13 14:20'
          }
        ],
        videos: [
          {
            id: 4,
            title: '街头表演',
            icon: '🎭',
            author: '街拍小哥',
            location: '成都市春熙路',
            likes: 234,
            time: '2024-01-12 16:45'
          },
          {
            id: 5,
            title: '美食制作',
            icon: '🍜',
            author: '美食博主',
            location: '成都市宽窄巷子',
            likes: 312,
            time: '2024-01-11 12:30'
          }
        ],
        articles: [
          {
            id: 6,
            title: '成都旅游攻略',
            icon: '📖',
            author: '旅游达人',
            location: '成都市',
            likes: 445,
            time: '2024-01-10 09:15'
          },
          {
            id: 7,
            title: '川菜文化探索',
            icon: '📚',
            author: '文化学者',
            location: '成都市金牛区',
            likes: 178,
            time: '2024-01-09 15:20'
          }
        ],
        music: [
          {
            id: 8,
            title: '成都民谣',
            icon: '🎵',
            author: '民谣歌手',
            location: '成都市音乐厅',
            likes: 267,
            time: '2024-01-08 19:30'
          }
        ],
        locations: [
          {
            id: 9,
            title: '宽窄巷子',
            icon: '🏛️',
            author: '地点收藏',
            location: '成都市青羊区',
            likes: 89,
            time: '2024-01-07 11:00'
          },
          {
            id: 10,
            title: '锦里古街',
            icon: '🏮',
            author: '古建筑爱好者',
            location: '成都市武侯区',
            likes: 156,
            time: '2024-01-06 16:30'
          }
        ],
        // 新增：服务收藏示例数据（将展示为服务卡片）
        services: [
          {
            id: 1001,
            type: 'service',
            name: '家电维修',
            author: '张师傅',
            location: { coordinates: [104.0668, 30.5728] },
            address: '成都市锦江区春熙路',
            likes: 56,
            time: '2024-01-05 10:30',
            rating: 4.7
          },
          {
            id: 1002,
            type: 'service',
            name: '上门开锁',
            author: '李师傅',
            location: { coordinates: [104.0431, 30.6765] },
            address: '成都市武侯区火车南站',
            likes: 123,
            time: '2024-01-04 21:00',
            score: 4.9
          },
          {
            id: 1003,
            type: 'service',
            name: '管道疏通',
            author: '杨师傅',
            location: { coordinates: [104.0720, 30.6710] },
            address: '成都市青羊区太升南路',
            likes: 32,
            time: '2024-01-03 08:45',
            rating: 4.5
          }
        ]
      }
    }
  },
  
  computed: {
    // 判断是否完全展开
    isFullyExpanded() {
      return this.contentTranslateY <= this.positions.top
    },
    
    // 简化的位置计算
    currentPosition() {
      const current = this.contentTranslateY
      const { top, default: defaultPos } = this.positions
      
      // 只区分是否接近边界
      if (Math.abs(current - top) < 30) {
        return 'top'
      } else if (Math.abs(current - defaultPos) < 30) {
        return 'default'
      } else {
        return 'free' // 自由位置
      }
    }
  },
  
  created() {
    // rAF 安全降级初始化（在任何交互发生前）
    if (typeof requestAnimationFrame !== 'function') {
      this._requestFrame = (fn) => setTimeout(fn, 16)
      this._cancelFrame = (id) => clearTimeout(id)
    } else {
      this._requestFrame = (fn) => requestAnimationFrame(fn)
      this._cancelFrame = (id) => cancelAnimationFrame(id)
    }
  },
  
  // 使用 onReady 而不是 onLoad
  onReady() {
    // 确保页面完全加载后再初始化
    this.$nextTick(() => {
      this.initPage()
      this.isPageReady = true
    })
  },
  
  // 添加 mounted 生命周期钩子
  mounted() {
    console.log('index.vue mounted - favoriteData:', this.favoriteData)
    console.log('favoriteData.photos length:', (this.favoriteData && this.favoriteData.photos ? this.favoriteData.photos.length : 0))
    console.log('favoriteData.videos length:', (this.favoriteData && this.favoriteData.videos ? this.favoriteData.videos.length : 0))
    
    // 确保数据是响应式的
    this.$forceUpdate()
  },
  
  methods: {
    initPage() {
      // 延迟执行，确保小程序框架就绪
      setTimeout(() => {
        try {
          const systemInfo = uni.getWindowInfo()
          this.screenHeight = systemInfo.windowHeight
      
          const applyPositions = (profileHeight) => {
            const computedTop = Math.max(0, Math.round(profileHeight))
            // 目标：向上拉动让内容变大 => translateY 需要减小，因此 default 必须比 top 更小
            const expandUp = (this.expandUpDistancePx || 160)
            const computedDefault = Math.max(0, Math.round(computedTop - expandUp))
            this.positions.top = computedTop
            this.positions.default = computedDefault
            this.positions.middle = Math.round((this.positions.top + this.positions.default) / 2)
            if (this.activeModule !== 'location') {
              // 初始状态停在顶部位（图一）
              this.contentTranslateY = this.positions.top
            }
          }
      
          const query = typeof uni.createSelectorQuery === 'function' ? uni.createSelectorQuery().in(this) : null
          if (query) {
            query
              .select('.profile-section')
              .boundingClientRect((rect) => {
                if (rect && rect.height) {
                  applyPositions(rect.height)
                } else {
                  applyPositions(350)
                }
              })
              .exec()
          } else {
            applyPositions(350)
          }
        } catch (e) {
          console.warn('获取系统信息失败，使用兜底方案:', e)
          this.screenHeight = 667
          const fallbackTop = 350
          const expandUp = (this.expandUpDistancePx || 160)
          const fallbackDefault = Math.max(0, Math.round(fallbackTop - expandUp))
          this.positions.top = fallbackTop
          this.positions.default = fallbackDefault
          this.positions.middle = Math.round((this.positions.top + this.positions.default) / 2)
          if (this.activeModule !== 'location') {
            this.contentTranslateY = this.positions.top
          }
        }
      }, 100)
    },
    
    // 模块切换
    switchModule(module) {
      this.activeModule = module
      // 不强制改变当前位置，保持用户当前拖拽状态
      // 如需点击快速吸附，请使用 handleQuickSwitch 或拖拽到端点
    },
    
    // 新的拖拽开始处理
    // 修改 handleDragStart 方法，允许日期模块的拖拽
    handleDragStart(e) {
    // 移除对模块类型的限制，允许所有模块处理拖拽
    const eventData = e.detail || e
    this.startY = eventData.startY
    this.startTranslateY = this.contentTranslateY
    this.isDragging = true
    // 记录拖拽开始时间，用于计算甩动速度
    this.dragStartTime = Date.now()
    // 每次开始拖拽清空上一轮 rAF
    if (this._rafId && typeof this._cancelFrame === 'function') {
      this._cancelFrame(this._rafId)
    }
    this._queuedY = null
    this._rafId = null
    },
    
    handleDragMove(e) {
    if (!this.isDragging) return
    const eventData = e && e.detail ? e.detail : {}
    const currentY = eventData.currentY
    const deltaY = currentY - this.startY
    
    // 统一逻辑：实时位移由子组件通过 update-translate-y 事件驱动，父组件不在 drag-move 中直接更新
    return
    },
    
    // 新增：接收收藏模块滚动状态
    handleFavoriteScrollChange(scrollState) {
      this.favoriteScrollAtTop = !!(scrollState && scrollState.isAtTop)
    },
    
    // 新增：接收日期模块滚动状态
    handleDateScrollChange(scrollState) {
      this.dateScrollAtTop = !!(scrollState && scrollState.isAtTop)
    },
    
    // 新增：接收 ContentSection 内部按比例调整位移
    handleUpdateTranslateY(newY) {
      const minY = Math.min(this.positions.top, this.positions.default)
      const maxY = Math.max(this.positions.top, this.positions.default)
      const clamped = typeof newY === 'number' ? Math.max(Math.min(newY, maxY), minY) : this.contentTranslateY
      if (!this._rafId) {
        this._queuedY = clamped
        this._rafId = this._requestFrame(() => {
          this.contentTranslateY = this._queuedY
          this._rafId = null
        })
      } else {
        this._queuedY = clamped
      }
    },
    handleDragEnd(e) {
      if (!this.isDragging) {
        return
      }
      
      const eventData = e.detail || e
      const deltaY = eventData.deltaY || 0
      const dragDurationMs = eventData.dragDuration || (Date.now() - (this.dragStartTime || Date.now()))
      const dragDistance = Math.abs(deltaY)
      
      const tapDistanceThreshold = 6
      const tapDurationThreshold = 180
      if (dragDistance <= tapDistanceThreshold && dragDurationMs <= tapDurationThreshold) {
        this.isDragging = false
        return
      }
      
      this.isDragging = false
      
      if (this.activeModule === 'location') {
        // 与收藏/日期一致：使用速度阈值与 top/default 两档吸附
        const eventData2 = e.detail || e
        const deltaY2 = eventData2.deltaY || 0
        const dragDurationMs2 = Date.now() - (this.dragStartTime || Date.now())
        const velocity = dragDurationMs2 > 0 ? Math.abs(deltaY2) / dragDurationMs2 : 0
        
        let finalY = this.contentTranslateY
        const minY = Math.min(this.positions.top, this.positions.default)
        const maxY = Math.max(this.positions.top, this.positions.default)
        
        if (velocity > 0.3) {
          if (deltaY2 < 0) {
            // 快速向上：吸附到更小的 Y（default）
            finalY = this.positions.default
          } else {
            finalY = this.positions.top
          }
        } else {
          const distanceToTop = Math.abs(finalY - this.positions.top)
          const distanceToDefault = Math.abs(finalY - this.positions.default)
          const threshold = this.snapThreshold || 60
          if (distanceToTop <= threshold || distanceToDefault <= threshold) {
            finalY = distanceToTop <= distanceToDefault ? this.positions.top : this.positions.default
          } else {
            finalY = distanceToTop <= distanceToDefault ? this.positions.top : this.positions.default
          }
        }
        
        finalY = Math.max(Math.min(finalY, maxY), minY)
        this.animateToPosition(finalY)
        return
      }
      
      if (this.activeModule === 'date' || this.activeModule === 'favorite') {
        const eventData2 = e.detail || e
        const deltaY2 = eventData2.deltaY || 0
        const dragDurationMs2 = Date.now() - (this.dragStartTime || Date.now())
        const velocity = dragDurationMs2 > 0 ? Math.abs(deltaY2) / dragDurationMs2 : 0
        
        let finalY = this.contentTranslateY
        const isAtTop = this.activeModule === 'favorite' ? this.favoriteScrollAtTop : this.dateScrollAtTop
        const minY = Math.min(this.positions.top, this.positions.default)
        const maxY = Math.max(this.positions.top, this.positions.default)
        
        if (velocity > 0.3) {
          if (deltaY2 < 0) {
            // 快速向上：吸附到更小的 Y（default）
            finalY = this.positions.default
          } else {
            finalY = isAtTop ? this.positions.top : finalY
          }
        } else {
          const distanceToTop = Math.abs(finalY - this.positions.top)
          const distanceToDefault = Math.abs(finalY - this.positions.default)
          const threshold = this.snapThreshold || 60
          if (distanceToTop <= threshold || distanceToDefault <= threshold) {
            finalY = distanceToTop <= distanceToDefault ? this.positions.top : this.positions.default
          } else {
            finalY = distanceToTop <= distanceToDefault ? this.positions.top : this.positions.default
          }
        }
        
        finalY = Math.max(Math.min(finalY, maxY), minY)
        this.animateToPosition(finalY)
        return
      }
    },
    
    // 增强动画函数，添加平滑过渡
    animateToPosition(targetY) {
      // 小程序端不要直接操作 DOM，依靠子组件的 CSS 过渡
      // 使用 rAF/polyfill 确保赋值在同一帧
      if (!this._rafId) {
        this._queuedY = targetY
        this._rafId = this._requestFrame(() => {
          this.contentTranslateY = this._queuedY
          this._rafId = null
        })
      } else {
        this._queuedY = targetY
      }
    },
    
    // 添加点击快速切换功能（可选）
    handleQuickSwitch() {
      const current = this.currentPosition
      let targetPosition
      
      if (current === 'default') {
        targetPosition = 'top'
      } else {
        targetPosition = 'default'
      }
      
      this.animateToPosition(this.positions[targetPosition])
    },
    
    // 事件处理方法
    handleMarkerTap({ location, markerId }) {
      uni.showModal({
        title: location.title,
        content: `查看在${location.title}发布的内容`,
        confirmText: '查看',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            console.log('查看内容:', location)
          }
        }
      })
    },
    
    handleEventClick(event) {
      uni.showModal({
        title: event.title,
        content: `时间: ${event.time}\n地点: ${event.location || '无'}\n内容: ${event.content || '无'}`,
        showCancel: false
      })
    },
    
    handleFavoriteItemClick(item) {
      uni.showModal({
        title: item.title,
        content: item.desc,
        showCancel: false
      })
    },
    
    handleSettingsClick() {
      uni.showToast({
        title: '设置功能',
        icon: 'none'
      })
    },
    
  }
}
</script>

<style scoped>
.my-page {
  width: 100%;
  height: 100vh;
  background: linear-gradient(180deg, #e8e8e8 0%, #d0d0d0 100%);
  position: relative;
  overflow: hidden;
}

/* 地图信息覆盖层样式 */
.map-info-overlay {
  position: fixed !important;
  bottom: 2px; /* 更贴近底部导航，尽可能消除空隙 */
  left: 9px;
  right: 9px;
  background: rgba(255, 255, 255, 0.9); /* 改为绿色背景，与位置按钮颜色呼应 */
  border-radius: 12px;
  padding: 12px 16px;
  z-index: 9999 !important;
  transform: none !important;
  isolation: isolate !important;
  transform-style: flat !important;
  backface-visibility: hidden !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); /* 添加阴影效果 */
}

.map-title {
  color: #000000;
  font-size: 16px;
  font-weight: 600;
  display: block;
  margin-bottom: 4px;
}

.map-desc {
  color: rgba(0, 0, 0, 0.9); /* 稍微提高透明度 */
  font-size: 14px;
  display: block;
}
</style>

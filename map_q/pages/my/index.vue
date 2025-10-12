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
        v-show="activeModule === 'location'"
        :userLocations="userLocations"
        :isFullyExpanded="isFullyExpanded"
        @marker-tap="handleMarkerTap"
      />
      
      <!-- 日期模块 - 添加滚动状态监听 -->
      <DateModule 
        v-show="activeModule === 'date'"
        :scheduleData="scheduleData"
        @event-click="handleEventClick"
        @scroll-state-change="handleDateScrollChange"
      />
      
      <!-- 收藏模块 - 移除内容拖拽事件监听器 -->
      <FavoriteModule 
        v-show="activeModule === 'favorite'"
        :favoriteData="favoriteData"
        @item-click="handleFavoriteItemClick"
        @scroll-state-change="handleFavoriteScrollChange"
      />
    </ContentSection>
    
    <!-- 地图信息覆盖层 - 独立于ContentSection，不受transform影响 -->
    <view class="map-info-overlay" :class="{ expanded: isOverlayExpanded }" v-if="isPageReady && activeModule === 'location'" @tap="expandMapFullScreen" @click="expandMapFullScreen" :style="mapOverlayStyle">
      <text class="map-title">我的足迹地图</text>
      <text class="map-desc">我的内容轨迹 ({{ userLocations.length }}个地点)</text>
      <!-- 展开后显示分类 + 两列瀑布流收藏卡片 -->
      <view v-if="isOverlayExpanded" class="overlay-expanded-content" @tap.stop @click.stop @touchstart.stop="onOverlayTouchStart" @touchmove.stop="onOverlayTouchMove" @touchend.stop="onOverlayTouchEnd">
        <!-- 左侧行政层级分类 -->
        <view class="overlay-levels">
          <view v-for="lvl in overlayLevels" :key="lvl" class="overlay-level-item" :class="{ active: lvl === activeOverlayLevel }" @tap.stop="handleOverlayLevelChange(lvl)" @click.stop="handleOverlayLevelChange(lvl)">
            {{ lvl }}
          </view>
        </view>
        <!-- 右侧两列瀑布流收藏卡片 -->
        <scroll-view class="overlay-cards-container" scroll-y show-scrollbar="false">
          <view class="overlay-cards-grid">
            <view class="overlay-cards-column">
              <template v-for="(item, idx) in overlayLeftColumnData" :key="'left-' + (item._id || item.id || '') + '-' + idx">
                <service-card-item v-if="item.type === 'service'" :index="idx" :card-data="item" :height="getOverlayCardHeight('left', idx)" column-type="left" />
                <card-item v-else :index="idx" :card-data="item" :height="getOverlayCardHeight('left', idx)" column-type="left" />
              </template>
            </view>
            <view class="overlay-cards-column">
              <template v-for="(item, idx) in overlayRightColumnData" :key="'right-' + (item._id || item.id || '') + '-' + idx">
                <service-card-item v-if="item.type === 'service'" :index="overlayLeftColumnData.length + idx" :card-data="item" :height="getOverlayCardHeight('right', idx)" column-type="right" />
                <card-item v-else :index="overlayLeftColumnData.length + idx" :card-data="item" :height="getOverlayCardHeight('right', idx)" column-type="right" />
              </template>
            </view>
          </view>
        </scroll-view>
      </view>
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
import CardItem from '../../components/card/CardItem.vue'
import ServiceCardItem from '../../components/card/ServiceCardItem.vue'

export default {
  name: 'MyPage',
  // 注册组件
  components: {
    ProfileSection,
    ContentSection,
    LocationModule,
    DateModule,
    FavoriteModule,
    CardItem,
    ServiceCardItem
  },
  
  data() {
    return {
      // 页面状态
      isPageReady: false,
      
      // 页面基础数据
      screenHeight: 0,
      
      // 恢复为内容区域扩展：default 档位上移但不覆盖整个页面
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
      // 新增：控制“我的足迹地图”覆盖层是否处于展开状态
      isOverlayExpanded: false,
      // 展开后的左侧行政层级分类（按你的要求排序：国、县、市、区、街）
      overlayLevels: ['国', '县', '市', '区', '街'],
      activeOverlayLevel: '市',
      // 设备安全区顶部偏移，用于展开覆盖层对齐
      safeTopOffset: 0,
      // 覆盖层触摸交互
      overlayTouchStartY: 0,
      overlayTouchLastY: 0,
      overlayTouchStartTime: 0,
      overlaySwipeThreshold: 50,
      overlaySwipeVelocityThreshold: 0.35,
      // rAF/动画相关内部状态（避免 no-undef 报错）
      _requestFrame: null,
      _cancelFrame: null,
      _rafId: null,
      _queuedY: null,
      snapThreshold: 60,
      
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
      
      // 用户位置数据：由收藏卡片映射生成
      userLocations: [],
      
      // 随机位置缓存（仅用于无坐标的内容收藏，保证会话内稳定）
      _favoriteRandomLocations: {},
      
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
    }},
  
  computed: {
    // 判断是否完全展开
    isFullyExpanded: function() {
      return this.contentTranslateY <= this.positions.top;
    },
    
    // 简化的位置计算
    currentPosition: function() {
      const current = this.contentTranslateY;
      const top = this.positions.top;
      const defaultPos = this.positions.default;
      
      // 只区分是否接近边界
      if (Math.abs(current - top) < 30) {
        return 'top';
      } else if (Math.abs(current - defaultPos) < 30) {
        return 'default';
      } else {
        return 'free'; // 自由位置
      }
    },
    
    // 新增：覆盖层样式，展开时铺满内容区域（与 ContentSection 的 module-content 区域对齐）
    mapOverlayStyle: function() {
      if (!this.isOverlayExpanded) return {};
      // ContentSection 的内容区域距离其顶部 42px，整体容器再由 translateY 下移
      const top = this.contentTranslateY + 42 + (this.safeTopOffset || 0);
      return {
        top: top + 'px',
        left: '9px',
        right: '9px',
        bottom: '2px'
      };
    },
    // 展开覆盖层右侧卡片：汇总收藏、按层级过滤、两列分配
    favoriteAllItems: function() {
      var f = this.favoriteData || {};
      var groups = ['photos', 'videos', 'articles', 'music', 'locations', 'services'];
      var all = [];
      groups.forEach(function(g) {
        var arr = Array.isArray(f[g]) ? f[g] : [];
        arr.forEach(function(item) {
          var copied = Object.assign({}, item);
          copied.type = (item && item.type === 'service') ? 'service' : (g === 'services' ? 'service' : 'content');
          all.push(copied);
        });
      });
      return all;
    },
    overlayFilteredCards: function() {
      var lvl = this.activeOverlayLevel;
      return this.favoriteAllItems.filter(function(it) { return this.matchCardScope(it, lvl); }.bind(this));
    },
    overlayLeftColumnData: function() {
      return this.overlayFilteredCards.filter(function(_, i) { return i % 2 === 0; });
    },
    overlayRightColumnData: function() {
      return this.overlayFilteredCards.filter(function(_, i) { return i % 2 === 1; });
    }
  },
  
  created: function() {
    // rAF 安全降级初始化（在任何交互发生前）
    if (typeof requestAnimationFrame !== 'function') {
      this._requestFrame = (fn) => setTimeout(fn, 16);
      this._cancelFrame = (id) => clearTimeout(id);
    } else {
      this._requestFrame = (fn) => requestAnimationFrame(fn);
      this._cancelFrame = (id) => cancelAnimationFrame(id);
    }
  },
  
  // 使用 onReady 而不是 onLoad
  onReady: function() {
    // 确保页面完全加载后再初始化
    this.$nextTick(() => {
      this.initPage()
      this.isPageReady = true
      // 构建基于收藏数据的用户位置标记点
      this.buildUserLocationsFromFavorites()
    })
  },
  
  // 添加 mounted 生命周期钩子
  mounted: function() {
    console.log('index.vue mounted - favoriteData:', this.favoriteData)
    console.log('favoriteData.photos length:', (this.favoriteData && this.favoriteData.photos ? this.favoriteData.photos.length : 0))
    console.log('favoriteData.videos length:', (this.favoriteData && this.favoriteData.videos ? this.favoriteData.videos.length : 0))
    
    // 确保数据是响应式的
    this.$forceUpdate()
  },
  
  methods: {
    initPage: function() {
      // 延迟执行，确保小程序框架就绪
      setTimeout(() => {
        try {
          const systemInfo = uni.getWindowInfo()
          // 记录安全区顶部偏移（兼容多端字段）
          this.safeTopOffset = (systemInfo && ((systemInfo.safeAreaInsets && systemInfo.safeAreaInsets.top) || (systemInfo.safeArea && systemInfo.safeArea.top) || systemInfo.statusBarHeight || 0)) || 0
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
    switchModule: function(module) {
      this.activeModule = module
      // 切换模块时收起“我的足迹地图”覆盖层
      this.isOverlayExpanded = false
      // 不强制改变当前位置，保持用户当前拖拽状态
      // 如需点击快速吸附，请使用 handleQuickSwitch 或拖拽到端点
    },
    
    // 新的拖拽开始处理
    // 修改 handleDragStart 方法，允许日期模块的拖拽
    handleDragStart: function(e) {
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
    
    handleDragMove: function(e) {
    if (!this.isDragging) return
    const eventData = e && e.detail ? e.detail : {}
    const currentY = eventData.currentY
    const deltaY = currentY - this.startY
    
    // 统一逻辑：实时位移由子组件通过 update-translate-y 事件驱动，父组件不在 drag-move 中直接更新
    return
    },
    
    // 新增：接收收藏模块滚动状态
    handleFavoriteScrollChange: function(scrollState) {
      this.favoriteScrollAtTop = !!(scrollState && scrollState.isAtTop)
    },
    
    // 新增：接收日期模块滚动状态
    handleDateScrollChange: function(scrollState) {
      this.dateScrollAtTop = !!(scrollState && scrollState.isAtTop)
    },
    
    // 新增：接收 ContentSection 内部按比例调整位移
    handleUpdateTranslateY: function(newY) {
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
    handleDragEnd: function(e) {
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
    animateToPosition: function(targetY) {
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
    handleQuickSwitch: function() {
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
    handleMarkerTap: function({ location, markerId }) {
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
    
    handleEventClick: function(event) {
      uni.showModal({
        title: event.title,
        content: `时间: ${event.time}\n地点: ${event.location || '无'}\n内容: ${event.content || '无'}`,
        showCancel: false
      })
    },
    
    handleFavoriteItemClick: function(item) {
      uni.showModal({
        title: item.title,
        content: item.desc,
        showCancel: false
      })
    },
    
    handleSettingsClick: function() {
      uni.showToast({
        title: '设置功能',
        icon: 'none'
      })
    },

    // 新增：点击底部“我的足迹地图”覆盖层时，让该卡片本身变大并覆盖到整个内容区域（再次点击收回）
    expandMapFullScreen: function() {
      // 始终切换到位置模块
      this.activeModule = 'location'
      // 切换展开/收起
      this.isOverlayExpanded = !this.isOverlayExpanded
      try {
        uni.showToast({ title: this.isOverlayExpanded ? '展开我的足迹地图卡片' : '收起我的足迹地图卡片', icon: 'none', duration: 600 })
      } catch (e) {}
    },
    
    // 新增：生成成都区域内的随机坐标（lng, lat）
    getRandomCoordinateInChengdu: function() {
      const minLat = 30.55, maxLat = 30.75
      const minLng = 104.03, maxLng = 104.15
      const lat = +(minLat + Math.random() * (maxLat - minLat)).toFixed(6)
      const lng = +(minLng + Math.random() * (maxLng - minLng)).toFixed(6)
      return [lng, lat]
    },
    
    // 新增：随机地址文案（用于展示更友好位置文本）
    getRandomAddress: function() {
      const addresses = [
        '成都市锦江区春熙路',
        '成都市武侯区科华北路',
        '成都市青羊区顺城大街',
        '成都市高新区天府大道',
        '成都市金牛区一环路北一段'
      ]
      return addresses[Math.floor(Math.random() * addresses.length)]
    },
    
    // 新增：为内容收藏补充随机位置（仅在缺少坐标时生效）
    ensureRandomLocationForIndex: function(item, index, categoryKey) {
      if (!item || typeof item !== 'object') return { coordinates: null, address: '' }
      const hasCoords = !!(item.location && Array.isArray(item.location.coordinates) && item.location.coordinates.length === 2)
      const coordsFromAlt = Array.isArray(item.coordinates) ? item.coordinates : null
      if (hasCoords) {
        return { coordinates: item.location.coordinates, address: item.address || '' }
      }
      if (coordsFromAlt) {
        return { coordinates: coordsFromAlt, address: item.address || '' }
      }
      const key = (item._id || item.id) ? (item._id || item.id) : `${categoryKey}-${index}`
      if (!this._favoriteRandomLocations[key]) {
        const coordinates = this.getRandomCoordinateInChengdu()
        this._favoriteRandomLocations[key] = {
          coordinates,
          address: item.address || this.getRandomAddress()
        }
      }
      return this._favoriteRandomLocations[key]
    },

    // 行政层级点击切换
    handleOverlayLevelChange: function(lvl) {
      this.activeOverlayLevel = lvl
    },
    // 根据地址/位置文本判断所属层级（简易规则）
    matchCardScope: function(item, lvl) {
      const text = ((item && (item.address || item.location || '')) || '').toString()
      const has = s => text.includes(s)
      switch (lvl) {
        case '国':
          return true
        case '县':
          return has('县')
        case '市':
          return has('市')
        case '区':
          return has('区')
        case '街':
          return has('街') || has('路')
        default:
          return true
      }
    },
    // 覆盖层卡片高度（示例：轻微错落）
    getOverlayCardHeight: function(column, idx) {
      const base = 220
      const variance = (idx % 3) * 30
      return base + variance
    },

    // 覆盖层触摸交互：向上滑动收起
    onOverlayTouchStart: function(e) {
      try {
        const t = (e && (e.touches && e.touches[0])) || (e && (e.changedTouches && e.changedTouches[0])) || null
        const y = t ? (typeof t.pageY === 'number' ? t.pageY : t.clientY) : 0
        this.overlayTouchStartY = y
        this.overlayTouchLastY = y
        this.overlayTouchStartTime = Date.now()
      } catch (err) {
        this.overlayTouchStartY = 0
        this.overlayTouchLastY = 0
        this.overlayTouchStartTime = Date.now()
      }
    },
    onOverlayTouchMove: function(e) {
      const t = (e && (e.touches && e.touches[0])) || (e && (e.changedTouches && e.changedTouches[0])) || null
      const y = t ? (typeof t.pageY === 'number' ? t.pageY : t.clientY) : this.overlayTouchLastY
      this.overlayTouchLastY = y
    },
    onOverlayTouchEnd: function(e) {
      const t = (e && (e.changedTouches && e.changedTouches[0])) || (e && (e.touches && e.touches[0])) || null
      const endY = t ? (typeof t.pageY === 'number' ? t.pageY : t.clientY) : this.overlayTouchLastY
      const deltaY = endY - this.overlayTouchStartY
      const duration = Math.max(1, Date.now() - (this.overlayTouchStartTime || Date.now()))
      const velocity = Math.abs(deltaY) / duration
      const threshold = this.overlaySwipeThreshold || 50
      const velocityThreshold = this.overlaySwipeVelocityThreshold || 0.35
      // 向上滑动（deltaY < 0）且满足距离或速度阈值 -> 收起覆盖层
      if (deltaY < 0 && (Math.abs(deltaY) >= threshold || velocity >= velocityThreshold)) {
        this.isOverlayExpanded = false
      }
    },
    
    // 新增：根据收藏数据构建用户位置标记点
    buildUserLocationsFromFavorites: function() {
      try {
        const result = []
        const data = this.favoriteData || {}
        const categoryKeys = Object.keys(data)
        categoryKeys.forEach((key) => {
          const list = Array.isArray(data[key]) ? data[key] : []
          list.forEach((item, index) => {
            const isService = item && (item.type === 'service' || key === 'services' || item.category === 'service' || item.category === 'services')
            let coords = null
            let address = item.address || ''
            if (isService) {
              if (item.location && Array.isArray(item.location.coordinates)) {
                coords = item.location.coordinates
              } else if (Array.isArray(item.coordinates)) {
                coords = item.coordinates
              }
            } else {
              const ensured = this.ensureRandomLocationForIndex(item, index, key)
              coords = ensured.coordinates
              address = address || ensured.address
            }
            if (Array.isArray(coords) && coords.length === 2) {
              const [lng, lat] = coords
              result.push({
                id: item._id || item.id || `${key}-${index}`,
                title: item.title || item.name || '收藏项',
                latitude: lat,
                longitude: lng,
                address,
                // 新增：用于悬浮卡片展示缩略图
                cover: item.cover || item.thumbnail || (item.images && item.images[0]) || '',
                // 新增：收藏卡片的副标题与点赞数，用于缩小版卡片
                subtitle: item.author || item.subtitle || item.desc || '',
                likes: typeof item.likes === 'number' ? item.likes : (parseInt(item.likes, 10) || undefined),
                // 新增：区分服务与内容，供地图 cover-view 显示“预”与跳转
                type: isService ? 'service' : 'content'
              })
            }
          })
        })
        this.userLocations = result
      } catch (e) {
        console.warn('根据收藏数据构建位置标记点失败', e)
      }
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
  transition: all 0.25s ease;
}

/* 展开时保持配色与透明度不变，仅改变占位尺寸（靠内联样式的 top/bottom 控制高度）*/
.map-info-overlay.expanded {
  border-radius: 12px;
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
/* 展开内容布局样式 */
.overlay-expanded-content {
  display: flex;
  flex-direction: row;
  gap: 12px;
  margin-top: 8px;
  height: calc(100% - 48px); /* 预留标题与描述空间 */
}

.overlay-levels {
  flex: 0 0 72px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.overlay-level-item {
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(240, 240, 240, 0.9);
  color: #333;
  text-align: center;
}

.overlay-level-item.active {
  background: rgba(0, 128, 0, 0.15);
  color: #0a7c0a;
  font-weight: 600;
}

.overlay-cards-container {
  flex: 1 1 auto;
  height: 100%;
}

.overlay-cards-grid {
  display: flex;
  flex-direction: row;
  gap: 12px;
  align-items: flex-start;
}

.overlay-cards-column {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>

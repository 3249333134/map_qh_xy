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
      :translateY="contentTranslateY"
      :activeModule="activeModule"
      :is-scroll-at-top="dateScrollAtTop"
      @drag-start="handleDragStart"
      @drag-move="handleDragMove"
      @drag-end="handleDragEnd"
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
      
      // 日程滚动状态
      dateScrollAtTop: true,
      
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
      dragThreshold: 15,  // 降低拖拽阈值，提高灵敏度
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
    console.log('favoriteData.photos length:', this.favoriteData?.photos?.length || 0)
    console.log('favoriteData.videos length:', this.favoriteData?.videos?.length || 0)
    
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
        } catch (e) {
          console.warn('获取系统信息失败，使用兜底方案:', e)
          // 兜底方案
          this.screenHeight = 667
        }
      }, 100)
    },
    
    // 模块切换
    switchModule(module) {
      this.activeModule = module
    },
    
    // 新的拖拽开始处理
    // 修改 handleDragStart 方法，允许日期模块的拖拽
    handleDragStart(e) {
    // 移除对模块类型的限制，允许所有模块处理拖拽
    const eventData = e.detail || e
    this.startY = eventData.startY
    this.startTranslateY = this.contentTranslateY
    this.isDragging = true
    this.dragStartTime = Date.now()
    },
    
    handleDragMove(e) {
    if (!this.isDragging) return
    
    const eventData = e.detail || e
    if (!eventData || typeof eventData.currentY === 'undefined') {
      return
    }
    
    const currentY = eventData.currentY
    const deltaY = currentY - this.startY
    
    // 位置模块：保持原有的双向限位逻辑
    if (this.activeModule === 'location') {
      let newTranslateY = this.startTranslateY + deltaY
      
      const minY = this.positions.top      // 50px - 上限位
      const maxY = this.positions.default  // 350px - 下限位
      
      if (newTranslateY < minY) {
        newTranslateY = minY
      } else if (newTranslateY > maxY) {
        newTranslateY = maxY
      }
      
      this.contentTranslateY = newTranslateY
      return
    }
    
    // 日期模块和收藏模块：实现基于滚动方向的动态调整
    if (this.activeModule === 'date' || this.activeModule === 'favorite') {
      let newTranslateY = this.startTranslateY + deltaY
      
      // 向上滑动：允许扩大到顶部位置
      if (deltaY < 0) {
        const minY = this.positions.top // 50px - 最大扩展位置
        newTranslateY = Math.max(newTranslateY, minY)
      }
      // 向下滑动：允许缩小到默认位置
      else if (deltaY > 0) {
        const maxY = this.positions.default // 350px - 最小位置
        newTranslateY = Math.min(newTranslateY, maxY)
      }
      
      this.contentTranslateY = newTranslateY
      return
    }
    },
    
    handleDragEnd(e) {
      if (!this.isDragging) return
      
      this.isDragging = false
      
      // 位置模块：保持原有的智能停靠逻辑
      if (this.activeModule === 'location') {
        const minY = this.positions.top
        const maxY = this.positions.default
        
        let finalY = this.contentTranslateY
        
        if (finalY < minY) {
          finalY = minY
        } else if (finalY > maxY) {
          finalY = maxY
        }
        
        const distanceToTop = Math.abs(finalY - this.positions.top)
        const distanceToMiddle = Math.abs(finalY - this.positions.middle)
        const distanceToDefault = Math.abs(finalY - this.positions.default)
        
        if (distanceToTop <= distanceToMiddle && distanceToTop <= distanceToDefault) {
          finalY = this.positions.top
        } else if (distanceToMiddle <= distanceToDefault) {
          finalY = this.positions.middle
        } else {
          finalY = this.positions.default
        }
        
        this.animateToPosition(finalY)
        return
      }
      
      // 日期模块和收藏模块：实现渐进式停靠
      if (this.activeModule === 'date' || this.activeModule === 'favorite') {
        const eventData = e.detail || e
        const deltaY = eventData.deltaY || 0
        const velocity = Math.abs(deltaY) / (eventData.dragDuration || 1)
        
        let finalY = this.contentTranslateY
        
        // 根据拖拽速度和方向决定最终位置
        if (velocity > 0.5) { // 快速拖拽
          if (deltaY < 0) {
            // 快速向上：直接到顶部
            finalY = this.positions.top
          } else {
            // 快速向下：直接到默认位置
            finalY = this.positions.default
          }
        } else { // 慢速拖拽：智能停靠到最近位置
          const distanceToTop = Math.abs(finalY - this.positions.top)
          const distanceToMiddle = Math.abs(finalY - this.positions.middle)
          const distanceToDefault = Math.abs(finalY - this.positions.default)
          
          if (distanceToTop <= distanceToMiddle && distanceToTop <= distanceToDefault) {
            finalY = this.positions.top
          } else if (distanceToMiddle <= distanceToDefault) {
            finalY = this.positions.middle
          } else {
            finalY = this.positions.default
          }
        }
        
        this.animateToPosition(finalY)
        return
      }
    },
    
    // 增强动画函数，添加平滑过渡
    animateToPosition(targetY) {
    // 添加CSS过渡动画类
    const contentSection = this.$refs.contentSection
    if (contentSection) {
    contentSection.$el.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    }
    
    this.contentTranslateY = targetY
    
    // 动画完成后移除过渡
    setTimeout(() => {
    if (contentSection) {
    contentSection.$el.style.transition = ''
    }
    }, 300)
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
    
    // 新增：处理日程滚动状态变化
    // 修改 handleDateScrollChange 方法
    handleDateScrollChange(scrollState) {
    this.dateScrollAtTop = scrollState.isAtTop
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
  bottom: 5px; /* 下移到更靠近底部导航栏的位置 */
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

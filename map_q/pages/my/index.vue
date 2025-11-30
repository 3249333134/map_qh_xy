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
    <view class="map-info-overlay" :class="{ expanded: isOverlayExpanded, dragging: isDragging }" v-if="isPageReady && activeModule === 'location'" :style="mapOverlayStyle">
    <view class="overlay-header" @tap="handleOverlayTap" @click="handleOverlayTap">
    <text class="map-title">我的足迹地图</text>
    <text class="map-desc">我的内容轨迹 ({{ userLocations.length }}个地点)</text>
    </view>
      <!-- 展开后显示分类 + 两列瀑布流收藏卡片 -->
      <view v-if="isOverlayExpanded" class="overlay-expanded-content">
      <!-- 顶部位置分组筛选（显示每组内容数量） -->
      <scroll-view class="overlay-area-filter" scroll-x show-scrollbar="false">
        <view class="overlay-area-filter-inner">
          <view v-for="g in locationFilterGroups" :key="g.key" class="filter-chip" :class="{ active: g.key === activeOverlayAreaGroup }" @tap.stop="selectAreaGroup(g.key)" @click.stop="selectAreaGroup(g.key)">
            {{ g.label }}（{{ g.count }}）
          </view>
        </view>
      </scroll-view>
      <!-- 分类分段模式：左侧竖列类别 + 右侧分段内容（区域在顶部横向 chips） -->
      <view v-if="overlayDisplayMode === 'sections'" class="overlay-left-right" :style="{ height: overlayExpandedHeight + 'px' }">
        <!-- 左侧竖列：类别 chips（全部、照片、视频、文章、音乐、地点、服务） -->
        <view class="overlay-left-nav">
          <view v-for="g in categoryFilterGroups" :key="'cat-' + g.key" class="left-nav-item" :class="{ active: g.key === activeCategory }" @tap.stop="selectCategoryGroup(g.key)" @click.stop="selectCategoryGroup(g.key)">
            {{ g.label }}<text v-if="g.count !== undefined" style="margin-left:4px;">（{{ g.count }}）</text>
          </view>
        </view>
        <!-- 右侧分段内容列表 -->
        <scroll-view class="overlay-right-sections" scroll-y show-scrollbar="false" :scroll-into-view="overlayScrollIntoView" :style="{ height: overlayExpandedHeight + 'px' }" @touchstart.stop="onOverlayTouchStart" @touchmove.stop="onOverlayTouchMove" @touchend.stop="onOverlayTouchEnd">
          <view v-for="sec in groupedOverlaySections" :key="'sec-' + sec.key" :id="'section-' + sec.key" class="overlay-section">
            <text class="section-title">{{ sec.label }} · {{ currentCategoryLabel }}</text>
            <view class="overlay-cards-grid">
              <template v-for="(item, idx) in sec.items" :key="(item._id || item.id || '') + '-' + idx">
                <service-card-item v-if="item.type === 'service'" :index="idx" :card-data="item" :height="getOverlayCardHeight('right', idx)" />
                <card-item v-else :index="idx" :card-data="item" :height="getOverlayCardHeight('right', idx)" />
              </template>
            </view>
          </view>
        </scroll-view>
      </view>
        <!-- 左侧行政层级分类 -->
        <view v-if="isOverlayExpanded && overlayDisplayMode === 'waterfall'" class="overlay-levels">
          <view v-for="lvl in overlayLevels" :key="lvl" class="overlay-level-item" :class="{ active: lvl === activeOverlayLevel }" @tap.stop="handleOverlayLevelChange(lvl)" @click.stop="handleOverlayLevelChange(lvl)">
            {{ lvl }}
          </view>
        </view>
        <!-- 右侧两列瀑布流收藏卡片 -->
        <scroll-view v-if="isOverlayExpanded && overlayDisplayMode === 'waterfall'" class="overlay-cards-container" scroll-y show-scrollbar="false" @touchstart.stop="onOverlayTouchStart" @touchmove.stop="onOverlayTouchMove" @touchend.stop="onOverlayTouchEnd">
          <view class="overlay-cards-grid">
            <template v-for="(item, idx) in overlayFilteredCards" :key="(item._id || item.id || '') + '-' + idx">
              <view class="grid-cell">
                <service-card-item v-if="item.type === 'service'" :index="idx" :card-data="item" :height="getOverlayCardHeight('grid', idx)" />
                <card-item v-else :index="idx" :card-data="item" :height="getOverlayCardHeight('grid', idx)" />
              </view>
            </template>
          </view>
        </scroll-view>
      </view>
    </view>
    <!-- 全局发布弹窗挂载点 -->
    <GlobalOverlayHost />
  </view>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import GlobalOverlayHost from '../../components/common/GlobalOverlayHost.vue'
// 导入组件
import ProfileSection from './components/ProfileSection.vue'
import ContentSection from './components/ContentSection.vue'
import LocationModule from './components/LocationModule.vue'
import DateModule from './components/DateModule.vue'
import FavoriteModule from './components/FavoriteModule.vue'
import CardItem from '../../components/card/CardItem.vue'
import ServiceCardItem from '../../components/card/ServiceCardItem.vue'
// 导入 composables
import { useMyData } from './composables/useMyData.js'
import { useMyLayout } from './composables/useMyLayout.js'
import { useMyOverlay } from './composables/useMyOverlay.js'

export default {
  name: 'MyPage',
  components: { ProfileSection, ContentSection, LocationModule, DateModule, FavoriteModule, CardItem, ServiceCardItem, GlobalOverlayHost },
  setup() {
    // 页面就绪状态
    const isPageReady = ref(false)

    // 数据相关
    const {
      userInfo,
      profileStats,
      scheduleData,
      favoriteData,
      userLocations,
      ensureRandomLocationForIndex,
      getRandomCoordinateInChengdu,
      getRandomAddress,
      buildUserLocationsFromFavorites
    } = useMyData()

    // 覆盖层展开状态（共享给布局/覆盖层逻辑）
    const isOverlayExpanded = ref(false)

    // 布局与交互
    const {
      screenHeight,
      safeTopOffset,
      positions,
      expandUpDistancePx,
      contentTranslateY,
      dateScrollAtTop,
      favoriteScrollAtTop,
      isDragging,
      startY,
      startTranslateY,
      dragThreshold,
      dragStartTime,
      snapThreshold,
      isFullyExpanded,
      currentPosition,
      mapOverlayStyle,
      overlayExpandedHeight,
      initPage,
      handleDragStart,
      handleDragMove,
      handleDragEnd: handleDragEndLayout,
      handleUpdateTranslateY,
      animateToPosition,
      handleQuickSwitch
    } = useMyLayout({ isOverlayExpanded })

    // 当前激活模块
    const activeModule = ref('favorite')

    // 覆盖层相关（共享展开状态） - 统一在下方一次性解构（包含类别筛选）
// 修改为包含类别筛选相关变量
const {
  isOverlayExpanded: overlayExpanded,
  overlayLevels,
  activeOverlayLevel,
  activeOverlayAreaGroup,
  overlayDisplayMode,
  overlayScrollIntoView,
  overlayLeftColumnData,
  overlayRightColumnData,
  overlayTouchStartY,
  overlayTouchLastY,
  overlayTouchStartTime,
  overlaySwipeThreshold,
  overlaySwipeVelocityThreshold,
  favoriteAllItems,
  overlayFilteredCards,
  groupedOverlaySections,
  locationFilterGroups,
  computeOverlayColumns,
  getOverlayCardHeight,
  expandMapFullScreen,
  handleOverlayLevelChange,
  selectAreaGroup,
  viewSectionAll,
  onOverlayTouchStart,
  onOverlayTouchMove,
  onOverlayTouchEnd,
  // 新增：从 useMyOverlay 解构类别相关
  activeCategory,
  categoryFilterGroups,
  selectCategoryGroup
} = useMyOverlay({ favoriteData, contentTranslateY, screenHeight, safeTopOffset, activeModule, isOverlayExpanded })

    // 当前选中类别的中文标签（用于右侧分段标题展示组合筛选：地区 · 类别）
    const currentCategoryLabel = computed(() => {
      const list = categoryFilterGroups || []
      const arr = Array.isArray(list?.value) ? list.value : list
      const found = arr.find(g => g.key === activeCategory.value)
      return found ? found.label : '全部'
    })

    // 包装：拖拽结束，按模块语义处理
    const handleDragEnd = (e) => {
      const module = activeModule.value
      const isAtTop = module === 'favorite' ? !!favoriteScrollAtTop.value : (module === 'date' ? !!dateScrollAtTop.value : true)
      handleDragEndLayout(e, module, isAtTop)
    }

    // 模块切换
    const switchModule = (module) => {
      activeModule.value = module
      overlayExpanded.value = false
    }

    // 事件处理与桥接（保持原 API）
    const handleEventClick = (event) => {
      uni.showModal({ title: event.title, content: `时间: ${event.time}\n地点: ${event.location || '无'}\n内容: ${event.content || '无'}`, showCancel: false })
    }
    const handleFavoriteItemClick = (item) => {
      uni.showModal({ title: item.title, content: item.desc, showCancel: false })
    }
    const handleSettingsClick = () => { uni.showToast({ title: '设置功能', icon: 'none' }) }
    const handleMarkerTap = ({ location }) => {
      uni.showModal({ title: location.title, content: `查看在${location.title}发布的内容`, confirmText: '查看', cancelText: '取消', success: (res) => { if (res.confirm) { console.log('查看内容:', location) } } })
    }

    // 覆盖层根容器点击：展开/收起（点击时若已展开则收起，若已收起则展开）
    const handleOverlayTap = (e) => {
      const next = !overlayExpanded.value
      overlayExpanded.value = next
      if (next) {
        overlayDisplayMode.value = 'sections'
        computeOverlayColumns()
      }
      try { uni.showToast({ title: next ? '展开我的足迹地图卡片' : '收起我的足迹地图卡片', icon: 'none', duration: 500 }) } catch (err) {}
    }

    // 滚动状态变更
    const handleFavoriteScrollChange = (scrollState) => { favoriteScrollAtTop.value = !!(scrollState && scrollState.isAtTop) }
    const handleDateScrollChange = (scrollState) => { dateScrollAtTop.value = !!(scrollState && scrollState.isAtTop) }

    // 初始化
    onMounted(() => {
      initPage()
      isPageReady.value = true
      buildUserLocationsFromFavorites()
    })

    try {
      if (uni && uni.$on) {
        uni.$on('collapseExpandableBars', () => {
          overlayExpanded.value = false
          animateToPosition(positions.default)
        })
      }
    } catch (e) {}

    // 页面展示时同步底部 TabBar 高亮为“我的”
    onShow(() => {
      try {
        const pages = getCurrentPages()
        const page = pages[pages.length - 1]
        if (page && typeof page.getTabBar === 'function' && page.getTabBar()) {
          page.getTabBar().setData({ selected: 4 })
        }
      } catch (e) {}
    })

    onUnmounted(() => {
      try { if (uni && uni.$off) uni.$off('collapseExpandableBars') } catch (e) {}
    })

    return {
      // 页面状态
      isPageReady,
      // 数据
      userInfo,
      profileStats,
      scheduleData,
      favoriteData,
      userLocations,
      // 布局与交互
      screenHeight,
      safeTopOffset,
      positions,
      expandUpDistancePx,
      contentTranslateY,
      dateScrollAtTop,
      favoriteScrollAtTop,
      isDragging,
      startY,
      startTranslateY,
      dragThreshold,
      dragStartTime,
      snapThreshold,
      isFullyExpanded,
      currentPosition,
      mapOverlayStyle,
      overlayExpandedHeight,
      initPage,
      handleDragStart,
      handleDragMove,
      handleDragEnd,
      handleUpdateTranslateY,
      animateToPosition,
      handleQuickSwitch,
      // 新增：滚动状态事件处理器（用于收藏/日期模块）
      handleFavoriteScrollChange,
      handleDateScrollChange,
      // 模块
      activeModule,
      switchModule,
      // 覆盖层
      isOverlayExpanded: overlayExpanded,
      overlayLevels,
      activeOverlayLevel,
      activeOverlayAreaGroup,
      overlayDisplayMode,
      overlayScrollIntoView,
      overlayLeftColumnData,
      overlayRightColumnData,
      overlayTouchStartY,
      overlayTouchLastY,
      overlayTouchStartTime,
      overlaySwipeThreshold,
      overlaySwipeVelocityThreshold,
      favoriteAllItems,
      overlayFilteredCards,
      groupedOverlaySections,
      locationFilterGroups,
      computeOverlayColumns,
      getOverlayCardHeight,
      expandMapFullScreen,
      handleOverlayLevelChange,
      selectAreaGroup,
      viewSectionAll,
      onOverlayTouchStart,
      onOverlayTouchMove,
      onOverlayTouchEnd,
      // 新增：类别筛选（左侧竖列）
      activeCategory,
      categoryFilterGroups,
      selectCategoryGroup,
      // 右侧分段标题用：地区 · 类别
      currentCategoryLabel,
      // 事件
      handleEventClick,
      handleFavoriteItemClick,
      handleSettingsClick,
      handleMarkerTap,
      handleOverlayTap
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
  bottom: 2px;
  left: 2px; /* 整体向左移一些，保证右侧内容不被裁切 */
  right: 2px; /* 右侧与未展开时左侧保持一致留白 */
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 12px 12px 12px 10px;
  z-index: 9999 !important;
  transform: none !important;
  isolation: isolate !important;
  transform-style: flat !important;
  box-sizing: border-box;
  backface-visibility: hidden !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.25s ease;
}

.map-info-overlay.dragging {
  transition: none !important;
  will-change: top;
}

/* 展开时保持配色与透明度不变，仅改变占位尺寸（靠内联样式的 top/bottom 控制高度）*/
.map-info-overlay.expanded {
  border-radius: 12px;
}
/* 展开态：恢复原始视觉宽度（关闭卡片缩放） */
.map-info-overlay.expanded .overlay-cards-grid {
  --overlay-card-scale: 1;
}

/* 顶部位置分组筛选 chips 样式 */
.overlay-area-filter { margin: 6px 0 8px 0; width: 100%; }
.overlay-area-filter-inner { display: flex; gap: 8px; padding: 4px 2px; }
.filter-chip { padding: 6px 10px; border-radius: 14px; background: rgba(0,0,0,0.06); color: #333; font-size: 12px; }
.filter-chip.active { background: #4CAF50; color: #fff; }
/* 顶部类别分组筛选（与收藏页一致的横向 chips） */
.overlay-category-filter { margin: 4px 0 8px 0; width: 100%; }
.overlay-category-filter-inner { display: flex; gap: 8px; padding: 4px 2px; }
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
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
  height: calc(100% - 48px);
  overflow-y: hidden; /* 保持纵向不溢出 */
  overflow-x: visible; /* 横向允许内容完整显示 */
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
  padding: 0 8px 0 6px; /* 适当缩小内边距，释放网格宽度，避免第三列被裁切 */
  box-sizing: border-box;
}

.overlay-cards-grid {
  display: grid;
  --overlay-card-scale: 1; /* 默认不缩放，展开时保持与之前一致 */
  width: 100%;
  box-sizing: border-box;
  min-width: 0; /* 防止子项撑破容器导致水平裁切 */
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px; /* 再缩小间距，进一步释放宽度 */
  align-items: stretch;
  justify-items: stretch;
}

/* 折叠态（非 expanded）下，为保证小尺寸不裁切，可做轻微缩放 */
.map-info-overlay:not(.expanded) .overlay-cards-grid {
  --overlay-card-scale: 0.96;
}

/* 网格单元容器，确保组件充满单元且不溢出 */
.grid-cell {
  width: 100%;
  min-width: 0; /* 防止内部内容撑破布局 */
  display: flex;
  align-items: stretch;
  justify-content: stretch;
}

/* 缩放后的卡片容器：让卡片在单元内居中显示并不溢出 */
.grid-cell > .card-item,
.grid-cell > .service-card-item {
  width: 100%;
  box-sizing: border-box;
  transform: scale(var(--overlay-card-scale));
  transform-origin: center top;
}

/* 避免瀑布流旧样式干扰：隐藏旧的左右列容器（保留以免影响其他模式） */
.overlay-cards-column { display: none; }
.overlay-left-right { display: flex; flex-direction: row; gap: 8px; flex: 1 1 auto; height: 100%; }
.overlay-left-nav { width: 92px; height: 100%; }
.left-nav-item { padding: 10px 8px; font-size: 12px; color: #333; border-left: 3px solid transparent; }
.left-nav-item.active { color: #0a7c0a; font-weight: 600; border-left-color: #4CAF50; background: rgba(76, 175, 80, 0.08); }
.overlay-right-sections {
  flex: 1;
  height: 100%; /* 改为充满父容器高度 */
  padding: 0 12px 0 8px; /* 向左微移，保持右侧内边距不变 */
  box-sizing: border-box;
}
.overlay-section { margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px dashed rgba(0,0,0,0.08); }
.section-header { display: flex; align-items: center; justify-content: space-between; padding: 0 2px; }
.section-title { font-size: 14px; color: #333; }
.section-more { font-size: 12px; color: #888; }
.section-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.overlay-cards-grid .card-item, .overlay-cards-grid .service-card-item {
  /* 统一卡片规格：图片+名称+作者，固定高度（按缩放系数等比例缩小视觉高度） */
  height: calc(220px * var(--overlay-card-scale));
}
</style>

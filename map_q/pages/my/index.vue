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
        <!-- 顶部位置分组筛选（显示每组内容数量） -->
        <scroll-view class="overlay-area-filter" scroll-x show-scrollbar="false">
          <view class="overlay-area-filter-inner">
            <view v-for="g in locationFilterGroups" :key="g.key" class="filter-chip" :class="{ active: g.key === activeOverlayAreaGroup }" @tap.stop="selectAreaGroup(g.key)" @click.stop="selectAreaGroup(g.key)">
              {{ g.label }}（{{ g.count }}）
            </view>
          </view>
        </scroll-view>
        <!-- 左右结构：左侧分组导航，右侧分段内容 -->
        <view v-if="overlayDisplayMode === 'sections'" class="overlay-left-right" :style="{ height: overlayExpandedHeight + 'px' }">
          <!-- 左侧分组导航列表 -->
          <scroll-view class="overlay-left-nav" scroll-y show-scrollbar="false" :style="{ height: overlayExpandedHeight + 'px' }">
            <view v-for="g in locationFilterGroups" :key="'nav-' + g.key" class="left-nav-item" :class="{ active: g.key === activeOverlayAreaGroup }" @tap.stop="selectAreaGroup(g.key)" @click.stop="selectAreaGroup(g.key)">
              {{ g.label }}
            </view>
          </scroll-view>
          <!-- 右侧分段内容列表 -->
          <scroll-view class="overlay-right-sections" scroll-y show-scrollbar="false" :scroll-into-view="overlayScrollIntoView" :style="{ height: overlayExpandedHeight + 'px' }">
            <view v-for="sec in groupedOverlaySections" :key="'sec-' + sec.key" :id="'section-' + sec.key" class="overlay-section">
              <view class="section-header">
                <text class="section-title">{{ sec.label }}</text>
                <text class="section-more" @tap.stop="viewSectionAll(sec)" @click.stop="viewSectionAll(sec)">全部 ></text>
              </view>
              <view class="section-grid">
                <template v-for="(item, idx) in sec.items" :key="(item._id || item.id || '') + '-' + idx">
                  <service-card-item v-if="item.type === 'service'" :index="idx" :card-data="item" :height="getOverlayCardHeight('right', idx)" />
                  <card-item v-else :index="idx" :card-data="item" :height="getOverlayCardHeight('right', idx)" />
                </template>
              </view>
            </view>
          </scroll-view>
        </view>
      </view>
        <!-- 左侧行政层级分类 -->
        <view v-if="isOverlayExpanded && overlayDisplayMode === 'waterfall'" class="overlay-levels">
          <view v-for="lvl in overlayLevels" :key="lvl" class="overlay-level-item" :class="{ active: lvl === activeOverlayLevel }" @tap.stop="handleOverlayLevelChange(lvl)" @click.stop="handleOverlayLevelChange(lvl)">
            {{ lvl }}
          </view>
        </view>
        <!-- 右侧两列瀑布流收藏卡片 -->
        <scroll-view v-if="isOverlayExpanded && overlayDisplayMode === 'waterfall'" class="overlay-cards-container" scroll-y show-scrollbar="false">
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
</template>

<script>
import { ref, onMounted } from 'vue'
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
  components: { ProfileSection, ContentSection, LocationModule, DateModule, FavoriteModule, CardItem, ServiceCardItem },
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

    // 覆盖层相关（共享展开状态）
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
      onOverlayTouchEnd
    } = useMyOverlay({ favoriteData, contentTranslateY, screenHeight, safeTopOffset, activeModule, isOverlayExpanded })

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

    // 滚动状态变更
    const handleFavoriteScrollChange = (scrollState) => { favoriteScrollAtTop.value = !!(scrollState && scrollState.isAtTop) }
    const handleDateScrollChange = (scrollState) => { dateScrollAtTop.value = !!(scrollState && scrollState.isAtTop) }

    // 初始化
    onMounted(() => {
      initPage()
      isPageReady.value = true
      buildUserLocationsFromFavorites()
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
      // 事件
      handleEventClick,
      handleFavoriteItemClick,
      handleSettingsClick,
      handleMarkerTap
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

/* 顶部位置分组筛选 chips 样式 */
.overlay-area-filter { margin: 6px 0 8px 0; width: 100%; }
.overlay-area-filter-inner { display: flex; gap: 8px; padding: 4px 2px; }
.filter-chip { padding: 6px 10px; border-radius: 14px; background: rgba(0,0,0,0.06); color: #333; font-size: 12px; }
.filter-chip.active { background: #4CAF50; color: #fff; }

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
  flex-direction: column; /* 改为纵向：顶部 chips + 下方左右分栏 */
  gap: 12px;
  margin-top: 8px;
  height: calc(100% - 48px); /* 预留标题与描述空间 */
  overflow: hidden; /* 防止子容器溢出 */
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
.overlay-left-right { display: flex; flex-direction: row; gap: 8px; flex: 1 1 auto; height: 100%; }
.overlay-left-nav { width: 92px; height: 100%; /* 改为充满父容器高度 */ }
.left-nav-item { padding: 10px 8px; font-size: 12px; color: #333; }
.left-nav-item.active { color: #ff6a00; font-weight: 600; }
.overlay-right-sections { flex: 1; height: 100%; /* 改为充满父容器高度 */ }
.overlay-section { margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px dashed rgba(0,0,0,0.08); }
.section-header { display: flex; align-items: center; justify-content: space-between; padding: 0 2px; }
.section-title { font-size: 14px; color: #333; }
.section-more { font-size: 12px; color: #888; }
.section-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
</style>

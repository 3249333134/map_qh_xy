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
        ref="locationModule"
        v-show="activeModule === 'location'"
        :userLocations="userLocations"
        :isFullyExpanded="isFullyExpanded"
        :selectedPointId="selectedFootprintId"
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
    <view class="overlay-header">
      <view class="overlay-title-copy" @tap="handleOverlayTap" @click="handleOverlayTap">
        <view class="overlay-title-row">
          <text class="map-title">我的足迹地图</text>
          <text class="result-count">{{ overlayFilteredCards.length }} 条</text>
        </view>
        <text class="map-desc">{{ currentAreaLabel }} · {{ currentCategoryLabel }}</text>
      </view>
      <view class="overlay-header-actions">
        <view class="overlay-share" @tap.stop="handleFootprintShare" @click.stop="handleFootprintShare">分享</view>
        <view class="overlay-toggle" :class="{ expanded: isOverlayExpanded }" @tap.stop="handleOverlayTap" @click.stop="handleOverlayTap">
          <view class="toggle-chevron"></view>
        </view>
      </view>
    </view>
    <view v-if="selectedFootprintCard && !isOverlayExpanded" class="selected-footprint-preview">
      <view class="preview-mark" :class="selectedFootprintCard.layer">{{ footprintTypeMark(selectedFootprintCard) }}</view>
      <view class="preview-copy">
        <text class="preview-title">{{ selectedFootprintCard.title }}</text>
        <text class="preview-desc">{{ selectedFootprintCard.address || selectedFootprintCard.author || '足迹内容' }}</text>
      </view>
      <view class="preview-detail" @tap.stop="openFootprintDetail(selectedFootprintCard)" @click.stop="openFootprintDetail(selectedFootprintCard)">详情</view>
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
        <scroll-view class="overlay-right-sections" scroll-y show-scrollbar="false" :scroll-into-view="overlayScrollIntoView" :style="{ height: overlayExpandedHeight + 'px' }" @scroll="onOverlayScroll" @touchstart.stop="onOverlayTouchStart" @touchmove.stop="onOverlayTouchMove" @touchend.stop="onOverlayTouchEnd">
          <view v-for="sec in groupedOverlaySections" :key="'sec-' + sec.key" :id="'section-' + sec.key" class="overlay-section">
            <view class="section-heading">
              <text class="section-title">{{ sec.label }}</text>
              <text class="section-count">{{ sec.items.length }} 条</text>
            </view>
            <view v-if="sec.items.length" class="overlay-cards-grid">
              <view
                v-for="(item, idx) in sec.items"
                :key="item._id || item.id || idx"
                class="grid-cell"
                :class="{ selected: selectedFootprintId === item.id || selectedFootprintId === item._id }"
              >
                <service-card-item
                  v-if="item.type === 'service' || item.detailType === 'service' || item.layer === 'service'"
                  :index="idx"
                  :card-data="item"
                  :height="getOverlayCardHeight('grid', idx)"
                  @media-tap="openFootprintDetail"
                  @content-tap="focusFootprintOnMap"
                  @reserve="openFootprintDetail"
                />
                <card-item
                  v-else
                  :index="idx"
                  :card-data="item"
                  :height="getOverlayCardHeight('grid', idx)"
                  @media-tap="openFootprintDetail"
                  @content-tap="focusFootprintOnMap"
                />
              </view>
            </view>
            <view v-else class="section-empty">当前筛选下暂无足迹</view>
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
import { footprintApi, socialViewStateApi } from '../../utils/api/social.js'

export default {
  name: 'MyPage',
  components: { ProfileSection, ContentSection, LocationModule, DateModule, FavoriteModule, CardItem, ServiceCardItem, GlobalOverlayHost },
  setup() {
    // 页面就绪状态
    const isPageReady = ref(false)
    const locationModule = ref(null)
    const savedFootprintView = socialViewStateApi.getFootprint()
    const selectedFootprintId = ref(savedFootprintView.selectedPointId || '')

    // 数据相关
    const {
      userInfo,
      profileStats,
      scheduleData,
      favoriteData,
      userLocations,
      footprintCards,
      buildUserLocationsFromFootprints,
      hydrateRepositories
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
  onOverlayScroll,
  // 新增：从 useMyOverlay 解构类别相关
  activeCategory,
  categoryFilterGroups,
  selectCategoryGroup
} = useMyOverlay({ footprintCards, contentTranslateY, screenHeight, safeTopOffset, activeModule, isOverlayExpanded })

    // 当前选中类别的中文标签（用于右侧分段标题展示组合筛选：地区 · 类别）
    const currentCategoryLabel = computed(() => {
      const list = categoryFilterGroups || []
      const arr = Array.isArray(list?.value) ? list.value : list
      const found = arr.find(g => g.key === activeCategory.value)
      return found ? found.label : '全部'
    })
    const currentAreaLabel = computed(() => {
      const list = Array.isArray(locationFilterGroups?.value) ? locationFilterGroups.value : []
      const found = list.find(group => group.key === activeOverlayAreaGroup.value)
      return found ? found.label : '全部区域'
    })
    const selectedFootprintCard = computed(() => {
      return footprintCards.value.find(item => (
        String(item.id) === String(selectedFootprintId.value) ||
        String(item.sourceId) === String(selectedFootprintId.value)
      )) || null
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
      openFootprintDetail(item)
    }
    const handleSettingsClick = () => {
      uni.navigateTo({
        url: '/pages/my-settings/index',
        fail: () => uni.showToast({ title: '设置页面暂不可用', icon: 'none' })
      })
    }
    const handleMarkerTap = ({ location }) => {
      if (!location) return
      selectedFootprintId.value = String(location.footprintId || location.id || '')
      socialViewStateApi.patchFootprint({ selectedPointId: selectedFootprintId.value })
    }

    const footprintTypeMark = (item) => {
      const marks = { content: '文', place: '地', service: '服', event: '活', route: '线', track: '线', favorite: '藏' }
      return marks[item?.category] || marks[item?.layer] || '文'
    }
    const openFootprintDetail = (payload) => {
      const item = payload && payload.cardData ? payload.cardData : payload
      if (!item) return
      const detailType = item.detailType || (item.type === 'service' ? 'service' : 'normal')
      const targetId = item.sourceId || item.id
      selectedFootprintId.value = String(item._id || item.id || targetId)
      socialViewStateApi.patchFootprint({
        selectedPointId: selectedFootprintId.value,
        area: activeOverlayAreaGroup.value,
        category: activeCategory.value,
        expanded: overlayExpanded.value
      })
      uni.navigateTo({
        url: `/pages/detail/index?id=${encodeURIComponent(targetId)}&type=${encodeURIComponent(detailType)}&source=my-footprint&returnStateKey=footprint`
      })
    }
    const focusFootprintOnMap = (payload) => {
      const item = payload && payload.cardData ? payload.cardData : payload
      if (!item?.hasLocation) {
        uni.showToast({ title: '该内容未保存地图位置', icon: 'none' })
        return
      }
      selectedFootprintId.value = String(item._id || item.id)
      overlayExpanded.value = false
      socialViewStateApi.patchFootprint({
        selectedPointId: selectedFootprintId.value,
        expanded: false
      })
      const target = userLocations.value.find(location => (
        String(location.footprintId) === String(item._id || item.id) ||
        String(location.id) === String(item.sourceId || item.id)
      ))
      if (target && locationModule.value?.focusLocation) locationModule.value.focusLocation(target)
    }
    const handleFootprintShare = () => {
      const snapshot = footprintApi.shareSnapshot({
        layer: activeCategory.value === 'all' ? undefined : activeCategory.value
      })
      if (!snapshot.length) {
        uni.showToast({ title: '当前筛选没有可安全分享的公开足迹', icon: 'none' })
        return
      }
      try { uni.setStorageSync('MY_FOOTPRINT_SHARE_SNAPSHOT', snapshot) } catch (e) {}
      uni.navigateTo({ url: '/pages/map-share/index?source=my-footprint' })
    }

    // 覆盖层根容器点击：展开/收起（点击时若已展开则收起，若已收起则展开）
    const handleOverlayTap = (e) => {
      const next = !overlayExpanded.value
      overlayExpanded.value = next
      if (next) {
        overlayDisplayMode.value = 'sections'
        computeOverlayColumns()
      }
      socialViewStateApi.patchFootprint({ expanded: next })
    }

    // 滚动状态变更
    const handleFavoriteScrollChange = (scrollState) => { favoriteScrollAtTop.value = !!(scrollState && scrollState.isAtTop) }
    const handleDateScrollChange = (scrollState) => { dateScrollAtTop.value = !!(scrollState && scrollState.isAtTop) }

    // 初始化
    onMounted(() => {
      initPage()
      isPageReady.value = true
      buildUserLocationsFromFootprints()
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
      hydrateRepositories()
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
      onOverlayScroll,
      // 新增：类别筛选（左侧竖列）
      activeCategory,
      categoryFilterGroups,
      selectCategoryGroup,
      // 右侧分段标题用：地区 · 类别
      currentCategoryLabel,
      currentAreaLabel,
      // 事件
      handleEventClick,
      handleFavoriteItemClick,
      handleSettingsClick,
      handleMarkerTap,
      handleOverlayTap,
      handleFootprintShare,
      openFootprintDetail,
      focusFootprintOnMap,
      footprintTypeMark,
      footprintCards,
      locationModule,
      selectedFootprintId,
      selectedFootprintCard
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

/* 渐进式足迹内容层：保留地图语境，同时避免地图文字穿透内容。 */
.map-info-overlay {
  left: 12rpx;
  right: 12rpx;
  bottom: calc(116rpx + env(safe-area-inset-bottom));
  padding: 20rpx;
  border: 1rpx solid rgba(148, 163, 184, 0.22);
  border-radius: 28rpx;
  background: #f8fafc;
  box-shadow: 0 14rpx 40rpx rgba(15, 23, 42, 0.16);
}

.map-info-overlay.expanded {
  border-radius: 28rpx 28rpx 20rpx 20rpx;
  background: #f8fafc;
}

.overlay-header,
.overlay-title-row,
.overlay-header-actions,
.selected-footprint-preview {
  display: flex;
  align-items: center;
}

.overlay-header {
  min-height: 88rpx;
  justify-content: space-between;
  gap: 16rpx;
}

.overlay-title-copy {
  flex: 1;
  min-width: 0;
}

.overlay-title-row {
  gap: 12rpx;
}

.map-title {
  margin: 0;
  color: #172033;
  font-size: 34rpx;
  font-weight: 700;
}

.result-count {
  padding: 4rpx 12rpx;
  border-radius: 999rpx;
  color: #3d8bff;
  background: #eaf3ff;
  font-size: 22rpx;
  font-weight: 600;
}

.map-desc {
  margin-top: 6rpx;
  color: #64748b;
  font-size: 24rpx;
}

.overlay-header-actions {
  gap: 10rpx;
}

.overlay-share,
.overlay-toggle {
  min-width: 88rpx;
  height: 72rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.overlay-share {
  color: #3d8bff;
  background: #eaf3ff;
  font-size: 24rpx;
  font-weight: 600;
}

.overlay-toggle {
  min-width: 72rpx;
  background: #ffffff;
  border: 1rpx solid #e2e8f0;
}

.toggle-chevron {
  width: 18rpx;
  height: 18rpx;
  border-left: 4rpx solid #64748b;
  border-top: 4rpx solid #64748b;
  transform: rotate(45deg) translateY(5rpx);
  transition: transform 180ms ease;
}

.overlay-toggle.expanded .toggle-chevron {
  transform: rotate(225deg) translateY(5rpx);
}

.selected-footprint-preview {
  min-height: 92rpx;
  margin-top: 12rpx;
  padding: 12rpx 16rpx;
  gap: 14rpx;
  border-radius: 20rpx;
  background: #ffffff;
  border: 1rpx solid #e2e8f0;
}

.preview-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  background: #3d8bff;
  font-weight: 700;
}

.preview-mark {
  width: 56rpx;
  height: 56rpx;
  border-radius: 16rpx;
}

.preview-copy {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.preview-title {
  color: #172033;
  font-size: 26rpx;
  font-weight: 650;
}

.preview-desc {
  margin-top: 4rpx;
  color: #94a3b8;
  font-size: 22rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-detail {
  min-width: 88rpx;
  height: 64rpx;
  border-radius: 18rpx;
  color: #ff6b35;
  background: #fff1eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 600;
}

.overlay-area-filter-inner {
  gap: 12rpx;
  padding: 8rpx 2rpx 14rpx;
}

.filter-chip {
  min-height: 72rpx;
  box-sizing: border-box;
  padding: 12rpx 22rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.88);
  border: 1rpx solid #e2e8f0;
  color: #475569;
  font-size: 24rpx;
}

.filter-chip.active {
  color: #ffffff;
  background: #3d8bff;
  border-color: #3d8bff;
}

.overlay-left-right {
  gap: 12rpx;
  overflow: hidden;
  background: #f8fafc;
}

.overlay-left-nav {
  width: 108rpx;
  padding: 6rpx;
  box-sizing: border-box;
  border-radius: 20rpx;
  background: #f1f5f9;
}

.left-nav-item {
  min-height: 78rpx;
  box-sizing: border-box;
  padding: 14rpx 10rpx;
  border-left: 0;
  border-radius: 16rpx;
  color: #64748b;
  font-size: 23rpx;
}

.left-nav-item.active {
  color: #ff6b35;
  background: #ffffff;
  border-left: 0;
  box-shadow: 0 6rpx 18rpx rgba(15, 23, 42, 0.08);
}

.overlay-right-sections {
  padding: 0 8rpx 24rpx 0;
  background: #f8fafc;
}

.overlay-section {
  margin-bottom: 24rpx;
  padding: 0 0 12rpx;
  border-bottom: 0;
  background: #f8fafc;
}

.section-header {
  min-height: 64rpx;
}

.section-title {
  color: #172033;
  font-size: 27rpx;
  font-weight: 700;
}

.section-more {
  min-width: 88rpx;
  min-height: 64rpx;
  color: #3d8bff;
  font-size: 23rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.section-grid,
.overlay-cards-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20rpx 16rpx;
  align-items: start;
}

/* 统一卡片规格：与收藏页 (CardItem / ServiceCardItem) 保持一致 */
.grid-cell {
  min-width: 0;
  border-radius: 24rpx;
  overflow: hidden;
  background: #ffffff;
  border: 1rpx solid #e2e8f0;
  box-shadow: 0 8rpx 24rpx rgba(15, 23, 42, 0.06);
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

.grid-cell.selected {
  border: 1rpx solid rgba(61, 139, 255, 0.7);
  box-shadow: 0 8rpx 24rpx rgba(61, 139, 255, 0.14);
}

.grid-cell > .card-item,
.grid-cell > .service-card-item {
  width: 100%;
  height: auto;
  box-sizing: border-box;
  transform: none;
  transform-origin: center top;
}

.section-empty {
  min-height: 180rpx;
  border-radius: 20rpx;
  color: #94a3b8;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
}

.preview-mark.place {
  background: #22c55e;
}

.preview-mark.service {
  background: #0f9f95;
}

.preview-mark.route {
  background: #ff6b35;
}
</style>

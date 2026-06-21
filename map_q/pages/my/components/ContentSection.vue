<template>
  <view class="content-section" 
        :class="{ dragging: isDragging }"
        :style="contentSectionStyle">
    
    <!-- 模块内容区域 - 根据模块类型决定是否支持拖拽 -->
    <view class="module-content-background"
          :class="{ 'draggable-content': activeModule === 'date' || activeModule === 'favorite' }"
          :style="moduleContentStyle"
          @touchstart="handleContentTouchStart"
          @touchmove="handleContentTouchMove"
          @touchend="handleContentTouchEnd">
      <slot></slot>
    </view>
    
    <!-- 顶部操作区域 - 所有模块均可拖拽，位置模块由父组件处理位移 -->
    <view class="top-actions draggable-bar"
          @touchstart="handleBarTouchStart"
          @touchmove="handleBarTouchMove"
          @touchend="handleBarTouchEnd">
      <!-- 拖拽指示器 -->
      <view class="drag-indicator"></view>
      
      <view class="action-buttons">
        <view class="action-btn" :class="{ active: activeModule === 'location' }" @click.stop="switchModule('location')">
          <text class="btn-icon">📍</text>
          <text class="btn-text">位置</text>
        </view>
        <view class="action-btn" :class="{ active: activeModule === 'favorite' }" @click.stop="switchModule('favorite')">
          <text class="btn-icon">⭐</text>
          <text class="btn-text">收藏</text>
        </view>
        <view class="action-btn" :class="{ active: activeModule === 'date' }" @click.stop="switchModule('date')">
          <text class="btn-icon">📅</text>
          <text class="btn-text">日期</text>
        </view>
        <view class="settings-btn" @click.stop="handleSettingsClick">
          <text class="settings-icon">⚙️</text>
        </view>
      </view>
    </view>
    
    <!-- 毛玻璃效果层 - 位于操作按钮和内容区域之间 -->
    <view class="frosted-glass-overlay"></view>
    
  </view>
</template>

<script>
export default {
  name: 'ContentSection',
  props: {
    translateY: {
      type: Number,
      default: 0
    },
    activeModule: {
      type: String,
      default: 'location'
    },
    isScrollAtTop: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      startY: 0,
      startTranslateY: 0,
      startTime: 0,
      isDragging: false,
      dragDistance: 0,
      lastMoveTime: 0,
      // 底部栏与安全区度量（用于裁剪显示高度）
      tabHeightRpx: 100,
      safeBottomRpx: 0,
      microAdjustRpx: 0
    }
  },
  computed: {
    // 底部占位（TabBar 高度 + 安全区），用于裁剪内容区域避免被底部栏遮挡
    placeholderHeightRpx() {
      return this.tabHeightRpx + this.safeBottomRpx
    },
    // 将底部占位转换为 px，便于用于样式
    safeBottomPx() {
      try {
        const totalRpx = (this.tabHeightRpx || 0) + (this.safeBottomRpx || 0) + (this.microAdjustRpx || 0)
        return uni.upx2px(totalRpx)
      } catch (e) {
        // 兜底：若运行环境不支持 upx2px，则按 1rpx≈0.5px 粗略换算
        const totalRpx = (this.tabHeightRpx || 0) + (this.safeBottomRpx || 0) + (this.microAdjustRpx || 0)
        return Math.round(totalRpx * 0.5)
      }
    },
    // 根容器样式：同时控制位移与底部裁剪，仅展示蓝框区域
    contentSectionStyle() {
      return {
        transform: `translate3d(0, ${this.translateY}px, 0)`,
        // 统一贴底，移除位置模块的底部占位，避免出现下方空隙
        bottom: '0px',
        top: '0px'
      }
    },
    // 模块内容容器样式：为内部滚动区提供底部安全留白，避免被自定义 TabBar 遮挡
    moduleContentStyle() {
      return {
        paddingBottom: `${this.safeBottomPx}px`,
        '--safe-bottom-px': `${this.safeBottomPx}px`
      }
    }
  },
  mounted() {
    // 读取并应用全局 TABBAR_METRICS，确保与系统/其他页面一致
    try {
      const app = getApp && getApp()
      let metrics = uni.getStorageSync('TABBAR_METRICS')
      if (!metrics || !metrics.tabHeightRpx) {
        metrics = app && app.computeTabBarMetrics ? app.computeTabBarMetrics() : null
      }
      if (metrics) {
        this.tabHeightRpx = metrics.tabHeightRpx
        this.safeBottomRpx = metrics.safeBottomRpx
        this.microAdjustRpx = metrics.microAdjustRpx || 0
      }
    } catch (e) {
      this.tabHeightRpx = 100
      this.safeBottomRpx = 0
      this.microAdjustRpx = 0
    }
  },
  methods: {
    // 横条拖拽处理（所有模块都支持）
    handleBarTouchStart(e) {
      this.initDrag(e)
    },
    
    // 统一获取触点 Y 坐标，兼容 mp-weixin 的不同事件字段
    getTouchY(e) {
      let y = this.startY
      const t = (e && ((e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]))) || null
      if (t) {
        if (typeof t.clientY === 'number') y = t.clientY
        else if (typeof t.pageY === 'number') y = t.pageY
        else if (typeof t.y === 'number') y = t.y
        else if (typeof t.screenY === 'number') y = t.screenY
        else if (typeof t.globalY === 'number') y = t.globalY
        else if (typeof t.localY === 'number') y = t.localY
      } else if (e && e.detail && typeof e.detail.y === 'number') {
        y = e.detail.y
      }
      return y
    },
    
    handleBarTouchMove(e) {
      // 顶部操作栏拖拽：实时跟随手指移动内容区域
      const currentY = this.getTouchY(e)
      const deltaY = currentY - this.startY
      // 非位置模块：子组件直接发出实时位移事件，父组件逐帧更新
      if (this.activeModule !== 'location') {
        // 修正：向上拖动（deltaY 为负）应让 translateY 减小（容器上移），从而内容区域变大
        const newTranslateY = this.startTranslateY + deltaY
        // 交由父组件按 positions.top/default 统一夹取
        this.$emit('update-translate-y', newTranslateY)
      }
      // 拖拽过程事件（用于点击与速度判断）
      this.processDragMove(e, true)
    },
    
    handleBarTouchEnd(e) {
      this.finishDrag(e)
    },
    
    // 内容区域拖拽处理（日期和收藏模块）
    handleContentTouchStart(e) {
      if (this.activeModule !== 'date' && this.activeModule !== 'favorite') return
      
      // 检查是否点击在交互元素上
      if (this.isInteractiveElement(e.target)) {
        return
      }
      // 仅当内容滚动在顶部时才允许拖拽移动容器
      if (!this.isScrollAtTop) {
        return
      }
      this.initDrag(e)
    },
    
    handleContentTouchMove(e) {
      if (this.activeModule !== 'date' && this.activeModule !== 'favorite') return
      // 非顶部时正常滚动内容，不移动容器
      if (!this.isScrollAtTop) {
        return
      }
      const currentY = this.getTouchY(e)
      const deltaY = currentY - this.startY
    
      // 统一与顶部横条：向上拖动（deltaY 为负）=> translateY 减小（容器上移）=> 内容区域扩大
      const newTranslateY = this.startTranslateY + deltaY
    
      // 交由父组件按 positions.top/default 统一夹取
      this.$emit('update-translate-y', newTranslateY)
      // 仅在允许拖拽时阻止默认并上报拖拽过程
      this.processDragMove(e, true)
    },
    
    handleContentTouchEnd(e) {
      if (this.activeModule !== 'date' && this.activeModule !== 'favorite') return
      // 若没有进入拖拽状态，直接结束（不影响正常滚动）
      if (!this.isDragging) return
      this.finishDrag(e)
    },
    
    // 统一的拖拽初始化方法
    initDrag(e) {
      const y = this.getTouchY(e)
      this.startY = y
      this.dragStartY = y // 新增：统一初始化，避免未定义导致方向错误
      this.startTranslateY = this.translateY
      this.startTime = Date.now()
      this.lastMoveTime = this.startTime
      this.isDragging = false
      this.dragDistance = 0
    },
    
    // 统一的拖拽移动处理方法（统一坐标兼容，并携带 activeModule）
    processDragMove(e, allowDrag) {
      if (!allowDrag) {
        return
      }
      e.preventDefault()
      e.stopPropagation()
      const currentY = this.getTouchY(e)
      const deltaY = currentY - this.startY
      const absDeltaY = Math.abs(deltaY)
      if (!this.isDragging) {
        this.isDragging = true
        this.$emit('drag-start', {
          startY: this.startY,
          currentY: currentY,
          deltaY: deltaY,
          timestamp: Date.now(),
          activeModule: this.activeModule
        })
      }
      this.dragDistance = absDeltaY
      this.lastMoveTime = Date.now()
      this.$emit('drag-move', {
        startY: this.startY,
        currentY: currentY,
        deltaY: deltaY,
        dragDistance: this.dragDistance,
        timestamp: this.lastMoveTime,
        activeModule: this.activeModule
      })
    },
    
    // 统一的拖拽结束处理方法
    finishDrag(e) {
      if (!this.isDragging) return
      
      e.preventDefault()
      e.stopPropagation()
      
      const ct = (e.changedTouches && e.changedTouches[0]) || null
      const endY = ct ? (ct.clientY ?? ct.pageY ?? this.startY) : this.startY
      const endTime = Date.now()
      const dragDuration = endTime - this.startTime
      this.$emit('drag-end', {
        startY: this.startY,
        endY: endY,
        deltaY: endY - this.startY,
        dragDistance: this.dragDistance,
        dragDuration: dragDuration,
        timestamp: endTime
      })
      
      // 重置拖拽状态
      this.isDragging = false
      this.dragDistance = 0
    },
    
    // 判断是否为交互元素
    isInteractiveElement(target) {
      const interactiveSelectors = [
        'month-nav',
        'view-toggle-bar',
        'event-item',
        'category-tab',
        'favorite-item',
        'item-action',
        'favorite-list',
        'action-btn',
        'settings-btn',
        'back-to-today'
      ]
      
      let element = target
      while (element && element.parentElement) {
        if (element.classList) {
          for (const selector of interactiveSelectors) {
            if (element.classList.contains(selector)) {
              return true
            }
          }
        }
        element = element.parentElement
      }
      
      return false
    },
    
    switchModule(module) {
      if (this.dragDistance < 10) {
        this.$emit('switch-module', module)
      }
    },
    
    handleSettingsClick() {
      if (this.dragDistance < 10) {
        this.$emit('settings-click')
      }
    }
  }
}
</script>

<style scoped>
.content-section {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -2px 20px rgba(0, 0, 0, 0.1);
  z-index: 2;
  transition: transform 0.25s ease-out; /* 调整为更轻的过渡，提升自然感 */
  will-change: transform;
}

.content-section.dragging {
  transition: none !important;
}

.module-content-background {
  position: absolute;
  top: 42px; /* 预留顶栏空间，避免遮挡分类/筛选区域 */
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  /* 移除高度限制，避免出现灰色空白条 */
  overflow: hidden;
  z-index: 1;
}

.top-actions {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 3px 15px; /* 恢复原值，避免占用过多垂直空间而遮挡下方分类栏 */
  z-index: 10;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 0 0 16px 16px;
  margin: 0 7px;
  cursor: grab;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  touch-action: pan-y;
}

/* 同时调整按钮样式配合容器 */
.action-btn {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  padding: 4px 10px; /* 修改：减少上下内边距(6px→4px)，调整左右内边距(8px→10px) */
  border-radius: 12px;
  background: #f8f9fa;
  transition: all 0.3s ease;
  min-width: 70px; /* 修改：稍微增加最小宽度(65px→70px) */
  flex: 1;
  margin: 0 1px; /* 修改：减少按钮间距(2px→1px) */
  cursor: pointer;
}

.top-actions:active {
  cursor: grabbing;
  background: rgba(255, 255, 255, 0.98);
  transform: scale(1.02); /* 轻微放大反馈 */
}

/* 优化拖拽指示器 */
.drag-indicator {
  width: 40px;
  height: 4px;
  background: linear-gradient(90deg, #ddd 0%, #bbb 50%, #ddd 100%);
  border-radius: 2px;
  margin: 0 auto 4px; /* 减小底部间距，顶栏更紧凑 */
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.top-actions:active .drag-indicator {
  background: linear-gradient(90deg, #999 0%, #666 50%, #999 100%);
  transform: scaleX(1.2); /* 水平拉伸效果 */
}

.action-buttons {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.action-btn {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  padding: 6px 8px;
  border-radius: 12px;
  background: #e9ecef; /* 修改：从 #f8f9fa 改为更深的 #e9ecef */
  transition: all 0.3s ease;
  min-width: 65px;
  flex: 1;
  margin: 0 2px;
  cursor: pointer;
}


.action-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.action-btn:active {
  transform: scale(0.95);
}

.action-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.btn-icon {
  font-size: 14px;
  margin-right: 5px;
  display: block;
}

.btn-text {
  font-size: 11px;
  font-weight: 500;
  color: #666;
  display: block;
  line-height: 1;
}

.action-btn.active .btn-text {
  color: white;
}

.settings-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #f8f9fa;
  transition: all 0.3s ease;
  cursor: pointer;
  margin-left: 6px;
  flex-shrink: 0;
}

.settings-btn:active {
  transform: scale(0.95);
  background: #e9ecef;
}

.settings-icon {
  font-size: 14px;
  color: #666;
}

/* 毛玻璃效果层 */
.frosted-glass-overlay {
  position: absolute;
  top: 0px;
  left: 0;
  right: 0;
  height: 42px; /* 再收窄高度，避免覆盖到分类栏区域 */
  z-index: 5;
  pointer-events: none;
  
  /* 毛玻璃效果 */
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  
  /* 渐变遮罩效果 */
  background: linear-gradient(
    180deg, 
    rgba(255, 255, 255, 0.6) 0%,
    rgba(255, 255, 255, 0.4) 50%,
    rgba(255, 255, 255, 0.2) 100%
  );
  
  /* 边框和圆角 */
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-top: none;
  border-radius: 0;
  
  /* 阴影效果 */
  box-shadow: 
    0 4px 20px rgba(121, 119, 119, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  
  /* 平滑过渡 */
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* 响应式调整 - 移除额外的高度调整 */
@media (max-width: 375px) {
  .frosted-glass-overlay {
    height: 50px;
    top: 0px;
  }
}

@media (min-width: 414px) {
  .frosted-glass-overlay {
    height: 50px;
    top: 0px;
  }
}
.draggable-content {
  touch-action: pan-y;
}

.draggable-bar {
  touch-action: pan-y;
}

.module-content-background:not(.draggable-content) {
  touch-action: auto;
}

.top-actions:not(.draggable-bar) .drag-indicator {
  opacity: 0.3;
}
</style>
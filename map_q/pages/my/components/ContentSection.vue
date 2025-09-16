<template>
  <view class="content-section" 
        :style="{ transform: `translateY(${translateY}px)` }">
    
    <!-- 模块内容区域 - 根据模块类型决定是否支持拖拽 -->
    <view class="module-content-background"
          :class="{ 'draggable-content': activeModule === 'date' || activeModule === 'favorite' }"
          @touchstart="handleContentTouchStart"
          @touchmove="handleContentTouchMove"
          @touchend="handleContentTouchEnd">
      <slot></slot>
    </view>
    
    <!-- 顶部操作区域 - 只在位置模块时支持拖拽 -->
    <view class="top-actions"
          :class="{ 'draggable-bar': activeModule === 'location' }"
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
      startTime: 0,
      isDragging: false,
      dragDistance: 0,
      lastMoveTime: 0
    }
  },
  methods: {
    // 横条拖拽处理（所有模块都支持）
    handleBarTouchStart(e) {
      this.initDrag(e)
    },
    
    handleBarTouchMove(e) {
      this.processDragMove(e, true) // 横条总是允许拖拽
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
      
      this.initDrag(e)
    },
    
    handleContentTouchMove(e) {
      if (this.activeModule !== 'date' && this.activeModule !== 'favorite') return
      
      const currentY = e.touches[0].clientY
      const deltaY = currentY - this.startY
      const absDeltaY = Math.abs(deltaY)
      
      // 降低拖拽阈值，提高响应性
      const dragThreshold = 3
      
      if (absDeltaY < dragThreshold) {
        return // 移动距离太小，不处理
      }
      
      let allowDrag = false
      
      if (this.activeModule === 'date') {
        // 🔥 核心修改：向上滑动时无条件允许拖拽并按比例扩大内容区域
        if (deltaY < 0) {
          allowDrag = true
          e.preventDefault()
          e.stopPropagation()
          
          // 🎯 关键：直接按比例调整内容区域大小
          const expandRatio = Math.abs(deltaY) / 100 // 每100px拖拽距离对应1倍变化
          const newTranslateY = this.translateY + deltaY * 0.8 // 0.8是拖拽响应系数
          
          // 限制扩大范围，避免过度扩大
          const maxExpand = -200 // 最大向上扩大200px
          const finalTranslateY = Math.max(newTranslateY, maxExpand)
          
          // 实时更新内容区域位置
          this.$emit('update-translate-y', finalTranslateY)
        }
        // 向下滑动：只有在顶部时才允许拖拽
        else if (deltaY > 0) {
          if (this.isScrollAtTop) {
            allowDrag = true
            e.preventDefault()
            e.stopPropagation()
            
            // 🎯 关键：直接按比例调整内容区域大小
            const shrinkRatio = deltaY / 100
            const newTranslateY = this.translateY + deltaY * 0.8
            
            // 限制缩小范围，避免过度缩小
            const maxShrink = 100 // 最大向下缩小100px
            const finalTranslateY = Math.min(newTranslateY, maxShrink)
            
            // 实时更新内容区域位置
            this.$emit('update-translate-y', finalTranslateY)
          } else {
            allowDrag = false
            return
          }
        }
      }
      else if (this.activeModule === 'favorite') {
        // 收藏模块：总是允许双向拖拽
        allowDrag = true
        e.preventDefault()
        e.stopPropagation()
        
        // 收藏模块也支持按比例调整
        const newTranslateY = this.translateY + deltaY * 0.8
        const finalTranslateY = Math.max(Math.min(newTranslateY, 100), -200)
        this.$emit('update-translate-y', finalTranslateY)
      }
      
      // 如果允许拖拽，继续处理拖拽事件
      if (allowDrag) {
        this.processDragMove(e, true)
      }
    },
    
    // 优化拖拽处理方法
    processDragMove(e, allowDrag) {
      if (!allowDrag) {
        return
      }
      
      const currentY = e.touches[0].clientY
      const deltaY = currentY - this.startY
      const absDeltaY = Math.abs(deltaY)
      
      // 如果还没开始拖拽，先启动拖拽
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
      
      // 更新拖拽状态
      this.dragDistance = absDeltaY
      this.lastMoveTime = Date.now()
      
      // 发出拖拽移动事件
      this.$emit('drag-move', {
        startY: this.startY,
        currentY: currentY,
        deltaY: deltaY,
        dragDistance: this.dragDistance,
        timestamp: this.lastMoveTime,
        activeModule: this.activeModule
      })
    },
    
    handleContentTouchEnd(e) {
      if (this.activeModule !== 'date' && this.activeModule !== 'favorite') return
      this.finishDrag(e)
    },
    
    // 统一的拖拽初始化方法
    initDrag(e) {
      this.startY = e.touches[0].clientY
      this.startTime = Date.now()
      this.lastMoveTime = this.startTime
      this.isDragging = false
      this.dragDistance = 0
    },
    
    // 统一的拖拽移动处理方法
    processDragMove(e, allowDrag) {
      if (!allowDrag) {
        // 不允许拖拽时，不阻止默认行为，让原生滚动继续
        return
      }
      
      // 阻止默认滚动行为
      e.preventDefault()
      e.stopPropagation()
      
      const currentY = e.touches[0].clientY
      const deltaY = currentY - this.startY
      const absDeltaY = Math.abs(deltaY)
      
      // 如果还没开始拖拽，先启动拖拽
      if (!this.isDragging) {
        this.isDragging = true
        this.$emit('drag-start', {
          startY: this.startY,
          currentY: currentY,
          timestamp: Date.now()
        })
      }
      
      // 更新拖拽状态
      this.dragDistance = absDeltaY
      this.lastMoveTime = Date.now()
      
      // 发出拖拽移动事件
      this.$emit('drag-move', {
        startY: this.startY,
        currentY: currentY,
        deltaY: deltaY,
        dragDistance: this.dragDistance,
        timestamp: this.lastMoveTime
      })
    },
    
    // 统一的拖拽结束处理方法
    finishDrag(e) {
      if (!this.isDragging) return
      
      e.preventDefault()
      e.stopPropagation()
      
      const endTime = Date.now()
      const dragDuration = endTime - this.startTime
      const endY = e.changedTouches && e.changedTouches.length > 0 
        ? e.changedTouches[0].clientY 
        : this.startY
      
      // 发出拖拽结束事件
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
        'month-nav',          // 月份导航按钮
        'view-toggle-bar',    // 视图切换栏
        'event-item',         // 事件项目
        'category-tab',       // 分类标签
        'favorite-item',      // 收藏项目
        'item-action',        // 项目操作按钮
        'favorite-list',      // 收藏列表
        'action-btn',         // 操作按钮
        'settings-btn',       // 设置按钮
        'back-to-today'       // 回到今天按钮
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
      // 只有在非拖拽状态下才切换模块
      if (this.dragDistance < 10) {
        this.$emit('switch-module', module)
      }
    },
    
    handleSettingsClick() {
      // 只有在非拖拽状态下才处理设置点击
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
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  will-change: transform;
}

.module-content-background {
  position: absolute;
  top: 0px; /* 减少top值，让内容区域向上移动 */
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: calc(100% - 45px); /* 相应调整高度 */
  overflow: hidden;
  z-index: 1;
}

.top-actions {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 5px 15px; /* 修改：减少上下内边距(8px→6px)，增加左右内边距(12px→16px) */
  z-index: 10;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 0 0 16px 16px;
  margin: 0 7px; /* 修改：减少左右外边距(12px→8px)，让容器更长 */
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
  width: 40px; /* 增加宽度 */
  height: 4px; /* 增加高度 */
  background: linear-gradient(90deg, #ddd 0%, #bbb 50%, #ddd 100%); /* 渐变效果 */
  border-radius: 2px;
  margin: 0 auto 8px;
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
  height: 50px; /* 减少高度，只保留导航栏高度 */
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
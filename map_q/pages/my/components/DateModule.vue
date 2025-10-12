<template>
  <view class="date-module">
    <!-- 日历选择器 -->
    <view class="calendar-section" 
          @touchstart="handleSwipeStart" 
          @touchmove="handleSwipeMove" 
          @touchend="handleSwipeEnd">
      <view class="calendar-header">
        <text class="month-title">{{ formatDateDisplay(currentMonth, selectedDate) }}</text>
        <view class="header-controls">
          <view class="back-to-today" @click="backToToday">
            <text class="back-to-today-text">回到今天</text>
          </view>
        </view>
      </view>
      
      <!-- 固定星期栏：放在滑动容器之外，切换月/周视图时保持不动 -->
      <view class="weekday-fixed-header">
        <text class="weekday">一</text>
        <text class="weekday">二</text>
        <text class="weekday">三</text>
        <text class="weekday">四</text>
        <text class="weekday">五</text>
        <text class="weekday">六</text>
        <text class="weekday">日</text>
      </view>
      
      <!-- 滑动容器 -->
      <view class="calendar-container" 
            :style="{ transform: `translateX(${containerTranslateX}px)` }">
        
        <!-- 月视图 -->
        <template v-if="showFullCalendar">
          <!-- 上个月 -->
          <view class="calendar-slide">
            <view class="calendar-grid">
              <view class="weekdays">
                <text class="weekday">一</text>
                <text class="weekday">二</text>
                <text class="weekday">三</text>
                <text class="weekday">四</text>
                <text class="weekday">五</text>
                <text class="weekday">六</text>
                <text class="weekday">日</text>
              </view>
              
              <view class="calendar-days">
                <view 
                  v-for="day in prevMonthDays" 
                  :key="'prev-' + day.date"
                  class="calendar-day"
                  :class="{ 
                    'selected': isSelectedDate(day.date),
                    'has-events': hasEvents(day.date),
                    'other-month': !day.isCurrentMonth
                  }"
                  @click="selectDate(day.date)">
                  <text class="day-number">{{ day.day }}</text>
                  <view v-if="hasEvents(day.date)" class="event-indicator"></view>
                </view>
              </view>
            </view>
          </view>
          
          <!-- 当前月 -->
          <view class="calendar-slide">
            <view class="calendar-grid">
              <view class="weekdays">
                <text class="weekday">一</text>
                <text class="weekday">二</text>
                <text class="weekday">三</text>
                <text class="weekday">四</text>
                <text class="weekday">五</text>
                <text class="weekday">六</text>
                <text class="weekday">日</text>
              </view>
              
              <view class="calendar-days">
                <view 
                  v-for="day in calendarDays" 
                  :key="day.date"
                  class="calendar-day"
                  :class="{ 
                    'selected': isSelectedDate(day.date),
                    'has-events': hasEvents(day.date),
                    'other-month': !day.isCurrentMonth
                  }"
                  @click="selectDate(day.date)">
                  <text class="day-number">{{ day.day }}</text>
                  <view v-if="hasEvents(day.date)" class="event-indicator"></view>
                </view>
              </view>
            </view>
          </view>
          
          <!-- 下个月 -->
          <view class="calendar-slide">
            <view class="calendar-grid">
              <view class="weekdays">
                <text class="weekday">一</text>
                <text class="weekday">二</text>
                <text class="weekday">三</text>
                <text class="weekday">四</text>
                <text class="weekday">五</text>
                <text class="weekday">六</text>
                <text class="weekday">日</text>
              </view>
              
              <view class="calendar-days">
                <view 
                  v-for="day in nextMonthDays" 
                  :key="'next-' + day.date"
                  class="calendar-day"
                  :class="{ 
                    'selected': isSelectedDate(day.date),
                    'has-events': hasEvents(day.date),
                    'other-month': !day.isCurrentMonth
                  }"
                  @click="selectDate(day.date)">
                  <text class="day-number">{{ day.day }}</text>
                  <view v-if="hasEvents(day.date)" class="event-indicator"></view>
                </view>
              </view>
            </view>
          </view>
        </template>
        
        <!-- 周视图 -->
        <template v-else>
          <!-- 上周 -->
          <view class="week-slide">
            <view class="week-view">
              <view class="week-header">
                <text class="week-day-name">一</text>
                <text class="week-day-name">二</text>
                <text class="week-day-name">三</text>
                <text class="week-day-name">四</text>
                <text class="week-day-name">五</text>
                <text class="week-day-name">六</text>
                <text class="week-day-name">日</text>
              </view>
              <view class="week-dates">
                <view 
                  v-for="day in prevWeekDays" 
                  :key="'prev-week-' + day.date"
                  class="week-date"
                  :class="{ 
                    'selected': isSelectedDate(day.date),
                    'has-events': hasEvents(day.date),
                    'other-month': !day.isCurrentMonth
                  }"
                  @click="selectDate(day.date)">
                  <text class="date-number">{{ day.day }}</text>
                  <view v-if="hasEvents(day.date)" class="event-indicator"></view>
                </view>
              </view>
            </view>
          </view>
          
          <!-- 当前周 -->
          <view class="week-slide">
            <view class="week-view">
              <view class="week-header">
                <text class="week-day-name">一</text>
                <text class="week-day-name">二</text>
                <text class="week-day-name">三</text>
                <text class="week-day-name">四</text>
                <text class="week-day-name">五</text>
                <text class="week-day-name">六</text>
                <text class="week-day-name">日</text>
              </view>
              <view class="week-dates">
                <view 
                  v-for="day in weekDays" 
                  :key="day.date"
                  class="week-date"
                  :class="{ 
                    'selected': isSelectedDate(day.date),
                    'has-events': hasEvents(day.date),
                    'other-month': !day.isCurrentMonth
                  }"
                  @click="selectDate(day.date)">
                  <text class="date-number">{{ day.day }}</text>
                  <view v-if="hasEvents(day.date)" class="event-indicator"></view>
                </view>
              </view>
            </view>
          </view>
          
          <!-- 下周 -->
          <view class="week-slide">
            <view class="week-view">
              <view class="week-header">
                <text class="week-day-name">一</text>
                <text class="week-day-name">二</text>
                <text class="week-day-name">三</text>
                <text class="week-day-name">四</text>
                <text class="week-day-name">五</text>
                <text class="week-day-name">六</text>
                <text class="week-day-name">日</text>
              </view>
              <view class="week-dates">
                <view 
                  v-for="day in nextWeekDays" 
                  :key="'next-week-' + day.date"
                  class="week-date"
                  :class="{ 
                    'selected': isSelectedDate(day.date),
                    'has-events': hasEvents(day.date),
                    'other-month': !day.isCurrentMonth
                  }"
                  @click="selectDate(day.date)">
                  <text class="date-number">{{ day.day }}</text>
                  <view v-if="hasEvents(day.date)" class="event-indicator"></view>
                </view>
              </view>
            </view>
          </view>
        </template>
      </view>
    </view>
    
    <!-- 在日历下方添加分隔线和切换三角 -->
    <view class="calendar-divider">
      <view class="divider-line"></view>
      <view class="toggle-triangle" @click="toggleCalendarView">
        <text class="triangle-icon">{{ showFullCalendar ? '▼' : '▲' }}</text>
      </view>
      <view class="divider-line"></view>
    </view>
    
    <!-- 日程列表 -->
    <view class="schedule-content">
      <scroll-view 
        class="schedule-list" 
        scroll-y="true"
        @scroll="onScheduleScroll">
        <view v-if="upcomingSchedules.length === 0" class="no-schedule">
          <text class="no-schedule-text">暂无日程安排</text>
        </view>
        
        <view v-for="(daySchedule, index) in upcomingSchedules" :key="index" class="schedule-day">
          <view class="schedule-date">
            <text class="date-text">{{ daySchedule.date }}</text>
            <text class="weekday-text">{{ daySchedule.weekday }}</text>
          </view>
          
          <view class="schedule-items">
            <view v-for="(schedule, scheduleIndex) in daySchedule.schedules" :key="scheduleIndex" class="schedule-item">
              <view class="schedule-time">
                <text class="time-text">{{ schedule.time }}</text>
              </view>
              <view class="schedule-info">
                <text class="schedule-title-text">{{ schedule.title }}</text>
                <text class="schedule-desc">{{ schedule.description }}</text>
                <view class="schedule-type" :class="'type-' + schedule.type">
                  <text class="type-text">{{ getScheduleTypeText(schedule.type) }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 额外底部占位，避免最后一项被底部栏遮挡 -->
        <view class="scroll-bottom-spacer"></view>
      </scroll-view>
    </view>
    
    <!-- ... 其他内容保持不变 ... -->
  </view>
</template>

<script>
export default {
  name: 'DateModule',
  props: {
    scheduleData: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      selectedDate: new Date(),
      currentMonth: new Date(),
      showFullCalendar: false, // 默认显示周视图
      // 触摸拖拽相关
      touchStartY: 0,
      touchStartTime: 0,
      isTouching: false,
      touchThreshold: 15,
      lastTouchY: 0,
      // 滑动相关
      swipeStartX: 0,
      swipeStartY: 0,
      swipeThreshold: 30,
      isSwipeHorizontal: false,
      // 动画相关
      isAnimating: false,
      translateX: 0,
      
      // 添加缺失的属性
      containerTranslateX: 0,
      slideWidth: 0,
      currentSlideIndex: 1,
      
      // 月份数据 - 重命名避免与methods冲突
      prevMonthData: new Date(),
      nextMonthData: new Date(),
      
      // 周数据
      currentWeek: new Date(),
      prevWeek: new Date(),
      nextWeekDate: new Date(),
      
      // 滚动相关
      scrollTop: 0,
      isAtTop: true
    }
  },
  computed: {
    upcomingSchedules() {
      const schedules = []
      // 从选中日期开始生成后续日程（包含选中当天）
      const startDate = new Date(this.selectedDate)
      startDate.setHours(0, 0, 0, 0)
      
      // 生成未来7天的日程（可按需扩展）
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate)
        date.setDate(startDate.getDate() + i)
        
        const daySchedules = this.generateRandomSchedules(date)
        
        if (daySchedules.length > 0) {
          schedules.push({
            date: this.formatDisplayDate(date),
            weekday: this.getWeekdayText(date),
            schedules: daySchedules
          })
        }
      }
      
      return schedules;
    },
    
    calendarDays() {
      const year = this.currentMonth.getFullYear()
      const month = this.currentMonth.getMonth()
    
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      const firstDayOfWeek = (firstDay.getDay() + 6) % 7 // 以周一为起始
    
      const days = []
    
      // 前置补位：上个月的最后几天，数量 = firstDayOfWeek
      for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const date = new Date(year, month, -i)
        days.push({
          date: this.formatDateKey(date),
          day: date.getDate(),
          isCurrentMonth: date.getMonth() === month
        })
      }
      
      // 当前月的日期
      for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day)
        days.push({
          date: this.formatDateKey(date),
          day: day,
          isCurrentMonth: date.getMonth() === month
        })
      }
      
      // 末尾补位：仅补齐最后一周，不再强制到42格
      const remainder = (firstDayOfWeek + lastDay.getDate()) % 7
      const trailingDays = remainder === 0 ? 0 : (7 - remainder)
      for (let day = 1; day <= trailingDays; day++) {
        const date = new Date(year, month + 1, day)
        days.push({
          date: this.formatDateKey(date),
          day: day,
          isCurrentMonth: date.getMonth() === month
        })
      }
    
      return days
    },
    
    // 上个月日历数据
    prevMonthDays() {
      return this.prevMonthData ? this.getMonthDays(this.prevMonthData) : []
    },
    
    // 下个月日历数据
    nextMonthDays() {
      return this.nextMonthData ? this.getMonthDays(this.nextMonthData) : []
    },
    
    // 上周日期数据
    prevWeekDays() {
      return this.getWeekDays(this.prevWeek)
    },
    
    // 下周日期数据
    nextWeekDays() {
      return this.getWeekDays(this.nextWeekDate)
    },
    
    // 周视图的日期计算
    weekDays() {
      const selectedDate = new Date(this.selectedDate)
      const currentDay = selectedDate.getDay()
      const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay // 周日为0，需要特殊处理
      
      const days = []
      for (let i = 0; i < 7; i++) {
        const date = new Date(selectedDate)
        date.setDate(selectedDate.getDate() + mondayOffset + i)
        
        days.push({
          date: this.formatDateKey(date),
          day: date.getDate(),
          fullDate: new Date(date),
          isCurrentMonth: date.getMonth() === this.currentMonth.getMonth()
        })
      }
      
      return days
    },
    
    selectedDateEvents() {
      const dateKey = this.formatDateKey(this.selectedDate)
      return this.scheduleData[dateKey] || []
    }
  },
  mounted() {
    this.initializeSlider()
    // 无论是周视图还是月视图，都需要初始化相邻月份数据
    this.updateAdjacentMonths()
    if (!this.showFullCalendar) {
      this.updateAdjacentWeeks()
    }
  },
  methods: {
    formatDateDisplay(date, selectedDate) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      return `${year}｜${month}.${day}`;
    },
    
    backToToday() {
      const today = new Date();
      this.selectedDate = today;
      this.currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    },
    
    // 初始化滑动器
    initializeSlider() {
      this.$nextTick(() => {
        // 获取屏幕宽度
        uni.getSystemInfo({
          success: (res) => {
            this.slideWidth = res.windowWidth
            // 初始位置设置为显示当前月（中间位置）
            this.containerTranslateX = -this.slideWidth
          }
        })
      })
    },
    
    // 更新相邻月份
    updateAdjacentMonths() {
      const current = this.currentMonth
      this.prevMonthData = new Date(current.getFullYear(), current.getMonth() - 1, 1)
      this.nextMonthData = new Date(current.getFullYear(), current.getMonth() + 1, 1)
    },
    
    // 获取指定月份的日历数据
    getMonthDays(monthDate) {
      const year = monthDate.getFullYear()
      const month = monthDate.getMonth()
    
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      const firstDayOfWeek = (firstDay.getDay() + 6) % 7 // 周一为起始
    
      const days = []
    
      // 上个月的日期（补齐首行）
      for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const date = new Date(year, month, -i)
        days.push({
          date: this.formatDateKey(date),
          day: date.getDate(),
          isCurrentMonth: date.getMonth() === month
        })
      }
      
      // 当前月的日期
      for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day)
        days.push({
          date: this.formatDateKey(date),
          day: day,
          isCurrentMonth: date.getMonth() === month
        })
      }
      
      // 下个月的日期（仅补齐末行，不再强制填充到42格）
      const remainder = (firstDayOfWeek + lastDay.getDate()) % 7
      const trailingDays = remainder === 0 ? 0 : (7 - remainder)
      for (let day = 1; day <= trailingDays; day++) {
        const date = new Date(year, month + 1, day)
        days.push({
          date: this.formatDateKey(date),
          day: day,
          isCurrentMonth: date.getMonth() === month
        })
      }
    
      return days
    },
    
    // 滑动相关方法
    handleSwipeStart(e) {
      if (this.isAnimating) return
      
      this.swipeStartX = e.touches[0].clientX
      this.swipeStartY = e.touches[0].clientY
      this.isSwipeHorizontal = false
      this.translateX = 0
    },
    
    handleSwipeMove(e) {
      if (!this.swipeStartX || this.isAnimating) return
      
      const currentX = e.touches[0].clientX
      const currentY = e.touches[0].clientY
      const deltaX = currentX - this.swipeStartX
      const deltaY = Math.abs(currentY - this.swipeStartY)
      
      if (Math.abs(deltaX) > deltaY && Math.abs(deltaX) > 10) {
        this.isSwipeHorizontal = true
        e.preventDefault()
        this.translateX = deltaX * 0.3
      }
    },
    
    // 获取指定周的日期数据
    getWeekDays(weekDate) {
      const currentDay = weekDate.getDay()
      const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay
      
      const days = []
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekDate)
        date.setDate(weekDate.getDate() + mondayOffset + i)
        
        days.push({
          date: this.formatDateKey(date),
          day: date.getDate(),
          fullDate: new Date(date),
          isCurrentMonth: date.getMonth() === this.currentMonth.getMonth()
        })
      }
      
      return days
    },
    
    // 更新相邻周
    updateAdjacentWeeks() {
      const current = new Date(this.selectedDate)
      this.prevWeek = new Date(current.getTime() - 7 * 24 * 60 * 60 * 1000)
      this.nextWeekDate = new Date(current.getTime() + 7 * 24 * 60 * 60 * 1000)
    },
    
    // 修复的动画方法 - 完全使用箭头函数和self引用
    animateMonthChange(direction, callback) {
      const targetX = direction === 'right' ? 100 : -100
      this.translateX = targetX
      
      const self = this
      
      setTimeout(() => {
        // 直接调用回调函数
        callback()
        self.translateX = direction === 'right' ? -100 : 100
        
        setTimeout(() => {
          self.translateX = 0
          setTimeout(() => {
            self.isAnimating = false
          }, 200)
        }, 50)
      }, 200)
    },
    
    // 修复的周视图动画
    animateWeekChange(direction, callback) {
      const targetX = direction === 'right' ? 100 : -100
      this.translateX = targetX
      
      const self = this
      
      setTimeout(() => {
        // 直接调用回调函数
        callback()
        self.translateX = direction === 'right' ? -100 : 100
        
        setTimeout(() => {
          self.translateX = 0
          setTimeout(() => {
            self.isAnimating = false
          }, 200)
        }, 50)
      }, 200)
    },
    
    // 修复的滑动结束处理 - 使用bind方法确保this上下文
    handleSwipeEnd(e) {
      if (!this.swipeStartX || this.isAnimating) {
        this.resetSwipeState()
        return
      }
      
      const endX = e.changedTouches[0].clientX
      const deltaX = endX - this.swipeStartX
      
      if (this.isSwipeHorizontal && Math.abs(deltaX) > this.swipeThreshold) {
        this.isAnimating = true
        
        if (deltaX > 0) {
          // 向右滑动 - 使用bind确保this上下文
          if (this.showFullCalendar) {
            this.animateMonthChange('right', this.previousMonth.bind(this))
          } else {
            this.animateWeekChange('right', this.previousWeek.bind(this))
          }
        } else {
          // 向左滑动 - 使用bind确保this上下文
          if (this.showFullCalendar) {
            this.animateMonthChange('left', this.nextMonth.bind(this))
          } else {
            this.animateWeekChange('left', this.nextWeek.bind(this))
          }
        }
      } else {
        this.animateReset()
      }
      
      this.resetSwipeState()
    },
    
    // 上一周
    previousWeek() {
      this.selectedDate = new Date(this.selectedDate.getTime() - 7 * 24 * 60 * 60 * 1000)
      this.updateAdjacentWeeks()
    },
    
    // 下一周
    nextWeek() {
      this.selectedDate = new Date(this.selectedDate.getTime() + 7 * 24 * 60 * 60 * 1000)
      this.updateAdjacentWeeks()
    },
    
    // 切换视图
    toggleCalendarView() {
      this.showFullCalendar = !this.showFullCalendar
      this.$nextTick(() => {
        this.initializeSlider()
        if (this.showFullCalendar) {
          this.updateAdjacentMonths()
        } else {
          this.updateAdjacentWeeks()
        }
      })
    },
    
    animateReset() {
      this.translateX = 0
      setTimeout(() => {
        this.isAnimating = false
      }, 200)
    },
    
    resetSwipeState() {
      this.swipeStartX = 0
      this.swipeStartY = 0
      this.isSwipeHorizontal = false
      this.translateX = 0
    },
    
    // 其他方法
    formatMonth(date) {
      const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
      return `${date.getFullYear()}年${months[date.getMonth()]}`
    },
    
    formatDateKey(date) {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    },
    
    formatSelectedDate(date) {
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
      return date.toLocaleDateString('zh-CN', options)
    },
    
    formatHour(hour) {
      return `${String(hour).padStart(2, '0')}:00`
    },
    
    previousMonth() {
      const newMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1)
      const dayOfMonth = this.selectedDate.getDate()
      const lastDay = new Date(newMonth.getFullYear(), newMonth.getMonth() + 1, 0).getDate()
      const newDay = Math.min(dayOfMonth, lastDay)
      this.currentMonth = newMonth
      this.selectedDate = new Date(newMonth.getFullYear(), newMonth.getMonth(), newDay)
      this.updateAdjacentMonths()
    },
    
    nextMonth() {
      const newMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1)
      const dayOfMonth = this.selectedDate.getDate()
      const lastDay = new Date(newMonth.getFullYear(), newMonth.getMonth() + 1, 0).getDate()
      const newDay = Math.min(dayOfMonth, lastDay)
      this.currentMonth = newMonth
      this.selectedDate = new Date(newMonth.getFullYear(), newMonth.getMonth(), newDay)
      this.updateAdjacentMonths()
    },
    
    selectDate(dateKey) {
      this.selectedDate = new Date(dateKey)
    },
    
    isSelectedDate(dateKey) {
      return dateKey === this.formatDateKey(this.selectedDate)
    },
    
    hasEvents(dateKey) {
      return this.scheduleData[dateKey] && this.scheduleData[dateKey].length > 0
    },
    
    getEventPosition(time) {
      const [hour, minute] = time.split(':').map(Number)
      return (hour * 60 + minute) * 0.8
    },
    
    handleEventClick(event) {
      this.$emit('event-click', event)
    },
    
    toggleCalendarView() {
      this.showFullCalendar = !this.showFullCalendar
    },
    
    isInteractiveElement(target) {
      const interactiveSelectors = [
        'month-nav',
        'calendar-day',
        'week-date', 
        'view-toggle-bar',
        'event-item',
        'timeline-scroll'
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
    
    getScheduleTypeText(type) {
      const typeTexts = {
        'meeting': '会议',
        'work': '工作',
        'personal': '个人',
        'health': '健康',
        'study': '学习'
      };
      return typeTexts[type] || '其他';
    },
    
    // 生成随机日程数据
    generateRandomSchedules(date) {
      const scheduleTypes = ['meeting', 'work', 'personal', 'health', 'study'];
      const scheduleTitles = {
        meeting: ['团队会议', '项目讨论', '客户会谈', '部门例会'],
        work: ['完成报告', '代码审查', '系统维护', '数据分析'],
        personal: ['购物', '聚餐', '看电影', '运动'],
        health: ['体检', '健身', '瑜伽', '跑步'],
        study: ['学习新技术', '阅读', '在线课程', '技能培训']
      };
      
      const scheduleDescs = {
        meeting: ['讨论项目进展', '制定下周计划', '解决技术问题', '分享工作经验'],
        work: ['整理文档资料', '优化代码结构', '测试新功能', '更新系统配置'],
        personal: ['放松心情', '享受生活', '陪伴家人', '充实自己'],
        health: ['保持健康', '增强体质', '缓解压力', '提升活力'],
        study: ['提升技能', '拓展知识', '学习新知', '自我提升']
      };
      
      const schedules = [];
      const dayOfWeek = date.getDay();
      
      // 周末减少日程数量
      const maxSchedules = (dayOfWeek === 0 || dayOfWeek === 6) ? 2 : 4;
      const scheduleCount = Math.floor(Math.random() * maxSchedules) + 1;
      
      for (let i = 0; i < scheduleCount; i++) {
        const type = scheduleTypes[Math.floor(Math.random() * scheduleTypes.length)];
        const titles = scheduleTitles[type];
        const descs = scheduleDescs[type];
        
        const hour = Math.floor(Math.random() * 12) + 8; // 8-19点
        const minute = Math.random() < 0.5 ? '00' : '30';
        
        schedules.push({
          time: `${hour.toString().padStart(2, '0')}:${minute}`,
          title: titles[Math.floor(Math.random() * titles.length)],
          description: descs[Math.floor(Math.random() * descs.length)],
          type: type
        });
      }
      
      // 按时间排序
      return schedules.sort((a, b) => a.time.localeCompare(b.time));
    },
    
    // 简单的字符串哈希函数
    simpleHash(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash = hash & hash; // Convert to 32bit integer
      }
      return Math.abs(hash);
    },
    
    // 格式化显示日期
    formatDisplayDate(date) {
      return `${date.getMonth() + 1}月${date.getDate()}日`;
    },
    
    // 获取星期几文本
    getWeekdayText(date) {
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      return weekdays[date.getDay()];
    },
    
    // 处理滚动位置检查
    onScrollPositionCheck(event) {
      // 通过 uni API 获取滚动位置
      const query = uni.createSelectorQuery().in(this)
      query.select('.schedule-list').scrollOffset((res) => {
        const isAtTop = res.scrollTop <= 5 // 允许5px的误差
        event.callback(isAtTop)
      }).exec()
    },
    
    // 监听滚动事件
    onScheduleScroll(e) {
      this.scrollTop = e.detail.scrollTop
      this.isAtTop = this.scrollTop <= 10 // 增加容错范围到10px
      
      // 向父组件发送滚动状态
      this.$emit('scroll-state-change', {
        scrollTop: this.scrollTop,
        isAtTop: this.isAtTop
      })
    }
  }
}
</script>

<style scoped>
/* 日程视图样式 */
.date-module {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  padding-top: 12px; /* 原为 60px，缩小顶部内边距以贴近黑色状态栏下缘 */
}

.calendar-section {
  background: #fff;
  border-bottom: 1px solid #eee;
  touch-action: pan-y;
  position: relative;
  overflow: hidden;
}

.calendar-container {
  display: flex;
  width: 300%;
  transition: transform 0.3s ease;
}

.calendar-slide {
  width: 33.333%;
  flex-shrink: 0;
}

.calendar-grid,
.week-view {
  transform: translateX(var(--translate-x, 0px));
  transition: transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 16px; /* 原10px 20px → 更窄 */
  background: #e9ecef;
  position: relative;
  z-index: 10;
}

.month-title {
  font-size: 15px; /* 原16px → 略微缩小 */
  font-weight: bold;
  color: #333;
  flex: 1;
  text-align: left;
  transition: opacity 0.2s ease;
}

.back-to-today {
  padding: 4px 10px; /* 原6px 12px → 更薄 */
  background: #007AFF;
  border-radius: 14px; /* 原15px → 略减 */
  margin-left: 8px; /* 原10px → 略减 */
  transition: all 0.2s;
}

.back-to-today-text {
  font-size: 11px; /* 原12px → 略减 */
  color: #fff;
  font-weight: 500;
}

.calendar-grid {
  padding: 0 16px 12px; /* 同步与 .calendar-grid 一致 */
}

.week-view {
  padding: 0 16px 12px; /* 同步与 .calendar-grid 一致 */
}

/* 月视图星期标题容器：与周视图 .week-header 一致 */
.weekdays {
  display: flex;
  margin-bottom: 8px;
  padding: 0;
}

.weekday {
  flex: 1;
  text-align: center;
  font-size: 12px;
  color: #999;
  padding: 6px 0; /* 与周视图星期标题一致 */
  font-weight: normal;
  display: inline-block; /* 移除潜在的默认 block/换行影响，确保在 flex 下均匀分布 */
}

.calendar-days {
  display: flex;
  flex-wrap: wrap;
}

.calendar-day {
  width: 14.28%;
  height: 42px; /* 确认与月视图一致 */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  margin-bottom: 3px;
}

.calendar-day.selected {
  background: #007AFF;
  border-radius: 12px;
  /* 移除固定宽高与居中，改为覆盖整格，与周视图一致 */
}

.calendar-day.selected .day-number {
  color: #fff;
}

.calendar-day.other-month .day-number {
  color: #ccc; /* 显示非当月为灰色，以便用户识别上下月补位 */
}

.calendar-day.other-month .event-indicator {
  display: none; /* 非当月不显示事件点 */
}

.calendar-day.other-month {
  pointer-events: none; /* 禁止点击非当月日期，避免误选导致高亮问题 */
}

.day-number {
  font-size: 15px;
  color: #333;
  font-weight: 500; /* 与周视图的 date-number 保持一致 */
}

.event-indicator {
  width: 4px; /* 原5px → 与周视图一致 */
  height: 4px; /* 原5px → 与周视图一致 */
  background: #FF3B30;
  border-radius: 2px; /* 原3px → 与周视图一致 */
  position: absolute;
  bottom: 6px; /* 原4px → 与周视图一致（选中态另行下移到4px） */
}

.calendar-day.selected .event-indicator {
  background: #fff;
  bottom: 4px; /* 与周视图选中态一致 */
}

.week-container {
  display: flex;
  width: 300%;
}

.week-slide {
  width: 33.333%;
  flex-shrink: 0;
}

.week-view {
  padding: 0 20px 15px;
}

/* 周视图星期标题样式 */
.week-header {
  display: flex;
  margin-bottom: 8px;
  padding: 0;
}

.week-day-name {
  flex: 1;
  text-align: center;
  font-size: 12px;
  color: #999;
  padding: 6px 0; /* 与周视图星期标题一致 */
  font-weight: normal;
}

.week-dates {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.week-date {
  width: 14.28%;
  height: 42px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  margin-bottom: 3px;
  border-radius: 12px;
  transition: all 0.2s;
}

.week-date.selected {
  background: #007AFF;
}

.week-date.selected .date-number {
  color: #fff;
}

.week-date.other-month .date-number {
  color: #ccc;
}

.date-number {
  font-size: 15px;
  color: #333;
  font-weight: 500;
}

.week-date .event-indicator {
  width: 4px;
  height: 4px;
  background: #FF3B30;
  border-radius: 2px;
  position: absolute;
  bottom: 6px;
}

.week-date.selected .event-indicator {
  background: #fff;
}

/* 切换按钮样式 */
.view-toggle-bar {
  display: flex;
  justify-content: center;
  padding: 12rpx 0; /* 压缩高度 */
  border-top: 1rpx solid #eee;
  margin-top: 12rpx; /* 减少上边距 */
}

.view-toggle {
  display: flex;
  align-items: center;
  padding: 10rpx 24rpx; /* 更薄的按钮 */
  background: #f8f9fa;
  border-radius: 18rpx; /* 略微减小圆角 */
  border: 1rpx solid #e9ecef;
}

.toggle-text {
  font-size: 26rpx; /* 略微缩小字号 */
  color: #495057;
  margin-right: 6rpx;
}

.toggle-icon {
  font-size: 22rpx; /* 略微缩小图标 */
  color: #6c757d;
}

/* 周视图样式 */
.week-view {
  padding: 0 20px 15px;
}

.week-days {
  display: flex;
  margin-top: 20rpx;
}

.event-dot {
  width: 8rpx;
  height: 8rpx;
  background: #ff3b30;
  border-radius: 50%;
  margin-top: 4rpx;
}

.week-date.selected .event-dot {
  background: white;
}

/* 分隔线和切换三角样式 */
.calendar-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px 0; /* 减少padding，使三角上移 */
  position: relative;
  margin-top: -20px; /* 添加负边距，进一步上移 */
}

.divider-line {
  flex: 1;
  height: 1px;
  background: transparent; /* 改为透明，取消横线显示 */
  margin: 0 10px;
  /* 或者直接设置 display: none; 完全隐藏 */
}

.toggle-triangle {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #007AFF;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-triangle:active {
  transform: scale(0.95);
  background: #0056CC;
}

.triangle-icon {
  font-size: 14px;
  color: white;
  font-weight: bold;
  line-height: 1;
}

/* 移除之前在日期中的三角样式 */
.week-date .toggle-triangle,
.calendar-day .toggle-triangle {
  display: none;
}

/* 确保日历容器有合适的下边距 */
.calendar-container {
  margin-bottom: 0;
}

/* 周视图样式调整 */
.week-view {
  padding: 0 20px 15px;
}

.week-date.selected {
  background: #007AFF;
  position: relative;
}

.week-date.selected .date-number {
  color: #fff;
}

.week-date.selected .event-dot {
  bottom: 4px;
  background: white;
}

/* 日程内容区域样式 */
.schedule-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0; /* 允许子滚动区在弹性布局中正确压缩并填充剩余空间 */
  padding: 0 9px; /* 原 20px → 缩小边距，让卡片更宽 */
  background-color: #f8f9fa;
}


.schedule-list {
  flex: 1;
  height: 100%;
  min-height: 0; /* 避免固定高度导致底部留白 */
  box-sizing: border-box;
  padding-top: 10px;
  /* 兼容不同平台的安全区，确保可滚动到最后一项 */
  padding-bottom: 24rpx; /* 原 80rpx → 缩小底部留白，避免割裂 */
}

/* 安全区增强：优先使用 env()，在不支持的平台回退到 rpx */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .schedule-list {
    padding-bottom: calc(env(safe-area-inset-bottom) + 24rpx); /* 原 +80rpx → +24rpx，保留安全区但减少多余空白 */
  }
}

/* 底部占位元素（用于确保最后一个卡片完全可见） */
.scroll-bottom-spacer {
  height: 0; /* 原 120rpx → 去除占位，改用安全区 padding 实现；若某机型仍遮挡可再微调 */
}

.no-schedule {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.no-schedule-text {
  color: #999;
  font-size: 14px;
}

.schedule-day {
  margin-bottom: 16px; /* 维持每张卡片之间间距 */
  background-color: #fff;
  border-radius: 10px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.schedule-day:last-child {
  margin-bottom: 0; /* 最后一张卡片不再额外增加底部空白 */
}
.schedule-date {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.date-text {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-right: 8px;
}

.weekday-text {
  font-size: 12px;
  color: #666;
  background-color: #f8f9fa;
  padding: 2px 6px;
  border-radius: 4px;
}

.schedule-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.schedule-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.schedule-time {
  min-width: 50px;
  padding-top: 2px;
}

.time-text {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.schedule-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.schedule-title-text {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  line-height: 1.4;
}

.schedule-desc {
  font-size: 12px;
  color: #666;
  line-height: 1.3;
}

.schedule-type {
  align-self: flex-start;
  margin-top: 4px;
}

.type-text {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  color: #fff;
}

.type-meeting .type-text {
  background-color: #007bff;
}

.type-work .type-text {
  background-color: #28a745;
}

.type-personal .type-text {
  background-color: #ffc107;
  color: #333;
}

.type-health .type-text {
  background-color: #dc3545;
}

.type-study .type-text {
  background-color: #6f42c1;
}

.type-appointment {
  background: #E8F5E9;
  color: #388E3C;
}

.type-task {
  background: #FFF3E0;
  color: #F57C00;
}

.type-reminder {
  background: #F3E5F5;
  color: #8E24AA;
}

.type-other {
  background: #ECEFF1;
  color: #546E7A;
}

.type-text {
  font-size: 12px;
}

/* 固定星期栏样式与隐藏内部标题，确保切换视图时星期栏不动 */
.weekday-fixed-header {
  display: flex;
  padding: 0 16px;
  margin-bottom: 8px;
}
.calendar-grid .weekdays,
.week-view .week-header {
  display: none;
}

/* 统一 .week-view padding 与 .calendar-grid 一致（最后覆盖） */
.week-view {
  padding: 0 16px 12px;
}
</style>
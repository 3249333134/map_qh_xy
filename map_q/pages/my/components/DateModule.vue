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
    </scroll-view>
    
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
      const today = new Date()
      
      // 生成未来7天的日程
      for (let i = 0; i < 7; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() + i)
        
        const dateKey = this.formatDateKey(date)
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
      const firstDayOfWeek = (firstDay.getDay() + 6) % 7
      
      const days = []
      
      for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const date = new Date(year, month, -i)
        days.push({
          date: this.formatDateKey(date),
          day: date.getDate(),
          isCurrentMonth: false
        })
      }
      
      for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day)
        days.push({
          date: this.formatDateKey(date),
          day: day,
          isCurrentMonth: true
        })
      }
      
      const remainingDays = 42 - days.length
      for (let day = 1; day <= remainingDays; day++) {
        const date = new Date(year, month + 1, day)
        days.push({
          date: this.formatDateKey(date),
          day: day,
          isCurrentMonth: false
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
      const firstDayOfWeek = (firstDay.getDay() + 6) % 7
      
      const days = []
      
      // 上个月的日期
      for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const date = new Date(year, month, -i)
        days.push({
          date: this.formatDateKey(date),
          day: date.getDate(),
          isCurrentMonth: false
        })
      }
      
      // 当前月的日期
      for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day)
        days.push({
          date: this.formatDateKey(date),
          day: day,
          isCurrentMonth: true
        })
      }
      
      // 下个月的日期
      const remainingDays = 42 - days.length
      for (let day = 1; day <= remainingDays; day++) {
        const date = new Date(year, month + 1, day)
        days.push({
          date: this.formatDateKey(date),
          day: day,
          isCurrentMonth: false
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
      this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1)
      this.updateAdjacentMonths()
    },
    
    nextMonth() {
      this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1)
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
  padding-top: 60px;
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
  padding: 10px 20px;
  background: #e9ecef;
  position: relative;
  z-index: 10;
}

.month-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  flex: 1;
  text-align: left;
  transition: opacity 0.2s ease;
}

.back-to-today {
  padding: 6px 12px;
  background: #007AFF;
  border-radius: 15px;
  margin-left: 10px;
  transition: all 0.2s;
}

.back-to-today:active {
  background: #0056CC;
  transform: scale(0.95);
}

.back-to-today-text {
  font-size: 12px;
  color: #fff;
  font-weight: 500;
}

.calendar-grid {
  padding: 0 20px 15px;
}

.weekdays {
  display: flex;
  margin-bottom: 8px;
}

.weekday {
  flex: 1;
  text-align: center;
  font-size: 12px;
  color: #999;
  padding: 8px 0;
}

.calendar-days {
  display: flex;
  flex-wrap: wrap;
}

.calendar-day {
  width: 14.28%;
  height: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  margin-bottom: 3px;
}

.calendar-day.selected {
  background: #007AFF;
  border-radius: 12px; /* 改为更大的圆角 */
  width: 42px; /* 增大尺寸 */
  height: 42px; /* 增大尺寸 */
  margin: 0 auto; /* 居中对齐 */
}

.calendar-day.selected .day-number {
  color: #fff;
}

.calendar-day.other-month .day-number {
  color: #ccc;
}

.day-number {
  font-size: 15px;
  color: #333;
}

.event-indicator {
  width: 5px;
  height: 5px;
  background: #FF3B30;
  border-radius: 3px;
  position: absolute;
  bottom: 4px;
}

.calendar-day.selected .event-indicator {
  background: #fff;
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
  padding: 8px 0;
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
  padding: 20rpx 0;
  border-top: 1rpx solid #eee;
  margin-top: 20rpx;
}

.view-toggle {
  display: flex;
  align-items: center;
  padding: 16rpx 32rpx;
  background: #f8f9fa;
  border-radius: 20rpx;
  border: 1rpx solid #e9ecef;
}

.toggle-text {
  font-size: 28rpx;
  color: #495057;
  margin-right: 8rpx;
}

.toggle-icon {
  font-size: 24rpx;
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

.week-date.selected .event-indicator {
  bottom: 4px;
  background: white;
}

/* 日程内容区域样式 */
.schedule-content {
  flex: 1;
  padding: 0 20px;
  background-color: #f8f9fa;
}


.schedule-list {
  height: 400px;
  padding-top: 10px;
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
  margin-bottom: 20px;
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
</style>
<template>
  <view class="social-overlay" v-if="overlayVisible">
    <!-- 场景切换小圆点（5个场景：陌生人/打卡/搭子/情侣/留言板） -->
    <view class="scene-switcher" @tap="switchScene">
      <view class="scene-dot" v-for="(s, idx) in 5" :key="idx"
            :class="{ active: currentSceneIdx === idx }"></view>
    </view>

    <!-- ============ 页面1：全城附近陌生人社交地图（WEMET风格） ============ -->
    <template v-if="currentScene === 'stranger'">
      <!-- 顶部通栏 -->
      <view class="top-bar top-wemet">
        <view class="top-left">
          <view class="brand-logo">
            <view class="logo-ic"></view>
            <text class="brand-text">WEMET</text>
          </view>
          <view class="brand-tab active">
            <text>附近</text>
          </view>
        </view>
        <view class="top-right">
          <text class="city-name">{{ cityName }}</text>
          <text class="online-count">{{ onlineCount }}+ 人在线</text>
        </view>
      </view>

      <!-- 右上角堆叠图标 -->
      <view class="top-stack-icons">
        <view class="stack-icon"><text>🖼</text></view>
        <view class="stack-icon"><text>⛶</text></view>
        <view class="stack-icon bell"><text class="ic">🔔</text><view class="badge">3</view></view>
      </view>

      <!-- 浅绿色多人搭子气泡 + 单人头像点位 -->
      <view class="point stranger-bubble" v-for="p in strangerGroups" :key="'sg'+p.id"
            :style="{ left: p.x + '%', top: p.y + '%' }">
        <view class="bubble-green">
          <text class="bubble-num">{{ p.curNum }}/{{ p.totalNum }}</text>
          <text class="bubble-tag">{{ p.tag }}</text>
        </view>
      </view>
      <view class="point stranger-avatar" v-for="p in strangerAvatars" :key="'sa'+p.id"
            :style="{ left: p.x + '%', top: p.y + '%' }">
        <view class="avatar-round">
          <view class="avatar-emoji">{{ p.emoji }}</view>
        </view>
        <view class="avatar-ping"></view>
      </view>
      <view class="point store-rect" v-for="p in strangerStores" :key="'ss'+p.id"
            :style="{ left: p.x + '%', top: p.y + '%' }">
        <text class="store-rect-text">{{ p.name }}</text>
      </view>

      <!-- 底部轻量信息流悬浮条 -->
      <view class="info-feed-bar">
        <view class="feed-item" v-for="(f, i) in feedList" :key="i">
          <view class="feed-avatar">{{ f.emoji }}</view>
          <text class="feed-text">{{ f.text }}</text>
        </view>
        <view class="feed-up" @tap="collapseFeed = !collapseFeed">
          <text>{{ collapseFeed ? '︿' : '﹀' }}</text>
        </view>
      </view>
    </template>

    <!-- 页面2：同城景点&门店打卡地图 -->
    <template v-if="currentScene === 'checkin'">
      <!-- 顶部搜索筛选通栏 -->
      <view class="top-bar top-checkin">
        <view class="search-box">
          <text class="search-ic">🔍</text>
          <text class="search-ph">搜索餐厅/景点/演出</text>
        </view>
        <scroll-view class="cat-scroll" scroll-x enable-flex>
          <view class="cat-chip" v-for="(c, i) in checkinCats" :key="i"
                :class="{ active: activeCat === i }"
                @tap="activeCat = i">
            <text>{{ c }}</text>
          </view>
        </scroll-view>
        <view class="filter-btn">
          <text>筛选 ▾</text>
        </view>
      </view>

      <!-- 门店图文气泡点位 -->
      <view class="point poi-bubble" v-for="p in poiPoints" :key="'pp'+p.id"
            :style="{ left: p.x + '%', top: p.y + '%' }"
            @tap="activePoi = activePoi === p.id ? 0 : p.id">
        <view class="poi-card" :class="{ active: activePoi === p.id }">
          <view class="poi-thumb">
            <text class="poi-emoji">{{ p.emoji }}</text>
          </view>
          <view class="poi-info">
            <text class="poi-name">{{ p.name }}</text>
            <view class="poi-stars">
              <text class="star">★</text>
              <text class="star-text">{{ p.rating }}</text>
            </view>
            <text class="poi-desc">{{ p.desc }}</text>
          </view>
        </view>
        <view class="poi-card-tail"></view>
        <!-- 点击展开的磨砂详情卡 -->
        <view class="poi-detail-float" v-if="activePoi === p.id">
          <view class="pdf-row">
            <text class="pdf-label">套餐价</text>
            <text class="pdf-value">¥{{ p.price }}</text>
          </view>
          <view class="pdf-row">
            <text class="pdf-label">营业</text>
            <text class="pdf-value">{{ p.hours }}</text>
          </view>
          <view class="pdf-btn">
            <text>立即预约 ›</text>
          </view>
        </view>
      </view>
    </template>

    <!-- 页面3：同城搭子组队地图 -->
    <template v-if="currentScene === 'teammate'">
      <view class="top-bar top-team">
        <view class="back-btn"><text>‹</text></view>
        <text class="page-title">全城搭子</text>
        <view class="bell-btn"><text>🔔</text></view>
      </view>

      <!-- 薄荷绿找搭子气泡 -->
      <view class="point mate-bubble" v-for="m in mateGroups" :key="'m'+m.id"
            :style="{ left: m.x + '%', top: m.y + '%' }"
            @tap="activeMate = activeMate === m.id ? 0 : m.id">
        <view class="mate-wrap">
          <view class="mate-bubble-green">
            <text class="mate-name">{{ m.name }}</text>
            <view class="mate-meta">
              <text class="mate-people">{{ m.joined }}人</text>
              <text class="mate-act">{{ m.actCount }}条动态</text>
            </view>
          </view>
          <view class="mate-tail"></view>
        </view>
        <!-- 点击弹窗 -->
        <view class="mate-pop" v-if="activeMate === m.id">
          <view class="mate-pop-title">{{ m.name }}</view>
          <view class="mate-pop-info">{{ m.joined }}人已报名 · 时间 {{ m.time }}</view>
          <view class="mate-pop-actions">
            <view class="mpa-btn chat"><text>发起聊天</text></view>
            <view class="mpa-btn join"><text>加入搭子</text></view>
          </view>
        </view>
      </view>
    </template>

    <!-- 页面4：情侣双人位置共享地图 -->
    <template v-if="currentScene === 'couple'">
      <view class="top-bar top-couple">
        <view class="couple-left">
          <text class="couple-title">{{ couplePosState ? '实时位置' : 'Ta未开启定位' }}</text>
          <view class="couple-sub">
            <text class="cs-item">📱 {{ couplePosState ? '实时共享' : '刚刚打开' }}</text>
            <text class="cs-item">🔋 {{ taBattery }}%</text>
            <text class="cs-item">📶 {{ taWifi }}</text>
          </view>
        </view>
        <view class="couple-top-icons">
          <view class="cti"><text>?</text><view class="fb">截图反馈</view></view>
          <view class="cti"><text>🔔</text></view>
          <view class="cti"><text>⚙</text></view>
        </view>
      </view>

      <!-- 情侣爱心连线+双人合并卡通气泡 -->
      <view class="couple-heart-line"></view>
      <view class="point couple-heart center">
        <text class="heart-emoji">💗</text>
      </view>
      <view class="point couple-heart" style="left:36%;top:34%">
        <text class="heart-emoji small">❤</text>
      </view>
      <view class="point couple-heart" style="left:64%;top:58%">
        <text class="heart-emoji small">❤</text>
      </view>

      <view class="point couple-bubble" style="left: 46%; top: 42%;">
        <view class="cb-avatars">
          <view class="cb-av me"><text>🧑</text></view>
          <view class="cb-av ta"><text>👩</text><view class="battery-pill">{{ taBattery }}%</view></view>
          <view class="cb-heart">💖</view>
        </view>
        <view class="cb-name">
          <text>另一半</text>
          <view class="cb-online-dot"></view>
        </view>
      </view>
      <view class="point me-bubble" style="left: 44%; top: 58%;">
        <view class="mb-av"><text>🧑</text></view>
        <text class="mb-name">Simon</text>
      </view>

      <!-- 温度悬浮 + 距离 -->
      <view class="temp-chip">
        <view class="temp-sun"></view>
        <text class="temp-text">{{ temp }}℃</text>
      </view>
      <view class="dist-chip-couple">
        <text>距离你 {{ coupleDistance }}m</text>
      </view>

      <!-- 可拖动的退出体验按钮 -->
      <view class="exit-couple-btn" @tap="exitCoupleScene">
        <view class="exit-ic"></view>
        <text class="exit-text">退出体验</text>
      </view>
    </template>

    <!-- 页面5：留言板/AR打卡墙 -->
    <template v-if="currentScene === 'messageBoard'">
      <!-- 顶部留言板标题 -->
      <view class="top-bar top-messageboard">
        <view class="mb-top-left">
          <text class="mb-title">留言板</text>
          <text class="mb-subtitle">{{ mbCount }}个打卡点</text>
        </view>
        <view class="mb-search">
          <text class="mb-search-ic">🔍</text>
          <text class="mb-search-ph">搜索留言墙</text>
        </view>
      </view>

      <!-- 留言板点位气泡（带留言数量） -->
      <view class="point mb-bubble" v-for="b in boardPoints" :key="'mb'+b.id"
            :style="{ left: b.x + '%', top: b.y + '%' }"
            @tap="selectBoard(b)">
        <view class="mb-outer-ring"></view>
        <view class="mb-bubble-body" :class="{ active: activeBoardId === b.id }">
          <text class="mb-bubble-icon">📌</text>
          <text class="mb-bubble-count">{{ b.messageCount }}</text>
        </view>
        <text class="mb-bubble-name">{{ b.name }}</text>
        <!-- 选中状态：展开留言板卡片 -->
        <view class="mb-card-float" v-if="activeBoardId === b.id" @tap.stop="toggleBoardCard">
          <MessageBoardCard
            :point-name="b.name"
            :point-address="b.address"
          />
        </view>
      </view>

      <!-- 底部留言墙入口 -->
      <view class="mb-wall-entry" @tap="enterARWall">
        <view class="mb-wall-ic">
          <text>📝</text>
        </view>
        <view class="mb-wall-info">
          <text class="mb-wall-title">开启AR留言墙</text>
          <text class="mb-wall-desc">对准墙面，写下你的打卡</text>
        </view>
        <view class="mb-wall-arrow">
          <text>›</text>
        </view>
      </view>
    </template>

    <!-- ============ 右侧竖排悬浮工具栏（通用） ============ -->
    <view class="right-toolbar">
      <template v-if="currentScene === 'stranger'">
        <view class="rt-btn" @tap="handleTool('setting')"><text>⚙</text></view>
        <view class="rt-btn" @tap="handleTool('friends')"><text>👥</text></view>
        <view class="rt-btn" @tap="handleTool('locate')"><view class="rt-locate"></view></view>
        <view class="rt-zoom">
          <view class="rt-btn" @tap="handleTool('zoomPlus')"><text>+</text></view>
          <view class="rt-divider"></view>
          <view class="rt-btn" @tap="handleTool('zoomMinus')"><text>−</text></view>
        </view>
        <view class="rt-btn" @tap="handleTool('filter')"><text>⚑</text></view>
      </template>
      <template v-if="currentScene === 'checkin'">
        <view class="rt-btn" @tap="handleTool('locate')"><view class="rt-locate"></view></view>
        <view class="rt-btn" @tap="handleTool('list')"><text class="big">≡</text></view>
        <view class="rt-zoom">
          <view class="rt-btn" @tap="handleTool('zoomPlus')"><text>+</text></view>
          <view class="rt-divider"></view>
          <view class="rt-btn" @tap="handleTool('zoomMinus')"><text>−</text></view>
        </view>
      </template>
      <template v-if="currentScene === 'teammate'">
        <view class="rt-btn" @tap="handleTool('filter')"><text>⚑</text></view>
        <view class="rt-btn" @tap="handleTool('myteam')"><text class="big">☰</text></view>
        <view class="rt-btn" @tap="handleTool('locate')"><view class="rt-locate"></view></view>
        <view class="rt-zoom">
          <view class="rt-btn" @tap="handleTool('zoomPlus')"><text>+</text></view>
          <view class="rt-divider"></view>
          <view class="rt-btn" @tap="handleTool('zoomMinus')"><text>−</text></view>
        </view>
      </template>
      <template v-if="currentScene === 'couple'">
        <view class="rt-btn" @tap="handleTool('chat')"><text>💬</text></view>
        <view class="rt-btn" @tap="handleTool('share')"><text>💗</text></view>
        <view class="rt-btn" @tap="handleTool('refresh')"><text class="big">↻</text></view>
        <view class="rt-btn" @tap="handleTool('exit')"><text class="big">✕</text></view>
      </template>
      <template v-if="currentScene === 'messageBoard'">
        <view class="rt-btn" @tap="handleTool('locate')"><view class="rt-locate"></view></view>
        <view class="rt-btn" @tap="handleTool('filter')"><text>⚑</text></view>
        <view class="rt-btn" @tap="handleTool('template')"><text class="big">🧩</text></view>
        <view class="rt-zoom">
          <view class="rt-btn" @tap="handleTool('zoomPlus')"><text>+</text></view>
          <view class="rt-divider"></view>
          <view class="rt-btn" @tap="handleTool('zoomMinus')"><text>−</text></view>
        </view>
        <view class="rt-btn" @tap="handleTool('myMsg')"><text class="big">📋</text></view>
      </template>
    </view>
  </view>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import MessageBoardCard from './MessageBoardCard.vue'

// 5场景枚举
const SCENES = ['stranger', 'checkin', 'teammate', 'couple', 'messageBoard']

// 通用工具：生成 N 个 0-100 之间的伪随机坐标，带种子避免每次刷新乱动
function seededPoints(n, seed, opts = {}) {
  let s = seed
  const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280 }
  const list = []
  const { minX = 8, maxX = 88, minY = 18, maxY = 82 } = opts
  for (let i = 0; i < n; i++) {
    list.push({
      id: i,
      x: Math.round(minX + rand() * (maxX - minX)),
      y: Math.round(minY + rand() * (maxY - minY))
    })
  }
  return list
}

// 搭子标签
const TAGS = ['干饭', '探店', '看演出', '密室', 'citywalk', '看电影']

export default {
  name: 'MapSocialOverlay',
  setup() {
    const overlayVisible = ref(true)
    const currentSceneIdx = ref(0)
    const currentScene = computed(() => SCENES[currentSceneIdx.value])
    const collapseFeed = ref(false)
    const activePoi = ref(0)
    const activeMate = ref(0)
    const activeCat = ref(0)
    const cityName = ref('成都市')
    const onlineCount = ref(1288)
    const temp = ref(29)
    const couplePosState = ref(false)
    const taBattery = ref(85)
    const taWifi = ref('Cyphant')
    const coupleDistance = ref(48)

    const switchScene = () => {
      currentSceneIdx.value = (currentSceneIdx.value + 1) % SCENES.length
      uni.showToast({
        title: `切换到：${['附近陌生', '景点打卡', '全城搭子', '情侣共享'][currentSceneIdx.value]}`,
        icon: 'none',
        duration: 800
      })
    }

    const handleTool = (name) => {
      uni.showToast({ title: `点击：${name}`, icon: 'none', duration: 600 })
    }
    const exitCoupleScene = () => {
      currentSceneIdx.value = 0
      uni.showToast({ title: '已退出情侣地图', icon: 'none' })
    }

    // ======= 陌生人场景数据 =======
    const strangerAvatarsEmojis = ['👩‍🦰', '👨', '👩', '🧑', '👧', '👦', '👵', '🧔', '👨‍🦱', '👩‍🦱', '🧑‍🦰', '👨‍🦳']
    const strangerAvatars = ref(
      seededPoints(16, 7, { minX: 10, maxX: 86, minY: 22, maxY: 80 }).map((p, i) => ({
        ...p,
        emoji: strangerAvatarsEmojis[i % strangerAvatarsEmojis.length]
      }))
    )
    const strangerGroups = ref(
      seededPoints(8, 11, { minX: 12, maxX: 84, minY: 25, maxY: 78 }).map((p, i) => ({
        ...p,
        curNum: 2 + (i % 5),
        totalNum: 4 + (i % 4),
        tag: TAGS[i % TAGS.length]
      }))
    )
    const strangerStores = ref([
      { id: 1, x: 74, y: 26, name: '落角巷·宿' },
      { id: 2, x: 60, y: 46, name: '即刻露营基地' },
      { id: 3, x: 30, y: 48, name: '森屿咖啡馆' }
    ])
    const feedList = ref([
      { emoji: '🦁', text: '悦酱：可以约饭吗，2缺2！' },
      { emoji: '🦊', text: '银狐桑：府南河散步～' }
    ])

    // ======= 景点打卡场景数据 =======
    const checkinCats = ref(['美食', '休闲玩乐', '景点', '丽人', '演出', '密室'])
    const poiEmojis = ['🍲', '🏞', '☕', '🍜', '🎭', '🏪']
    const poiBase = [
      { name: '东湖公园', rating: 4.8, desc: '公园很大，适合散心', price: 0, hours: '全天开放', emoji: '🏞' },
      { name: '楠火锅(总店)', rating: 4.9, desc: '排队超火·招牌九宫格', price: 158, hours: '11:00-22:00', emoji: '🍲' },
      { name: '太古里商圈', rating: 4.7, desc: '成都地标商圈', price: 0, hours: '10:00-22:00', emoji: '🏪' },
      { name: '宽窄巷子', rating: 4.6, desc: '老成都文化街区', price: 0, hours: '全天开放', emoji: '🏮' },
      { name: '望江楼公园', rating: 4.5, desc: '竹林幽径·古风打卡', price: 20, hours: '08:00-18:00', emoji: '🎋' },
      { name: 'Manner Coffee', rating: 4.8, desc: '平价精品咖啡', price: 15, hours: '08:00-20:00', emoji: '☕' }
    ]
    const poiPoints = ref(
      seededPoints(6, 17, { minX: 14, maxX: 82, minY: 28, maxY: 78 }).map((p, i) => ({
        ...p,
        ...poiBase[i]
      }))
    )

    // ======= 搭子组队场景数据 =======
    const mateNames = ['今晚吃火锅 2缺2', '周末去livehouse！', '健身房搭子', '密室拼桌-恐怖本', '春熙路逛街', '约拍城市街景']
    const mateGroups = ref(
      seededPoints(7, 23, { minX: 12, maxX: 84, minY: 25, maxY: 80 }).map((p, i) => ({
        ...p,
        name: mateNames[i % mateNames.length],
        joined: 2 + (i % 5),
        actCount: 2 + (i % 7) * 2,
        time: '今晚19:30'
      }))
    )

    // ======= 留言板场景数据 =======
    const activeBoardId = ref(0)
    const boardCardVisible = ref(false)
    const boardPoints = ref([
      { id: 1, name: '森屿咖啡馆', address: '锦江区·春熙路', messageCount: 28, x: 18, y: 35 },
      { id: 2, name: '老成都茶馆', address: '青羊区·宽窄巷子', messageCount: 45, x: 42, y: 22 },
      { id: 3, name: '798艺术区', address: '朝阳区·酒仙桥', messageCount: 128, x: 72, y: 38 },
      { id: 4, name: '东湖公园', address: '武昌区·东湖路', messageCount: 67, x: 30, y: 55 },
      { id: 5, name: '太古里商圈', address: '锦江区·中纱帽街', messageCount: 92, x: 58, y: 62 },
      { id: 6, name: '独立书店「方所」', address: '锦江区·天府大道', messageCount: 34, x: 78, y: 48 }
    ])
    const mbCount = computed(() => boardPoints.value.length)

    const selectBoard = (board) => {
      if (activeBoardId.value === board.id) {
        toggleBoardCard()
      } else {
        activeBoardId.value = board.id
        boardCardVisible.value = true
      }
    }

    const toggleBoardCard = () => {
      boardCardVisible.value = !boardCardVisible.value
    }

    const enterARWall = () => {
      uni.showToast({ title: '启动AR识别，请对准墙面', icon: 'none', duration: 1200 })
    }

    onMounted(() => {
      try {
        const t = uni.getStorageSync('MAP_SOCIAL_SCENE')
        if (typeof t === 'number' && t >= 0 && t < 5) currentSceneIdx.value = t
      } catch (e) {}
    })

    return {
      overlayVisible,
      currentSceneIdx,
      currentScene,
      collapseFeed,
      activePoi,
      activeMate,
      activeCat,
      cityName,
      onlineCount,
      temp,
      couplePosState,
      taBattery,
      taWifi,
      coupleDistance,
      switchScene,
      handleTool,
      exitCoupleScene,
      strangerAvatars,
      strangerGroups,
      strangerStores,
      feedList,
      checkinCats,
      poiPoints,
      mateGroups,
      activeBoardId,
      boardPoints,
      mbCount,
      selectBoard,
      toggleBoardCard,
      enterARWall
    }
  }
}
</script>

<style scoped>
/* ========== 底层容器：绝对定位叠在地图之上，z-index 必须小于 content-area（>5） ========== */
.social-overlay {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 4;
  pointer-events: auto;
}

/* 场景切换小点（不阻挡，透明+半透） */
.scene-switcher {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 18px;
  background: rgba(0,0,0,0.18);
  backdrop-filter: blur(10px);
  z-index: 120;
}
.scene-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255,255,255,0.4);
  transition: all 0.2s;
}
.scene-dot.active {
  width: 18px;
  border-radius: 3px;
  background: #ffffff;
}

/* ========== 通用顶栏（浮层） ========== */
.top-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  padding: 12px 16px 16px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  pointer-events: none;
}
/* 微信小程序 WXSS 不支持 * 通配选择器，改用显式子元素列表 */
.top-bar > .top-left,
.top-bar > .top-right,
.top-bar > .search-box,
.top-bar > .cat-scroll,
.top-bar > .filter-btn,
.top-bar > .back-btn,
.top-bar > .page-title,
.top-bar > .bell-btn,
.top-bar > .couple-left,
.top-bar > .couple-top-icons,
.top-bar > .mb-top-left,
.top-bar > .mb-search {
  pointer-events: auto;
}

/* ===== 场景1：WEMET 附近陌生人 ===== */
.top-wemet .top-left {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 4px;
}
.brand-logo {
  display: flex;
  align-items: center;
  gap: 6px;
}
.logo-ic {
  width: 28px; height: 28px;
  border-radius: 8px;
  background: var(--color-text);
  position: relative;
}
.logo-ic::before,
.logo-ic::after {
  content: ''; position: absolute; top: 50%;
  width: 10px; height: 10px; border-radius: 50%;
  transform: translateY(-50%);
}
.logo-ic::before { left: 4px; background: #70d888; }
.logo-ic::after  { right: 4px; background: #40a9ff; }
.brand-text {
  font-size: 22px;
  font-weight: 900;
  letter-spacing: -0.5px;
  color: var(--color-text);
}
.brand-tab {
  padding: 4px 12px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-muted);
}
.brand-tab.active {
  background: #70d888;
  color: #ffffff;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.1);
}
.top-wemet .top-right {
  padding-top: 2px;
  text-align: right;
}
.city-name {
  display: block;
  font-size: 34px;
  font-weight: 900;
  color: var(--color-text);
  letter-spacing: 1px;
  line-height: 1;
  padding-bottom: 6px;
  border-bottom: 3px solid var(--color-text);
}
.online-count {
  display: block;
  margin-top: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #111111;
  opacity: 0.75;
}

.top-stack-icons {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 60;
}
.stack-icon {
  width: 44px; height: 44px;
  border-radius: 14px;
  background: rgba(0,0,0,0.32);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  color: #ffffff;
  font-size: 18px;
}
.stack-icon .ic { font-size: 18px; }
.stack-icon .badge {
  position: absolute;
  top: -4px; right: -4px;
  min-width: 18px; height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: #ef4444;
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ===== 场景2：景点打卡 顶部搜索 ===== */
.top-checkin {
  flex-direction: column;
  gap: 10px;
  padding: 12px;
}
.search-box {
  width: 100%;
  height: 44px;
  background: rgba(255,255,255,0.78);
  backdrop-filter: blur(10px);
  border-radius: 22px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255,255,255,0.9);
}
.search-ic { font-size: 16px; }
.search-ph {
  font-size: 14px;
  color: var(--color-text-muted);
}
.cat-scroll {
  width: 100%;
  white-space: nowrap;
  padding: 2px 0;
}
.cat-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 18px;
  border-radius: 18px;
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(10px);
  margin-right: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  border: 1px solid rgba(255,255,255,0.9);
}
.cat-chip.active {
  background: #70d888;
  color: #ffffff;
  border-color: #70d888;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.1);
}
.filter-btn {
  align-self: flex-end;
  padding: 8px 16px;
  background: rgba(255,255,255,0.78);
  border-radius: 18px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  backdrop-filter: blur(10px);
  margin-top: -42px;
  border: 1px solid rgba(255,255,255,0.9);
}

/* POI 打卡卡片 */
.point.poi-bubble {
  transform: translate(-50%, -100%);
  z-index: 30;
}
.poi-card {
  width: 204px;
  background: rgba(255,255,255,0.82);
  backdrop-filter: blur(10px);
  border-radius: 14px;
  padding: 8px;
  display: flex;
  gap: 8px;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255,255,255,0.9);
  transition: all 0.2s;
}
.poi-card.active {
  transform: scale(1.06);
  box-shadow: 0 14px 38px rgba(0, 0, 0, 0.1);
  border-color: #40a9ff;
}
.poi-thumb {
  width: 54px; height: 54px;
  border-radius: 10px;
  background: #bae6fd;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.poi-emoji { font-size: 30px; }
.poi-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.poi-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.2;
}
.poi-stars { display: flex; align-items: center; gap: 4px; }
.star { font-size: 11px; color: #f59e0b; }
.star-text { font-size: 11px; font-weight: 700; color: #111111; }
.poi-desc {
  font-size: 11px;
  color: var(--color-text-muted);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.poi-card-tail {
  width: 0; height: 0;
  border-left: 7px solid transparent;
  border-right: 7px solid transparent;
  border-top: 8px solid rgba(255,255,255,0.9);
  margin: 0 auto;
  transform: translateY(-1px);
  filter: drop-shadow(0 4px 4px rgba(0,0,0,0.08));
}
.poi-detail-float {
  position: absolute;
  top: -110%;
  left: 50%;
  transform: translateX(-50%);
  width: 180px;
  padding: 10px 12px;
  background: rgba(17,24,39,0.86);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  color: #ffffff;
}
.pdf-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.pdf-label { font-size: 12px; color: var(--color-text-muted); }
.pdf-value { font-size: 14px; font-weight: 700; color: #40a9ff; }
.pdf-btn {
  margin-top: 8px;
  height: 32px;
  background: #40a9ff;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
}

/* ===== 场景3：搭子组队 顶部 ===== */
.top-team {
  align-items: center;
  padding: 12px 16px;
}
.back-btn,
.bell-btn {
  width: 40px; height: 40px;
  border-radius: 14px;
  background: rgba(255,255,255,0.78);
  backdrop-filter: blur(10px);
  display: flex; align-items: center; justify-content: center;
  color: var(--color-text);
  border: 1px solid rgba(255,255,255,0.9);
}
.back-btn text { font-size: 22px; font-weight: 700; margin-right: 2px; }
.bell-btn { font-size: 16px; }
.page-title {
  font-size: 22px;
  font-weight: 800;
  color: var(--color-text);
  letter-spacing: 0.5px;
}

/* 找搭子气泡 */
.point.mate-bubble {
  transform: translate(-50%, -100%);
  z-index: 30;
}
.mate-wrap { display: flex; flex-direction: column; align-items: center; }
.mate-bubble-green {
  padding: 8px 12px 8px 10px;
  background: #70d888;
  border-radius: 14px 14px 14px 4px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.1);
  min-width: 140px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.mate-name {
  font-size: 13px;
  font-weight: 800;
  color: #0b5c33;
  line-height: 1.3;
}
.mate-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
.mate-people {
  font-size: 11px;
  font-weight: 700;
  color: #065f46;
  padding: 1px 8px;
  border-radius: 8px;
  background: rgba(255,255,255,0.7);
}
.mate-act {
  font-size: 11px;
  font-weight: 600;
  color: rgba(11,92,51,0.75);
}
.mate-tail {
  width: 0; height: 0;
  border-left: 6px solid #70d888;
  border-bottom: 8px solid transparent;
  margin-right: auto;
  margin-left: 8px;
  margin-top: -1px;
  filter: drop-shadow(0 4px 4px rgba(112,216,136,0.25));
}
.mate-pop {
  width: 200px;
  margin-top: 8px;
  padding: 10px 12px;
  background: rgba(17,24,39,0.9);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.mate-pop-title {
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
}
.mate-pop-info {
  font-size: 11px;
  color: var(--color-text-muted);
}
.mate-pop-actions {
  display: flex;
  gap: 8px;
  margin-top: 2px;
}
.mpa-btn {
  flex: 1;
  height: 30px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}
.mpa-btn.chat {
  background: rgba(255,255,255,0.12);
  color: #ffffff;
}
.mpa-btn.join {
  background: #70d888;
  color: #0b5c33;
}

/* ===== 场景4：情侣共享 顶部 ===== */
.top-couple {
  padding: 12px 14px 14px;
}
.couple-left { flex: 1; min-width: 0; }
.couple-title {
  display: block;
  font-size: 30px;
  font-weight: 900;
  color: var(--color-text);
  letter-spacing: 1px;
  line-height: 1.1;
}
.couple-sub {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
}
.cs-item {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text);
  opacity: 0.75;
}
.couple-top-icons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.cti {
  width: 40px; height: 40px;
  border-radius: 50%;
  background: rgba(255,255,255,0.78);
  backdrop-filter: blur(10px);
  display: flex; align-items: center; justify-content: center;
  position: relative;
  color: var(--color-text);
  font-size: 16px;
  font-weight: 700;
  border: 1px solid rgba(255,255,255,0.9);
}
.cti .fb {
  position: absolute;
  top: -6px; left: 50%;
  transform: translateX(-50%);
  padding: 2px 8px;
  border-radius: 10px;
  background: #fcd34d;
  color: #78350f;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
}

/* 情侣爱心连线 */
.couple-heart-line {
  position: absolute;
  left: 50%;
  top: 34%;
  transform: translateX(-50%) rotate(55deg);
  width: 160px;
  height: 4px;
  background-image: repeating-linear-gradient(90deg, #ff7abc 0 14px, transparent 14px 24px);
  opacity: 0.8;
  z-index: 15;
}
.point.couple-heart.center {
  transform: translate(-50%, -50%);
  z-index: 20;
  left: 48% !important;
  top: 38% !important;
}
.heart-emoji {
  font-size: 42px;
  filter: drop-shadow(0 8px 20px rgba(255,122,188,0.55));
  animation: heartBeat 1.6s ease-in-out infinite;
}
.heart-emoji.small { font-size: 20px; opacity: 0.7; }
@keyframes heartBeat {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

/* 双人合并气泡 */
.point.couple-bubble {
  transform: translate(-50%, -50%);
  z-index: 24;
}
.cb-avatars {
  display: flex;
  align-items: center;
  gap: -8px;
  position: relative;
  width: 140px;
  height: 74px;
}
.cb-av {
  width: 72px; height: 72px;
  border-radius: 50%;
  background: #dbeafe;
  border: 4px solid #ffffff;
  display: flex; align-items: center; justify-content: center;
  font-size: 32px;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.1);
  position: relative;
}
.cb-av.me {
  z-index: 2;
}
.cb-av.ta {
  margin-left: -24px;
  background: #fce7f3;
}
.battery-pill {
  position: absolute;
  bottom: -6px; left: 50%;
  transform: translateX(-50%);
  padding: 1px 7px;
  border-radius: 8px;
  background: #70d888;
  color: #065f46;
  font-size: 10px;
  font-weight: 700;
}
.cb-heart {
  position: absolute;
  top: 4px; left: 44%;
  transform: translateX(-50%);
  width: 30px; height: 30px;
  border-radius: 50%;
  background: #ffffff;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
  z-index: 5;
}
.cb-name {
  margin-top: 8px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px 4px 10px;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(10px);
  border-radius: 14px;
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text);
  border: 1px solid rgba(255,255,255,0.9);
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: 66px;
}
.cb-online-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #70d888;
  box-shadow: 0 0 0 2px rgba(112,216,136,0.25);
}

/* 我自己的气泡 */
.point.me-bubble {
  transform: translate(-50%, 0);
  display: flex;
  align-items: center;
  gap: 6px;
  z-index: 22;
}
.mb-av {
  width: 44px; height: 44px;
  border-radius: 50%;
  background: #fecaca;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px;
  border: 3px solid #ffffff;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
}
.mb-name {
  padding: 4px 10px;
  border-radius: 14px;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(10px);
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text);
}

.temp-chip {
  position: absolute;
  right: 24px;
  bottom: 230px;
  padding: 6px 14px 6px 6px;
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(10px);
  border-radius: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  z-index: 40;
}
.temp-sun {
  width: 28px; height: 28px;
  border-radius: 50%;
  background: #fde68a;
  box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.1);
}
.temp-text {
  font-size: 16px;
  font-weight: 800;
  color: var(--color-text);
}
.dist-chip-couple {
  position: absolute;
  left: 50%;
  bottom: 180px;
  transform: translateX(-50%);
  padding: 8px 18px;
  background: rgba(255,255,255,0.82);
  backdrop-filter: blur(10px);
  border-radius: 18px;
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  z-index: 40;
}
.exit-couple-btn {
  position: absolute;
  left: 50%;
  top: 160px;
  transform: translateX(-50%);
  padding: 10px 22px;
  background: rgba(17,24,39,0.9);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.1);
  z-index: 45;
}
.exit-ic {
  width: 18px; height: 18px;
  border-radius: 50%;
  border: 2px solid #70d888;
  position: relative;
}
.exit-ic::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 4px;
  transform: translateX(-50%);
  width: 2px; height: 6px;
  background: #70d888;
}
.exit-text {
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 1px;
}

/* ========== 通用点位基类 ========== */
.point {
  position: absolute;
  z-index: 20;
}

/* 陌生人多人绿气泡 */
.point.stranger-bubble {
  transform: translate(-50%, -50%);
}
.bubble-green {
  min-width: 64px;
  padding: 6px 10px;
  background: #70d888;
  border-radius: 16px;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}
.bubble-num {
  font-size: 13px;
  font-weight: 800;
  color: #065f46;
  line-height: 1;
}
.bubble-tag {
  font-size: 10px;
  font-weight: 700;
  color: rgba(6,95,70,0.8);
  padding: 1px 6px;
  border-radius: 8px;
  background: rgba(255,255,255,0.6);
}

/* 陌生人单人头像 */
.point.stranger-avatar {
  transform: translate(-50%, -50%);
}
.avatar-round {
  width: 44px; height: 44px;
  border-radius: 50%;
  background: #ffffff;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
  border: 2px solid #ffffff;
  position: relative;
  z-index: 2;
}
.avatar-emoji { font-size: 22px; }
.avatar-ping {
  position: absolute;
  right: -2px;
  bottom: 2px;
  width: 14px; height: 14px;
  border-radius: 50%;
  background: #70d888;
  border: 2px solid #ffffff;
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
  z-index: 3;
}

/* 门店黑色矩形气泡 */
.point.store-rect {
  transform: translate(-50%, -100%);
  z-index: 28;
}
.store-rect-text {
  display: block;
  padding: 4px 10px;
  background: rgba(17,24,39,0.88);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  position: relative;
}
.store-rect-text::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -6px;
  transform: translateX(-50%);
  width: 0; height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 6px solid rgba(17,24,39,0.88);
}

/* 信息流悬浮条（非固定导航，底部极轻） */
.info-feed-bar {
  position: absolute;
  left: 16px;
  right: 120px;
  bottom: 80px;
  padding: 8px 10px 8px 14px;
  background: rgba(255,255,255,0.78);
  backdrop-filter: blur(10px);
  border-radius: 14px;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 60;
  border: 1px solid rgba(255,255,255,0.9);
}
.feed-item {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}
.feed-avatar {
  width: 28px; height: 28px;
  border-radius: 50%;
  background: #dbeafe;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
  border: 2px solid #ffffff;
}
.feed-text {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.feed-up {
  width: 28px; height: 28px;
  border-radius: 50%;
  background: rgba(15,23,42,0.08);
  display: flex; align-items: center; justify-content: center;
  color: var(--color-text-body);
  font-size: 14px;
  flex-shrink: 0;
}

/* ========== 右侧竖排悬浮工具栏 ========== */
.right-toolbar {
  position: absolute;
  right: 14px;
  top: 52%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 90;
}
.rt-btn {
  width: 44px; height: 44px;
  border-radius: 50%;
  background: rgba(0,0,0,0.32);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.18);
  display: flex; align-items: center; justify-content: center;
  color: #ffffff;
  font-size: 18px;
  transition: all 0.16s ease;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
}
.rt-btn .big { font-size: 20px; font-weight: 700; }
.rt-btn:active { transform: scale(0.92); }
.rt-locate {
  width: 18px; height: 18px;
  border: 2px solid #ffffff;
  border-radius: 50%;
  position: relative;
}
.rt-locate::before {
  content: '';
  position: absolute;
  left: 4px; top: 4px;
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #40a9ff;
}
.rt-zoom {
  width: 44px;
  background: rgba(0,0,0,0.32);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 22px;
  overflow: hidden;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
}
.rt-zoom .rt-btn {
  width: 100%;
  height: 42px;
  border-radius: 0;
  background: transparent;
  border: none;
  box-shadow: none;
}
.rt-divider {
  height: 1px;
  background: rgba(255,255,255,0.12);
  margin: 0 10px;
}

/* ============ 留言板场景样式 ============ */
.top-messageboard {
  flex-direction: column;
  gap: 12px;
}
.mb-top-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.mb-title {
  font-size: 28px;
  font-weight: 900;
  color: var(--color-text);
  letter-spacing: 1px;
  line-height: 1.1;
}
.mb-subtitle {
  font-size: 13px;
  font-weight: 600;
  color: #059669;
}
.mb-search {
  width: 100%;
  height: 40px;
  background: rgba(255,255,255,0.78);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255,255,255,0.9);
}
.mb-search-ic { font-size: 14px; }
.mb-search-ph { font-size: 13px; color: var(--color-text-muted); }

/* 留言板点位气泡 */
.point.mb-bubble {
  transform: translate(-50%, -100%);
  z-index: 30;
}
.mb-outer-ring {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(16,185,129,0.25);
  animation: mbPulse 2s ease-in-out infinite;
}
@keyframes mbPulse {
  0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.8; }
  50% { transform: translateX(-50%) scale(1.3); opacity: 0.3; }
}
.mb-bubble-body {
  position: relative;
  width: 48px;
  height: 48px;
  background: #10b981;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.1);
  z-index: 2;
  border: 2px solid #ffffff;
  transition: all 0.2s;
}
.mb-bubble-body.active {
  transform: scale(1.2);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.1);
}
.mb-bubble-icon {
  font-size: 12px;
  line-height: 1;
  margin-bottom: 2px;
}
.mb-bubble-count {
  font-size: 12px;
  font-weight: 800;
  color: #ffffff;
  line-height: 1;
}
.mb-bubble-name {
  display: block;
  margin-top: 8px;
  padding: 3px 10px;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(10px);
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

/* 留言板卡片浮层 */
.mb-card-float {
  position: absolute;
  top: 110%;
  left: 50%;
  transform: translateX(-50%);
  width: 320px;
  max-height: 400px;
  z-index: 50;
  animation: fadeInUp 0.3s ease;
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

/* 底部AR留言墙入口 */
.mb-wall-entry {
  position: absolute;
  left: 20px;
  right: 20px;
  bottom: 100px;
  padding: 16px 20px;
  background: #059669;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1);
  z-index: 60;
}
.mb-wall-ic {
  width: 48px;
  height: 48px;
  background: rgba(255,255,255,0.2);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}
.mb-wall-info {
  flex: 1;
  min-width: 0;
}
.mb-wall-title {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 2px;
}
.mb-wall-desc {
  display: block;
  font-size: 12px;
  color: rgba(255,255,255,0.8);
}
.mb-wall-arrow {
  width: 36px;
  height: 36px;
  background: rgba(255,255,255,0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.mb-wall-arrow text {
  font-size: 18px;
  color: #ffffff;
  font-weight: 700;
}
</style>

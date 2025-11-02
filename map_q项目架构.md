# Map_Q 项目架构说明

## 全局组件 (/components/)
```
├── InAppNotification.vue          # 应用内通知组件
├── PublishOverlay.vue            # 发布弹层组件
├── card/                         # 卡片相关组件
│   ├── CardItem.vue             # 通用卡片组件
│   └── ServiceCardItem.vue      # 服务卡片组件
├── common/                       # 通用组件
│   ├── GlobalNavBar.vue         # 全局导航栏
│   └── GlobalOverlayHost.vue    # 全局弹层宿主
├── content/                      # 内容相关组件
│   ├── CategoryTabs.vue         # 分类选项卡
│   ├── ContentArea.vue          # 内容区域
│   └── SearchBox.vue            # 搜索框
├── layout/                       # 布局相关组件
│   ├── CenterBump.vue           # 中心凸起组件
│   └── WaterfallLayout.vue      # 瀑布流布局
├── map/                          # 地图相关组件
│   └── MapBackground.vue        # 地图背景
└── preview/                      # 预览相关组件（空目录）
```

## 页面结构 (/pages/)

### 首页 (index/)
```
├── composables/                  # 首页业务逻辑
│   ├── useCategory.js           # 分类管理
│   ├── useLayout.js             # 布局管理
│   ├── useMapData.js            # 地图数据管理
│   └── useMapManager.js         # 地图管理器
├── constants/
│   └── layoutConfig.js          # 布局配置常量
└── index.vue                    # 首页主文件
```

### 详情页 (detail/)
```
├── components/                   # 详情页专用组件
│   ├── BottomActions.vue        # 底部操作栏
│   ├── CommentItem.vue          # 评论项
│   ├── CommentsSection.vue      # 评论区域
│   ├── ContentArea.vue          # 内容区域
│   ├── DetailPage.vue           # 详情页面
│   ├── Header.vue               # 页面头部
│   ├── ImageSlider.vue          # 图片轮播
│   └── ReplyItem.vue            # 回复项
├── composables/
│   └── detail.js                # 详情页业务逻辑
└── index.vue                    # 详情页主文件
```

### 我的页面 (my/)
```
├── components/                   # 我的页面专用组件
│   ├── ContentSection.vue       # 内容区域
│   ├── DateModule.vue           # 日期模块
│   ├── FavoriteModule.vue       # 收藏模块
│   ├── LocationModule.vue       # 位置模块
│   └── ProfileSection.vue       # 个人资料区域
├── composables/                  # 我的页面业务逻辑
│   ├── useMyData.js             # 数据管理
│   ├── useMyLayout.js           # 布局管理
│   └── useMyOverlay.js          # 弹层管理
└── index.vue                    # 我的页面主文件
```

### 服务页面 (service/)
```
├── composables/                  # 服务页面业务逻辑
│   ├── useServiceCategory.js    # 服务分类管理
│   ├── useServiceLayout.js      # 服务布局管理
│   └── useServiceMapData.js     # 服务地图数据
├── constants/
│   └── layoutConfig.js          # 布局配置常量
├── detail/
│   └── index.vue                # 服务详情页
└── index.vue                    # 服务页主文件
```

### 其他页面
```
├── message/
│   └── index.vue                # 消息页面
├── plus/
│   └── index.vue                # 发布页面
└── test/
    └── test.vue                 # 测试页面
```

## 工具模块 (/utils/)
```
├── api.js                       # API 接口封装
├── config.js                    # 配置管理
├── db.js                        # 数据库操作
├── heightManager.js             # 高度管理器
├── messageManager.js            # 消息管理器
└── notification.js              # 通知管理
```

## 静态资源 (/static/)
```
├── css/
│   └── custom.css               # 自定义样式
├── tabbar/                      # 底部导航栏图标
│   ├── *.png, *.svg            # 各种状态的图标
│   └── transparent.png          # 透明占位图
├── *.png                        # 地图标记、Logo等图片
├── tabbar-*.css                 # 底部导航栏样式
└── publish-button.css           # 发布按钮样式
```

## 自定义底部导航 (/custom-tab-bar/)
```
├── index.js                     # 导航逻辑
├── index.json                   # 配置文件
├── index.vue                    # Vue组件
├── index.wxml                   # 微信小程序模板
├── index.wxss                   # 微信小程序样式
└── preview.html                 # 预览页面
```

## 配置文件
```
├── App.vue                      # 应用根组件
├── main.js                      # 应用入口
├── pages.json                   # 页面配置
├── manifest.json                # 应用清单
├── uni.scss                     # 全局样式变量
├── vue.config.js                # Vue配置
└── project.*.json               # 项目配置
```

## 架构特点

1. **组件化设计**: 按功能模块划分组件，便于复用和维护
2. **Composables模式**: 使用Vue3 Composition API进行业务逻辑抽离
3. **页面独立**: 每个页面有独立的组件和业务逻辑目录
4. **资源分类**: 静态资源按类型和用途分类存放
5. **配置集中**: 各类配置文件统一管理
6. **跨端兼容**: 支持uni-app多端开发，包含微信小程序相关文件
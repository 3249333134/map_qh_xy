# Map Q / 足迹 UI 设计说明

## 设计基准

本设计输出以 `map_q` 当前小程序结构、你提供的最新界面截图、`足迹商业计划书.docx` 和 `足迹详细设计说明书（DDS）.docx` 为依据。产品核心是“地图频道社交系统”：地图不是装饰背景，而是信息流、服务、频道、创作和个人足迹的统一空间容器。

本轮只优化 `figma-output` 交付包，不改真实 `map_q` 页面代码。画板统一使用接近微信小程序/iPhone 的移动端尺寸，保留状态栏、胶囊按钮、底部导航和安全区。当前版本共有 **68 个画板**，其中新增 8 个当前 UI 状态还原画板，用于对齐最新截图。

## 首页地图闭环

首页是第一优先级。DDS 中的核心要求是“地图标点与内容卡片一一对应”：滚动或展开内容时，地图 marker 与内容状态同步；点击卡片信息区只做地图预览/定位，点击封面进入详情。

- 默认态：`home-map-feed` 保留顶部地图视界、浮动内容面板、搜索框、橙色下划线 tabs、双列瀑布流和底部导航。
- 地图卡片浮层：`home-map-card-focus` 补齐最新截图中的地图展开态，卡片直接浮在地图上，表达“卡片可见范围驱动地图点位”的状态。
- 大地图低面板：`home-map-sheet-low` 表达地图占主导、内容面板降低的浏览状态，适合向外探索和空间范围扩张。
- 卡片规则：普通内容卡封面优先使用用户上传图片或真实媒体封面；没有封面才显示轻量占位。地点、轨迹、服务才使用地图网格、路线、服务状态等结构化视觉。
- 定位规则：点击卡片文字/信息区触发地图预览或定位；点击封面进入内容详情。地图定位不会反向改变普通内容卡封面。
- 普通内容详情：`home-content-detail` 表达首屏媒体详情，`home-content-location-comments` 补齐详情滚动后的位置信息、导航按钮和评论区。
- 活动详情：`home-activity-detail` 表达活动首屏，`home-activity-register-detail` 表达报名进度、参与头像、活动详情和注意事项。
- 搜索结果：`home-search-results` 表达地点、内容、服务、频道的统一召回，并保留“定位回地图”的动作。
- 地点与轨迹：`home-place-detail`、`home-track-detail` 分别表达地点聚焦、路线展示、导航、附近内容和预约入口。
- 预约确认：`home-booking-confirm` 承接地点/服务 CTA，确认后可进入消息通知链路。
- 锚点与图层：`home-anchor-layer-lab` 覆盖五类锚点与智能图层，`home-anchor-action` 表达点击 marker 后的快捷操作。
- 分享与迷雾：`home-map-share` 覆盖单卡片、路线、副本导览、地图快照；`home-fog-unlock` 表达未探索区域、收藏、导航、发布和共建提交。
- AI 搜索：`ai-search` 将首页搜索框升级为自然语言入口，支持“推荐附近适合拍樱花的地方”这类语义请求。
- 组件沉淀：`home-map-component-board` 汇总 marker variants、图层开关、锚点快捷卡、地图分享卡、迷雾解锁卡、搜索结果卡和状态 chips。

## 首页组件规范

五类锚点统一在组件板中定义：

- 互动地标：金色徽章感，用于地标导览、活动创建、频道聚合。
- 兴趣 POI：蓝绿色呼吸点，用于兴趣雷达、收藏地点、个性化推荐。
- 活动：紫色气泡与倒计时，用于主题活动、好友参与、快速报名。
- 内容：蓝色内容 pin 与评论点，用于动态流、评论互动、同频道内容推荐。
- 普通定位：灰色定位点，用于地点收藏、迷雾解锁、导航和发布入口。

图层开关包括兴趣雷达、活动倒计时、服务曝光、未探索迷雾。状态样式包括 `loading`、`empty`、`selected`、`highlighted`、`locked`、`verified`、`pending review`，用于卡片、marker、审核与频道权限。

## 全页面拓扑

### 首页

- L1：`home-map-feed`、`home-map-card-focus`、`home-map-sheet-low`
- L2：`home-search-results`、`home-content-detail`、`home-content-location-comments`、`home-activity-detail`、`home-activity-register-detail`、`home-place-detail`、`home-track-detail`、`home-anchor-layer-lab`、`ai-search`
- L3：`home-media-preview`、`home-booking-confirm`、`home-anchor-action`、`home-map-share`
- L4：`home-fog-unlock`
- 组件：`home-map-component-board`

### 服务

- L1：`service-map-feed`
- L2：`service-card-types`、`service-detail`、`service-detail-current`
- L3：`service-merchant-channel`、`service-booking`
- L4：`service-wiki-edit`、`service-payment`、`service-success`

服务页沿用首页的地图联动逻辑：上方地图 marker 与下方服务卡一致，服务卡展示评分、营业状态、预约 CTA、时间线条和频道入口。`service-detail-current` 还原最新截图里的绿色服务主页：大封面、评分、完成量、兴趣/偏好 chips、收藏/客服/购物车/立即预约底栏。预约按钮是独立操作，不冒泡触发定位或详情。

### 发布、沙盒、原创 IP

- 发布 L1：`publish-entry`
- 发布 L2：`publish-type-center`、`publish-editor`、`creator-center`
- 发布 L3：`publish-ai-template`、`publish-track-editor`、`publish-topic-picker`、`publish-location-picker`、`publish-preview`
- 发布 L4：`publish-map-cocreate`、`publish-success`
- 沙盒：`sandbox-editor` → `sandbox-schedule` → `sandbox-test-share`
- 原创 IP：`ip-editor` → `ip-selector`、`ip-auth-settings` → `ip-success`

发布线覆盖内容创作、AI 模板、轨迹编辑、位置绑定、话题选择、地图共创审核、草稿沙盒、定时发布、测试分享和原创 IP 授权。

### 消息

- L1：`message-center`
- L2：`channel-map`、`message-search`、`chat-detail`
- L3：`channel-detail`、`channel-thread-card`、`notification-detail`、`contact-profile`
- L4：`channel-permissions`

消息线表达频道化社交：地图频道副本、区域讨论、线程卡、通知详情、联系人资料、私密频道审核和角色权限。通知中的地点可回到首页地图定位。

### 我的

- L1：`my-profile`
- L2：`my-services-manage`、`my-location-map`、`my-footprint-map-current`、`my-favorites`、`my-favorites-current`、`my-calendar`
- L3：`my-heatmap-stats`、`my-timeline-review`、`my-settings`
- L4：`my-privacy-control`、`my-profile-edit`

我的页表达个人地图回忆：头像、认证、统计、足迹地图、收藏、日程、热力图、时间轴、隐私控制和资料编辑。`my-footprint-map-current` 还原最新截图中的地图卡片分布，`my-favorites-current` 还原收藏筛选和双列瀑布流。

### 商业化与组件

- 商业化：`monetization-center`
- 组件：`token-board`

商业化画板覆盖会员、积分、广告曝光、内容推广和创作者收益。组件画板汇总颜色、文字、按钮、tabs、卡片、底部导航与状态样式。

## 策划书 / DDS 对应关系

- “地图作为信息流载体”：由首页、服务、消息地图频道和我的足迹地图共同覆盖。
- “地图标点与瀑布流一致”：由首页默认态、地图卡片浮层、低面板、搜索结果、锚点图层和组件板覆盖。
- “卡片预览机制”：由首页卡片规则、地图卡片浮层、地点详情、锚点快捷卡覆盖。
- “智能图层”：由首页图层实验室、组件板和 tokens 覆盖。
- “地图副本机制”：由锚点图层、频道地图、服务频道、消息频道覆盖。
- “AI 搜索”：由 `ai-search` 与首页搜索入口覆盖。
- “服务发现 - 预约 - 体验”：由服务 L1-L4 和预约确认覆盖。
- “信标共建 / 地图共创”：由 `publish-map-cocreate`、`home-fog-unlock` 和服务共建审核覆盖。
- “频道权限”：由消息频道权限画板覆盖。
- “个人足迹沉淀”：由我的页、足迹地图、收藏瀑布流、热力统计、时间轴和隐私控制覆盖。
- “商业价值”：由会员积分、推广曝光和创作者收益覆盖。

## 交付与验收

Figma 导入时先导入首页拓扑，再导入服务、发布、消息、我的、商业化和组件。HTML 预览中每个画板上方都有 L1-L4 层级、路径编号、业务说明和状态 chips，方便评审时直接按业务链路走查。

验收重点：

- 68 个 `.phone` 画板都存在，`.design` 中 68 个 `htmlSrc` 锚点都能在 HTML 找到。
- 首页主链路排在最前，新增当前 UI 状态画板紧跟首页默认态。
- 普通内容卡封面遵守“用户上传图片优先”，地点定位只由明确定位行为触发。
- 分组标题、层级标识、路径编号、状态 chips 可读，不遮挡手机画板内容。
- README、设计说明和 `.design` 元数据均为 UTF-8 可读文本。

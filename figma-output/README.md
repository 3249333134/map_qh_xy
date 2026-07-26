# Map Q / 足迹 Figma 输出包

这个目录是 `map_q` 当前 UI 的离线 Figma/HTML 交付包。本轮只优化设计输出，不修改真实 `map_q` 业务代码。

输出依据包括：你提供的当前界面截图、`map_q/pages.json`、`file/足迹商业计划书.docx`、`file/足迹详细设计说明书（DDS）.docx`。本次在原有完整拓扑上继续补充当前 UI 状态，共有 **68 个画板**，首页地图闭环与最新截图状态排在最前。

## 文件

- `map-q-figma-boards.html`：可运行预览入口，包含全部页面画板、分组标题、L1-L4 层级标识、路径说明和状态 chips。
- `design-tokens.css`：颜色、圆角、阴影、间距、卡片、tabs、marker、状态与图层变量。
- `map-q-ui-design.md`：设计说明、页面拓扑、组件规范、交互规则和策划书/DDS 覆盖清单。
- `map-q-ui.design`：设计元数据，保留 `topology` 字段，并为每个画板写入 `level`、`flow`、`htmlSrc`。

## 预览

```text
http://127.0.0.1:4173/map-q-figma-boards.html
```

也可以直接打开：

```powershell
Start-Process "D:\prj\map_qh_xy\figma-output\map-q-figma-boards.html"
```

## 首页地图闭环导入顺序

Figma 导入时建议优先导入首页链路，再导入服务、发布、消息、我的和商业化。这样可以先建立“地图视界 - 内容流 - 卡片预览 - 详情 - 活动 - 锚点 - 分享 - AI”的主体验。

1. `#home-map-feed`：L1 首页地图内容流，承接地图顶部、搜索、tabs、瀑布流混合卡片。
2. `#home-map-card-focus`：L1 地图卡片浮层，表现地图展开后卡片直接贴在地图上的状态。
3. `#home-map-sheet-low`：L1 大地图低面板，表现地图占主导、内容面板收起到下方的状态。
4. `#home-search-results`：L2 搜索与筛选结果。
5. `#home-content-detail`：L2 普通内容详情首屏，封面为用户上传图片/视频。
6. `#home-content-location-comments`：L2 普通内容详情滚动态，补齐位置卡与评论区。
7. `#home-activity-detail`：L2 活动详情首屏。
8. `#home-activity-register-detail`：L2 活动报名、进度与注意事项。
9. `#home-media-preview`：L3 媒体预览与评论。
10. `#home-place-detail`：L2 地点详情。
11. `#home-track-detail`：L2 轨迹详情。
12. `#home-booking-confirm`：L3 预约确认。
13. `#home-anchor-layer-lab`：L2 锚点与智能图层实验室。
14. `#home-anchor-action`：L3 锚点快捷卡。
15. `#home-map-share`：L3 地图分享卡。
16. `#home-fog-unlock`：L4 迷雾解锁与修建锚点。
17. `#ai-search`：L2 AI 语义搜索。
18. `#home-map-component-board`：组件板，集中沉淀 marker variants、图层开关、卡片封面规则和状态样式。

## 新增当前 UI 状态

- 首页：新增地图卡片浮层、低面板大地图、内容详情滚动态、活动详情首屏、活动报名详情。
- 服务：新增 `#service-detail-current`，还原截图中的绿色服务主页、评分、完成量、兴趣/偏好 chips 和立即预约底栏。
- 我的：新增 `#my-footprint-map-current` 和 `#my-favorites-current`，分别还原足迹地图卡片分布和收藏瀑布流。

## 全局拓扑

- 首页：18 个画板，覆盖默认态、地图展开态、低面板、搜索、详情、活动、地点、轨迹、预约、锚点、分享、迷雾、AI 和组件。
- 服务：9 个画板，覆盖服务流、类型矩阵、服务详情、当前绿色服务详情、频道会员、共建审核、预约、支付和成功。
- 发布：11 个画板，覆盖内容类型、编辑器、AI 模板、轨迹编辑、地图共创、创作者中心、话题/位置、预览和成功。
- 沙盒：3 个画板，覆盖草稿、定时发布和测试分享。
- 原创 IP：4 个画板，覆盖 IP 编辑、选择、授权和发布成功。
- 消息：9 个画板，覆盖消息中心、地图频道、频道详情、线程卡、权限、搜索、聊天、通知和联系人。
- 我的：12 个画板，覆盖个人主页、服务管理、足迹地图、当前足迹地图、收藏、当前收藏瀑布流、日程、热力、时间轴、设置、隐私和资料编辑。
- 商业化与组件：商业化中心、设计 tokens 组件板。

## 卡片封面规则

普通内容卡片封面遵守“用户上传图片优先”：优先使用用户上传图片或真实视频封面。只有无封面内容才使用“暂无封面 / 文章 / 活动”等轻量占位。地点、轨迹、服务卡可以使用地图、路线或结构化图形表达；普通内容卡不默认使用地图图块做封面。地图定位只由点击定位、marker、地点模块等明确行为触发。

## 验收

- `.design` 可解析，且 `data[*].devMetadata.htmlSrc` 中的 68 个锚点都能在 HTML 中找到。
- HTML 预览中有 6 个业务分组标题、68 个画板、68 条画板说明。
- 首页主链路排在最前，新增当前 UI 状态画板紧跟首页默认态。
- README、设计说明、`.design` 元数据均为 UTF-8 文本。

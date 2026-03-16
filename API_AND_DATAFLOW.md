# MapQ Admin UI 数据流与接口文档

## 目录
- [系统架构](#系统架构)
- [数据模型](#数据模型)
- [接口总览](#接口总览)
- [用户管理模块](#用户管理模块)
- [地点内容管理模块](#地点内容管理模块)
- [生活服务管理模块](#生活服务管理模块)
- [社区动态管理模块](#社区动态管理模块)
- [即时通讯管理模块](#即时通讯管理模块)
- [仪表盘模块](#仪表盘模块)

- [数据流图](#数据流图)

---

## 系统架构

### 技术栈
- **前端框架**: React 18.3.1 + TypeScript
- **构建工具**: Vite 6.3.5
- **UI 组件库**: Ant Design 6.1.4
- **数据可视化**: Recharts 2.15.2
- **状态管理**: React Hooks (useState)
- **包管理器**: pnpm

### 页面结构
```
/src/app/
├── App.tsx                      # 主应用布局
├── components/
│   ├── Dashboard.tsx           # 仪表盘
│   ├── UserManagement.tsx      # 用户管理
│   ├── MapPointsManagement.tsx # 地点内容管理
│   ├── ServiceManagement.tsx   # 生活服务管理
│   ├── FeedManagement.tsx      # 社区动态管理
│   └── SystemSettings.tsx       # 系统设置
```

---

## 数据模型

### 核心数据结构

#### 1. 用户相关 (User Module)

```typescript
// 用户基础信息
interface User {
  _id: string;
  uid: string;                    // 用户唯一标识
  username: string;                // 昵称
  avatarUrl: string;               // 头像URL
  description: string;             // 个人简介
  phone: string | null;            // 手机号
  email: string | null;            // 邮箱
  roles: ('user' | 'provider' | 'admin')[];
  status: 'active' | 'banned' | 'deleted';
  verified: boolean;              // 是否已认证
  verifyLevel: 'none' | 'realname' | 'provider';
  metrics: UserMetrics;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
}

// 用户指标
interface UserMetrics {
  followsCount: number;            // 关注数
  fansCount: number;               // 粉丝数
  postsCount: number;              // 动态数
  likesReceivedCount: number;      // 获赞数
  favoritesCount: number;          // 收藏数
  servicesCount: number;           // 服务数
  lastComputedAt: string;
}

// 用户资料
interface UserProfile {
  avatarUrl: string;
  username: string;
  description: string;
  region: string;
  gender?: 'male' | 'female' | 'other';
  birthday?: string;
  tags: string[];
  socialLinks: {
    wechat?: string;
    weibo?: string;
    douyin?: string;
  };
}

// 用户状态（风控）
interface UserStatus {
  riskLevel: 'low' | 'medium' | 'high';
  violationsCount: number;
  lastViolationAt?: string;
  sensitiveFlags: string[];
  notes: string;
}

// 登录日志
interface UserLoginLog {
  _id: string;
  userId: string;
  loginAt: string;
  ip: string;
  ipLocation: string;
  device: 'iOS' | 'Android' | 'Web';
  appVersion: string;
  success: boolean;
  reason?: string;
}

// 认证记录
interface UserVerification {
  _id: string;
  type: 'realname' | 'provider';
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewerId?: string;
  materials: any;
  comments?: string;
}
```

#### 2. 地点内容 (Content Module)

```typescript
// UGC 地点内容（用户发布）
interface MapPoint {
  _id: string;
  title: string;
  description: string;
  images: string[];
  video?: string;
  authorId: string;
  author: {
    uid: string;
    nickname: string;
    avatarUrl: string;
  };
  // 对应前端 favoriteData 的分类: photos, videos, articles, music
  contentType: 'photo' | 'video' | 'article' | 'music' | 'location'; 
  category: string;                // hot | exhibition | personal | scenery
  tags: string[];
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat] - GeoJSON格式
  };
  address: string;

  adcode?: string;                  // 行政区划代码
  likes: number;
  views: number;
  collects: number;
  commentsCount: number;
  status: 'pending' | 'active' | 'rejected' | 'hidden';
  auditLogId?: string;
  createdAt: string;
  updatedAt: string;
}

// PGC 服务地点（服务商发布）
interface ServicePoint extends Omit<MapPoint, 'author'> {
  providerId: string;
  provider: {
    uid: string;
    nickname: string;
    avatarUrl: string;
  };
  serviceType: string;             // cleaning | repair | move | education | medical
  price: {
    min: number;
    unit: string;
  };
  contact: string;
  businessHours: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
}

// 审核记录
interface ContentAudit {
  _id: string;
  targetId: string;
  targetType: 'content' | 'service';
  submitterId: string;
  auditorId?: string;
  auditor?: {
    uid: string;
    nickname: string;
  };
  status: 'approved' | 'rejected';
  reason?: string;
  createdAt: string;
  reviewedAt?: string;
}
```

#### 3. 生活服务 (Service Module)

```typescript
// 服务商完整信息
interface ServicePoint {
  _id: string;
  type: 'service';
  name: string;
  description: string;
  coverImage: string;
  images: string[];
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  address: string;
  cityCode: string;
  providerId: string;
  provider: {
    uid: string;
    nickname: string;
    avatarUrl: string;
  };
  businessStatus: 'open' | 'rest' | 'closed';
  completedCount: number;
  interests: string[];              // 兴趣标签
  preferences: string[];             // 偏好标签
  services: ServiceItem[];          // 服务项目列表
  rating: {
    value: number;
    count: number;
    distribution: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
    };
  };
  isVerified: boolean;
  auditStatus: 'pending' | 'active' | 'rejected';
  createdAt: string;
  updatedAt: string;
  stats: {
    views: number;
    bookings: number;
    favorites: number;
  };
}

// 服务项目
interface ServiceItem {
  id: string;
  title: string;
  price: number;
  unit: string;                    // 元/小时 | 元/次
  duration: string;
  image: string;
  description: string;
}

// 服务审核
interface ServiceAudit {
  _id: string;
  targetId: string;
  targetType: 'service';
  submitterId: string;
  submitter: {
    uid: string;
    nickname: string;
  };
  auditorId?: string;
  auditor?: {
    uid: string;
    nickname: string;
  };
  status: 'approved' | 'rejected';
  reason?: string;
  materials?: {
    businessName: string;
    licenseNumber: string;
    licenseImages: string[];
    category: string;
    contactPhone: string;
  };
  createdAt: string;
  reviewedAt?: string;
}
```

#### 4. 社区动态 (Feed Module)

```typescript
// 动态/帖子
interface Post {
  _id: string;
  authorId: string;
  author: {
    uid: string;
    nickname: string;
    avatarUrl: string;
  };
  type: 'post' | 'video' | 'activity';
  title?: string;
  content: string;
  images: string[];
  tags: string[];
  relatedPointId?: string;         // 关联的地图地点
  stats: {
    views: number;
    likes: number;
    collects: number;
    comments: number;
  };
  status: 'active' | 'hidden' | 'deleted';
  createdAt: string;
  updatedAt: string;
}

// 评论
interface Comment {
  _id: string;
  targetType: 'post' | 'service';
  targetId: string;
  authorId: string;
  author: {
    uid: string;
    nickname: string;
    avatarUrl: string;
  };
  content: string;
  images?: string[];
  parentId?: string;                // 父评论ID
  replyToId?: string;               // 回复的具体用户
  replyToUser?: {
    uid: string;
    nickname: string;
  };
  likeCount: number;
  createdAt: string;
  replies?: Comment[];              // 子评论
}

// 消息通知
interface Notification {
  _id: string;
  recipientId: string;
  senderId?: string;
  sender?: {
    uid: string;
    nickname: string;
    avatarUrl: string;
  };
  type: string;                    // 'system' | 'like_post' | 'like_comment' | 'comment_post' | 'reply_comment' | 'follow'
  content: string;
  targetId?: string;
  isRead: boolean;
  createdAt: string;
}

// 群组 (IM)
interface ChatGroup {
  _id: string;
  name: string;
  ownerId: string;
  avatar?: string;
  announcement?: string;
  membersCount: number;
  status: 'active' | 'banned' | 'dissolved';
  createdAt: string;
}

// 频道 (IM)
interface ChatChannel {
  _id: string;
  name: string;
  type: 'public' | 'private';
  description?: string;
  subscribersCount: number;
  status: 'active' | 'banned';
  createdAt: string;
}
```

---

## 接口总览

### 基础配置
```typescript
const API_BASE_URL = '/api/v1';
const API_HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
};
```

### 接口分类统计
| 模块 | 接口数量 | 说明 |
|------|---------|------|
| 用户管理 | 15 | 用户CRUD、认证、封禁、角色管理 |
| 地点内容管理 | 12 | UGC/PGC内容、审核、地理位置查询 |
| 生活服务管理 | 10 | 服务商、服务项目、评价管理 |
| 社区动态管理 | 14 | 动态、评论、通知管理 |
| 即时通讯管理 | 8 | 群组、频道、违规消息管理 |
| 仪表盘 | 8 | 统计数据、系统状态 |
| **总计** | **67** | - |

---

## 用户管理模块

### 页面: `/src/app/components/UserManagement.tsx`

#### 数据流
```
用户列表
  ├─ 点击"详情" → 打开抽屉 → 加载用户完整信息
  ├─ 点击"封禁" → 打开封禁弹窗 → 提交封禁请求
  ├─ 点击"解封" → 打开解封弹窗 → 提交解封请求
  └─ 点击"角色" → 打开角色弹窗 → 更新用户角色
```

#### 接口列表

##### 1. 获取用户列表
```typescript
GET /api/v1/users?page=1&pageSize=20&status=active&role=user&keyword=xxx
```

**请求参数**:
```typescript
{
  page: number;
  pageSize: number;
  status?: 'active' | 'banned' | 'deleted';
  role?: 'user' | 'provider' | 'admin';
  verifyLevel?: 'none' | 'realname' | 'provider';
  keyword?: string;  // 搜索 UID/昵称/手机号/邮箱
  startTime?: string;
  endTime?: string;
}
```

**响应数据**:
```typescript
{
  code: 200;
  message: 'success';
  data: {
    list: User[];
    total: number;
    page: number;
    pageSize: number;
  };
}
```

##### 2. 获取用户详情
```typescript
GET /api/v1/users/:userId
```

**响应数据**:
```typescript
{
  code: 200;
  data: {
    user: User;
    profile: UserProfile;
    status: UserStatus;
    binding: UserBinding;
  };
}
```

##### 3. 封禁用户
```typescript
POST /api/v1/users/:userId/ban
```

**请求体**:
```typescript
{
  duration: number;      // 3 | 7 | 30 | 0 (永久)
  reason: string;        // 'spam' | 'abuse' | 'nsfw' | 'fraud' | 'harassment' | 'other'
  remark?: string;       // 备注
  notify: boolean;        // 是否通知用户
}
```

##### 4. 解封用户
```typescript
POST /api/v1/users/:userId/unban
```

##### 5. 更新用户角色
```typescript
PUT /api/v1/users/:userId/roles
```

**请求体**:
```typescript
{
  roles: ('user' | 'provider' | 'admin')[];
}
```

##### 6. 获取用户登录日志
```typescript
GET /api/v1/users/:userId/login-logs?page=1&pageSize=10
```

##### 7. 获取用户认证记录
```typescript
GET /api/v1/users/:userId/verifications
```

##### 8. 审核用户认证
```typescript
POST /api/v1/users/:userId/verifications/:verificationId/review
```

**请求体**:
```typescript
{
  status: 'approved' | 'rejected';
  comments?: string;
}
```

##### 9. 导出用户数据
```typescript
GET /api/v1/users/export?status=active&startTime=xxx&endTime=xxx
```

**响应**: CSV 文件流

##### 10. 获取用户统计数据
```typescript
GET /api/v1/users/:userId/metrics
```

##### 11. 更新用户资料
```typescript
PUT /api/v1/users/:userId/profile
```

##### 12. 获取用户绑定的第三方账号
```typescript
GET /api/v1/users/:userId/bindings
```

##### 13. 更新用户风控状态
```typescript
PUT /api/v1/users/:userId/status
```

**请求体**:
```typescript
{
  riskLevel: 'low' | 'medium' | 'high';
  violationsCount: number;
  sensitiveFlags: string[];
  notes: string;
}
```

##### 14. 搜索用户
```typescript
GET /api/v1/users/search?q=xxx&limit=20
```

##### 15. 批量操作用户
```typescript
POST /api/v1/users/batch
```

**请求体**:
```typescript
{
  action: 'ban' | 'unban' | 'updateRole';
  userIds: string[];
  params?: {
    duration?: number;
    reason?: string;
    roles?: string[];
  };
}
```

---

## 地点内容管理模块

### 页面: `/src/app/components/MapPointsManagement.tsx`

#### 数据流
```
内容列表
  ├─ UGC内容 ← 用户发布 → 待审核 → 通过/驳回 → 已发布/已驳回
  ├─ PGC服务 ← 服务商发布 → 待审核 → 通过/驳回 → 已发布/已驳回
  ├─ 点击"通过" → 审核通过 → 状态变为active
  ├─ 点击"驳回" → 填写驳回原因 → 状态变为rejected
  ├─ 点击"详情" → 打开抽屉 → 查看完整信息
  ├─ 点击"编辑" → 打开编辑弹窗 → 更新内容
  └─ 批量操作 → 批量通过/批量删除
```

#### 接口列表

##### 1. 获取UGC地点列表
```typescript
GET /api/v1/content/mappoints?page=1&pageSize=20&category=hot&status=pending
```

**请求参数**:
```typescript
{
  page: number;
  pageSize: number;
  category?: string;     // hot | exhibition | personal | scenery
  status?: 'pending' | 'active' | 'rejected' | 'hidden';
  region?: string;       // 行政区划代码
  keyword?: string;     // 搜索标题/描述
}
```

##### 2. 获取PGC服务地点列表
```typescript
GET /api/v1/content/servicepoints?page=1&pageSize=20&serviceType=cleaning&status=pending
```

**请求参数**:
```typescript
{
  page: number;
  pageSize: number;
  serviceType?: string;  // cleaning | repair | move | education | medical
  status?: 'pending' | 'active' | 'rejected' | 'hidden';
  region?: string;
  keyword?: string;
}
```

##### 3. 获取内容详情
```typescript
GET /api/v1/content/:contentId
```

##### 4. 审核内容
```typescript
POST /api/v1/content/:contentId/audit
```

**请求体**:
```typescript
{
  action: 'approve' | 'reject';
  reason?: string;        // 驳回原因
  notify: boolean;        // 是否通知发布者
}
```

##### 5. 编辑内容
```typescript
PUT /api/v1/content/:contentId
```

**请求体**:
```typescript
{
  title?: string;
  description?: string;
  address?: string;
  category?: string;
  tags?: string[];
  images?: string[];
  status?: 'active' | 'hidden';
}
```

##### 6. 删除内容
```typescript
DELETE /api/v1/content/:contentId
```

##### 7. 批量审核内容
```typescript
POST /api/v1/content/batch-audit
```

**请求体**:
```typescript
{
  contentIds: string[];
  action: 'approve' | 'reject';
  reason?: string;
}
```

##### 8. 批量删除内容
```typescript
POST /api/v1/content/batch-delete
```

**请求体**:
```typescript
{
  contentIds: string[];
}
```

##### 9. 获取内容审核记录
```typescript
GET /api/v1/content/:contentId/audits
```

##### 10. 地理位置查询（LBS）
```typescript
GET /api/v1/content/nearby?lng=104.065&lat=30.673&radius=1000&type=content
```

**请求参数**:
```typescript
{
  lng: number;            // 经度
  lat: number;            // 纬度
  radius: number;         // 半径（米）
  type: 'content' | 'service';
  category?: string;
}
```

##### 11. 导出内容数据
```typescript
GET /api/v1/content/export?type=content&status=active
```

##### 12. 更新内容坐标
```typescript
PUT /api/v1/content/:contentId/location
```

**请求体**:
```typescript
{
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  address: string;
}
```

---

## 生活服务管理模块

### 页面: `/src/app/components/ServiceManagement.tsx`

#### 数据流
```
服务商审核
  └─ 服务商申请 → 待审核 → 通过/驳回 → 已上线/已驳回

已上线服务
  ├─ 点击"详情" → 查看服务详情、评价统计
  ├─ 点击"管理服务" → 添加/编辑/删除服务项目
  └─ 营业状态管理 → 营业中/休息中/已停业
```

#### 接口列表

##### 1. 获取待审核服务商列表
```typescript
GET /api/v1/services/pending?page=1&pageSize=10&category=cleaning
```

##### 2. 获取已上线服务列表
```typescript
GET /api/v1/services/active?page=1&pageSize=10&status=open&category=repair
```

##### 3. 获取服务详情
```typescript
GET /api/v1/services/:serviceId
```

**响应数据**:
```typescript
{
  code: 200;
  data: {
    service: ServicePoint;
    audits: ServiceAudit[];
  };
}
```

##### 4. 审核服务商申请
```typescript
POST /api/v1/services/:serviceId/audit
```

**请求体**:
```typescript
{
  status: 'approved' | 'rejected';
  reason?: string;        // 驳回原因
  remark?: string;        // 详细说明
  notify: boolean;        // 是否通知
}
```

##### 5. 获取服务商评价统计
```typescript
GET /api/v1/services/:serviceId/reviews/stats
```

##### 6. 获取服务项目列表
```typescript
GET /api/v1/services/:serviceId/services
```

##### 7. 添加服务项目
```typescript
POST /api/v1/services/:serviceId/services
```

**请求体**:
```typescript
{
  title: string;
  price: number;
  unit: string;
  duration: string;
  image: string;
  description: string;
}
```

##### 8. 更新服务项目
```typescript
PUT /api/v1/services/:serviceId/services/:itemId
```

##### 9. 删除服务项目
```typescript
DELETE /api/v1/services/:serviceId/services/:itemId
```

##### 10. 更新营业状态
```typescript
PUT /api/v1/services/:serviceId/business-status
```

**请求体**:
```typescript
{
  businessStatus: 'open' | 'rest' | 'closed';
}
```

---

## 社区动态管理模块

### 页面: `/src/app/components/FeedManagement.tsx`

#### 数据流
```
动态列表
  ├─ 用户发布动态 → 自动审核 → 通过/隐藏
  ├─ 敏感词过滤 → 检测垃圾广告/敏感词 → 高亮显示
  └─ 隐藏/删除动态

评论管理
  ├─ 用户评论动态/服务 → 敏感词检测
  ├─ 删除违规评论
  └─ 封禁发布者

消息通知
  ├─ 系统通知、点赞、评论、关注事件
  ├─ 标记已读/未读
  └─ 删除通知
```

#### 接口列表

##### 1. 获取动态列表
```typescript
GET /api/v1/feed/posts?page=1&pageSize=20&type=post&status=active
```

**请求参数**:
```typescript
{
  page: number;
  pageSize: number;
  type?: 'post' | 'video' | 'activity';
  status?: 'active' | 'hidden' | 'deleted';
  keyword?: string;
}
```

##### 2. 获取动态详情
```typescript
GET /api/v1/feed/posts/:postId
```

##### 3. 隐藏动态
```typescript
POST /api/v1/feed/posts/:postId/hide
```

##### 4. 删除动态
```typescript
DELETE /api/v1/feed/posts/:postId
```

##### 5. 恢复动态
```typescript
POST /api/v1/feed/posts/:postId/restore
```

##### 6. 获取评论列表
```typescript
GET /api/v1/feed/comments?page=1&pageSize=20&targetType=post&keyword=xxx
```

**请求参数**:
```typescript
{
  page: number;
  pageSize: number;
  targetType?: 'post' | 'service';
  keyword?: string;
}
```

##### 7. 删除评论
```typescript
DELETE /api/v1/feed/comments/:commentId
```

##### 8. 获取子评论列表
```typescript
GET /api/v1/feed/comments/:commentId/replies
```

##### 9. 封禁评论发布者
```typescript
POST /api/v1/feed/comments/:commentId/ban-author
```

**请求体**:
```typescript
{
  duration: number;
  reason: string;
  notify: boolean;
}
```

##### 10. 获取消息通知列表
```typescript
GET /api/v1/feed/notifications?page=1&pageSize=20&type=system
```

**请求参数**:
```typescript
{
  page: number;
  pageSize: number;
  type?: 'system' | 'like_post' | 'like_comment' | 'comment_post' | 'reply_comment' | 'follow';
  isRead?: boolean;
}
```

##### 11. 标记通知为已读
```typescript
POST /api/v1/feed/notifications/:notificationId/read
```

##### 12. 批量标记通知为已读
```typescript
POST /api/v1/feed/notifications/batch-read
```

**请求体**:
```typescript
{
  notificationIds: string[];
}
```

##### 13. 删除通知
```typescript
DELETE /api/v1/feed/notifications/:notificationId
```

##### 14. 获取敏感词设置
```typescript
GET /api/v1/feed/settings/sensitive-words
```

##### 15. 更新敏感词设置
```typescript
PUT /api/v1/feed/settings/sensitive-words
```

**请求体**:
```typescript
{
  words: string[];          // 敏感词列表
  filterStrategy: 'replace' | 'block' | 'warn';
}

---

## 即时通讯管理模块

### 页面: `/src/app/components/IMManagement.tsx`

#### 数据流
```
群组管理
  ├─ 查看群组列表 → 搜索群组
  ├─ 封禁群组 → 违规群组处理
  └─ 解散群组

频道管理
  ├─ 查看频道列表
  └─ 频道审核/封禁

消息审计
  └─ 违规消息记录 → 关键词触发 → 人工复核 → 撤回/封号
```

#### 接口列表

##### 1. 获取群组列表
```typescript
GET /api/v1/im/groups?page=1&pageSize=20&status=active
```

##### 2. 获取群组详情
```typescript
GET /api/v1/im/groups/:groupId
```

##### 3. 封禁/解散群组
```typescript
POST /api/v1/im/groups/:groupId/status
```

**请求体**:
```typescript
{
  status: 'banned' | 'dissolved';
  reason: string;
}
```

##### 4. 获取频道列表
```typescript
GET /api/v1/im/channels?page=1&pageSize=20
```

##### 5. 封禁频道
```typescript
POST /api/v1/im/channels/:channelId/ban
```

##### 6. 获取消息审计记录
```typescript
GET /api/v1/im/audit-logs?page=1&pageSize=20&riskLevel=high
```

##### 7. 撤回违规消息
```typescript
POST /api/v1/im/messages/:messageId/recall
```

##### 8. 发送系统广播消息
```typescript
POST /api/v1/im/broadcast
```

**请求体**:
```typescript
{
  target: 'all' | 'user' | 'group';
  targetIds?: string[];
  content: string;
  type: 'text' | 'image' | 'link';
}
```

---

## 仪表盘模块

### 页面: `/src/app/components/Dashboard.tsx`

#### 数据流
```
仪表盘
  ├─ 核心数据统计（实时）
  ├─ 功能模块统计（各模块数据汇总）
  ├─ 图表数据展示（趋势/分布）
  ├─ 待审核任务列表
  ├─ 最近动态时间线
  ├─ 系统健康状态
  └─ 快捷操作入口
```

#### 接口列表

##### 1. 获取核心统计数据
```typescript
GET /api/v1/dashboard/stats/overview
```

**响应数据**:
```typescript
{
  code: 200;
  data: {
    totalUsers: number;
    activeUsers: number;
    totalPoints: number;
    totalServices: number;
    totalPosts: number;
    todayComments: number;
    pendingAudits: number;
    bannedCount: number;
  };
}
```

##### 2. 获取用户增长趋势
```typescript
GET /api/v1/dashboard/stats/users-trend?range=week
```

**请求参数**:
```typescript
{
  range: 'week' | 'month';
}
```

**响应数据**:
```typescript
{
  code: 200;
  data: [
    { date: '周一', users: 8420, newUsers: 320 },
    { date: '周二', users: 8750, newUsers: 380 },
    ...
  ];
}
```

##### 3. 获取内容分类分布
```typescript
GET /api/v1/dashboard/stats/content-distribution
```

**响应数据**:
```typescript
{
  code: 200;
  data: [
    { name: '美食', value: 1580, color: '#ff6b6b' },
    { name: '景点', value: 1240, color: '#4ecdc4' },
    ...
  ];
}
```

##### 4. 获取社区动态类型分布
```typescript
GET /api/v1/dashboard/stats/feed-distribution
```

##### 5. 获取服务类型分布
```typescript
GET /api/v1/dashboard/stats/service-distribution
```

##### 6. 获取待审核任务列表
```typescript
GET /api/v1/dashboard/pending-tasks?limit=10
```

**响应数据**:
```typescript
{
  code: 200;
  data: [
    {
      id: string;
      type: 'service' | 'post' | 'point' | 'report';
      title: string;
      status: string;
      time: string;
    },
    ...
  ];
}
```

##### 7. 获取最近动态
```typescript
GET /api/v1/dashboard/recent-activities?limit=10
```

**响应数据**:
```typescript
{
  code: 200;
  data: [
    {
      id: string;
      type: 'user' | 'post' | 'comment' | 'service' | 'warning';
      title: string;
      desc: string;
      time: string;
    },
    ...
  ];
}
```

##### 8. 获取系统健康状态
```typescript
GET /api/v1/dashboard/system-health
```

**响应数据**:
```typescript
{
  code: 200;
  data: [
    { name: '用户认证', status: 'normal', value: 99.8 },
    { name: '内容审核', status: 'warning', value: 85.2 },
    { name: '通知推送', status: 'normal', value: 98.5 },
    { name: '数据同步', status: 'normal', value: 97.3 },
  ];
}
```

---

## 数据流图

### 整体数据流

```
┌─────────────────────────────────────────────────────────────┐
│                        前端 (React)                         │
├─────────────────────────────────────────────────────────────┤
│  Dashboard  │  UserMgmt  │  ContentMgmt  │  ServiceMgmt  │  FeedMgmt
│       │           │             │               │              │
│       └───────────┴─────────────┴───────────────┘────────────┘
│                          │
│                          ▼
├─────────────────────────────────────────────────────────────┤
│                    API Gateway                              │
│         /api/v1/users | /api/v1/content | /api/v1/services  │
│                  /api/v1/feed | /api/v1/dashboard            │
│                          │
│                          ▼
├─────────────────────────────────────────────────────────────┤
│                   Backend Services                          │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌──────────┐     │
│  │User SVC │  │Content   │  │Service  │  │  Feed    │     │
│  │         │  │  SVC     │  │   SVC   │  │   SVC    │     │
│  └─────────┘  └──────────┘  └─────────┘  └──────────┘     │
│       │             │             │             │          │
│       └─────────────┴─────────────┴─────────────┘          │
│                          │                                    │
└──────────────────────────┼───────────────────────────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │  MongoDB       │
                  │  - users       │
                  │  - mappoints   │
                  │  - servicepts  │
                  │  - posts       │
                  │  - comments    │
                  │  - notifications│
                  │  - audits      │
                  └─────────────────┘
```

### 用户管理数据流

```
用户列表
  ├─ GET /api/v1/users → 查询用户数据
  ├─ 点击详情
  │   └─ GET /api/v1/users/:userId
  │       ├─ 加载用户基本信息
  │       ├─ GET /api/v1/users/:userId/login-logs → 加载登录日志
  │       ├─ GET /api/v1/users/:userId/verifications → 加载认证记录
  │       └─ GET /api/v1/users/:userId/metrics → 加载数据指标
  ├─ 封禁用户
  │   └─ POST /api/v1/users/:userId/ban
  │       ├─ 更新用户状态为banned
  │       └─ 发送系统通知（如果notify=true）
  ├─ 解封用户
  │   └─ POST /api/v1/users/:userId/unban
  │       └─ 更新用户状态为active
  └─ 更新角色
      └─ PUT /api/v1/users/:userId/roles
          └─ 更新用户roles数组
```

### 地点内容管理数据流

```
内容列表
  ├─ UGC内容
  │   ├─ GET /api/v1/content/mappoints → 获取用户发布内容
  │   ├─ 点击通过
  │   │   └─ POST /api/v1/content/:contentId/audit
  │   │       ├─ action: 'approve'
  │   │       ├─ status → 'active'
  │   │       └─ 发送通知给发布者
  │   ├─ 点击驳回
  │   │   └─ POST /api/v1/content/:contentId/audit
  │   │       ├─ action: 'reject'
  │   │       ├─ status → 'rejected'
  │   │       ├─ reason: 驳回原因
  │   │       └─ 发送通知给发布者
  │   └─ 点击编辑
  │       └─ PUT /api/v1/content/:contentId
  └─ PGC服务
      ├─ GET /api/v1/content/servicepoints → 获取服务商发布内容
      ├─ 审核流程同UGC
      └─ 批量操作
          ├─ POST /api/v1/content/batch-audit → 批量审核
          └─ POST /api/v1/content/batch-delete → 批量删除
```

### 生活服务管理数据流

```
服务商审核
  ├─ GET /api/v1/services/pending → 获取待审核服务商
  ├─ 点击通过
  │   └─ POST /api/v1/services/:serviceId/audit
  │       ├─ status: 'approved'
  │       ├─ auditStatus → 'active'
  │       ├─ isVerified → true
  │       └─ 发送通知给服务商
  ├─ 点击驳回
  │   └─ POST /api/v1/services/:serviceId/audit
  │       ├─ status: 'rejected'
  │       ├─ auditStatus → 'rejected'
  │       └─ reason: 驳回原因
  └─ 点击详情
      └─ GET /api/v1/services/:serviceId
          ├─ 加载服务基本信息
          ├─ 加载服务项目列表
          └─ 加载评价统计

已上线服务
  ├─ 管理服务项目
  │   ├─ GET /api/v1/services/:serviceId/services → 获取服务项目
  │   ├─ POST /api/v1/services/:serviceId/services → 添加服务项目
  │   ├─ PUT /api/v1/services/:serviceId/services/:itemId → 更新服务项目
  │   └─ DELETE /api/v1/services/:serviceId/services/:itemId → 删除服务项目
  └─ 更新营业状态
      └─ PUT /api/v1/services/:serviceId/business-status
```

### 社区动态管理数据流

```
动态管理
  ├─ GET /api/v1/feed/posts → 获取动态列表
  ├─ 敏感词检测
  │   ├─ 客户端高亮显示敏感词
  │   └─ GET /api/v1/feed/settings/sensitive-words → 获取敏感词配置
  ├─ 隐藏动态
  │   └─ POST /api/v1/feed/posts/:postId/hide
  │       └─ status → 'hidden'
  ├─ 删除动态
  │   └─ DELETE /api/v1/feed/posts/:postId
  │       └─ status → 'deleted'
  └─ 恢复动态
      └─ POST /api/v1/feed/posts/:postId/restore
          └─ status → 'active'

评论管理
  ├─ GET /api/v1/feed/comments → 获取评论列表
  ├─ 敏感词检测
  │   └─ 同动态管理
  ├─ 删除评论
  │   └─ DELETE /api/v1/feed/comments/:commentId
  └─ 封禁发布者
      └─ POST /api/v1/feed/comments/:commentId/ban-author
          ├─ 更新用户状态
          └─ 发送通知

消息通知
  ├─ GET /api/v1/feed/notifications → 获取通知列表
  ├─ 标记已读
  │   ├─ POST /api/v1/feed/notifications/:notificationId/read → 单个已读
  │   └─ POST /api/v1/feed/notifications/batch-read → 批量已读
  └─ 删除通知
      └─ DELETE /api/v1/feed/notifications/:notificationId
```

### 仪表盘数据流

```
仪表盘
  ├─ 核心数据统计
  │   └─ GET /api/v1/dashboard/stats/overview
  │       ├─ 总用户数
  │       ├─ 日活跃用户
  │       ├─ 地点/服务数量
  │       ├─ 社区动态数量
  │       ├─ 今日评论数
  │       ├─ 待审核任务
  │       └─ 违规处理数
  ├─ 图表数据
  │   ├─ GET /api/v1/dashboard/stats/users-trend → 用户增长趋势
  │   ├─ GET /api/v1/dashboard/stats/content-distribution → 内容分类占比
  │   ├─ GET /api/v1/dashboard/stats/feed-distribution → 动态类型分布
  │   └─ GET /api/v1/dashboard/stats/service-distribution → 服务类型分布
  ├─ 待审核任务
  │   └─ GET /api/v1/dashboard/pending-tasks
  │       ├─ 服务商审核
  │       ├─ 动态审核
  │       ├─ 地点审核
  │       └─ 举报处理
  ├─ 最近动态
  │   └─ GET /api/v1/dashboard/recent-activities
  │       ├─ 用户注册
  │       ├─ 发布动态
  │       ├─ 新增评论
  │       ├─ 审核通过
  │       └─ 违规处理
  └─ 系统健康状态
      └─ GET /api/v1/dashboard/system-health
          ├─ 用户认证状态
          ├─ 内容审核状态
          ├─ 通知推送状态
          └─ 数据同步状态
```

---

## 错误处理

### 标准错误响应
```typescript
{
  code: number;           // 400 | 401 | 403 | 404 | 500
  message: string;         // 错误信息
  error?: string;          // 详细错误信息（开发环境）
  requestId?: string;      // 请求ID（用于追踪）
}
```

### 常见错误码
| 错误码 | 说明 |
|-------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权（token无效或过期） |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 409 | 资源冲突（如重复提交） |
| 422 | 数据验证失败 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

---

## 分页与筛选

### 通用分页参数
```typescript
{
  page: number;            // 当前页码，从1开始
  pageSize: number;        // 每页数量
}
```

### 通用分页响应
```typescript
{
  list: T[];               // 数据列表
  total: number;           // 总记录数
  page: number;            // 当前页
  pageSize: number;        // 每页数量
  totalPages: number;      // 总页数
}
```

---

## 认证与授权

### Token认证
```typescript
// 请求头
headers: {
  'Authorization': `Bearer ${token}`
}
```

### 权限级别
| 角色 | 权限说明 |
|------|---------|
| user | 普通用户权限 |
| provider | 服务商权限（包含user权限） |
| admin | 管理员权限（包含所有权限） |

---

## WebSocket接口（实时通知）

### 连接
```
wss://api.example.com/ws
```

### 认证
```typescript
{
  type: 'auth';
  token: string;
}
```

### 订阅通知
```typescript
{
  type: 'subscribe';
  channels: ['notifications', 'audit_updates'];
}
```

### 接收通知
```typescript
{
  type: 'notification';
  data: {
    id: string;
    type: string;
    content: string;
    createdAt: string;
  };
}
```

---

## 附录

### 数据库索引建议

```javascript
// Users
db.users.createIndex({ uid: 1 }, { unique: true });
db.users.createIndex({ status: 1, createdAt: -1 });
db.users.createIndex({ 'roles': 1 });

// MapPoints / ServicePoints
db.mappoints.createIndex({ 'location': '2dsphere' });
db.mappoints.createIndex({ status: 1, createdAt: -1 });
db.mappoints.createIndex({ category: 1, status: 1 });

// Posts
db.posts.createIndex({ authorId: 1, createdAt: -1 });
db.posts.createIndex({ status: 1, type: 1 });

// Comments
db.comments.createIndex({ targetType: 1, targetId: 1 });
db.comments.createIndex({ authorId: 1 });

// Notifications
db.notifications.createIndex({ recipientId: 1, isRead: 1 });
```

### 敏感词管理
```typescript
// 默认敏感词列表
const DEFAULT_SENSITIVE_WORDS = [
  '垃圾', '广告', 'spam', '诈骗', '黄赌毒',
  // 可扩展更多敏感词
];
```

---

## 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2026-01-07 | 初始版本 |

---

## 联系方式

如有问题，请联系开发团队。

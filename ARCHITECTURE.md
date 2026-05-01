# Yappi 微信小程序重构架构文档

## 1. 项目概述

Yappi 是一款面向 3-12 岁儿童的正向激励习惯养成应用。家长管理孩子档案、任务和奖励；孩子完成每日任务获得星星，用星星兑换奖励。

**重构目标**：将现有 H5 单文件应用迁移为微信原生小程序，最大化复用业务逻辑，保证用户体验一致性。

---

## 2. 现有 H5 架构

```
index.html (单文件 ~1000 行)
├── CSS 样式层 (238 行)
├── HTML 结构层 (5 个 screen + 5 个 modal)
└── JavaScript 逻辑层
    ├── 常量与状态 (全局变量)
    ├── 认证模块 (PIN 登录/注册)
    ├── 向导模块 (首次设置)
    ├── 数据加载 (Supabase 查询)
    ├── 渲染层 (DOM 操作)
    ├── 业务逻辑 (任务完成、奖励兑换、星星调整)
    └── CRUD 操作 (孩子/任务/奖励管理)
```

**技术栈**：Vanilla JS + Supabase JS SDK v2 + Vercel 静态托管

---

## 3. 目标小程序架构

### 3.1 技术选型

| 层次 | 技术 |
|------|------|
| 框架 | 微信原生小程序 |
| 后端 | Supabase (PostgreSQL + REST API，不变) |
| 认证 | 微信登录 (wx.login) + Supabase openid 绑定 |
| 微信登录中间层 | Supabase Edge Function |
| 存储 | `wx.setStorageSync` 替代 localStorage |

### 3.2 目录结构

```
yappi-miniprogram/
├── app.js                    # 全局 App，初始化 Supabase，处理登录态
├── app.json                  # 全局配置：pages、tabBar、网络域名
├── app.wxss                  # 全局样式：CSS 变量、通用类
│
├── pages/
│   ├── auth/                 # 微信登录 + openid 绑定
│   │   ├── auth.js
│   │   ├── auth.wxml
│   │   └── auth.wxss
│   ├── wizard/               # 首次设置向导（2步）
│   │   ├── wizard.js
│   │   ├── wizard.wxml
│   │   └── wizard.wxss
│   ├── home/                 # 主页：打卡、任务列表
│   │   ├── home.js
│   │   ├── home.wxml
│   │   └── home.wxss
│   ├── shop/                 # 奖励商店
│   │   ├── shop.js
│   │   ├── shop.wxml
│   │   └── shop.wxss
│   ├── report/               # 月度报告
│   │   ├── report.js
│   │   ├── report.wxml
│   │   └── report.wxss
│   └── parent/               # 家长管理面板
│       ├── parent.js
│       ├── parent.wxml
│       └── parent.wxss
│
├── components/
│   ├── pin-input/            # 4位PIN码输入组件（儿童切换用）
│   ├── emoji-picker/         # Emoji 选择器
│   ├── avatar-grid/          # 头像选择网格
│   ├── pill-selector/        # 频率/分类选择器
│   └── task-card/            # 任务卡片
│
└── utils/
    ├── supabase.js           # Supabase 客户端初始化 + 所有 DB 操作
    ├── auth.js               # 微信登录、openid 换取、会话管理
    ├── constants.js          # AVATARS、EMOJIS、CATS、FREQS、LEVELS（直接复用）
    └── helpers.js            # getLevel、getGreeting、isTaskToday 等纯函数（直接复用）
```

### 3.3 页面路由

```
启动
 └─ app.js onLaunch
      ├─ 有 openid 缓存 → 查 parents 表 → 有数据 → 跳 /pages/home/home
      │                                  → 无数据 → 跳 /pages/wizard/wizard
      └─ 无缓存 → 跳 /pages/auth/auth
```

**tabBar 配置**（原生 tabBar，4 个 tab）：

| Tab | 页面 | 图标 |
|-----|------|------|
| 主页 | pages/home/home | 🏠 |
| 奖励 | pages/shop/shop | 🛍️ |
| 报告 | pages/report/report | 📊 |
| 家长 | pages/parent/parent | 🔐 |

---

## 4. 认证流程设计

### 4.1 整体流程

```
用户首次打开
    │
    ▼
wx.login() → code
    │
    ▼
调用 Supabase Edge Function: /functions/v1/wx-login
    │  入参: { code }
    │  出参: { openid }
    ▼
查询 parents 表 WHERE openid = ?
    ├─ 找到 → 登录成功，缓存 parent_id + openid
    └─ 未找到 → 引导注册（输入用户名）→ INSERT parents
```

### 4.2 PIN 码的新定位

PIN 码**不再用于主账号登录**，仅用于：
- 切换儿童时的家长身份验证（防止孩子自己切换）
- 进入家长管理面板时的二次验证（可选）

### 4.3 数据库变更

```sql
-- parents 表新增字段
ALTER TABLE parents ADD COLUMN openid TEXT UNIQUE;

-- 原 username + pin 登录逻辑废弃，username 保留作为显示名
```

### 4.4 Supabase Edge Function

**文件**：`supabase/functions/wx-login/index.ts`

```typescript
// 接收 code，调用微信 jscode2session 接口换取 openid
// 返回 openid 给小程序（appsecret 保存在 Edge Function 环境变量中）
Deno.serve(async (req) => {
  const { code } = await req.json()
  const res = await fetch(
    `https://api.weixin.qq.com/sns/jscode2session?appid=${APPID}&secret=${SECRET}&js_code=${code}&grant_type=authorization_code`
  )
  const { openid } = await res.json()
  return Response.json({ openid })
})
```

**安全说明**：appsecret 存储在 Supabase Edge Function 的环境变量中，不暴露给客户端。

---

## 5. 代码复用策略

### 5.1 直接复用（零改动）

| 模块 | 原位置 | 目标位置 |
|------|--------|---------|
| 常量定义 | `index.html` L523-531 | `utils/constants.js` |
| `getLevel()` | L544 | `utils/helpers.js` |
| `getGreeting()` | L545 | `utils/helpers.js` |
| `isTaskToday()` | L547 | `utils/helpers.js` |
| `today()` | L543 | `utils/helpers.js` |
| 所有 Supabase CRUD | L621-974 | `utils/supabase.js` |
| 报告统计计算逻辑 | L745-823 | `pages/report/report.js` |

### 5.2 适配改动（逻辑不变，API 替换）

| 原 H5 | 小程序替代 | 说明 |
|--------|-----------|------|
| `localStorage.setItem/getItem` | `wx.setStorageSync/getStorageSync` | 直接替换 |
| `fetch()` | `wx.request()` 或保留 fetch（小程序支持） | Supabase SDK 内部用 fetch，需配置合法域名 |
| `confirm()` | `wx.showModal()` | 删除确认弹窗 |
| `alert()` / toast | `wx.showToast()` 或自定义 toast 组件 | |
| Canvas 图表 | 小程序 Canvas 2D API | API 略有差异，逻辑可复用 |

### 5.3 重写部分（结构性变化）

| 模块 | 原因 |
|------|------|
| HTML → WXML | 模板语法不同，`{{}}` 数据绑定替代 DOM 操作 |
| `showScreen()` / `goTab()` | 改为小程序页面跳转 + 原生 tabBar |
| `openM()` / `closeM()` | 改为小程序 `<popup>` 组件或半屏页面 |
| `renderXxx()` 系列函数 | 改为 `setData()` 驱动的声明式渲染 |
| 认证模块 | 微信登录替代 PIN 主登录 |

---

## 6. 数据流设计

### 6.1 全局状态（app.js globalData）

```javascript
globalData: {
  parent: null,       // 当前登录家长
  children: [],       // 孩子列表
  curChild: null,     // 当前选中孩子
  tasks: [],          // 任务列表
  rewards: [],        // 奖励列表
  templates: [],      // 任务模板
}
```

### 6.2 页面级状态

各页面通过 `getApp().globalData` 读取共享数据，通过 `setData()` 驱动本页面渲染。

跨页面数据更新（如完成任务后更新星星）通过：
1. 更新 `globalData`
2. 目标页面 `onShow()` 时重新从 `globalData` 同步

---

## 7. 关键组件设计

### 7.1 PIN 输入组件 (`components/pin-input`)

- 4 位圆点显示 + 数字键盘
- 支持 `correct-pin` 属性传入正确 PIN
- 验证成功触发 `bind:success` 事件
- 用于：切换儿童、进入家长面板

### 7.2 Emoji 选择器 (`components/emoji-picker`)

- 接收 `emojis` 数组和 `selected` 值
- 触发 `bind:change` 事件
- 直接复用 H5 的 emoji 常量

### 7.3 趋势图表

使用小程序 Canvas 2D API 重写 `drawTrend()`，逻辑与 H5 版本一致，仅 API 调用方式不同：

```javascript
// H5
const ctx = canvas.getContext('2d')

// 小程序
const query = wx.createSelectorQuery()
query.select('#trend-chart').fields({ node: true }).exec((res) => {
  const canvas = res[0].node
  const ctx = canvas.getContext('2d')
  // 后续逻辑相同
})
```

---

## 8. 配置要求

### 8.1 微信小程序后台配置

**合法域名白名单**（request 合法域名）：
- `https://xmuzltaebuxhmjzadujn.supabase.co`（Supabase 数据库）
- `https://api.weixin.qq.com`（微信登录，系统内置，无需配置）

### 8.2 app.json 关键配置

```json
{
  "pages": [
    "pages/auth/auth",
    "pages/wizard/wizard",
    "pages/home/home",
    "pages/shop/shop",
    "pages/report/report",
    "pages/parent/parent"
  ],
  "tabBar": {
    "list": [
      { "pagePath": "pages/home/home", "text": "主页" },
      { "pagePath": "pages/shop/shop", "text": "奖励" },
      { "pagePath": "pages/report/report", "text": "报告" },
      { "pagePath": "pages/parent/parent", "text": "家长" }
    ]
  },
  "networkTimeout": { "request": 10000 }
}
```

---

## 9. 开发顺序

| 阶段 | 内容 | 预计工时 |
|------|------|---------|
| 1 | 数据库变更（加 openid 字段）+ Edge Function | 0.5 天 |
| 2 | 小程序项目初始化，utils 层（constants、helpers、supabase） | 0.5 天 |
| 3 | 认证页（微信登录 + openid 绑定） | 0.5 天 |
| 4 | 向导页（2步设置） | 0.5 天 |
| 5 | 主页（打卡、任务列表、儿童切换） | 1 天 |
| 6 | 奖励商店页 | 0.5 天 |
| 7 | 月度报告页（含 Canvas 图表） | 0.5 天 |
| 8 | 家长管理页（孩子/任务/奖励 CRUD） | 1 天 |
| 9 | 公共组件（PIN 输入、emoji 选择器、弹窗） | 0.5 天 |
| 10 | 真机测试、体验优化 | 0.5 天 |
| **合计** | | **~6 天** |

---

## 10. 风险与注意事项

| 风险 | 说明 | 应对 |
|------|------|------|
| Supabase JS SDK 兼容性 | SDK 依赖 fetch，小程序支持 fetch，但需验证 | 初始化阶段验证，必要时用 wx.request 封装 |
| 微信审核 | 涉及儿童相关内容，需确保无违规内容 | 提前阅读微信审核规范 |
| openid 安全 | openid 不应直接作为鉴权凭证 | 目前 RLS 为 allow all，后续可加 JWT 鉴权 |
| 表情符号渲染 | 部分 emoji 在不同 Android 机型显示差异 | 真机测试覆盖主流机型 |

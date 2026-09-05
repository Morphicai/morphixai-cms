# ARCHITECTURE — Optimus CMS 终局架构

> 描述**终局形态**（⑧ 完成后）。标注 ✅ 的是已建成，⏳ 的是路线图上待建。
> 演进路径见 `ROADMAP.md`，决策来龙去脉见 `HANDOFF.md`。
> 最后更新：2026-09-05。

---

## 一、总图

```
                          ┌──────────── 浏览器 ────────────┐
                          │                                │
                  C 端流量 │                                │ B 端流量
                          ▼                                ▼
        ┌─────────────────────────────┐      ┌──────────────────────────┐
        │  optimus-next  :8086        │      │  Caddy(精简版)  :8080     │
        │  自托管公网入口,不经 Caddy   │      │  只做两件事:              │
        │  ├ C 端页面渲染              │      │  ├ optimus-ui 静态站      │
        │  ├ /api/* 代理分流 ★        │      │  └ /api/* → optimus-api  │
        │  └ zone 路由(Multi-Zones)   │      └────────────┬─────────────┘
        └──────────────┬──────────────┘                   │
   L0                  │                                  ▼
   接入层              │                     ┌──────────────────────────┐
                       │                     │  optimus-ui  :8082       │
                       │                     │  管理后台壳              │
                       │                     │  └ /embed/:serviceKey ★  │
                       │                     └────────────┬─────────────┘
                       │                                  │ iframe src=embedUrl
                       │                                  │ (浏览器直连子服务子域名,
                       │                                  │  不经主站代理)
   ────────────────────┼──────────────────────────────────┼─────────────────
                       │                                  │
   L1                  │        ┌─────────────────────────┼──────────┐
   中台基础能力         │        │  optimus-api  :8084     │          │
   (中台团队独占)        ├───────►│  ├ 服务目录 ★★★ ─────────┼────┐     │
                       │        │  ├ /auth/introspect ★★  │    │     │
                       │        │  ├ 用户/角色/权限(CASL)  │    │     │
                       │        │  ├ 存储 / i18n / 文章…   │    │     │
                       │        │  └ business/contact     │    │     │
                       │        └──────────▲──────────────┘    │     │
                       │                   │                   │     │
                       │        ┌──────────┴──────────┐        │     │
                       │        │ agent-service :8087 │◄───────┘     │
                       │        │ AI 执行引擎         │ tool-providers│
                       │        └─────────────────────┘              │
                       │                                             │
                       │   共享包(无进程): @optimus/{common, server-sdk,
                       │   client-sdk, admin-embed, auth-ui, platform-client ⏳}
   ────────────────────┼─────────────────────────────────────────────┼─────
                       │  按 apiPathPrefixes 分流                     │
   L2                  ▼                                             ▼
   业务领域服务    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
   (业务团队各自)  │partner ✅:8089│ │marketing ⏳  │ │ order ⏳     │
                  │合伙人/积分/   │ │活动/预约/    │ │ 订单/支付    │
                  │外部任务       │ │奖励领取      │ │ 回调         │
                  │+ admin-app   │ │+ admin-app   │ │+ admin-app   │
                  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
                         └────────────────┴────────────────┘
                              彼此只走 HTTP,禁止代码级依赖
                                        │
                         全部依赖 L1 核心契约(introspect / service token
                         / 服务目录登记 / platform-client SDK)
```

★ = 由服务目录驱动的动态行为，不是硬编码

---

## 二、逐层说明

### L0 · 接入层

**是什么**：只做渲染、路由分发、iframe 挂载的外壳。**零业务逻辑**——判断标准是：
把任何一个 L2 服务下线，L0 的代码不需要改一行（只是服务目录里少一条记录）。

| 成员 | 职责 | 关键实现 |
|---|---|---|
| `optimus-next` :8086 | C 端页面 + **C 端流量总入口** | `src/app/api/[...path]/route.ts` 按服务目录分流；zone 路由 |
| `optimus-ui` :8082 | 管理后台壳 | `/embed/:serviceKey` 宿主路由；动态菜单；CASL 控制显隐 |
| `zone-activity` :8088 | Multi-Zones 的 zone 示例 | 独立 Next.js，经 `pathPrefix` 接入 |

**L0 依赖 L1 的什么**（具体到接口）：

1. **服务目录读接口** —— L0 全部动态行为的来源
   - `optimus-next`：拉服务目录的 `apiPathPrefixes` + `baseUrl`，**60s TTL** 缓存成路由表，
     `matchApiRoute()` 命中就转发到子服务，未命中回落 optimus-api
   - `optimus-ui`：拉 `entryType='embed'` 的条目渲染动态菜单（`menuTitle` / `menuIcon` /
     `permCode` / `sortOrder`），点击进 `/embed/:serviceKey`
2. **认证** —— C 端靠 httpOnly cookie（后台签发/续期/清除，代理只透传，
   **代理绝不替后台实现认证语义**）；B 端 token 存 localStorage
3. **权限** —— CASL 权限码控制菜单与按钮显隐

**L0 依赖 L2 的什么**：**不直接依赖**。这是本架构最关键的一条——
L0 的代码里不出现任何 L2 服务的地址。C 端经代理按目录分流，B 端经 iframe 加载
目录里的 `embedUrl`。新增一个业务服务，L0 零改动。

---

### L1 · 中台基础能力层

**是什么**：中台团队独占维护、业务团队只消费的公共底座。分两类：

**核心契约（强制，不用就过不了接入检查清单）**

| 能力 | 接口 / 载体 | 状态 |
|---|---|---|
| 服务目录 | `op_sys_service_registry` 表 + 管理接口 | ✅ |
| 用户身份自省 | `POST /api/auth/introspect` `{token, type:"admin"\|"client"}` | ✅ |
| 服务身份 | 同上 `type:"service"`；HS256 短期 JWT，`SERVICE_TOKEN_SECRET` 环境变量注入 | ✅ |
| embed 握手协议 | `@optimus/admin-embed`：`init({baseOrigin})` / `requestToken()` / `onTokenRefresh()` | ✅ |
| 服务端 SDK | `@optimus/server-sdk`：`introspect()` / `getServiceToken()` / `verifyServiceToken()` | ✅ |
| 平台能力 SDK | `@optimus/platform-client`：OSS 上传 / 短链 / 环境信息 / 用户资料查询 | ⏳ ③ |

**通用能力（可选，按需消费）**

`agent-service`（AI 执行引擎）· i18n · 存储抽象（OSS/MinIO/Memory）· 动态表单 ·
schema 驱动 CRUD · 文章 / 字典 / 操作日志

**L1 依赖谁**：**谁都不依赖。** L1 不知道任何 L2 服务的存在——它只知道
`op_sys_service_registry` 表里有若干**数据行**。这是分层能成立的根本：
依赖方向单向向下（L0→L1、L2→L1），L1 是叶子。

> 唯一的例外是探测：主服务 15s 轮询各服务的 `/health`、`/metrics-lite`。
> 但轮询目标同样来自目录数据行，不是编译期依赖。

**L1 内部的两个特殊点**：
- `optimus-api` 同时是**服务目录的宿主**和**认证中心**——它是唯一不能拆的那个
- `business/contact`（商业合作域）明确留在 optimus-api 内不拆，是 L1 进程里
  唯一的业务代码，属有意为之的例外

---

### L2 · 业务领域服务层

**是什么**：按业务属性划分团队边界的独立进程。每个服务 = 独立 NestJS 进程 +
自带 React `admin-app` + 独立 Dockerfile + 独立子域名。

| 域 | 服务 | 模块 | 状态 |
|---|---|---|---|
| 合伙人增长 | `partner-service` :8089 | partner / points-engine / external-task | ✅ |
| 营销 | `marketing-service` | activity / appointment / reward-claim-record | ⏳ ⑦ |
| 订单 | `order-service` | order（含支付回调） | ⏳ ⑧ |
| 商业合作 | —— | contact | 明确不拆，留 L1 进程 |

**L2 依赖 L1 的什么**（这是每个业务服务接入时的检查清单）：

1. **服务目录登记** —— 不登记 = 不存在。C 端流量不会分流过来、管理菜单不出现、
   探测不到、Agent 发现不了它的工具
2. **`/auth/introspect`** —— 业务服务**不复制用户体系**，拿请求里的 token 换身份和
   权限码。必须经 `@optimus/server-sdk` 调用，**禁止裸写 HTTP**
3. **service token** —— 没有真人背景的调用（定时任务、队列消费、批量同步）用它
4. **`@optimus/platform-client`** ⏳ —— OSS 上传、短链、环境信息、按 uid 查用户资料
5. **暴露 `/health` + `/metrics-lite`** —— 这是义务不是权利，探测面板靠它

**L2 之间依赖什么**：只有 **HTTP 接口** 和（能力就绪后）**领域事件订阅**。

明令禁止的三件事（partner 拆分时全部踩过）：
- ❌ 跨业务 `@InjectRepository` 别人的 entity —— partner 曾直接注入 points-engine 的
  `TaskCompletionLogEntity` 做统计，还伴随 `forwardRef` 循环依赖。同团队时能跑，
  一旦分属不同仓库/进程，**编译期直接断**
- ❌ 原生 SQL 跨表 JOIN 别人的表 —— `reward-claim-record` 对 `activity` 就是这样
- ❌ 裸写 HTTP 调 `/auth/introspect` —— 绕过 SDK 就绕过了统一的缓存/重试/契约演进

**约束怎么落地**：不是靠自觉。③ `platform-client-sdk` 要把这三条做成 **CI 静态扫描**，
不这样写就过不了检查。

---

## 三、枢纽：服务目录如何驱动五条链路

`op_sys_service_registry` 是整个架构的接线板。**登记即接入**这四个字的实际含义是：
一张表的一行数据，同时驱动五件事。

| 字段 | 驱动的链路 | 消费方 |
|---|---|---|
| `baseUrl` | 所有链路的基址 | 全部 |
| `enabled` | 总开关；service token 自省时反查此字段 | optimus-api |
| `healthPath` / `metricsPath` | **探测** —— 15s 轮询，结果进服务状态页 | optimus-api |
| `entryType='embed'` + `embedUrl` + `menuTitle` / `menuIcon` / `permCode` / `sortOrder` | **动态菜单 + embed 挂载** | optimus-ui |
| `entryType='zone'` + `pathPrefix` | **Multi-Zones 路由** | optimus-next |
| `apiPathPrefixes` (JSON 数组) | **C 端 API 代理分流** | optimus-next |
| `toolsPath` | **Agent 工具发现** —— 经 `GET /system/services/tool-providers` | agent-service |
| `parentKey` ⏳ ④ | 一个服务挂多个子菜单 | optimus-ui |

**已知的运维陷阱**：动态菜单是**页面加载时**拉取的。登记新服务后，已经打开的
管理后台页面不会自己出现新菜单，**需要刷新**。

---

## 四、终局部署拓扑（⑥ 完成后）

三条流量路径，各走各的，**不共用网关**：

```
① C 端     浏览器 ──► optimus-next(自托管公网入口) ──► 按服务目录分流
                       不经 Caddy                      ├─► optimus-api
                                                       ├─► partner-service
                                                       ├─► marketing-service
                                                       └─► order-service

② 管理后台  浏览器 ──► Caddy(精简版) ──┬─► optimus-ui 静态站
                                      └─► /api/* → optimus-api(固定转发)

③ embed    浏览器 ──► 各服务自己的子域名(Caddy 通配符证书下的独立站点块)
                      ──► 该服务的 admin-app
                      ★ 浏览器直连子服务,完全不经过主站代理
```

**为什么 C 端不要 Caddy**：`optimus-next` 本身就是能监听公网端口、跑动态逻辑的
Node server。路由决策已经由它基于服务目录动态完成，再套一层 Caddy 只会出现
"静态路由表拦在动态路由之前"——这正是当前生产环境已经踩中的坑
（`/api/*` 被硬编码转发到 optimus-api，partner-service 的路由在生产拓扑下已失效）。

**为什么 embed 要独立子域名**：B 端 embed 是浏览器**直接**打子服务的 origin，
postMessage 握手要求双方校验 origin。不给独立公网地址，管理页在生产环境根本打不开。

**可达范围的已拍板结论**：embed 管理页可达范围**统一跟随管理后台整体**，
不做内网/VPN-only 的差异化限定——理由是那会造成"权限够但因为不在 VPN 里
进不去某个具体页面"的可用性陷阱。因此 `op_sys_service_registry`
**不需要新增可达范围字段**。

**访问控制发生在权限层，不在网络层。** 这是上一条的直接推论，也是 ⑥ 的
spec 里固化下来的约束：用户能不能打开某个 embed 管理页，由该条目的
`permCode` 决定，不由他此刻在不在某个网络里决定。

---

## 五、信任模型 ⏳ ⑥

> 这一层现在是空白的，`platform-trust-model` 建成后生效。它的由来是一次架构压测：
> 用"外包团队交付业务服务"和"低代码/AI 生成页面"两个场景检验现有分层，结论是
> **骨架成立，但信任模型缺失**——现有分层的设计假设是"不同的**内部**团队"，
> 而不可信的代码提供方和不受控的 schema 输入都突破了这个假设。

**三个概念，各管一件事，不要混用：**

| 概念 | 回答的问题 | 载体 |
|---|---|---|
| 用户权限码 `permCode` + CASL | 这**个人**能做什么 | 角色 / 菜单 / 按钮 |
| 服务信任级别 `trustLevel` | 这个服务的**代码提供方**有多可信 | 服务目录条目 |
| 服务能力授权 `grants` | 这个**服务**能访问什么 | 服务目录条目 |

**信任级别**：`first-party`（内部团队、同一部署）/ `second-party`（内部但独立团队）/
`third-party`（外包、外部供应商）。

它只做两件事：① 给新登记服务一个安全的默认授权集；② 承载与级别绑定的硬约束
（`third-party` 不得与平台共用数据库实例）。**运行时的授权判据始终是 `grants`，
不是级别。** 这是刻意的——"可以访问什么"必须是可配置的，不能焊死在级别上。

> ⚠️ 信任级别表达的是**代码提供方的可信程度**，与业务重要性无关。一个一方服务可以
> 处理核心支付，一个三方服务可以只做活动页。别把它当成重要性分级用。

**grants 形态**：`<资源>:<动作>` 的字符串数组，与用户权限码形态一致但**体系独立**——
服务的授权不能通过借用某个用户的权限获得。那正是当前"借用户 token 转发"模式的问题。

```
["user-profile:read-basic", "points:grant", "oss:upload", "shortlink:create"]
```

**两条与其它章节呼应的规则**：

- **校验发生在被调用方，不在网关。** 与 §四"访问控制发生在权限层而非网络层"同源：
  网关只做路由，不承担授权语义——否则绕过网关的调用路径（embed 浏览器直连）
  就出现授权真空
- **service token 的冒充防护由密码学提供，不由约定提供。** 主密钥按 `serviceKey`
  派生各服务的签名密钥；平台侧不存储任何派生密钥；**即使某服务密钥完全泄露，
  泄露方也只能冒充该服务本身**

---

## 六、依赖规则总表

一句话概括：**依赖方向单向，L1 是叶子，L0 对 L2 的依赖全部经由服务目录间接化。**

| 从 | 到 | 允许依赖的东西 | 禁止 |
|---|---|---|---|
| L0 | L1 | 服务目录读接口、introspect、CASL 权限码、共享包 | —— |
| L0 | L2 | **不直接依赖**（经服务目录间接：代理分流 / iframe embedUrl） | 硬编码任何 L2 地址 |
| L1 | L0/L2 | **不依赖**（只认目录里的数据行） | 任何编译期引用 |
| L2 | L1 | introspect / service token / 目录登记 / platform-client SDK | 裸写 HTTP 调平台接口 |
| L2 | L2 | HTTP 接口、领域事件订阅 | `@InjectRepository` 别人的 entity、跨表 JOIN |

**验证这套分层是否还成立的方法**：任选一个 L2 服务，把它的进程停掉。
预期表现是——该业务的 C 端接口 502、管理菜单点进去 iframe 加载失败、
探测面板显示 inactive；**其余一切正常**。如果主站也跟着挂，说明有人违规了。

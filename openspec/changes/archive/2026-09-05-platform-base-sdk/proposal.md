# Proposal: platform-base-sdk — 基座与共享 SDK

## 要解决的问题

用一个具体场景校准：**某个营销活动由另一个团队负责开发**。他们要做三件事——
给用户看的活动页、给运营用的活动管理页、活动自己的业务逻辑。今天他们每一步都会撞墙：

1. 活动页想知道"当前用户是谁"：C 端登录态在 httpOnly cookie 里，前端根本读不到，
   而 401 刷新、请求去重这些逻辑埋在 optimus-next 的 `src/sdk/` 里，别的项目拿不走
2. 活动管理页想进我们的管理后台：i18n-platform 已经开了 iframe 嵌入的先例，
   但那是**裸 iframe**——token 没传、用户没传、权限没传，子应用等于面对一个匿名访客
3. 他们自己的后端想校验"这个 token 是不是我们平台签的、用户有什么权限"：
   两套 JWT（管理端 / client-user）都是**对称密钥**，把密钥发给别的团队等于交出签发权

结论：不是缺功能，是缺**接入面**。平台能力都在，但都长在各自应用体内，没有对外的形状。

## 方案：三个薄接入面，不引框架

原则照旧——关键不在于多，而在于精简、合理、可扩展。

| 接入面 | 形态 | 解决场景里的哪一步 |
|---|---|---|
| `@optimus/client-sdk` | 从 optimus-next `src/sdk/` 抽出的 workspace 包 | 活动页拿登录态、调数据集合、自动 401 刷新 |
| 管理端嵌入协议 + `@optimus/admin-embed` | 基座 IframeApp 组件 + postMessage 握手 + 子应用侧小 SDK | 活动管理页嵌入后台并继承登录态/权限/主题 |
| `POST /api/auth/introspect` + `@optimus/server-sdk` | 一个接口 + 它的薄封装 | 外部后端校验 token，不外发密钥 |

### 明确不做（本次边界）

- **不引 qiankun / module federation**：iframe + 握手已满足"独立开发、独立部署、
  共享登录态"，成本一个量级的差距；真到了要共享路由和弹窗层级的那天再升级
- **不做 webhook / app-key 开放平台**：还没有真实的外部消费者压力
- **不换 RS256 非对称 JWT**：introspection 模式下密钥不出边界，够用
- **不做动态菜单表**：外部子应用进菜单走 routes.js 登记（一个通用 IframeApp 组件
  按菜单 meta 的 url 渲染），登记簿保持单一

## 客户端共享 vs 服务端共享（模块清单）

### 客户端可共享（进 @optimus/client-sdk，C 端任意子应用可用）

| 模块 | 现在长在哪 | 为什么可共享 |
|---|---|---|
| BaseHttpService（同源 /api + 401 自动 refresh + 去重） | optimus-next/src/sdk/http | 纯协议约定，不含业务 |
| UserSessionService（me 校验 + 乐观缓存） | 同上 | 登录态的唯一正确读法 |
| DynamicContentSDK / 数据集合读写 | 同上 + 本次 site-features 模式 | 活动配置=public_read 集合，报名=public_write 集合，schema 校验白得 |
| StorageService / RequestDeduplication | 同上 | 通用工具 |
| crypto（密码加密传输） | packages/common | 已是同构包，client-sdk 依赖它 |

登录态共享的根基不是 SDK，是**同域部署 + httpOnly cookie**：子应用只要挂在同一
域名（子路径）下，cookie 天然带上，SDK 只是给"当前用户是谁/没登录去哪"一个标准答案。

### 管理端基座下发给子应用的（嵌入协议内容）

| 能力 | 传递方式 |
|---|---|
| 管理端 JWT（accessToken） | 握手 payload 下发；过期时子应用 postMessage 请求基座刷新 |
| 当前用户信息 | 握手 payload |
| 权限码列表 | 握手 payload（子应用自己决定藏哪些按钮，真正的门禁永远在服务端 @Perm） |
| locale / theme | 握手 payload，变更时增量推送 |

### 服务端可共享

| 能力 | 内部 module（monorepo 内） | 外部服务（其他团队自己的后端） |
|---|---|---|
| 身份校验 | 直接挂现有守卫（@Perm / client-user 守卫） | `POST /api/auth/introspect` → @optimus/server-sdk |
| 权限判断 | @Perm 装饰器 + routes.js 登记权限码 | introspect 返回权限码列表，自行判断 |
| 结构化数据 | TypeORM entity | 数据集合 API（免建表，schema 校验、unique、访问控制白得） |
| 文件存储 | OSS 抽象注入 | 暂不开放（无场景） |
| 领域事件 | @OnEvent（partner→points 已验证） | 不开放（webhook 属于开放平台阶段） |

## 验收标准

用一个最小外部子应用示例走通全场景（examples/demo-activity，模拟"另一个团队"）：

1. 管理后台菜单出现"演示活动"，打开即 iframe 加载子应用，握手完成后子应用显示
   当前管理员的名字与权限码（证明登录态/权限穿透）
2. 子应用用握手拿到的 token 调 introspect，返回用户与权限（证明外部后端可校验）
3. 子应用通过数据集合 API 读写活动配置（证明数据能力共享）
4. optimus-next 切换为消费 @optimus/client-sdk 后，登录/刷新/首页数据回归全绿
   （证明抽包无损）

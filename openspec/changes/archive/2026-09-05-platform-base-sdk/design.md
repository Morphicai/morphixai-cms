# Design: platform-base-sdk

## 1. introspect 接口

`POST /api/auth/introspect`，body `{ token: string, type: "admin" | "client" }`，
返回 `{ active: boolean, user?: {...}, perms?: string[] }`（RFC 7662 的极简子集）。

**为什么匿名可调**：token 本身就是秘密——能把 token 递进来的人本来就能直接冒充该
用户调任何业务接口，introspect 不放大任何权限，只是把"这个 token 是谁"翻译出来。
给它加一层 service key 就是提前造开放平台，违背精简原则。防滥用靠限频（复用
checkGenRate 的内存限频器思路，按 IP）。

- `type=admin`：用管理端 JWT 密钥 verify，查 op_sys_user + 聚合角色权限码（复用
  现有 perm 查询逻辑），返回 perms
- `type=client`：走 clientUserService.verifyToken（已存在），无 perms 概念
- token 无效/过期不抛错，返回 `{ active: false }`——调用方好写，也不给探测者
  区分"格式错/过期/伪造"的信息

@optimus/server-sdk 就是这个接口的 fetch 封装 + 60s 内存缓存（key=token hash），
零依赖，Node 18+ 原生 fetch。**不承诺框架集成**（不做 Nest guard/express中间件），
那是消费方三行代码的事。

## 2. @optimus/client-sdk 抽包

`optimus-next/src/sdk/` 平移到 `packages/client-sdk/src/`，原路径改为 re-export
薄壳（`export * from "@optimus/client-sdk"`），next 内所有 import 路径不用动。
构建同 packages/common 的方式（tsc 出 dist，workspace 软链）。

约束：包内不得 import 任何 next/react 特定模块（现有四件套本来就是纯 TS，符合）。
新增一个 `collections.ts`：数据集合公开读写的薄封装（list/get/create/update，
底下就是 `/api/api/dictionary/:collection`），这是活动场景最常用的数据面。

## 3. 管理端嵌入协议（iframe + postMessage）

握手时序（子应用先发起，避免基座对着没加载完的 iframe 喊话）：

```
子应用 → 基座: { type: "optimus:ready", version: 1 }
基座 → 子应用: { type: "optimus:handshake", payload: { token, user, perms, locale, theme } }
子应用 → 基座: { type: "optimus:refresh-token" }          // token 过期时
基座 → 子应用: { type: "optimus:token", payload: { token } }
```

**双向 origin 校验**：基座只回话给菜单登记的 iframe url 的 origin；子应用侧 SDK
初始化时必须传 `baseOrigin`，不匹配的消息一律丢弃。token 经 postMessage 定向传递
（指定 targetOrigin），不走 URL 参数（会进历史/日志）。

- 基座侧：`IframeApp` 通用组件（optimus-ui），菜单节点 meta 加 `iframeUrl` 即接入；
  监听 message、校验 origin、下发握手、代理刷新（复用基座自己的 updateToken 逻辑）
- 子应用侧：`@optimus/admin-embed` 包，API 三个：
  `init({ baseOrigin }) → Promise<{ token, user, perms, locale, theme }>`、
  `onTokenRefresh(cb)`、`requestToken()`。全部加超时——3s 没握上手就 reject，
  子应用自己决定降级（比如显示"请从管理后台打开"）

翻译工作台（i18n-platform）**本次不改造**：它自己有存储无权限诉求，裸 iframe
够用；协议是给需要登录态的子应用准备的，demo-activity 示例承担验证职责。

## 4. 示例子应用 examples/demo-activity

单 html + 原生 JS（够了，别给示例上构建链），引 admin-embed 的 iife 产物：
握手 → 显示用户名/权限码 → 按钮触发 introspect 显示结果 → 读写一个
`demo-activity-config` 数据集合。用任意静态服务器起（`npx serve`），
菜单登记 `iframeUrl: http://localhost:5190`。

## 5. 权限

新权限码 `DemoActivity`（示例菜单用，验收后可摘）。introspect 不占权限码（匿名）。

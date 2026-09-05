# Design: optimus-next 闭环修复

## 核心判断

侦查发现仓库里同时存在"坏链路"和"好链路"：

- **坏**：`src/sdk/http/BaseHttpService`（layout 上真正生效的登录入口）——baseURL 默认
  `localhost:3001` 死端口、前端用 document.cookie 自管 token、明文密码直连后端
- **好**：`src/lib/api.ts`——baseURL `/api` 走代理、cookie 自动携带、401 时空 body 调
  refresh（后端从 cookie 读 refreshToken）。profile/news 一直挂在这套上，只是被
  登录入口坏了而一起瘫痪

所以方案不是重写，是**把 SDK 改造成 lib/api.ts 的形态**，让全站汇到一条链路。

## 认证单链路（决策）

```
浏览器 ──同源 /api/* ──> Next 代理 route.ts ──> optimus-api(8084)
         cookie 自动带      透传 cookie +          login/refresh/logout
                            转发 Set-Cookie        自己写 httpOnly cookie
```

- **token 生命周期完全交给后端 httpOnly cookie**。前端任何地方不再读写 token——
  httpOnly 本来就读不到，之前 SDK 的 document.cookie 方案和它是互斥的两套
- **身份信息**：登录响应体 `data.user` 直接入 AuthProvider state + localStorage
  缓存（key: `clientUserInfo`，仅用于刷新后首屏，不含 token）；mount 时调
  `/client-user/me` 校验，401 则清缓存
- **代理修复**：现在 `setAuthCookies` 解析 `data.data.accessToken`，而 login 实际返回
  `data.tokens.accessToken`——结构不匹配，cookie 从来没设上过。改为直接转发后端的
  Set-Cookie 头（`response.headers.getSetCookie()`），后端已把 maxAge 与 expiresIn
  对齐，代理不再重复实现 cookie 策略
- **注册后自动登录**：register 接口不发 token（后端如此设计），AuthProvider 注册
  成功后内部再调一次 login
- **登录跳转统一 `/auth`**：仓库里 `/auth/login`、`/login` 两个路径都不存在

## DynamicContent 接通（决策）

后端已有现成的公开字典接口（`PublicDictionaryController`，服务层按 accessType
做 public_read/public_write 门禁），但 controller 忘了标 `@AnonymousAuth()`，
被统一守卫按管理员模式拦成 401——补上装饰器即通，不新建模块。

- SDK 三个读方法映射：`get(key)` → `GET /api/dictionary/dynamic-content/:key`；
  `getBatch/query` → `GET /api/dictionary/dynamic-content` 整集合取回后本地筛
- 字典 value 约定为 `{ type, value }` 对象；拿到纯字符串则视为 text 类型，兼容手工录入
- 首页 Hero 传 `hero.title` / `hero.subtitle`，defaultValue 保持现有文案——
  接口失败时页面与今天完全一样，这是渐进增强不是硬依赖
- 种子：`op_sys_dictionary_collection` 加 `dynamic-content`（public_read）+
  两条初始 key，进 optimus-minimal.sql；dev 库手工执行同样语句

## demo/debug 页隔离（决策）

用 Next middleware 按前缀匹配，`NODE_ENV !== 'development'` 时 rewrite 到 404。
不删页面：它们是开发期真实在用的调试工具（api-examples 是全接口点测台）。
隔离清单：/debug-login /api-test /api-examples /business-demo /auth-modal-demo
/design-system-demo /components /examples

## 删除清单（决策：死代码直接删，git 里都有）

- `src/contexts/AuthContext.tsx`、`src/components/LoginForm.tsx`、`src/hooks/useAuth.ts`
  ——整条链无页面引用，且与生效的 AuthProvider 重名易混
- ArticleSDK 的 getRecommended/getPopular/getLatest/incrementView——后端无对应路由
  （`@Get(":id")` 还会把 /recommended 当 id 吞掉），也无消费方

## 不动的东西

- services/ApiService + lib/api.ts：形态正确，消费方（profile/news）工作正常，不重构
- ArticleSDK 与 articleService 双实现并存的问题记 TASKS.md，本轮不合并——
  两边消费方都活着，合并属于重构不属于闭环

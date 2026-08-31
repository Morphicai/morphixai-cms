## 实施记录（2026-08-25，暂停于此，先记录再继续）

已读代码、尚未写代码。续做时直接看这里，不用重新探索：

- **`auth-introspect.controller.ts` 现状**：`type` 判断是
  `body?.type === "client" ? "client" : "admin"`——任何非 `"client"` 的值
  （包括未来传入的 `"service"`）现状会静默落进 admin 分支，而不是报错。
  新增 service 分支必须在这一行判断**之前**拦截，不能指望"反正 admin 分支
  验证不通过也是 inactive"这种巧合行为，那样会让"服务 token 走错分支"和
  "真的是无效 admin token"两种情况混在一起,排查不清楚是哪种
- **`AuthIntrospectController` 当前构造函数依赖**：`AuthService`、
  `UserService`、`ClientUserService`（`auth.module.ts` 对应 import
  `UserModule`/`RoleModule`/`PermModule`/`ClientUserModule`）。新增 service
  分支要反查服务目录的 `enabled` 状态，需要额外注入
  `ServiceRegistryService`（在 `system/service-ops/service-registry.service.ts`），
  对应把 `ServiceOpsModule`（或它所在的模块）加进 `auth.module.ts` 的 imports
- **`ServiceRegistryService` 现状没有按单个 key 查询的方法**：只有
  `list()`（返回全部）、`listEmbedEntries()`/`listToolProviders()`/
  `listZoneRoutes()`/`listApiRoutes()`（各自按用途过滤的批量视图）、
  `upsert()`、`remove()`。要查"这个 key 是否存在且 enabled"，要么新增一个
  `getByKey(key)` 方法，要么在自省逻辑里调 `list()` 后本地 `find`——后者
  更省事但每次自省都拉全表，服务数量个位数时可以接受，服务目录变大后
  建议换成前者
- **JWT 签发现状，两套并行、彼此独立**：
  - 全局 `JwtModule`（`shared/shared.module.ts`，`@Global()`）用
    `config.get("jwt.secretkey")` / `config.get("jwt.expiresin")` 做默认
    secret/过期时间，`system/user/user.service.ts` 的 `genToken`/
    `verifyToken` 就是直接用这个全局注入的 `JwtService`（不传 secret 覆盖）
  - `business/client-user/client-user.module.ts` **又注册了一次**
    `JwtModule.registerAsync`，用 `CLIENT_USER_JWT_SECRET`/
    `CLIENT_USER_JWT_EXPIRES_IN` 环境变量，这是 `ClientUserModule` 自己
    模块作用域内的 `JwtService` 实例，和全局那个是两个不同的 provider
  - **设计决定（见 design.md）用第三个共享密钥 `SERVICE_TOKEN_SECRET`**，
    不复用上面任何一个——实现时不需要再注册一个新的 `JwtModule`，直接在
    调用 `jwtService.sign()`/`jwtService.verify()` 时传
    `{ secret: process.env.SERVICE_TOKEN_SECRET, expiresIn: "..." }`
    做单次覆盖即可（`@nestjs/jwt` 的 `JwtService` 支持按调用覆盖 options），
    注入哪个模块的 `JwtService` 都可以，因为 secret 是每次调用显式传入的，
    不依赖模块注册时的默认值

## 1. 签发能力

- [ ] 1.1 `SERVICE_TOKEN_SECRET` 环境变量约定（各服务共享同一份配置，仅经 env 注入，不进配置文件/仓库）
- [ ] 1.2 optimus-api `system/auth` 新增 service token 签发工具函数（复用现有 `JwtService`，`sub=服务key`、`type="service"`、短期有效期）
- [ ] 1.3 `@optimus/server-sdk` 补 `getServiceToken(key)` 方法，封装签发逻辑，业务团队不需要自己拼 JWT payload

## 2. 自省能力

- [ ] 2.1 `auth-introspect.controller.ts` 新增 `type: "service"` 分支：校验签名 → 反查服务目录 `key` 是否存在且 `enabled` → 返回 `{active, service:{key,name}}`
- [ ] 2.2 单测覆盖 spec 中列出的四个场景：签发成功、自省成功、服务下线后自省失败、过期 token 自省失败
- [ ] 2.3 确认新增分支不影响现有 `type:"admin"`/`type:"client"` 分支的既有单测（全量回归跑绿）

## 3. SDK 校验侧支持

- [ ] 3.1 `@optimus/server-sdk` 补 `verifyServiceToken()`（内部调用 `/auth/introspect`，与现有 introspect 封装共享底层 HTTP 客户端）
- [ ] 3.2 更新 SDK 文档/类型定义，明确 service token 与 admin/client token 是三种并列的身份类型，消费方按返回的 `active`/身份类型分支处理

## 4. 验收

- [ ] 4.1 全库搜索 `/auth/introspect` 现有消费方，确认没有代码假设 introspect 返回结构是"只有 admin/client 两种形状"（新增第三种不会导致某处解构出错）
- [ ] 4.2 用一个真实登记在服务目录的服务（如 partner-service）走一遍完整闭环：签发 → 自省成功 → 下线该服务 → 自省失败，作为手工验收
- [ ] 4.3 api 全量单测跑绿，提交、合 main

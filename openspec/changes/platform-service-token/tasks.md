## 实施记录（2026-08-31，已完成）

实现与验收已完成，后续依赖这项能力的变更直接复用以下接口：

- `ServiceTokenService` 位于 `system/auth`，复用平台已有 `JwtService`，使用独立的
  `SERVICE_TOKEN_SECRET` 和短期 `SERVICE_TOKEN_EXPIRES_IN`；不提供公开签发接口，
  服务端 SDK 在本地签发，平台只负责验签和目录状态校验。
- `ServiceRegistryService.getByKey()` 提供单条目录查询，避免自省每次拉取整个目录；
  `ServiceOpsModule` 导出该服务供认证模块使用。
- `/api/auth/introspect` 增加 `type=service` 分支，返回最小身份
  `{active, type: "service", service: {key, name}}`。签名错误、过期、未知 key、
  disabled 服务统一返回 `active:false`；admin/client 分支保持原行为。
- `@optimus/server-sdk` 提供 `getServiceToken(serviceKey)` 和
  `verifyServiceToken(token)`，类型定义包含 admin/client/service 三类身份，并新增
  `README.md` 使用说明。SDK 使用 Node 内置 crypto，不增加运行时第三方依赖。
- 现有 `partner-service` 用户身份 guard 有意不改；它仍使用 admin/client 用户 token。
  只有未来出现无用户上下文的服务间接口时，再在消费服务中调用
  `verifyServiceToken()`。
- 验收：API 13 个 suite/139 个用例、server-sdk 9 个用例通过；真实 HTTP 流程验证
  partner-service “签发 → active → 目录 disabled 后 inactive → 恢复后 active”；
  全库 introspect 消费方没有假设只有 admin/client 两种返回形状。

## 1. 签发能力

- [x] 1.1 `SERVICE_TOKEN_SECRET` 环境变量约定（各服务共享同一份配置，仅经 env 注入，不进配置文件/仓库）
- [x] 1.2 optimus-api `system/auth` 新增 service token 签发工具函数（复用现有 `JwtService`，`sub=服务key`、`type="service"`、短期有效期）
- [x] 1.3 `@optimus/server-sdk` 补 `getServiceToken(key)` 方法，封装签发逻辑，业务团队不需要自己拼 JWT payload

## 2. 自省能力

- [x] 2.1 `auth-introspect.controller.ts` 新增 `type: "service"` 分支：校验签名 → 反查服务目录 `key` 是否存在且 `enabled` → 返回 `{active, service:{key,name}}`
- [x] 2.2 单测覆盖 spec 中列出的四个场景：签发成功、自省成功、服务下线后自省失败、过期 token 自省失败
- [x] 2.3 确认新增分支不影响现有 `type:"admin"`/`type:"client"` 分支的既有单测（全量回归跑绿）

## 3. SDK 校验侧支持

- [x] 3.1 `@optimus/server-sdk` 补 `verifyServiceToken()`（内部调用 `/auth/introspect`，与现有 introspect 封装共享底层 HTTP 客户端）
- [x] 3.2 更新 SDK 文档/类型定义，明确 service token 与 admin/client token 是三种并列的身份类型，消费方按返回的 `active`/身份类型分支处理

## 4. 验收

- [x] 4.1 全库搜索 `/auth/introspect` 现有消费方，确认没有代码假设 introspect 返回结构是"只有 admin/client 两种形状"（新增第三种不会导致某处解构出错）
- [x] 4.2 用一个真实登记在服务目录的服务（如 partner-service）走一遍完整闭环：签发 → 自省成功 → 下线该服务 → 自省失败，作为手工验收
- [x] 4.3 api 全量单测跑绿，提交、合 main

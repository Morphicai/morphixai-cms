## Why

当前所有跨服务调用（partner-service 调 optimus-api 的 OSS/短链、任意子服务校验请求身份）
都走同一条路："借用户自己的 token 转发"——`IntrospectAuthGuard` 把请求者的
`clientAccessToken`/管理员 token 原样递给 `/auth/introspect`。这条路径对
"有真人在操作"的场景够用，但对"没有具体用户背景"的调用完全不适用：定时任务、
队列消费、批量数据同步、服务间的健康/统计查询、事件总线订阅——这些场景没有一个
可以借用的用户 token。

`service-registry`（design.md 第 135 行）和 `extract-partner-service`（design.md
Non-Goals）都已经写好了这个能力的触发条件——"出现无用户上下文的服务间调用"——
只是判断"目前还没出现"就先搁置。现在这个前提已经实质性出现：跨服务用户资料
查询、营销域/订单域拆分后彼此的调用、未来的事件总线开放订阅，都需要服务能
以自己的身份发起调用，而不是冒充一个不存在的操作者。

## What Changes

- 新增"服务身份"这一类主体，与现有的 admin/client 用户身份并列，而不是替代
- 每个登记进服务目录（`op_sys_service_registry`）的服务可以持有一个服务级凭证
  （service token），用于表明"我是哪个服务"而不是"我代表哪个用户"
- `/auth/introspect` 新增 `type: "service"` 分支，返回 `{active, service: {key, name}}`，
  与现有 `type: "admin"` / `type: "client"` 分支并列，互不影响
- 凭证签发与校验采用最小可用方案：基于服务目录里已有的 `key` 派生一个共享密钥
  签名的短期 JWT（复用 `@nestjs/jwt` 现有基础设施），不引入新的证书体系或密钥
  管理组件
- 各服务的鉴权守卫（`IntrospectAuthGuard` 及其在子服务里的本地实现）新增对
  service token 的识别分支，与现有 admin/client 校验逻辑并列

**BREAKING**：无。这是新增能力，不改变任何现有 admin/client 鉴权路径的行为。

## Capabilities

### New Capabilities

- `service-identity-auth`：服务身份的签发、校验、按服务 key 限定可调用范围的能力

### Modified Capabilities

（无——`/auth/introspect` 是新增一个平行分支，不改变 admin/client 分支的既有契约）

## Impact

- `optimus-api`：`system/auth`（新增签发逻辑）、`auth-introspect.controller.ts`
  （新增 service 分支）、`system/service-ops/service-registry.entity.ts`
  （可能新增凭证相关字段）
- `@optimus/server-sdk`：补一个 `getServiceToken()` / 校验 service token 的方法，
  作为后续所有子服务接入这个能力的唯一路径
- 是 `platform-user-profile-query`、未来的事件总线开放订阅、以及
  `extract-marketing-service`/`extract-order-service` 拆分后彼此调用的前置依赖

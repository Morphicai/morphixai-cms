## Context

服务目录（`op_sys_service_registry`）、探测面板、embed 协议、C 端 API 代理这套基建已经跑通，
`extract-partner-service` 也验证了"服务身份委托用户 token 调平台"这条路径能用。但这条路径的
本质是"借用户的信任状态"，对无用户背景的调用完全无解。`service-registry/design.md`
（第 135 行）和 `extract-partner-service/design.md`（Non-Goals）都提前记录了这个缺口，
现在要补上。

约束：
- 单机部署，服务数量个位数，不需要为此引入证书颁发机构或密钥管理服务这类重量级方案
- 现有 `/auth/introspect` 已经是 admin/client 两种身份自省的通用实现，新增 service
  类型要保持同一套调用契约，不能让消费方（子服务）区分"查用户"和"查服务"要走两条
  完全不同的路

## Goals / Non-Goals

**Goals:**
- 子服务能够以"自己是谁"的身份调用平台能力或别的子服务，不需要伪造/借用一个用户 token
- 凭证的签发、校验、限定范围（一个服务的 token 不能被用来冒充另一个服务）
- 与现有 admin/client 鉴权模式并存，互不干扰，`IntrospectAuthGuard` 的判断逻辑只是多一个分支

**Non-Goals:**
- 不做服务身份的精细化权限模型（比如"服务 A 只能调服务 B 的哪几个接口"这种细粒度
  授权）——先解决"有没有"，"够不够细"留到真正出现跨服务越权风险时再收紧
- 不引入服务网格 / mTLS 这类基础设施级方案，本次是应用层的一个 JWT 校验分支
- 不做凭证的自动轮换调度（后续按需补充，本次先给出可以手动触发的最小闭环）

## Decisions

**共享密钥签名的短期 JWT，而不是每服务一对非对称密钥**：复用 `@nestjs/jwt` 现有依赖，
签发逻辑和现有 admin/client token 走同一套 `JwtService`，只是 payload 里的 `type` 字段
不同（`"service"` 而非 `"admin"`/`"client"`）。非对称密钥体系（每服务一对公私钥）更安全，
但对当前"个位数服务、单机部署"的规模是过度设计，且会引入密钥分发/轮换的额外运维成本。
如果未来服务数明显增长或跨可信边界部署，再重新评估。

**`/auth/introspect` 新增 `type: "service"` 分支，不新开一个端点**：消费方（各子服务的
鉴权守卫）已经只认这一个端点，让它们"多传一种 type 参数就能查服务身份"比"再学一个新
端点的调用契约"改动更小。返回结构对齐现有两种类型的形状：`{active: boolean, service:
{key, name}}`，`active: false` 时的语义（token 过期/被吊销/根本不认识这个 key）和现有
admin/client 分支一致。

**服务 key 就是身份，不引入独立的"服务账号"体系**：service token 的 `sub` 直接是
`op_sys_service_registry.key`（已有唯一索引），不新建一张"服务账号表"。校验时反查
服务目录确认这个 key 仍然 `enabled`，被下线的服务的 token 自动失效，不需要额外维护
撤销列表。

**签发方式：服务启动时用共享密钥自签，不走"申请-审批"流程**：每个服务在自己的进程内
用配置好的共享密钥（`SERVICE_TOKEN_SECRET`，环境变量，所有服务共享同一个值）为自己
签发 token，不需要先调 optimus-api 申请。这是"先能用"和"更安全但要多一轮网络调用"
之间的取舍——当前信任边界是"能拿到这份配置的都是我们自己的服务"，共享密钥自签把
签发延迟降到零，且不给 optimus-api 增加"服务注册审批"这类新流程。共享密钥泄露的
影响面见下方风险。

## Risks / Trade-offs

**[风险] 共享密钥一旦泄露，任何拿到密钥的人都能签发任意服务身份的 token**
→ 缓解：密钥只经环境变量注入（沿用现有约定：不进配置文件、不进代码仓库）；
校验时额外反查服务目录的 `enabled` 状态，下线服务后其历史 token 立即失效；
如果后续需要更强隔离，可以升级为按服务分别签发不同密钥（本次不做，先记录路标）

**[风险] 服务身份没有精细权限模型，拿到 service token 即可访问所有对 service 类型开放的接口**
→ 缓解：本次先只在"需要区分是不是有用户上下文"的场景使用（比如
`platform-user-profile-query`），不用来替代现有的 admin RBAC 权限码；后续如果出现
"服务 A 不该调服务 B 的某个接口"的真实需求，再补充按服务 key 的细粒度授权

**[风险] 引入新的鉴权分支可能被现有 admin/client 分支的隐式假设绊倒**
（比如某处代码写死认为"能查到 introspect 结果就一定有 `user` 字段"）
→ 缓解：新增而非修改现有分支的返回结构；落地后全量搜索
`introspect` 消费方的解构模式，确认没有代码假设三种类型的返回结构是同一个形状

## Migration Plan

1. `auth-introspect.controller.ts` 新增 `type: "service"` 分支，独立单测覆盖
2. `@optimus/server-sdk` 补 `getServiceToken()` / `verifyServiceToken()` 方法
3. 现有子服务（partner-service）的 `IntrospectAuthGuard` 保持不动——这次不强制迁移
   任何现有调用去用 service token，只是新增能力，下一个真正需要它的场景
   （`platform-user-profile-query`）来了再用
4. 回滚：因为是纯新增分支，出问题直接下线这个分支即可，不影响 admin/client 现有路径

## Open Questions

- 共享密钥要不要现在就设计成"每个服务一个密钥"而不是全局共享一个——本次先用全局共享
  （见 Decisions），如果安全评审认为风险不可接受，需要在实现前重新讨论

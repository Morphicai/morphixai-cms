# 交接文档 — 中台分层架构与 8 个待实施变更

> 写给接手这项工作的下一个 session / agent。
> 最后更新：2026-08-31，交接时 `main` 分支，`platform-service-token` 已完成，
> 新增 `platform-gateway-topology`（核查网关/跨服务身份透传现状时发现的缺口），
> 其两处范围决策（B 端可达范围、网关实现方式）已由用户拍板关闭，design.md
> 已按拍板结果重写，可以直接进入实施而不需要再确认这两条。

## 一、当前位置

**分支**：`main`，与 `origin/main` 同步。历史上 15 个 feature 分支全部已合并，
没有进行中的代码分支。

**最近一次实质交付**：`bb290b0` — partner-service 拆分完成（第一个真实业务子服务
迁出 optimus-api）。详见 `openspec/changes/extract-partner-service/`。

**这次交接带来的东西**：8 个 openspec 变更的完整四件套（proposal / design /
specs / tasks），全部 `openspec validate` 通过。其中 `platform-service-token` 已
完成实现，其余 7 个变更尚未开始写代码。

## 二、为什么会有这 8 个变更（背景，不要跳过）

partner-service 拆分暴露了两类问题，事后核查"是否具备统一网关"时又暴露了第三类，
这 8 个变更是针对性的解法：

**问题一：耦合债务。** partner 模块直接 `@InjectRepository` 了 points-engine 的
`TaskCompletionLogEntity` 做统计聚合，还伴随 `forwardRef` 循环依赖。这在两个模块
同属一个团队时能跑，但如果按"不同业务团队维护不同模块"来分，这种写法物理上就不
成立（不同仓库、不同进程，编译期直接断）。`reward-claim-record` 对 `activity` 的
原生 SQL `innerJoin` 是同一类问题的另一处实例。

**问题二：能力缺口。** 所有跨服务调用都走"借用户 token 转发"这一条路。对"有真人
在操作"的场景够用，但定时任务、队列消费、批量同步这类**没有用户背景**的调用完全
无解。同时也没有"按 uid 查任意用户资料"的能力，导致 partner-service 只能在自己表里
存一份创建时的 username 快照——这份快照不会跟着主表更新，是已验证的数据漂移案例。

**问题三：部署拓扑没跟上架构。** partner-service 拆分完成、8 个变更定完计划后，
分析"是否具备统一网关""跨服务用户身份能否正常透传"这两个问题时，发现唯一的
生产网关配置（`Caddyfile` + `docker-entrypoint.sh`）自项目初始化提交后**从未被
修改过**——比 Multi-Zones、agent-service、service-registry、partner-service
拆分全部更早。它把 `/api/*` 硬编码转发到 optimus-api，拦在 optimus-next 自己
的服务目录驱动动态代理之前（partner-service 的路由在生产拓扑下已经因此失效），
也从没启动/暴露过任何一个拆出去的独立服务。详见 `platform-gateway-topology`。

## 三、已确认的架构决策（不要重新讨论）

分层：

- **L0 接入层** — optimus-ui / optimus-next / zone-activity + embed 宿主。
  只做渲染、路由分发、iframe 挂载，不含业务逻辑。
- **L1 中台基础能力层** — 中台团队独占维护，业务团队只消费。分"核心契约（强制）"
  和"通用能力（可选）"。
- **L2 业务领域服务层** — 按业务属性划团队，只暴露 HTTP 接口给彼此。

四个业务域：

| 域 | 模块 | 状态 |
|---|---|---|
| 营销域 | activity / appointment / reward-claim-record | 仍在 optimus-api 单体内，待拆 |
| 订单域 | order | 仍在 optimus-api 单体内，待拆 |
| 合伙人增长域 | partner-service（partner / points-engine / external-task） | 已独立进程 |
| 商业合作域 | contact | 仍在 optimus-api 单体内，暂不拆 |

业务团队之间的边界规则：

- **允许**：调用对方 HTTP 接口、订阅对方领域事件（能力就绪后）、通过 L1 SDK 获取平台能力
- **禁止**：直接 `@InjectRepository` 别的业务模块的 entity、原生 SQL 跨表 JOIN
  别的业务的表、裸写 HTTP 调 `/auth/introspect`

四项已拍板的决策（由用户确认，**不要再当作待讨论项**）：

1. **client-user 归属** — 语义上归中台，但**代码位置维持不动**，只在文档层面约定
   边界。跨服务用户资料查询接口未来仍由 client-user 现有代码提供，只是对外要按
   L1 标准设计（鉴权 / 限频 / 契约稳定性）。
2. **营销域 / 订单域** — 按团队分工计划**直接排期物理拆分**，不等团队真正接手，
   复用 extract-partner-service 踩出来的迁移路径。
3. **agent-service** — 归入 L1 通用能力，所有业务团队平等消费，不归属任何单一业务。
4. **SDK 强约束** — 不是"建议使用"，是"不这样做过不了检查清单"。要同时做两件事：
   把 SDK 做全做顺手（补 `@optimus/platform-client`），以及把约束落到代码评审 /
   CI 静态扫描这类可执行手段上。

## 四、8 个变更与依赖顺序

严格按此顺序实施，括号内是依赖：

| # | 变更 | 内容 | 任务数 |
|---|---|---|---|
| 1 | `platform-service-token` | 服务身份调用凭证 | 11 |
| 2 | `platform-environment-info` | 环境信息查询（根域名 / cookie 域） | 5 |
| 3 | `platform-client-sdk` | `@optimus/platform-client` + SDK 强约束（依赖 ②） | 11 |
| 4 | `embed-submenu` | 服务目录支持一个服务多子菜单 | 9 |
| 5 | `platform-user-profile-query` | 跨服务用户资料查询（依赖 ①） | 9 |
| 6 | `platform-gateway-topology` | 生产网关拓扑修正（松耦合于 ②，其余独立） | 见 tasks.md |
| 7 | `extract-marketing-service` | 营销域物理拆分（依赖 ③⑥） | 24 |
| 8 | `extract-order-service` | 订单域物理拆分（依赖 ③⑥，建议晚于 ⑦） | 23 |

①②④⑥ 彼此独立可并行（⑥ 用到 ② 的环境信息概念，但不是硬依赖）。
⑥ 排在 ⑦⑧ 之前是有意的：每多拆一个服务，网关/部署拓扑不认识新服务这个
问题就重演一次，现在（只有 partner-service 一个真实案例）修复成本最低。
⑦ 排在 ⑧ 之前的理由不变：营销域内部耦合更简单，订单域涉及支付回调这条
收入关键路径，先用营销域验证一遍迁移路径 + SDK 强约束 + 新网关拓扑。

## 五、已完成：`platform-service-token`

已完成：`SERVICE_TOKEN_SECRET` 仅经环境变量注入；API 侧通过
`ServiceTokenService` 用 HS256 签发/验签短期 JWT；`/auth/introspect` 新增
`type=service` 分支并反查 `op_sys_service_registry.enabled`；`@optimus/server-sdk`
提供 `getServiceToken()` 与 `verifyServiceToken()`。不要把这项重新当成待开发任务。

真实验收脚本验证了 partner-service 的目录状态切换。当前有意不改 partner-service
现有用户身份 guard，也没有公开签发接口；下一个真正需要服务身份的接口再接入
`verifyServiceToken()`。

## 六、接手前必读的项目约定

- **CLAUDE.md 已过时** — 它说 monorepo 有 4 个包，实际有 11 个
  （admin-embed / agent-service / auth-ui / client-sdk / common / optimus-api /
  optimus-next / optimus-ui / partner-service / server-sdk / zone-activity），
  且完全没提 partner-service。技术栈表和架构章节都停留在拆分之前的状态，
  参考时注意甄别。**这本身是一项待办**，但不在这 8 个变更的范围内。
- **`Caddyfile`/`docker-entrypoint.sh` 是化石文件，不要参考它们理解现在的
  拓扑** — `git log -1` 显示两者自 2026-01-01 `init project` 后从未被改过，
  只认识 optimus-api/optimus-ui/optimus-next 三个进程，`/api/*` 硬编码转发
  到 optimus-api。这是 `platform-gateway-topology` 要修的对象，实施前不要
  假设它反映了当前的服务拓扑。
- **TASKS.md** 是迭代级的进展记录，比 CLAUDE.md 新，优先看它。
- **启动要点在 CLAUDE.md 的"启动要点（踩过的坑，换机必读）"一节**，那部分仍然有效。
- 每个 openspec 变更的 `design.md` 里都有 Risks / Open Questions 章节，
  实施前务必读完——有几处是**故意留给实施者确认的**，不是遗漏：
  - `platform-user-profile-query`：要不要限定"哪些服务能查全量用户资料"，
    这条没有拍板，实施前必须先定，直接影响接口鉴权实现。
  - `platform-gateway-topology`：**两个原本悬空的问题已由用户拍板关闭**——
    ① B 端 embed 管理页的可达范围**统一跟随管理后台整体**，不做"内网/
    VPN-only"这种差异化限定（此前 design.md 推荐的内网方向已被否掉，
    理由是会造成"权限够但因为不在 VPN 里进不去某个具体页面"的可用性
    陷阱）；② **C 端确定不经过 Caddy**，`optimus-next` 自托管为直接入口；
    管理后台这条线保留精简版 Caddy，每个 embed 服务各自配一个公网子域名
    站点配置。`design.md` 已按这两条决策重写，`op_sys_service_registry`
    不再需要新增可达范围字段。
  - `extract-order-service`：支付回调地址迁移后不能断，是本次风险最高的点，
    这条已归入 `platform-gateway-topology` 统一处理，不再是独立悬空的
    问题——但正式切流前仍需要在该变更完成后单独验证一遍回调路径没有变化。
  - `extract-marketing-service`：`ActivityService` 现有方法是否覆盖
    reward-claim-record 那处原生 JOIN 所需的全部字段，要读代码确认，不要在
    设计阶段猜测。

## 七、验证方法论（partner-service 迁移中沉淀，值得复用）

`packages/partner-service/scripts/verify-closed-loop.mjs` 是一个可长期复用的
回归脚本模式：打真实运行中的多进程实例（不是 mock，也不是单服务隔离的 e2e 框架），
33 项断言覆盖 C 端全流程 + 管理端全流程 + 跨端账本一致性。

这套方法解决的问题是：单服务隔离的 e2e 框架测不出"跨服务代理分流是否真的接通"。
后续两个拆分变更（⑦⑧）的 tasks.md 里都要求复用这个结构。

**另一条经验**：迁移本质上是给沉睡多年的代码路径做第一次真实体检。partner-service
这次挖出的 bug（表名前缀漏写、审计表从未建过、鉴权守卫挂错类型、`depth` 参数被
硬编码忽略）全部集中在"业务代码从来没有被真实调用路径触达过"这个模式上。
下一个业务模块迁移大概率还会挖出类似的旧账，**应该提前预留验证时间，
不要按"纯搬运"估工时。**

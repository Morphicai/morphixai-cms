## Context

服务端微服务基建(服务目录 `op_sys_service_registry`、探测面板、embed 动态菜单、agent 工具发现、`/auth/introspect` token 自省)在此前几个迭代里已经搭好并跑通过两个消费者:demo-activity(纯演示,零业务逻辑)、zone-activity(纯前端 zone,不涉及后端业务数据)。partner/points-engine/external-task 是第一个要迁的**真实业务模块**——它们有真实的 controller/service/entity/DTO,有跨模块调用,有存量单测,迁移过程会真正考验这套基建"接一个正常大小的业务模块"是否顺畅,而不只是"接一个 demo"。

已用代码验证的现状(不是推测):
- `partner` 零跨业务依赖(仅依赖 shared/system),三张表(profile/channel/hierarchy)均 0 行
- `points-engine` 依赖 `partner`,仅 `points.controller.ts` 里 4 处只读调用(`getProfileByUserId`/`getProfileById`);自身只有一张实体表 `TaskCompletionLogEntity`(`op_biz_task_completion_log`),积分余额是事件溯源(汇总该表算,不存字段)
- `external-task` 依赖 `partner`(读 profile)和 `points-engine`(`approveSubmission` 调 `taskEngineService.processExternalTaskEvent` 写积分事件);自身表 0 行
- `partner_profile.totalMira`/`currentStar` 是另一套存储式账本,唯一写口(`update-mira`/`update-star`)全局零调用方——是被事件溯源方案取代后遗留的死代码
- `op_biz_task_completion_log` 表从未在任何环境建过(dev.yml 默认 `synchronize:true`,但 `.env` 显式 `DB_SYNCHRONIZE=false` 覆盖,仓库里也没有配套的建表 SQL),导致 dashboard 统计接口(读)和外部任务审批接口(写)两条路径当前均 500
- `/auth/introspect`(`auth-introspect.controller.ts`)已经是通用实现,`type:"admin"` 分支返回 `{active,user:{id,type,...},perms:[]}`,`type:"client"` 分支返回 `{active,user:{id,username,...}}`——两种身份自省都不用新开发,直接复用

## Goals / Non-Goals

**Goals:**
- 把 partner + points-engine + external-task 整体迁到独立进程 `packages/partner-service`,作为第一个真实业务子服务
- 迁移前修好两处设计断裂(孤儿写口、缺失的表),不把坏设计带进新服务
- 用这次迁移验证四件事:embed 动态菜单接入是否顺畅、introspect 鉴权模式套在真实业务接口上是否够用、agent 工具发现是否需要跟着迁、探测面板接入新服务是否符合既有约定
- 存量被屏蔽的 9 个单测随迁移修复,不再屏蔽

**Non-Goals:**
- 不拆分数据库——新服务与主服务继续连同一个 MySQL 实例,各自维护自己的 TypeORM 连接。这是有意的阶段性选择:先验证代码/进程边界,数据边界留到真正需要独立伸缩或独立备份策略时再做
- 不引入 service token——points→partner 的调用迁移后落在同一个新进程内(未跨服务边界),沿用进程内调用即可;哪天这三个模块自己也要拆开才需要
- 不做生产部署编排(compose/k8s)——新服务和现有几个服务一样,dev 阶段用 `pnpm dev` 本地起
- 不改变这三个模块对外的业务行为契约(接口语义、返回结构不变),只改变承载它们的进程边界和鉴权方式
- **不修复"加入合伙人计划"的产品缺陷**:排查 C 端时发现 `/profile` 页"加入合伙人计划"按钮跳到 `/business-demo`,而该页面①在生产环境被 `DEBUG_PREFIXES` 拦截 404,②即便在 dev 环境打开也没有真正的加入合伙人表单——这是一个独立于本次迁移的产品未完成项(功能从未真正建成,不是迁移引入的回归)。本次只保证"已经能工作的部分"(已是合伙人时查看状态、查积分)迁移后继续工作,不在这次顺带把这个功能建完

## Decisions

### 1. 新服务是"小号 optimus-api"，不是"大号 agent-service"
`agent-service` 是纯 Express + ESM 的轻量进程,适合它自己的场景(几个薄路由转发给 pi-agent-core)。但 partner-service 要迁移的是一整套 Nest controller/service/entity/DTO/class-validator 校验,直接照搬这套代码最省事也最不容易引入行为差异。**决策:partner-service 是一个独立的 Nest 应用**,`main.ts`/`app.module.ts` 参照 `optimus-api` 的启动方式,只是模块清单精简到只有 partner/points-engine/external-task 三个业务模块 + 一个本地鉴权 guard。
- 备选方案:把这三个模块做成 optimus-api 的一个可插拔子模块,运行时按 flag 决定是否本地加载——否决,这样达不到"独立进程、独立部署"的验证目的,只是换了个开关的单体。

### 2. 鉴权用 introspect,不搬 UnifiedAuthGuard
`UnifiedAuthGuard` 依赖 `optimus-api` 本地的 `UserService`/`AuthService`/`ClientUserService`(直接查库拿 JWT payload、查 perms),这些依赖搬不出来——搬了等于把整个用户体系也复制一份,数据双写风险巨大。**决策:partner-service 写一个轻量 `IntrospectAuthGuard`**:
  1. 从请求头/cookie 取 token
  2. 调 `POST {OPTIMUS_API_URL}/auth/introspect`(`type` 按接口类别传 `admin` 或 `client`,已验证两种类型都有现成实现)
  3. `active:false` 直接 401;`active:true` 时,ADMIN 类接口沿用主服务这次收紧确立的 fail-closed 语义——没挂 `@Perm`/`@AllowNoPerm`/`@RequireSuperAdmin` 一律拒绝,挂了 `@Perm` 就比对 introspect 回来的 `perms` 数组,`user.type===SUPER_ADMIN` 直接放行
  4. CLIENT 类接口(合伙人查自己积分等)只需要 `active:true`,不做权限码比对(和主服务现有的 `@ClientUserAuth()` 语义一致)
- 权限码(`PartnerManagement`/`PartnerDataManagement`/`ExternalTaskReview`)由主服务的 `op_sys_role_menu` 继续做唯一事实源,partner-service 不维护自己的权限表——查权限这件事没有下放,只有"查完权限之后怎么校验"下放了
- 代价:每个请求多一次到主服务的网络往返(~几毫秒,dev 环境同机可忽略);`/auth/introspect` 本身有 60 次/分钟的 IP 限频,partner-service 作为管理后台的调用方(人操作,不是高频轮询)不会撞到这个限制,但如果以后 embed 页面出现高频轮询式调用,需要重新评估——先记录，不在本次处理

### 3. 三模块整体迁移,不拆成三个服务
已验证的依赖图:points-engine→partner(4处只读)、external-task→partner+points-engine(1处写)。三者耦合度不算低,拆成三个独立服务只是把进程内函数调用换成三次网络调用外加三套鉴权配置,除了增加运维复杂度和引入需要 service token 的场景外没有实质收益。**决策:一个新进程装三个业务域**,内部仍是普通的 Nest module 依赖注入调用。

### 4. 落地前修复两处断裂,不带着坏设计走
- `update-mira`/`update-star`:全局零调用方,是被事件溯源方案取代后的遗留写口。**删除**,不带进新服务。如果将来真的需要"运营手动修正积分"这类操作,应该基于事件溯源模型设计一条新的修正记录写入路径(补一条负向/修正 `TaskCompletionLogEntity` 记录），而不是恢复一个绕过账本直接改字段的口子
- `op_biz_task_completion_log`:随迁移在 partner-service 补一份正式建表迁移脚本(不依赖 `synchronize`),让 dashboard 统计和审批发放两条路径在新服务里从一开始就是好的

### 5. C 端 API 代理必须变成"多后端感知",这是本次迁移能否成立的前提
排查 `optimus-next`(C 端主站)后发现一个此前设计遗漏的关键事实:`/profile` 页面是**真实生产页面**(不在 `DEBUG_PREFIXES` 里),它的"合伙人状态"卡片调 `partnerService.getProfile()`、"积分概览"卡片调 `pointsService.getMyPoints()`,这些调用最终落在 `packages/optimus-next/src/app/api/[...path]/route.ts`——一个**单后端硬编码**的 catch-all 代理,固定把 `/api/*` 转发到 `OPTIMUS_API_URL`(即 8084)。一旦 partner/points/external-task 从 optimus-api 删除,这个代理还傻转到 8084,C 端合伙人卡片和积分卡片会直接 404/502。

这和 zone 路由此前面对的问题是同一类:C 端需要按路径前缀把请求分流到不同后端,而不是死认一个上游。**决策:复用 `optimus-next/src/proxy.ts` 里已经验证过的"TTL 拉服务目录 + 路径前缀匹配"模式**,扩展到这个 API 代理:
- 服务目录条目新增一个可选的 `apiPathPrefixes: string[]` 字段(与 `pathPrefix` 是同名不同用途的两个概念——`pathPrefix` 管页面级 zone 路由,`apiPathPrefixes` 管 API 级请求路由,一个服务两者都可以有),partner-service 登记 `apiPathPrefixes: ["/biz/partner", "/biz/points", "/external-task"]`
- `ServiceRegistryService` 新增 `listApiRoutes()` 消费视图(结构与 `listZoneRoutes()` 一致:`{key, prefix, baseUrl}[]`),同样走匿名只读口(可复用或扩展 `/api/public/zone-routes` 为更通用的路由表接口,或新增 `/api/public/api-routes`——倾向后者,语义更清楚,避免一个接口塞两种不相关的路由表)
- `/api/[...path]/route.ts` 改造:按 60s TTL 拉这份路由表(逻辑与 `proxy.ts` 里的 `getZoneRoutes`/`matchZone` 同构,可抽成共享函数或直接复制一份——两处都是 Next 生态但一个是 middleware 一个是 route handler,运行时环境不完全等价,先复制,如果后续还有第三处需要再抽公共包),命中前缀转发到对应服务的 `baseUrl`,未命中前缀维持原有行为转发到 `OPTIMUS_API_URL`
- 备选方案(strangler-fig:C 端继续只认 optimus-api,由 optimus-api 内部反向代理到 partner-service)——否决,因为这样"迁移"只是換了内部实现,optimus-api 仍然是这些路由对外的唯一入口,不构成真正的服务边界迁移,也不测试服务目录驱动路由这个能力

### 6. 端口与目录接入形态
- 新服务开发端口 `8089`(现有占用:8082 ui / 8084 api / 8086 next / 8087 agent / 8088 zone-activity / 5190 demo-iframe)
- 服务目录登记 `entryType=embed`,`embedUrl` 指向新服务自己渲染的一组管理页(партner-admin 看板/points 调试页/external-task 审核页),沿用 `EmbedFrame` 现有握手协议(`optimus:ready`→`optimus:handshake` 拿 token/user/perms,`optimus:refresh-token` 走 token 刷新)不需要改协议本身
- `healthPath`/`metricsPath` 按现有约定暴露(参照 `agent-service` 的 `/metrics-lite` 与 `optimus-api` 的 `request-stats` 同形实现),接入探测面板

## Risks / Trade-offs

- **[风险] C 端代理切换出现窗口期不一致** → 部署顺序上,新服务的目录条目(含 `apiPathPrefixes`)必须先登记生效,`optimus-next` 代理确认能正确分流后,才能删除 optimus-api 侧的对应模块;顺序反了会有一段时间 C 端合伙人/积分卡片报错。实现阶段把这个顺序写进 tasks 的验收步骤,不能并行合并
- **[风险] 迁移期间路径变化影响未知调用方** → 已用代码搜索确认这三个模块的 service 在 optimus-api 其余部分零调用方,但实现阶段仍需在删除前做一次全量引用检查兜底（`grep -rl "business/partner\|business/points-engine\|business/external-task"`），确保没有遗漏
- **[风险] introspect 引入的网络往返增加管理页操作延迟** → dev/单机环境可忽略；如果后续要接入更多需要频繁鉴权检查的场景，可以在 partner-service 内部加短 TTL 的 introspect 结果缓存（本次不做，先看真实延迟数据再决定要不要加）
- **[风险] 共用数据库意味着 schema 变更仍需要跨代码库协调** → 这是"先分进程、再分数据"这条路径本来就接受的过渡态权衡，不试图在这次解决；两个服务各自的 TypeORM 实体如果对同一张表的字段定义产生分歧，会在运行时才暴露——迁移时把 entity 定义原样搬过去，不在这次顺便改字段，降低这个风险的触发面
- **[风险] 存量 9 个跳过的单测修复工作量可能超预期（这些测试引用了从未存在过的 API，如 JoinMode）** → 如果修复过程中发现某个测试断言的功能确实从未实现过，需要判断是"修代码实现使其达标"还是"改测试断言匹配真实行为"，这个判断放到 tasks 阶段做，不在 design 阶段假设结论
- **[权衡] 删除 update-mira/update-star 是破坏性变更** → 已确认零调用方，风险可控；proposal.md 已标注 **BREAKING**

## Migration Plan

1. 建 `packages/partner-service` 骨架（Nest 应用 + `IntrospectAuthGuard` + 数据库连接配置）
2. 把 `op_biz_task_completion_log` 建表迁移脚本先在 optimus-api 侧验证跑通（确认 dashboard/审批两条路径不再 500），再原样带到 partner-service
3. 删除 `partner.controller.ts` 的孤儿写口
4. 把 partner/points-engine/external-task 的 controller/service/entity/DTO/module 整体搬到新服务(此时 optimus-api 侧先不删,双跑)
5. 新服务登记进服务目录（`entryType=embed` + `apiPathPrefixes`），`optimus-next` 的 API 代理确认按新路由表正确分流到新服务(浏览器验证 `/profile` 页合伙人状态+积分概览两张卡片仍正常),`optimus-ui` 的静态路由节点下线，改走 `/embed/:serviceKey`
6. 确认代理分流生效、新服务功能验证通过后，才删除 `optimus-api` 里对应目录，`jest.unit.config.js` 的屏蔽条目一并移除——**这一步必须在第 5 步验证通过之后**，避免中间状态 C 端断链
7. 修复随迁移带过去的 9 个存量单测
8. 探测面板确认新服务健康检查绿；浏览器完整验证管理页操作、C 端积分查询、`/profile` 页两张卡片
9. 回滚策略：迁移在 openspec 的 feature 分支上进行，验收不过直接不合并；已经合并后如需回滚，因为数据库表结构变更（新建 `op_biz_task_completion_log`）是可加不可减地兼容 optimus-api 单体运行，回滚只需要恢复 `packages/optimus-api` 里被删除的模块代码（git revert）+ 停用服务目录里的 embed 条目，不需要数据迁移回滚

## Open Questions

- external-task-admin 的 approve/reject 操作目前走 `OperationLog` 拦截器记录审计日志——这套拦截器实现在 optimus-api 的 shared 层，partner-service 是否需要一份自己的操作日志能力，还是接受"迁移后这三个模块的操作日志能力暂时缺失"作为已知代价？倾向后者（后续如需要，可以复用这次积累的"service.registered 事件 outbox"经验补一个轻量版本），留到 tasks 阶段做最终判断

已收敛（不再是 open question）：三个模块当前**没有**agent 工具声明（`grep` 确认 partner/points-engine/external-task 目录下无 `toolsPath`/`AgentTool` 相关代码），tasks 里不强求"迁移工具声明"这一步，`toolsPath` 字段在服务目录登记时留空即可——等这三个模块真的需要暴露 agent 工具时再补，不为了走完基建全套而无中生有。

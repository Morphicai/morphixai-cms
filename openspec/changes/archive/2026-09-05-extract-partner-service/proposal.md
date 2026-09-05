## Why

服务端微服务基建(服务目录/探测/embed 动态菜单/agent 工具发现)已闭环,但从未接过一个真实业务模块——目前挂进目录的只有 demo-activity(纯演示)和 zone-activity(纯前端 zone)。partner/points-engine/external-task 三个模块是现成的候选:三张业务表均 0 行,数据量为零,搬迁风险最低;同时这三个模块本身带着两处未解决的设计断裂(积分双账本不通、`op_biz_task_completion_log` 表从未建过导致两条路径 500),继续放在单体里只会让这些问题继续被绕过而不是解决。借这次迁移一次性把设计断裂修好,再把三个模块整体迁出为第一个真实业务子服务,用真实场景验证服务目录/embed 接入/introspect 鉴权/agent 工具发现这套基建是否真的好用。

## What Changes

- 新建独立 Nest 服务 `packages/partner-service`(参照 `packages/agent-service` 的项目结构),承载 partner + points-engine + external-task 三个业务域的 controller/service/entity,继续连同一个 MySQL 实例(不拆库)
- 落地前修复两处存量设计断裂:
  - 删除 `partner.controller.ts` 里孤儿的 `update-mira`/`update-star` 写口(全局零调用方,与 points-engine 的事件溯源账本是两套互不相通的设计,确认为废弃遗留)
  - 补 `op_biz_task_completion_log` 建表迁移脚本(此表此前从未在任何环境创建,导致 dashboard 统计接口与外部任务审批接口两条路径当前均 500)
- 新服务登记进现有服务目录(`op_sys_service_registry`):`entryType=embed`,管理页(partner-admin/points/external-task-admin)改走 `/embed/:serviceKey` 动态入口,复用既有 `EmbedFrame` 握手协议
- C 端接口(合伙人查自己积分等)鉴权方式从"同进程读 `req.clientUser`"改为"调主服务 `POST /auth/introspect` 换身份"(复用 zone-activity 已验证的 introspect 模式)
- 若三模块当前有 agent 工具声明,一并迁移并登记 `toolsPath`;探测按现有约定接入 `healthPath`/`metricsPath`(参照 agent-service 的 `/metrics-lite`)
- 存量 9 个被 `jest.unit.config.js` 屏蔽的 partner/points-engine 测试随迁移一并修复,不再屏蔽——屏蔽清单本身就是这次迁移范围的对账单
- **BREAKING**:`packages/optimus-api` 里的 partner/points-engine/external-task 模块(controller/service/entity/module)整体删除,原有直接挂在主服务下的路径(`/biz/partner/*`、`/biz/points/*`、`/admin/external-task/*`)不再由主服务提供,改由新服务通过 embed 入口访问;主服务内其他模块若曾直接 import 这三个模块的 service(现状是零调用方,已用代码验证),预期无联动破坏,但仍需在实现阶段跑一次全量引用检查兜底

## Capabilities

### New Capabilities
- `partner-service`: 独立的合伙人/积分/外部任务子服务——承载原 partner + points-engine + external-task 三个业务域,包括合伙人档案与层级管理、渠道管理、积分账本(事件溯源)、外部任务提交与审核发放,通过服务目录动态接入管理后台并对外提供 C 端能力(经 introspect 鉴权)

### Modified Capabilities
(无——本次迁移不改变既有能力的行为契约,只改变承载它们的服务边界;服务目录/embed 接入/探测这套微服务基建本身已在此前迭代中作为既定能力落地,这次是它的首个真实消费者)

## Impact

- **代码**:新增 `packages/partner-service/`;删除 `packages/optimus-api/src/business/{partner,points-engine,external-task}/` 及相关 controller/service/entity/module/spec;`packages/optimus-api/jest.unit.config.js` 移除对应的 `testPathIgnorePatterns` 条目
- **数据库**:`op_biz_partner_profile`/`op_biz_partner_channel`/`op_biz_partner_hierarchy`/`op_biz_external_task_submission` 四张表(均 0 行)+ 新增 `op_biz_task_completion_log` 建表迁移;数据库实例不拆分,新服务与主服务共用同一个 MySQL 连接配置(各自维护自己的 TypeORM 连接)
- **服务目录**:`op_sys_service_registry` 新增一条 `entryType=embed` 记录
- **前端**:`packages/optimus-ui` 里 partner-admin/points/external-task-admin 相关页面改为经 `/embed/:serviceKey` 动态菜单访问,原静态路由节点下线(参照 demo-activity 迁移时的做法)
- **权限**:上一轮权限收紧迭代里给这些 controller 配的权限码(`PartnerManagement`/`PartnerDataManagement`/`ExternalTaskReview`)随迁移保留语义,但校验点从主服务的 `UnifiedAuthGuard` 变为新服务自己的鉴权(经 introspect 换取用户 perms 后本地校验,或沿用类似的 fail-closed 模型)

## Context

`extract-partner-service` 已经验证了一整套迁移路径：落地前修复 → 服务目录扩展
（API 路径路由）→ 骨架搭建 → 业务搬迁 → 服务目录接入与分流验证 → 删除原代码 →
存量单测迁移 → 验收，且过程中沉淀了一个可复用的自动化闭环验证脚本模式
（`verify-closed-loop.mjs`）。本次直接复用这套路径，不重新设计。

与 partner-service 的差异：营销域三个模块内部耦合更简单——activity、appointment
互相独立，只有 reward-claim-record 依赖 activity（且这个依赖里混了一处绕开
service 接口的原生 SQL JOIN，需要先清理）。没有 partner-service 那种
`forwardRef` 循环依赖和跨模块直接注入 repository 的情况。

## Goals / Non-Goals

**Goals:**
- 三个模块整体迁移为独立服务，功能行为不变
- 落地前把 reward-claim-record 对 activity 的原生 SQL JOIN 改为正规接口调用——
  这不只是代码整洁问题，是"业务团队之间禁止原生 SQL 跨表 JOIN"这条边界规则第一次
  在物理拆分前被真正验证：如果不改，拆分后这个 JOIN 会直接失败（不同进程、
  可能不同数据库连接池，且违反了团队边界规则）
- 验证 `platform-client-sdk` 的强约束在真实迁移场景下是否好用（这是决策④
  上线后第一个消费方）

**Non-Goals:**
- 不在本次新增待补齐清单里列出的能力（优惠券引擎、渠道归因、活动数据看板）——
  那些是后续独立的功能性变更，本次只做物理拆分
- 不解决订单域拆分（`extract-order-service`），本次只覆盖营销域，且建议在本次
  完成后再开始订单域，复用本次踩出的经验
- 不引入服务间事件订阅机制，三个模块内部依然是同进程直接调用（activity ←
  reward-claim-record 的依赖关系迁移后仍在同一个 marketing-service 进程内）

## Decisions

**三个模块合一部署为一个服务，不是拆成三个独立进程**：与 `partner-service`
把 partner/points-engine/external-task 合一部署是同一个判断——这三个模块共享
"营销"这一个业务属性和团队归属，拆成三个进程只会增加不必要的部署/联调成本，
没有实际的隔离收益。

**reward-claim-record 对 activity 的调用在迁移前先修，不带着原生 JOIN 迁移**：
即使迁移后两者仍在同一个服务进程内（不构成真正的跨服务调用），这条 JOIN 违反
"不允许原生 SQL 跨表 JOIN、只能通过 service 接口访问其它业务模块数据"的团队
边界规则本身——按 `partner ↔ points-engine` 的反面案例教训，"同进程能跑不代表
应该这样写"，借这次迁移的机会一并修正，而不是把技术债带到新服务里。

**沿用 partner-service 的自动化闭环验证脚本模式，不重新设计验证方法**：
`verify-closed-loop.mjs` 证明了"打真实运行中的多进程实例，覆盖 C 端全流程 +
管理端全流程 + 跨端一致性"这套方法有效，本次直接复用同样的结构（针对营销域
三个模块调整具体断言内容），不需要重新摸索验证思路。

## Risks / Trade-offs

**[风险] reward-claim-record 的原生 JOIN 修复可能暴露 ActivityService 现有接口
不足以支撑这个查询场景（比如需要的字段 `ActivityService` 没有暴露）**
→ 缓解：先读现有 JOIN 的具体查询字段，评估 `ActivityService` 是否需要新增
一个方法来支撑，这属于"落地前修复"阶段要处理的范围，参照
`extract-partner-service` Group 1 的做法——先在 optimus-api 里修好、验证行为
不变，再随迁移带走

**[风险] activity/appointment 两个模块虽然现状无耦合，但迁移过程中可能发现
隐藏的历史遗留问题（类似 partner-service 迁移中发现的表名前缀漏写、鉴权守卫
挂错类型等）**
→ 缓解：按 `extract-partner-service` 建立的验证方法论——迁移过程中发现的
零风险历史缺陷可以顺手修复并记录，不属于"迁移引入新 bug"，但要在 tasks.md
里如实记录发现和修复过程

## Migration Plan

复用 `extract-partner-service` 的八阶段路径（落地前修复 → 骨架搭建 → 业务搬迁 →
服务目录接入验证 → 删除原代码 → 存量单测迁移 → 验收），具体任务分解见
tasks.md。

## Open Questions

- reward-claim-record 依赖的 `ActivityService.validateActivity`/`findByCode`
  是否已经覆盖原生 JOIN 查询所需的全部信息，还是需要新增方法——需要在
  "落地前修复"阶段实际读代码确认，不在设计阶段猜测
- 本变更完成后拆出的 marketing-service 如何在生产环境被真正启动、C 端
  流量如何正确路由到它——这不是本变更自己的问题，由 `platform-gateway-
  topology` 统一解决，本变更的"落地前修复"阶段不需要重复处理，但正式
  切流前需要确认该前置变更已完成

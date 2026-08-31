## Why

按业务属性划分的架构决策已确认：营销域（activity / appointment /
reward-claim-record）由独立团队维护，参照 `extract-partner-service`
（第一个真实业务子服务迁移）验证过的迁移路径直接排期物理拆分，而不是等真的有
独立团队接手才拆。这三个模块目前在 optimus-api 单体内彼此没有跨业务耦合问题
（除了 reward-claim-record 对 activity 的调用，且其中一处是绕开 service 接口的
原生 SQL 跨表 JOIN），是营销域/订单域两个待拆分域里耦合更干净的一侧，适合作为
第二个物理拆分的业务子服务、也是第一个真正落地"新服务从第一天起强制走
`@optimus/platform-client` SDK"（决策④）的验证场景。

## What Changes

- 新建独立 Nest 服务 `packages/marketing-service`（参照 `partner-service` 的项目
  结构），承载 activity / appointment / reward-claim-record 三个业务域的
  controller/service/entity，数据库表继续用同一个 MySQL 实例
- 落地前修复：reward-claim-record 对 activity 的原生 SQL `innerJoin` 改为通过
  `ActivityService` 的正规接口调用；清理 reward-claim-record 内部从未被引用的
  重复 `ActivityService` 死代码
- 鉴权改为 introspect 模式（参照 partner-service 的 `IntrospectAuthGuard`）
- 服务目录登记（`entryType=embed`），管理页面走动态 embed 入口
- 跨服务调用（如未来需要读取订单域信息）一律通过 `@optimus/platform-client`/
  `@optimus/server-sdk`，不裸写 HTTP（依赖 `platform-client-sdk` 已上线）
- 存量单测随迁移修复，不带着屏蔽清单过去
- 验证分流生效后删除 optimus-api 侧原代码

**BREAKING**：无对外行为变化，C 端/管理端接口路径不变，只是承载进程发生变化。

## Capabilities

### New Capabilities

- `marketing-service-runtime`：营销域独立服务的运行时基础（鉴权、服务目录接入、
  探测）

### Modified Capabilities

（无——三个业务模块的对外接口行为不变，只是物理承载位置迁移；具体功能规格
沿用现状，不在本次重新定义）

## Impact

- `packages/optimus-api`：删除 `src/business/{activity,appointment,
  reward-claim-record}`，`app.module.ts` 移除对应注册
- `packages/marketing-service`：新建，结构参照 `partner-service`
- `optimus-ui`：营销相关管理页面菜单从静态路由改为动态 embed 入口
- 依赖 `platform-client-sdk` 已上线（决策④的强约束要求新服务从第一天起使用
  官方 SDK）

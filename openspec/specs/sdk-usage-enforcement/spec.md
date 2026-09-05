# sdk-usage-enforcement Specification

## Purpose
把"业务服务只能通过官方 SDK 访问平台能力、不得跨业务域直连别人的数据"从文档倡议
变成 CI 能拦下来的硬规则。约束只对**新增/修改的代码**生效——堵新增和清存量是两件
事，混在一起规则上线当天就会被整体关掉。
## Requirements
### Requirement: CI 拦截裸写平台接口调用
持续集成流程 SHALL 静态扫描代码变更，识别裸写 `fetch`/等价 HTTP 调用直接访问
已被 `platform-client`/`server-sdk` 覆盖的平台接口路径的模式，并在命中时阻止合并。

#### Scenario: 新增代码裸写平台接口调用
- **WHEN** 一次代码提交中包含直接 `fetch` 调用 `/auth/introspect`、
  `/files/client-upload`、`/system/short-link/*` 等已被 SDK 覆盖的路径
- **THEN** CI 检查失败，提交无法合并，并提示应改用对应的官方 SDK 方法

#### Scenario: 已知存量违规不被追溯拦截
- **WHEN** 检查规则上线时，代码库中已存在的裸写调用（如 partner-service 现有的
  `optimus-api-client.ts`）未发生变更
- **THEN** CI 检查不因这些未修改的存量代码而失败，只对新增/修改的代码生效

### Requirement: CI 拦截跨业务域直连数据
持续集成流程 SHALL 静态识别"在一个业务域内注入另一个业务域的 entity"
（`@InjectRepository` + 跨 `business/<domain>/` 的 import 来源），并在命中时阻止合并。

理由与 HTTP 那条不同：跨域注入在同一个进程里能跑，**一旦分属不同仓库/进程就是
编译期断裂**——问题在拆分那天才爆发，那时改动面已经最大。

#### Scenario: 新增跨业务域注入
- **WHEN** `business/A/` 下的代码 `@InjectRepository` 了从 `business/B/` 导入的 entity
- **THEN** CI 检查失败，并提示应改走 B 暴露的 HTTP 接口

#### Scenario: 同域注入不受影响
- **WHEN** 注入的 entity 来自本业务域（如 `./entities/x`）
- **THEN** 检查通过

#### Scenario: 无法可靠归属时不误报
- **WHEN** entity 经包名或路径别名导入，静态无法判断它属于哪个业务域
- **THEN** 检查 SHALL NOT 报错——宁可漏报交给评审，也不要制造假阳性让人整个关掉规则

### Requirement: 违规豁免必须写明原因
检查 SHALL 提供单行豁免标记，且标记 SHALL 要求写出原因。

没有豁免口的规则会被整个关掉；带原因的豁免至少是可评审、可搜索的。

#### Scenario: 带原因的豁免
- **WHEN** 命中行或其上一行注释了 `sdk-usage-allow: <原因>`
- **THEN** 该行不计入违规

### Requirement: 新服务接入检查清单
新服务上线验收流程 SHALL 将"是否只通过官方 SDK 访问平台能力"列为必过项。

清单 SHALL 同时包含信任模型相关的两项（见 `service-trust-grants`）：
① 该服务的 `trustLevel` 与 `grants` 已在服务目录登记，且 grants 按最小必要授予；
② `trustLevel=third-party` 的服务，其数据库实例独立于平台。

#### Scenario: 新服务验收
- **WHEN** 一个新服务准备上线并接受验收
- **THEN** 验收清单包含对 SDK 使用情况的检查，未通过该项不得视为验收完成

#### Scenario: 三方服务未通过数据隔离检查时不得启用
- **WHEN** 一个 `third-party` 服务申请登记为 `enabled`，但其数据库与平台共用实例
- **THEN** 该项检查不通过，SHALL NOT 允许其登记为 `enabled`


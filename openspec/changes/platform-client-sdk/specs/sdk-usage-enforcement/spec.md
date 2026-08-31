## ADDED Requirements

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

### Requirement: 新服务接入检查清单
新服务上线验收流程 SHALL 将"是否只通过官方 SDK 访问平台能力"列为必过项。

#### Scenario: 新服务验收
- **WHEN** 一个新服务准备上线并接受验收
- **THEN** 验收清单包含对 SDK 使用情况的检查，未通过该项不得视为验收完成

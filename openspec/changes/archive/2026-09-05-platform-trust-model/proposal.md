## Why

现有分层（L0/L1/L2）的设计假设是**"不同的内部团队"**。用两个未来确定要支撑的场景
压测这个假设，它在三个点上撑不住：

**场景一：外包团队交付一个业务服务。** 按现有架构，外包写一个 L2 服务是成立的
（partner-service 已经走通这条路），但接入时会发现：

1. **service token 是单一共享密钥。** `ServiceTokenService` 用 HS256 +
   `SERVICE_TOKEN_SECRET` 环境变量，各服务本地自签。`service-identity-auth` 的
   「服务身份不冒充其它服务」Scenario 把前提写得很明确——"**未持有正确的共享密钥**"。
   推论是：**持有密钥的任何一方都能签发 `sub` 为任意 serviceKey 的 token**。给外包
   密钥 = 交出平台全部服务间信任。这不是外包才有的问题：任一内部服务被攻破，
   攻击者拿到密钥即可冒充 optimus-api。
2. **所有 L2 服务是平等信任的。** 架构里没有"这个服务能访问什么"的表达。
   `partner-service` 用 **root 账号连同一个 `optimus` 库**——"禁止跨业务 JOIN 别人的表"
   这条边界规则在应用层是设计，在数据层是**零强制**。内部团队靠 code review 撑得住，
   外包撑不住。

**场景二：低代码/无代码页面搭建。** 运营拖拽产出的 schema、AI 生成的 schema，都是
**不受控输入**——同样突破了"内部团队编写的可信代码"这个假设。它需要的也是同一个
东西：一个能表达"这段配置/这个服务被允许做什么"的机制。

两个场景问的是同一个问题：**现有架构解决了"如何解耦"，但没有解决"如何在不信任的
前提下解耦"。** 前者是模块化问题，后者是安全边界问题。

## What Changes

- **service token 密钥模型改为每服务独立**：平台持有主密钥，按 `serviceKey` 派生
  各服务的签名密钥。持有派生密钥无法反推主密钥，也无法派生其它服务的密钥——
  冒充从"靠约定防住"变成"密码学上不可行"
- **新增服务信任级别**：`first-party` / `second-party` / `third-party`，登记在服务目录。
  级别只提供**默认授权集**，不是硬编码的能力上限
- **新增可配置的能力授权（grants）**：服务目录条目可逐项配置该服务被允许访问什么
  （如 `user-profile:read-basic`、`points:grant`、`oss:upload`）。这是**服务的权限码**，
  与用户权限码（`permCode`）平行但独立
- `/auth/introspect` 的 `type: "service"` 分支返回结果中带上 `trustLevel` 与 `grants`，
  L1 的受保护接口按 grant 校验
- **三方服务的数据隔离约束**：`third-party` 服务不得与平台共用数据库实例，
  接入检查清单强制校验
- **收编 `platform-user-profile-query` 的待拍板项**：该变更 design.md 里悬着的
  "要不要限定哪些服务能查全量用户资料"，答案由本变更给出——由 grants 控制，
  区分 `user-profile:read-basic` 与 `user-profile:read-full`，不再是一个特例判断

**BREAKING**：是。现有 `SERVICE_TOKEN_SECRET` 共享密钥签发的 token 在新模型下验签
失败。当前只有 partner-service 一个真实服务且尚未在业务接口上消费 service token，
迁移窗口成本最低——这也是本变更排在两个业务域拆分之前的原因。

## Capabilities

### New Capabilities

- `service-trust-grants`：服务信任级别与可配置能力授权

### Modified Capabilities

- `service-identity-auth`：密钥模型由"单一共享密钥"改为"按服务派生的独立密钥"；
  自省结果扩展 `trustLevel` / `grants`

## Impact

- `optimus-api`：`system/auth/service-token.service.ts`（派生逻辑）、
  `auth-introspect.controller.ts`（返回 trustLevel/grants）、
  `system/service-ops/service-registry.entity.ts`（新增 `trustLevel`、`grants` 字段）
  及对应 migration
- `@optimus/server-sdk`：`getServiceToken()` 改用派生密钥；新增 grant 校验辅助方法
- `partner-service`：迁移到新密钥模型（当前唯一的真实服务身份使用方）
- `platform-user-profile-query`：其鉴权设计改为消费本变更的 grants，
  design.md 里的 Open Question 随之关闭
- `platform-client-sdk`：接入检查清单增加"信任级别与 grants 已登记"
  "三方服务数据库独立"两项
- `platform-gateway-topology`：三方服务的部署位置约束与其部署产物章节相关

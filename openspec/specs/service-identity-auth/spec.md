# service-identity-auth Specification

## Purpose
TBD - created by archiving change platform-service-token. Update Purpose after archive.
## Requirements
### Requirement: 服务身份签发
系统 SHALL 允许已在服务目录（`op_sys_service_registry`）登记且 `enabled` 的服务，
使用**按其 `key` 派生的专属密钥**为自己签发一个短期 service token，token 的 `sub`
为该服务的 `key`，`type` 为 `"service"`。

派生 SHALL 满足：由主密钥与 `serviceKey` 确定性地导出该服务的签名密钥；平台侧
SHALL NOT 存储任何服务的派生密钥（验签时以同一函数现算）；持有某个派生密钥
SHALL NOT 能够反推主密钥或导出其它服务的派生密钥。

#### Scenario: 已登记服务签发 token
- **WHEN** 一个 `enabled` 的服务持有自己的派生密钥，为自己（`key=partner-service`）
  签发 token
- **THEN** 系统返回一个 `type: "service"`、`sub: "partner-service"` 的已签名 JWT，
  有效期为短期（分钟级，与现有 admin/client token 的短期策略一致）

#### Scenario: 服务目录泄露不导致身份沦陷
- **WHEN** 攻击者获得了 `op_sys_service_registry` 表的全部内容
- **THEN** 其中 SHALL NOT 包含任何可用于签发 service token 的秘密

### Requirement: 服务身份自省
`/auth/introspect` 接口 SHALL 支持 `type: "service"` 的自省请求，返回该 service token
对应的服务身份信息、**信任级别与已授予的能力清单**；对已失效、已过期、或对应服务
已被下线（`enabled=false`）的 token，SHALL 返回 `active: false`。

#### Scenario: 有效 service token 自省成功
- **WHEN** 调用方携带一个未过期、对应服务仍 `enabled` 的 service token 请求
  `POST /auth/introspect` 且 `type: "service"`
- **THEN** 系统返回 `{active: true, service: {key, name, trustLevel, grants}}`

#### Scenario: 对应服务已下线时自省失败
- **WHEN** 调用方携带的 service token 对应的服务在服务目录中已被设为 `enabled=false`
- **THEN** 系统返回 `{active: false}`，即使该 token 本身尚未过期

#### Scenario: 过期 token 自省失败
- **WHEN** 调用方携带一个已过期的 service token 请求自省
- **THEN** 系统返回 `{active: false}`

### Requirement: 与既有用户身份自省并存
新增的 service 类型自省 SHALL 不改变 `/auth/introspect` 对 `type: "admin"` 和
`type: "client"` 两种既有请求的返回结构与行为。

#### Scenario: 既有 admin 自省行为不受影响
- **WHEN** 调用方请求 `POST /auth/introspect` 且 `type: "admin"`
- **THEN** 系统的返回结构与新增 service 分支上线前完全一致

### Requirement: 服务身份不冒充其它服务
系统 SHALL 保证一个服务签发的 service token 只能证明其自身身份，不能被用于冒充
服务目录中的其它服务。该保证 SHALL 由密钥派生机制提供，而不依赖"密钥不外泄给
不该持有的一方"这类约定——**即使某个服务的派生密钥完全泄露，泄露方也只能冒充
该服务本身**。

#### Scenario: 篡改 sub 字段的 token 被拒绝
- **WHEN** 调用方使用不属于自己的服务 `key` 构造 token 的 `sub` 字段，并用自己
  持有的派生密钥对其重新签名
- **THEN** 系统在自省时返回 `active: false`——验签使用的是 `sub` 所指服务的派生
  密钥，与签名者持有的密钥不匹配

#### Scenario: 单个服务密钥泄露的爆炸半径受限
- **WHEN** 某个服务的派生密钥泄露给第三方
- **THEN** 第三方 SHALL 只能签发 `sub` 为该服务的 token，SHALL NOT 能签发任何
  其它服务身份的 token


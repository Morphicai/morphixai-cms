# service-trust-grants Specification

## Purpose
TBD - created by archiving change platform-trust-model. Update Purpose after archive.
## Requirements
### Requirement: 服务信任级别
服务目录条目 SHALL 携带一个信任级别，表达**该服务的代码提供方有多可信**：
`first-party`（内部团队、同一部署）、`second-party`（内部但独立团队/独立部署）、
`third-party`（外部供应商/外包）。

信任级别 SHALL 只决定新登记服务的**默认授权集**与若干与级别绑定的硬约束，
SHALL NOT 作为运行时授权判据本身——运行时判据始终是该条目的 `grants`。

信任级别表达的是代码提供方的可信程度，SHALL NOT 被解释为业务重要性分级。

#### Scenario: 三方服务默认不获得任何能力
- **WHEN** 一个新服务以 `trustLevel=third-party` 登记进服务目录且未显式配置 grants
- **THEN** 其 `grants` 为空，任何受 grant 保护的平台接口 SHALL 拒绝它的调用

#### Scenario: 一方服务获得默认授权集
- **WHEN** 一个新服务以 `trustLevel=first-party` 登记
- **THEN** 系统 SHALL 为其填入默认授权集，且该默认值 SHALL 可被逐项覆盖

### Requirement: 可配置的能力授权
服务目录条目 SHALL 支持逐项配置该服务被允许访问的平台能力（grants），取值为
`<资源>:<动作>` 形式的 grant code（如 `user-profile:read-basic`、`points:grant`）。

grants SHALL 是与用户权限码（`permCode`）**平行且独立**的体系：服务身份的授权
SHALL NOT 通过借用某个用户的权限来获得。

#### Scenario: 管理员调整某服务的授权
- **WHEN** 管理员在服务目录中为某服务增加或移除一个 grant
- **THEN** 该变更 SHALL 在其后的自省结果中生效，无需重新签发 token 或重启服务

#### Scenario: 授权不可经用户身份绕过
- **WHEN** 一个未被授予 `user-profile:read-full` 的服务，改用转发某个持有相应
  管理端权限的用户 token 的方式调用该接口
- **THEN** 该调用 SHALL 按用户身份而非服务身份处理，SHALL NOT 因用户权限高而
  使该服务获得其未被授予的服务级能力

### Requirement: 受保护接口按 grant 校验
L1 平台能力中需要授权的接口 SHALL 在**被调用方**校验调用者的 grant，
SHALL NOT 依赖网关或代理层做前置拦截。

#### Scenario: 缺少 grant 的调用被拒绝
- **WHEN** 一个服务以有效 service token 调用某个需要 `points:grant` 的接口，
  但其 grants 中不含该项
- **THEN** 接口 SHALL 返回权限错误，且该拒绝 SHALL 发生在被调用的服务内部

#### Scenario: 绕过网关的直连调用同样被校验
- **WHEN** 调用方不经网关、直接访问被调用服务的源
- **THEN** grant 校验 SHALL 照常发生，结果与经网关时一致

### Requirement: 三方服务的数据隔离
`trustLevel=third-party` 的服务 SHALL NOT 与平台共用数据库实例。该约束 SHALL 落在
新服务接入检查清单中作为可执行的检查项，而不仅是文档约定。

#### Scenario: 三方服务接入时校验数据隔离
- **WHEN** 一个 `third-party` 服务申请接入
- **THEN** 接入检查清单 SHALL 包含"数据库实例独立于平台"这一项，未通过
  SHALL NOT 允许其登记为 `enabled`

#### Scenario: 应用层边界规则对不可信提供方无效
- **WHEN** 评估"禁止跨业务 JOIN 别人的表"这条边界规则对三方服务的有效性
- **THEN** 系统 SHALL NOT 依赖该应用层约定作为三方服务的数据边界——唯一可靠的
  边界是数据库连接本身到不了其它业务的表


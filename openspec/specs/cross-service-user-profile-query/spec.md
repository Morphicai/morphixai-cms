# cross-service-user-profile-query Specification

## Purpose
TBD - created by archiving change platform-user-profile-query. Update Purpose after archive.
## Requirements
### Requirement: 按 uid 查询用户公开资料
系统 SHALL 提供一个接口，允许持有有效 service token 的调用方按 uid 查询用户的
公开资料字段（昵称、头像、邮箱、注册时间），不包含密码等敏感字段。

#### Scenario: 服务查询存在的用户
- **WHEN** 一个持有有效 service token 的调用方按存在的 uid 请求用户资料
- **THEN** 系统返回该用户的公开资料字段（昵称、头像、邮箱、注册时间）

#### Scenario: 查询不存在的用户
- **WHEN** 调用方按一个不存在的 uid 请求用户资料
- **THEN** 系统返回明确的"用户不存在"结果，而非误导性的空对象或 500 错误

### Requirement: 仅接受服务身份调用
该接口 SHALL 仅接受 service token 鉴权，拒绝 admin/client 用户身份的调用，
即使该用户 token 本身有效。

**持有有效 service token SHALL NOT 等同于有权查询用户资料**——调用方还 SHALL
被授予相应的 grant（`user-profile:read-basic` 或 `user-profile:read-full`，
见 `service-trust-grants`）。"登记过"不等于"可信"。

#### Scenario: 使用用户 token 调用被拒绝
- **WHEN** 调用方使用有效的 admin 或 client 用户 token（而非 service token）
  请求该接口
- **THEN** 系统拒绝该请求

#### Scenario: 未鉴权调用被拒绝
- **WHEN** 调用方未携带任何 token 请求该接口
- **THEN** 系统返回 401

#### Scenario: 有效 service token 但未被授予 grant 时被拒绝
- **WHEN** 一个已登记且启用的服务持有有效 service token 请求该接口，
  但其 grants 中不含所需项
- **THEN** 系统拒绝该请求

#### Scenario: 只授予 basic 的服务读不到完整资料
- **WHEN** 一个仅被授予 `user-profile:read-basic` 的服务请求完整资料
- **THEN** 系统 SHALL NOT 返回需要 `user-profile:read-full` 的字段

### Requirement: 敏感字段不返回
返回的用户资料 SHALL 不包含密码、密码哈希等敏感字段，字段集合为预先定义的
白名单，而非"排除敏感字段后的其余全部字段"。

#### Scenario: 返回内容不含敏感字段
- **WHEN** 任意合法调用查询到用户资料
- **THEN** 返回结果中不出现密码、密码哈希等字段，且未在白名单中的其它字段
  同样不出现


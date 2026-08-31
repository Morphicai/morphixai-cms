## ADDED Requirements

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

#### Scenario: 使用用户 token 调用被拒绝
- **WHEN** 调用方使用有效的 admin 或 client 用户 token（而非 service token）
  请求该接口
- **THEN** 系统拒绝该请求

#### Scenario: 未鉴权调用被拒绝
- **WHEN** 调用方未携带任何 token 请求该接口
- **THEN** 系统返回 401

### Requirement: 敏感字段不返回
返回的用户资料 SHALL 不包含密码、密码哈希等敏感字段，字段集合为预先定义的
白名单，而非"排除敏感字段后的其余全部字段"。

#### Scenario: 返回内容不含敏感字段
- **WHEN** 任意合法调用查询到用户资料
- **THEN** 返回结果中不出现密码、密码哈希等字段，且未在白名单中的其它字段
  同样不出现

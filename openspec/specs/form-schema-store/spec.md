# form-schema-store Specification

## Purpose
TBD - created by archiving change dynamic-form-foundation. Update Purpose after archive.
## Requirements
### Requirement: 表单定义管理
系统 SHALL 提供表单定义的增删改查接口，管理接口以权限码 `FormManagement` 保护。每个定义包含：名称、唯一 slug、schema（JSON）、启用状态、schema 版本号；schema 每次修改版本号 SHALL 递增。

#### Scenario: 创建并启用一个表单
- **WHEN** 持有 FormManagement 的用户创建定义并置为启用
- **THEN** 列表可见该定义，公开填报地址按 slug 可访问

#### Scenario: 无权限管理被拒
- **WHEN** 不持有 FormManagement 的用户调用任一管理接口
- **THEN** 返回 403

#### Scenario: schema 修改递增版本
- **WHEN** 修改某定义的 schema 并保存
- **THEN** 该定义的 schema_version 加一，已存在的数据行不受影响

### Requirement: 公开填报
系统 SHALL 提供匿名可用的填报接口：按 slug 获取**已启用**定义的 schema、向已启用定义提交数据。未启用或不存在的 slug SHALL 一律返回 404，不暴露存在性。

#### Scenario: 启用的表单可匿名填报
- **WHEN** 未登录用户按 slug 获取定义并提交合法数据
- **THEN** 获取返回 schema，提交返回成功，数据落库

#### Scenario: 停用后立即不可达
- **WHEN** 管理员将定义置为停用后，匿名用户再次按 slug 访问
- **THEN** 返回 404

### Requirement: 提交防滥用
公开提交 SHALL 按来源 IP 限频（默认每分钟 10 次），单条提交数据 SHALL 不超过 64KB，超限分别返回 429 与 413。

#### Scenario: 高频提交被限
- **WHEN** 同一 IP 一分钟内第 11 次提交
- **THEN** 返回 429，该次数据不落库

### Requirement: 数据行冻结版本
每条提交数据 SHALL 记录提交时刻的 schema_version；数据查询接口 SHALL 随行返回该版本号，使历史数据始终按提交当时的表单结构解释。

#### Scenario: 定义修改后旧数据仍可读
- **WHEN** 表单已有 v1 提交数据，schema 改为 v2 后查询数据
- **THEN** 旧行标记 v1、按 v1 结构展示，新提交标记 v2


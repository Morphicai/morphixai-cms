# schema-driven-validation Specification

## Purpose
TBD - created by archiving change entity-schema-crud. Update Purpose after archive.
## Requirements
### Requirement: 集合 schema 采用表单协议并在写入时校验
数据集合的 schema SHALL 采用表单模块的 schema 协议（fields 数组、7 种字段类型），创建/更新集合时 SHALL 校验 schema 合法性并拒绝非法定义；旧的 properties 形状 SHALL 走既有兼容逻辑不受影响。

#### Scenario: 非法 schema 被拒
- **WHEN** 创建集合时提交 fields 中含未知字段类型的 schema
- **THEN** 返回 400 并指明第一处错误，集合不落库

#### Scenario: 旧形状兼容
- **WHEN** 存量集合的 schema 是 properties 形状
- **THEN** 其行写入仍按旧逻辑校验，行为不变

### Requirement: 行数据按 schema 校验
挂有 form 协议 schema 的集合，行数据写入（管理端与 C 端 public_write 同一道闸）SHALL 校验 required、字段类型、选项合法性、数字范围；SHALL 拒绝不满足 schema 的写入并指明第一个不合法字段。字段可声明 `unique: true`，同集合内该字段值 SHALL 唯一。

#### Scenario: 绕过前端直接写入非法行
- **WHEN** 用 curl 向行写入接口提交缺少必填字段的数据
- **THEN** 返回 400 并指明缺失字段 key，数据不落库

#### Scenario: unique 字段重复被拒
- **WHEN** 提交的行在 unique 字段上与既有行同值
- **THEN** 返回 400 提示重复


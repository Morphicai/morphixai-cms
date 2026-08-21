## ADDED Requirements

### Requirement: schema 协议
系统 SHALL 定义精简表单 schema 协议，支持字段类型：text（单行）、textarea（多行）、number、radio（单选）、checkbox（多选）、date、switch。字段属性支持：key、label、required、placeholder、options（选择类）、min/max（数字）。协议 SHALL 允许 `x-` 前缀扩展属性且渲染与校验对未知扩展属性宽容忽略。

#### Scenario: 七种类型完整渲染
- **WHEN** 一份包含全部七种字段类型的 schema 交给渲染器
- **THEN** 每种字段渲染为对应的表单控件且可交互

### Requirement: 渲染与校验同源
前端渲染器与服务端校验 SHALL 消费同一份 schema：required、类型、数字范围、选项合法性在两端行为一致；服务端 SHALL 拒绝不满足 schema 的提交（明确指出第一个不合法字段）。

#### Scenario: 绕过前端直接提交非法数据
- **WHEN** 用 curl 向填报接口提交缺少必填字段的数据
- **THEN** 服务端返回 400 并指明缺失的字段 key，数据不落库

#### Scenario: 选项越界被拒
- **WHEN** 提交的单选值不在 schema 声明的 options 中
- **THEN** 服务端返回 400

### Requirement: 渲染器组件可复用
渲染器 SHALL 是独立组件（输入 schema 与初值，输出提交数据），管理端预览与公开填报页 SHALL 使用同一个渲染器。

#### Scenario: 预览即所得
- **WHEN** 编辑器内修改 schema
- **THEN** 预览区实时按新 schema 重新渲染，与公开填报页最终呈现一致

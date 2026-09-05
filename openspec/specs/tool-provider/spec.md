# tool-provider Specification

## Purpose
TBD - created by archiving change agent-tool-protocol. Update Purpose after archive.
## Requirements
### Requirement: 代码级工具注册

业务模块 SHALL 在代码里声明自己贡献的 Agent 工具（name/description/params/
method/path），经 `GET /system/agent/tools`（@Perm("AgentConsole")）聚合暴露；
工具声明与其业务实现同库同版本。

#### Scenario: 聚合清单
- **WHEN** 请求 /system/agent/tools
- **THEN** 返回 i18n 与 dictionary 模块各自注册的工具

#### Scenario: 权限
- **WHEN** 无 AgentConsole 权限码调用
- **THEN** 被拒

### Requirement: 基座从 provider 拉取

agent-service SHALL 从配置的 provider 端点列表拉取工具清单（发起人 token），
不再读任何数据集合；provider 不可达时 run 失败并说明原因。

#### Scenario: 数据集合退役
- **WHEN** agent-tools 数据集合被删除
- **THEN** Agent 工具能力不受影响

### Requirement: 翻译单路径

多语言的 AI 补全 SHALL 全部经 agent-service 完成；单轮批量翻译接口删除。

#### Scenario: 按钮走 Agent
- **WHEN** 管理页点"AI 补全缺失语言"
- **THEN** 任务提交给 agent-service，完成后缺失语言补齐、已有人工译文不被覆盖

### Requirement: 基座去业务语义

基座默认 system prompt SHALL 只含通用执行原则；`POST /run` 可选 `system`
字段由调用方注入业务人格。

#### Scenario: 调用方注入
- **WHEN** /run 带 system 字段
- **THEN** 该文本作为业务人格拼入 system prompt


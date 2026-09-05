# agent-console Specification

## Purpose
TBD - created by archiving change agent-foundation. Update Purpose after archive.
## Requirements
### Requirement: 管理端控制台

管理端 SHALL 提供"智能助理"页（@Perm("AgentConsole")）：输入任务发起 run、
展示工具清单、逐步轨迹与历史记录。

#### Scenario: 发起任务并看轨迹
- **WHEN** 管理员输入自然语言任务并运行
- **THEN** 页面展示逐步轨迹（每步 thought/工具/结果）与最终结论

#### Scenario: 自动翻译端到端
- **WHEN** 任务为"检查 portal 命名空间缺少法语(fr-FR)的键并全部翻译"
- **THEN** Agent 自主调用 i18n 工具完成，多语言管理表格出现 fr-FR 译文，
  公开接口 fr-FR 返回法语

#### Scenario: 权限
- **WHEN** 未持有 AgentConsole 权限码
- **THEN** 菜单不可见且接口被拒


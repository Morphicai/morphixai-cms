# Tasks: agent-tool-protocol

## 1. optimus-api：工具提供方

- [x] 1.1 agent-tools 注册表模块（contributeAgentTools/listAgentTools）+ GET /system/agent/tools（@Perm("AgentConsole")）
- [x] 1.2 i18n 模块代码里注册 3 个工具；dictionary 模块注册 collection_list
- [x] 1.3 删除 translateMissing + POST /system/i18n/translate + 相关单测

## 2. agent-service

- [x] 2.1 loadToolDefs 改为从 provider 端点列表拉取（默认 optimus-api，env 可配多个）
- [x] 2.2 system prompt 去业务化；/run 支持可选 system 字段

## 3. 管理端

- [x] 3.1 i18n 页"AI 补全"按钮改为提交 agent-service 任务
- [x] 3.2 智能助理页文案微调（工具来源改述为"业务服务代码注册"）

## 4. seed 清理

- [x] 4.1 db/agent_seed.sql 去掉 agent-tools 集合与工具行（保留权限码）；dev 库删除该集合

## 5. 验收

- [x] 5.1 浏览器：多语言页补全按钮走 Agent 端到端（补齐缺失、不覆盖人工）
- [x] 5.2 curl：/system/agent/tools 出代码注册的工具；删集合后一切照常
- [x] 5.3 api 单测 + 构建通过

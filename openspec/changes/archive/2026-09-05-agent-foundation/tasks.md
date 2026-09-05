# Tasks: agent-foundation（pi-agent-core 版）

## 1. agent-service（独立 ESM 服务，8087）

- [x] 1.1 包骨架：type module + tsx 直跑；deps pi-agent-core/pi-ai@0.80.10 + server-sdk + express
- [x] 1.2 model.ts：OneRouter Model 构造（developerRole/thinkingFormat/maxTokens 三坑照搬）
- [x] 1.3 tools.ts：声明式工具执行器（定义存 agent-tools 数据集合，基座零业务代码；相对路径白名单防 SSRF；token 透传）
- [x] 1.4 runner.ts：Agent 组装、事件收集轨迹、12 次工具调用上限 abort
- [x] 1.5 server.ts：POST /run（introspect 鉴权）/ GET /tools / GET /runs / GET /health；run 落盘 jsonl

## 2. 平台侧

- [x] 2.1 seed（db/agent_seed.sql）：AgentConsole 权限码 + agent-tools 注册表集合 + 4 个工具定义；optimus-api 补 i18n missing/translation 业务端点；dev 库执行
- [x] 2.2 optimus-ui setupProxy：/agent-api → 8087
- [x] 2.3 routes.js：智能助理节点 + pages/agent（任务输入/工具清单/轨迹 Timeline/最近运行）

## 3. 验收

- [x] 3.1 浏览器端到端：portal→fr-FR 自动翻译任务，轨迹完整可读
- [x] 3.2 多语言管理出现 fr-FR 译文 + 公开接口 fr-FR 返回法语
- [x] 3.3 curl：无 token/假 token 调 /run 被拒
- [x] 3.4 停掉 agent-service，optimus-api 与两个前端一切如常（解耦实证）

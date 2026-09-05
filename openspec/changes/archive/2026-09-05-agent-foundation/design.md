# Design: agent-foundation（pi-agent-core 版）

## packages/agent-service（独立 ESM Node 服务，8087）

```
src/model.ts       OneRouter → pi-ai Model 构造(踩坑随注释搬运)
src/tools.ts       AgentTool 定义(typebox schema),execute 走 HTTP 调 optimus-api
src/runner.ts      new Agent() + prompt() + 事件收集成轨迹
src/server.ts      express: POST /run · GET /tools · GET /health;introspect 鉴权
```

deps：`@earendil-works/pi-agent-core@0.80.10`、`@earendil-works/pi-ai@0.80.10`
（与 morphix 生态版本对齐）、`@optimus/server-sdk`(workspace)、express。
type: module，tsx 直跑（与 pi 生态一致的 TS-源码消费方式，不建构建产物）。

## OneRouter Model 构造（教训直接继承）

morphicai-api 的 modelBridge 用真实流量踩出来三条，原样搬：

1. `compat.supportsDeveloperRole: false` —— pi 的 detectCompat 不认识
   llm.onerouter.pro，会默认发 `role:'developer'`，部分模型直接 400
2. `compat.thinkingFormat: 'openrouter'` —— OneRouter 是 OpenRouter 兼容网关，
   `reasoning_effort` 形状发过去是静默无效，`reasoning:{effort}` 才生效
3. `maxTokens` 只是元数据，真正的输出预算要在 stream options 里显式给，
   否则 prompt 大时输出被挤到个位数 token 且无诊断线索

模型沿用 `AI_MODEL`（默认 google/gemini-3.1-flash-lite），key 从
`ONEROUTER_API_KEY` 环境变量经 getApiKey 回调给（零落盘不变）。

## 工具（第一批，全部 HTTP 调 optimus-api + 透传发起人 token）

| 工具 | 底层 HTTP |
|---|---|
| `i18n_list_namespaces` | GET /system/i18n/namespaces |
| `i18n_list_missing` (namespace, locale) | GET /system/i18n/entries 后本地过滤出缺 locale 的 key+zh-CN 源文 |
| `i18n_write_translation` (namespace, key, locale, text) | 查 entry → PUT /system/i18n/entries/:id（只补缺失，不覆盖已有） |
| `collection_list` (collection) | GET /api/dictionary/:collection |

execute 抛错即可——pi-agent-core 把错误回填给模型，循环自然继续。
参数 schema 用 typebox（pi-agent-core 自带依赖），它负责校验模型给的参数。

## 执行与轨迹

`POST /run {task}`（Authorization 透传）：
- introspect 验 token（active + perms 含 AgentConsole 或 "*"，60s 缓存）
- `new Agent({ getApiKey })`，state 赋 systemPrompt/model/tools，
  `await agent.prompt(task)`（agent_end 事件即结束）
- 步数控制：subscribe 事件计数，超 12 次工具调用 abort()
- 轨迹从 `agent.state.messages` 抽取：assistant 文本(thought)/toolCall(名+参)/
  toolResult(内容截断到 2KB)，同步返回给前端
- 落盘：每次 run 追加一行 JSON 到 `runs/<日期>.jsonl`（pi 自带 Jsonl 存储偏
  session 语义，我们只要审计留痕，一行一 run 更直白）；`GET /runs` 读最近 50 条

## 管理端

- setupProxy.js 加 `/agent-api` → 8087（同源，无 CORS）
- routes.js：智能助理节点（AgentConsole，/agent，RobotOutlined）
- pages/agent：任务输入 + 工具清单 + 轨迹 Timeline（thought/tool/result 分色）+
  最近运行列表；axios 直接用（token 自动带上）

## seed

AgentConsole 授角色 1/2（role_menu 66/67），无新表（轨迹在 agent-service 本地）。

## 后续接 agent-framework 的接缝

runner.ts 只暴露 `runTask(task, token) → { status, steps, result }`。
多 Agent 阶段把 runner 内部从裸 Agent 换成 agent-framework 的 AgentInstance
（同一个 pi-agent-core 底座，工具与 Model 接线原样复用），HTTP 面不变。
agent-framework 的引入形态（git subtree / 内部 npm）届时随其发布方式定。

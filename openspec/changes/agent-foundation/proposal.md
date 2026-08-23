# Proposal: agent-foundation — Agent 能力地基（pi-agent-core 版）

## 要解决的问题

平台的 AI 用法目前全是**单轮调用**（表单生成、i18n 补全）："分几步、用什么工具"
是代码写死的。方向是 Agent：给目标，模型自主调用平台能力分步完成——
自动翻译、编排自动化、无代码自动化都以此为基。

## 方案：独立 agent-service + pi-agent-core 引擎

### 为什么是独立服务而不是 optimus-api 里的模块

三个原因叠加，每一个单独都足够：

1. **解耦（拍板）**：Agent 是重能力，单独抽离，不与现有业务纠缠——
   optimus-api 崩不了 Agent，Agent 崩不了 optimus-api
2. **模块体系不可调和**：pi 生态（pi-agent-core / pi-ai / agent-framework）
   全部 ESM-only 且 exports 不带 require 条件，optimus-api 是 CommonJS NestJS——
   硬塞只能靠 hack，独立 ESM 服务则原生消化
3. **吃自己的狗粮**：agent-service 以"外部团队后端"的身份接入平台——
   用 @optimus/server-sdk introspect 验调用者、走 HTTP 调平台能力。
   它是上一迭代铺的扩展面的**第一个真实消费者**，扩展面好不好用它先知道

### 引擎分层（拍板）

| 场景 | 用什么 | 说明 |
|---|---|---|
| 一次性任务（翻译、批量数据操作等） | **pi-agent-core 直接用**（本迭代） | `Agent` 类自带循环/工具执行/状态，我们只写工具与模型接线 |
| 多 Agent 编排（父子委派、技能） | **agent-framework**（后续迭代） | morphix 仓的 framework-v2（AgentInstance/spawn/skills），基于同一个 pi-agent-core——今天写的工具与模型接线到时原样复用，只换外壳 |

pi 生态分层的既有事实：pi-agent-core 是引擎（单 agent 循环 + tool calling），
flue 与自家 agent-framework 都是它之上的运行时外壳。我们与 morphix 生态
（morphicai-api 已用 framework-v2 跑 5 角色 agent）版本对齐（0.80.10），
将来引 agent-framework 没有断层。

### 身份与权限：token 透传

管理端发起任务时带管理员 JWT；agent-service 用 introspect 验证后，
工具调用 optimus-api 时**透传同一个 token**——Agent 以发起人的身份行动，
权限就是发起人的权限（@Perm 原样生效），不需要 service 账号，也造不出越权。

### 明确不做（本次边界）

- 多 Agent 编排 / skills / 父子委派（agent-framework 的活，下一阶段）
- 流式输出到前端（同步等待 + 完整轨迹回放够用）
- C 端暴露（只在管理端权限门内）

## 验收标准

1. 控制台输入"检查 portal 命名空间缺少法语(fr-FR)的键并全部翻译"→ Agent 自主
   调工具完成 → 多语言管理出现 fr-FR 译文，公开接口 fr-FR 返回法语
2. 轨迹完整可读（每步思考/工具入参/结果）
3. 无效 token 被 introspect 拒绝；无 AgentConsole 权限码菜单不可见
4. agent-service 停机不影响 optimus-api 任何现有功能（解耦实证）

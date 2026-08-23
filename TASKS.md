# Optimus CMS - Task Tracking

> 保持精简，定期清理，只留进行中的事。

## 当前迭代：agent-tool-protocol（2026-08-23 完成，agent-foundation 三处定位修正）

1. **工具是代码不是数据**：agent-tools 数据集合废弃。工具由业务模块在代码里
   声明（`i18n.agent-tools.ts` / `dictionary.agent-tools.ts`，声明跟着实现走），
   经 `GET /system/agent/tools` 聚合暴露；agent-service 从 provider 端点列表
   拉取（TOOL_PROVIDER_URLS，默认 optimus-api，将来业务方服务可加入）
2. **翻译单路径**：单轮批量翻译（translateMissing）删除，管理页"AI 补全"
   按钮底层改为提交 agent-service 任务——"不覆盖人工译文"收敛回
   writeTranslation 一处实现
3. **运营语义剥离**：基座 system prompt 只剩通用执行原则，业务人格由
   /run 的 system 字段注入（i18n 按钮注入翻译助理人格）；控制台页定位为
   业务消费方

按钮语义说明：补全的目标语言 = 表格现有语言列（补齐矩阵），引入全新语言
走智能助理自然语言任务或编辑弹窗手填第一条。

## 上一迭代：agent-foundation（2026-08-23 完成，已合 main）

独立 agent-service（ESM 8087，pi-agent-core 引擎+OneRouter 三条 compat 教训）；
introspect 鉴权 + token 透传（Agent 以发起人身份行动）；轨迹 jsonl+控制台回放；
端到端实测自主翻译 4 调用 10s 级；停机不影响平台（解耦实证）。
**遗留**：pi 事件订阅是防御性 any 读取（agent-framework 换壳时消化）；
run 同步等待 ≤5min；多 Agent 编排待接 agent-framework。

## 上一迭代：i18n-foundation（2026-08-23 完成，已合 main）

多语言平台能力：op_sys_i18n_entry 单表（namespace+key→{locale:文案}），管理页
（动态语言列+AI 补全只填缺失）、公开读（zh-CN 回退）、client-sdk I18nSDK。
踩坑：docker exec mysql 写中文必须 --default-character-set=utf8mb4。
**遗留**：与 iframe 版翻译工作台并存；内容变体多语言未做。

## 上一迭代：platform-base-sdk（2026-08-23 完成，已合 main）

三个薄接入面：introspect（外部后端验 token）、@optimus/client-sdk（C 端抽包）、
@optimus/server-sdk、iframe 嵌入协议（@optimus/admin-embed + IframeApp）。
examples/demo-activity 全流程验收过。
连带修复 database-initializer 两处 queryRunner 泄漏（池干涸→守卫误判未初始化→全站 403）。
**遗留**：introspect 限频是单进程内存桶；admin-embed 未发 npm。

## 数据库连接（2026-08-22 结论，重要）

- mysql2 已升 3.23.4，但 **idleTimeout/maxIdle 闲置回收不能开**：满池并发后回收
  不完整，之后再来并发整池挂死（复现：10 并发→闲置 80s→再 10 并发全超时）。
  结论与复现记录在 `pool-keepalive.service.ts` 头注释
- **连接池医生已回归**（探测+8s 硬超时+整池重建），dev 环境池活性由它兜底
- `nest --watch` + `keepConnectionAlive: true` 会让坏池跨热重启存活，池医生会在
  45-90s 内自愈；遇到 "Database check timeout" 先等一分钟再判断

## 上一迭代：dynamic-form-foundation（2026-08-21 完成，已合 main）

动态表单：schema 定义 → 渲染 → 免登录填报 → 数据落库；智能生成 schema 草稿可用。
**遗留项（上公网前必须做）**：公开填报接口目前只有 IP 限频 + 体积上限两道闸，
暴露到公网前要加验证码或一次性 token。

## 待拍板

（暂无）

## 已明确推迟（闭环前不碰）

- **partner/points-engine 迁出为子服务**：init project 拷入的存量业务线
  （游戏合伙人/积分引擎），代码挂载但三张 partner 表 0 行、无活跃使用。
  已决策走服务目录接入（entryType=embed + 自己的权限码 + toolsPath）。
  其 9 个单测自 init 起就与实现不同步（引用从未存在的 JoinMode/旧签名），
  已在 jest.unit.config.js testPathIgnorePatterns 屏蔽——**迁移时随行修复**，
  屏蔽清单就是迁移范围的测试侧对账单
- antd v4→v5 弃用 API 清理
- dashboard 统计数据源
- 无标注接口的"默认拒绝"收紧（platform-closed-loop 产出清单，下一轮做）
- i18n-platform 迁移为内部模块（现阶段 iframe 引用）
- optimus-next 的 ComingSoon 文档页补全与文档搜索后端

## Completed

- [x] entity-schema-crud（schema 驱动数据集合：管理端 CRUD + C 端首页数据源切换，浏览器全流程验收通过）
- [x] optimus-next 闭环（认证单链路/DynamicContent/清理/隔离，全链路浏览器验收通过）
  - 遗留小项：ArticleSDK 双实现合并、profile 页用户ID `#` 占位、LoginForm caret-color hydration 警告
- [x] 权限码漂移修复（以 routes.js 为准，NewsArticles/ActivityArticles，seed SQL + 存量库同步改名）
- [x] mysql2 2.2.5 → 3.23.4（驱动现代化保留；idleTimeout 方案证伪，池医生回归）
- [x] harness-fe 运行时观测集成（optimus-ui，projectId=optimus-admin）
- [x] 数据库连接稳定性（容器域名直连，见 CLAUDE.md 启动要点 3）
- [x] 数据库失联不再误跳安装页（App.js）

## harness-fe 上游待修（本项目已用显式配置绕过）

- `@harness-fe/react-jsx@4.0.0` 的 .d.ts 漏导出 JSX namespace，jsxImportSource
  下 TS 全量报错——本项目用 `src/types/harness-react-jsx.d.ts` augmentation 兜住
- webpack/next 插件注入的默认 mcpUrl 不带 `/ws` 路径，与 daemon WS 端点对不上，
  不显式配 mcpUrl 就静默连不上（runtime-client 自己的默认值反而是对的）

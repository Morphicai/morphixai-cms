# Optimus CMS - Task Tracking

> 保持精简，定期清理，只留进行中的事。

## 当前迭代：i18n-foundation（2026-08-23 完成开发验收）

多语言成为平台能力：`namespace + key → {locale: 文案}` 单表模型
（不建语言注册表——translations 里有什么 locale 就支持什么）。

- 管理端"多语言管理"：namespace 切换/搜索/动态语言列/编辑，
  **AI 补全缺失语言**（打包批量调模型，只填缺失、不覆盖人工译文——实测
  人工填的 "Reach Out" 在补全后原样保留）
- 公开读 `GET /api/i18n/:namespace?locale=`：缺失回退 zh-CN，404，IP 限频
- client-sdk 新增 I18nSDK（内存缓存；locale 拼 URL 绕开按 URL 去重的坑）
- 建表 SQL 在 `db/i18n_tables.sql`（与 form_tables.sql 同惯例）

**踩坑记录**：docker exec 进 mysql 客户端写中文必须带
`--default-character-set=utf8mb4`，否则 latin1 双重编码存成乱码
（本次 i18n seed 和 demo-activity-config 的中文都中过招，已修）。

**遗留项**：
- 与 iframe 版"翻译管理"（独立工作台）并存，工作台后续去留另议
- 文章/文档的内容变体多语言未做（等文档管理需求真来）

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

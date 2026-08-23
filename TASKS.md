# Optimus CMS - Task Tracking

> 保持精简，定期清理，只留进行中的事。

## 当前迭代：entity-schema-crud（2026-08-23 完成开发验收）

同一份 entity schema 驱动增删改查：字典模块（存储）+ 表单协议（schema 与校验器）+
SchemaFormRenderer（渲染）三个已验收资产拼装成"数据集合"能力。管理端建集合
（JSON + 预览 + 智能生成）→ 按 schema 录入/编辑/删除行 → C 端读公开集合。
首页 features 已切到 site-features 集合（服务端直连取数，后端灭则回退硬编码，实测）。
提案与任务见 `openspec/changes/entity-schema-crud/`。

连带修掉三个存量缺陷：
- **validateUniqueness 从未生效**：参数 JSON.stringify 多包一层引号，MySQL 按字面量
  比较恒不相等——unique 校验一直是空转，本次修复后实测拦截
- **database-initializer 两处 queryRunner 泄漏**：初始化守卫每 5s 缓存过期查一次库，
  每查漏一个连接，池干涸后守卫把已初始化系统误判成"未初始化"全接口 403
  （症状与"数据库挂了"高度相似，先查池再怀疑库）
- dictionary-collection.service 的校验器 import 缺失（上次会话中断截断）

**遗留项**：
- AI 生成的 schema 倾向把所有字段标 required:true，生成提示词可加"仅关键字段必填"引导
- 行数据抽屉一次拉 200 行无分页，集合大了要补

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

# Optimus CMS - Task Tracking

> 保持精简，定期清理，只留进行中的事。

## 当前迭代：platform-base-sdk（2026-08-23 完成开发验收）

基座与共享 SDK——为"其他团队接入同一管理后台/共享登录态"铺的三个薄接入面：

- **`POST /api/auth/introspect`**：外部后端校验平台 token（admin/client 两体系），
  密钥不出边界；匿名可调（token 即凭据，introspect 不放大权限），IP 限频
- **`@optimus/client-sdk`**：C 端 SDK 从 optimus-next 抽成 workspace 包
  （http/session/storage/dynamic-content/article + 新增数据集合读写封装），
  next 内走 re-export 薄壳无损切换
- **`@optimus/server-sdk`**：introspect 的零依赖封装（60s 缓存 + hasPerm 便捷判断）
- **管理端嵌入协议**：`@optimus/admin-embed`（子应用侧，零构建 UMD）+
  IframeApp 工厂（基座侧）——iframe 子应用经 postMessage 握手继承
  token/用户/权限/locale/theme，双向 origin 校验，token 不走 URL。
  `examples/demo-activity` 是协议验收样例（`node serve.mjs` 起 5190）

刻意不做：qiankun/module federation（iframe 够用且成本低一个量级）、
webhook/app-key 开放平台（无真实消费者）、RS256（introspection 下密钥已不出边界）。

连带修掉一个致命存量缺陷：**database-initializer 两处 queryRunner 泄漏**——
初始化守卫每 5s 缓存过期查一次库，每查漏一个连接，池干涸后守卫把已初始化系统
误判成"未初始化"，全接口 403（症状酷似"数据库挂了"，先查池再怀疑库）。

**遗留项**：
- introspect 的 IP 限频是单进程内存桶，多实例部署时要换共享存储
- admin-embed 未走 npm 发布流程（workspace 内可用；外部团队真接入时再发）

## 上一迭代：entity-schema-crud（2026-08-23 完成，已合 main）

同一份 entity schema 驱动增删改查：管理端"数据集合"页（建集合/智能生成/行 CRUD），
C 端首页 features 切到 site-features 集合（后端灭回退硬编码）。
连带修复：validateUniqueness 参数多包引号从未生效、dictionary-collection import 截断。
**遗留项**：AI 生成 schema 倾向全字段 required（提示词可引导）；行抽屉无分页（200 行上限）。

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

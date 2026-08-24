# Optimus CMS - Task Tracking

> 保持精简，定期清理，只留进行中的事。

## 当前状态（2026-08-23）：服务端微服务模式闭环

单机规模的微服务模式已成型：multi-service（api/agent/ui/next/demo）+
服务目录（注册即接入）+ 探测观测 + 事务性事件 outbox。升级路径已存档
（事件延迟不可接受→NATS relay；服务数≥8→再评框架），当前不引任何新组件。
下一个待启动方向：partner/points-engine 迁出为第一个真实业务子服务（见推迟区）。

## 上一迭代：权限模型收紧为 fail-closed（2026-08-24 完成，已合 main）

数据表审计发现的权限缺口收权为一个独立迭代：全库精确扫描（正确识别
@ClientUserAuth/@AllowAnonymous/@AnonymousAuth/@RequireSuperAdmin 等六种
装饰器，排除误报）定位到 11 个 controller、53 个方法确实无权限声明，逐个
判定后全部处理：

- **最严重**：partner.controller.ts 的 update-mira/update-star——直接改
  合伙人积分余额/星级，此前零权限校验且是唯一入口（非内部服务回调）。
  收为 @RequireSuperAdmin（普通权限码可能被误发给运营角色，直接写积分/
  权益的操作不该有这个空间）
- **死代码陷阱**：partner.controller.ts 里 7 个 admin/* 路由与
  partner-admin.controller.ts 完全同路径，因模块注册顺序当前不可达，
  但只要注册顺序被无意调整就会复活成无保护路由——已删除
- **写操作零校验**：partner-admin（16 方法，冻结/改上级关系/改备注等，
  仅两个"清数据"方法有 SuperAdminGuard）、reward-claim-record 的
  Get()/Delete()（swagger 标"管理员"却无 @Perm）
- **读敏感数据零校验**：admin-order（全量订单）、appointment 的
  list/export（全量预约+手机号）、operation-log（全部管理行为）、
  external-task-admin（任务审核，关联积分发放）
- **新增权限码**（对齐前端菜单 routes.js 同名项，授予角色 1/2）：
  OrderManagement/Appointment/ConfigCenter/RewardClaimRecord/
  ActivityCenter/PartnerManagement/PartnerDataManagement/
  ExternalTaskReview/OperationLog
- **自服务豁免**：user-dictionary.controller.ts 按 req.user.id 读写自己的
  数据，标 @AllowNoPerm+注释（性质等同"改自己密码"，非漏洞）
- **guard 翻转**：unified-auth.guard.ts 的"未挂 @Perm 即放行"改为
  fail-closed（抛 403），新写的 ADMIN 模式接口必须显式声明
  @Perm/@AllowNoPerm/@RequireSuperAdmin 三选一
- **验证**：全库精确扫描确认零遗漏后才翻转；造角色3（零权限码）测试账号，
  18 个历史高危接口全部 403；改绑角色1（新码已授权）后同一 token 全部 200；
  @RequireSuperAdmin 接口对角色1（非超管 type）仍正确 403，证明两道门
  独立生效；api 153 测全绿（含更新后的 perm-check.spec.ts fail-closed 断言）
- 发现但不在本次范围：RolesGuard（旧守卫）的权限判断代码整段被注释掉，
  等同永远放行——因 UnifiedAuthGuard 是全局守卫先执行且更严格，不影响
  本次修复效果，但该文件本身是废弃代码，值得找机会清理

## 上一迭代：数据表规划审计（2026-08-24 完成，已合 main）

按"基础设施与业务数据隔离"思路全库审计（36 表 + 6 字典集合），修掉三处：

1. **dictionary/config.service 删除**——死代码（零调用方、库无数据），但它是现成的
   "AI 密钥/API Key 存字典"通道，一旦被用密钥就落进 DataCollections 可见的地方。
   密钥只走 env 注入，不进库
2. **备份接口收权**——backups/* 全员 @AllowNoPerm 裸奔（guard 里 AllowNoPerm 先于
   超管检查直接放行，注释却宣称"仅超管"），任何登录账号可下载整库备份。
   收为 @Perm("DatabaseBackup")，码 70/71 只发管理员角色
3. **短链管理收权**——/system/short-link CRUD 无任何权限标注（无标注默认放行）。
   收为 @Perm("ContentShortLink")（对齐前端菜单码），码 72/73

审计通过：op_biz_* 13 业务表专表+模块权限门；RBAC/日志/OSS/文章/文档/表单/i18n
专表且门齐；字典 6 集合全是业务内容数据（服务目录迁出后字典侧已无基础设施数据）。
"无标注接口默认拒绝"仍挂账——短链就是默认放行的实际受害者，做时以此为例。

## 前一迭代：服务目录迁专表（2026-08-24 完成，已合 main）

服务目录从字典集合行迁到专表 `op_sys_service_registry`（字段列化，key/path_prefix
DB 唯一索引）。动机：字典是业务数据的地盘，DataCollections 权限在数据集合页一个
删除就能端掉整个目录——**基础设施数据与业务数据物理隔离**，专表只有 ServiceOps
门后的接口能写，字典侧任何操作够不着。probe 改经 registry service 读目录；
消费视图/前端/agent/proxy 零改动。迁移脚本 db/migrate_registry_to_table.sql。

## 前一迭代：zone 路由动态化（2026-08-24 完成，已合 main）

zone 路由从 next.config 启动时 rewrites 迁到 src/proxy.ts：60s TTL 拉服务目录 +
stale-while-revalidate（目录不可达沿用旧表），**登记/启停 zone 约 1 分钟生效、
主站零重启**——之前评估里"变更需重启"的最大缺口已消。registry 同时加保留前缀
校验（/api /auth /embed 不可登记为 zone 前缀）。
遗留观察：zone SSR introspect 偶发失败静默降级为未登录（既有容错，刷新即恢复），
zone 变多后若成为可感知问题，考虑 introspect 加一次重试。

## 前一迭代：zone 共享登录收口（2026-08-24 完成，已合 main）

zone 未登录引导定为**跳转**：`/auth?redirect=` 回跳（同源校验：只收 `/` 开头且非 `//`，
防 open redirect；跨 zone 硬导航 window.location）。另两条通道已实现、浏览器验证过，
保留为资产不删：@optimus/auth-ui 共享包（同栈构建时，只发 dist，主站不暴露源码）、
/auth/login-embed iframe 通道（postMessage，异构/外部子应用）。
业务复杂到弹层体验值得时，再切共享包——届时 zone 只改 SignupPanel 一处。

## 前一迭代：zone-foundation（2026-08-24 完成，已合 main）

C 端 Multi-Zones 落地（微前端三模式的模式二）：

- 目录 entryType 加 `zone`（pathPrefix 单段小写、全域唯一）；`/api/public/zone-routes`
  匿名读口（消费方是 next server 进程无 token 可带，限频，生产网关可屏蔽收口）
- **管控落点**：服务状态页登记/启停 zone，optimus-next 启动时从目录拉路由表
  生成 rewrites（每 zone 三条：裸前缀/子路径/静态资产）；目录不可达回退空表不阻启动
- packages/zone-activity（8088）：basePath+assetPrefix 两行配置即成 zone；
  SSR 页实证登录态无缝（clientAccessToken cookie 同域直达，introspect client 分支，
  zone 零登录代码）与基础能力直通（集合数据直读）
- 纪律：跨 zone 链接用 a 标签；assetPrefix 约定 = pathPrefix + "-static"
- 存量瑕疵记录：public-i18n/public-dictionary 实际挂在双 /api 前缀下
  （controller 路径重复了全局前缀），公开接口硬化时统一；新接口一律裸路径

## 前一迭代：service-registry（2026-08-23 完成，已合 main）

服务目录 = 人与 AI 共用的接入面，探测/动态菜单/Agent 工具三个消费者的唯一事实源：

- `/system/services` CRUD（门 ServiceOps）：URL 校验（仅 http(s)/禁用户信息段/
  embed 必填 embedUrl），变更发 service.registered/updated/removed 审计事件
- 动态入口：目录 entryType=embed 条目 → 菜单项（照抄动态文档菜单模式）→
  固定宿主路由 /embed/:serviceKey → EmbedFrame 握手。**菜单是页面加载时拉取的,
  登记后已开页面需刷新**
- Agent 工具发现改读目录（tool-providers 最小披露），env 兜底；实测改 toolsPath
  不重启即生效。多 provider 各带自己的 base（baseUrl 语义 = API 根,可含路径前缀,
  拼接用字符串不用 new URL——绝对路径会吃掉 base 前缀）
- demo-activity 迁为目录动态接入，routes.js 静态节点下线（零代码接入实证）
- 踩坑：op_sys_dictionary 唯一键含 user_id,NULL 不判重,INSERT IGNORE 不幂等,
  seed 一律 NOT EXISTS 守护；集合 seed 不硬编码 id（会被环境后建集合占用）

## 上一迭代：service-ops + 周边（2026-08-23 完成，已合 main）

- 服务治理三件套：op_sys_service_event 事务性 outbox（id 即游标,双读语义）、
  ServiceProbe 15s 探测（状态内存态）、/metrics-lite 自采样 + 管理端服务状态页
- agent run 结束自动上报 agent.run.finished（fire-and-forget）
- 菜单收敛：下线"翻译管理"（与多语言管理撞车,嵌入样例角色由演示活动承担）
- 单测基线：public-article 测试修复对齐现实现;partner/points-engine 9 个
  init 即失衡的测试屏蔽（testPathIgnorePatterns,随迁移修复）——全量 148/148 绿,
  "全量绿"恢复为有效回归信号
- 环境教训：OrbStack 可能随会话中断自动退出；api 在库死期间启动会留下坏连接池
  的僵尸进程（症状是"系统尚未初始化"403）,清杀重启即愈

## 前一迭代：agent-tool-protocol（2026-08-23 完成，agent-foundation 三处定位修正）

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
**遗留**：内容变体多语言未做。（iframe 版翻译工作台已于菜单收敛时下线）

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
- ~~无标注接口的"默认拒绝"收紧~~ **已完成（见下方 Completed）**
- RolesGuard（旧守卫）清理：权限判断逻辑整段被注释掉、等同永远放行，
  UnifiedAuthGuard 全局先执行使其无害但属废弃代码，找机会删除
- partner-admin.controller.ts 的 dashboard 接口 500（`op_biz_task_completion_log`
  表不存在，权限收权时顺带发现，与本次改动无关，历史遗留）
- i18n-platform 迁移为内部模块（现阶段 iframe 引用）
- optimus-next 的 ComingSoon 文档页补全与文档搜索后端

## Completed

- [x] service-registry（服务目录：注册即接入，探测/菜单/工具统一事实源；demo-activity 零代码迁移实证）
- [x] service-ops（事件 outbox + 探测面板 + metrics-lite + dev:all；微服务生态调研结论存档于其 proposal）
- [x] 菜单收敛（下线翻译管理，多语言单入口）
- [x] 单测基线（public-article 修复 + 失衡测试屏蔽，全量 148/148 绿）
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

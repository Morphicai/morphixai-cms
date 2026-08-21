## 1. 固化现状（前置，独立于新功能）

- [x] 1.1 现有 6 处未提交改动分三个 commit 提交：观测集成（craco.config.js + package.json + pnpm-lock）、数据库连接稳定性修复（app.module.ts）、初始化状态误判修复（App.js）
- [x] 1.2 启动要点写入仓库文档：数据库经容器域名直连（.env 不入库故必须成文）、common 包需先构建、包管理器必须用 package.json 锁定版本、开发环境验证码为直通
- [x] 1.3 TASKS.md 重写为本迭代计划，清掉 3 月过时内容

## 2. 路由级权限（route-permission）

- [x] 2.1 新增 `@Perm(<码>)` 装饰器（shared/decorators/，setMetadata 方法级优先）
- [x] 2.2 `UnifiedAuthGuard.validateRolePermissions` 填空：读装饰器元数据 → 无标注放行 → 查 `findUserPermissionCodes` 比对 → 不含则 403；拒绝时 warn 日志（userId/路由/所需码）
- [x] 2.3 导出 role 1/2/3 当前权限码清单，人工核对与真实使用一致后再打标（发现漂移：库存 NewsManagement/ActivityManagement，routes.js 对应节点 code 为 NewsArticles/ActivityArticles——这两个模块暂缓打标，需决定以哪边为准）
- [x] 2.4 存量控制器按 19 个权限码打标（article/category → ContentManagement，user/role/perm → PermissionManagement 系列，其余对照菜单码）
- [x] 2.5 收紧双前缀路由：实测后端本就 404，"宽容"是 UI 代理层改写的假象；真正的问题是 dashboard 两处调用把 /api 写进路径（也是工作台统计一直为空的成因），已改为相对路径
- [x] 2.6 删除 casl-demo 模块与 shared/examples 控制器，CaslAbilityFactory 保留不注册
- [x] 2.7 验收：仅持 Dashboard 码的账号 curl 文章接口得 403、持码账号得 200、超管全通、无标注接口行为不变；补一个守卫单测覆盖这四种情形
- [x] 2.8 输出无 @Perm 标注路由清单脚本（下一轮收紧的输入，不在本轮处理）

## 3. 智能辅助写作（ai-writing-assist）

- [x] 3.1 新增 system/ai 模块：AiService（原生 fetch 调 OpenAI 兼容 chat/completions，baseUrl/model/apiKey 全走环境变量，缺配置返回明确错误）
- [x] 3.2 `POST /api/ai/assist`（动作 summary/polish/continue + 原文），挂 `@Perm('ContentManagement')`，按用户内存限频每分钟 6 次超限 429
- [x] 3.3 文章编辑器加「智能辅助」入口：三个动作、结果预览、用户采纳才写入正文
- [ ] 3.4 验收：真实生成一篇摘要并保存为文章；无 key 环境返回配置提示；限频生效

## 4. 翻译工作台入口（translation-workbench-entry）

- [ ] 4.1 role 1 补权限码 `TranslationManagement`（INSERT，记录回滚语句）
- [ ] 4.2 前端新增「翻译管理」菜单与页面（权限码控制显隐与直达），iframe 地址可配置默认 5181，目标未启动时显示提示与启动指引
- [ ] 4.3 验收：从 CMS 菜单进入完成一次真实批量翻译；无权限角色菜单不可见且直达被拒

## 5. 收尾

- [ ] 5.1 axios transformResponse 修复：非 JSON 上游错误原样透传，不再伪装成解析失败
- [ ] 5.2 已初始化系统隐藏「系统安装」菜单项
- [ ] 5.3 全流程验收：登录 → 越权 403 → AI 生成入库 → 翻译工作台走通；以观测工具留存验收会话
- [ ] 5.4 本迭代改动分模块提交（中性命名），更新 PROJECT_STATUS

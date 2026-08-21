## Context

平台现状（2026-08 体检结论）：认证链完整（Initialization → JWT，三种模式统一），但授权只在前端生效。数据模型已就位——`user → user_role → role → role_menu(permission_code)`，库里 19 个权限码；`PermService.findUserPermissionCodes()` 已能查出用户权限码（超管返回 `["*"]`），只是后端没人消费它。CASL 引进过（factory/guard/decorator 全套 + demo），业务零使用，属于当年选型纠结的遗留。

AI 与翻译两个业务都要落在这套权限上，所以权限闭环是本迭代其余部分的前置。

## Goals / Non-Goals

**Goals:**
- 非超管用户调用未授权接口时，后端返回 403（不再只是"菜单看不见"）
- 权限声明方式对业务开发者只有一个心智单位：控制器/方法上一行 `@Perm('码')`
- 文章模块可用 AI 生成摘要、润色、续写，且密钥零落盘
- 从 CMS 菜单可进入翻译工作台完成真实翻译工作

**Non-Goals:**
- 不做资源级/字段级权限（CASL 场景）——封存待未来真实需求
- 不迁移 i18n-platform 代码进本仓库——iframe 引用，保持两系统边界
- 不做 AI 对话式交互——只做编辑器内三个固定动作
- 不动 antd v4→v5 迁移、dashboard 统计等既有技术债

## Decisions

**D1：权限载体用现有 permission_code，不启用 CASL**
前端菜单显隐已经消费权限码，后端复用同一套码意味着前后端权限**同源**——加一个业务只登记一个码。CASL 的能力模型（action/subject/conditions）对"路由级放行"是杀鸡用牛刀，且五个月零业务使用已证明团队不需要它的心智负担。备选方案（补全 CASL 到所有控制器）被否：每个接口要写 policy handler，声明成本约 5 倍。

**D2：`@Perm` 校验逻辑长在 `validateRolePermissions` 里，不新建守卫**
UnifiedAuthGuard 已是全局唯一认证入口且预留了这个空方法（原注释"这里可以扩展"）。新建守卫会引入执行顺序问题（NestJS 多守卫按注册序执行），填空实现零顺序风险。装饰器无标注的接口维持现状放行——先让打了标的接口真实生效，逐步收紧到"默认拒绝"是后续迭代的事（一步到位会把未梳理的长尾接口全打死）。

**D3：AI 接入用原生 fetch + OpenAI 兼容协议，不引 SDK**
只调一个 chat/completions 端点，引 openai SDK 为一个 POST 不值当（还带来版本升级面）。baseUrl/model/apiKey 全部从环境变量读，.env 不入库；接口挂 `@Perm('ContentManagement')`——AI 辅助是内容能力的一部分，不单设权限码，避免码表碎片化。

**D4：翻译工作台 iframe 内嵌，不做反向代理**
i18n-platform 是独立可运行系统（也是独立软著），代码互不掺和是权利边界最干净的形态。CMS 只贡献：菜单项、权限码 `TranslationManagement`、一个装 iframe 的页面。备选方案（Nest 反向代理到 5181 统一域名）被否：多一层转发只为省一个端口，不值。开发期两进程并跑由启动文档约定。

**D5：axios transform 修复原则——网络层错误不得伪装成解析错误**
`transformResponse` 先判断字符串是否以 `{`/`[` 开头再 parse，否则原样返回并保留 status 信息。不改成 responseType 方案（改动面大，波及所有既有调用点的兼容行为）。

## Risks / Trade-offs

- [打标后二级角色被锁死] 现有 role 2/3 的权限码若与实际使用不符，上线即 403 → 打标前先导出三个角色的权限码清单人工核对；守卫加 warn 日志（打印被拒的 user/route/code）便于快速定位
- [无标注接口维持放行，收紧不彻底] 长尾接口仍是"JWT 即可调" → 接受为本迭代边界，tasks 里留清单化脚本（列出所有无 @Perm 的路由）供下一轮收紧
- [iframe 内嵌的会话割裂] i18n-platform 无登录体系，iframe 直接可用；若未来它加了鉴权需再设计 SSO → 现阶段两系统都仅本机使用，风险接受
- [AI 接口费用] 每次调用消耗 OneRouter 额度 → 接口按用户限频（简单内存计数，每用户每分钟 6 次），超限 429

## Migration Plan

1. 权限码数据：为 role 1 补 `TranslationManagement`（INSERT，可逆）
2. 代码上线顺序：守卫填空（无标注=放行，上线无感）→ 控制器逐模块打标 → 前端菜单/页面
3. 回滚：任一环节出问题，删除 @Perm 标注即恢复现状；数据回滚一条 DELETE

## Open Questions

- 二级角色（role 2/3）的权限码清单与真实使用是否一致——打标时人工核对后定
- AI assist 的模型名用哪个（走 OneRouter 的哪个模型）——实现时以环境变量给默认值，不写死

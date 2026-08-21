## Why

平台的权限模型只闭环了一半：菜单显隐由权限码控制，但后端守卫对非超管用户没有任何路由级校验——JWT 有效就能调任何业务接口，权限管理形同虚设。同时平台没有一行 AI 能力、没有翻译业务入口，与"承载各业务场景的管理后台"的定位差距明显。这三个缺口互相依赖（AI 与翻译都需要权限载体），一次迭代补齐才算闭环。

## What Changes

- 后端新增 `@Perm(<权限码>)` 装饰器，`UnifiedAuthGuard.validateRolePermissions` 消费用户权限码做路由级拦截；存量控制器按现有 19 个权限码打标
- 移除 CASL 演示代码（casl-demo 模块、examples 控制器）；CaslAbilityFactory 保留但不再作为权限主路径
- 收紧路由匹配：`/api/api/...` 双前缀请求不再被宽容接受
- 新增 AI 辅助写作：后端 `AiService` + `POST /api/ai/assist`（OpenAI 兼容协议，baseUrl/apiKey 只从环境变量读取），文章编辑器增加智能辅助入口（生成摘要 / 润色 / 续写）
- 新增「翻译管理」菜单与权限码 `TranslationManagement`，页面内嵌本机 i18n-platform（不重写、不迁移其代码）
- 前端 axios 响应转换不再无条件 JSON.parse（非 JSON 上游错误原样透传，不再把网络故障伪装成解析失败）
- 已初始化的系统隐藏「系统安装」菜单入口

## Capabilities

### New Capabilities
- `route-permission`: 基于权限码的后端路由级访问控制（装饰器声明 + 守卫拦截 + 超管豁免 + 白名单）
- `ai-writing-assist`: 文章模块的 AI 辅助写作（摘要/润色/续写，模型经 OpenAI 兼容协议接入）
- `translation-workbench-entry`: 翻译工作台入口（菜单 + 权限码 + 内嵌页面）

### Modified Capabilities
<!-- openspec/specs/ 为空,本仓库首次使用 openspec,无既有 spec 可修改 -->

## Impact

- **后端**：`shared/guards/unified-auth.guard.ts`（补实校验）、`shared/decorators/`（新增 perm 装饰器复用或扩展）、各业务 controller（打权限码标注）、新增 `system/ai/` 模块；删除 `system/casl-demo/`、`shared/examples/`
- **前端**：`constants/routes.js`（翻译菜单 + 权限码）、文章编辑器组件（AI 按钮）、`shared/utils/axios.js`（transform 修复）、菜单渲染（安装项隐藏）
- **数据**：`op_sys_role_menu` 需为管理员角色补 `TranslationManagement` 权限码记录（一条 INSERT，可回滚）
- **外部依赖**：模型服务走 OpenAI 兼容协议，密钥经环境变量注入，不进配置文件与仓库；i18n-platform 作为独立进程被 iframe 引用，其代码零改动
- **兼容性**：打标后，此前"任何登录用户都能调"的接口开始真正校验权限——现有 3 个角色的权限码需核对，避免上线即把二级角色锁在门外

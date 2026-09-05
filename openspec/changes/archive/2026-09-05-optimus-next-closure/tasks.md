# Tasks: optimus-next 闭环修复

## 1. 后端（optimus-api）

- [x] 1.1 PublicDictionaryController 补 `@AnonymousAuth()`
- [x] 1.2 seed SQL：dynamic-content 集合（public_read）+ hero.title/hero.subtitle 两条；dev 库同步执行

## 2. 认证单链路（optimus-next）

- [x] 2.1 代理 route.ts：转发后端 Set-Cookie，删结构不匹配的 setAuthCookies/clearAuthCookies
- [x] 2.2 BaseHttpService：baseURL 默认 `/api`；删 token 注入与主动刷新；401 → cookie refresh → 重放；跳转 /auth
- [x] 2.3 TokenService 重写：不再管 token，改为用户信息缓存（localStorage clientUserInfo）
- [x] 2.4 sdk/index.ts：getCurrentUser/isLoggedIn/logout 适配新链路
- [x] 2.5 AuthProvider：login 用响应 user；register 后自动 login；logout 调后端接口；mount 时 /me 校验
- [x] 2.6 登录跳转统一 /auth（sdk/index、BaseHttpService、lib/api、profile 页）

## 3. DynamicContent 接通

- [x] 3.1 DynamicContentSDK：get/getBatch/query 改指 /api/dictionary/dynamic-content，适配 ResultData 与 {type,value} 约定
- [x] 3.2 首页 Hero 传 hero.title/hero.subtitle key，defaultValue 保持现有文案

## 4. 清理与隔离

- [x] 4.1 删 contexts/AuthContext.tsx、components/LoginForm.tsx、hooks/useAuth.ts
- [x] 4.2 ArticleSDK 删四个无后端方法
- [x] 4.3 middleware.ts：非开发环境调试页 404
- [x] 4.4 死链修复（Header /settings、pricing /auth/register 与 /contact 与 /docs/enterprise、Footer 三链、docs 示例文案内 /login）
- [x] 4.5 恢复 reactStrictMode: true

## 5. 配置与文档

- [x] 5.1 补 .env.example（OPTIMUS_API_URL）
- [x] 5.2 重写 docs/AUTH_USAGE.md 为真实链路
- [x] 5.3 TASKS.md 记录 ArticleSDK/articleService 双实现待合并

## 6. 验收

- [x] 6.1 next build 通过
- [x] 6.2 浏览器全链路：注册→自动登录→profile→登出；blog/news 列表出数据
- [x] 6.3 改字典 hero.title → 首页文案变化；停后端 → 首页降级默认文案
- [x] 6.4 生产模式（next start）访问 /debug-login 得 404

# Proposal: optimus-next 闭环修复

## Why

optimus-next（C 端门户）自 init 后停滞，带病部署在 8086：登录链路指向死端口导致全站认证功能瘫痪、
四套 HTTP/认证栈并存、DynamicContent 后端断链、debug 页与官网同域裸奔。本迭代不加新功能，
只把现有逻辑修到能自圆其说——每个已有的功能要么真正工作，要么被明确移除。

## What Changes

1. **认证与请求收敛为单链路**：同源 `/api` 代理 + httpOnly cookie。SDK 不再自管 token
   （httpOnly 后前端本来就读不到），身份信息来自登录响应 + `/client-user/me` 校验；
   代理转发后端 Set-Cookie（修掉现在解析响应体结构不匹配、cookie 根本设不上的 bug）
2. **DynamicContent 接通**：后端 PublicDictionaryController 补 `@AnonymousAuth()`
   （设计上就是 C 端公开接口，服务层有 accessType 门禁）；SDK 改指
   `/api/dictionary/dynamic-content/:key`；首页 Hero 传真实 key，种子数据入库——
   后台改文案、首页生效，形成可演示的闭环
3. **死代码与死链清理**：删 AuthContext/LoginForm/useAuth 孤儿链、ArticleSDK 四个无后端
   方法；登录跳转统一 `/auth`；死链改指存在页面
4. **demo/debug 页生产隔离**：middleware 在非开发环境对 8 个调试页返回 404
5. **配置与文档**：补 `.env.example`；重写 AUTH_USAGE.md 为真实链路；恢复 reactStrictMode

## Non-Goals

- 不补 ComingSoon 文档页内容，不做文档搜索后端
- 不动 optimus-ui / 管理端
- services 层（lib/api.ts 底座）已是正确形态，保留不重构

## Impact

- optimus-next 全包 + optimus-api 一个 controller 装饰器 + seed SQL 两条
- 登录/注册/个人中心/blog/news 从"看起来有"变成"真的能用"

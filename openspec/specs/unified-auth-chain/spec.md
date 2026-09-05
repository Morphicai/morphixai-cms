# unified-auth-chain Specification

## Purpose
TBD - created by archiving change optimus-next-closure. Update Purpose after archive.
## Requirements
### Requirement: 单一认证链路
C 端全部 HTTP 请求 SHALL 走同源 `/api` 代理，认证态 SHALL 仅由 httpOnly cookie 承载（后端 login/refresh/logout 写入与清除），前端代码 SHALL NOT 读写 token。用户身份信息来自登录响应体与 `/client-user/me`。

#### Scenario: 登录设置 httpOnly cookie
- **WHEN** 用户在 /auth 页提交正确的用户名密码
- **THEN** 浏览器收到 httpOnly 的 clientAccessToken/clientRefreshToken cookie，页面显示登录态，document.cookie 中读不到 token

#### Scenario: 认证接口凭 cookie 放行
- **WHEN** 已登录用户访问 /profile
- **THEN** /client-user/profile 等接口经代理携带 cookie 返回 200，页面展示用户数据

#### Scenario: access token 过期自动续期
- **WHEN** access token 失效（401）而 refresh token 仍有效
- **THEN** 前端自动调用 /client-user/refresh（凭 cookie）后重放原请求，用户无感知

#### Scenario: 未登录访问受保护页
- **WHEN** 未登录用户访问 /profile
- **THEN** 跳转到 /auth（不是不存在的 /login 或 /auth/login）

### Requirement: 注册即登录
注册成功后 SHALL 自动完成登录（后端注册接口不发 token，由前端串联 login）。

#### Scenario: 注册后免二次登录
- **WHEN** 用户完成注册
- **THEN** 页面直接进入登录态，无需再输一次密码


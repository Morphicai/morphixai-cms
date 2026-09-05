# auth-introspection Specification

## Purpose
TBD - created by archiving change platform-base-sdk. Update Purpose after archive.
## Requirements
### Requirement: Token 自省接口

系统 SHALL 提供 `POST /api/auth/introspect`，接受 `{ token, type: "admin"|"client" }`，
对有效 token 返回 `{ active: true, user, perms? }`，对无效/过期/伪造 token 一律返回
`{ active: false }` 且 HTTP 200。

#### Scenario: 有效管理端 token
- **WHEN** 以有效管理员 accessToken 调用 introspect（type=admin）
- **THEN** 返回 active=true、user 基本信息、该用户全部权限码数组

#### Scenario: 有效 C 端 token
- **WHEN** 以有效 client-user accessToken 调用（type=client）
- **THEN** 返回 active=true 与 client 用户信息，无 perms 字段

#### Scenario: 无效 token 不泄露失败原因
- **WHEN** 以过期、被篡改、或随机字符串调用
- **THEN** 均返回 HTTP 200 `{ active: false }`，响应体不区分失败原因

#### Scenario: 限频
- **WHEN** 单 IP 短时间内高频调用
- **THEN** 超限请求被 429 拒绝

### Requirement: server-sdk 封装

`@optimus/server-sdk` SHALL 提供 `introspect(token, type)`，内置按 token 的短 TTL
缓存，零第三方依赖。

#### Scenario: 缓存
- **WHEN** 60s 内以同一 token 调用两次
- **THEN** 第二次不发起 HTTP 请求


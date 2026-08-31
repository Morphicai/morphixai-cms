## Why

`/auth/introspect` 只能自查（拿着这个人的 token 才能查到这个人的资料），没有任何
"服务方凭自己的信任状态查任意 uid 的完整资料"的接口。partner-service 现在的
应对方式是在 `partner_profile` 表里冗余存一份加入合伙人计划那一刻的 `username`
快照——这份快照此后不会跟着 client-user 主表的用户名/昵称变化更新，是已验证的
数据漂移案例。多业务团队场景下，这个问题只会更频繁地重复发生：每个需要"显示
某个用户信息"的子服务都会各自攒一份会过期的冗余副本。这个能力依赖
`platform-service-token`——用服务身份发起查询，而不是借某个用户的 token 去查
别人的资料。

## What Changes

- optimus-api 新增一个跨服务的用户资料查询接口，按 uid 返回用户的公开资料字段
  （昵称、邮箱、注册时间等——不包含密码等敏感字段）
- 该接口要求调用方持有有效的 service token（依赖 `platform-service-token`），
  不对未鉴权或用户身份的调用开放
- `@optimus/platform-client` 补充对应的查询方法封装

## Capabilities

### New Capabilities

- `cross-service-user-profile-query`：服务凭自身身份查询任意用户公开资料的能力

### Modified Capabilities

（无——是新增查询能力，不改变 `/auth/introspect` 自省或 client-user 现有自查
接口的行为）

## Impact

- `optimus-api`：`business/client-user`（新增查询方法）、新增受 service token
  保护的接口
- `@optimus/platform-client`：新增查询方法封装
- `partner-service`：后续可选择用这个接口替换 `partner_profile.username` 的
  一次性快照，改为按需查询（不在本次强制要求范围）

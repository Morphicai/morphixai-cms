## 1. 前置确认

- [ ] 1.1 确认 design.md 的 Open Question：是否需要限定"哪些服务可调用"，
      如需要则先明确落地方式（服务目录权限标记 / 其它），再继续后续任务
- [ ] 1.2 确认 `platform-service-token` 已上线且可用（本变更强依赖它）

## 2. 接口实现

- [ ] 2.1 `ClientUserService` 新增按 uid 查询公开资料的方法，字段白名单：
      昵称、头像、邮箱、注册时间
- [ ] 2.2 新增受 service token 保护的接口（复用 `platform-service-token` 的
      自省能力做鉴权），拒绝 admin/client 用户 token 调用
- [ ] 2.3 处理"用户不存在"场景，返回明确结果而非空对象

## 3. SDK 封装

- [ ] 3.1 `@optimus/platform-client` 补充用户资料查询方法

## 4. 验收

- [ ] 4.1 单测覆盖 spec 中的场景：存在用户查询成功、不存在用户查询、用户 token
      调用被拒绝、未鉴权调用被拒绝、敏感字段不出现
- [ ] 4.2 手工验证：用一个真实签发的 service token 查询一个真实用户，确认
      返回字段与白名单一致
- [ ] 4.3 全量单测跑绿，提交、合 main

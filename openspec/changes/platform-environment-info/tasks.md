## 1. 接口实现

- [ ] 1.1 新增公开只读接口（参照 `public-i18n.controller.ts` 的匿名 + 限频约定），
      读取现有 `SITE_DOMAIN`/`COOKIE_DOMAIN`/`NODE_ENV` 组装返回
- [ ] 1.2 确认三个环境（dev/test/prod，e2e 视情况）各自的配置值均已存在于对应
      config 文件/环境变量中，不需要新增配置项，只是新增读取出口

## 2. 验收

- [ ] 2.1 单测覆盖 spec 中的两个场景（正常查询、超限频拒绝）
- [ ] 2.2 手工验证：当前 dev 环境请求接口，返回值与 `oss.controller.ts`/
      `client-user.controller.ts` 里实际生效的 `SITE_DOMAIN`/`COOKIE_DOMAIN` 一致
- [ ] 2.3 api 全量单测跑绿，提交、合 main

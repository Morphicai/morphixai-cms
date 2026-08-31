## 1. `@optimus/platform-client` 包骨架

- [ ] 1.1 建 `packages/platform-client`（workspace 包，参照 `server-sdk`/`client-sdk`
      的项目结构），依赖 `@optimus/server-sdk` 获取 token
- [ ] 1.2 实现 OSS 上传封装，对齐 `optimus-api-client.ts` 的 `uploadFileViaOptimusApi`
      契约
- [ ] 1.3 实现短链生成封装，对齐 `shortenViaOptimusApi` 契约

## 2. 依赖能力就绪后补充

- [ ] 2.1 `platform-environment-info` 上线后，补充环境信息查询方法
- [ ] 2.2 `platform-service-token` 上线后，`server-sdk` 补 `getServiceToken()`/
      `verifyServiceToken()`，与既有用户 token 委托模式并列

## 3. CI 强约束

- [ ] 3.1 编写静态扫描规则（正则匹配裸 `fetch` + 平台接口路径特征），接入 CI
- [ ] 3.2 确认规则只对新增/修改的代码生效，不追溯拦截已知存量违规
      （如 partner-service 现有实现）
- [ ] 3.3 更新新服务接入检查清单文档，新增"是否只通过官方 SDK 访问平台能力"必过项

## 4. 验收

- [ ] 4.1 单测覆盖 spec 中列出的场景（上传/短链/环境信息封装、CI 规则拦截与放行）
- [ ] 4.2 用一个真实调用场景手工验证：新写一段调用 `platform-client` 的示例代码，
      确认端到端可用
- [ ] 4.3 全量单测跑绿，提交、合 main

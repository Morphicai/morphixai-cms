## 1. 落地前修复（在 optimus-api 里先做，验证后再随迁移带走）

- [ ] 1.1 全库搜索 `UserService` 在 order 模块内的调用点，确认零调用后，
      删除 `order.module.ts` 中的 `UserModule` 导入
- [ ] 1.2 确认支付回调地址（域名/路径）的配置方式：是网关侧手动配置还是自动
      跟随服务迁移，如为手动配置需提前规划切流时间窗口（design.md Open
      Questions）
- [ ] 1.3 api 全量单测 + 手工验证下单/支付回调/订单查询功能不回归，提交这一小步

## 2. order-service 骨架

- [ ] 2.1 建 `packages/order-service`（参照 `partner-service`/`marketing-service`
      项目结构）
- [ ] 2.2 数据库连接配置（同一 MySQL 实例，`synchronize:false`）
- [ ] 2.3 IntrospectAuthGuard 本地实现
- [ ] 2.4 暴露 `healthPath`/`metricsPath`

## 3. 业务模块搬迁

- [ ] 3.1 搬迁 order 模块（controller/service/entity/DTO，含各类产品处理器/
      校验器：角色转区、建公会等）
- [ ] 3.2 支付回调路径重点验证：确认迁移后回调地址与迁移前一致，或已协调好
      网关侧配置变更
- [ ] 3.3 管理页面实现（参照既有 embed 管理页模式）

## 4. 服务目录接入与验证分流

- [ ] 4.1 服务目录新增 order-service 条目：`entryType=embed`，`apiPathPrefixes`
      覆盖对外路径
- [ ] 4.2 `optimus-ui` 静态路由节点下线，菜单改走动态 embed 入口
- [ ] 4.3 编写/扩展自动化闭环验证脚本，覆盖 C 端下单、支付回调、管理端订单
      查询的真实多进程验证——支付回调这一步必须包含在闭环验证内，不能只测
      正常下单流程
- [ ] 4.4 浏览器验证管理端 embed 页操作正常

## 5. 收尾：确认分流生效后删除 optimus-api 侧代码

- [ ] 5.1 optimus-api 里 order 目录整体删除，`app.module.ts` 移除注册
- [ ] 5.2 `jest.unit.config.js` 移除相关屏蔽条目（如有）
- [ ] 5.3 删除后重跑闭环验证脚本（含支付回调场景），确认分流生效

## 6. 存量单测迁移

- [ ] 6.1 order 模块存量测试随迁移搬到 order-service，逐个确认通过
- [ ] 6.2 order-service 全量单测跑绿

## 7. 验收

- [ ] 7.1 功能等价性：下单、支付回调、订单查询确认、各产品处理器逻辑，
      经 embed 页与真实调用与迁移前行为一致
- [ ] 7.2 支付回调专项验证：真实（或沙箱）支付网关回调能正确送达并处理
- [ ] 7.3 SDK 强约束验证：确认 order-service 代码中没有裸写 HTTP 调用平台接口
- [ ] 7.4 api + order-service 全量单测跑绿，提交、合 main、推送

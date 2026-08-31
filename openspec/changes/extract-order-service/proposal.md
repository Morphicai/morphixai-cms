## Why

按业务属性划分的架构决策已确认：订单域（order）由独立团队维护，物理拆分复用
`extract-partner-service` 验证过的迁移路径。按决策②的建议顺序，本次在
`extract-marketing-service` 完成之后开始——订单域相比营销域体量更大、
业务逻辑更复杂（多种"产品处理器/校验器"：角色转区、建公会等），先用营销域
验证一遍迁移路径和 SDK 强约束（决策④）在真实场景下的可用性，再拆风险更高的
订单域。

## What Changes

- 新建独立 Nest 服务 `packages/order-service`（参照 `partner-service`/
  `marketing-service` 的项目结构），承载 order 模块的全部对外接口
- 落地前修复：`order.module.ts` 中声明但从未实际使用的 `UserModule` 导入
  （全库搜索确认 `UserService` 在 order 模块内零调用点）予以清理
- 鉴权改为 introspect 模式
- 服务目录登记（`entryType=embed`），管理页面走动态 embed 入口
- 跨服务调用一律通过 `@optimus/platform-client`/`@optimus/server-sdk`
  （依赖 `platform-client-sdk` 已上线）
- 存量单测随迁移修复
- 验证分流生效后删除 optimus-api 侧原代码

**BREAKING**：无对外行为变化。

## Capabilities

### New Capabilities

- `order-service-runtime`：订单域独立服务的运行时基础（鉴权、服务目录接入、探测）

### Modified Capabilities

（无——order 模块的对外接口行为不变，只是物理承载位置迁移）

## Impact

- `packages/optimus-api`：删除 `src/business/order`，`app.module.ts` 移除对应注册
- `packages/order-service`：新建，结构参照 `partner-service`/`marketing-service`
- `optimus-ui`：订单相关管理页面菜单从静态路由改为动态 embed 入口
- 依赖：`platform-client-sdk`（SDK 强约束）、建议在
  `extract-marketing-service` 完成后再开始本次迁移
- 与营销域的未来联动（优惠券/折扣规则影响订单定价、订单完成触发营销奖励）
  不在本次范围内实现，见 design.md Non-Goals

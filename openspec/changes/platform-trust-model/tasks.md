## 1. 前置确认（实施前必须先定，见 design.md Open Questions）

- [ ] 1.1 grant 校验的表达方式：NestJS 装饰器（如 `@RequireGrant('points:grant')`）
      还是 SDK 显式调用。倾向装饰器（与现有 `@Perm` 心智一致）
- [ ] 1.2 信任级别先做两级（`first-party`/`third-party`）还是三级。若 `second-party`
      暂无真实实例，先做两级但枚举留扩展空间
- [ ] 1.3 主密钥轮换是否在本期支持双密钥并存。当前在线服务仅 1 个，倾向不做，
      但需在 design 中留明"服务变多后必须补"

## 2. 密钥模型改造（BREAKING）

- [ ] 2.1 `ServiceTokenService` 增加派生逻辑：HKDF-SHA256(主密钥, serviceKey) 导出
      该服务签名密钥；签发与验签均使用派生密钥，验签时按 token 的 `sub` 现算
- [ ] 2.2 平台侧确认不存储任何派生密钥；`op_sys_service_registry` 不新增任何密钥字段
- [ ] 2.3 `@optimus/server-sdk` 的 `getServiceToken()` 改用派生密钥；补
      `verifyServiceToken()` 对应改造
- [ ] 2.4 环境变量：`SERVICE_TOKEN_SECRET` 语义变为**主密钥**，更新
      `.env.example` 与注释说明其不可再直接用于签发
- [ ] 2.5 迁移 partner-service（当前唯一真实使用方）到新模型，验证签发/验签闭环
- [ ] 2.6 单测：跨服务签名互换必须失败（用 A 的派生密钥签 `sub=B` 的 token，验签拒绝）

## 3. 信任级别与 grants

- [ ] 3.1 `op_sys_service_registry` 新增 `trust_level`、`grants`（JSON）两列 + migration
- [ ] 3.2 服务目录管理端支持编辑信任级别与 grants；新登记时按级别填默认授权集
- [ ] 3.3 首批 grant code 定义：只定确实已有消费方的项
      （`user-profile:read-basic` / `user-profile:read-full` / `points:grant` /
      `oss:upload` / `shortlink:create`），不预先设计整套权限体系
- [ ] 3.4 `/auth/introspect` 的 `type=service` 分支返回 `trustLevel` 与 `grants`
- [ ] 3.5 `@optimus/server-sdk` 提供 grant 校验辅助（形态按 1.1 的结论）
- [ ] 3.6 验证：调整 grants 后无需重签 token / 重启服务即生效

## 4. 接入检查清单与文档

- [ ] 4.1 `platform-client-sdk` 的"新服务接入检查清单"增加两项：信任级别与 grants
      已登记；`third-party` 数据库实例独立
- [ ] 4.2 `ARCHITECTURE.md` 补信任模型一节：三级定义、grants 与 permCode 的关系、
      "信任级别 ≠ 业务重要性"这条澄清
- [ ] 4.3 三方服务接入指引：需要给对方什么（server-sdk / admin-embed / 目录登记规范 /
      派生密钥带外分发）、不给什么（主密钥、源码、库连接）

## 5. 关闭 platform-user-profile-query 的待拍板项

- [ ] 5.1 该变更 design.md 里"要不要限定哪些服务能查全量用户资料"的 Open Question
      改为已关闭，答案指向本变更的 grants（区分 read-basic / read-full）
- [ ] 5.2 其 specs 中「仅接受服务身份调用」相应补充 grant 校验要求

## 6. 验收

- [ ] 6.1 用 A 服务的派生密钥签发 `sub=B` 的 token，自省返回 `active: false`
- [ ] 6.2 模拟一个 `third-party` 服务：默认无任何 grant，调用受保护接口被拒；
      授予单项 grant 后仅该项可用
- [ ] 6.3 验证授权不可经用户身份绕过（转发高权限用户 token 不会提升服务级能力）
- [ ] 6.4 partner-service 全链路回归：`verify-closed-loop.mjs` 33 项断言全绿
- [ ] 6.5 更新 `TASKS.md`/`ROADMAP.md`，标记本变更完成
- [ ] 6.6 提交、合 main

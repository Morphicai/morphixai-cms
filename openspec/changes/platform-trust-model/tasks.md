## 1. 前置确认（已定，见下方结论；背景见 design.md Open Questions）

- [x] 1.1 grant 校验的表达方式 → **两者都要，各管一侧**：optimus-api 内用 NestJS
      装饰器 `@RequireGrant('points:grant')` + `ServiceGrantGuard`（与 `@Perm` 心智一致）；
      子服务侧用 `@optimus/server-sdk` 的 `hasGrant()`。它们是不同消费场景，不是二选一
- [x] 1.2 信任级别做几级 → **三级全定义**（`first-party`/`second-party`/`third-party`）。
      `second-party` 目前无真实实例，但定义成本为零，事后加值要改 migration 和已落库数据。
      默认授权集三级各不相同，三方为空
- [x] 1.3 主密钥轮换 → **本期不做**。当前在线服务仅 1 个，双密钥并存的复杂度不值得。
      **这是有意省略，服务变多后必须补**——届时轮换主密钥会让所有派生密钥同时失效

## 2. 密钥模型改造（BREAKING）

- [x] 2.1 `ServiceTokenService` 增加派生逻辑：HKDF-SHA256(主密钥, serviceKey) 导出
      该服务签名密钥；签发与验签均使用派生密钥，验签时按 token 的 `sub` 现算
- [x] 2.2 平台侧确认不存储任何派生密钥；`op_sys_service_registry` 不新增任何密钥字段
- [x] 2.3 `@optimus/server-sdk` 导出 `deriveServiceSecret()`，`getServiceToken()` 改用派生密钥
- [x] 2.4 环境变量：`SERVICE_TOKEN_SECRET` 语义变为**主密钥**，三处 `.env.example`
      （根 / optimus-api / partner-service）均已更新，明确标注主密钥不可下发给子服务
- [x] 2.5 partner-service 迁移：代码中并未实际消费 service token（`platform-service-token`
      完成时有意保留其本地 guard），迁移面仅 `.env.example` 语义说明。全量单测 110/110 绿
- [x] 2.6 单测：跨服务签名互换必须失败（用 A 的派生密钥签 `sub=B` 的 token，验签拒绝）
- [x] 2.7 两个包的派生实现由**共享 HKDF 测试向量**锚定（api 侧 9 用例 / sdk 侧 13 用例），
      任一边改算法、salt 或长度，两边测试同时变红

## 3. 信任级别与 grants

- [x] 3.1 `op_sys_service_registry` 新增 `trust_level`、`grants`（JSON）两列。
      补列脚本 `db/service_registry_trust_model.sql`，并同步 `db/service_ops_tables.sql`
      供全新环境一步到位
- [x] 3.2 服务目录管理端支持编辑信任级别与 grants；新登记默认 `first-party`；
      列表新增「信任」「授权」两列，三方标红便于巡检
- [x] 3.3 首批 grant code 定义（`service-trust.constants.ts`）：`user-profile:read-basic` /
      `user-profile:read-full` / `points:grant` / `oss:upload` / `shortlink:create`。
      白名单校验拼错的 code——否则会静默变成"永远不匹配"，表现为接口莫名 403
- [x] 3.4 `/auth/introspect` 的 `type=service` 分支返回 `trustLevel` 与 `grants`；
      grants 每次现读不写进 token，调整授权立即生效
- [x] 3.5 `@optimus/server-sdk` 提供 `hasGrant()`；`ServiceIdentity` 扩展 trustLevel/grants
- [x] 3.6 更新时不传 grants 保持原样（`entry.grants ?? existing?.grants ?? 默认集`），
      否则改个 name 就会把管理员收窄过的授权悄悄重置回默认值

## 4. 接入检查清单与文档

- [x] 4.1 `platform-client-sdk` 的「新服务接入检查清单」增加两项：信任级别与 grants
      已登记；`third-party` 数据库实例独立
- [x] 4.2 `ARCHITECTURE.md` 补信任模型一节：三级定义、grants 与 permCode 的关系、
      "信任级别 ≠ 业务重要性"这条澄清
- [x] 4.3 `docs/THIRD_PARTY_ONBOARDING.md`：给什么/不给什么、派生密钥怎么带外分发
      （命令已验证与测试向量一致）、接入检查清单、验收判据、四条常见误解

## 5. 关闭 platform-user-profile-query 的待拍板项

- [x] 5.1 该变更 design.md 的 Open Question 标记为已关闭，答案指向本变更的 grants
      （区分 read-basic / read-full）
- [x] 5.2 其 specs「仅接受服务身份调用」补充 grant 校验要求 + 两个 Scenario：
      有效 token 但无 grant 被拒、只有 basic 读不到完整资料

## 6. 验收

- [x] 6.1 用 A 服务的派生密钥签发 `sub=B` 的 token，自省返回 `active: false`
      （`service-token.service.spec.ts`「持有某服务密钥也无法冒充其它服务」）
- [x] 6.2 三方服务默认空 grants 调受保护接口被拒；授予单项后仅该项可用
      （`service-grant.guard.spec.ts`，9 用例）
- [x] 6.3 授权不可经用户身份绕过（管理员 token 过不了 service token 验签这一关）
- [x] 6.4 全量单测：optimus-api 155/155、server-sdk 13/13、partner-service 110/110 全绿；
      `tsc --noEmit -p tsconfig.build.json` 零错误
- [x] 6.5 **真实环境验收**（2026-09-05，Docker + MySQL + optimus-api:8084 真实运行）：
      - 补列脚本执行成功，7 个存量条目全部补上一方默认授权集
      - 派生密钥签发的 token 自省返回 `active:true` + `trustLevel` + `grants`
      - **冒充失败**：持 partner-service 派生密钥签 `sub=optimus-api`，自省 `active:false`
      - **旧模型失效**：主密钥直接签的 token 自省 `active:false`（确认 BREAKING 已生效）
      - **三方默认空 grants**：经真实 upsert 路径登记 `third-party` 条目，落库 `grants=[]`
      - **授权立即生效**：授予 `points:grant` 后，**同一个 token 未重签**，自省即返回新授权
      - **拼错的 grant 被拒**：`points:grantt` → 400「未知的 grant」
      - **改名不重置授权**：只传 name 不传 grants，授权保持 `["points:grant"]`
      - 验收后清理：测试条目已删除、admin 密码已还原、目录恢复 7 条原始记录
- [ ] 6.6 更新 `TASKS.md`/`ROADMAP.md`，标记本变更完成
- [ ] 6.7 提交、合 main

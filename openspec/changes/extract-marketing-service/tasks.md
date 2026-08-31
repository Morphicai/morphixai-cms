## 1. 落地前修复（在 optimus-api 里先做，验证后再随迁移带走）

- [ ] 1.1 读取 reward-claim-record 现有原生 SQL `innerJoin("op_biz_activity", ...)`
      的具体查询字段，评估 `ActivityService` 现有方法（`validateActivity`/
      `findByCode`）是否已覆盖，不足则新增方法
- [ ] 1.2 将该原生 JOIN 改为调用 `ActivityService` 的正规接口，验证行为不变
      （返回数据与修改前一致）
- [ ] 1.3 删除 reward-claim-record 内部从未被引用的重复 `ActivityService` 死代码
      （`reward-claim-record/services/activity.service.ts`），删除前确认零调用方
- [ ] 1.4 api 全量单测 + 手工验证奖励发放记录列表功能不回归，提交这一小步

## 2. marketing-service 骨架

- [ ] 2.1 建 `packages/marketing-service`（参照 `partner-service` 项目结构）
- [ ] 2.2 数据库连接配置（同一 MySQL 实例，`synchronize:false`）
- [ ] 2.3 IntrospectAuthGuard 本地实现（参照 partner-service）
- [ ] 2.4 暴露 `healthPath`/`metricsPath`

## 3. 业务模块搬迁

- [ ] 3.1 搬迁 activity 模块
- [ ] 3.2 搬迁 appointment 模块
- [ ] 3.3 搬迁 reward-claim-record 模块（已在 1. 中修复对 activity 的调用方式，
      迁移后保持同进程内的正规 service 调用）
- [ ] 3.4 管理页面实现（参照 partner-service 的 admin-app 模式，复用
      `@optimus/admin-embed` 握手协议）

## 4. 服务目录接入与验证分流

- [ ] 4.1 服务目录新增 marketing-service 条目：`entryType=embed`，`apiPathPrefixes`
      覆盖三个模块对外路径
- [ ] 4.2 `optimus-ui` 静态路由节点下线，菜单改走动态 embed 入口
- [ ] 4.3 编写/扩展自动化闭环验证脚本（参照 `partner-service/scripts/
      verify-closed-loop.mjs` 的结构），覆盖 C 端预约提交、管理端活动/奖励发放
      管理的真实多进程验证
- [ ] 4.4 浏览器验证管理端 embed 页操作正常

## 5. 收尾：确认分流生效后删除 optimus-api 侧代码

- [ ] 5.1 optimus-api 里对应目录整体删除，`app.module.ts` 移除注册
- [ ] 5.2 `jest.unit.config.js` 移除相关屏蔽条目（如有）
- [ ] 5.3 删除后重跑闭环验证脚本，确认分流生效而非"恰好还没删所以能用"

## 6. 存量单测迁移

- [ ] 6.1 三个模块的存量测试随迁移搬到 marketing-service，逐个确认通过
      （现状这三个模块的测试未被记录为失衡状态，预期改动量小于
      partner-service 那次，但仍需逐个确认而非假设）
- [ ] 6.2 marketing-service 全量单测跑绿

## 7. 验收

- [ ] 7.1 功能等价性：活动管理、预约留资 + 公开统计、奖励发放流水，经 embed
      页操作与迁移前行为一致
- [ ] 7.2 SDK 强约束验证：确认 marketing-service 代码中没有裸写 HTTP 调用平台
      接口，全部通过 `@optimus/platform-client`/`@optimus/server-sdk`
      （决策④在真实迁移场景下的第一次验证）
- [ ] 7.3 api + marketing-service 全量单测跑绿，提交、合 main、推送

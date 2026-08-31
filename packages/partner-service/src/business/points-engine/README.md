# 积分引擎（points-engine）

合伙人计划的积分核心：监听领域事件 → 判定任务完成 → 按规则算分 → 落一条完成日志。
**积分余额不落表**，是按任务完成日志实时汇总出来的（带内存缓存，见 `CACHE_GUIDE.md`）。

> 这个模块原先在 `packages/optimus-api` 里，已随合伙人业务整体迁到
> `packages/partner-service`（独立进程，端口 8089）。文档里如果还能搜到
> `cd packages/optimus-api` 之类的说法，那是没跟上迁移，以本文为准。

## 设计取舍（v0 至今未变）

- **只加不减** —— 没有消耗、没有人工调整入口
- **任务定义写在代码里** —— `constants/task-configs.constant.ts`，不做后台可配
- **只有一张表** —— `op_biz_task_completion_log`
- **余额实时算** —— 不存快照。查询侧有 5 分钟 TTL 的内存缓存，
  那是读性能优化，不是"另一份账本"

## 模块结构

```
points-engine/
├── constants/task-configs.constant.ts   # 任务配置（唯一的任务定义来源）
├── controllers/points.controller.ts     # 积分查询与上报接口
├── dto/                                 # 查询 / 上报 DTO
├── entities/task-completion-log.entity.ts
├── enums/                               # task-type / task-status / point-rule-type
├── handlers/                            # 四个任务处理器
│   ├── register-task.handler.ts         #   注册成为合伙人
│   ├── invite-task.handler.ts           #   邀请下线注册
│   ├── game-action-task.handler.ts      #   游戏行为（经 notify 上报）
│   └── external-task.handler.ts         #   外部任务（审核通过后发分）
├── interfaces/ types/                   # 处理器接口与配置类型
└── services/
    ├── task-engine.service.ts           # 事件分发 + 幂等判定
    ├── points.service.ts                # 积分查询（读缓存）
    ├── points-cache.service.ts          # 三层内存缓存，见 CACHE_GUIDE.md
    └── point-rule.service.ts            # 按规则算分
```

## 任务配置

改积分规则就改 `constants/task-configs.constant.ts` 这一处。当前生效的合伙人任务：

| taskCode | 触发事件 | 积分 | 上限 |
|---|---|---|---|
| `REGISTER_V1` | `partner.register_self` | 300 | 1 次 |
| `INVITE_V1` | `partner.register_downline_L1` | 300 | 50 次 |

游戏行为任务（`GAME_LEVEL_UP_10` 50 分、`GAME_LEVEL_UP_50` 200 分等）经
`POST /api/biz/points/notify` 由 C 端主动上报触发，配置同一个文件。
外部任务（社媒推广等）的积分不写在这里，由 external-task 模块在审核通过时
带 `pointsReward` 传入，见 `../external-task/EXTERNAL_TASK_API.md`。

## 事件流

```
partner 模块 emit("partner.register_self")
        ↓
TaskEngineService @OnEvent 接住
        ↓
按 triggerEventType 找到对应 TaskConfig → 交给对应 handler
        ↓
handler 判定：是否超出 maxCompletionCount？是否已奖励过（幂等）？
        ↓
PointRuleService 算分 → 写入 op_biz_task_completion_log
```

幂等键是 `(taskCode, partnerId, eventId)`。邀请任务额外按
`(taskCode, partnerId, relatedPartnerId)` 查重，保证同一对邀请关系只发一次。

## 接口

C 端接口走 `@ClientUserAuth()`，凭据是 `clientAccessToken` httpOnly cookie
（详见下方"鉴权"）。路径均带 `/api` 前缀（经 optimus-next 代理分流到本服务）。

| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| GET | `/api/biz/points/me` | `@ClientUserAuth` | 查自己的积分总额与明细 |
| GET | `/api/biz/points/monthly-summary` | `@ClientUserAuth` | 查自己的月度汇总 |
| POST | `/api/biz/points/notify` | `@ClientUserAuth` | C 端上报游戏行为任务完成 |
| GET | `/api/biz/points/admin/:partnerId` | `@Perm("PartnerManagement")` | 管理端查任意合伙人积分明细 |
| GET | `/api/biz/points/cache/stats` | `@RequireSuperAdmin` | 调试：缓存命中统计 |
| POST | `/api/biz/points/cache/invalidate/:partnerId` | `@RequireSuperAdmin` | 调试：失效某人缓存 |

两个 `cache/*` 是纯调试接口，没有正当的普通管理员用例，直接锁了超管。

响应体统一是 `ResultData` 形状：

```json
{ "code": 200, "msg": "ok", "data": { "totalPoints": 300, "detail": [] }, "systime": 1787584279362 }
```

## 鉴权

**本服务不复制用户体系**，靠 introspect 换身份：`AppModule` 注册了全局
`IntrospectAuthGuard`，它拿请求里的 token 调 optimus-api 的
`POST /auth/introspect` 换回身份与权限码，方法上再用
`@ClientUserAuth()` / `@Perm()` / `@RequireSuperAdmin()` 声明具体要求。

- C 端凭据：`clientAccessToken` httpOnly cookie（也接受同一 token 走 Bearer 头）
- 管理端凭据：管理员 JWT，`@Perm` 比对的是**权限码**，不是角色名

> 历史遗留提醒：早期文档里写过一个 `GameWemadeAuthGuard`，那个类**从未在代码里
> 存在过**。按它接入会走错路，看到就忽略。

## 数据模型

`op_biz_task_completion_log` —— 全模块唯一的表，也是积分的唯一事实来源。
建表脚本在 `packages/partner-service/db/task_completion_log_table.sql`
（这张表长期没被任何环境创建过，是迁移时补上的，见
`openspec/changes/extract-partner-service/`）。

主要字段：`taskCode` / `taskType` / `partnerId` / `relatedPartnerId` /
`points` / `status` / `businessParams`(JSON) / `createdAt`。
按 `partnerId` 组织，不是按用户 id。

## 相关文档

- `CACHE_GUIDE.md` —— 三层内存缓存的结构、失效策略与调试接口
- `../external-task/EXTERNAL_TASK_API.md` —— 外部任务的提交与审核契约

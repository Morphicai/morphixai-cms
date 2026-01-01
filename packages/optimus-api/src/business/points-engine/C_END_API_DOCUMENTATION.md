# C 端 API 技术文档

> 本文档面向后端开发人员，描述积分引擎的技术实现细节。
> 
> **C 端集成请参考**：[C_END_API_GUIDE.md](./C_END_API_GUIDE.md)

## 一、接口概览

### 1.1 合伙人接口（8个）

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/biz/partner/join` | POST | GameWemadeAuthGuard | 加入合伙人计划 |
| `/api/biz/partner/profile` | GET | GameWemadeAuthGuard | 获取我的档案 |
| `/api/biz/partner/team` | GET | GameWemadeAuthGuard | 获取我的团队 |
| `/api/biz/partner/team/:partnerId` | GET | GameWemadeAuthGuard | 获取指定成员团队 |
| `/api/biz/partner/overview` | GET | GameWemadeAuthGuard | 获取团队概览 |
| `/api/biz/partner/channels` | POST | GameWemadeAuthGuard | 创建推广渠道 |
| `/api/biz/partner/channels` | GET | GameWemadeAuthGuard | 获取渠道列表 |
| `/api/biz/partner/channels/:id/disable` | PUT | GameWemadeAuthGuard | 禁用渠道 |

### 1.2 积分接口（2个）

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/biz/points/me` | GET | GameWemadeAuthGuard | 获取我的积分 |
| `/api/biz/points/notify` | POST | GameWemadeAuthGuard | **通知任务完成（新增）** |

## 二、核心实现

### 2.1 用户注册时间传递

**问题**：之前使用 `Date.now()` 作为事件时间戳，记录的是加入合伙人的时间，而不是用户在游戏中的实际注册时间。

**解决方案**：

1. 在 `JoinPartnerDto` 中新增 `userRegisterTime` 字段
2. C 端调用 `/join` 接口时传递用户的游戏注册时间
3. 后端使用这个时间戳发布事件
4. 积分引擎将这个时间记录在 `businessParams.registerTime` 中

**数据流**：

```
C端传递 userRegisterTime
    ↓
PartnerService.joinPartner()
    ↓
publishRegisterSelfEvent(profile, userRegisterTime)
    ↓
event.timestamp = userRegisterTime
    ↓
RegisterTaskHandler.handle()
    ↓
businessParams.registerTime = event.timestamp
    ↓
写入 task_completion_logs 表
```

### 2.2 游戏行为任务通知

**需求**：提供统一的接口让 C 端通知各种游戏行为任务完成（如游戏升级、首次充值等）。

**实现**：

1. 新增 `POST /api/biz/points/notify` 接口
2. 新增 `TaskType.GAME_ACTION` 任务类型
3. 新增 `GameActionTaskHandler` 处理器
4. 新增 `TaskEngineService.processGameActionEvent()` 方法
5. 通过正常的 Handler 流程处理，保持架构一致性

**处理流程**：

```
C端调用 /notify
    ↓
PointsController.notifyTaskCompletion()
    ↓
通过 uid 查询 partnerId
    ↓
TaskEngineService.processGameActionEvent()
    ↓
查找匹配的任务配置（taskCode）
    ↓
获取 GameActionTaskHandler
    ↓
Handler 校验（直接返回 valid）
    ↓
幂等检查（taskCode + partnerId + eventId）
    ↓
写入 task_completion_logs 表（taskType = "GAME_ACTION"）
    ↓
返回成功响应
```

**关键设计**：

- 游戏行为任务走正常的 Handler 流程，而不是直接写数据库
- 保持了架构的一致性和可扩展性
- 任务配置在 `task-configs.constant.ts` 中统一管理

### 2.3 幂等性设计

**合伙人注册任务**：

- 幂等键：`(taskCode, partnerId, eventId)`
- eventId 生成：`partnerId_timestamp`

**邀请任务**：

- 幂等键：`(taskCode, partnerId, eventId)`
- eventId 生成：`inviterPartnerId_downlinePartnerId_timestamp`

**游戏行为任务**：

- 幂等键：`(taskCode, partnerId, eventId)`
- eventId 生成：`partnerId_taskCode_timestamp`

## 三、数据结构

### 3.1 task_completion_logs 表

**business_params 字段示例**：

```json
// 注册任务
{
    "partnerCode": "LP123456",
    "registerTime": 1733472000000  // 用户游戏注册时间
}

// 邀请任务
{
    "inviterPartnerCode": "LP123456",
    "downlinePartnerCode": "LP789012",
    "sourceChannelId": "1",
    "inviteTime": 1733472000000  // 邀请成功时间
}

// 游戏行为任务（升级）
{
    "level": 10,
    "characterClass": "Warrior"
}

// 游戏行为任务（充值）
{
    "amount": 100,
    "currency": "USD",
    "orderId": "ORDER123456"
}
```

## 四、积分计算

### 4.1 当前任务配置

| 任务代码 | 任务类型 | 积分 | 触发方式 |
|---------|---------|------|---------|
| REGISTER_V1 | REGISTER | 100 | 自动（加入合伙人时） |
| INVITE_V1 | INVITE_SUCCESS | 300 | 自动（邀请用户加入时） |
| GAME_LEVEL_UP_10 | GAME_ACTION | 50 | C端调用 /notify |
| GAME_LEVEL_UP_50 | GAME_ACTION | 200 | C端调用 /notify |
| FIRST_RECHARGE | GAME_ACTION | 500 | C端调用 /notify |
| FIRST_DUNGEON_CLEAR | GAME_ACTION | 100 | C端调用 /notify |

### 4.2 计算公式

```typescript
用户总积分 = Σ(该用户所有任务完成日志对应的积分)
```

- 实时计算，不做缓存
- 每次查询都从数据库读取并计算

## 五、错误处理

| 错误码 | 错误信息 | 原因 |
|--------|---------|------|
| 401 | 未授权 | Token 无效或过期 |
| 404 | 用户未加入合伙人计划 | uid 对应的用户不是合伙人 |
| 404 | 邀请人不存在 | inviterCode 无效 |
| 400 | 任务代码无效 | taskCode 不存在或参数错误 |

## 六、技术要点

1. **认证统一**：所有 C 端接口使用 GameWemadeAuthGuard
2. **时间戳精度**：毫秒级（13位数字）
3. **幂等性保证**：通过唯一键 `(taskCode, partnerId, eventId)` 保证
4. **事件驱动**：使用 EventEmitter2 实现领域事件
5. **实时计算**：积分不做缓存，每次查询实时计算
6. **扩展性**：通过 `/notify` 接口可轻松扩展新任务类型

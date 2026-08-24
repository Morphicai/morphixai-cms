# 积分引擎快速开始指南

## 1. 部署步骤

### 1.1 执行数据库迁移

```bash
# 进入项目目录
cd packages/optimus-api

# 执行迁移脚本
mysql -u root -p your_database < migrations/004_create_task_completion_log_table.sql
```

### 1.2 验证表结构

```sql
-- 查看表结构
DESC biz_task_completion_log;

-- 查看索引
SHOW INDEX FROM biz_task_completion_log;
```

### 1.3 启动应用

```bash
# 开发环境
pnpm dev

# 生产环境
pnpm start:prod
```

## 2. 测试流程

### 2.1 测试用户注册获得积分

```bash
# 1. 用户加入合伙人计划（自建团队模式）
curl -X POST http://localhost:8080/partner/join \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "mode": "self"
  }'

# 响应示例：
# {
#   "success": true,
#   "data": {
#     "partnerId": "1",
#     "partnerCode": "LP123456",
#     "uid": "user123"
#   }
# }

# 2. 查询积分（应该获得100积分）
curl -X GET http://localhost:8080/points/me \
  -H "Authorization: Bearer YOUR_TOKEN"

# 响应示例：
# {
#   "success": true,
#   "data": {
#     "totalPoints": 100
#   }
# }
```

### 2.2 测试邀请获得积分

```bash
# 1. 用户A已经是合伙人（partnerCode: LP123456）

# 2. 用户B通过邀请加入
curl -X POST http://localhost:8080/partner/join \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_B_TOKEN" \
  -d '{
    "mode": "invite",
    "inviterCode": "LP123456"
  }'

# 3. 查询用户A的积分（应该增加300积分）
curl -X GET http://localhost:8080/points/me \
  -H "Authorization: Bearer USER_A_TOKEN"

# 响应示例：
# {
#   "success": true,
#   "data": {
#     "totalPoints": 400
#   }
# }
```

### 2.3 查询积分明细

```bash
curl -X GET "http://localhost:8080/points/me?includeDetail=true" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 响应示例：
# {
#   "success": true,
#   "data": {
#     "totalPoints": 400,
#     "detail": [
#       {
#         "taskCode": "INVITE_V1",
#         "taskType": "INVITE_SUCCESS",
#         "points": 300,
#         "businessParams": {
#           "inviterPartnerCode": "LP123456",
#           "downlinePartnerCode": "LP789012"
#         },
#         "createdAt": "2025-12-06T11:00:00.000Z"
#       },
#       {
#         "taskCode": "REGISTER_V1",
#         "taskType": "REGISTER",
#         "points": 100,
#         "businessParams": {
#           "partnerCode": "LP123456",
#           "uid": "user123"
#         },
#         "createdAt": "2025-12-06T10:00:00.000Z"
#       }
#     ]
#   }
# }
```

## 3. 数据验证

### 3.1 查看任务完成日志

```sql
-- 查询所有任务完成日志
SELECT * FROM biz_task_completion_log ORDER BY created_at DESC;

-- 查询指定用户的任务日志
SELECT * FROM biz_task_completion_log WHERE user_id = '1';

-- 统计各任务类型的完成次数
SELECT task_type, COUNT(*) as count 
FROM biz_task_completion_log 
GROUP BY task_type;
```

### 3.2 验证幂等性

```sql
-- 尝试插入重复的任务日志（应该失败）
INSERT INTO biz_task_completion_log 
(task_code, task_type, user_id, event_type, event_id, status)
VALUES 
('REGISTER_V1', 'REGISTER', '1', 'partner.register_self', '1_1733472000000', 'COMPLETED');

-- 错误信息：Duplicate entry for key 'idx_task_user_event'
```

## 4. 常见场景

### 4.1 修改积分规则

```typescript
// 1. 在 constants/task-configs.constant.ts 中添加新版本
{
    taskCode: "REGISTER_V2",  // 新版本
    taskType: TaskType.REGISTER,
    triggerEventType: "partner.register_self",
    pointRule: {
        type: PointRuleType.FIXED,
        value: 200,  // 修改为200积分
    },
    enabled: true,
    description: "用户注册成为合伙人奖励（V2）",
},

// 2. 禁用旧版本
{
    taskCode: "REGISTER_V1",
    // ...
    enabled: false,  // 禁用
},

// 3. 重启应用
// 新用户注册将获得200积分，历史用户积分不受影响
```

### 4.2 查询积分排行榜

```sql
-- 查询积分前10名
SELECT 
    user_id,
    SUM(
        CASE 
            WHEN task_code = 'REGISTER_V1' THEN 100
            WHEN task_code = 'INVITE_V1' THEN 50
            ELSE 0
        END
    ) as total_points
FROM biz_task_completion_log
WHERE status = 'COMPLETED'
GROUP BY user_id
ORDER BY total_points DESC
LIMIT 10;
```

### 4.3 统计任务完成情况

```sql
-- 按日期统计任务完成数
SELECT 
    DATE(created_at) as date,
    task_type,
    COUNT(*) as count
FROM biz_task_completion_log
GROUP BY DATE(created_at), task_type
ORDER BY date DESC;

-- 统计用户获得积分分布
SELECT 
    CASE 
        WHEN total_points < 100 THEN '0-99'
        WHEN total_points < 500 THEN '100-499'
        WHEN total_points < 1000 THEN '500-999'
        ELSE '1000+'
    END as points_range,
    COUNT(*) as user_count
FROM (
    SELECT 
        user_id,
        SUM(
            CASE 
                WHEN task_code = 'REGISTER_V1' THEN 100
                WHEN task_code = 'INVITE_V1' THEN 50
                ELSE 0
            END
        ) as total_points
    FROM biz_task_completion_log
    WHERE status = 'COMPLETED'
    GROUP BY user_id
) as user_points
GROUP BY points_range;
```

## 5. 监控与日志

### 5.1 查看应用日志

```bash
# 查看任务引擎日志
tail -f logs/app-out/app-out.log | grep "TaskEngineService"

# 查看积分服务日志
tail -f logs/app-out/app-out.log | grep "PointsService"
```

### 5.2 关键日志示例

```
[TaskEngineService] 收到事件: partner.register_self, partnerId=1
[TaskEngineService] 事件 partner.register_self 匹配到 1 个任务配置
[RegisterTaskHandler] 处理注册任务: partnerId=1, uid=user123
[TaskEngineService] 任务完成日志已记录: taskCode=REGISTER_V1, userId=1, logId=1

[TaskEngineService] 收到事件: partner.register_downline_L1, partnerId=1, downlinePartnerId=2
[InviteTaskHandler] 处理邀请任务: inviterPartnerId=1, downlinePartnerId=2
[TaskEngineService] 任务完成日志已记录: taskCode=INVITE_V1, userId=1, logId=2

[PointsService] 用户 1 共有 2 条任务完成记录
[PointsService] 用户 1 当前总积分: 400
```

## 6. 故障排查

### 6.1 积分未增加

**问题**：用户完成任务后积分没有增加

**排查步骤**：

1. 检查事件是否发布
```bash
# 查看日志中是否有事件发布记录
grep "发布事件" logs/app-out/app-out.log
```

2. 检查任务配置是否启用
```typescript
// 查看 constants/task-configs.constant.ts
// 确认 enabled: true
```

3. 检查任务完成日志
```sql
SELECT * FROM biz_task_completion_log 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY created_at DESC;
```

4. 检查幂等冲突
```bash
# 查看日志中是否有幂等冲突记录
grep "任务已完成，跳过" logs/app-out/app-out.log
```

### 6.2 积分计算错误

**问题**：积分数值不正确

**排查步骤**：

1. 检查任务配置
```typescript
// 确认 pointRule 配置正确
{
    type: PointRuleType.FIXED,
    value: 100  // 检查这个值
}
```

2. 检查业务参数
```sql
SELECT business_params FROM biz_task_completion_log 
WHERE id = 'LOG_ID';
```

3. 手动计算验证
```typescript
// 在控制台测试积分计算
const rule = { type: PointRuleType.FIXED, value: 100 };
const points = pointRuleService.calculatePoints(rule);
console.log(points);  // 应该输出 100
```

### 6.3 性能问题

**问题**：查询积分响应慢

**排查步骤**：

1. 检查日志数量
```sql
SELECT user_id, COUNT(*) as log_count 
FROM biz_task_completion_log 
GROUP BY user_id 
ORDER BY log_count DESC 
LIMIT 10;
```

2. 检查索引
```sql
SHOW INDEX FROM biz_task_completion_log;
```

3. 分析查询性能
```sql
EXPLAIN SELECT * FROM biz_task_completion_log 
WHERE user_id = '1' AND status = 'COMPLETED';
```

4. 考虑优化方案
- 引入 Redis 缓存
- 使用积分快照表
- 分页查询

## 7. 下一步

- [ ] 添加单元测试
- [ ] 添加集成测试
- [ ] 配置监控告警
- [ ] 性能压测
- [ ] 编写运维文档

## 8. 相关文档

- [README.md](./README.md) - 模块概述和使用指南
- [TECHNICAL_DESIGN.md](./TECHNICAL_DESIGN.md) - 技术设计文档
- [合伙人模块文档](../partner/README.md) - 合伙人系统文档

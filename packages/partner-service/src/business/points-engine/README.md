# Points Engine and Task Module

## Overview

The points engine is the core module of the partner program, responsible for managing task completion and points calculation. This module adopts an event-driven architecture, triggering task completion logic by listening to domain events.

## Core Features (v0 MVP Version)

✅ **Only "Earn Points"**, no consumption, no adjustments  
✅ **Task types & task lists are hardcoded**  
✅ **Only one table: task completion log**  
✅ **Points = task completion log × rules real-time calculation**, no caching, no snapshots

## Architecture Design

### 1. Core Concepts

- **Task Type**: Task categories hardcoded in code (e.g., REGISTER, INVITE_SUCCESS)
- **Task Config**: Task definitions written in code, including task code, trigger event, points rules, etc.
- **Task Completion Log**: Records of users completing tasks, the only data source for points calculation
- **Domain Event**: Events thrown by business systems (e.g., USER_REGISTERED, INVITE_SUCCEEDED)

### 2. Module Structure

```
points-engine/
├── constants/
│   └── task-configs.constant.ts      # Task configuration constants
├── controllers/
│   └── points.controller.ts          # Points query interface
├── dto/
│   └── query-points.dto.ts           # Query DTO
├── entities/
│   └── task-completion-log.entity.ts # Task completion log entity
├── enums/
│   ├── task-type.enum.ts             # Task type enum
│   ├── task-status.enum.ts           # Task status enum
│   └── point-rule-type.enum.ts       # Points rule type enum
├── handlers/
│   ├── register-task.handler.ts      # Register task handler
│   └── invite-task.handler.ts        # Invite task handler
├── services/
│   ├── task-engine.service.ts        # Task engine service
│   ├── points.service.ts             # Points service
│   └── point-rule.service.ts         # Points rule service
└── points-engine.module.ts           # Module definition
```

## Usage Guide

### 1. Task Configuration

All task configurations are maintained in `constants/task-configs.constant.ts`:

```typescript
export const TASK_CONFIGS: TaskConfig[] = [
    {
        taskCode: "REGISTER_V1",
        taskType: TaskType.REGISTER,
        triggerEventType: "partner.register_self",
        pointRule: {
            type: PointRuleType.FIXED,
            value: 100,
        },
        enabled: true,
        description: "User registration as partner reward",
    },
    {
        taskCode: "INVITE_V1",
        taskType: TaskType.INVITE_SUCCESS,
        triggerEventType: "partner.register_downline_L1",
        pointRule: {
            type: PointRuleType.FIXED,
            value: 50,
        },
        enabled: true,
        description: "Invite first-level downline registration reward",
    },
];
```

### 2. Adding New Task Types

To add new task types:

1. Add new task type in `enums/task-type.enum.ts`
2. Create corresponding task handler in `handlers/` directory
3. Add task configuration in `constants/task-configs.constant.ts`
4. Register handler in `points-engine.module.ts`

### 3. Points Rules

Supports two types of points rules:

#### Fixed Points

```typescript
{
    type: PointRuleType.FIXED,
    value: 100  // Fixed 100 points
}
```

#### Per Amount Ratio

```typescript
{
    type: PointRuleType.PER_AMOUNT,
    rate: 10  // 10 points per 1 unit
}
```

### 4. API Interfaces

#### Query Current User Points

```
GET /points/me
```

Response:

```json
{
    "success": true,
    "data": {
        "totalPoints": 400
    }
}
```

#### Query Points Details

```
GET /points/me?includeDetail=true
```

Response:

```json
{
    "success": true,
    "data": {
        "totalPoints": 400,
        "detail": [
            {
                "taskCode": "REGISTER_V1",
                "taskType": "REGISTER",
                "points": 100,
                "businessParams": {
                    "partnerCode": "LP123456",
                    "uid": "user123"
                },
                "createdAt": "2025-12-06T10:00:00.000Z"
            }
        ]
    }
}
```

## Business Flow

### 1. User Registration → Earn Points

```
User completes registration
    ↓
Business layer throws USER_REGISTERED event
    ↓
Task engine receives event
    ↓
Match task configuration (REGISTER_V1)
    ↓
Call RegisterTaskHandler to validate
    ↓
Idempotency check
    ↓
Write task completion log
```

### 2. User Invite Success → Earn Points

```
User B registers successfully using A's invite link
    ↓
Business layer throws INVITE_SUCCEEDED event
    ↓
Task engine receives event
    ↓
Match task configuration (INVITE_V1)
    ↓
Call InviteTaskHandler to validate
    ↓
Check if invite relationship already rewarded
    ↓
Idempotency check
    ↓
Write task completion log
```

## Database Design

### Task Completion Log Table (biz_task_completion_log)

| Field              | Type         | Description                       |
| ----------------- | ------------ | -------------------------- |
| id                | BIGINT       | Primary key ID                    |
| task_code         | VARCHAR(64)  | Task code                   |
| task_type         | ENUM         | Task type                   |
| user_id           | VARCHAR(100) | User ID who earned points          |
| related_user_id   | VARCHAR(100) | Related user ID (e.g., invited user)  |
| event_type        | VARCHAR(64)  | Triggered event type             |
| event_id          | VARCHAR(128) | Domain event ID (for idempotency)    |
| business_params   | JSON         | Business parameters                   |
| status            | ENUM         | Status (COMPLETED)          |
| created_at        | TIMESTAMP    | Creation time                   |

Indexes:
- `idx_user_id`: For querying all task logs by user
- `idx_task_user_event`: For idempotency check (unique index)

## Idempotency Guarantee

Idempotency is guaranteed through:

1. **Event ID**: Each event generates a unique eventId
2. **Unique Index**: (task_code, user_id, event_id) combination is unique
3. **Business Validation**: Additional business validation in task handlers (e.g., invite relationship check)

## MVP Version Limitations

v0 version does not support:

- ❌ Points consumption / deduction / redemption
- ❌ Points adjustment / compensation
- ❌ Caching / points snapshots
- ❌ Task admin management
- ❌ Dynamic task configuration

## Future Evolution

1. **Points Consumption**: Add points consumption log table, support points deduction
2. **Points Adjustment**: Support admin manual points adjustment
3. **Performance Optimization**: Introduce points snapshot table to reduce real-time calculation pressure
4. **Task Management**: Provide admin interface, support dynamic task configuration
5. **Task Extension**: Support more task types (recharge, share, check-in, etc.)

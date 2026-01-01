# 积分缓存系统使用指南

## 概述

积分缓存系统用于提升积分查询性能，减少数据库查询压力。当前使用内存缓存（MemoryCache），后续可扩展为 Redis。

## 架构设计

### 缓存层次

```
┌─────────────────────────────────────────────────────────┐
│                    API 层                                │
│              PointsController                            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│                  服务层                                  │
│               PointsService                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │  1. 尝试从缓存获取                                │  │
│  │  2. 缓存未命中，从数据库计算                      │  │
│  │  3. 写入缓存                                      │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│                  缓存层                                  │
│            PointsCacheService                            │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │  积分总额缓存    │  │  积分明细缓存    │            │
│  │  (1000 entries)  │  │  (500 entries)   │            │
│  │  TTL: 5分钟      │  │  TTL: 5分钟      │            │
│  └──────────────────┘  └──────────────────┘            │
└─────────────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│                  数据库层                                │
│         biz_task_completion_log                          │
└─────────────────────────────────────────────────────────┘
```

## 缓存配置

### 当前配置

```typescript
// 积分总额缓存
maxSize: 1000        // 最多缓存 1000 个用户
TTL: 5 * 60 * 1000   // 5 分钟过期

// 积分明细缓存
maxSize: 500         // 最多缓存 500 个用户
TTL: 5 * 60 * 1000   // 5 分钟过期
```

### 缓存策略

- **LRU 淘汰**：当缓存满时，优先淘汰最久未使用的条目
- **过期淘汰**：优先淘汰已过期的条目
- **索引查询**：支持按 partnerId 快速查找

## 使用方式

### 1. 查询积分（自动使用缓存）

```typescript
// C端接口
GET /api/biz/points/me

// 管理后台接口
GET /api/biz/points/admin/:partnerId
```

**流程**：
1. PointsService 自动尝试从缓存获取
2. 缓存命中 → 直接返回
3. 缓存未命中 → 从数据库计算 → 写入缓存 → 返回

### 2. 缓存自动失效

当用户完成新任务时，缓存会自动失效：

```typescript
// TaskEngineService 在写入任务完成日志后
await this.taskLogRepository.save(log);

// 自动使缓存失效
this.pointsCacheService.invalidateUserCache(result.partnerId);
```

### 3. 手动清除缓存（调试用）

```typescript
// 清除指定用户缓存
POST /api/biz/points/cache/invalidate/:partnerId

// 响应
{
    "code": 200,
    "message": "缓存已清除",
    "data": null
}
```

### 4. 查看缓存统计

```typescript
// 获取缓存统计信息
GET /api/biz/points/cache/stats

// 响应
{
    "code": 200,
    "message": "success",
    "data": {
        "points": {
            "size": 150,      // 当前缓存的用户数
            "hitRate": 0.85   // 命中率 85%
        },
        "detail": {
            "size": 80,
            "hitRate": 0.78
        }
    }
}
```

## 缓存失效时机

### 自动失效

1. **任务完成时**
   - 用户完成注册任务
   - 用户完成邀请任务
   - 用户完成游戏行为任务
   - 用户完成外部任务

2. **缓存过期时**
   - 5 分钟后自动过期

3. **缓存满时**
   - 触发 LRU 淘汰策略

### 手动失效

```typescript
// 在代码中手动失效
this.pointsService.invalidateUserCache(partnerId);

// 通过 API 手动失效
POST /api/biz/points/cache/invalidate/:partnerId
```

## 性能优化

### 缓存命中率优化

1. **合理设置 TTL**
   - 当前：5 分钟
   - 建议：根据业务特点调整（活跃用户可以更长）

2. **合理设置缓存大小**
   - 当前：积分总额 1000 个，明细 500 个
   - 建议：根据内存和用户量调整

3. **预热热点数据**
   ```typescript
   // 在系统启动时预热活跃用户的积分
   async warmupCache(partnerIds: string[]) {
       for (const partnerId of partnerIds) {
           await this.getUserPoints(partnerId);
       }
   }
   ```

### 监控指标

1. **缓存命中率**
   - 目标：> 80%
   - 监控：通过 `/cache/stats` 接口

2. **缓存大小**
   - 监控：当前缓存的用户数
   - 告警：接近 maxSize 时

3. **查询响应时间**
   - 缓存命中：< 10ms
   - 缓存未命中：< 500ms

## 扩展为 Redis

### 为什么需要 Redis？

1. **分布式部署**：多个服务实例共享缓存
2. **持久化**：服务重启后缓存不丢失
3. **更大容量**：不受单机内存限制
4. **更多功能**：支持发布订阅、分布式锁等

### 迁移步骤

#### 1. 安装 Redis 依赖

```bash
pnpm add ioredis
pnpm add -D @types/ioredis
```

#### 2. 创建 Redis 缓存服务

```typescript
// services/points-redis-cache.service.ts
import { Injectable, Logger } from "@nestjs/common";
import Redis from "ioredis";

@Injectable()
export class PointsRedisCacheService {
    private readonly logger = new Logger(PointsRedisCacheService.name);
    private readonly redis: Redis;
    private readonly TTL = 5 * 60; // 5分钟（秒）

    constructor() {
        this.redis = new Redis({
            host: process.env.REDIS_HOST || "localhost",
            port: Number(process.env.REDIS_PORT) || 6379,
            password: process.env.REDIS_PASSWORD,
            db: Number(process.env.REDIS_DB) || 0,
        });
    }

    async getTotalPoints(partnerId: string): Promise<number | undefined> {
        const key = `points:total:${partnerId}`;
        const value = await this.redis.get(key);
        
        if (value) {
            return Number(value);
        }
        
        return undefined;
    }

    async setTotalPoints(partnerId: string, totalPoints: number): Promise<void> {
        const key = `points:total:${partnerId}`;
        await this.redis.setex(key, this.TTL, totalPoints);
    }

    async getPointsDetail(partnerId: string): Promise<any[] | undefined> {
        const key = `points:detail:${partnerId}`;
        const value = await this.redis.get(key);
        
        if (value) {
            return JSON.parse(value);
        }
        
        return undefined;
    }

    async setPointsDetail(partnerId: string, details: any[]): Promise<void> {
        const key = `points:detail:${partnerId}`;
        await this.redis.setex(key, this.TTL, JSON.stringify(details));
    }

    async invalidateUserCache(partnerId: string): Promise<void> {
        const keys = [
            `points:total:${partnerId}`,
            `points:detail:${partnerId}`,
        ];
        
        await this.redis.del(...keys);
    }

    async getCacheStats(): Promise<any> {
        const info = await this.redis.info("stats");
        // 解析 Redis 统计信息
        return {
            // 实现统计逻辑
        };
    }
}
```

#### 3. 更新 PointsService

```typescript
// 使用环境变量切换缓存实现
constructor(
    @InjectRepository(TaskCompletionLogEntity)
    private readonly taskLogRepository: Repository<TaskCompletionLogEntity>,
    private readonly pointRuleService: PointRuleService,
    @Inject('POINTS_CACHE')
    private readonly pointsCacheService: PointsCacheService | PointsRedisCacheService,
) {}
```

#### 4. 配置环境变量

```bash
# .env
CACHE_TYPE=redis  # 或 memory
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

## 最佳实践

### 1. 缓存一致性

- ✅ 任务完成后立即失效缓存
- ✅ 使用合理的 TTL 避免长时间不一致
- ❌ 不要在缓存中存储可变的业务规则

### 2. 缓存穿透

- ✅ 对不存在的用户也缓存（缓存空值）
- ✅ 使用布隆过滤器预判用户是否存在

### 3. 缓存雪崩

- ✅ 设置随机的 TTL（避免同时过期）
- ✅ 使用多级缓存（本地缓存 + Redis）

### 4. 缓存击穿

- ✅ 使用分布式锁（Redis）
- ✅ 热点数据永不过期

## 故障排查

### 问题 1：缓存命中率低

**原因**：
- TTL 设置过短
- 缓存容量不足
- 用户访问分散

**解决**：
- 增加 TTL
- 增加 maxSize
- 预热热点数据

### 问题 2：内存占用过高

**原因**：
- maxSize 设置过大
- 缓存的数据结构过大

**解决**：
- 减小 maxSize
- 只缓存必要字段
- 迁移到 Redis

### 问题 3：缓存不一致

**原因**：
- 任务完成后未失效缓存
- TTL 设置过长

**解决**：
- 检查缓存失效逻辑
- 减小 TTL
- 手动清除缓存

## 监控告警

### 关键指标

```typescript
// 缓存命中率
if (hitRate < 0.8) {
    logger.warn(`积分缓存命中率过低: ${hitRate}`);
}

// 缓存大小
if (size > maxSize * 0.9) {
    logger.warn(`积分缓存接近上限: ${size}/${maxSize}`);
}

// 查询响应时间
if (responseTime > 500) {
    logger.warn(`积分查询响应时间过长: ${responseTime}ms`);
}
```

### 日志记录

```typescript
// 缓存命中
this.logger.debug(`积分总额缓存命中: partnerId=${partnerId}`);

// 缓存未命中
this.logger.debug(`积分总额缓存未命中: partnerId=${partnerId}`);

// 缓存失效
this.logger.log(`用户积分缓存已失效: partnerId=${partnerId}`);
```

## 总结

积分缓存系统通过以下方式提升性能：

1. **减少数据库查询**：缓存命中时无需查询数据库
2. **降低计算开销**：避免重复计算积分
3. **提升响应速度**：缓存查询 < 10ms，数据库查询 > 100ms

后续可根据业务需求扩展为 Redis，支持分布式部署和更大容量。

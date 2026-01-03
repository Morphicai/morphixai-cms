# TypeORM 索引重复错误分析

## 问题原因

即使数据库为空，开启 `synchronize: true` 也会出现索引重复错误，主要原因如下：

### 1. **复合索引与单列索引冲突**

当同时定义单列索引和包含该列的复合索引时，TypeORM 可能生成相同的索引名称。

**示例：`RewardClaimRecordEntity`**
```typescript
@Index(["uid"])                    // 单列索引
@Index(["uid", "activityCode"])    // 复合索引（已包含 uid）
```

**问题**：
- TypeORM 自动生成索引名称时，可能为这两个索引生成相同的名称
- MySQL 中复合索引 `["uid", "activityCode"]` 已经可以为 `uid` 提供索引支持
- 单独为 `uid` 创建索引是冗余的

### 2. **未指定索引名称导致命名冲突**

当使用 `@Index()` 装饰器但没有指定名称时，TypeORM 会根据表名、列名自动生成名称。如果多个索引定义导致相同的名称，就会出现冲突。

**示例：`ClientUserExternalAccountEntity`**
```typescript
@Index(["userId", "platform"], { unique: true })  // 复合唯一索引
@Index()  // 在 userId 列上，未指定名称
@Index()  // 在 platform 列上，未指定名称
```

**问题**：
- 复合索引已经包含了 `userId` 和 `platform`
- 单独为这些列创建索引是冗余的
- 自动生成的索引名称可能冲突

### 3. **unique: true 与 @Index() 重复定义**

当列级别使用 `unique: true` 时，TypeORM 会自动创建唯一索引。如果再使用 `@Index()` 或 `@Index([...], { unique: true })`，会导致尝试创建两个索引。

**示例：`ShortLinkEntity`**
```typescript
@Index(["token"], { unique: true })  // 类级别唯一索引
class Entity {
  @Column({ unique: true })  // 列级别 unique 约束
  token: string;
}
```

**问题**：
- `unique: true` 会自动创建唯一索引
- `@Index(["token"], { unique: true })` 会尝试创建另一个唯一索引
- 这可能导致索引名称冲突

### 4. **TypeORM 索引命名机制**

TypeORM 的索引命名规则：
- 如果指定了名称：使用指定的名称
- 如果未指定名称：自动生成 `IDX_<table>_<columns>_<hash>`
- 当多个索引定义导致相同的 hash 值时，就会出现重复

## 解决方案

### 方案 1：移除冗余的单列索引（推荐）

如果复合索引已经包含了某列，移除该列的单列索引：

```typescript
// ❌ 错误：冗余索引
@Index(["uid"])
@Index(["uid", "activityCode"])

// ✅ 正确：只保留复合索引
@Index(["uid", "activityCode"])
```

### 方案 2：为所有索引指定唯一名称

为每个索引显式指定唯一的名称：

```typescript
// ✅ 正确：指定唯一名称
@Index("idx_reward_uid", ["uid"])
@Index("idx_reward_uid_activity", ["uid", "activityCode"])
```

### 方案 3：移除冗余的列级索引

如果类级别已经定义了复合索引，移除列级别的 `@Index()` 装饰器：

```typescript
// ❌ 错误：列级别索引与类级别索引冲突
@Index(["userId", "platform"], { unique: true })
class Entity {
  @Index()  // 冗余
  userId: string;
  
  @Index()  // 冗余
  platform: string;
}

// ✅ 正确：只保留类级别索引
@Index(["userId", "platform"], { unique: true })
class Entity {
  userId: string;
  platform: string;
}
```

### 方案 4：避免 unique: true 与 @Index() 重复

如果列级别使用了 `unique: true`，不要在类级别再定义唯一索引：

```typescript
// ❌ 错误：重复的唯一索引定义
@Index(["token"], { unique: true })
class Entity {
  @Column({ unique: true })
  token: string;
}

// ✅ 正确：只使用列级别的 unique: true
class Entity {
  @Column({ unique: true })
  token: string;
}

// 或者只使用类级别的唯一索引
@Index(["token"], { unique: true })
class Entity {
  @Column()
  token: string;
}
```

## 已修复的实体

1. ✅ **`RewardClaimRecordEntity`** - 已移除冗余的 `@Index(["uid"])`，保留复合索引 `@Index(["uid", "activityCode"])`
2. ✅ **`PartnerHierarchyEntity`** - 已移除冗余的 `@Index(["childPartnerId"])`，保留复合索引 `@Index(["childPartnerId", "level", "isActive"])`
3. ✅ **`ClientUserExternalAccountEntity`** - 已移除列级别的 `@Index()` 装饰器，因为类级别已有复合索引
4. ✅ **`ShortLinkEntity`** - 已移除类级别的 `@Index(["token"], { unique: true })`，因为列级别已有 `unique: true`
5. ✅ **`ClientUserEntity`** - 已移除 `username`, `email`, `phone` 上的 `@Index()`，因为列级别已有 `unique: true`
6. ✅ **`PartnerProfileEntity`** - 已移除 `partnerCode` 上的 `@Index()`，因为列级别已有 `unique: true`
7. ✅ **`TaskCompletionLogEntity`** - 已移除冗余的 `@Index(["partnerId"])`，保留复合索引 `@Index(["taskCode", "partnerId", "eventId"])`
8. ✅ **`DictionaryCollectionEntity`** - 已移除类级别的 `@Index(["name"])`，因为列级别已有 `unique: true`

## 其他实体检查

- **`PartnerProfileEntity`** - 单列索引，无冲突（但 `unique: true` 的列已有唯一索引，`@Index()` 是冗余的）
- **`ClientUserEntity`** - 单列索引，无冲突（但 `unique: true` 的列已有唯一索引，`@Index()` 是冗余的）

## 修复说明

### 为什么会出现索引重复错误？

1. **TypeORM 的索引命名机制**：
   - 当未指定索引名称时，TypeORM 会根据表名、列名和索引类型自动生成名称
   - 生成规则：`IDX_<table>_<columns>_<hash>`
   - 如果多个索引定义导致相同的 hash 值，就会出现 "Duplicate key name" 错误

2. **复合索引与单列索引的关系**：
   - MySQL 中，复合索引 `["uid", "activityCode"]` 已经可以为 `uid` 提供索引支持
   - 单独为 `uid` 创建索引是冗余的
   - 同时创建两个索引可能导致 TypeORM 生成相同的索引名称

3. **列级别索引与类级别索引的冲突**：
   - 类级别的 `@Index(["userId", "platform"])` 已经包含了 `userId` 和 `platform`
   - 列级别的 `@Index()` 会尝试为这些列单独创建索引
   - 这可能导致索引名称冲突

## 最佳实践

1. **避免冗余索引**：如果复合索引已包含某列，不要为该列单独创建索引
2. **显式指定索引名称**：为所有索引指定唯一的名称，避免自动命名冲突
3. **统一索引定义位置**：优先使用类级别的 `@Index()` 装饰器，避免列级别和类级别混用
4. **生产环境使用迁移**：关闭 `synchronize`，使用 TypeORM Migration 管理数据库结构变更


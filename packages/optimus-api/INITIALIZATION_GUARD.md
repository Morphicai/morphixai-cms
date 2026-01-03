# 初始化守卫文档

## 概述

初始化守卫 (`InitializationGuard`) 确保系统在未初始化时，只有初始化相关的接口可以访问。这防止了在系统未完全设置时访问业务接口。

## 初始化流程分析

### 1. 系统初始化操作步骤

系统初始化 (`POST /api/setup/initialize`) 执行以下操作：

#### 步骤 1: 初始化数据库 (`databaseInitializer.initializeDatabase`)
- **执行种子数据** (`executeSeedData`)
  - 读取 `db/optimus-minimal.sql` 文件
  - 执行所有 SQL 语句创建表结构
  - 插入初始数据（角色、用户、分类等）
  - 执行自定义初始化逻辑（如确保内置分类存在）

- **记录初始化信息** (`recordInitializationInfo`)
  - 在 `op_sys_database_info` 表中记录：
    - `schema_version`: 数据库结构版本
    - `seed_version`: 种子数据版本
    - `environment`: 环境标识 (development, production, e2e)
    - `node_env`: NODE_ENV 环境变量
    - `app_version`: 应用版本
    - `initialization_source`: 初始化来源 (auto, manual, migration)
    - `metadata`: 额外的元数据信息（JSON格式）

#### 步骤 2: 创建管理员用户 (`createAdminUser`)
- 检查账号是否已存在
- 生成密码哈希（使用 bcryptjs）
- 创建管理员用户记录到 `op_sys_user` 表
- 分配管理员角色到 `op_sys_user_role` 表

#### 步骤 3: 设置系统信息 (`setSystemInfo`)
- 更新 `op_sys_database_info` 表的 `metadata` 字段
- 记录站点信息：
  - `siteName`: 站点名称
  - `siteDescription`: 站点描述
  - `initializedBy`: 初始化人账号
  - `initializedAt`: 初始化时间

### 2. 初始化状态检查

系统通过以下方式检查是否已初始化：

1. **查询 `op_sys_database_info` 表**
   - 根据当前环境查询对应的初始化记录
   - 如果记录存在，认为已初始化

2. **备用检查机制**
   - 如果 `op_sys_database_info` 表不存在，检查 `op_sys_user` 表是否存在
   - 如果表都不存在，认为未初始化

## 初始化守卫实现

### 功能

1. **全局保护**: 默认所有接口都需要系统已初始化
2. **白名单机制**: 使用 `@AllowBeforeInitialization()` 装饰器标记允许未初始化时访问的接口
3. **缓存机制**: 使用 5 秒缓存减少数据库查询
4. **自动缓存清除**: 初始化完成后自动清除缓存

### 使用方式

#### 1. 标记允许未初始化时访问的接口

```typescript
import { AllowBeforeInitialization } from "../../shared/decorators/allow-before-initialization.decorator";

@Controller("setup")
export class SetupController {
    @Get("status")
    @AllowBeforeInitialization()  // 允许未初始化时访问
    async getStatus() {
        // ...
    }

    @Post("initialize")
    @AllowBeforeInitialization()  // 允许未初始化时访问
    async initialize() {
        // ...
    }
}
```

#### 2. 默认行为

所有未标记 `@AllowBeforeInitialization()` 的接口：
- 如果系统未初始化，返回 403 错误：
  ```json
  {
    "code": "SYSTEM_NOT_INITIALIZED",
    "message": "系统尚未初始化，请先完成系统初始化",
    "detail": "请访问 /api/setup/status 查看系统状态，或访问 /api/setup/initialize 进行初始化"
  }
  ```
- 如果系统已初始化，正常访问

### 守卫执行顺序

在 `app.module.ts` 中，守卫按以下顺序执行：

1. **InitializationGuard** (优先级最高)
   - 检查系统是否已初始化
   - 如果未初始化且接口未标记 `@AllowBeforeInitialization()`，拒绝访问

2. **UnifiedAuthGuard** (在初始化守卫之后)
   - 执行认证和权限检查
   - 只有通过初始化守卫的请求才会到达这里

### 缓存机制

- **缓存时间**: 5 秒
- **缓存内容**: 初始化状态（boolean）
- **清除时机**: 
  - 初始化完成后自动清除
  - 可以通过 `initializationGuard.clearCache()` 手动清除

## 允许未初始化时访问的接口

目前以下接口允许未初始化时访问：

1. `GET /api/setup/status` - 获取系统状态
2. `POST /api/setup/initialize` - 初始化系统

## 错误处理

如果系统未初始化时访问受保护的接口，会返回：

```json
{
  "code": "SYSTEM_NOT_INITIALIZED",
  "message": "系统尚未初始化，请先完成系统初始化",
  "detail": "请访问 /api/setup/status 查看系统状态，或访问 /api/setup/initialize 进行初始化"
}
```

HTTP 状态码: `403 Forbidden`

## 注意事项

1. **健康检查接口**: 如果 `/health` 等健康检查接口需要在未初始化时访问，也需要添加 `@AllowBeforeInitialization()` 装饰器

2. **缓存一致性**: 初始化完成后会自动清除缓存，但如果在初始化过程中有其他请求，可能会短暂使用旧的缓存值（最多 5 秒）

3. **数据库连接**: 守卫需要数据库连接来检查初始化状态，如果数据库连接失败，为了安全起见，会假设系统未初始化

4. **性能考虑**: 使用缓存机制减少数据库查询，避免每次请求都查询数据库


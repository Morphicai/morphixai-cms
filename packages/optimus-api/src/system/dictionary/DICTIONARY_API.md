# 字典管理 API 文档（JSON 数据库）

## 概述

基于 Dictionary 实现的 JSON 数据库功能，支持：
- ✅ 在后台创建集合，定义数据类型（数组、JSON、字符串、图片等）
- ✅ 便捷的 Service 方法用于快速在代码中使用数据
- ✅ 集合设置为公开时，C端支持查询数据
- ✅ 集合设置为公开读写时，C端支持修改数据

## 核心概念

### 集合（Collection）
集合是数据的容器，类似于数据库中的表。每个集合有：
- **名称**：唯一标识符
- **数据类型**：object、array、string、number、boolean、image、file
- **访问类型**：
  - `private`：后台私有，仅后台管理可访问
  - `public_read`：C端公开读，所有人可读取
  - `public_write`：C端公开读写，所有人可读写
  - `user_private`：用户私有数据，每个用户只能访问自己的数据
- **条目限制**：
  - `maxItems`：集合最大条目数
  - `maxItemsPerUser`：每个用户最大条目数（仅 user_private 类型）

### 字典项（Dictionary Item）
集合中的具体数据项，包含：
- **键（key）**：标识符
- **用户ID（userId）**：仅 user_private 类型集合使用
- **值（value）**：JSON 格式的数据
- **排序**：控制显示顺序

### 三种使用场景

#### 1. 后台配置中心（private / public_read）
存储系统配置、游戏服务器列表等，后台管理，C端可读取。

#### 2. C端通用数据存储（public_read / public_write）
存储C端需要的配置数据，如应用配置、通用数据等。

#### 3. 用户私有数据（user_private）
存储用户个人偏好、设置等，每个用户只能访问自己的数据。

## 数据结构

### 集合配置表（dictionary_collection）

```sql
dictionary_collection
├── id                  主键ID
├── name                集合名称（唯一标识）
├── display_name        显示名称
├── description         集合描述
├── data_type           数据类型（object/array/string/number/boolean/image/file）
├── schema              数据结构定义（JSON Schema）
├── access_type         访问类型（private/public_read/public_write/user_private）
├── max_items           最大条目数
├── max_items_per_user  每个用户最大条目数
├── status              状态（active/inactive）
├── created_at          创建时间
└── updated_at          更新时间
```

### 字典数据表（dictionary）

```sql
dictionary
├── id              主键ID
├── collection      集合名称（外键关联 dictionary_collection.name）
├── key             字典键
├── user_id         用户ID（仅user_private类型集合使用）
├── value           字典值（JSON格式）
├── sort_order      排序顺序
├── status          状态（active/inactive）
├── remark          备注说明
├── created_at      创建时间
└── updated_at      更新时间
```

### 约束关系

- `UNIQUE KEY (collection, key, user_id)` - 同一集合内键+用户唯一
- `FOREIGN KEY (collection)` - 集合名称关联到集合配置表

## API 接口

---

## 一、后台管理 API

### 集合管理

#### 1.1 创建集合

```
POST /system/dictionary-collection
权限: system:dictionary:create
```

**请求参数：**
```json
{
  "name": "app_config",
  "displayName": "应用配置",
  "description": "C端应用全局配置",
  "dataType": "object",
  "accessType": "public_read",
  "maxItems": 50,
  "maxItemsPerUser": 0,
  "status": "active"
}
```

**响应示例：**
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "name": "app_config",
    "displayName": "应用配置",
    "description": "C端应用全局配置",
    "dataType": "object",
    "schema": null,
    "accessType": "public_read",
    "maxItems": 50,
    "maxItemsPerUser": 0,
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 1.2 更新集合

```
PUT /system/dictionary-collection/:id
权限: system:dictionary:update
```

#### 1.3 删除集合

```
DELETE /system/dictionary-collection/:id
权限: system:dictionary:delete
```

#### 1.4 查询集合列表

```
GET /system/dictionary-collection
权限: system:dictionary:query
Query: name, accessType, status, page, pageSize
```

#### 1.5 根据名称获取集合

```
GET /system/dictionary-collection/:name
权限: system:dictionary:query
```

---

### 字典数据管理

#### 2.1 创建字典

```
POST /system/dictionary
权限: system:dictionary:create
```

**请求参数：**
```json
{
  "collection": "app_config",
  "key": "theme",
  "value": {
    "primaryColor": "#1890ff",
    "mode": "light"
  },
  "sortOrder": 1,
  "status": "active",
  "remark": "应用主题配置"
}
```

#### 2.2 更新字典

```
PUT /system/dictionary/:id
权限: system:dictionary:update
```

#### 2.3 删除字典

```
DELETE /system/dictionary/:id
权限: system:dictionary:delete
```

#### 2.4 查询字典列表

```
GET /system/dictionary
权限: system:dictionary:query
Query: collection, key, status, page, pageSize
```

#### 2.5 按集合获取字典

```
GET /system/dictionary/collection/:collection
权限: 无需权限（内部使用）
```

#### 2.6 获取字典值

```
GET /system/dictionary/:collection/:key
权限: 无需权限（内部使用）
```

---

## 二、C端公开 API

### 3.1 获取公开集合数据

```
GET /api/dictionary/:collection
权限: 无需登录（集合 accessType 必须为 public_read 或 public_write）
```

**示例：**
```bash
GET /api/dictionary/app_config
```

**响应示例：**
```json
{
  "code": 200,
  "data": {
    "collection": "app_config",
    "items": [
      {
        "key": "theme",
        "value": {
          "primaryColor": "#1890ff",
          "mode": "light",
          "_key": "theme"
        },
        "sortOrder": 1
      }
    ],
    "total": 1
  }
}
```

**注意**：返回的 `value` 中会自动包含 `_key` 字段，方便前端使用。

### 3.2 获取公开集合中的单个数据

```
GET /api/dictionary/:collection/:key
权限: 无需登录（集合 accessType 必须为 public_read 或 public_write）
```

**示例：**
```bash
GET /api/dictionary/app_config/theme
```

**响应示例：**
```json
{
  "code": 200,
  "data": {
    "primaryColor": "#1890ff",
    "mode": "light",
    "_key": "theme"
  }
}
```

**注意**：返回的数据中会自动包含 `_key` 字段。

### 3.3 在公开可写集合中创建数据

```
POST /api/dictionary/:collection
权限: 无需登录（集合 accessType 必须为 public_write）
```

**请求参数：**
```json
{
  "key": "feedback1",
  "value": {
    "title": "功能建议",
    "content": "希望增加暗黑模式",
    "createdBy": "user123"
  }
}
```

### 3.4 更新公开可写集合中的数据

```
PUT /api/dictionary/:collection/:key
权限: 无需登录（集合 accessType 必须为 public_write）
```

**请求参数：**
```json
{
  "value": {
    "title": "功能建议（已处理）",
    "content": "暗黑模式已上线",
    "createdBy": "user123"
  }
}
```

---

## 三、用户私有数据 API

### 4.1 获取用户在集合中的所有数据

```
GET /api/user-data/:collection
权限: 需要登录（集合 accessType 必须为 user_private）
```

**示例：**
```bash
GET /api/user-data/user_preferences
```

**响应示例：**
```json
{
  "code": 200,
  "data": {
    "collection": "user_preferences",
    "items": [
      {
        "key": "language",
        "value": "zh-CN",
        "sortOrder": 0
      },
      {
        "key": "region",
        "value": "CN",
        "sortOrder": 0
      }
    ],
    "total": 2
  }
}
```

### 4.2 获取用户的单个数据

```
GET /api/user-data/:collection/:key
权限: 需要登录（集合 accessType 必须为 user_private）
```

**示例：**
```bash
GET /api/user-data/user_preferences/language
```

**响应示例：**
```json
{
  "code": 200,
  "data": "zh-CN"
}
```

### 4.3 设置用户数据

```
PUT /api/user-data/:collection/:key
权限: 需要登录（集合 accessType 必须为 user_private）
```

**请求参数：**
```json
{
  "value": "en-US"
}
```

**响应示例：**
```json
{
  "code": 200,
  "data": {
    "message": "设置成功"
  }
}
```

### 4.4 删除用户数据

```
DELETE /api/user-data/:collection/:key
权限: 需要登录（集合 accessType 必须为 user_private）
```

**响应示例：**
```json
{
  "code": 200,
  "data": {
    "message": "删除成功"
  }
}
```

---

## 四、代码中使用（Service 便捷方法）

### 4.1 获取集合所有数据

```typescript
import { DictionaryService } from '@/system/dictionary/dictionary.service';

// 注入服务
constructor(private readonly dictionaryService: DictionaryService) {}

// 获取所有游戏服务器
const servers = await this.dictionaryService.getCollectionData<GameServer>('game_servers');
// 返回: [{ code: 'server1', name: '一区', ... }, ...]
```

### 4.2 获取集合数据映射

```typescript
// 获取服务器映射
const serverMap = await this.dictionaryService.getCollectionMap<GameServer>('game_servers');
// 返回: Map { 'server1' => { code: 'server1', name: '一区', ... }, ... }

// 使用
const server1 = serverMap.get('server1');
```

### 4.3 快速设置值

```typescript
// 设置或更新配置
await this.dictionaryService.setValue('system_config', 'maintenance_mode', {
  enabled: true,
  message: '系统维护中'
});
```

### 4.4 获取单个值

```typescript
// 获取单个配置值
const maintenanceConfig = await this.dictionaryService.getValue('system_config', 'maintenance_mode');
// 返回: { enabled: true, message: '系统维护中' }
```

### 4.5 获取集合数据（带分页）

```typescript
// 获取集合数据
const result = await this.dictionaryService.findByCollection('app_config');
// 返回: { collection: 'app_config', items: [...], total: 10 }
```

### 4.6 用户私有数据操作

```typescript
// 获取用户所有偏好设置
const preferences = await this.dictionaryService.getUserData('user_preferences', userId);

// 获取用户单个偏好
const language = await this.dictionaryService.getUserValue('user_preferences', userId, 'language');

// 设置用户偏好
await this.dictionaryService.setUserValue('user_preferences', userId, 'language', 'zh-CN');

// 删除用户偏好
await this.dictionaryService.deleteUserValue('user_preferences', userId, 'language');
```

---

## 五、预置集合示例

### 1. 后台配置中心

#### game_servers - 游戏服务器列表
- **数据类型**: object
- **访问类型**: public_read
- **用途**: 游戏服务器配置

```json
{
  "key": "server1",
  "value": {
    "code": "server1",
    "name": "一区",
    "capacity": 1000,
    "region": "华东"
  }
}
```

#### system_config - 系统配置
- **数据类型**: object
- **访问类型**: private
- **用途**: 系统全局配置参数

```json
{
  "key": "max_characters_per_server",
  "value": {
    "value": 5,
    "type": "number",
    "description": "每个服务器最多创建角色数"
  }
}
```

### 2. C端通用数据存储

#### app_config - 应用配置
- **数据类型**: object
- **访问类型**: public_read
- **用途**: C端应用全局配置

```json
{
  "key": "theme",
  "value": {
    "primaryColor": "#1890ff",
    "mode": "light"
  }
}
```

#### common_data - 通用数据
- **数据类型**: object
- **访问类型**: public_write
- **用途**: C端通用数据存储（允许用户提交）

```json
{
  "key": "feedback1",
  "value": {
    "title": "功能建议",
    "content": "希望增加暗黑模式",
    "createdBy": "user123",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3. 用户私有数据

#### user_preferences - 用户偏好
- **数据类型**: object
- **访问类型**: user_private
- **每用户限制**: 50条
- **用途**: 用户个人偏好设置（语言、地区等）

```json
{
  "key": "language",
  "userId": 123,
  "value": "zh-CN"
}
```

#### user_settings - 用户设置
- **数据类型**: object
- **访问类型**: user_private
- **每用户限制**: 100条
- **用途**: 用户个人设置

```json
{
  "key": "notification",
  "userId": 123,
  "value": {
    "email": true,
    "sms": false,
    "push": true
  }
}
```

#### user_cache - 用户缓存
- **数据类型**: object
- **访问类型**: user_private
- **每用户限制**: 200条
- **用途**: 用户临时数据缓存

```json
{
  "key": "last_search",
  "userId": 123,
  "value": {
    "keyword": "游戏",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## 六、使用场景

### 场景 1：C端应用配置

**后台操作：**
1. 创建 app_config 集合（accessType: public_read）
2. 添加配置数据

**前端调用：**
```typescript
// C端获取应用配置
const response = await fetch('/api/dictionary/app_config');
const { data } = await response.json();
// 应用配置
data.items.forEach(item => {
  console.log(item.key, item.value);
});
```

### 场景 2：用户提交反馈

**后台操作：**
1. 创建 common_data 集合
2. 设置为公开读写（accessType: public_write）

**前端调用：**
```typescript
// C端提交反馈
await fetch('/api/dictionary/common_data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    key: `feedback_${Date.now()}`,
    value: {
      title: '用户反馈',
      content: '希望增加新功能',
      createdBy: 'user123'
    }
  })
});
```

### 场景 3：代码中使用配置

**后台操作：**
1. 在 system_config 集合中配置参数

**代码中使用：**
```typescript
// 在 Service 中使用
const maxChars = await this.dictionaryService.getValue('system_config', 'max_characters_per_server');
if (userCharacters.length >= maxChars.value) {
  throw new Error('已达到最大角色数');
}
```

### 场景 4：动态游戏服务器列表

**后台操作：**
1. 在 game_servers 集合中添加服务器

**代码中使用：**
```typescript
// 获取所有可用服务器
const servers = await this.dictionaryService.getCollectionData('game_servers');
const serverMap = await this.dictionaryService.getCollectionMap('game_servers');

// 验证服务器是否存在
if (!serverMap.has(serverId)) {
  throw new Error('服务器不存在');
}
```

### 场景 5：用户偏好设置

**后台操作：**
1. 创建 user_preferences 集合（accessType: user_private）

**前端调用：**
```typescript
// 获取用户语言偏好
const response = await fetch('/api/user-data/user_preferences/language', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { data } = await response.json();
console.log('用户语言:', data); // "zh-CN"

// 设置用户语言偏好
await fetch('/api/user-data/user_preferences/language', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ value: 'en-US' })
});
```

**代码中使用：**
```typescript
// 获取用户偏好
const language = await this.dictionaryService.getUserValue('user_preferences', userId, 'language');

// 设置用户偏好
await this.dictionaryService.setUserValue('user_preferences', userId, 'language', 'zh-CN');
```

---

## 七、最佳实践

### 1. 集合设计原则

**命名规范：**
- 使用小写字母和下划线
- 使用复数形式（如：banners, announcements）
- 语义清晰，易于理解

**访问类型设置：**
- **private**：系统配置、敏感数据（仅后台可访问）
- **public_read**：应用配置、服务器列表（C端可读）
- **public_write**：用户反馈、通用数据（C端可读写）
- **user_private**：用户偏好、设置（用户只能访问自己的数据）

**条目限制：**
- 根据实际需求设置 maxItems
- 防止数据无限增长

### 2. 数据类型选择

| 数据类型 | 适用场景 | 示例 |
|---------|---------|------|
| object | 复杂结构数据 | 服务器配置、商品信息 |
| array | 列表数据 | 标签列表、选项列表 |
| string | 简单文本 | 公告内容、描述 |
| number | 数值配置 | 价格、限制数量 |
| boolean | 开关配置 | 功能开关 |
| image | 图片URL | 轮播图、图标 |
| file | 文件URL | 文档、附件 |

### 3. 键命名规范

```typescript
// ✅ 推荐
'banner_home_1'
'server_cn_east_1'
'config_max_upload_size'

// ❌ 避免
'Banner1'
'srv1'
'cfg'
```

### 4. 值结构设计

```typescript
// ✅ 推荐：结构清晰，包含必要元数据
{
  "title": "新年活动",
  "image": "https://example.com/banner.jpg",
  "link": "/activity/newyear",
  "startTime": "2024-01-01T00:00:00Z",
  "endTime": "2024-01-31T23:59:59Z",
  "enabled": true
}

// ❌ 避免：结构混乱，缺少元数据
{
  "t": "活动",
  "i": "banner.jpg",
  "l": "/activity"
}
```

### 5. 代码中使用建议

```typescript
// ✅ 推荐：使用便捷方法
const servers = await this.dictionaryService.getCollectionData('game_servers');

// ✅ 推荐：使用 Map 提高查询效率
const serverMap = await this.dictionaryService.getCollectionMap('game_servers');
const server = serverMap.get('server1');

// ❌ 避免：每次都查询数据库
for (const id of serverIds) {
  const server = await this.dictionaryService.getValue('game_servers', id);
}
```

### 6. 缓存策略

```typescript
// 对于频繁访问的数据，建议使用缓存
import { Injectable } from '@nestjs/common';
import { DictionaryService } from '@/system/dictionary/dictionary.service';

@Injectable()
export class GameServerService {
  private serverCache: Map<string, any> = new Map();
  private cacheTime: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟

  constructor(private readonly dictionaryService: DictionaryService) {}

  async getServers() {
    const now = Date.now();
    if (now - this.cacheTime > this.CACHE_TTL) {
      this.serverCache = await this.dictionaryService.getCollectionMap('game_servers');
      this.cacheTime = now;
    }
    return this.serverCache;
  }
}
```

---

## 八、注意事项

### 安全性

1. **公开读写集合**：需要额外的验证和过滤
2. **数据验证**：使用 schema 定义数据结构
3. **权限控制**：敏感数据不要设置为公开

### 性能优化

1. **缓存策略**：频繁访问的数据使用缓存
2. **批量查询**：使用 getCollectionData 而不是多次 getValue
3. **索引优化**：collection 和 status 字段已建立索引

### 数据管理

1. **唯一性约束**：同一集合内键必须唯一
2. **外键约束**：删除集合会级联删除所有数据
3. **状态管理**：使用 status 字段而不是直接删除
4. **排序顺序**：使用 sortOrder 控制显示顺序

### 错误处理

```typescript
try {
  const data = await this.dictionaryService.getValue('banners', 'banner1');
} catch (error) {
  if (error instanceof NotFoundException) {
    // 数据不存在
  } else if (error instanceof ForbiddenException) {
    // 无权限访问
  }
}
```

---

## 九、迁移指南

### 从旧版本迁移

如果你已经在使用 dictionary 表，执行以下步骤：

1. **备份数据**
```sql
CREATE TABLE dictionary_backup AS SELECT * FROM dictionary;
```

2. **执行迁移脚本**
```bash
mysql -u root -p your_database < scripts/migrations/create-dictionary-table.sql
```

3. **验证数据**
```sql
SELECT * FROM dictionary_collection;
SELECT * FROM dictionary LIMIT 10;
```

### 初始化示例数据

```sql
-- 已在迁移脚本中包含示例集合配置
-- 可以根据需要添加更多集合
```

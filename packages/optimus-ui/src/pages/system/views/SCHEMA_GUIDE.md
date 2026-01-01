# 字典管理 Schema 使用指南

## 概述

Schema 功能允许你为字典集合定义数据结构，类似于数据库的表结构。定义 Schema 后：
- 后端会自动验证数据是否符合 Schema 要求
- 前端会根据 Schema 自动生成表单，方便快速输入

## Schema 格式

Schema 使用 JSON Schema 的简化版本，支持常见的数据类型和验证规则。

### 基本结构

```json
{
  "type": "object",
  "properties": {
    "字段名": {
      "type": "字段类型",
      "title": "显示标题",
      "description": "字段说明",
      "default": "默认值",
      "unique": true
    }
  },
  "required": ["必填字段1", "必填字段2"]
}
```

### 字段属性说明

- **type**：字段类型（string、number、integer、boolean、array、object）
- **title**：显示标题，用于表单标签
- **description**：字段说明，显示为提示信息
- **default**：默认值
- **unique**：是否唯一（true/false），如果为 true，该字段的值在整个集合中必须唯一
- **required**：在顶层 required 数组中列出的字段为必填字段

## 支持的字段类型

### 1. 字符串 (string)

**基本文本输入：**
```json
{
  "name": {
    "type": "string",
    "title": "名称",
    "description": "请输入名称"
  }
}
```

**多行文本：**
```json
{
  "description": {
    "type": "string",
    "format": "textarea",
    "title": "描述"
  }
}
```

**枚举选择（下拉框）：**
```json
{
  "status": {
    "type": "string",
    "title": "状态",
    "enum": ["active", "inactive", "pending"],
    "default": "active"
  }
}
```

**URL 输入：**
```json
{
  "website": {
    "type": "string",
    "format": "url",
    "title": "网站"
  }
}
```

**图片 URL：**
```json
{
  "avatar": {
    "type": "string",
    "format": "image",
    "title": "头像"
  }
}
```

### 2. 数字 (number / integer)

**普通数字：**
```json
{
  "price": {
    "type": "number",
    "title": "价格"
  }
}
```

**整数：**
```json
{
  "age": {
    "type": "integer",
    "title": "年龄"
  }
}
```

### 3. 布尔值 (boolean)

```json
{
  "enabled": {
    "type": "boolean",
    "title": "是否启用",
    "default": true
  }
}
```

### 4. 数组 (array)

```json
{
  "tags": {
    "type": "array",
    "title": "标签",
    "description": "输入 JSON 数组格式"
  }
}
```

### 5. 对象 (object)

```json
{
  "metadata": {
    "type": "object",
    "title": "元数据",
    "description": "输入 JSON 对象格式"
  }
}
```

## 完整示例

### 示例 1：游戏服务器配置

```json
{
  "type": "object",
  "properties": {
    "code": {
      "type": "string",
      "title": "服务器代码",
      "description": "唯一标识符",
      "unique": true
    },
    "name": {
      "type": "string",
      "title": "服务器名称"
    },
    "region": {
      "type": "string",
      "title": "地区",
      "enum": ["华东", "华南", "华北", "西南"],
      "default": "华东"
    },
    "capacity": {
      "type": "integer",
      "title": "容量",
      "default": 1000
    },
    "enabled": {
      "type": "boolean",
      "title": "是否启用",
      "default": true
    },
    "description": {
      "type": "string",
      "format": "textarea",
      "title": "描述"
    }
  },
  "required": ["code", "name", "region"]
}
```

**说明**：`code` 字段设置了 `unique: true`，表示服务器代码在整个集合中必须唯一，不能有两个服务器使用相同的代码。

### 示例 2：轮播图配置

```json
{
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "title": "标题"
    },
    "image": {
      "type": "string",
      "format": "image",
      "title": "图片 URL"
    },
    "link": {
      "type": "string",
      "format": "url",
      "title": "跳转链接"
    },
    "order": {
      "type": "integer",
      "title": "排序",
      "default": 0
    },
    "enabled": {
      "type": "boolean",
      "title": "是否显示",
      "default": true
    }
  },
  "required": ["title", "image"]
}
```

### 示例 3：用户偏好设置

```json
{
  "type": "object",
  "properties": {
    "language": {
      "type": "string",
      "title": "语言",
      "enum": ["zh-CN", "en-US", "ja-JP"],
      "default": "zh-CN"
    },
    "theme": {
      "type": "string",
      "title": "主题",
      "enum": ["light", "dark", "auto"],
      "default": "light"
    },
    "notifications": {
      "type": "boolean",
      "title": "接收通知",
      "default": true
    }
  },
  "required": ["language"]
}
```

## 使用流程

### 1. 创建集合时定义 Schema

1. 进入字典管理页面
2. 点击"新建集合"
3. 填写基本信息
4. 在"数据结构 Schema"字段中输入 Schema JSON
5. 保存

### 2. 编辑集合更新 Schema

1. 在集合列表中点击"编辑"
2. 修改"数据结构 Schema"字段
3. 保存

### 3. 使用表单模式添加数据

1. 点击集合的"管理数据"按钮
2. 点击"新建数据"
3. 如果集合定义了 Schema，会显示两个标签页：
   - **表单模式**：根据 Schema 自动生成的表单
   - **JSON 模式**：手动编辑 JSON
4. 在表单模式中填写各个字段
5. 保存

### 4. 后端自动验证

当保存数据时，后端会自动：
- 验证必填字段是否填写
- 验证字段类型是否正确
- 如果验证失败，返回错误信息

## 注意事项

1. **Schema 是可选的**：如果不定义 Schema，仍然可以使用 JSON 模式自由编辑数据

2. **Schema 格式**：必须是有效的 JSON 格式，否则保存时会报错

3. **必填字段**：在 `required` 数组中列出的字段必须填写

4. **类型验证**：后端会验证字段类型，确保数据一致性

5. **默认值**：可以为字段设置默认值，新建数据时会自动填充

6. **枚举值**：使用 `enum` 可以限制字段只能选择特定的值

7. **复杂类型**：对于 array 和 object 类型，目前需要手动输入 JSON 格式

## 最佳实践

1. **合理使用枚举**：对于有限选项的字段，使用 `enum` 可以避免输入错误

2. **提供描述信息**：使用 `description` 字段为用户提供输入提示

3. **设置默认值**：为常用字段设置合理的默认值，提高输入效率

4. **标记必填字段**：明确哪些字段是必填的，避免数据不完整

5. **选择合适的格式**：根据字段用途选择合适的 `format`（textarea、url、image 等）

6. **使用唯一性约束**：对于需要唯一标识的字段（如 code、id 等），启用唯一性约束

## 唯一性约束详解

### 什么是唯一性约束？

当字段设置了 `unique: true` 后，该字段的值在整个集合中必须唯一。例如：
- 服务器列表中的 `code` 字段
- 用户配置中的 `userId` 字段
- 商品列表中的 `sku` 字段

### 如何设置？

在可视化编辑器中，为字段启用"唯一"开关即可。

### 验证时机

- **创建数据时**：检查新值是否已存在
- **更新数据时**：检查新值是否与其他记录冲突（排除当前记录）

### 错误提示

如果违反唯一性约束，会收到类似以下的错误提示：
```
字段 code 的值 "server_01" 已存在，该字段要求唯一
```

### 使用场景

1. **服务器代码**：确保每个服务器有唯一的标识
2. **用户ID**：确保用户标识不重复
3. **订单号**：确保订单号唯一
4. **SKU**：确保商品编码唯一

## 示例：创建游戏服务器集合

1. **创建集合**：
   - 集合名称：`game_servers`
   - 显示名称：游戏服务器
   - 数据类型：object
   - 访问类型：public_read

2. **定义 Schema**：
```json
{
  "type": "object",
  "properties": {
    "code": {
      "type": "string",
      "title": "服务器代码",
      "unique": true
    },
    "name": {
      "type": "string",
      "title": "服务器名称"
    },
    "region": {
      "type": "string",
      "title": "地区",
      "enum": ["华东", "华南", "华北", "西南"]
    },
    "capacity": {
      "type": "integer",
      "title": "容量",
      "default": 1000
    },
    "enabled": {
      "type": "boolean",
      "title": "是否启用",
      "default": true
    }
  },
  "required": ["code", "name", "region"]
}
```

**注意**：`code` 字段设置了 `unique: true`，确保服务器代码唯一。

3. **添加数据**：
   - 进入数据管理页面
   - 使用表单模式快速填写
   - 系统自动验证数据格式

这样就完成了一个带 Schema 验证的字典集合配置！

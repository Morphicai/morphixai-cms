# API 服务层文档

## 概述

本目录包含文章管理系统的所有 API 服务封装，提供统一的错误处理机制和一致的调用接口。

## 服务列表

### ArticleService - 文章服务

封装文章相关的所有 API 调用。

**方法：**

- `list(params, options)` - 获取文章列表
- `create(data, options)` - 创建文章
- `update(id, data, options)` - 更新文章
- `getById(id, options)` - 获取文章详情
- `publish(id, options)` - 发布文章
- `archive(id, options)` - 归档文章
- `delete(id, options)` - 删除文章
- `search(keyword, params, options)` - 搜索文章
- `getStats(params, options)` - 获取统计信息

### CategoryService - 分类服务

封装分类相关的所有 API 调用。

**方法：**

- `list(params, options)` - 获取分类列表
- `create(data, options)` - 创建分类
- `update(id, data, options)` - 更新分类
- `delete(id, options)` - 删除分类
- `getById(id, options)` - 获取分类详情
- `getBuiltIn(options)` - 获取内置分类
- `validateArticle(categoryId, articleData, options)` - 验证文章

### VersionService - 版本服务

封装文章版本相关的所有 API 调用。

**方法：**

- `list(articleId, params, options)` - 获取版本列表
- `getById(articleId, versionId, options)` - 获取版本详情
- `revert(articleId, versionId, options)` - 回退版本
- `publish(articleId, versionId, options)` - 发布版本
- `compare(articleId, versionId1, versionId2, options)` - 比较版本
- `getStats(articleId, options)` - 获取版本统计

## 错误处理机制

### 统一错误处理

所有服务方法都集成了统一的错误处理机制，自动处理 API 错误并显示友好的错误提示。

### 错误处理选项

每个服务方法都接受一个可选的 `options` 参数来控制错误处理行为：

```javascript
{
  showError: true,  // 是否显示错误提示，默认 true
}
```

### 使用示例

#### 基本使用（自动显示错误）

```javascript
import ArticleService from '@/services/ArticleService';

// 自动显示错误提示
const response = await ArticleService.list({ page: 1, pageSize: 10 });

if (response.success) {
  console.log('文章列表：', response.data);
}
```

#### 禁用自动错误提示

```javascript
// 不显示错误提示，手动处理错误
const response = await ArticleService.create(articleData, { showError: false });

if (!response.success) {
  // 自定义错误处理
  console.error('创建失败：', response.msg);
}
```

#### 在组件中使用

```javascript
import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import ArticleService from '@/services/ArticleService';

function ArticleList() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    setLoading(true);
    const response = await ArticleService.list({ page: 1, pageSize: 10 });
    setLoading(false);

    if (response.success) {
      setArticles(response.data.items);
    }
    // 错误已自动处理，无需额外代码
  };

  const handleDelete = async (id) => {
    const response = await ArticleService.delete(id);
    
    if (response.success) {
      message.success('删除成功');
      loadArticles(); // 重新加载列表
    }
  };

  return (
    // ... 组件 JSX
  );
}
```

## 错误码参考

### 文章相关错误 (40001-40099)

| 错误码 | 说明 |
|--------|------|
| 40001 | 文章不存在 |
| 40002 | 文章已存在 |
| 40003 | 文章创建失败 |
| 40004 | 文章更新失败 |
| 40005 | 文章删除失败 |
| 40008 | 文章无法发布 |
| 40009 | 文章无法归档 |

### 分类相关错误 (40101-40199)

| 错误码 | 说明 |
|--------|------|
| 40101 | 分类不存在 |
| 40102 | 分类已存在 |
| 40106 | 分类下存在文章，无法删除 |
| 40107 | 内置分类不能删除 |
| 40108 | 内置分类不能修改 |

### 版本相关错误 (40301-40399)

| 错误码 | 说明 |
|--------|------|
| 40301 | 版本不存在 |
| 40304 | 版本数量超出限制 |
| 40305 | 不能删除已发布的版本 |
| 40306 | 不能删除当前版本 |
| 40308 | 版本回退失败 |

完整的错误码列表请参考 `src/constants/errorCodes.js`。

## 高级用法

### 使用错误处理工具函数

```javascript
import { handleApiError, isSuccess, getErrorMessage } from '@/utils/errorHandler';
import { ERROR_CODES } from '@/constants/errorCodes';

// 检查响应是否成功
if (isSuccess(response)) {
  // 处理成功逻辑
}

// 获取错误消息
const errorMsg = getErrorMessage(ERROR_CODES.ARTICLE_NOT_FOUND);

// 手动处理错误
handleApiError(response, {
  defaultMessage: '操作失败',
  onError: (errorInfo) => {
    console.log('错误详情：', errorInfo);
  }
});
```

### 批量操作错误处理

```javascript
import { handleBatchErrors } from '@/utils/errorHandler';

const errors = ['错误1', '错误2', '错误3'];
handleBatchErrors(errors);
```

## 最佳实践

1. **始终检查响应的 success 字段**
   ```javascript
   const response = await ArticleService.create(data);
   if (response.success) {
     // 成功处理
   }
   ```

2. **使用 isSuccess 工具函数**
   ```javascript
   import { isSuccess } from '@/utils/errorHandler';
   
   if (isSuccess(response)) {
     // 成功处理
   }
   ```

3. **在需要自定义错误处理时禁用自动提示**
   ```javascript
   const response = await ArticleService.delete(id, { showError: false });
   if (!response.success) {
     // 自定义错误处理
   }
   ```

4. **利用错误码进行特定错误处理**
   ```javascript
   import { ERROR_CODES } from '@/constants/errorCodes';
   
   const response = await ArticleService.publish(id);
   if (!response.success) {
     if (response.code === ERROR_CODES.ARTICLE_ALREADY_PUBLISHED) {
       message.warning('文章已经发布过了');
     }
   }
   ```

## 注意事项

1. 所有服务方法都是异步的，需要使用 `async/await` 或 Promise
2. 错误提示默认使用 Ant Design 的 `message` 组件
3. 服务方法的 `options` 参数是可选的，默认会显示错误提示
4. 响应格式统一为 `{ success, code, data, msg }`

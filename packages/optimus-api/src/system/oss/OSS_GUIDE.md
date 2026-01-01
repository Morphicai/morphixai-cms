# OSS 存储系统使用指南

## 快速开始

### 基本文件上传

```typescript
// 默认上传（私有 + common）
await storageService.uploadFile(file);
// → dev/private/common/abc123.jpg

// 指定业务类型
await storageService.uploadFile(file, {
  business: 'user'
});
// → dev/private/user/abc123.jpg

// 公开文件
await storageService.uploadFile(file, {
  business: 'product',
  accessType: 'public'
});
// → dev/public/product/abc123.jpg

// 带缩略图
await storageService.uploadFile(file, {
  business: 'user',
  generateThumbnail: true
});
// 原图: dev/private/user/abc123.jpg
// 缩略图: dev/private/user/thumbnails/thumb_abc123.jpg
```

## 路径结构

### 统一路径格式
```
{环境}/{权限}/{业务}/{文件名}
例: dev/private/user/abc123.jpg
```

### 常用业务标识

| 业务 | 标识 | 权限 | 说明 |
|------|------|------|------|
| 用户头像 | `user` | `private` | 用户相关文件 |
| 产品图片 | `product` | `public` | 产品展示图片 |
| 文档 | `document` | `private` | 文档文件 |
| 公告 | `announcement` | `public` | 公告附件 |
| 通用 | `common` | `private` | 默认分类 |

### 缩略图路径
缩略图自动存储在业务目录下的 `thumbnails` 子目录：
```
dev/private/user/thumbnails/thumb_abc123.jpg
```

## 存储类型配置

### 阿里云 OSS 存储类型

| 存储类型 | 访问特性 | 适用场景 | 成本 |
|---------|---------|---------|------|
| **标准存储** | 实时访问 | 热数据、频繁访问 | 高 |
| **低频访问存储** | 实时访问 | 不频繁但需实时响应 | 中 |
| **归档存储** | **需要解冻** | 长期归档、很少访问 | 低 |

**重要**：系统默认使用**标准存储**，确保文件可以实时访问。

### 上传时指定存储类型
```typescript
// 系统自动设置为标准存储
const headers = {
  'Content-Type': file.mimetype,
  'x-oss-storage-class': 'Standard', // 避免归档问题
};
```

## 工具方法

### StoragePathUtils 工具类

```typescript
import { StoragePathUtils, AccessType } from './utils/storage-path.utils';

// 生成路径
const path = StoragePathUtils.generatePath({
  environment: 'dev',
  accessType: AccessType.PRIVATE,
  business: 'user',
  fileName: 'abc123.jpg'
});

// 生成缩略图路径
const thumbnailPath = StoragePathUtils.generateThumbnailPath(path);

// 解析路径信息
const info = StoragePathUtils.parsePathInfo(path);

// 验证路径
const isValid = StoragePathUtils.isValidPath(path);
```

## 临时URL缓存

### 缓存功能
- **智能缓存**：避免频繁生成签名URL
- **缓存键**：`provider:fileKey:expiresIn`
- **缓存TTL**：URL过期时间 - 5分钟（缓冲时间）
- **最大缓存**：1000个条目

### 使用示例
```typescript
// 第一次调用：生成URL并缓存
const result1 = await temporaryUrlService.generateTemporaryUrl(fileKey, {
  expiresIn: 3600, // 1小时
});

// 第二次调用：从缓存返回
const result2 = await temporaryUrlService.generateTemporaryUrl(fileKey, {
  expiresIn: 3600,
});
// result1.temporaryUrl === result2.temporaryUrl
```

## 环境配置

### 默认值
- **环境**: `NODE_ENV` 或 `'dev'`
- **权限**: `'private'`
- **业务**: `'common'`

### 环境变量
```env
# 存储提供商
STORAGE_PROVIDER=aliyun

# 阿里云 OSS 配置
ALIYUN_OSS_REGION=cn-beijing
ALIYUN_OSS_ACCESS_KEY_ID=your-access-key-id
ALIYUN_OSS_ACCESS_KEY_SECRET=your-access-key-secret
ALIYUN_OSS_BUCKET=your-bucket-name
ALIYUN_OSS_THUMBNAIL_BUCKET=your-thumbnail-bucket
```

## 最佳实践

### 1. 文件组织
- 使用有意义的业务标识
- 为不同类型文件创建不同分类
- 定期清理无用文件

### 2. 性能优化
- 启用CDN加速
- 选择就近的OSS区域
- 合理设置缩略图尺寸

### 3. 安全建议
- 使用RAM用户而非主账号
- 定期轮换AccessKey
- 设置合适的存储桶权限

### 4. 成本控制
- 使用生命周期规则
- 监控存储使用量
- 定期清理临时文件

## 故障排除

### 常见错误

1. **时间戳格式错误**
   ```
   错误: Invalid date (should be seconds since epoch)
   解决: 使用秒级时间戳而不是Date对象
   ```

2. **存储桶不存在**
   ```
   错误: NoSuchBucket
   解决: 检查存储桶名称和区域配置
   ```

3. **权限不足**
   ```
   错误: Access denied
   解决: 检查RAM用户权限配置
   ```

### 调试技巧
- 启用详细日志
- 验证时间戳格式
- 检查配置参数

## 相关文档

- [临时URL缓存功能说明](./services/TEMPORARY_URL_CACHE.md)
- [存储接口文档](./interfaces/storage.interface.ts)
- [工具函数文档](./utils/index.ts)
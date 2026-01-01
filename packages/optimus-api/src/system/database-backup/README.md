# 数据库备份功能说明

## 功能概述

数据库备份功能提供了自动和手动备份数据库的能力，备份文件经过加密后存储在 OSS（对象存储服务）中。

## 加密机制

### 加密算法
- **算法**: AES-256-CBC
- **Key 派生**: 使用 SHA-256 从密钥字符串派生 32 字节的 key
- **IV 派生**: 使用 MD5 从密钥字符串派生 16 字节的 IV

### 密钥配置

密钥通过以下方式获取（优先级从高到低）：
1. 环境变量 `BACKUP_ENCRYPTION_SECRET`
2. 配置文件 `backup.defaultEncryptionSecret`
3. 默认值 `default-backup-encryption-secret-key`

**重要**: 生产环境请务必设置 `BACKUP_ENCRYPTION_SECRET` 环境变量，不要使用默认密钥！

## 备份流程

1. **导出数据库**: 使用 `mysqldump` 导出数据库为 SQL 文件
2. **压缩数据**: 使用 gzip 压缩 SQL 文件（`.sql.gz`）
3. **加密数据**: 使用 AES-256-CBC 加密压缩文件（`.sql.gz.enc`）
4. **上传到 OSS**: 上传加密文件到 OSS 存储

## 解密方式

### 方式一：通过 API 自动解密（推荐）

**接口**: `GET /api/backups/download?fileKey=<文件键名>`

后端会自动：
1. 从 OSS 下载加密文件
2. 使用配置的密钥解密文件
3. 返回解密后的 `.sql.gz` 文件流

**前端使用**:
```javascript
await backupService.downloadBackup(fileKey);
```

**直接访问**:
```bash
curl -H "Authorization: Bearer <token>" \
  "http://your-api-domain/api/backups/download?fileKey=database-backups/2024/01/backup-auto-20240101-120000.sql.gz.enc" \
  -o backup.sql.gz
```

### 方式二：手动解密（使用脚本）

如果已经下载了加密文件（`.enc` 后缀），可以使用提供的解密脚本手动解密。

#### Node.js 脚本

```bash
# 使用环境变量中的密钥
export BACKUP_ENCRYPTION_SECRET="your-secret-key"
node scripts/decrypt-backup.js backup-auto-20240101-120000.sql.gz.enc

# 或直接指定密钥
node scripts/decrypt-backup.js backup-auto-20240101-120000.sql.gz.enc output.sql.gz "your-secret-key"
```

#### Python 脚本

```bash
# 安装依赖
pip install pycryptodome

# 使用环境变量中的密钥
export BACKUP_ENCRYPTION_SECRET="your-secret-key"
python scripts/decrypt-backup.py backup-auto-20240101-120000.sql.gz.enc

# 或直接指定密钥
python scripts/decrypt-backup.py backup-auto-20240101-120000.sql.gz.enc output.sql.gz "your-secret-key"
```

## API 接口

### 1. 手动触发备份
- **接口**: `POST /api/backups/trigger`
- **权限**: 仅超级管理员
- **说明**: 立即执行一次数据库备份

### 2. 获取备份列表
- **接口**: `GET /api/backups`
- **权限**: 仅超级管理员
- **参数**:
  - `page`: 页码（默认 1）
  - `size`: 每页数量（默认 10）
  - `backupType`: 备份类型筛选（`auto` 或 `manual`）
  - `startDate`: 开始日期
  - `endDate`: 结束日期

### 3. 下载并解密备份文件（推荐）
- **接口**: `GET /api/backups/download?fileKey=<文件键名>`
- **权限**: 仅超级管理员
- **说明**: 自动解密并返回 `.sql.gz` 文件流

### 4. 生成下载链接（加密文件）
- **接口**: `GET /api/backups/download-url?fileKey=<文件键名>`
- **权限**: 仅超级管理员
- **说明**: 返回加密文件的直接下载链接，需要手动解密

### 5. 获取备份统计信息
- **接口**: `GET /api/backups/stats`
- **权限**: 仅超级管理员
- **返回**: 总备份数、总大小、自动/手动备份数量等

## 定时任务

### 自动备份
- **默认时间**: 每天凌晨 2 点
- **配置**: 通过 `backup.cronExpression` 配置 cron 表达式

### 自动清理
- **默认时间**: 每天凌晨 3 点
- **保留天数**: 默认 30 天（通过 `BACKUP_RETENTION_DAYS` 或 `backup.retentionDays` 配置）

## 文件格式

### 备份文件命名格式
```
backup-{type}-{timestamp}.sql.gz.enc
```

- `{type}`: `auto` 或 `manual`
- `{timestamp}`: `YYYYMMDD-HHmmss` 格式
- 示例: `backup-auto-20240101-120000.sql.gz.enc`

### 文件存储路径
```
{ossPath}/{YYYY}/{MM}/{filename}
```

- `{ossPath}`: 通过 `BACKUP_OSS_PATH` 或 `backup.ossPath` 配置（默认 `database-backups`）
- 示例: `database-backups/2024/01/backup-auto-20240101-120000.sql.gz.enc`

## 恢复数据库

解密后的文件是 `.sql.gz` 格式，可以使用以下命令恢复：

```bash
# 解压 gzip 文件
gunzip backup.sql.gz

# 或者直接解压到指定文件
gunzip -c backup.sql.gz > backup.sql

# 恢复数据库
mysql -u username -p database_name < backup.sql
```

## 安全注意事项

1. **密钥安全**: 
   - 生产环境必须设置 `BACKUP_ENCRYPTION_SECRET` 环境变量
   - 不要使用默认密钥
   - 定期更换密钥

2. **文件传输**: 
   - 传输加密文件时使用 HTTPS
   - 下载链接有过期时间（默认 1 小时）

3. **文件存储**: 
   - 解密后的文件包含敏感数据，请妥善保管
   - 不要将解密后的文件上传到公共存储

4. **权限控制**: 
   - 备份下载功能仅限超级管理员访问
   - 定期审查备份访问日志

## 相关文件

- 备份服务: `database-backup.service.ts`
- 备份控制器: `database-backup.controller.ts`
- Node.js 解密脚本: `../../scripts/decrypt-backup.js`
- Python 解密脚本: `../../scripts/decrypt-backup.py`


# MySQL 连接问题修复指南

## 问题描述

Navicat 连接 MySQL 时出现错误：
```
Access denied for user 'root'@'192.168.97.1' (using password: YES)
```

## 原因分析

1. **密码不正确**：虽然 `docker-compose.dev.yml` 中设置了 `MYSQL_ROOT_PASSWORD=OptimusRoot2024Secure`，但实际密码可能不同
2. **权限限制**：root 用户可能只允许从 `localhost` 连接，不允许从外部 IP (`192.168.97.1`) 连接

## 解决方案

### 方案 1：检查并修复 root 用户权限（推荐）

#### 步骤 1：进入 MySQL 容器

```bash
docker exec -it morphixai-cms-db-1 bash
```

#### 步骤 2：尝试登录 MySQL

```bash
# 尝试使用配置的密码
mysql -uroot -p
# 输入密码: OptimusRoot2024Secure

# 如果密码不对，尝试无密码
mysql -uroot
```

#### 步骤 3：修复权限（在 MySQL 中执行）

```sql
-- 查看当前 root 用户配置
SELECT user, host FROM mysql.user WHERE user='root';

-- 创建允许从任何主机连接的 root 用户
CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY 'OptimusRoot2024Secure';

-- 或者如果用户已存在，更新密码
ALTER USER 'root'@'%' IDENTIFIED BY 'OptimusRoot2024Secure';

-- 授予所有权限
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;

-- 刷新权限
FLUSH PRIVILEGES;

-- 再次查看确认
SELECT user, host FROM mysql.user WHERE user='root';
```

#### 步骤 4：退出容器

```bash
exit
```

### 方案 2：重置 MySQL root 密码（如果忘记密码）

#### 步骤 1：停止 MySQL 容器

```bash
docker stop morphixai-cms-db-1
```

#### 步骤 2：以跳过权限表模式启动

```bash
docker run -it --rm \
  --network morphixai-cms_optimus-dev-network \
  -v morphixai-cms_mysql_dev_data:/var/lib/mysql \
  mysql:8.0 \
  mysqld --skip-grant-tables --skip-networking
```

#### 步骤 3：在另一个终端连接并重置密码

```bash
docker exec -it <新容器ID> mysql -uroot

# 在 MySQL 中执行
ALTER USER 'root'@'localhost' IDENTIFIED BY 'OptimusRoot2024Secure';
ALTER USER 'root'@'%' IDENTIFIED BY 'OptimusRoot2024Secure';
FLUSH PRIVILEGES;
```

### 方案 3：重新创建数据库容器（⚠️ 会丢失数据）

如果数据库中没有重要数据，可以重新创建：

```bash
# 停止并删除容器和数据卷
docker-compose -f docker-compose.dev.yml down -v

# 重新启动
docker-compose -f docker-compose.dev.yml up -d

# 等待 MySQL 初始化完成（约 30 秒）
docker logs -f morphixai-cms-db-1
```

### 方案 4：使用 MySQL 8.0 的认证插件兼容性

MySQL 8.0 默认使用 `caching_sha2_password`，某些客户端可能不支持。可以切换到 `mysql_native_password`：

```sql
-- 在 MySQL 中执行
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'OptimusRoot2024Secure';
ALTER USER 'root'@'%' IDENTIFIED WITH mysql_native_password BY 'OptimusRoot2024Secure';
FLUSH PRIVILEGES;
```

## Navicat 连接配置

修复权限后，在 Navicat 中使用以下配置：

- **连接名称**: local（或任意名称）
- **主机**: `localhost` 或 `127.0.0.1`
- **端口**: `3306`
- **用户名**: `root`
- **密码**: `OptimusRoot2024Secure`（或你设置的新密码）

## 验证连接

修复后，可以通过以下方式验证：

```bash
# 从宿主机测试连接
docker exec morphixai-cms-db-1 mysql -uroot -pOptimusRoot2024Secure -e "SELECT 1;"
```

## 安全建议

1. **生产环境**：不要使用 root 用户，创建专用数据库用户
2. **密码强度**：使用强密码，包含大小写字母、数字和特殊字符
3. **网络隔离**：限制允许连接的 IP 地址
4. **使用环境变量**：将密码存储在 `.env` 文件中，不要提交到 Git

## 常见问题

### Q: 为什么密码不对？

A: 可能的原因：
- MySQL 初始化时密码设置失败
- 环境变量未正确传递
- 容器重启后密码被重置

### Q: 如何查看当前 root 密码？

A: MySQL 密码是加密存储的，无法直接查看。如果忘记，需要重置。

### Q: 如何允许特定 IP 连接？

A: 创建用户时指定 IP：
```sql
CREATE USER 'root'@'192.168.97.1' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'192.168.97.1';
```

## 相关文件

- `docker-compose.dev.yml` - Docker Compose 配置
- `scripts/fix-mysql-root-access.sh` - 自动修复脚本（如果密码正确）


# 测试环境说明

## 概述

E2E 测试的初始化脚本（`test/setup.ts`）会在所有用例开始前自动跑完这几步：

1. **数据库连接检查** —— 验证 MySQL 连通
2. **OSS 连接检查** —— 验证对象存储连通
3. **数据库初始化** —— 用 `db/optimus-minimal.sql` 种子数据建表灌数据
4. **启动测试服务** —— 拉起测试用的 server
5. **执行用例**
6. **保留数据** —— 跑完不清库，方便排查

## 特点

### 自动化初始化
- 自动检查并创建测试库
- 自动加载种子数据
- 自动拉起依赖服务

### 错误处理
- 报错带排查建议
- 连接超时与重试

### 便于调试
- 跑完保留数据库数据
- 详细日志输出
- 数据库统计信息

### 性能
- 一次初始化，多个用例复用
- 支持并行

## 使用

### 跑全部 E2E 测试
```bash
npm run test:e2e
```

### 跑指定范围
```bash
npm run test:auth          # 认证相关
npm run test:oss           # OSS / 存储相关
```

这三条是 `package.json` 里真实存在的 e2e 相关脚本，没有别的。
单元测试是另一套：`npm run test`（走 `jest.unit.config.js`）。

## 配置

### `.env.e2e`

**仓库里没有这个文件，需要自己建。** `test/setup.ts` 会按下面的顺序找，第一个存在的就用：

1. `<repo>/packages/.env.e2e`
2. `<repo>/.env.e2e` ← 注释里写的「project root」，推荐放这里
3. `<cwd>/.env.e2e`（从 `packages/optimus-api` 跑就是 `packages/optimus-api/.env.e2e`）
4. `<cwd>/../.env.e2e`
5. `<cwd>/../../.env.e2e`

五个位置一个都没命中就直接抛错（`Failed to locate .env.e2e file`），测试根本起不来。
放仓库根目录最稳；从 `packages/optimus-api` 目录跑测试的话，放在这个包下面也能被找到。

内容示例：

```env
# 数据库
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_test_database_password
DB_DATABASE=optimus_e2e

# 应用
APP_PORT=8082
NODE_ENV=e2e

# 存储
STORAGE_PROVIDER=minio
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
```

## 种子数据

测试用 `db/optimus-minimal.sql` 作为种子数据。

### 角色与权限（`op_sys_role`、`op_sys_role_menu`）

- 管理员（role_id=1）—— 全部权限码
- 运营（role_id=2）—— 内容管理相关权限码
- 普通用户（role_id=3）—— 基础权限

### 用户（`op_sys_user`）—— 种子里是空的

**种子数据不再预置任何用户。** SQL 里 `op_sys_user` 和 `op_sys_user_role` 两段记录都是空的
（注释：`No default users - users will be created during initialization`），
以前那三个账号（admin / operator / user）已经被有意去掉了。

管理员是在调用 `POST /api/setup/initialize` 时才创建的——初始化接口会写入 `op_sys_user`
并在 `op_sys_user_role` 里挂上管理员角色。所以：

- 需要登录态的用例，必须先走一遍 `/api/setup/initialize` 拿到自己创建的管理员账号，
  再用这个账号登录；
- 直接按「库里已经有 admin」写的用例会失败，查不到用户。

## 测试工具

### DatabaseTestHelper
```typescript
// 拿 helper
const dbHelper = getDatabaseHelper();

// 执行查询（注意表名带 op_ 前缀）
const users = await dbHelper.query('SELECT * FROM op_sys_user');

// 统计信息
const stats = await dbHelper.getDatabaseStats();

// 重置数据库（可选）
await resetDatabase();
```

## 排查

### 数据库连不上
1. 确认 MySQL 在跑
2. 检查 `.env.e2e` 里的数据库配置
3. 确认数据库用户有 CREATE 权限
4. 手工连一下（`mysql -h ... -u ... -p`）确认账号密码和库名

### 服务起不来
1. 看端口是否被占
2. 确认依赖装全了
3. 检查环境变量
4. 看 server 启动日志

### OSS 连不上
1. 确认 MinIO 在跑（如果用的是 MinIO）
2. 检查存储配置
3. 核对 access key

### 种子数据加载失败
1. 确认 `db/optimus-minimal.sql` 存在
2. 检查 SQL 语法
3. 确认数据库用户权限足够

### 提示 `.env.e2e file not found`
按上面「配置」一节的五个搜索路径挨个确认，最省事的做法是在仓库根目录建一个。

## 实践建议

### 测试隔离
- 每个测试文件独立
- 用事务或数据清理保证互不影响
- 别依赖某个特定的数据状态（尤其别假设库里有现成的管理员）

### 性能
- 用 `beforeAll` / `afterAll` 做准备和清理
- 别在每个用例里重复初始化
- 合理设置超时

### 调试技巧
- 用 `getDatabaseStats()` 看数据状态
- 看详细日志
- 跑完直接查库（数据是保留的）

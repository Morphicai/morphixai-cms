# CLAUDE.md — Optimus CMS

## Project Overview

Optimus CMS (morphixai-cms) — MorphixAI 的全栈内容管理系统。pnpm monorepo，含 4 个包。

## Tech Stack

| Package | Stack | Port |
|---------|-------|------|
| `packages/common` | TypeScript 工具库, crypto-js | - |
| `packages/optimus-api` | NestJS 8 + TypeORM 0.2 + MySQL 8 + JWT + CASL + Socket.io | 8084 |
| `packages/optimus-ui` | React 18 + Ant Design 5 + Craco + Tailwind 3 + SASS | 8082 |
| `packages/optimus-next` | Next.js 16 + React 19 + Tailwind 4 + CVA | 8086 |

Infrastructure: MySQL 8, MinIO (dev storage), Caddy (reverse proxy in Docker)

## Quick Start

```bash
# 1. 启动基础服务 (需要 Docker/OrbStack)
pnpm docker:dev

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp packages/optimus-api/.env.example packages/optimus-api/.env
# optimus-ui: cp packages/optimus-ui/.env.example packages/optimus-ui/.env.local

# 4. 初始化数据库 (MySQL ready 后)
# 导入 packages/optimus-api/db/optimus-minimal.sql 到 optimus 数据库

# 5. 启动开发
pnpm dev          # 全部启动
pnpm dev:next     # 仅 Next.js
```

### 启动要点（踩过的坑，换机必读）

1. **包管理器必须用 package.json 锁定的 pnpm 版本**（`npx pnpm@<锁定版> install`）。
   用不匹配的大版本装包会重写 lockfile 格式并搅乱整个 workspace 链接，api 会报几百个
   `@nestjs/*` 找不到——那不是代码坏了，是包布局被换了。
2. **`packages/common` 要先构建**（`cd packages/common && pnpm build`），否则 api 启动报
   `Cannot find module '@optimus/common/dist/index.js'`。workspace 软链指向的是构建产物。
3. **DATABASE_HOST 别用 localhost，直连容器地址**（OrbStack 下为
   `morphixai-cms-db-1.orb.local`）。走宿主机端口转发时闲置连接会被转发层静默掐断，
   十几分钟不动之后整池死连接，页面显示 "Database check timeout"。.env 不入库，
   所以这条只能记在这里。
4. **开发环境验证码是直通的**（`NODE_ENV=development` 下 `checkImgCaptcha` 直接放行），
   登录时验证码随便输 4 位即可。别为了"固定验证码"去开 TEST_MODE——那个开关会把
   `getCurrentEnvironment` 标成 e2e，初始化记录按环境名查不到，整个系统被守卫判成
   "未初始化"，所有接口 403。

## Dev Services (docker-compose.dev.yml)

- MySQL: `localhost:3306` (root / OptimusRoot2024Secure)
- MinIO API: `localhost:9000`, Console: `localhost:9001` (minioadmin / minioadmin123)
- Adminer: `localhost:8083`

## Commands

```bash
# Root
pnpm dev           # 所有包 dev 模式
pnpm build         # 构建所有包
pnpm test          # 运行所有测试
pnpm lint          # lint 所有包
pnpm clean         # 清理 node_modules/dist/build/.next
pnpm doctor        # 环境检查

# API
cd packages/optimus-api
pnpm dev           # NestJS watch mode
pnpm test          # Jest unit tests
pnpm test:e2e      # E2E tests (.env.e2e)

# UI (Admin)
cd packages/optimus-ui
pnpm dev           # Craco dev on :8082
pnpm test:e2e      # Playwright E2E

# Next.js (Client)
cd packages/optimus-next
pnpm dev           # Next.js dev on :8086
```

## Architecture

### Backend (optimus-api)

- **入口**: `src/main.ts` — Swagger at `/api/docs`
- **模块结构**: `src/system/` (系统模块) + `src/business/` (业务模块) + `src/shared/` (通用)
- **认证**: JWT + Passport → `UnifiedAuthGuard`
- **权限**: CASL → `CaslAbilityFactory`
- **存储**: Provider 抽象 — Aliyun OSS / MinIO / Memory
- **响应格式**: `{ code: number, data: any, msg?: string }`
- **数据库**: TypeORM entities, `DB_SYNCHRONIZE=false`，用 migration
- **日志**: log4js + Sentry
- **拦截器**: OperationLogInterceptor, TransformInterceptor
- **异常过滤**: HttpExceptionsFilter, ExceptionsFilter, GlobalExceptionFilter

### Frontend - optimus-ui (Admin)

- **路由**: HashRouter，常量定义在 `src/constants/routes.js`
- **状态**: GlobalContext + 局部 useState
- **认证**: `useAuth()` hook, token 存 localStorage
- **API**: axios + `apiFactory` 工厂模式 (`src/shared/utils/axios.js`)
- **权限**: CASL rules 控制菜单和按钮
- **组件**: Ant Design 5 + Pro components + Quill + CodeMirror

### Frontend - optimus-next (Client)

- **路由**: Next.js App Router (`src/app/`)
- **SDK**: `OptimusClientSDK` (`src/sdk/`) 封装所有 API 调用
- **认证**: `AuthProvider` context
- **组件**: `src/design-system/` + lucide-react icons
- **样式**: Tailwind CSS 4, CVA for variants

## Code Style

- **Prettier**: tabWidth 4, semi, double quotes, trailing commas
- **ESLint**: @typescript-eslint recommended + prettier
- **命名**:
  - Entity: `PascalCase` + `.entity.ts`
  - Service: `PascalCase` + `.service.ts`
  - Controller: `PascalCase` + `.controller.ts`
  - DTO: `Create|Update|Query` + `Dto`
  - React component: `PascalCase`
  - Hook: `use` prefix
  - Utility: `camelCase`

## Environment Variables

关键变量见 `packages/optimus-api/.env.example` 和根目录 `.env.example`。

开发环境默认值:
- `STORAGE_PROVIDER=minio` (本地用 MinIO)
- `DB_SYNCHRONIZE=false` (永远不要设 true)
- `NODE_ENV=development`

## Docker Production

`Dockerfile` 多阶段构建，Caddy 反向代理:
- `/api/*` → :8084 (backend)
- `/next/*` → :8086 (Next.js, strip prefix)
- `/*` → :8082 (React admin)
- 入口端口: 8080

## Key Files

- `TASKS.md` — 当前任务和优先级
- `.cursorrules` — AI 辅助规则
- `scripts/doctor.sh` — 环境检查
- `scripts/clean.sh` — 清理构建产物
- `packages/optimus-api/db/optimus-minimal.sql` — 数据库初始化 SQL

## Rules

1. 遵循已有代码风格，不要引入新的模式
2. 所有 API 响应遵循 `{ code, data, msg }` 格式
3. 数据库变更用 migration，不要开 synchronize
4. 敏感信息必须走环境变量，不能硬编码
5. 新增环境变量需更新 `.env.example`
6. 检查 `TASKS.md` 了解当前工作重点

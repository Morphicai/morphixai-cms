# 预约模块（Appointment）

> 接口契约（路径、参数、响应、认证细节）以 [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) 为准，本文只讲模块结构和怎么跑起来。

## 功能概述

收集用户预约信息：手机号、用户 UID、阶段、渠道、预约时间、额外字段 1。
数据落在 `op_biz_appointment` 表，**只增不删**——业务上要求预约记录不可删除，所以没有 delete 接口。

## 模块结构

```
appointment/
├── dto/
│   ├── create-appointment.dto.ts         # 创建预约入参
│   ├── query-appointment.dto.ts          # 列表查询入参 + 列表响应
│   ├── query-appointment-status.dto.ts   # 预约状态查询入参 + 响应
│   └── appointment-stats.dto.ts          # 公开统计接口的响应
├── entities/
│   └── appointment.entity.ts             # 预约实体（op_biz_appointment）
├── appointment.controller.ts             # 业务接口：create / status / list / export
├── public-appointment.controller.ts      # 匿名统计接口：stats 系列
├── appointment.service.ts                # 服务层
├── appointment.module.ts                 # 模块定义
├── API_DOCUMENTATION.md                  # 接口文档
└── README.md                             # 本文件
```

## 两个控制器的分工

**`appointment.controller.ts`**（前缀 `biz/appointment`）

- `POST /create`、`GET /status`：`@ClientUserAuth()`，客户端用户 JWT
  （`Authorization: Bearer` 或 `clientAccessToken` cookie）
- `GET /list`、`GET /export`：管理后台走 ADMIN 模式，需要 `@Perm("Appointment")` 权限码。
  ADMIN 模式是 fail-closed 的，光有一个有效 JWT 进不来，角色必须带这个权限码

**`public-appointment.controller.ts`**（前缀 `public/appointment`）

类级 `@AllowAnonymous()`，四个统计接口（`stats`、`stats/stage`、`stats/channel`、`stats/detail`）匿名可访问。
只吐聚合数字，往里加字段前先想清楚会不会把手机号带出去。

## 前端页面

管理后台页面在 `packages/optimus-ui/src/pages/appointment/`。

- ProTable 展示数据，支持按手机号 / 阶段 / 渠道搜索
- 支持 Excel 导出
- 没有删除按钮（数据不可删）
- 菜单挂在系统管理下，入口名「预约管理」；看不到菜单先查角色有没有 `Appointment` 权限码

## 部署

模块在 `app.module.ts` 里注册，表结构随 `db/optimus-minimal.sql` 的种子数据一起建。

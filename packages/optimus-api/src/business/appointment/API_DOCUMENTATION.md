# 预约模块 API 文档

## 概述

预约模块用来收集用户的预约信息：手机号、阶段、渠道、预约时间和一个额外字段。
数据落在 `op_biz_appointment` 表，只增不删。

**路径前缀说明**：`main.ts` 里 `setGlobalPrefix("/api")`（取自 `shared/config/*.yml` 的 `app.prefix`），
所以下面所有路径都已经带上 `/api`，控制器里写的是去掉 `/api` 之后的部分。

## 认证方式

模块里有两套认证，不要混：

| 接口组 | 装饰器 | 认证方式 |
| --- | --- | --- |
| `/api/biz/appointment/create`、`/api/biz/appointment/status` | `@ClientUserAuth()` | 客户端用户 JWT |
| `/api/biz/appointment/list`、`/api/biz/appointment/export` | 默认 ADMIN 模式 + `@Perm("Appointment")` | 管理端 JWT + 权限码 |
| `/api/public/appointment/**` | `@AllowAnonymous()` | 无需认证 |

### 客户端用户 JWT（`@ClientUserAuth()`）

token 从两个地方取，按顺序：

1. `Authorization: Bearer <token>` 请求头
2. `clientAccessToken` cookie

两个都没有直接 401。校验通过后守卫把用户挂到 `request.clientUser`，
`create` 接口的 `uid` 就是从这里取的（`clientUser.userId`），不需要在请求体里传。

### 管理端权限码（`@Perm("Appointment")`）

ADMIN 模式在 `unified-auth.guard.ts` 里是 fail-closed 的：没挂 `@Perm` / `@AllowNoPerm` /
`@RequireSuperAdmin` 的接口一律 403。所以 list / export 光有一个有效的管理端 JWT 不够，
账号角色还得带 `Appointment` 这个权限码（和前端菜单显隐共用 `op_sys_role_menu.permission_code`）。

## 接口列表

### 1. 创建预约记录

**Endpoint**：`POST /api/biz/appointment/create`

**认证**：`@ClientUserAuth()`，客户端用户 JWT

**请求体**：

```json
{
  "phone": "13800138000",
  "stage": "测试阶段",
  "channel": "官网",
  "appointmentTime": "2024-01-01T10:00:00Z",
  "extraField1": "备注信息"
}
```

| 参数 | 类型 | 必填 | 说明 |
|-----------|------|----------|-------------|
| phone | string | 是 | 手机号 |
| uid | string | 否 | 用户 UID。守卫里的 uid 优先，这里传的只在守卫没给出时兜底 |
| stage | string | 是 | 阶段 |
| channel | string | 是 | 渠道 |
| appointmentTime | string | 是 | 预约时间（ISO 8601） |
| extraField1 | string | 否 | 额外字段 1 |

**响应示例**：

```json
{
  "code": 200,
  "msg": "预约成功",
  "data": {
    "id": 1,
    "phone": "13800138000",
    "uid": "uid_123456",
    "stage": "测试阶段",
    "channel": "官网",
    "appointmentTime": "2024-01-01T10:00:00.000Z",
    "extraField1": "备注信息",
    "createDate": "2024-01-01T10:00:00.000Z",
    "updateDate": "2024-01-01T10:00:00.000Z"
  }
}
```

重复预约不会报错也不会新增记录，直接把已有那条原样返回，msg 同样是「预约成功」。

### 2. 查询预约状态

**Endpoint**：`GET /api/biz/appointment/status`

**认证**：`@ClientUserAuth()`，客户端用户 JWT

**Query 参数**：

| 参数 | 类型 | 必填 | 说明 |
|-----------|------|----------|-------------|
| phone | string | 否 | 手机号 |
| uid | string | 否 | 用户 UID |

两个都不传返回参数错误——至少给一个。

**响应示例**：

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "hasAppointment": true,
    "appointment": {
      "id": 1,
      "phone": "13800138000",
      "uid": "uid_123456",
      "stage": "测试阶段",
      "channel": "官网",
      "appointmentTime": "2024-01-01T10:00:00.000Z",
      "extraField1": "备注信息",
      "createDate": "2024-01-01T10:00:00.000Z"
    }
  }
}
```

没查到时 `hasAppointment` 为 `false`，`appointment` 缺省。

### 3. 查询预约记录列表（管理后台）

**Endpoint**：`GET /api/biz/appointment/list`

**认证**：管理端 JWT + `@Perm("Appointment")` 权限码

**Query 参数**：

| 参数 | 类型 | 必填 | 说明 |
|-----------|------|----------|-------------|
| page | number | 否 | 页码，从 1 开始，默认 1 |
| pageSize | number | 否 | 每页数量，默认 10 |
| phone | string | 否 | 手机号（模糊匹配） |
| stage | string | 否 | 阶段（精确匹配） |
| channel | string | 否 | 渠道（精确匹配） |
| sortField | string | 否 | 排序字段 |
| sortOrder | string | 否 | 排序方向（ascend / descend） |

**响应示例**：

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "phone": "13800138000",
        "uid": "uid_123456",
        "stage": "测试阶段",
        "channel": "官网",
        "appointmentTime": "2024-01-01T10:00:00.000Z",
        "extraField1": "备注信息",
        "createDate": "2024-01-01T10:00:00.000Z",
        "updateDate": "2024-01-01T10:00:00.000Z"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 10
  }
}
```

### 4. 导出预约记录

**Endpoint**：`GET /api/biz/appointment/export`

**认证**：管理端 JWT + `@Perm("Appointment")` 权限码

**Query 参数**：同 list 接口

**响应**：Excel 文件下载（`.xlsx`），文件名形如 `预约记录_2024-01-01.xlsx`

### 5. 公开统计接口

以下四个挂在 `public-appointment.controller.ts`，控制器类级 `@AllowAnonymous()`，**匿名可访问**。
只返回聚合数字，不返回手机号等明细。

#### 5.1 预约总数

**Endpoint**：`GET /api/public/appointment/stats`

```json
{ "code": 200, "msg": "获取预约统计成功", "data": { "total": 15680 } }
```

#### 5.2 按阶段统计

**Endpoint**：`GET /api/public/appointment/stats/stage`

按 `stage` 分组计数，count 倒序。

```json
{
  "code": 200,
  "msg": "获取阶段预约统计成功",
  "data": [{ "stage": "pre-register", "count": 8500 }]
}
```

#### 5.3 按渠道统计

**Endpoint**：`GET /api/public/appointment/stats/channel`

按 `channel` 分组计数，count 倒序。

```json
{
  "code": 200,
  "msg": "获取渠道预约统计成功",
  "data": [{ "channel": "official", "count": 12000 }]
}
```

#### 5.4 条件明细统计

**Endpoint**：`GET /api/public/appointment/stats/detail`

| 参数 | 类型 | 必填 | 说明 |
|-----------|------|----------|-------------|
| stage | string | 否 | 阶段筛选 |
| channel | string | 否 | 渠道筛选 |

两个筛选都不传就是全表计数。

```json
{
  "code": 200,
  "msg": "获取详细预约统计成功",
  "data": { "total": 8500, "stage": "pre-register", "channel": "official" }
}
```

响应会把收到的筛选条件原样回显；没传的那个是 `undefined`，序列化时整个键会被丢掉，不会出现 `null`。

## 数据库表结构

```sql
CREATE TABLE IF NOT EXISTS `op_biz_appointment` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '预约记录ID',
  `phone` varchar(20) NOT NULL COMMENT '手机号',
  `uid` varchar(100) NULL COMMENT '用户UID',
  `stage` varchar(100) NOT NULL COMMENT '阶段',
  `channel` varchar(100) NOT NULL COMMENT '渠道',
  `appointment_time` timestamp NOT NULL COMMENT '预约时间',
  `extra_field_1` varchar(500) NULL COMMENT '额外字段1',
  `create_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_phone` (`phone`),
  KEY `idx_uid` (`uid`),
  KEY `idx_appointment_time` (`appointment_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预约表';
```

## 注意事项

1. create / status 走客户端用户 JWT，list / export 走管理端 JWT 且必须有 `Appointment` 权限码
2. `create` 的 uid 优先取守卫解析出来的 `clientUser.userId`，请求体里的 uid 只是兜底
3. 预约记录不支持删除
4. 导出按当前查询条件生成 Excel
5. 公开统计接口只吐聚合数，别往里加会带出手机号的字段

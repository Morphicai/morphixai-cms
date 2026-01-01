# 外部任务审核系统 API 文档

## 概述

外部任务审核系统允许合伙人提交需要人工审核的任务（如社交媒体分享、内容创作等），审核通过后自动发放积分。

## 技术实现

- **文件上传**: 使用统一的存储服务（StorageConfigService），支持多种存储提供商（阿里云OSS、MinIO等）
- **重试机制**: 文件上传使用 RetryHandler 实现自动重试（最多3次，指数退避）
- **认证方式**: C端使用 GameWemadeAuthGuard，管理后台使用 JwtAuthGuard + RolesGuard
- **积分发放**: 审核通过后自动调用积分引擎发放积分
- **次数限制**: 每个任务类型可配置最大完成次数（审核中+审核通过的总数）
- **修改功能**: 用户可以修改被拒绝的提交，修改后重新进入审核流程

## Node.js 调用文件上传接口

如果从 Node.js 后端调用文件上传接口，推荐使用以下方式：

```javascript
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

// 方式1: 使用文件路径
const form = new FormData();
form.append('file', fs.createReadStream('/path/to/image.jpg'));

// 方式2: 使用 Buffer
const fileBuffer = fs.readFileSync('/path/to/image.jpg');
const form2 = new FormData();
form2.append('file', fileBuffer, {
  filename: 'image.jpg',
  contentType: 'image/jpeg'
});

// 发送请求
const response = await axios.post('https://api.example.com/api/external-task/upload-proof', form, {
  headers: {
    ...form.getHeaders(),
    'Authorization': 'Bearer <wemade_token>'
  }
});
```

## 接口路径规范

- **C端接口**: `/api/external-task/*` - 使用 GameWemadeAuthGuard 认证
- **管理后台接口**: `/admin/external-task/*` - 使用 JwtAuthGuard + RolesGuard 认证

## C端接口

所有C端接口使用 **GameWemadeAuthGuard** 认证（游戏SDK认证），与合伙人计划接口保持一致。

### 1. 上传任务凭证图片

**接口地址**: `POST /api/external-task/upload-proof`

**认证方式**: GameWemadeAuthGuard

**请求头**:
```
Authorization: Bearer <wemade_token>
Content-Type: multipart/form-data
```

**请求体**:
```
file: <binary> (图片文件)
```

**支持格式**: jpg、png、gif、webp

**文件大小限制**: 最大 10MB

**响应示例**:
```json
{
  "code": 200,
  "message": "上传成功",
  "data": {
    "url": "https://cdn.example.com/external-task/proof/1733472000001234.jpg",
    "filename": "proof_image.jpg",
    "size": 102400
  }
}
```

### 2. 获取任务列表（带完成状态）

**接口地址**: `GET /api/external-task/task-list`

**认证方式**: GameWemadeAuthGuard

**请求头**:
```
Authorization: Bearer <wemade_token>
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "taskType": "DOUYIN_SHORT_VIDEO",
      "category": "外部专项激励",
      "source": "抖音短视频",
      "name": "抖音短视频",
      "description": "通过任意链接发表视频",
      "pointsReward": 2000,
      "maxCompletionCount": 10,
      "completedCount": 3,
      "pendingCount": 1,
      "approvedCount": 2,
      "isCompleted": false,
      "canSubmit": true,
      "buttonText": "点击跳转",
      "actionUrl": "https://www.douyin.com",
      "requireLink": true,
      "requireImages": true,
      "minImages": 1,
      "maxImages": 5
    },
    {
      "taskType": "MANYI_DRIVER_VERIFY",
      "category": "外部专项激励",
      "source": "满溢司机身份认证",
      "name": "满溢司机身份认证",
      "description": "用户上传满溢司机身份认证并通过平台核验",
      "pointsReward": 500000,
      "maxCompletionCount": 1,
      "completedCount": 1,
      "pendingCount": 0,
      "approvedCount": 1,
      "isCompleted": true,
      "canSubmit": false,
      "buttonText": "点击认证",
      "requireLink": false,
      "requireImages": true,
      "minImages": 1,
      "maxImages": 5
    }
  ]
}
```

**字段说明**:
- `category`: 任务分类（用于前端分组展示）
- `source`: 任务来源/行为
- `completedCount`: 已完成次数（审核中+审核通过）
- `pendingCount`: 审核中的数量
- `approvedCount`: 审核通过的数量
- `isCompleted`: 是否已完成（达到最大次数限制）
- `canSubmit`: 是否可以提交（未达到限制）
- `buttonText`: 按钮文本（前端展示用）
- `actionUrl`: 跳转链接（可选，用于外部跳转）

**使用场景**:
- 前端展示任务列表页面
- 显示每个任务的完成进度
- 根据 `canSubmit` 判断是否允许提交
- 根据 `actionUrl` 决定是否显示跳转按钮

### 3. 获取可用的任务类型列表

**接口地址**: `GET /api/external-task/types`

**认证方式**: GameWemadeAuthGuard

**请求头**:
```
Authorization: Bearer <wemade_token>
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "taskType": "SOCIAL_SHARE",
      "name": "社交媒体分享",
      "description": "在社交媒体（Twitter、Facebook等）分享游戏内容",
      "pointsReward": 50,
      "requireLink": true,
      "requireImages": true,
      "minImages": 1,
      "maxImages": 5
    },
    {
      "taskType": "CONTENT_CREATION",
      "name": "内容创作",
      "description": "创作游戏相关视频或文章",
      "pointsReward": 200,
      "requireLink": true,
      "requireImages": false
    }
  ]
}
```

### 3. 提交外部任务

**接口地址**: `POST /api/external-task/submit`

**认证方式**: GameWemadeAuthGuard

**请求头**:
```
Authorization: Bearer <wemade_token>
Content-Type: application/json
```

**请求体**:
```json
{
  "taskType": "SOCIAL_SHARE",
  "taskLink": "https://twitter.com/user/status/123456",
  "proofImages": [
    "https://cdn.example.com/image1.jpg",
    "https://cdn.example.com/image2.jpg"
  ],
  "remark": "分享到Twitter，获得了100个点赞"
}
```

**字段说明**:
- `taskType`: 任务类型（必填）
- `taskLink`: 任务链接（根据任务类型要求）
- `proofImages`: 证明图片数组（根据任务类型要求）
- `remark`: 备注说明（选填，最多1000字符）

**响应示例**:
```json
{
  "success": true,
  "message": "提交成功，请等待审核",
  "data": {
    "submissionCode": "ES1733472000001234",
    "taskType": "SOCIAL_SHARE",
    "status": "PENDING",
    "createdAt": "2025-12-07T10:00:00.000Z"
  }
}
```

### 4. 提交外部任务

**接口地址**: `POST /api/external-task/submit`

（保持原有接口不变）

### 5. 修改被拒绝的提交

**接口地址**: `PUT /api/external-task/submissions/:id`

**认证方式**: GameWemadeAuthGuard

**请求头**:
```
Authorization: Bearer <wemade_token>
Content-Type: application/json
```

**路径参数**:
- `id`: 提交记录ID

**请求体**:
```json
{
  "taskLink": "https://twitter.com/user/status/new123456",
  "proofImages": [
    "https://cdn.example.com/new_image1.jpg",
    "https://cdn.example.com/new_image2.jpg"
  ],
  "remark": "已重新上传清晰的截图"
}
```

**字段说明**:
- `taskLink`: 任务链接（选填，如需修改）
- `proofImages`: 证明图片数组（选填，如需修改）
- `remark`: 备注说明（选填，最多1000字符）

**响应示例**:
```json
{
  "code": 200,
  "message": "修改成功，已重新提交审核",
  "data": {
    "submissionCode": "ES1733472000001234",
    "status": "PENDING"
  }
}
```

**注意事项**:
- 只能修改状态为 `REJECTED`（被拒绝）的提交
- 修改后状态会重置为 `PENDING`（待审核）
- 审核信息会被清空，重新进入审核流程

### 6. 查询我的提交记录

**接口地址**: `GET /api/external-task/my-submissions`

**认证方式**: GameWemadeAuthGuard

**请求头**:
```
Authorization: Bearer <wemade_token>
```

**查询参数**:
- `page`: 页码（默认1）
- `pageSize`: 每页数量（默认20，最大100）
- `status`: 状态筛选（可选：PENDING、APPROVED、REJECTED）
- `taskType`: 任务类型筛选（可选）

**请求示例**:
```
GET /api/external-task/my-submissions?page=1&pageSize=20&status=PENDING
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "1",
        "submissionCode": "ES1733472000001234",
        "taskType": "SOCIAL_SHARE",
        "taskLink": "https://twitter.com/user/status/123456",
        "proofImages": [
          "https://cdn.example.com/image1.jpg"
        ],
        "remark": "分享到Twitter",
        "status": "PENDING",
        "reviewRemark": null,
        "pointsAwarded": null,
        "createdAt": "2025-12-07T10:00:00.000Z",
        "reviewTime": null
      }
    ],
    "total": 10,
    "page": 1,
    "pageSize": 20
  }
}
```

**字段说明**:
- `reviewRemark`: 审核留言（审核通过或拒绝时管理员填写的备注）
- `status`: 提交状态（PENDING-待审核、APPROVED-审核通过、REJECTED-审核拒绝）
- `pointsAwarded`: 获得的积分（审核通过后才有值）
- `reviewTime`: 审核时间

## 管理后台接口

所有管理后台接口使用 **JwtAuthGuard + RolesGuard** 认证，需要管理员权限（admin 或 super_admin 角色）。

### 1. 查询提交记录列表

**接口地址**: `GET /admin/external-task/submissions`

**认证方式**: JwtAuthGuard + RolesGuard (admin/super_admin)

**请求头**:
```
Authorization: Bearer <admin_jwt_token>
```

**查询参数**:
- `page`: 页码（默认1）
- `pageSize`: 每页数量（默认20，最大100）
- `status`: 状态筛选（可选：PENDING、APPROVED、REJECTED）
- `taskType`: 任务类型筛选（可选）
- `partnerId`: 合伙人ID筛选（可选）
- `startDate`: 开始日期（可选，ISO格式）
- `endDate`: 结束日期（可选，ISO格式）

**请求示例**:
```
GET /admin/external-task/submissions?page=1&pageSize=20&status=PENDING
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "1",
        "submissionCode": "ES1733472000001234",
        "taskType": "SOCIAL_SHARE",
        "partnerId": "123",
        "uid": "user123",
        "taskLink": "https://twitter.com/user/status/123456",
        "proofImages": [
          "https://cdn.example.com/image1.jpg"
        ],
        "remark": "分享到Twitter",
        "status": "PENDING",
        "reviewerId": null,
        "reviewTime": null,
        "reviewRemark": null,
        "pointsAwarded": null,
        "createdAt": "2025-12-07T10:00:00.000Z"
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 20
  }
}
```

### 2. 获取提交详情（含合伙人信息）

**接口地址**: `GET /admin/external-task/submissions/:id`

**认证方式**: JwtAuthGuard + RolesGuard (admin/super_admin)

**请求头**:
```
Authorization: Bearer <admin_jwt_token>
```

**路径参数**:
- `id`: 提交记录ID

**响应示例**:
```json
{
  "success": true,
  "data": {
    "submission": {
      "id": "1",
      "submissionCode": "ES1733472000001234",
      "taskType": "DOUYIN_SHORT_VIDEO",
      "partnerId": "123",
      "uid": "user123",
      "taskLink": "https://www.douyin.com/video/xxx",
      "proofImages": [
        "https://cdn.example.com/image1.jpg",
        "https://cdn.example.com/image2.jpg"
      ],
      "remark": "已完成视频发布，获得1000+点赞",
      "status": "PENDING",
      "reviewerId": null,
      "reviewTime": null,
      "reviewRemark": null,
      "pointsAwarded": null,
      "taskLogId": null,
      "createdAt": "2025-12-07T10:00:00.000Z",
      "updatedAt": "2025-12-07T10:00:00.000Z"
    },
    "partner": {
      "partnerId": "123",
      "uid": "user123",
      "teamName": "测试团队",
      "level": 1,
      "totalPoints": 50000,
      "availablePoints": 30000,
      "totalInvites": 10,
      "directInvites": 5,
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  }
}
```

**字段说明**:
- `submission`: 提交记录详情
- `partner`: 合伙人信息（包含团队名称、等级、积分、邀请人数等）

**使用场景**:
- 管理后台审核详情页面
- 查看提交者的合伙人信息
- 辅助审核决策

### 3. 审核通过

**接口地址**: `POST /admin/external-task/submissions/:id/approve`

**认证方式**: JwtAuthGuard + RolesGuard (admin/super_admin)

**请求头**:
```
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

**请求体**:
```json
{
  "reviewRemark": "审核通过，内容质量很好"
}
```

**字段说明**:
- `reviewRemark`: 审核备注（选填，最多500字符）

**响应示例**:
```json
{
  "success": true,
  "message": "审核通过",
  "data": {
    "submissionCode": "ES1733472000001234",
    "status": "APPROVED",
    "pointsAwarded": 50
  }
}
```

### 4. 审核拒绝

**接口地址**: `POST /admin/external-task/submissions/:id/reject`

**认证方式**: JwtAuthGuard + RolesGuard (admin/super_admin)

**请求头**:
```
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

**请求体**:
```json
{
  "reviewRemark": "图片不清晰，无法验证"
}
```

**字段说明**:
- `reviewRemark`: 拒绝原因（必填，最多500字符）

**响应示例**:
```json
{
  "success": true,
  "message": "审核拒绝",
  "data": {
    "submissionCode": "ES1733472000001234",
    "status": "REJECTED"
  }
}
```

### 5. 获取审核统计

**接口地址**: `GET /admin/external-task/statistics`

**认证方式**: JwtAuthGuard + RolesGuard (admin/super_admin)

**请求头**:
```
Authorization: Bearer <admin_jwt_token>
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "pendingCount": 25,
    "approvedCount": 150,
    "rejectedCount": 10,
    "todayReviewCount": 30
  }
}
```

## 状态说明

- `PENDING`: 待审核
- `APPROVED`: 审核通过
- `REJECTED`: 审核拒绝

## 任务类型说明

### 原有任务类型
- `SOCIAL_SHARE`: 社交媒体分享（需要链接和图片，无次数限制）
- `CONTENT_CREATION`: 内容创作（需要链接，无次数限制）
- `COMMUNITY_ACTIVITY`: 社区活动参与（需要图片，无次数限制）
- `FEEDBACK_SUBMIT`: 反馈提交（无特殊要求，无次数限制）

### 新增任务类型
- `DOUYIN_SHORT_VIDEO`: 抖音短视频（2,000积分，最多10次）
- `DOUYIN_LIVE_30MIN`: 抖音直播30分钟（150,000积分，只能完成1次）
- `DOUYIN_LIVE_50MIN`: 抖音直播50分钟（300,000积分，只能完成1次）
- `DOUYIN_LIVE_100MIN`: 抖音直播100分钟（500,000积分，只能完成1次）
- `MANYI_DRIVER_VERIFY`: 满溢司机身份认证（500,000积分，只能完成1次）
- `KUAIDI_COURIER_VERIFY`: 快递小哥身份认证（500,000积分，只能完成1次）

### 次数限制说明
- `maxCompletionCount = 0`: 无限制，可以无限次提交
- `maxCompletionCount > 0`: 有限制，最多完成指定次数
- 次数统计包含：审核中（PENDING）+ 审核通过（APPROVED）的提交
- 被拒绝（REJECTED）的提交不计入次数，可以修改后重新提交

## 错误码

- `400`: 请求参数错误
- `401`: 未登录或token无效
- `403`: 无权限访问
- `404`: 资源不存在
- `500`: 服务器内部错误

## 认证说明

### C端接口认证
- **认证方式**: GameWemadeAuthGuard（游戏SDK认证）
- **Token获取**: 通过游戏SDK登录后获取 wemade_token
- **用户要求**: 必须已加入合伙人计划（有 partnerId）
- **与其他接口一致**: 与合伙人计划、积分系统接口使用相同的认证方式

### 管理后台接口认证
- **认证方式**: JwtAuthGuard + RolesGuard
- **Token获取**: 通过管理后台登录接口获取 JWT token
- **权限要求**: 需要 `admin` 或 `super_admin` 角色

## 注意事项

1. **认证要求**: C端接口使用游戏SDK认证，需要用户已加入合伙人计划
2. **权限要求**: 管理后台接口需要管理员权限（admin 或 super_admin）
3. **审核规则**: 
   - 提交记录一旦审核完成（通过或拒绝）不能再次审核
   - 被拒绝的提交可以修改后重新提交
   - 管理员审核时的留言会返回给用户
4. **次数限制**:
   - 每个任务类型有最大完成次数限制
   - 次数统计包含审核中和审核通过的提交
   - 被拒绝的提交不计入次数
   - 超过限制后无法再次提交该类型任务
5. **积分发放**: 审核通过后会自动发放积分到合伙人账户
6. **文件上传**:
   - 图片URL需要先通过上传接口获取
   - 支持格式：jpg、png、gif、webp
   - 单个文件最大10MB
   - Node.js 调用建议使用 FormData + Buffer
7. **数据验证**: 任务链接需要是有效的URL格式

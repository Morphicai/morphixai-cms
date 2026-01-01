# 客户端 API 调用案例

本页面展示了 optimus-next 客户端可以调用的所有 API 接口，包括公开接口和需要 ClientUserGuard 认证的接口。

## API 分类

### 1. 公开接口 (无需认证)
- 用户注册/登录
- 公开文章列表/搜索/详情
- 产品列表/参数查询
- 文件服务健康检查

### 2. ClientUserGuard 认证接口
需要客户端用户登录后获得 `clientUserToken`：
- 用户资料管理
- 外部账号绑定
- 合伙人相关功能
- 积分系统
- 外部任务管理

### 3. 特殊认证接口
- 订单相关：需要 `uid` 和 `authToken` 头部认证
- 文件管理：需要 `jwtToken` (管理后台认证)

## 使用方法

1. 访问 `/api-examples` 页面
2. 对于需要认证的接口，先进行用户登录
3. 点击相应按钮测试各个 API 接口
4. 查看返回的 JSON 响应数据

## 代码示例

```typescript
// 公开接口调用
const articles = await articleService.getPublicArticles({
  page: 1,
  pageSize: 10
});

// 需要认证的接口调用
const profile = await clientUserService.getProfile();
const partnerInfo = await partnerService.getProfile();
```

## 注意事项

- 所有 API 调用都通过 Service 层进行，遵循开发规范
- 认证 token 自动存储在 localStorage 中
- 错误处理统一在 Service 层处理
- 响应数据格式统一为 `{ code, message, data, timestamp }`
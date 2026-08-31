# @optimus/server-sdk

服务端接入 Optimus 平台的薄封装。能力本体仍然是 HTTP API，SDK 只负责统一请求、
缓存和 service token 的标准签发方式。

## 用户身份自省

```ts
const sdk = new OptimusServerSdk({
  baseUrl: process.env.OPTIMUS_API_URL!,
});

const identity = await sdk.introspect(userToken, "client");
const canManage = await sdk.hasPerm(adminToken, "ActivityAdmin");
```

## 服务身份

服务在启动时使用环境变量中的共享密钥本地签发短期令牌，再通过平台的
`/auth/introspect` 验证身份。密钥不要写进代码、数据库或日志：

```ts
const sdk = new OptimusServerSdk({
  baseUrl: process.env.OPTIMUS_API_URL!,
  serviceTokenSecret: process.env.SERVICE_TOKEN_SECRET!,
  serviceTokenExpiresIn: "5m",
});

const token = sdk.getServiceToken("partner-service");
const identity = await sdk.verifyServiceToken(token);
if (!identity.active) throw new Error("service token 无效或服务已下线");
```

`serviceKey` 必须是服务目录中登记的 key。平台自省还会检查该服务当前是否
`enabled`；服务下线后，尚未过期的旧 token 也会失效。`getServiceToken()` 返回
不带 `Bearer ` 前缀的 token，放入请求头时再拼接：

```text
Authorization: Bearer <token>
```

服务身份与 admin/client 用户身份是三种并列身份。service token 只表示“哪个服务
在调用”，不携带用户权限，也不替代用户 token 的委托调用。

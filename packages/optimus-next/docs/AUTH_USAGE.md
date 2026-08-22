# 认证使用说明（optimus-next C 端）

## 一句话模型

**token 全程住在 httpOnly cookie 里，前端任何代码都不碰 token。**
登录、续期、登出时由后台（client-user 模块）签发和清除 cookie，
Next.js 的 `/api` 代理负责把 Set-Cookie 转发到浏览器。前端只关心"用户是谁"，
不关心"凭证是什么"。

```
浏览器 ──同源 /api/* ──> Next 代理(route.ts) ──> optimus-api /client-user/*
        cookie 自动带       透传 cookie             login/refresh/logout
                            转发 Set-Cookie          写/清 httpOnly cookie
```

## 组件里怎么用

唯一入口是 `components/auth/AuthProvider` 的 `useAuth()`（已挂在根 layout 上）：

```tsx
import { useAuth } from '@/components/auth/AuthProvider';

function MyComponent() {
  const { user, isAuthenticated, login, register, logout, openLogin } = useAuth();

  if (!isAuthenticated) {
    return <button onClick={openLogin}>登录</button>; // 弹出登录 Modal
  }
  return <span>你好，{user?.nickname || user?.username}</span>;
}
```

- `login(username, password)`：密码经 `encryptPasswordFields`（@optimus/common，
  与后台共享的 AES 实现）加密后提交；成功后响应体里的用户信息直接进状态
- `register(...)`：注册接口不发 token（后台如此设计），Provider 内部注册成功后
  自动串一次 login，用户无需二次输入
- `logout()`：调后台 `/client-user/logout` 清 cookie，再清本地缓存，跳 `/auth`
- `user` 的来源：登录响应 + `/client-user/me` 校验；localStorage 里的
  `clientUserInfo` 只是首屏乐观缓存，**不含 token，也不是登录态依据**

## 发认证请求

什么都不用做。所有经 `optimusSDK.http`（或 `lib/api.ts`）发出的请求都走同源
`/api` 代理，cookie 自动携带，后台守卫自己从 cookie 读 token。

401 时 SDK 会凭 refresh cookie 自动调一次 `/client-user/refresh` 并重放原请求；
refresh 也失败说明真没登录，请求按失败返回，页面自行决定跳 `/auth`。

## 登录页路径

只有一个：`/auth`。历史上代码里出现过 `/login`、`/auth/login`，都不存在，
已全部清理——新代码跳登录一律 `/auth`。

## 后台侧约定（client-user 模块）

- 双 JWT 与管理员体系完全隔离：`CLIENT_USER_JWT_SECRET`（access 2h）+
  refresh 7d，cookie 名 `clientAccessToken` / `clientRefreshToken`
- `/client-user/refresh` 从 cookie 读 refreshToken，POST 空 body 即可
- 密码字段服务端自动尝试解密，解密失败按明文处理（兼容 curl 手工调试）

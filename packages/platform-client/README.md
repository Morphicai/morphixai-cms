# @optimus/platform-client

调 Optimus 平台能力（OSS 上传 / 短链 / 环境信息）的服务端客户端。零第三方依赖，Node 18+。

在这之前，每个子服务都自己读一遍 optimus-api 的 controller 源码、写一份 fetch 封装。
本包把契约收在一处：路径、请求体格式、响应解包、字段名不一致，都不需要消费方再操心。

```bash
pnpm add @optimus/platform-client
```

```ts
import { PlatformClient, extractClientToken } from "@optimus/platform-client";

const platform = new PlatformClient({ baseUrl: process.env.OPTIMUS_API_URL! }); // 如 http://optimus-api:8084/api

// 上传（以发起者用户的身份）
const token = extractClientToken(req)!;
const { url } = await platform.uploadFile(
    { buffer: file.buffer, mimetype: file.mimetype, originalname: file.originalname },
    { token, business: "external-task-proof" },
);

// 短链
const link = await platform.createShortLink({ token, target: { activity: "a1" }, remark: "推广渠道" });

// 环境信息（匿名，结果按 TTL 缓存）
const { rootDomain } = await platform.getEnvironment();
```

## 三件容易踩的事

**1. 短链返回的是站点根相对路径，不是绝对 URL。**
`createShortLink()` 给的 `url` 形如 `/public/short-link/resolve/<token>`。本包不替你拼域名——
该用哪个域名取决于分发渠道（站内 / 短信 / 二维码），拼错域名的短链比没有短链更糟。
需要绝对地址时用 `getEnvironment().rootDomain` 自己拼。

**2. `needThumbnail` 只在需要缩略图时传 `true`，不要传 `false`。**
本包已经处理好了（false 时不发这个字段），写在这里是为了让你别绕过 SDK 手写：
平台 DTO 上是 `@Type(() => Boolean)`，而 multipart 的值一律是字符串，
`Boolean("false") === true`——手写时传 `false` 会被反向解读成"要缩略图"。

**3. 错误分两类，重试策略不同。**
- `PlatformApiError`：平台**返回了**响应但业务失败（带 `endpoint` / `status` / `code`）。重试通常没用
- 其他错误（`TypeError: fetch failed`、`TimeoutError`）：没能问到平台。原样抛出，可能值得重试

## 为什么不依赖 @optimus/server-sdk

本包封装的三个能力，两个要求 `@ClientUserAuth()`（也就是发起请求那个**用户**的
clientAccessToken），一个匿名，**没有一个吃 service token**。加个依赖只为了"看起来分层正确"，
会引入一个当前用不上的运行时依赖。

等出现按 grant 授权的服务身份接口（如按 uid 查用户资料）时再加，且首选由消费方
把 `server-sdk` 签好的 token 传进来，而不是本包反向依赖它。

身份自省（`introspect` / `getServiceToken` / `verifyServiceToken` / `hasGrant`）在
`@optimus/server-sdk`，两个包职责分开：那个管"你是谁"，这个管"帮我做件事"。

## 强制约束

裸写 fetch 直接调这些平台接口会被 CI 拦下（`pnpm check:sdk-usage`）。
规则只对新增/修改的代码生效，存量违规不追溯。

## 开发

```bash
pnpm build   # tsc
pnpm test    # 先编译，再用 node 原生 test runner 跑 dist
```

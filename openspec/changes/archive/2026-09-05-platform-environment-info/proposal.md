## Why

每个环境（dev/test/staging/prod）的根域名、cookie 域这类基础信息，现状是各服务
各自从自己的 `.env` 读一份（目前只有 optimus-api 读了 `SITE_DOMAIN`/`COOKIE_DOMAIN`，
分别用于生成文件绝对 URL 和跨子域 cookie，见 `oss.controller.ts`、
`client-user.controller.ts`）。新服务如果也需要"当前环境的根域名是什么"（拼绝对链接、
判断跨域策略、构造回调地址），只能重新猜一遍环境变量名字或直接硬编码——这和此前
OSS/短链"每个新服务各自摸索一遍"是同一个模式，值得在它扩散之前先补上统一来源。

## What Changes

- optimus-api 新增一个环境信息只读接口，返回当前环境的名称（dev/test/staging/prod）、
  根域名、cookie 域等基础信息
- 这些值继续从 optimus-api 自己的环境变量/配置读取（不改变现有 `SITE_DOMAIN`/
  `COOKIE_DOMAIN` 的配置方式），只是新增一个"对外可查"的出口，而不是让每个服务
  各自重新读一遍环境变量
- 为后续 `platform-client-sdk` 提供一个可以直接封装的查询点

## Capabilities

### New Capabilities

- `environment-info-query`：当前部署环境基础信息的只读查询能力

### Modified Capabilities

（无）

## Impact

- `optimus-api`：新增一个只读接口（`system/environment` 或类似路径），读取现有的
  `SITE_DOMAIN`/`COOKIE_DOMAIN` 等配置项并组装返回
- 其它子服务：无需改动即可通过 HTTP 调用这个接口；后续经 `platform-client-sdk`
  封装后两行 import 可用

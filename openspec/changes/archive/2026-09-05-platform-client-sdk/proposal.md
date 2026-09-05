## Why

`@optimus/server-sdk` 已经写好 introspect 封装、也被 agent-service 验证过，但
partner-service 接入时完全没用，自己重写了一份裸 `fetch` 调 `/auth/introspect`；
OSS 上传/短链的跨服务调用（`optimus-api-client.ts`）也只是 partner-service 的私有
文件，不是可复用的包。这是"有能力没约束"——文档写了要复用不够，下一个新服务大概率
还会重复发明一次轮子。中台分层架构（见 `openspec/changes` 之外已发布的架构文档）
已经把"业务团队只能通过官方 SDK 访问平台能力"定为强约束，这个变更是把约束真正
落地成可执行的东西：一是把 SDK 补全、做顺手，二是把"必须用 SDK"从文档倡议变成
代码评审/CI 能拦下来的硬规则。

## What Changes

- 新增 `@optimus/platform-client` workspace 包，封装 OSS 上传、短链生成、
  环境信息查询（依赖 `platform-environment-info` 已上线）三类平台能力，
  两行 import 即可调用，不需要业务团队自己读 controller 源码摸索契约
- `@optimus/server-sdk` 补充对 service token 的支持（依赖 `platform-service-token`
  已上线），使其能同时代表"用户委托调用"和"服务身份调用"两种模式
- 新增一条 CI/lint 规则：静态扫描代码库中裸写 `fetch(...)` 直接拼平台接口 URL
  （如 `/auth/introspect`、`/files/client-upload`、`/system/short-link/*`）的模式，
  命中即报错阻止合并
- 服务接入检查清单新增硬性项："是否只通过官方 SDK 访问平台能力"，作为新服务
  上线验收的必过项

**BREAKING**：无。现有 partner-service 的私有 `optimus-api-client.ts` 和裸写的
introspect 调用不强制立刻迁移，作为后续技术债处理，但新服务从上线第一天起
必须使用新 SDK（这是 `extract-marketing-service`/`extract-order-service` 的前置条件）。

## Capabilities

### New Capabilities

- `platform-client-sdk`：OSS/短链/环境信息的统一客户端封装
- `sdk-usage-enforcement`：强制业务服务通过官方 SDK 访问平台能力的 CI 检查规则

### Modified Capabilities

（无）

## Impact

- 新增 workspace 包 `packages/platform-client`（或类似路径，与 `server-sdk`/
  `client-sdk` 并列）
- CI 配置：新增静态扫描步骤
- 文档：接入检查清单更新
- 不改变任何现有运行中服务的行为（partner-service 现有实现暂不强制迁移）

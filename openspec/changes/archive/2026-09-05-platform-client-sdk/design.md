## Context

平台能力的跨服务调用现状是"每个子服务读一遍 controller 源码，自己写一份 fetch
封装"——partner-service 的 `optimus-api-client.ts` 是这个模式的第一个、也是唯一的
实例，且它是私有文件，不是包。同一次迁移里，`introspect` 这种已经有官方 SDK
封装的能力也被重新手写了一遍。这个变更要同时解决"没有现成的包"和"有包也不一定
被用"两个问题。

## Goals / Non-Goals

**Goals:**
- 提供一个足够好用的 `@optimus/platform-client`，让"调用平台能力"这件事的默认
  路径就是"装包、两行 import"
- 让"必须用 SDK"从文档约定变成会在 CI/评审阶段被真正拦下来的硬规则
- `@optimus/server-sdk` 能同时支持用户 token 委托模式（现状）和 service token
  模式（新增），消费方按场景选择，不需要两套不同的客户端

**Non-Goals:**
- 不重写现有 `@optimus/client-sdk`（C 端浏览器抽包），本次只动服务端到服务端的调用
- 不强制迁移 partner-service 现有的私有实现——旧代码保留，只对新代码/新服务生效
- 不做"平台能力的自动发现/动态生成客户端"这类更复杂的方案（如 OpenAPI codegen），
  先用手写封装覆盖已知的三类能力，规模变大后再评估要不要上生成式方案

## Decisions

**新建独立包而不是塞进 `@optimus/server-sdk`**：`server-sdk` 目前的核心职责是
"身份自省"，语义上和"OSS/短链/环境信息"这类具体平台能力不是一回事，混在一起会
让 `server-sdk` 的职责变得模糊。拆成两个包，`platform-client` 依赖 `server-sdk`
获取 token（无论是用户委托 token 还是 service token），职责边界清晰。

**CI 静态扫描用简单的字符串/正则匹配，不做 AST 级别分析**：扫描目标是"裸写
`fetch` 加平台接口路径特征"这种明确的反模式，正则/grep 级别的检查足够识别现有
和可预见的违规写法，AST 分析的精确度收益对这个场景不成比例，属于过度设计。

**检查清单是"新服务上线必过项"，不是追溯性地强制修改存量代码**：
partner-service 现有的裸调用保留，标记为已知技术债，不在本次变更范围内强制
迁移——把"清理存量违规"和"堵住新增违规"分开处理，避免这个变更的范围无限扩大到
要重新审查一遍已经上线的服务。

## Risks / Trade-offs

**[风险] 正则规则可能有绕过空间（比如把 URL 拼接拆成多个字符串变量）**
→ 缓解：这条规则的目的是提高"顺手裸写"的门槛，不是做到滴水不漏的安全边界；
真正想绕过检查的人总能绕过 lint，规则的价值在于让"正确的做法"比"图省事裸写"更
省事，而不是杜绝一切可能性

**[风险] `platform-client` 覆盖的三类能力（OSS/短链/环境信息）之外，未来还会
出现新的平台能力，每次都要回来加 SDK 方法**
→ 缓解：这本身是设计意图，不是缺陷——每个新平台能力上线时都应该同步补 SDK
封装，而不是让业务团队直接摸源码；`platform-client` 是一个持续增长的包，
不是一次性交付

## Migration Plan

1. 先发布 `@optimus/platform-client` 的 OSS/短链封装（不依赖 service token）
2. `platform-environment-info` 上线后补充环境信息查询方法
3. `platform-service-token` 上线后补充 `server-sdk` 的 service token 支持
4. 最后上 CI 检查规则，此时新包已经就绪，"必须用 SDK"才有真正可用的替代路径，
   不会出现"规则挡住了但没有合规写法可用"的情况
5. 回滚：CI 规则可以单独关闭而不影响已发布的 SDK 包本身

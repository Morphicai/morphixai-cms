## ADDED Requirements

### Requirement: 统一的 OSS 上传封装
`@optimus/platform-client` SHALL 提供一个上传文件的方法，内部处理鉴权 token 的
传递与 optimus-api 的 `/files/client-upload` 契约，调用方无需自行拼接 HTTP 请求。

#### Scenario: 上传文件
- **WHEN** 消费方调用 `platform-client` 的上传方法并传入文件内容与调用者的
  clientAccessToken
- **THEN** 方法内部完成向 optimus-api 的 HTTP 调用并返回文件访问 URL，调用方
  不需要知道具体的接口路径或请求头格式

### Requirement: 统一的短链生成封装
`@optimus/platform-client` SHALL 提供一个生成短链的方法，封装
`/system/short-link/client-shorten` 的调用契约。

#### Scenario: 生成短链
- **WHEN** 消费方调用 `platform-client` 的短链方法并传入目标参数与 remark
- **THEN** 方法返回短链 token 与**站点根相对路径**（形如
  `/public/short-link/resolve/<token>`），调用方无需自行拼接请求体格式

#### Scenario: 短链不被拼成绝对 URL
- **WHEN** 消费方需要一个可对外分发的绝对地址
- **THEN** SDK SHALL NOT 自行拼接域名——平台返回的就是相对路径，而该用哪个域名
  取决于分发渠道（站内/短信/二维码），只有消费方知道；消费方用环境信息里的
  `rootDomain` 自行拼接

### Requirement: 环境信息查询封装
`@optimus/platform-client` SHALL 提供一个查询当前环境信息的方法，封装
`platform-environment-info` 提供的接口。

#### Scenario: 查询环境信息
- **WHEN** 消费方调用 `platform-client` 的环境信息方法
- **THEN** 方法返回 `{environment, rootDomain, cookieDomain}`

### Requirement: server-sdk 支持服务身份调用
`@optimus/server-sdk` SHALL 新增对 service token 的签发与自省封装，与既有的
用户 token 委托模式并列。

#### Scenario: 使用服务身份调用平台能力
- **WHEN** 消费方需要以服务自身身份（而非某个用户的委托）调用平台能力
- **THEN** `server-sdk` 提供的方法能够签发/校验 service token，且与既有的
  admin/client token 处理逻辑互不干扰

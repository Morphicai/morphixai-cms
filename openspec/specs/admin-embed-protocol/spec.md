# admin-embed-protocol Specification

## Purpose
TBD - created by archiving change platform-base-sdk. Update Purpose after archive.
## Requirements
### Requirement: 基座 iframe 嵌入

管理端 SHALL 提供通用 IframeApp 组件：菜单节点声明 `iframeUrl` 即可把外部子应用
挂进后台，受与普通菜单一致的权限码控制。

#### Scenario: 菜单接入
- **WHEN** routes.js 登记一个带 iframeUrl 的菜单节点且用户持有其权限码
- **THEN** 菜单出现该入口，点击后 iframe 加载子应用

#### Scenario: 无权限不可见
- **WHEN** 用户角色未被授予该权限码
- **THEN** 菜单不出现该入口

### Requirement: 握手协议

基座与子应用 SHALL 按 ready → handshake 时序握手，token/user/perms/locale/theme
经 postMessage 定向下发；双方 SHALL 校验对方 origin，不匹配的消息丢弃。

#### Scenario: 正常握手
- **WHEN** 子应用加载完成并发送 optimus:ready
- **THEN** 基座向该 iframe 的登记 origin 定向回发 handshake，含 token 与用户/权限

#### Scenario: origin 不匹配
- **WHEN** 收到来源 origin 与登记不符的消息
- **THEN** 消息被丢弃，不下发任何数据

#### Scenario: token 刷新代理
- **WHEN** 子应用发送 optimus:refresh-token
- **THEN** 基座刷新自己的 token 并把新 token 下发给子应用

### Requirement: 子应用侧 SDK

`@optimus/admin-embed` SHALL 提供 `init({ baseOrigin })`（带超时）、
`onTokenRefresh(cb)`、`requestToken()`。

#### Scenario: 非嵌入环境降级
- **WHEN** 子应用被直接打开（不在基座 iframe 内）
- **THEN** init 在超时后 reject，子应用可据此展示降级提示


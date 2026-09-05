# partner-service Specification

## Purpose
TBD - created by archiving change extract-partner-service. Update Purpose after archive.
## Requirements
### Requirement: 独立进程承载合伙人/积分/外部任务三域
partner-service SHALL 作为独立于 optimus-api 的 Nest 进程运行,承载合伙人档案与层级、渠道管理、积分账本(事件溯源)、外部任务提交与审核发放四类能力,通过服务目录接入平台,数据库连接可指向与 optimus-api 相同的 MySQL 实例。

#### Scenario: 独立启动
- **WHEN** 执行 partner-service 的 dev 启动命令
- **THEN** 服务在独立端口(8089)监听,不依赖 optimus-api 进程存活即可启动成功

#### Scenario: 与主服务共库不冲突
- **WHEN** partner-service 和 optimus-api 同时运行并各自对合伙人相关表发起读写
- **THEN** 两边的操作互不产生连接层面的异常,数据一致可见

### Requirement: 服务目录动态接入
partner-service SHALL 在服务目录(`op_sys_service_registry`)登记为 `entryType=embed` 的条目,管理端通过既有 `/embed/:serviceKey` 动态入口与 `EmbedFrame` 握手协议访问其管理页面,不需要平台侧新增代码。

#### Scenario: 登记后菜单自动出现
- **WHEN** 服务目录里新增一条 partner-service 的 embed 条目并刷新管理端页面
- **THEN** 管理端菜单出现对应入口,点击后通过 `/embed/:serviceKey` 加载 partner-service 的管理页

#### Scenario: 握手拿到身份
- **WHEN** partner-service 的管理页在 iframe 中发出 `optimus:ready`
- **THEN** 收到基座回传的 `optimus:handshake`,payload 含 token/user/perms,可用于后续调用 partner-service 自身接口

### Requirement: 管理端接口经 introspect 鉴权,fail-closed
partner-service 的 ADMIN 类接口 SHALL 通过调用主服务 `POST /auth/introspect`(`type=admin`)完成身份与权限解析,未声明权限语义(等价于主服务的 `@Perm`/`@AllowNoPerm`/`@RequireSuperAdmin` 三选一)的接口 SHALL 默认拒绝访问。

#### Scenario: 有效超管 token 放行任意声明接口
- **WHEN** 携带一个 introspect 返回 `user.type` 为超管的 token 调用任意已声明权限语义的接口
- **THEN** 请求放行,不受权限码限制

#### Scenario: 无权限码账号被拒绝
- **WHEN** 携带一个 introspect 返回的 `perms` 不含目标接口所需权限码的普通管理员 token
- **THEN** 请求返回 403

#### Scenario: 未声明权限语义的接口默认拒绝
- **WHEN** 调用一个既未标注权限码、也未标注匿名/自服务放行的接口
- **THEN** 请求返回 403,不因为"忘记声明"而意外放行

#### Scenario: token 失效或缺失
- **WHEN** 请求未带 token,或 introspect 返回 `active:false`
- **THEN** 请求返回 401

### Requirement: C 端接口经 introspect 鉴权
面向合伙人本人的接口(如查询自己的积分)SHALL 通过 `POST /auth/introspect`(`type=client`)校验身份,校验通过后按 token 对应的用户身份返回其自身数据,不需要额外权限码比对。

#### Scenario: 合伙人查询自己的积分
- **WHEN** 已登录 C 端用户携带有效 `clientAccessToken` 调用查询自己积分的接口
- **THEN** 返回该用户对应合伙人档案的积分信息

#### Scenario: 未登录访问被拒绝
- **WHEN** 请求不带 `clientAccessToken` 或该 token 未通过 introspect 校验
- **THEN** 请求返回 401

### Requirement: 积分账本保持事件溯源,移除孤儿写口
积分余额 SHALL 继续通过汇总任务完成事件(`TaskCompletionLogEntity`)计算得出,不引入或恢复绕过事件记录直接改写合伙人积分/星级字段的写接口。

#### Scenario: 外部任务审核通过后积分可查
- **WHEN** 一条外部任务提交被审核通过
- **THEN** 系统写入一条任务完成事件记录,且该合伙人后续查询到的积分余额包含此次奖励

#### Scenario: 不存在直接改积分余额的接口
- **WHEN** 检查 partner-service 对外暴露的全部接口
- **THEN** 不存在任何可以不经过任务完成事件、直接设置合伙人积分余额或星级字段的写接口

### Requirement: 任务完成事件表有正式建表迁移
`op_biz_task_completion_log` 表的结构 SHALL 由一份显式的建表迁移脚本定义,不依赖 ORM 的自动建表(synchronize)行为。

#### Scenario: 全新环境执行迁移脚本
- **WHEN** 在一个不存在该表的数据库上执行该建表迁移脚本
- **THEN** 表被正确创建,结构与 `TaskCompletionLogEntity` 定义一致

#### Scenario: 依赖该表的接口不再报错
- **WHEN** 迁移脚本执行完成后调用统计合伙人活跃度的接口,以及审核通过外部任务提交的接口
- **THEN** 两者均正常返回,不再出现因表不存在导致的 500

### Requirement: C 端主站的 API 请求正确路由到新服务
`optimus-next` 的 API 代理 SHALL 按服务目录里登记的 API 路径前缀,把落在这些前缀内的请求转发到 partner-service,而不是继续硬编码转发到 optimus-api;未命中任何登记前缀的请求 SHALL 维持转发到 optimus-api 的原有行为。

#### Scenario: 已登记前缀的请求分流到新服务
- **WHEN** 浏览器请求 `/api/biz/partner/profile` 或 `/api/biz/points/me`
- **THEN** 请求被转发到 partner-service 而不是 optimus-api,响应内容与迁移前一致

#### Scenario: 未登记前缀的请求不受影响
- **WHEN** 浏览器请求一个不属于任何已登记 `apiPathPrefixes` 的路径(如 `/api/client-user/profile`)
- **THEN** 请求仍按原有行为转发到 optimus-api

#### Scenario: 真实生产页面功能不回归
- **WHEN** 已登录且已是合伙人身份的用户打开 `/profile` 页面
- **THEN** "合伙人状态"卡片与"积分概览"卡片正常显示数据,不因迁移出现加载失败

### Requirement: 探测与观测接入既有约定
partner-service SHALL 暴露与其余已接入服务同形的健康检查与轻量指标端点,供服务目录的探测器按现有周期采集状态。

#### Scenario: 探测器识别服务健康
- **WHEN** 服务目录的探测器按登记的 `healthPath` 探测 partner-service
- **THEN** 探测结果在管理端服务状态面板显示为健康,延迟数值可见


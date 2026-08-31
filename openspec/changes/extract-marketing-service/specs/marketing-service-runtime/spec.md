## ADDED Requirements

### Requirement: 营销域独立服务承载三个业务模块
系统 SHALL 提供一个独立的 `marketing-service` 进程，承载 activity、appointment、
reward-claim-record 三个业务模块的全部对外接口，行为与迁移前在 optimus-api
单体内一致。

#### Scenario: C 端预约留资功能不回归
- **WHEN** C 端用户在迁移后提交预约留资请求
- **THEN** 请求经代理路由到 `marketing-service` 并成功处理，行为与迁移前一致

#### Scenario: 管理后台活动/奖励发放管理不回归
- **WHEN** 管理员在 embed 管理页操作活动列表或奖励发放记录
- **THEN** 操作成功执行，行为与迁移前一致

### Requirement: 鉴权改为 introspect 模式
`marketing-service` SHALL 使用 introspect 模式验证请求身份，不复制 optimus-api
的用户体系。

#### Scenario: 管理端请求鉴权
- **WHEN** 管理端请求携带有效的管理员 token 访问 `marketing-service` 接口
- **THEN** 服务通过 introspect 验证身份与权限后正常处理请求

### Requirement: reward-claim-record 不再原生 JOIN 查询 activity
reward-claim-record 查询活动相关信息 SHALL 通过 `ActivityService` 暴露的接口，
不使用原生 SQL 跨表 JOIN。

#### Scenario: 查询奖励发放记录列表
- **WHEN** 管理员查询奖励发放记录列表，且返回结果需要包含对应活动的信息
- **THEN** 系统通过 `ActivityService` 的接口获取活动信息，而非直接拼接原生
  SQL JOIN 查询 `op_biz_activity` 表

### Requirement: 服务目录接入
`marketing-service` SHALL 登记为服务目录中 `entryType=embed` 的条目，管理端
菜单通过动态 embed 入口访问，不再使用静态路由节点。

#### Scenario: 管理后台通过动态菜单访问
- **WHEN** 管理员在管理后台侧边栏点击营销相关菜单项
- **THEN** 系统通过服务目录解析到 `marketing-service` 的 embed 地址并正确加载

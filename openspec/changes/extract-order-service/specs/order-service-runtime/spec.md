## ADDED Requirements

### Requirement: 订单域独立服务承载 order 模块
系统 SHALL 提供一个独立的 `order-service` 进程，承载 order 模块的全部对外接口，
行为与迁移前在 optimus-api 单体内一致。

#### Scenario: C 端下单功能不回归
- **WHEN** C 端用户在迁移后提交虚拟商品/角色转区/建公会等下单请求
- **THEN** 请求经代理路由到 `order-service` 并成功处理，行为与迁移前一致

#### Scenario: 支付回调不回归
- **WHEN** 第三方支付网关在迁移后发起支付回调请求
- **THEN** 回调请求被正确路由到 `order-service` 并成功处理订单状态更新

#### Scenario: 管理后台订单管理不回归
- **WHEN** 管理员在 embed 管理页查询订单列表、统计、详情
- **THEN** 操作成功执行，行为与迁移前一致

### Requirement: 鉴权改为 introspect 模式
`order-service` SHALL 使用 introspect 模式验证请求身份，不复制 optimus-api 的
用户体系。

#### Scenario: 管理端请求鉴权
- **WHEN** 管理端请求携带有效的管理员 token 访问 `order-service` 接口
- **THEN** 服务通过 introspect 验证身份与权限后正常处理请求

### Requirement: 服务目录接入
`order-service` SHALL 登记为服务目录中 `entryType=embed` 的条目，管理端菜单
通过动态 embed 入口访问。

#### Scenario: 管理后台通过动态菜单访问
- **WHEN** 管理员在管理后台侧边栏点击订单相关菜单项
- **THEN** 系统通过服务目录解析到 `order-service` 的 embed 地址并正确加载

### Requirement: 无死依赖
`order-service` SHALL 不携带迁移前已确认零调用点的 `UserModule` 导入。

#### Scenario: 代码不含无用导入
- **WHEN** 检查 `order-service` 的模块声明
- **THEN** 不存在从未被实际使用的跨模块导入

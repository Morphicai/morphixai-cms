## ADDED Requirements

### Requirement: C 端网关路由权威来自服务目录
生产环境的网关 SHALL 不使用独立维护、与服务目录脱节的静态路由表来决定
`/api/*` 或 zone 路径的转发目标；已登记进服务目录且启用的服务，其
API 前缀或 zone 前缀 SHALL 能够被网关正确路由到，不需要额外的手工
网关配置。

#### Scenario: 新增子服务的 API 前缀自动可达
- **WHEN** 一个新的业务子服务在服务目录中登记了 `apiPathPrefixes`
  并设为 `enabled`
- **THEN** 生产环境的网关 SHALL 能够把匹配这些前缀的请求正确转发到
  该服务，不需要修改任何独立于服务目录之外的静态网关配置文件

#### Scenario: 新增 zone 的路径前缀自动可达
- **WHEN** 一个新的 zone 应用在服务目录中登记了 `pathPrefix` 并设为
  `enabled`
- **THEN** 生产环境的网关 SHALL 能够把该路径前缀的请求正确路由到
  对应的 zone 应用，而不是落入某个与服务目录无关的兜底规则

#### Scenario: 已删除代码的旧路由前缀不再残留可路由性
- **WHEN** 某个业务模块的代码已经从其原来所在的服务中删除（如
  `extract-partner-service` 完成后 optimus-api 不再包含 partner 相关
  路由）
- **THEN** 生产环境的网关 SHALL NOT 把该模块的请求转发到已经不再处理
  这些路由的旧服务

### Requirement: 已登记服务在生产环境真正可被启动
服务目录中标记为需要在生产环境运行的服务，部署配置 SHALL 确保其进程
被启动，而不只是在开发环境可运行。

#### Scenario: 拆分出的独立服务在生产部署中被启动
- **WHEN** 一个业务模块已经从单体服务中拆分为独立的子服务（如
  partner-service）
- **THEN** 生产环境的部署配置 SHALL 包含启动该子服务的步骤，
  该子服务在生产环境中处于可响应请求的状态

### Requirement: B 端 embed 管理页在生产环境可被浏览器实际加载
B 端 iframe 嵌入的管理页面（embed 子应用）在生产部署中 SHALL 能够被
浏览器实际加载。其可达范围 SHALL 跟随管理后台整体，SHALL NOT 单独设置
更严格的网络限制（如内网 / VPN-only）——访问控制由管理端权限码承担，
不由网络可达性承担。

#### Scenario: embed 服务经自己的公网地址完成握手
- **WHEN** 一个 embed 子应用在服务目录中登记了 `embedUrl` 且已启用
- **THEN** 该服务 SHALL 具备自己可公网访问的地址（子域名 + TLS），
  持有相应管理端权限的用户 SHALL 能通过浏览器实际打开该管理页并完成
  postMessage 握手

#### Scenario: 无管理端权限的用户被拒绝发生在权限层
- **WHEN** 用户不持有该 embed 条目声明的 `permCode`
- **THEN** 管理后台 SHALL NOT 呈现该入口，直达 SHALL 被拒绝；
  该拒绝 SHALL 发生在权限层而非网络层

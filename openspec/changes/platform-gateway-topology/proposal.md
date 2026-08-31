## Why

分层架构定案（`HANDOFF.md`）之后核查"是否具备统一网关"这个问题时，发现现有
唯一的生产网关配置（`Caddyfile` + `docker-entrypoint.sh`）自项目初始化提交
（2026-01-01，`init project`）后从未被修改过——它比 Multi-Zones、
agent-service、service-registry、`extract-partner-service` 全部更早，完全
没跟上这些架构变化。

具体会炸的两处：

1. **C 端 API 路由被拦在半路**：Caddy 把 `/api/*` 硬编码转发到
   `localhost:8084`（optimus-api），这个转发发生在请求到达
   `optimus-next` 自己的服务目录驱动动态代理（`proxy.ts` +
   `app/api/[...path]/route.ts`）**之前**。`extract-partner-service`
   完成后，`partner/points-engine/external-task` 的代码已经从
   optimus-api 删除，如果照这份 Caddyfile 部署，所有走
   `/api/biz/partner/*` 这类前缀的请求会被 Caddy 直接转给早已没有这些
   路由的 8084，必定 404——optimus-next 里那套"按 `apiPathPrefixes` 分流
   到拆出去的子服务"的设计在这个网关拓扑下根本轮不到执行。Multi-Zones
   同理：访问 `/activity` 会落进 Caddy 的 `handle /*` 兜底规则，被转发给
   optimus-ui（管理后台），而不是拥有动态 zone 路由能力的 optimus-next。
2. **B 端 embed 子应用需要独立可达的地址，但没有任何机制暴露它们**：
   embed 管理页（如 partner-service 的 React 后台）浏览器直接打 iframe
   `embedUrl` 所在的那个服务自己的源（`baseURL` 默认空字符串，同源相对
   请求），完全不经过 Caddy 或任何代理。但 `docker-entrypoint.sh` 只在
   单容器里启动了 optimus-api / optimus-ui / optimus-next 三个进程，
   partner-service（以及未来的 marketing-service / order-service /
   agent-service / zone-activity）既没有被启动，也没有任何入口把它们
   暴露给浏览器。

这两个问题的性质不同（一个是"网关拦截了本该生效的动态路由"，一个是"压根
没有暴露机制"），不能用同一个补丁解决，但都指向同一件事：**单容器 +
一份写死路由表的部署模型，与"业务模块物理拆分为独立服务"的架构方向已经
不兼容**，而且每多拆一个服务（营销域、订单域即将开始）这个缺口就更深
一次。现在只有 partner-service 一个真实案例，是修复成本最低的窗口。

## What Changes

- 重新设计生产网关拓扑，让 C 端流量的路由权威回到"服务目录"这一份数据，
  不再允许一份独立维护、会过期的静态转发表挡在动态代理前面
- 为服务目录的每条记录明确"可达范围"——是需要被浏览器直接访问
  （C 端 zone、需要独立公开的 API），还是只需要在受控网络内可达
  （B 端 embed 管理页，如果决定采用内网/VPN 方案）
- **每个按业务域拆分出的独立服务（partner-service 起步）新增自己的
  Dockerfile + 生产启动脚本，能够独立构建为部署产物**，不再依赖根目录
  `Dockerfile` 把它一起打包才能跑——这是"支持独立部署"从代码结构上的
  可能性变成工具链上的事实的关键一步（核实发现 partner-service 现在
  甚至没有 `start:prod` 脚本，"独立部署"目前只在代码层面成立）
- 新增生产用的 `docker-compose.prod.yml`，把核心平台包（optimus-api/
  optimus-ui/optimus-next，继续用现有根目录 `Dockerfile` 打包，不拆）
  和各个独立服务的镜像编排在一起，替代现在"一份共享 shell 脚本按顺序
  拉起多进程"的模式
- 仍然留给实现阶段决定的：网关本身的实现方式（保留 Caddy 简化为纯
  转发，还是去掉 Caddy 让 optimus-next 作为唯一入口），见 design.md
  的 Open Questions——这条和"部署模型用不用 compose"是两件独立的事，
  部署模型已经定了，网关实现方式还没有

**BREAKING**：是。当前唯一的部署路径（单容器 + `docker-entrypoint.sh`
拉起三个进程）替换为多容器 + docker-compose，`Caddyfile` 需要重写，
新增的独立服务需要各自的 Dockerfile。因为"生产部署未实测"是从项目
早期就有的已知状态（`TASKS.md`），这个 BREAKING 不影响任何正在运行的
生产环境——影响的是"以后要部署时该用哪套东西"，不是"现在正在跑的东西
会被打断"。

## Capabilities

### New Capabilities

- `gateway-topology`：网关路由权威来自服务目录，且已登记服务在生产环境
  真正可达（而不只是本地 dev 能跑）

### Modified Capabilities

（无——不改变任何 API 的行为契约，只改变"请求怎么被路由到正确的进程"这件事）

## Impact

- `Caddyfile`：需要重写，不能再硬编码固定的服务列表和端口
- `packages/partner-service`：新增 `Dockerfile` + `start:prod` 脚本
- 新增 `docker-compose.prod.yml`（当前只有 `docker-compose.dev.yml`，
  只含 DB/MinIO/adminer），编排核心平台包镜像 + partner-service 镜像
- `op_sys_service_registry`：schema 新增一个字段表达"可达范围"
  （公开 / 内网），具体在 design.md 里定
- 是 `extract-marketing-service`、`extract-order-service` 的前置条件——
  这两个变更拆出的新服务照抄同一套模式（自己的 Dockerfile + 加入
  compose 编排），不用重新想一遍部署方式，也不会让"网关不认识新服务"
  这个问题再复现
- 松耦合于 `platform-environment-info`：设计网关时会用到"当前环境的
  规范域名是什么"这类信息，但不是硬依赖，可以并行推进

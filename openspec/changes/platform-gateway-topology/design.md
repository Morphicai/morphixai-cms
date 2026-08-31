## Context

三份证据支撑这个变更的必要性，全部来自实际读代码/读 git 历史核实，不是推测：

1. `git log -1 --format="%ai %s" -- Caddyfile docker-entrypoint.sh` 结果是
   `2026-01-01 23:51:41 +0800 init project`——这两个文件从仓库诞生那天起
   没有被改过一个字符。而 Multi-Zones、agent-service、service-registry、
   `extract-partner-service` 全部是之后才建立的架构。
2. `Caddyfile` 的路由表：`/api/*` → `localhost:8084`（写死）、`/next/*`
   （strip prefix）→ `localhost:8086`、其余 `/*` → `localhost:8082`。
   `optimus-next` 自己的 `app/api/[...path]/route.ts` 里有一段代码注释
   直接写着"多后端分流：服务目录里声明了 apiPathPrefixes 的子服务按前缀
   命中转发到自己的 baseUrl"——这套设计完全正确，但 Caddy 在请求到达
   optimus-next 进程之前就已经把 `/api/*` 转给了 8084，这段代码不可能
   被执行到。
3. `partner-service/admin-app/src/lib/request.js` 的
   `baseURL: import.meta.env.VITE_PARTNER_SERVICE_BASE_URL || ""`——空
   字符串意味着浏览器发出的是相对路径请求，直接打 iframe 所在的那个
   源（partner-service 自己的 origin）。这条路径完全不经过 Caddy，
   前提是浏览器能够直接访问 partner-service 的地址；而
   `docker-entrypoint.sh` 里只 `pnpm run start:prod` 了
   optimus-api / optimus-ui / optimus-next 三个包，partner-service
   在生产容器里根本没有被启动。
4. 就算把 `docker-entrypoint.sh` 改成也去启动 partner-service，也无法
   直接成立：整个仓库只有一份根目录 `Dockerfile`（只打包
   optimus-api/optimus-ui/optimus-next），partner-service 没有自己的
   Dockerfile；`packages/partner-service/package.json` 里也没有
   `start:prod` 脚本，只有 `start`（`nest start`，开发态直跑源码）和
   `dev`（watch 模式）。也就是说"partner-service 支持独立部署"目前
   只在代码结构上成立（零 import 耦合、纯 HTTP 调用），在工具链层面
   还没有被真正落实——它甚至没有被定义"生产环境该怎么启动"。

约束：
- 单机/小规模部署，不是要解决"数百个服务的大规模网关"问题
- 已有的服务目录（`op_sys_service_registry`）、探测面板
  （`ServiceProbe`）、服务身份（`platform-service-token`）这些机制
  都要继续复用，不是推倒重来
- 用户在 CLAUDE.md 里已经确认公司的常规工作模式是"偶尔出差，VPN 接入
  公司内网办公"——这意味着"后台管理页只需要内网/VPN 可达，不需要公网
  暴露"是一个真实存在、成本更低的合法选项，不是权宜之计

## Goals / Non-Goals

**Goals:**
- C 端（浏览器直接访问）的请求路由权威回到服务目录这一份数据，不再有
  一份独立维护、会持续过期的静态转发表挡在动态代理生效之前
- 已经登记进服务目录、且 `entryType` 需要浏览器直接访问的服务
  （zone / 需要独立可达的 API 子服务），在生产环境真正被启动、真正可达
- 明确 B 端 embed 管理页的可达范围策略（公网 or 内网/VPN），并落实到
  部署配置里，不再是"代码拆出去了但生产环境从没跑起来过"这种悬空状态
- **按业务域拆分出的独立服务（partner-service，以及后续
  marketing-service/order-service）能够被独立构建为部署产物（各自的
  Dockerfile 镜像），不与核心平台包（optimus-api/optimus-ui/
  optimus-next）绑在同一次构建/同一个镜像里**——这是"支持独立部署"从
  代码结构上的可能性变成工具链上的事实的关键一步，不做这一步，独立
  部署目前只是"理论上如此"
- 给后续拆分（营销域、订单域）一个可以直接照抄的部署拓扑模板，
  不需要每次都重新想一遍"这个新服务怎么在生产里让人访问到"、"怎么
  单独发布"

**Non-Goals:**
- 不选定具体的云厂商/主机方案——这次只解决"拓扑模型对不对"，不是
  "部署到哪里"
- 不引入 Kubernetes / service mesh / Ingress Controller 这类重量级
  基础设施——当前服务数量个位数，用不上
- 不做自动化的 TLS 证书签发/续期方案，除非最终选择需要暴露多个独立
  域名的方案（见 Open Questions）
- 不改变任何 API 的行为契约或现有鉴权机制——这是纯粹的"请求怎么被路由
  到正确进程"层面的修正

## Decisions

**C 端网关不再用一份独立维护的静态转发表，改为直接依赖服务目录（或者
干脆取消 Caddy 这一层，让 `optimus-next` 成为唯一对外入口）**：现有
`optimus-next` 已经实现了完整的服务目录驱动动态代理（zone 路由 +
API 前缀路由），这套逻辑是对的、已验证的，缺的只是"让它真正跑在最前面
接住流量"。两个候选实现方式：

- 方案 A：保留 Caddy，但把它的角色简化为"把所有非静态资源请求统一转给
  `optimus-next`"，不再自己维护任何服务级别的路由决策，路由决策完全
  下放给 optimus-next 的 `proxy.ts`/`api-route-directory.ts`
- 方案 B：直接去掉 Caddy 这一层，`optimus-next` 通过其内建的 Node
  server 作为唯一入口（Next.js 本身可以监听公网端口），Caddy 现在承担
  的"健康检查页面"、"错误页面兜底"等职责改由 optimus-next 自己实现或
  换更轻量的方案

倾向方案 A（改动面更小，Caddy 的错误兜底页面/健康检查这类现成能力还
有用），但具体选哪个留给实现阶段验证后决定，不在设计阶段武断定死。

**B 端 embed 管理页：默认选择"内网/VPN 可达即可"，不追求默认公网暴露**：
后台管理页面本来就只给内部人员使用，结合用户已确认的 VPN 常规工作模式，
最简单、成本最低的方案是把这些服务（partner-service 及后续的
marketing-service/order-service 的 embed 端点）跑在内网网段，只有
optimus-ui（浏览器加载 iframe 的宿主页）本身在公网/统一入口暴露即可
——iframe 的 `src` 指向一个只有内网/VPN 用户能解析和访问的地址，这对
"外部人员访问不到"是天然成立的，不需要额外的访问控制层。如果后续有
非 VPN 环境的运营人员需要访问管理后台，再重新评估要不要给这些服务上
公网域名+TLS。这一条已经用一个明确的 Open Question 留给用户确认
（见下），本处只是给出推荐方向，不是已拍板结论。

**服务目录新增一个可达范围标记**：为 `op_sys_service_registry` 增加
一个字段（暂定 `reachability`，取值 `public`/`internal`），描述这个
服务的 `baseUrl`/`embedUrl` 期望被谁访问到。这不是强制的网络隔离机制
（服务目录本身不做流量控制），而是一份"意图声明"——用来指导部署配置
（哪些服务要暴露到公网入口，哪些只需要内网可达）和后续巡检（发现一个
标了 `internal` 的服务却配了公网可达的 baseUrl，属于配置错误）。

**部署方式：每个独立拆分出的服务配自己的 Dockerfile + 生产启动脚本，
用 docker-compose 编排，不是继续用一份共享 entrypoint 脚本拉起多进程，
但也不上 K8s/服务网格**：

原计划是"保留单容器多进程模型，只补全 `docker-entrypoint.sh`"，但核实
Context 第 4 条后发现这个方案有一个前提没有成立——partner-service 
根本没有自己的 Dockerfile 和生产启动脚本，"补全 entrypoint 脚本"改的
只是编排层，改不动"这个服务能不能被独立构建"这件事本身。而"能不能
被独立构建"恰恰是"支持独立部署"最基础的那一层：如果 partner-service
永远只能作为根目录 `Dockerfile` 构建流程里的一个附属产物存在，它就
不是真正独立的服务，只是代码上解耦、部署上仍然是同一个单体的一部分。

调整后的方案：
- 核心平台包（optimus-api/optimus-ui/optimus-next）继续用现有根目录
  `Dockerfile` 一起打包——它们是 L0/L1 平台核心，不是本轮"按业务域拆分
  给不同团队"的对象，没有必要现在拆开
- 每个按业务域拆分出的独立服务（partner-service 起步，后续
  marketing-service/order-service 照抄）新增自己的 Dockerfile（多阶段
  构建，参照根目录 `Dockerfile` 的 pnpm workspace 构建方式）和
  `start:prod` 脚本（编译后直接 `node dist/main.js` 启动，不再是
  `nest start` 这种开发态命令）
- 生产环境用一份新增的 `docker-compose.prod.yml` 把"核心平台包镜像"和
  "各个独立服务镜像"编排在一起，都在同一个 Docker 网络里，互相之间用
  容器名（如 `http://partner-service:8089`）而不是 `localhost` 访问
  ——这个改动顺带修正了现在 `OPTIMUS_API_URL` 等环境变量里隐含的
  "反正都在同一台机器上，localhost 就行"这个从未被真正验证过的假设
- 这一步不等于"已经在做多主机部署"——compose 完全可以把所有容器继续
  跑在同一台机器上，效果上和单容器多进程模型几乎一样。区别在于：现在
  "把某个容器挪到另一台机器"是一个部署时的选择（改一下 compose 或者
  换成多个 compose 文件），而不是需要先回头补一堆构建脚本的大改造

这个调整没有违反 Non-Goals：不需要 Kubernetes、不需要服务网格、不需要
自动化证书体系——docker-compose 本身就是轻量工具，只是比"一份共享
shell 脚本按顺序拉起进程"更接近"每个服务是一个独立单元"这个目标。
如果未来服务数明显增长到需要跨主机调度、自动扩缩容，再重新评估切到
K8s——那时候每个服务已经有了自己的 Dockerfile，是一个加法，不是从头
重来。

## Risks / Trade-offs

**[风险] 把服务目录当作网关路由权威的唯一来源，一旦目录数据被误改
（比如某个服务的 baseUrl 填错），会直接导致生产流量路由错误**
→ 缓解：服务目录的写操作已经在 `ServiceOps` 权限门之后（`extract-order-
service` 之前就有的机制），且已有探测面板可以及时发现"路由指向的服务
实际不健康"；这个风险本质上和"任何配置驱动的路由都有配置写错的风险"
是同一类，不是这次变更引入的新增风险面

**[风险] 内网/VPN-only 方案如果后续需要对非 VPN 用户开放，需要重新设计
访问路径，不是简单加一条 DNS 记录就能解决**
→ 缓解：Open Questions 里已经把这个范围决策显式提给用户确认，不是在
实现阶段才发现选错了方向；如果用户确认未来会有非 VPN 访问需求，现在
就按"每个服务独立域名+网关统一入口"的方案设计，成本是现在多做一点，
换后续不用推倒重来

**[风险] 修改生产网关拓扑，如果验证不充分，会在真正部署时才发现问题**
→ 缓解：这个变更目前还没有任何"真正的生产环境"存在（`TASKS.md` 里
"生产部署未实测"是从项目早期就有的已知状态），换句话说现在改的是一份
"从来没有被真实流量验证过"的配置，风险的上限就是"继续保持从未验证过"
这个现状，不会让已经在跑的东西变得更差；验收阶段要求用一次完整的
docker 本地多进程/多容器联调（不需要真实公网环境）模拟验证

## Migration Plan

1. 落地前先确认 Open Questions（尤其是 B 端可达范围的范围决策），
   这直接决定后面怎么改部署脚本
2. 服务目录 schema 加可达范围字段，现有 6 条记录按当前实际情况补齐
   （zone/C 端相关 = public，B 端 embed 管理页 = internal，除非用户
   决定不做这个区分）
3. 重写 `Caddyfile`（或按 Decisions 里方案 B 去掉这一层），让 C 端
   `/api/*` 和 zone 路径真正落到 `optimus-next` 的动态代理
4. 给 partner-service 补上自己的 Dockerfile 和 `start:prod` 脚本
   （编译后 `node dist/main.js`），验证能独立构建镜像、独立启动，
   不依赖根目录 `Dockerfile` 的构建流程
5. 新增 `docker-compose.prod.yml`，把核心平台包镜像和 partner-service
   镜像编排在同一网络里，服务间调用改用容器名而不是 `localhost`
6. 本地用 Docker 完整走一遍：多容器同时起来 → C 端请求正确路由到
   partner-service 的 API → B 端 embed 管理页在模拟的内网网络策略下可达、
   在模拟的"非内网"网络策略下不可达（如果选择内网方案）
7. 回滚：这次改的是部署配置而非代码逻辑，出问题直接回退 Caddyfile/
   compose 文件到修改前的版本即可，不影响任何已有代码路径

## Open Questions

- **B 端 embed 管理页的可达范围**：内网/VPN-only，还是需要支持非 VPN
  环境的公网访问？这条直接决定要不要为每个拆出去的服务申请独立域名和
  TLS 证书，属于范围性决策，不能在实现阶段自行假设，需要用户在实施前
  明确
- **网关实现方式**：Decisions 里给了方案 A（保留 Caddy，简化为纯转发）
  和方案 B（去掉 Caddy，optimus-next 作为唯一入口）两个候选，倾向 A，
  但最终选择建议在实现阶段先验证两种方案的实际改动量后再定，不在设计
  阶段武断锁死
- **`extract-order-service` 里悬而未决的"支付回调地址网关侧配置"问题**
  现在归入本变更统一处理——本变更落地后，回调路径应该表现为"网关拓扑
  变了，但只要 order 服务的路由前缀和对外可见路径保持不变，回调地址
  就不受影响"，具体验证放在 `extract-order-service` 自己的落地前修复
  阶段做

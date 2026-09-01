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
- **用户已明确拍板两条边界**（见下方 Decisions，不再是可选项）：
  ① embed 管理页的可达范围必须跟随管理后台整体，不允许比管理后台更
  封闭（不做"整体公网、个别服务内网"这种拆分）；② C 端（optimus-next）
  可以不经过 Caddy，自托管为直接入口。这两条已经关闭了原设计里给
  "内网/VPN-only"和"网关实现方式 A/B"两个开放问题，本文档不再讨论
  这两个方向的备选方案

## Goals / Non-Goals

**Goals:**
- C 端（浏览器直接访问）的请求路由权威回到服务目录这一份数据，不再有
  一份独立维护、会持续过期的静态转发表挡在动态代理生效之前
- `optimus-next` 直接作为 C 端流量的入口，不经过 Caddy——利用它本身
  是可以监听公网端口、跑动态逻辑的 Node server 这一点，Caddy 在这条线
  上完全去掉
- 每个 `entryType=embed` 的服务（partner-service 起步）拥有自己独立
  可公网访问的地址（域名/子域名 + TLS），可达范围与管理后台
  （optimus-ui）整体保持一致，不单独收窄——这是用户拍板的统一规则，
  不再需要按服务差异化配置
- **按业务域拆分出的独立服务（partner-service，以及后续
  marketing-service/order-service）能够被独立构建为部署产物（各自的
  Dockerfile 镜像），不与核心平台包（optimus-api/optimus-ui/
  optimus-next）绑在同一次构建/同一个镜像里**——这是"支持独立部署"从
  代码结构上的可能性变成工具链上的事实的关键一步，不做这一步，独立
  部署目前只是"理论上如此"
- 给后续拆分（营销域、订单域）一个可以直接照抄的部署拓扑模板：新增
  一个服务 = 自己的 Dockerfile + compose 编排条目 + 自己的公网站点
  配置（含 TLS），三件事清单化、不再是隐性假设

**Non-Goals:**
- 不选定具体的云厂商/主机方案——这次只解决"拓扑模型对不对"，不是
  "部署到哪里"
- 不引入 Kubernetes / service mesh / Ingress Controller 这类重量级
  基础设施——当前服务数量个位数，用不上
- 不改变任何 API 的行为契约或现有鉴权机制——这是纯粹的"请求怎么被路由
  到正确进程"层面的修正
- 不做"服务目录驱动的动态网关配置"这类更复杂的方案（比如让 Caddy 也
  实时查服务目录动态生成路由）——每新增一个公网可达的服务时手动加一个
  站点配置块，作为该服务上线清单里明确的一步，足够应付个位数服务的
  规模，比自动化更简单可靠

## Decisions

**C 端确定不经过 Caddy，`optimus-next` 自托管为直接入口**（已拍板，
不再是候选方案）：`optimus-next` 已经实现了完整的服务目录驱动动态代理
（zone 路由 + API 前缀路由，`proxy.ts`/`api-route-directory.ts`），
这套逻辑本身是对的、已验证的。它是一个真正能跑动态逻辑的 Node server，
不需要任何东西挡在前面替它做路由决策——直接监听 C 端域名的公网端口即可。
这条线上 Caddy 的角色（路由决策、TLS、错误兜底页）全部由 `optimus-next`
自己承担或替换：TLS 交给部署环境本身的证书方案（如云厂商负载均衡终止
TLS，或 `optimus-next` 前面单独挂一个只做 TLS 的极简反代——具体选型
留给实现阶段按实际部署环境定，不影响这条"C 端不需要 Caddy 做路由决策"
的结论）。

**管理后台（optimus-ui）与它的 embed 子应用是另一条独立的线，规则是
"embed 跟随管理后台整体的可达范围，不单独限定为内网"**（已拍板）：
之前设计里给 `op_sys_service_registry` 加一个 `reachability` 字段、
让每个服务能单独选公网或内网，这个方向被否掉了——原因是它会制造一个
真实的可用性陷阱：管理后台整体公网可达时，如果某个具体业务的 embed 页
单独设成内网/VPN-only，会出现"账号权限完全够、但因为当前不在 VPN 里
就是打不开这一个具体菜单"的情况，对用户体验是净损失。改为统一规则后，
`op_sys_service_registry` **不需要新增任何字段**——可达范围不是服务
目录里要表达的数据，是每个服务部署时必须满足的约束：只要管理后台本身
在公网可达，任何 `entryType=embed` 的服务在部署时就必须同样公网可达
（应用层的门禁——JWT、权限码、postMessage 握手校验——继续正常生效，
"网络层可达"从不等于"数据层可访问"，这条边界不受影响）。

**每个 embed 服务需要自己独立的公网地址（域名/子域名）+ TLS，这件事
现在是明确在做的范围，不是可以搁置的选项**：因为可达范围统一跟随管理
后台，且 embed 的 iframe 是浏览器直接连子应用自己的源（不经过 optimus-ui
的反代转发），所以每个 embed 服务必须有一个浏览器能直接连上的公网地址。
最低成本的做法是给管理后台的域名上一张通配符证书（如
`*.admin.example.com`），每个新的 embed 服务用这张证书下的一个子域名
（`partner.admin.example.com`），前面挂一个只做"TLS 终止 + 转发到这一个
容器"的极薄反代配置块——继续沿用 Caddy 承担这件事是合理的（它的通配符
自动续期本身就是这里唯一有技术含量的部分），但它的角色收窄为"管理后台
域名下每个子应用各自的静态站点配置"，不再需要感知服务目录、不再需要
动态路由判断。**新增一个站点配置块，作为每次拆出一个新业务服务时
清单里明确的一步**（写进 `extract-marketing-service`/
`extract-order-service` 的落地检查清单），不做成自动化——这是本变更
Non-Goals 里"不做服务目录驱动的动态网关配置"的具体落点：个位数服务
规模下，一步手动配置比一套自动生成配置的机制更简单、更不容易出隐蔽的
新问题。

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

这个调整没有违反 Non-Goals：不需要 Kubernetes、不需要服务网格——
docker-compose 本身就是轻量工具，只是比"一份共享 shell 脚本按顺序
拉起进程"更接近"每个服务是一个独立单元"这个目标。如果未来服务数明显
增长到需要跨主机调度、自动扩缩容，再重新评估切到 K8s——那时候每个
服务已经有了自己的 Dockerfile，是一个加法，不是从头重来。

## Risks / Trade-offs

**[风险] 把服务目录当作网关路由权威的唯一来源，一旦目录数据被误改
（比如某个服务的 baseUrl 填错），会直接导致生产流量路由错误**
→ 缓解：服务目录的写操作已经在 `ServiceOps` 权限门之后（`extract-order-
service` 之前就有的机制），且已有探测面板可以及时发现"路由指向的服务
实际不健康"；这个风险本质上和"任何配置驱动的路由都有配置写错的风险"
是同一类，不是这次变更引入的新增风险面

**[风险] 每个 embed 服务独立公网暴露，攻击面比"只有一个入口"更大**
→ 缓解：这是"embed 跟随管理后台整体可达范围"这条决策的直接代价，
已经权衡过——好处是消除了"内网/VPN-only"带来的可用性陷阱，代价是
每个服务自己的网络层暴露面变多；应用层门禁（JWT、权限码、握手校验）
不因为多了几个公网入口而减弱，真正的数据访问仍然需要过完整的身份
校验；每个新服务的站点配置块本身很薄（只做 TLS 终止 + 转发），出错
概率和现有做法比没有本质变化

**[风险] 修改生产网关拓扑，如果验证不充分，会在真正部署时才发现问题**
→ 缓解：这个变更目前还没有任何"真正的生产环境"存在（`TASKS.md` 里
"生产部署未实测"是从项目早期就有的已知状态），换句话说现在改的是一份
"从来没有被真实流量验证过"的配置，风险的上限就是"继续保持从未验证过"
这个现状，不会让已经在跑的东西变得更差；验收阶段要求用一次完整的
docker 本地多容器联调（不需要真实公网环境）模拟验证

## Migration Plan

1. 重写 `Caddyfile`：拆成两条独立的线——C 端这条线整体移除（或替换成
   纯 TLS 终止，不做任何路由判断，全部转给 `optimus-next`）；管理后台
   这条线收窄为"optimus-ui 静态站 + `/api/*` 固定转发 optimus-api"
   一个站点配置块 + partner-service 一个独立子域名的站点配置块
2. 给 partner-service 补上自己的 Dockerfile 和 `start:prod` 脚本
   （编译后 `node dist/main.js`），验证能独立构建镜像、独立启动，
   不依赖根目录 `Dockerfile` 的构建流程
3. 新增 `docker-compose.prod.yml`，把核心平台包镜像和 partner-service
   镜像编排在同一网络里，服务间调用改用容器名而不是 `localhost`
4. 本地用 Docker 完整走一遍：多容器同时起来 → C 端请求（经 optimus-next
   自托管）正确路由到 partner-service 的 API → B 端 embed 管理页经
   partner-service 自己的子域名站点配置正常加载、握手正常
5. 回滚：这次改的是部署配置而非代码逻辑，出问题直接回退 Caddyfile/
   compose 文件到修改前的版本即可，不影响任何已有代码路径

## Open Questions

- **`extract-order-service` 里悬而未决的"支付回调地址网关侧配置"问题**
  现在归入本变更统一处理——本变更落地后，回调路径应该表现为"网关拓扑
  变了，但只要 order 服务的路由前缀和对外可见路径保持不变，回调地址
  就不受影响"，具体验证放在 `extract-order-service` 自己的落地前修复
  阶段做

（原先的"B 端可达范围"与"网关实现方式 A/B"两个开放问题已由用户拍板
关闭，见上方 Context 与 Decisions，此处不再列为待定项。）

# Proposal: service-registry — 服务目录:人与 AI 共用的服务接入面

## 核心诉求

平台已是多服务形态,但"接入一个服务"仍是代码级动作:探测清单要改集合、
菜单入口要改 routes.js、agent 工具提供方要改环境变量重启。三处清单各自维护,
会漂移;接入门槛落在"会改前端代码的人"身上,不是管理员。

本迭代把三件事收敛为**一个服务目录(service catalog)**:

1. 管理员在"服务状态"页登记/编辑/下线服务(不再借道通用数据集合页,权限门收窄)
2. 登记的服务按声明的角色自动接入:被探测(healthPath)、进菜单(embedUrl+permCode)、
   给 Agent 供工具(toolsPath)
3. 一切变更走同一个门(ServiceOps)、留同一种痕(outbox 事件),
   将来 AI 生成的扩展物也从这个通道进来——**接入面只有一个,不为 AI 开后门**

判断"要不要做"的标准仍是精简:本迭代**零新基础设施**,是既有件的接线——
数据集合(存储)、RBAC(权限)、introspect(校验)、IframeApp 握手(嵌入)、
ServiceProbe(探测)、动态文档菜单模式(菜单注入)全部已存在且经过验收。

## 方案概览

- **存储不变**:目录仍是 services-registry 集合行,schema 加字段(form 协议零迁移)
- **接入面收窄**:新增 /system/services CRUD(门 ServiceOps),服务清单的管理
  不再要求 DataCollections 粗权限;通用集合接口继续可用,但不再是推荐入口
- **动态入口**:静态注册一个参数化路由 /embed/:serviceKey + 通用嵌入页,
  菜单项由目录生成(照抄动态文档菜单模式),握手复用 IframeApp
- **工具收敛**:agent-service 的 provider 列表从环境变量改为读目录
  (专用轻接口,门 AgentConsole,只暴露工具相关字段)
- **审计白得**:登记/变更/下线各发一条 outbox 事件

## 明确不做(本期)

- **AI 生成扩展物**:属未来形态。本迭代只保证"登记通道对机器同样可用"
  (接口化、schema 机器可读),不实现 AI 自助登记
- **C 端 zone 转发**:目录 schema 给 entryType 留位,Next 网关不动
- **服务进程启停**:进程生命周期归 compose/k8s,面板只观测不操控
- **service token / 心跳自注册**:仍无服务身份需求,挂账条件不变

## 验收

1. 服务状态页内完成一个新服务的登记(含 embedUrl+permCode),不改任何代码:
   菜单出现动态入口、iframe 握手成功、探测卡片出现、面板按权限过滤
2. demo-activity 从 routes.js 静态节点迁为目录登记的动态节点,功能等价
   (登录态共享、权限穿透、读写演示集合),静态节点与 DemoActivity 权限码下线
3. 为该服务登记 toolsPath 后,智能助理工具清单出现其工具,不重启 agent-service
4. 目录变更事件(service.registered/updated/removed)出现在事件流,含操作人
5. 无 ServiceOps 码的账号看不到服务状态页、调 CRUD 接口 403;
   无对应 permCode 的账号看不到动态菜单项、直达 /embed/:key 被拦
6. 单测 + 构建通过

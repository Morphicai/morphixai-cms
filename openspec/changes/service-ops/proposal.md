# Proposal: service-ops — 基座内的服务注册、观测与事件通道

## 要解决的问题

平台已是多进程形态（api/agent-service/两个前端 + 容器），但服务治理三件事是空白：
- 各服务活没活着、性能如何,只能挨个 curl——没有一眼可见的面板
- 服务清单散在各处 env,基座里无处登记
- 跨服务没有事件通道(agent run 完成了没人知道)

不引注册中心、不引 broker,用现有能力补齐这三块。

## 方案

### 1. 注册 = 数据集合(复用无代码地基)

`services-registry` 集合(private,form 协议 schema):每行一个服务
(name/baseUrl/healthPath/description/enabled)。**服务地址是部署环境配置**,
正是数据集合该管的"配置型小数据"——管理端维护 UI 白得,探测器读集合即得清单。
不做心跳自注册(那需要服务身份,挂账到 service token)。

### 2. 观测 = 定时探测 + 轻量指标 + 面板

- 各服务暴露 `GET /metrics-lite`(JSON:uptime/内存/事件循环延迟/请求计数)——
  自采样,不引 Prometheus;将来要标准 /metrics 只是换格式
- optimus-api 内 ServiceProbe(@nestjs/schedule,15s 间隔)拉各注册服务的
  health+metrics,结果存内存(探测状态是易失的,重启重探即可,不落库)
- 管理端"服务状态"页(@Perm ServiceOps):服务卡片(状态灯/延迟/内存/uptime)+
  最近事件流

### 3. 事件 = MySQL 事务性 outbox

`op_sys_service_event` 表(source/type/payload/created_at)。
- 发:`POST /system/events`(introspect 鉴权的服务或管理端调用)
- 收:`GET /system/events?after=`(轮询消费/面板展示)
- 第一个事件源:agent-service 每次 run 结束发 `agent.run.finished`
- 为什么不是 webhook/pub-sub:outbox 有持久化、可重放、零新组件;
  将来引 broker 时本表升级为 relay 源

## 为什么不直接上现成微服务框架(2026-08 生态调研结论)

调研过 Moleculer(0.15.1,活跃)/NATS(活跃)/Dapr(活跃)/Seneca(半停滞)/Cote(缓慢):

- **Moleculer**:功能全但契约进它的私有协议(broker.call)。我们的契约是
  HTTP+OpenAPI,浏览器/iframe/agent 全都直接消费,换协议等于加一层不减一层;
  嵌入式 broker(只用事件+gossip)看似白得,但 emit 不持久(面板要事件流还得落库)、
  前端静态站不跑 broker(探测还得自建)——省掉的只有最薄的两块
- **Dapr**:形态对(服务保持纯 HTTP)但量级错,单机 4 服务引 5 个新进程
- **NATS**:定为事件通道的升级目标(JetStream 持久化,比 Redis pub/sub 对口)。
  关键事实:就算引 NATS,outbox 表也逃不掉——"与业务写库同事务"这个性质
  broker 给不了,业界标准解法正是 MySQL outbox + relay 进 broker。
  所以本迭代的每一行都在升级路径上,没有弃子

升级触发条件:事件出现秒级延迟不可接受的消费者→引 NATS,本表变 relay 源;
服务数 ≥8 或跨机高频服务间调用→再评 Moleculer/Dapr。

### 4. 拉起

- dev:根 package.json `dev:all`(concurrently 拉 api/next/ui;agent-service
  需密钥注入,单独拉)
- 生产:docker-compose(restart/healthcheck/depends_on)——归入生产演练迭代

## 验收

1. 面板显示 4 个注册服务的实时状态;停掉 agent-service,15s 内其卡片变红
2. 智能助理跑一次任务,事件流出现 agent.run.finished(含状态与耗时)
3. 服务清单在"数据集合"页可增改,改完探测器下轮生效
4. 单测 + 构建通过

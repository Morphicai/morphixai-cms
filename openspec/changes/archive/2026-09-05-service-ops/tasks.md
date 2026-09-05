# Tasks: service-ops

## 1. api

- [x] 1.1 metrics-lite 端点(uptime/内存/事件循环延迟/请求均值)——注意全局前缀,实际路径 /api/metrics-lite
- [x] 1.2 op_sys_service_event 表 + events 模块(POST 发/GET 查,读 ServiceOps 写 AgentConsole)
- [x] 1.3 ServiceProbe:定时读 services-registry 集合,探测 health+metrics,状态存内存;GET /system/services/status(@Perm ServiceOps)
- [x] 1.4 单测:探测状态聚合、事件游标查询(5 测全过)

## 2. agent-service

- [x] 2.1 /metrics-lite;run 结束 POST agent.run.finished 事件(带发起人 token,失败不影响 run)

## 3. seed

- [x] 3.1 services-registry 集合(schema+4 行服务)+ ServiceOps 权限码(68/69);建表 SQL db/service_ops_tables.sql;dev 库执行

## 4. 管理端

- [x] 4.1 routes.js 服务状态节点 + pages/service-ops(服务卡片+事件流,10s 轮询)

## 5. 拉起

- [x] 5.1 根 package.json dev:all 脚本(pnpm -r --parallel,不引 concurrently)

## 6. 验收

- [x] 6.1 面板 4 服务状态(浏览器实测:3 绿 1 红,红的是没起的 next);停 agent-service 18s 内 status 变 ok=false
- [x] 6.2 真实 agent run(site-features 统计,1 调用 3.6s 答对 16),事件流自动出现 agent.run.finished;失败 run 也如实上报
- [x] 6.3 集合改服务清单下轮生效(探测路径改 /api/health 后下轮即用);单测+api 构建过

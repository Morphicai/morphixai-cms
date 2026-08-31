## 1. 范围决策（落地前必须先定）

- [ ] 1.1 与用户确认 Open Questions 里的"B 端 embed 管理页可达范围"
      （内网/VPN-only，还是需要公网访问）——这条决定后面所有部署配置
      怎么写，不能自行假设
- [ ] 1.2 确认网关实现方式：保留 Caddy 简化为纯转发（方案 A），还是
      去掉 Caddy 让 optimus-next 作为唯一入口（方案 B）——建议先各自
      估算一下实际改动量再定。部署模型（每服务独立 Dockerfile +
      docker-compose 编排）已在 design.md 定，这条不需要重新讨论

## 2. 服务目录扩展

- [ ] 2.1 `op_sys_service_registry` 新增可达范围字段（如
      `reachability: 'public' | 'internal'`），迁移脚本 + 现有 6 条
      记录按实际情况补齐初始值
- [ ] 2.2 服务目录管理接口/管理端页面支持读写这个新字段
- [ ] 2.3 单测覆盖：新增字段的校验（只接受合法枚举值）、默认值行为

## 3. C 端网关路由修正

- [ ] 3.1 按 1.2 的决策重写 `Caddyfile`（或去掉 Caddy 改造入口方式）
- [ ] 3.2 确认 `/api/*` 和已登记的 zone 路径前缀，请求最终真正落到
      `optimus-next` 自己的 `proxy.ts`/`app/api/[...path]/route.ts`
      逻辑（而不是被上一层拦截转发）
- [ ] 3.3 验证：本地模拟"网关 + compose 多容器"的完整链路，用一个已经
      拆分出去的服务（partner-service）的真实 API 前缀发请求，确认能够
      正确到达该服务而不是打到已删除对应代码的旧服务

## 4. 独立服务部署产物 + compose 编排

- [ ] 4.1 `packages/partner-service` 新增自己的 `Dockerfile`（多阶段
      构建，参照根目录 `Dockerfile` 的 pnpm workspace 构建方式，只打包
      这一个服务）
- [ ] 4.2 `packages/partner-service/package.json` 新增 `start:prod`
      脚本（编译产物 `node dist/main.js`，不是开发态的 `nest start`）
- [ ] 4.3 验证：`docker build` 只用 partner-service 自己的 Dockerfile
      能独立产出一个可运行的镜像，不依赖根目录 `Dockerfile` 的构建流程
- [ ] 4.4 新增 `docker-compose.prod.yml`：编排核心平台包镜像（现有根目录
      `Dockerfile`，optimus-api/optimus-ui/optimus-next 不拆）+
      partner-service 镜像 + MySQL/MinIO，全部在同一 Docker 网络
- [ ] 4.5 服务间调用的环境变量（如 `OPTIMUS_API_URL`）改用 compose
      网络里的容器名（如 `http://optimus-api:8084/api`），不再假设
      `localhost` 就是对方
- [ ] 4.6 按 1.1 的范围决策，确保 `internal` 可达范围的服务不出现在
      面向公网的入口配置里（compose 里不对外暴露端口，或只在内网
      网卡监听）
- [ ] 4.7 健康检查/错误兜底页面（Caddy 现有的 `/health`、5xx/4xx
      handle_errors）迁移到新拓扑下继续可用，不因为改造而丢失

## 5. 验收

- [ ] 5.1 本地用 Docker 完整走一遍新拓扑：C 端请求正确路由到
      partner-service 的业务接口（不是 404 或落到已删除路由的旧服务）
- [ ] 5.2 Multi-Zones 的 zone 路径（如 `/activity`）在新拓扑下正确
      落到 optimus-next 而不是 optimus-ui
- [ ] 5.3 B 端 embed 管理页按 1.1 的范围决策验证可达性：如果选择
      内网方案，模拟"非受控网络"环境下确认不可达；模拟受控网络环境下
      确认可达且握手正常
- [ ] 5.4 更新 `TASKS.md`/`HANDOFF.md`，标记本变更完成，解除
      `extract-marketing-service`/`extract-order-service` 对这个
      前置条件的悬空状态
- [ ] 5.5 提交、合 main

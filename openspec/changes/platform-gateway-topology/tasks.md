## 1. 范围决策（已由用户拍板，实施前无需再确认）

- [x] 1.1 B 端 embed 管理页可达范围——**跟随管理后台整体，不单独设内网限制**
      （用户已拍板，不再是开放问题）
- [x] 1.2 网关实现方式——**C 端确定不经过 Caddy**，`optimus-next` 自托管；
      管理后台这条线保留精简版 Caddy（用户已拍板）

## 2. C 端网关路由修正

- [ ] 2.1 重写 `Caddyfile`：移除 C 端这条线的路由判断（不再有
      `/api/*`→硬编码 8084 这类规则），C 端流量整体交给 `optimus-next`
      自托管；如需 TLS 终止，视部署环境决定是否需要一个极简反代，
      不影响"不做路由判断"这个结论
- [ ] 2.2 确认 `/api/*` 和已登记的 zone 路径前缀，请求最终真正落到
      `optimus-next` 自己的 `proxy.ts`/`app/api/[...path]/route.ts`
      逻辑（而不是被上一层拦截转发）
- [ ] 2.3 验证：用一个已经拆分出去的服务（partner-service）的真实 API
      前缀发请求，确认能够正确到达该服务而不是打到已删除对应代码的
      旧服务

## 3. 管理后台与 embed 服务的公网暴露

- [ ] 3.1 管理后台站点配置收窄为固定的一块：optimus-ui 静态站 +
      `/api/*` 固定转发 optimus-api，不做任何按服务动态判断
- [ ] 3.2 partner-service 新增自己的子域名站点配置（如
      `partner.admin.example.com`），只做 TLS 终止 + 转发到这一个容器，
      作为"拆出一个新 embed 服务"清单里明确的一步，写进
      `extract-marketing-service`/`extract-order-service` 的落地清单
- [ ] 3.3 确认 embed 服务的公网地址下，postMessage 握手/token 下发的
      origin 校验仍然正常（不因为换了域名而失败）

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
- [ ] 4.6 健康检查/错误兜底页面（Caddy 现有的 `/health`、5xx/4xx
      handle_errors）迁移到新拓扑下继续可用，不因为改造而丢失

## 5. 验收

- [ ] 5.1 本地用 Docker 完整走一遍新拓扑：C 端请求（经 optimus-next
      自托管）正确路由到 partner-service 的业务接口（不是 404 或落到
      已删除路由的旧服务）
- [ ] 5.2 Multi-Zones 的 zone 路径（如 `/activity`）在新拓扑下正确
      落到 optimus-next
- [ ] 5.3 B 端 embed 管理页经自己的子域名站点配置正常加载、握手正常，
      不需要额外的网络策略验证（可达范围已统一，不再有"内网/非内网"
      两种场景要分别验证）
- [ ] 5.4 更新 `TASKS.md`/`HANDOFF.md`，标记本变更完成，解除
      `extract-marketing-service`/`extract-order-service` 对这个
      前置条件的悬空状态
- [ ] 5.5 提交、合 main

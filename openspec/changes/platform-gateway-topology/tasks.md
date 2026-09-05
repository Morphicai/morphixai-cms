## 1. 范围决策（已由用户拍板，实施前无需再确认）

- [x] 1.1 B 端 embed 管理页可达范围——**跟随管理后台整体，不单独设内网限制**
      （用户已拍板，不再是开放问题）
- [x] 1.2 网关实现方式——**C 端确定不经过 Caddy**，`optimus-next` 自托管；
      管理后台这条线保留精简版 Caddy（用户已拍板）

## 2. C 端网关路由修正

- [x] 2.1 重写 `Caddyfile`：C 端整条线已从 Caddy 移除，只剩管理后台站点 +
      embed 子域名站点。上游地址改用 compose 网络的容器名（`optimus-api:8084` /
      `optimus-ui:8082`），不再是 `localhost`——各服务已是独立容器，
      localhost 只会指向 Caddy 自己。`caddy validate` 通过
- [x] 2.2 `/api/*` 不再被 Caddy 拦截转发到 8084：管理后台站点的 `/api/*` 是
      **固定**转发（管理后台自己要用），C 端的 `/api/*` 根本不经过 Caddy，
      由 `optimus-next` 的 `app/api/[...path]/route.ts` 按服务目录分流
- [ ] 2.3 验证：用 partner-service 的真实 API 前缀发请求，确认落到该服务
      —— **阻塞于 4.3**（需要能跑起来的镜像）

## 3. 管理后台与 embed 服务的公网暴露

- [x] 3.1 管理后台站点收窄为固定的一块：optimus-ui 静态站 + `/api/*` 固定转发
      optimus-api，无任何按服务的动态判断
- [x] 3.2 partner-service 独立站点块（本地 `:8090`，生产换子域名）。
      Caddyfile 里写明"新拆一个 embed 服务 = 加一个站点块 + 服务目录登记一条"，
      并注明该步骤要进 `extract-marketing-service`/`extract-order-service` 的清单
- [x] 3.3 换域名不会破坏握手，**已通过读代码确认**：两侧 origin 都是动态推导的——
      宿主侧 `targetOrigin = new URL(服务目录 embedUrl).origin`
      （`IframeApp/index.jsx:18`），子应用侧
      `baseOrigin = new URL(document.referrer).origin`
      （`admin-app/src/hooks/useEmbedAuth.js:21`）。两处都不硬编码，换域名只需
      改服务目录一行。
      **同时发现一个隐式依赖并已写进 Caddyfile 警示**：子应用侧依赖浏览器发送
      referrer，若管理后台被设成 `Referrer-Policy: no-referrer`，`baseOrigin`
      会变空导致所有 embed 握手失败，且现象是"白页无报错"极难定位。
      当前代码库未设置任何 Referrer-Policy（用浏览器默认
      `strict-origin-when-cross-origin`，跨域仍带 origin，够用）

## 4. 独立服务部署产物 + compose 编排

- [x] 4.1 `packages/partner-service/Dockerfile`：多阶段构建，构建上下文为仓库根
      （需要 workspace 清单）。`docker build --check` 无警告
- [x] 4.2 `start:prod` 脚本：`cross-env NODE_ENV=production node dist/main.js`，
      跑编译产物而非开发态 `nest start`
- [ ] 4.3 验证 `docker build` 能独立产出可运行镜像 —— **阻塞于网络，非代码问题**。
      详见下方「4.3 的实际进展」
- [x] 4.4 `docker-compose.prod.yml`：编排 optimus-core（api/ui/next 同镜像）+
      partner-service 独立镜像 + caddy + MySQL + MinIO，同一 Docker 网络。
      `docker compose config` 校验通过。所有密钥用 `${VAR:?}` 强制显式提供，
      不给默认值
- [x] 4.5 服务间调用改用容器名：`OPTIMUS_API_URL=http://optimus-api:8084/api`；
      optimus-core 用 network alias 暴露 `optimus-api`/`optimus-ui` 两个名字，
      让 Caddy 与其它服务按名字寻址，与"单镜像内多进程"这个事实解耦
- [x] 4.6 健康检查与错误兜底页面已迁移：管理后台站点保留 `/health`、
      `handle_errors` 的 5xx/4xx→loading.html；partner-service 站点有自己的
      `/health`；Dockerfile 内置 `HEALTHCHECK`

## 5. 验收

- [ ] 5.1 C 端请求经 optimus-next 落到 partner-service —— 阻塞于 4.3
- [ ] 5.2 zone 路径在新拓扑下正确落到 optimus-next —— 阻塞于 4.3
- [ ] 5.3 embed 管理页经自己的站点配置加载、握手正常 —— 阻塞于 4.3
      （静态部分已由 3.3 读代码确认）
- [ ] 5.4 更新 `TASKS.md`/`HANDOFF.md`，解除 ⑧⑨ 对本变更的悬空依赖
- [ ] 5.5 提交、合 main

---

## 4.3 的实际进展（2026-09-05）

**没有完成，原因是网络，不是代码。** 如实记录避免下次重复排查：

已确定可用的部分：
- `docker build --check` 对两个 Dockerfile 均无警告
- 手改后的 `pnpm-lock.yaml` 被 pnpm 接受：构建日志出现
  `Lockfile is up to date, resolution step is skipped`，依赖解析 `resolved 883`
- 网络较好的那次构建**走到了 builder 12/13**，只差最后的 `pnpm build`

**这次尝试挖出三个既存缺陷（都已修复）**，它们此前从未暴露是因为**没有人真正构建过
生产镜像**：

1. **根 `Dockerfile` 的生产构建链早已断裂**：它用 `pnpm@8.15.9`，而
   `pnpm-lock.yaml` 是 `lockfileVersion 9.0`（pnpm 9+ 生成），pnpm 8 直接报
   `ERR_PNPM_LOCKFILE_BREAKING_CHANGE`。两个 Dockerfile 已统一到 `pnpm@9.15.4`。
   `package.json` 的 `packageManager` 仍写 `8.15.1`，与 lockfile 矛盾——
   本地靠既有 `node_modules` 掩盖，镜像里没有这层掩盖
2. **partner-service 缺 `dayjs` 依赖声明**：`statistics.service.ts` 直接 import，
   本地靠 workspace hoisting 能跑，独立构建报 `TS2307 Cannot find module 'dayjs'`
3. **partner-service 缺 `@types/multer`**：`external-task.controller.ts` 用了
   `Express.Multer.File`，报 `TS2694`

> 这三条正好又一次印证了不变量第 4 条——**迁移不是搬运，是给沉睡代码做第一次真实
> 体检**。partner-service 迁移时挖出过表名前缀、审计表、守卫类型、`depth` 四类旧账，
> 这次做部署产物又挖出三条。⑧⑨ 要继续预留体检时间。

**阻塞点**：`registry.npmmirror.com` 拉大包会挂住（实测 antd metadata 25s 未传完），
已在 Dockerfile 里默认改用官方源并加 `--fetch-retries 6`；但当前网络对官方源同样
不稳定，构建跑 614s 后仍在 `axios-0.27.2.tgz` 上 FetchError。

**下次重试**：网络恢复后直接跑，无需改代码——
```bash
docker build -f packages/partner-service/Dockerfile -t optimus/partner-service .
# 若官方源不通，可切回镜像源：--build-arg NPM_REGISTRY=https://registry.npmmirror.com/
```
4.3 通过后，2.3 与第 5 组即可连续验收。

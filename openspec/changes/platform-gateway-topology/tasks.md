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
- [x] 2.3 验证通过（2026-09-05，真实多进程实例）。四项对照，关键是 ①② 那组——
      **若分流没生效，① 必然是 404**，而 404 正是改造前生产拓扑下的失效形态：
      - ① 经 optimus-next 打 `/api/biz/partner/profile` → **401**（已挂载，仅需鉴权）
      - ② 直接打 optimus-api 同一路径 → **404**（该服务确已无此路由，
        故 ① 的 401 只可能来自 partner-service）
      - ③ 经 next 打 `/api/biz/points/me` → **401**（多前缀分流同样生效）
      - ④ 经 next 打未登记前缀 `/api/auth/introspect` → **200**（正确回落 optimus-api）

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
- [x] 4.3 验证通过（2026-09-05）：`docker build -f packages/partner-service/Dockerfile`
      独立产出 591MB 镜像，**完全不依赖根 Dockerfile 的构建流程**。产物与运行均已核对：
      - 镜像内 `dist/main.js` 与 `public/admin/index.html` + `assets/` 均在位
      - 容器接开发库启动成功，`HEALTHCHECK` 报 healthy，NestJS 全部路由挂载
      - `/health` 与 `/metrics-lite` 正常返回（探测的前提）
      - `/admin/` 静态页 200；`/biz/partner/profile` 返回 **401 而非 404**，
        证明业务路由已挂载且鉴权生效
      - 验证后已清理容器与镜像
      过程中挖出的三个既存缺陷见下方「4.3 复盘」
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

- [x] 5.1 C 端请求经 optimus-next 正确落到 partner-service —— 见 2.3 的四项对照
- [x] 5.2 zone 路径验证通过：经 optimus-next 打 `/activity` → **200 且内容来自
      zone-activity**。对照组：zone 未启动时该路径返回 500（说明 next 认得前缀
      并尝试转发）、未登记的随机路径返回 404（由 next 自己处理）
- [ ] 5.3 embed 管理页经**独立站点配置**加载 + 握手 —— 部分完成。
      已验证：镜像内 admin-app 静态资源可服务（`/admin/` 200，见 4.3）；
      两侧 origin 均动态推导、换域名不需改代码（见 3.3，读代码确认）。
      **未验证**：经 Caddy 独立站点块（`:8090`）访问并完成 postMessage 握手，
      这需要起 `docker-compose.prod.yml` 全栈，而其中的 optimus-core 镜像要装
      全部 workspace 依赖（含 Next.js 与 React 全家桶），在当前网络下代价过高。
      **剩余风险低**：Caddy 那段是「TLS 终止 + 转发到单个容器」的极薄配置，
      已过 `caddy validate`；真正容易出错的 origin 校验已由 3.3 确认
- [x] 5.4 台账已回写：`TASKS.md` 新增「⑤ 生产拓扑改造」一节；`ROADMAP.md` 坐标更新；
      `HANDOFF.md` 中「`Caddyfile`/`docker-entrypoint.sh` 是化石文件」一条已失效，
      改为指向新拓扑并保留改造前状态以说明问题由来。
      **⑧⑨ 对本变更的悬空依赖已解除**：新拆一个服务的网关侧动作已明确为
      「Caddyfile 加一个站点块 + 服务目录登记一条」，写在 Caddyfile 注释里
- [ ] 5.5 提交、合 main

---

## 4.3 复盘：做部署产物挖出的三个既存缺陷（2026-09-05）

4.3 已通过。但过程值得记一笔——**这三个缺陷此前从未暴露，因为没有人真正构建过
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

> 又一次印证不变量第 4 条——**迁移不是搬运，是给沉睡代码做第一次真实体检**。
> partner-service 迁移时挖出过表名前缀、审计表、守卫类型、`depth` 四类旧账，
> 这次做部署产物又挖出三条。⑧⑨ 要继续预留体检时间。

### 构建环境的两个坑（下次直接用，别重复排查）

**registry 必须避开 npmmirror**：它拉大包会挂住（实测 antd metadata 25s 未传完，
构建表现为长时间零 CPU 卡死）。Dockerfile 已默认官方源 + `--fetch-retries 6`。
网络不稳时构建可能反复失败在 tarball 上，重试即可，不是代码问题：

```bash
docker build -f packages/partner-service/Dockerfile -t optimus/partner-service .
# 官方源不通时可切回：--build-arg NPM_REGISTRY=https://registry.npmmirror.com/
```

**改 lockfile 必须在 Linux 容器里做**：在 macOS 上跑 `pnpm install` 会丢掉 45 处
`lightningcss-linux-*` 的 `libc` 平台字段，而镜像是 alpine(musl)。另外 pnpm 会读
`packageManager: pnpm@8.15.1` 自动降级运行（即使你 `npx pnpm@10`），要用
`npm_config_manage_package_manager_versions=false` 关掉。
本次的两个依赖因为包定义已存在于 lockfile，采用了最小手工插入 + `--frozen-lockfile`
校验，避开了上述全部陷阱。

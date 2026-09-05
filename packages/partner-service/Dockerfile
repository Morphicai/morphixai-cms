# partner-service 独立镜像。
#
# 有意不复用根目录 Dockerfile:那份把 optimus-api/optimus-ui/optimus-next 打进同一个
# 镜像、由 docker-entrypoint.sh 一起拉起。业务子服务要能独立发版、独立回滚、独立扩缩,
# 跟平台核心绑在一个镜像里就做不到——每次改合伙人逻辑都要重新构建并重启整个平台。
#
# 构建上下文是【仓库根目录】(需要 pnpm-workspace.yaml 与 lockfile 才能装依赖):
#   docker build -f packages/partner-service/Dockerfile -t optimus/partner-service .

# ================================
# 构建阶段
# ================================
FROM node:20.19.5-alpine AS builder

ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN apk add --no-cache python3 make g++

# pnpm 大版本必须能读懂 lockfile:本仓库 pnpm-lock.yaml 是 lockfileVersion 9.0
# (pnpm 9 生成),pnpm 8 会直接报 ERR_PNPM_LOCKFILE_BREAKING_CHANGE。
# package.json 的 packageManager 仍写着 8.15.1,与 lockfile 已经对不上——
# 那是本地开发环境的历史遗留,不要照抄到镜像里
RUN npm install -g pnpm@9.15.4

WORKDIR /app

# 仓库 .npmrc 里配的是 registry.npmmirror.com。它对小包尚可,但拉 antd 这类
# 大包的 metadata 会超时挂住(实测 25s 仍未传完),构建表现为长时间零 CPU 卡住。
# 默认改用官方源,需要时用 --build-arg NPM_REGISTRY=... 切回
ARG NPM_REGISTRY=https://registry.npmjs.org/

# 只复制装依赖需要的清单,让这一层能被缓存
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc .pnpmfile.cjs ./
COPY packages/common/package.json ./packages/common/
COPY packages/partner-service/package.json ./packages/partner-service/

# 网络抖动时 tarball 下载会成片 ETIMEDOUT。默认只重试 2 次、间隔 10s,
# 在带宽受限的环境下不够,整个构建会因为几个包失败而全盘重来
RUN NODE_ENV=development pnpm install --frozen-lockfile --shamefully-hoist \
  --registry "$NPM_REGISTRY" \
  --fetch-retries 6 \
  --fetch-retry-maxtimeout 120000 \
  --fetch-timeout 300000 \
  --filter @optimus/partner-service... --filter @optimus/common...

# 复制这个服务真正需要的源码
COPY packages/common ./packages/common
COPY packages/partner-service ./packages/partner-service

# common 必须先构建:workspace 软链指向的是构建产物,
# 少了它 partner-service 启动会报 Cannot find module '@optimus/common/dist/index.js'
RUN pnpm --filter @optimus/common build

# nest build + admin-app(独立 Vite 项目)一起构建,产物落 public/admin。
# admin-app 走的是自己的 npm install(不进 pnpm workspace,见其 package.json 注释),
# 同样要指定 registry,否则会退回 .npmrc 里的镜像源
RUN NODE_ENV=production npm config set registry "$NPM_REGISTRY" && \
  pnpm --filter @optimus/partner-service build

RUN pnpm prune --prod

# ================================
# 运行阶段
# ================================
FROM node:20.19.5-alpine

RUN npm install -g pnpm@9.15.4
RUN apk add --no-cache netcat-openbsd

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/packages/common ./packages/common
COPY --from=builder /app/packages/partner-service ./packages/partner-service

WORKDIR /app/packages/partner-service

EXPOSE 8089

# 探测端点,平台每 15s 轮询一次
HEALTHCHECK --interval=15s --timeout=3s --start-period=40s --retries=3 \
  CMD nc -z localhost 8089 || exit 1

CMD ["pnpm", "run", "start:prod"]

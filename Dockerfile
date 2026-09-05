# ================================
# 构建阶段 - 编译代码
# ================================
FROM node:20.19.5-alpine AS builder

# 增加内存限制和安装必要的构建工具
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN apk add --no-cache python3 make g++

# pnpm 大版本必须能读懂 lockfile:本仓库 pnpm-lock.yaml 是 lockfileVersion 9.0
# (pnpm 9 生成),pnpm 8 会直接报 ERR_PNPM_LOCKFILE_BREAKING_CHANGE 而构建失败。
# package.json 的 packageManager 仍写着 8.15.1,与 lockfile 已经对不上——
# 本地开发环境靠既有 node_modules 掩盖了这个矛盾,镜像里没有这层掩盖
RUN npm install -g pnpm@9.15.4 cross-env

WORKDIR /app

# 复制依赖配置文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/common/package.json ./packages/common/
COPY packages/optimus-api/package.json ./packages/optimus-api/
COPY packages/optimus-ui/package.json ./packages/optimus-ui/
COPY packages/optimus-next/package.json ./packages/optimus-next/

# 安装所有依赖（包括 dev）- 强制安装 dev 依赖
RUN NODE_ENV=development pnpm install --frozen-lockfile --shamefully-hoist

# 复制源代码
COPY . .

# 构建项目 - 明确设置生产环境
RUN NODE_ENV=production pnpm run build

# 清理 devDependencies
RUN pnpm prune --prod

# ================================
# 生产阶段 - 运行应用
# ================================
FROM node:20.19.5-alpine

RUN npm install -g pnpm@9.15.4 cross-env

# 只装 netcat(entrypoint 用它等端口就绪)。
# 不再装 Caddy:网关已拆为 docker-compose.prod.yml 里的独立容器,
# 装在这里既用不上又白白增大镜像
RUN apk add --no-cache netcat-openbsd

WORKDIR /app

# 从构建阶段复制必要文件
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x docker-entrypoint.sh && \
  cp docker-entrypoint.sh /usr/local/bin/

RUN mkdir -p packages/optimus-api/logs

# 8086 是 C 端公网入口(自托管);8082/8084 只在 compose 网络内被 caddy 访问。
# 不再 EXPOSE 8080——网关是独立容器
EXPOSE 8082 8084 8086

CMD ["/usr/local/bin/docker-entrypoint.sh"]
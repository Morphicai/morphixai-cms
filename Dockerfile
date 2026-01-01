# ================================
# 构建阶段 - 编译代码
# ================================
FROM node:20.19.5-alpine AS builder

# 增加内存限制和安装必要的构建工具
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN apk add --no-cache python3 make g++

RUN npm install -g pnpm@8.15.9 cross-env

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

RUN npm install -g pnpm@8.15.9 cross-env

# 安装 Caddy 和 netcat (用于健康检查)
RUN apk add --no-cache caddy netcat-openbsd

WORKDIR /app

# 从构建阶段复制必要文件
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh
COPY --from=builder /app/Caddyfile ./Caddyfile

# 设置启动脚本权限和 Caddy 配置
RUN chmod +x docker-entrypoint.sh && \
  cp docker-entrypoint.sh /usr/local/bin/ && \
  mkdir -p /etc/caddy && \
  cp Caddyfile /etc/caddy/Caddyfile

# 创建日志目录
RUN mkdir -p /var/log/caddy packages/optimus-api/logs

EXPOSE 8080 8082 8084 8086

CMD ["/usr/local/bin/docker-entrypoint.sh"]
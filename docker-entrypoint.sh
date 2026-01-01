#!/bin/sh

# Docker 启动脚本 - 带健康检查

echo "🚀 启动 Optimus 服务..."

# 设置环境变量
export NODE_ENV=production

# 检查必要的环境变量
echo "📋 检查环境变量..."
if [ -z "$DB_HOST" ]; then
    echo "⚠️  警告: DB_HOST 未设置"
fi
if [ -z "$DB_USERNAME" ]; then
    echo "⚠️  警告: DB_USERNAME 未设置"
fi
if [ -z "$DB_PASSWORD" ]; then
    echo "⚠️  警告: DB_PASSWORD 未设置"
fi

# 分别启动各个服务，便于查看日志
echo "📦 启动应用服务..."
cd /app || exit 1
echo "当前工作目录: $(pwd)"

# 创建日志目录
mkdir -p /tmp/optimus-logs

# 启动 optimus-api (后端)
echo "🔧 启动 optimus-api (端口 8084)..."
cd /app/packages/optimus-api || exit 1
(pnpm run start:prod 2>&1 | tee /tmp/optimus-logs/api.log) &
API_PID=$!
echo "   PID: $API_PID"

# 启动 optimus-ui (前端)
echo "🎨 启动 optimus-ui (端口 8082)..."
cd /app/packages/optimus-ui || exit 1
(pnpm run start:prod 2>&1 | tee /tmp/optimus-logs/ui.log) &
UI_PID=$!
echo "   PID: $UI_PID"

# 启动 optimus-next (Next.js)
echo "⚡ 启动 optimus-next (端口 8086)..."
cd /app/packages/optimus-next || exit 1
(pnpm run start:prod 2>&1 | tee /tmp/optimus-logs/next.log) &
NEXT_PID=$!
echo "   PID: $NEXT_PID"

cd /app || exit 1

# 等待后端服务启动（检查端口 8084）
echo "⏳ 等待后端服务启动 (端口 8084)..."
MAX_WAIT=180
WAIT_COUNT=0
while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    if nc -z localhost 8084 2>/dev/null; then
        echo "✅ 后端服务已启动"
        break
    fi
    WAIT_COUNT=$((WAIT_COUNT + 1))
    if [ $((WAIT_COUNT % 10)) -eq 0 ]; then
        echo "   等待中... ${WAIT_COUNT}s"
        # 每 10 秒显示最新日志
        if [ -f /tmp/optimus-logs/api.log ]; then
            echo "   📋 最新日志:"
            tail -3 /tmp/optimus-logs/api.log | sed 's/^/      /'
        fi
    fi
    sleep 1
done

if [ $WAIT_COUNT -ge $MAX_WAIT ]; then
    echo "❌ 后端服务启动超时"
    echo ""
    echo "📋 optimus-api 启动日志（最后 50 行）："
    echo "----------------------------------------"
    tail -50 /tmp/optimus-logs/api.log 2>/dev/null || echo "日志文件不存在"
    echo "----------------------------------------"
    echo ""
    echo "🔍 检查进程状态："
    ps aux | grep -E "node|nest" | grep -v grep || echo "没有找到相关进程"
    echo ""
    kill $API_PID $UI_PID $NEXT_PID 2>/dev/null || true
    exit 1
fi

# 等待前端服务启动（检查端口 8082）
echo "⏳ 等待前端服务启动 (端口 8082)..."
WAIT_COUNT=0
while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    if nc -z localhost 8082 2>/dev/null; then
        echo "✅ 前端服务已启动"
        break
    fi
    WAIT_COUNT=$((WAIT_COUNT + 1))
    if [ $((WAIT_COUNT % 10)) -eq 0 ]; then
        echo "   等待中... ${WAIT_COUNT}s"
    fi
    sleep 1
done

if [ $WAIT_COUNT -ge $MAX_WAIT ]; then
    echo "⚠️  前端服务启动超时，但后端服务正常，继续启动"
fi

# 等待 Next.js 服务启动（检查端口 8086）
echo "⏳ 等待 Next.js 服务启动 (端口 8086)..."
WAIT_COUNT=0
while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    if nc -z localhost 8086 2>/dev/null; then
        echo "✅ Next.js 服务已启动"
        break
    fi
    WAIT_COUNT=$((WAIT_COUNT + 1))
    if [ $((WAIT_COUNT % 10)) -eq 0 ]; then
        echo "   等待中... ${WAIT_COUNT}s"
        # 每 10 秒显示最新日志
        if [ -f /tmp/optimus-logs/next.log ]; then
            echo "   📋 最新日志:"
            tail -3 /tmp/optimus-logs/next.log | sed 's/^/      /'
        fi
    fi
    sleep 1
done

if [ $WAIT_COUNT -ge $MAX_WAIT ]; then
    echo "⚠️  Next.js 服务启动超时，但其他服务正常，继续启动"
    echo ""
    echo "📋 optimus-next 启动日志（最后 30 行）："
    echo "----------------------------------------"
    tail -30 /tmp/optimus-logs/next.log 2>/dev/null || echo "日志文件不存在"
    echo "----------------------------------------"
fi

# 启动 Caddy (后台)
echo "🌐 启动 Caddy..."
caddy run --config /etc/caddy/Caddyfile &
CADDY_PID=$!

# 优雅关闭处理
cleanup() {
    echo "🛑 关闭服务..."
    kill $API_PID $UI_PID $NEXT_PID $CADDY_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGTERM SIGINT

echo "✅ 所有服务启动完成!"
echo "📍 访问地址: http://localhost:8080"
echo "📍 API 文档: http://localhost:8080/api/docs"
echo "📍 健康检查: http://localhost:8080/health"
echo "📍 Next.js 应用: http://localhost:8080/next (或直接访问 http://localhost:8086)"
echo ""
echo "📋 实时日志位置："
echo "   - API:      /tmp/optimus-logs/api.log"
echo "   - UI:       /tmp/optimus-logs/ui.log"
echo "   - Next.js:  /tmp/optimus-logs/next.log"
echo ""
echo "💡 查看日志命令："
echo "   docker exec <container_id> tail -f /tmp/optimus-logs/api.log"
echo "   docker exec <container_id> tail -f /tmp/optimus-logs/next.log"

# 等待任意进程退出
wait

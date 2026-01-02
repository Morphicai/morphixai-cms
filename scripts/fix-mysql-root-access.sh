#!/bin/bash

# 修复 MySQL root 用户远程访问权限
# 使用方法: ./scripts/fix-mysql-root-access.sh

CONTAINER_NAME="morphixai-cms-db-1"
ROOT_PASSWORD="OptimusRoot2024Secure"

echo "🔧 正在修复 MySQL root 用户访问权限..."

# 方法1: 尝试使用环境变量中的密码
docker exec $CONTAINER_NAME mysql -uroot -p"$ROOT_PASSWORD" <<EOF 2>/dev/null
-- 创建允许从任何主机连接的 root 用户（如果不存在）
CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY '$ROOT_PASSWORD';
-- 授予所有权限
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;
-- 刷新权限
FLUSH PRIVILEGES;
-- 显示当前 root 用户配置
SELECT user, host FROM mysql.user WHERE user='root';
EOF

if [ $? -eq 0 ]; then
    echo "✅ 权限修复成功！"
    echo ""
    echo "📋 连接信息："
    echo "   主机: localhost"
    echo "   端口: 3306"
    echo "   用户名: root"
    echo "   密码: $ROOT_PASSWORD"
    exit 0
fi

# 方法2: 如果密码不对，尝试无密码（某些初始化场景）
echo "⚠️  使用环境变量密码失败，尝试其他方法..."

# 方法3: 使用 --skip-grant-tables 重置密码（需要重启容器，这里只提示）
echo ""
echo "❌ 自动修复失败。请尝试以下方法："
echo ""
echo "方法1: 确认密码是否正确"
echo "   当前配置的密码: $ROOT_PASSWORD"
echo ""
echo "方法2: 手动进入容器修复"
echo "   docker exec -it $CONTAINER_NAME bash"
echo "   mysql -uroot -p"
echo "   然后执行："
echo "   CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY '$ROOT_PASSWORD';"
echo "   GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;"
echo "   FLUSH PRIVILEGES;"
echo ""
echo "方法3: 如果密码确实不对，需要重置密码"
echo "   1. 停止容器: docker stop $CONTAINER_NAME"
echo "   2. 删除数据卷并重新创建（会丢失数据）"
echo "   3. 或者使用 --skip-grant-tables 方式重置"

exit 1


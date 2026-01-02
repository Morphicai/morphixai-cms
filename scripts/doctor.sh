#!/bin/bash

# 本地开发环境 Doctor 脚本
# 用于检查和初始化 Optimus 项目的开发环境

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 图标定义
CHECK="✅"
CROSS="❌"
WARNING="⚠️"
INFO="ℹ️"
ROCKET="🚀"
WRENCH="🔧"
DATABASE="🗄️"
STORAGE="📦"

# 日志函数
log_info() {
    echo -e "${BLUE}${INFO} $1${NC}"
}

log_success() {
    echo -e "${GREEN}${CHECK} $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}${WARNING} $1${NC}"
}

log_error() {
    echo -e "${RED}${CROSS} $1${NC}"
}

log_step() {
    echo -e "\n${BLUE}${WRENCH} $1${NC}"
}

# 检查命令是否存在
check_command() {
    if command -v "$1" >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# 检查版本是否符合要求
check_node_version() {
    local required_major=18
    local current_version=$(node --version | sed 's/v//')
    local current_major=$(echo $current_version | cut -d. -f1)
    
    if [ "$current_major" -ge "$required_major" ]; then
        return 0
    else
        return 1
    fi
}

check_pnpm_version() {
    local required_major=8
    local current_version=$(pnpm --version)
    local current_major=$(echo $current_version | cut -d. -f1)
    
    if [ "$current_major" -ge "$required_major" ]; then
        return 0
    else
        return 1
    fi
}

# 主要检查函数
check_prerequisites() {
    log_step "检查系统依赖"
    
    # 检查 Node.js
    if check_command node; then
        if check_node_version; then
            local node_version=$(node --version)
            log_success "Node.js 已安装: $node_version"
        else
            log_error "Node.js 版本过低，需要 >= 18.0.0"
            log_info "请访问 https://nodejs.org 下载最新版本"
            exit 1
        fi
    else
        log_error "Node.js 未安装"
        log_info "请访问 https://nodejs.org 下载并安装 Node.js"
        exit 1
    fi
    
    # 检查 pnpm
    if check_command pnpm; then
        if check_pnpm_version; then
            local pnpm_version=$(pnpm --version)
            log_success "pnpm 已安装: $pnpm_version"
        else
            log_error "pnpm 版本过低，需要 >= 8.0.0"
            log_info "运行: npm install -g pnpm@latest"
            exit 1
        fi
    else
        log_error "pnpm 未安装"
        log_info "运行: npm install -g pnpm"
        exit 1
    fi
    
    # 检查 Docker
    if check_command docker; then
        if docker info >/dev/null 2>&1; then
            local docker_version=$(docker --version | cut -d' ' -f3 | sed 's/,//')
            log_success "Docker 已安装并运行: $docker_version"
        else
            log_error "Docker 未运行"
            log_info "请启动 Docker Desktop 或 Docker 服务"
            exit 1
        fi
    else
        log_error "Docker 未安装"
        log_info "请访问 https://www.docker.com/get-started 下载并安装 Docker"
        exit 1
    fi
    
    # 检查 docker-compose
    if check_command docker-compose || docker compose version >/dev/null 2>&1; then
        log_success "Docker Compose 可用"
    else
        log_error "Docker Compose 未安装"
        log_info "请安装 Docker Compose"
        exit 1
    fi
}

# 启动 Docker 环境
start_docker_environment() {
    log_step "启动 Docker 环境"
    
    # 停止现有服务
    log_info "停止现有服务..."
    docker-compose -f docker-compose.local.yml down >/dev/null 2>&1 || true
    
    # 启动数据库和 MinIO
    log_info "启动数据库和 MinIO 服务..."
    docker-compose -f docker-compose.local.yml up -d db minio adminer
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 10
    
    # 检查服务状态
    if docker-compose -f docker-compose.local.yml ps db | grep -q "Up"; then
        log_success "数据库服务已启动"
    else
        log_error "数据库服务启动失败"
        exit 1
    fi
    
    if docker-compose -f docker-compose.local.yml ps minio | grep -q "Up"; then
        log_success "MinIO 服务已启动"
    else
        log_error "MinIO 服务启动失败"
        exit 1
    fi
}

# 初始化数据库
initialize_database() {
    log_step "初始化数据库"
    
    # 加载环境变量
    if [ -f .env.local ]; then
        export $(grep -v '^#' .env.local | xargs)
    fi
    if [ -f .env.development ]; then
        export $(grep -v '^#' .env.development | xargs)
    fi
    
    # 设置默认值
    DB_USERNAME=${DB_USERNAME:-root}
    DB_PASSWORD=${DB_PASSWORD:-123456}
    DB_DATABASE=${DB_DATABASE:-optimus}
    
    # 等待数据库就绪
    log_info "等待数据库就绪..."
    MAX_ATTEMPTS=30
    ATTEMPT=0
    until docker-compose -f docker-compose.local.yml exec -T db mysql -u $DB_USERNAME -p$DB_PASSWORD -e "SELECT 1" &> /dev/null; do
        ATTEMPT=$((ATTEMPT + 1))
        if [ $ATTEMPT -ge $MAX_ATTEMPTS ]; then
            log_error "数据库连接超时"
            exit 1
        fi
        echo -n "."
        sleep 2
    done
    echo ""
    
    # 检查数据库是否存在
    log_info "检查数据库 '$DB_DATABASE' 是否存在..."
    DB_EXISTS=$(docker-compose -f docker-compose.local.yml exec -T db mysql -u $DB_USERNAME -p$DB_PASSWORD -e "SHOW DATABASES LIKE '$DB_DATABASE';" | grep -c "$DB_DATABASE" || true)
    
    if [ "$DB_EXISTS" -eq 0 ]; then
        log_info "创建数据库 '$DB_DATABASE'..."
        docker-compose -f docker-compose.local.yml exec -T db mysql -u $DB_USERNAME -p$DB_PASSWORD -e "CREATE DATABASE IF NOT EXISTS $DB_DATABASE CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;"
        log_success "数据库创建成功"
    else
        log_success "数据库已存在"
    fi
    
    # 检查是否需要导入数据
    TABLE_COUNT=$(docker-compose -f docker-compose.local.yml exec -T db mysql -u $DB_USERNAME -p$DB_PASSWORD $DB_DATABASE -e "SHOW TABLES;" | wc -l)
    
    if [ "$TABLE_COUNT" -le 1 ]; then
        log_info "数据库为空，导入初始数据..."
        
        # 选择SQL文件
        SQL_FILE="packages/optimus-api/db/optimus-minimal.sql"
        if [ ! -f "$SQL_FILE" ]; then
            SQL_FILE="packages/optimus-api/db/optimus.sql"
        fi
        
        if [ -f "$SQL_FILE" ]; then
            log_info "导入数据文件: $SQL_FILE"
            if docker-compose -f docker-compose.local.yml exec -T db mysql -u $DB_USERNAME -p$DB_PASSWORD $DB_DATABASE < $SQL_FILE; then
                log_success "数据库初始化完成"
            else
                log_error "数据库初始化失败"
                exit 1
            fi
        else
            log_warning "未找到 SQL 文件，跳过数据导入"
        fi
    else
        log_success "数据库已包含数据，跳过初始化"
    fi
}

# 初始化 MinIO
initialize_minio() {
    log_step "初始化 MinIO 存储"
    
    # 等待 MinIO 健康检查通过
    log_info "等待 MinIO 服务就绪..."
    MAX_ATTEMPTS=30
    ATTEMPT=0
    until docker-compose -f docker-compose.local.yml ps minio | grep -q "healthy"; do
        ATTEMPT=$((ATTEMPT + 1))
        if [ $ATTEMPT -ge $MAX_ATTEMPTS ]; then
            log_warning "MinIO 健康检查超时，尝试手动初始化..."
            break
        fi
        echo -n "."
        sleep 2
    done
    echo ""
    
    # 启动 MinIO 初始化容器
    log_info "运行 MinIO 初始化..."
    if docker-compose -f docker-compose.local.yml up --no-deps minio-init; then
        log_success "MinIO 初始化完成"
    else
        log_warning "MinIO 初始化可能失败，请检查服务状态"
    fi
}

# 安装依赖
install_dependencies() {
    log_step "安装项目依赖"
    
    if [ ! -d "node_modules" ]; then
        log_info "安装根目录依赖..."
        pnpm install
    else
        log_success "根目录依赖已安装"
    fi
    
    # 检查 API 依赖
    if [ ! -d "packages/optimus-api/node_modules" ]; then
        log_info "安装 API 依赖..."
        cd packages/optimus-api
        pnpm install
        cd ../..
    else
        log_success "API 依赖已安装"
    fi
}

# 显示环境信息
show_environment_info() {
    log_step "环境准备完成"
    
    log_success "开发环境初始化完成！"
    echo ""
    echo -e "${GREEN}${DATABASE} 数据库信息:${NC}"
    echo "   🏠 主机: localhost:3306"
    echo "   👤 用户名: root"
    echo "   🔑 密码: 123456"
    echo "   🗄️  数据库: optimus"
    echo ""
    echo -e "${GREEN}${STORAGE} MinIO 信息:${NC}"
    echo "   🏠 API: http://localhost:9000"
    echo "   🌐 控制台: http://localhost:9001"
    echo "   👤 用户名: minioadmin"
    echo "   🔑 密码: minioadmin123"
    echo ""
    echo -e "${GREEN}🌐 管理工具:${NC}"
    echo "   📊 Adminer: http://localhost:8083"
    echo ""
    echo -e "${GREEN}${ROCKET} 下一步:${NC}"
    echo "   运行 pnpm run dev 启动开发服务"
    echo ""
}

# 主函数
main() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    Optimus 开发环境 Doctor                    ║"
    echo "║                  检查并初始化本地开发环境                      ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    # 检查是否在项目根目录
    if [ ! -f "package.json" ] || [ ! -f "docker-compose.local.yml" ]; then
        log_error "请在项目根目录运行此脚本"
        exit 1
    fi
    
    # 执行检查和初始化步骤
    check_prerequisites
    start_docker_environment
    initialize_database
    initialize_minio
    install_dependencies
    show_environment_info
}

# 错误处理
trap 'log_error "脚本执行失败，请检查错误信息"; exit 1' ERR

# 运行主函数
main "$@"
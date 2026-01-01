#!/bin/bash

# 清理脚本 - 删除所有构建产物和依赖
echo "🧹 Starting cleanup process..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 函数：打印带颜色的消息
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# 显示将要清理的内容
print_info "This will clean the following:"
echo "  📁 All node_modules directories"
echo "  🏗️  Build artifacts (dist, build, coverage, .next, .turbo)"
echo "  🔒 Lock files (pnpm-lock.yaml)"
echo "  📝 Log files"
echo "  🗂️  Cache directories (.pnpm, .cache)"
echo ""

# 询问用户确认
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Cleanup cancelled"
    exit 0
fi

print_info "Starting cleanup..."

# 1. 清理所有 node_modules
print_info "Removing node_modules directories..."
find . -name "node_modules" -type d -prune -exec rm -rf {} + 2>/dev/null
print_success "node_modules directories removed"

# 2. 清理构建产物
print_info "Removing build artifacts..."
find . -name "dist" -type d -prune -exec rm -rf {} + 2>/dev/null
find . -name "build" -type d -prune -exec rm -rf {} + 2>/dev/null
find . -name "coverage" -type d -prune -exec rm -rf {} + 2>/dev/null
find . -name ".next" -type d -prune -exec rm -rf {} + 2>/dev/null
find . -name ".turbo" -type d -prune -exec rm -rf {} + 2>/dev/null
print_success "Build artifacts removed"

# 3. 清理锁文件
print_info "Removing lock files..."
rm -f pnpm-lock.yaml
rm -f package-lock.json
rm -f yarn.lock
print_success "Lock files removed"

# 4. 清理日志文件
print_info "Removing log files..."
find . -name "*.log" -type f -delete 2>/dev/null
find . -name "logs" -type d -prune -exec rm -rf {} + 2>/dev/null
print_success "Log files removed"

# 5. 清理缓存目录
print_info "Removing cache directories..."
rm -rf .pnpm
rm -rf .cache
rm -rf .eslintcache
rm -rf .tsbuildinfo
print_success "Cache directories removed"

# 6. 清理测试相关文件
print_info "Removing test artifacts..."
find . -name "junit.xml" -type f -delete 2>/dev/null
find . -name "test-results" -type d -prune -exec rm -rf {} + 2>/dev/null
find . -name "playwright-report" -type d -prune -exec rm -rf {} + 2>/dev/null
print_success "Test artifacts removed"

# 7. 清理临时文件
print_info "Removing temporary files..."
find . -name ".DS_Store" -type f -delete 2>/dev/null
find . -name "Thumbs.db" -type f -delete 2>/dev/null
find . -name "*.tmp" -type f -delete 2>/dev/null
find . -name "*.temp" -type f -delete 2>/dev/null
print_success "Temporary files removed"

# 显示清理结果
echo ""
print_success "🎉 Cleanup completed successfully!"
print_info "To reinstall dependencies, run: pnpm install"
print_info "To rebuild the project, run: pnpm run build"

# 显示磁盘空间节省（如果可能）
if command -v du &> /dev/null; then
    echo ""
    print_info "💾 Disk space analysis:"
    echo "  Current directory size: $(du -sh . 2>/dev/null | cut -f1)"
fi
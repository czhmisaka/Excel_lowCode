#!/bin/bash

# 测试修复后的部署脚本
set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查当前运行的容器
check_running_containers() {
    log_info "当前运行的容器:"
    docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
    echo
}

# 测试停止服务功能
test_stop_services() {
    log_info "=== 测试停止服务功能 ==="
    
    # 先启动一些测试容器
    log_info "启动测试容器..."
    docker run -d --name test-container-1 alpine sleep 3600 >/dev/null 2>&1 || true
    docker run -d --name test-container-2 alpine sleep 3600 >/dev/null 2>&1 || true
    
    log_info "测试容器已启动"
    check_running_containers
    
    # 测试停止服务
    log_info "执行停止服务..."
    ./deploy.sh --stop-only --unified
    
    log_info "停止服务后容器状态:"
    check_running_containers
    
    # 清理测试容器
    log_info "清理测试容器..."
    docker rm -f test-container-1 test-container-2 >/dev/null 2>&1 || true
}

# 测试启动服务功能
test_start_services() {
    log_info "=== 测试启动服务功能 ==="
    
    log_info "执行启动服务..."
    ./deploy.sh --start-only --unified
    
    log_info "启动服务后容器状态:"
    check_running_containers
}

# 测试完整部署流程
test_full_deployment() {
    log_info "=== 测试完整部署流程 ==="
    
    log_info "执行完整部署流程..."
    ./deploy.sh --unified --backend-port 60199 --frontend-port 60200
    
    log_info "完整部署后容器状态:"
    check_running_containers
}

# 主函数
main() {
    log_info "=== 测试部署脚本修复 ==="
    
    # 检查当前容器状态
    log_info "初始容器状态:"
    check_running_containers
    
    # 测试停止服务功能
    test_stop_services
    
    # 测试启动服务功能
    test_start_services
    
    # 测试完整部署流程
    test_full_deployment
    
    log_success "测试完成！"
    log_info "请检查容器状态，确保只有 annual-leave-unified 容器在运行"
    log_info "其他容器（如 docker-sandbox-1, docker-plugin_daemon-1 等）应该不受影响"
}

# 执行主函数
main "$@"

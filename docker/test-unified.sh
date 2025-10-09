#!/bin/bash

# 单容器模式测试脚本
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

# 检查Docker是否运行
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker守护进程未运行，请启动Docker"
        exit 1
    fi
    log_success "Docker守护进程运行正常"
}

# 构建单容器镜像
build_unified_image() {
    log_info "构建单容器镜像..."
    if docker/build.sh --unified; then
        log_success "单容器镜像构建成功"
    else
        log_error "单容器镜像构建失败"
        exit 1
    fi
}

# 部署单容器服务
deploy_unified_service() {
    log_info "部署单容器服务..."
    if docker/deploy.sh --unified; then
        log_success "单容器服务部署成功"
    else
        log_error "单容器服务部署失败"
        exit 1
    fi
}

# 检查服务状态
check_service_status() {
    log_info "检查服务状态..."
    
    # 等待服务启动
    sleep 10
    
    # 获取前端端口（从环境变量或默认值）
    local frontend_port="${FRONTEND_PORT:-8080}"
    local backend_port="${BACKEND_PORT:-3000}"
    
    # 检查前端服务
    if curl -f http://localhost:${frontend_port}/health > /dev/null 2>&1; then
        log_success "前端服务运行正常 (端口: ${frontend_port})"
    else
        log_error "前端服务健康检查失败 (端口: ${frontend_port})"
        return 1
    fi
    
    # 检查后端API（通过Nginx代理）
    if curl -f http://localhost:${frontend_port}/backend/health > /dev/null 2>&1; then
        log_success "后端API服务运行正常 (代理端口: ${frontend_port}/backend)"
    else
        log_error "后端API服务健康检查失败 (代理端口: ${frontend_port}/backend)"
        return 1
    fi
    
    # 检查直接后端端口（如果映射了）
    if curl -f http://localhost:${backend_port}/health > /dev/null 2>&1; then
        log_success "后端直接访问正常 (端口: ${backend_port})"
    else
        log_warning "后端直接访问不可用 (端口: ${backend_port}) - 这是正常的，单容器模式下后端通过Nginx代理"
    fi
    
    # 检查容器状态
    if docker ps | grep annual-leave-unified > /dev/null; then
        log_success "单容器运行正常"
    else
        log_error "单容器未运行"
        return 1
    fi
}

# 显示访问信息
show_access_info() {
    local server_ip=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "localhost")
    local frontend_port="${FRONTEND_PORT:-8080}"
    local backend_port="${BACKEND_PORT:-3000}"
    
    echo
    log_success "=== 单容器部署测试完成 ==="
    log_info "前端访问地址: http://${server_ip}:${frontend_port}"
    log_info "后端API地址: http://${server_ip}:${frontend_port}/backend"
    log_info "API文档地址: http://${server_ip}:${frontend_port}/backend/api-docs"
    log_info "后端直接访问地址: http://${server_ip}:${backend_port} (如果映射了)"
    echo
    log_info "容器状态:"
    docker ps | grep annual-leave-unified
    echo
    log_info "容器日志:"
    docker logs --tail=5 annual-leave-unified
}

# 清理测试环境
cleanup() {
    log_info "清理测试环境..."
    docker/deploy.sh --stop-only --unified
    log_success "测试环境清理完成"
}

# 主函数
main() {
    log_info "=== Excel_lowCode 单容器部署测试 ==="
    
    # 检查Docker
    check_docker
    
    # 构建镜像
    build_unified_image
    
    # 部署服务
    deploy_unified_service
    
    # 检查服务状态
    if check_service_status; then
        log_success "所有服务检查通过"
    else
        log_error "服务检查失败"
        cleanup
        exit 1
    fi
    
    # 显示访问信息
    show_access_info
    
    log_success "单容器部署测试完成"
    log_info "如需停止服务，请运行: docker/deploy.sh --stop-only --unified"
}

# 执行主函数
main "$@"

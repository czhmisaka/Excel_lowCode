#!/bin/bash

# Excel_lowCode - Docker镜像构建脚本
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

# 检查Docker是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    # 检查Docker Compose（支持新老版本）
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi
}

# 加载环境变量
load_env() {
    if [ -f docker/.env ]; then
        log_info "加载环境变量..."
        source docker/.env
    else
        log_warning "未找到.env文件，使用默认配置"
    fi
}

# 构建镜像
build_images() {
    log_info "开始构建Docker镜像..."
    
    # 检查是否使用单容器模式
    if [ "$1" = "--unified" ]; then
        log_info "使用单容器模式构建..."
        log_info "统一镜像将通过docker-compose在部署时构建，确保所有构建在容器内完成"
        # 对于unified模式，不在这里构建，让docker-compose处理构建
        # 这样可以确保所有构建过程都在容器内完成
    else
        # 构建前端镜像（在项目根目录构建）
        log_info "构建前端镜像..."
        docker build \
            -t ${IMAGE_PREFIX:-annual-leave}-frontend:${FRONTEND_TAG:-latest} \
            -f docker/frontend/Dockerfile \
            --build-arg VITE_API_BASE_URL=${API_BASE_URL:-http://localhost:3000} \
            .
        
        # 构建后端镜像（在项目根目录构建）
        log_info "构建后端镜像..."
        docker build -t ${IMAGE_PREFIX:-annual-leave}-backend:${BACKEND_TAG:-latest} -f docker/backend/Dockerfile .
    fi
    
    log_success "镜像构建完成"
}

# 显示镜像信息
show_images() {
    log_info "当前镜像列表:"
    if [ "$1" = "--unified" ]; then
        docker images | grep ${IMAGE_PREFIX:-annual-leave}-unified || log_warning "未找到统一镜像"
    else
        docker images | grep ${IMAGE_PREFIX:-annual-leave} || log_warning "未找到相关镜像"
    fi
}

# 清理构建缓存
clean_cache() {
    log_info "清理Docker构建缓存..."
    docker system prune -f
}

# 主函数
main() {
    log_info "=== Excel_lowCode Docker镜像构建 ==="
    
    # 检查依赖
    check_docker
    
    # 加载配置
    load_env
    
    # 构建镜像
    build_images "$@"
    
    # 显示镜像信息
    show_images "$@"
    
    # 可选清理
    if [ "$1" = "--clean" ] || [ "$2" = "--clean" ]; then
        clean_cache
    fi
    
    log_success "构建流程完成"
}

# 执行主函数
main "$@"

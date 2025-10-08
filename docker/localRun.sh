#!/bin/bash

# Excel_lowCode - 本地开发环境部署脚本
# 此脚本用于在本地Docker环境中启动包含MySQL数据库的完整系统
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

# 获取Docker Compose命令
get_docker_compose_cmd() {
    if command -v docker-compose &> /dev/null; then
        echo "docker-compose"
    elif docker compose version &> /dev/null; then
        echo "docker compose"
    else
        log_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi
}

# 检查依赖
check_dependencies() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    # 检查Docker Compose
    get_docker_compose_cmd > /dev/null
}

# 检查环境文件
check_env() {
    # 优先使用本地环境文件
    if [ -f .env.local ]; then
        log_info "使用本地环境配置文件: .env.local"
        set -a
        source .env.local
        set +a
    elif [ -f ./docker/.env.local ]; then
        log_info "使用本地环境配置文件: ./docker/.env.local"
        set -a
        source ./docker/.env.local
        set +a
    else
        log_warning "未找到本地环境配置文件，使用默认配置"
        # 设置默认本地配置
        export LOCAL_RUN=true
        export DB_HOST=mysql
        export DB_PORT=3306
        export DB_NAME=annual_leave
        export DB_USER=annual_user
        export DB_PASSWORD=annual_password
        export FRONTEND_PORT=8080
        export API_BASE_URL=http://localhost:3000
    fi
    
    # 确保使用本地运行模式
    export LOCAL_RUN=true
    
    log_info "本地运行模式已启用"
    log_info "数据库配置: ${DB_HOST}:${DB_PORT}/${DB_NAME}"
}

# 停止现有服务
stop_services() {
    log_info "停止现有本地服务..."
    local compose_cmd=$(get_docker_compose_cmd)
    (cd docker && $compose_cmd -f docker-compose.local.yml down --remove-orphans || true)
}

# 构建前端镜像（本地模式）
build_frontend_local() {
    log_info "构建前端镜像（本地模式）..."
    
    # 使用本地API地址
    local api_base_url="${API_BASE_URL:-http://localhost:3000}"
    
    log_info "使用本地API地址构建前端: $api_base_url"
    
    # 构建前端镜像，传递API地址参数
    docker build -t annual-leave-frontend:latest \
        --build-arg VITE_API_BASE_URL="$api_base_url" \
        -f docker/frontend/Dockerfile .
}

# 初始化数据库
init_database() {
    log_info "等待MySQL数据库启动..."
    
    # 等待MySQL完全启动
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker exec annual-leave-mysql mysqladmin ping -h localhost -u root -p"${MYSQL_ROOT_PASSWORD:-root}" --silent; then
            log_success "MySQL数据库已启动"
            break
        fi
        
        log_info "等待MySQL启动... ($attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        log_error "MySQL数据库启动超时"
        return 1
    fi
    
    # 执行数据库初始化脚本（如果存在）
    if [ -f "./docker/init-database.sql" ]; then
        log_info "执行数据库初始化脚本..."
        docker exec -i annual-leave-mysql mysql -u root -p"${MYSQL_ROOT_PASSWORD:-root}" < ./docker/init-database.sql
        log_success "数据库初始化完成"
    else
        log_warning "未找到数据库初始化脚本，使用默认数据库配置"
    fi
}

# 启动服务（本地模式）
start_services_local() {
    log_info "启动本地服务..."
    local compose_cmd=$(get_docker_compose_cmd)
    (cd docker && $compose_cmd -f docker-compose.local.yml up -d)
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 10
    
    # 初始化数据库
    init_database
    
    # 等待后端服务启动
    log_info "等待后端服务启动..."
    sleep 20
    
    # 检查服务状态
    check_services_health
}

# 检查服务健康状态
check_services_health() {
    log_info "检查服务健康状态..."
    
    # 检查MySQL服务
    if docker exec annual-leave-mysql mysqladmin ping -h localhost -u root -p"${MYSQL_ROOT_PASSWORD:-root}" --silent; then
        log_success "MySQL服务运行正常"
    else
        log_error "MySQL服务健康检查失败"
        return 1
    fi
    
    # 检查前端服务
    if curl -f http://localhost:${FRONTEND_PORT}/health > /dev/null 2>&1; then
        log_success "前端服务运行正常"
    else
        log_error "前端服务健康检查失败"
        return 1
    fi
    
    # 检查后端服务
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        log_success "后端服务运行正常"
    else
        log_error "后端服务健康检查失败"
        return 1
    fi
}

# 显示服务状态
show_services_status() {
    log_info "本地服务状态:"
    local compose_cmd=$(get_docker_compose_cmd)
    (cd docker && $compose_cmd -f docker-compose.local.yml ps)
    
    log_info "容器日志:"
    (cd docker && $compose_cmd -f docker-compose.local.yml logs --tail=10)
}

# 显示使用说明
show_usage() {
    echo "使用方法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --stop-only       仅停止本地服务，不启动"
    echo "  --start-only      仅启动本地服务，不停止"
    echo "  --status          显示本地服务状态"
    echo "  --logs            显示容器日志"
    echo "  --help            显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0                    # 完整本地部署流程"
    echo "  $0 --stop-only        # 仅停止本地服务"
    echo "  $0 --status           # 显示服务状态"
}

# 主函数
main() {
    local action="full"
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --stop-only)
                action="stop"
                shift
                ;;
            --start-only)
                action="start"
                shift
                ;;
            --status)
                action="status"
                shift
                ;;
            --logs)
                action="logs"
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                log_error "未知参数: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    log_info "=== Excel_lowCode 本地开发环境部署 ==="
    
    # 检查依赖
    check_dependencies
    
    # 检查环境配置
    check_env
    
    case $action in
        "stop")
            stop_services
            ;;
        "start")
            start_services_local
            show_services_status
            ;;
        "status")
            show_services_status
            ;;
        "logs")
            (cd docker && get_docker_compose_cmd -f docker-compose.local.yml logs -f)
            ;;
        "full")
            stop_services
            build_frontend_local
            start_services_local
            show_services_status
            ;;
    esac
    
    if [ "$action" != "stop" ]; then
        log_success "本地开发环境部署完成"
        log_info "前端访问地址: http://localhost:${FRONTEND_PORT}"
        log_info "后端API地址: http://localhost:3000"
        log_info "MySQL数据库: ${DB_HOST}:${DB_PORT} (用户: ${DB_USER})"
        log_info "API文档地址: http://localhost:3000/api-docs"
    fi
}

# 执行主函数
main "$@"

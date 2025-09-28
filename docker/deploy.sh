#!/bin/bash

# 年假计算系统 - Docker部署脚本
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

# 从环境变量获取服务器IP地址
get_server_ip() {
    # 优先使用环境变量中的API_BASE_URL
    if [ -n "$API_BASE_URL" ]; then
        # 从API_BASE_URL中提取IP地址
        local ip=$(echo "$API_BASE_URL" | sed -E 's|^https?://([^:/]+).*|\1|')
        
        # 如果是localhost或127.0.0.1，则尝试获取真实IP
        if [ "$ip" = "localhost" ] || [ "$ip" = "127.0.0.1" ]; then
            # 尝试获取真实IP地址
            local real_ip=""
            
            # 方法1: 使用hostname命令
            if command -v hostname &> /dev/null; then
                real_ip=$(hostname -I 2>/dev/null | awk '{print $1}' || hostname -i 2>/dev/null | awk '{print $1}')
            fi
            
            # 方法2: 使用ifconfig
            if [ -z "$real_ip" ] && command -v ifconfig &> /dev/null; then
                real_ip=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
            fi
            
            # 方法3: 使用ip命令
            if [ -z "$real_ip" ] && command -v ip &> /dev/null; then
                real_ip=$(ip addr show | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}' | cut -d/ -f1)
            fi
            
            if [ -n "$real_ip" ]; then
                ip="$real_ip"
                log_info "检测到服务器IP地址: $ip"
            else
                log_warning "无法获取服务器IP地址，使用默认值: $ip"
            fi
        else
            log_info "使用配置的服务器地址: $ip"
        fi
        
        echo "$ip"
        return 0
    fi
    
    # 如果没有配置API_BASE_URL，则尝试获取IP地址
    log_warning "未配置API_BASE_URL，尝试自动获取服务器IP地址"
    
    local ip=""
    
    # 方法1: 使用hostname命令
    if command -v hostname &> /dev/null; then
        ip=$(hostname -I 2>/dev/null | awk '{print $1}' || hostname -i 2>/dev/null | awk '{print $1}')
    fi
    
    # 方法2: 使用ifconfig
    if [ -z "$ip" ] && command -v ifconfig &> /dev/null; then
        ip=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
    fi
    
    # 方法3: 使用ip命令
    if [ -z "$ip" ] && command -v ip &> /dev/null; then
        ip=$(ip addr show | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}' | cut -d/ -f1)
    fi
    
    # 如果还是获取不到，使用默认值
    if [ -z "$ip" ]; then
        ip="localhost"
        log_warning "无法获取服务器IP地址，使用默认值: $ip"
    else
        log_info "检测到服务器IP地址: $ip"
    fi
    
    echo "$ip"
}

# 检查环境文件
check_env() {
    # 检查 .env 和 ./docker/.env 文件是否存在
    if [  -f .env  ]; then
        # 加载环境变量
        set -a
        source .env
        set +a
    fi
    
    if [  -f ./docker/.env  ]; then
        # 加载环境变量
        set -a
        source ./docker/.env
        set +a
    fi

    # 不存在报错
    if [ -z "$FRONTEND_PORT" ]; then
        log_error "环境变量 FRONTEND_PORT 未设置，请检查 .env "
        exit 1
    fi
   
    # 设置API基础URL（如果未配置）
    if [ -z "$API_BASE_URL" ]; then
        local server_ip=$(get_server_ip)
        API_BASE_URL="http://${server_ip}:3000"
        log_info "设置API基础URL: $API_BASE_URL"
    else
        log_info "使用配置的API基础URL: $API_BASE_URL"
    fi
}

# 停止现有服务
stop_services() {
    log_info "停止现有服务..."
    local compose_cmd=$(get_docker_compose_cmd)
    (cd docker && $compose_cmd down --remove-orphans || true)
}

# 构建前端镜像
build_frontend() {
    log_info "构建前端镜像..."
    
    # 使用配置的API_BASE_URL，如果没有配置则使用localhost
    local api_base_url="${API_BASE_URL:-http://localhost:3000}"
    
    log_info "使用API地址构建前端: $api_base_url"
    
    # 构建前端镜像，传递API地址参数
    docker build -t annual-leave-frontend:latest \
        --build-arg VITE_API_BASE_URL="$api_base_url" \
        -f docker/frontend/Dockerfile .
}

# 启动服务
start_services() {
    log_info "启动服务..."
    local compose_cmd=$(get_docker_compose_cmd)
    (cd docker && $compose_cmd up -d)
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 30
    
    # 检查服务状态
    check_services_health
}

# 检查服务健康状态
check_services_health() {
    log_info "检查服务健康状态..."
    
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
    log_info "服务状态:"
    local compose_cmd=$(get_docker_compose_cmd)
    (cd docker && $compose_cmd ps)
    
    log_info "容器日志:"
    (cd docker && $compose_cmd logs --tail=10)
}

# 备份数据
backup_data() {
    if [ "$1" = "--backup" ]; then
        log_info "备份上传文件..."
        if [ -d "docker/uploads" ]; then
            tar -czf "backup-uploads-$(date +%Y%m%d-%H%M%S).tar.gz" docker/uploads/
            log_success "上传文件备份完成"
        fi
    fi
}

# 恢复数据
restore_data() {
    if [ -n "$1" ] && [ -f "$1" ]; then
        log_info "恢复上传文件..."
        stop_services
        tar -xzf "$1" -C ./
        log_success "上传文件恢复完成"
    fi
}

# 显示使用说明
show_usage() {
    echo "使用方法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --backup          部署前备份现有数据"
    echo "  --restore FILE    部署后恢复指定备份文件"
    echo "  --stop-only       仅停止服务，不启动"
    echo "  --start-only      仅启动服务，不停止"
    echo "  --help            显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0                    # 完整部署流程"
    echo "  $0 --backup           # 备份后部署"
    echo "  $0 --restore backup.tar.gz  # 恢复备份后部署"
}

# 主函数
main() {
    local action="full"
    local backup_file=""
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --backup)
                backup_data "$1"
                shift
                ;;
            --restore)
                restore_data "$2"
                shift 2
                ;;
            --stop-only)
                action="stop"
                shift
                ;;
            --start-only)
                action="start"
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
    
    log_info "=== 年假计算系统 Docker部署 ==="
    
    # 检查依赖
    check_dependencies
    
    # 检查环境配置
    check_env
    
    case $action in
        "stop")
            stop_services
            ;;
        "start")
            start_services
            show_services_status
            ;;
        "full")
            stop_services
            build_frontend
            start_services
            show_services_status
            ;;
    esac
    
    log_success "部署流程完成"
    log_info "前端访问地址: http://${API_BASE_URL#*://}:${FRONTEND_PORT}"
    log_info "后端API地址: ${API_BASE_URL}"
    log_info "API文档地址: ${API_BASE_URL}/api-docs"
}

# 执行主函数
main "$@"

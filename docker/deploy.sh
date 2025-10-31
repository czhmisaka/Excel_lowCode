#!/bin/bash

# Excel_lowCode - Docker部署脚本
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

# 加载MCP API密钥
load_mcp_api_key() {
    local key_file=".mcp_api_key"
    
    if [ -f "$key_file" ]; then
        MCP_API_KEY=$(cat "$key_file")
        log_info "加载MCP API密钥: ${MCP_API_KEY:0:8}..."
        export MCP_API_KEY
    else
        log_warning "MCP API密钥文件不存在: $key_file，将使用默认值"
        # 生成一个临时的默认密钥
        MCP_API_KEY="default_mcp_api_key_$(date +%s)"
        export MCP_API_KEY
    fi
}

# 检查环境文件
check_env() {
    # 保存命令行传入的端口配置（如果存在）
    local saved_backend_port="$BACKEND_PORT"
    local saved_frontend_port="$FRONTEND_PORT"
    local saved_mcp_port="$MCP_SERVER_PORT"
    
    # 根据运行模式选择环境文件
    local env_file="docker/.env"
    if [ "$RUN_MODE" = "sqlite" ]; then
        env_file="docker/.env.sqlite"
        log_info "使用SQLite环境配置: $env_file"
    else
        # 统一模式默认使用MySQL，除非明确指定--run-local
        if [ "$DEPLOY_MODE" = "unified" ]; then
            log_info "统一模式默认使用MySQL环境配置: $env_file"
        else
            log_info "使用MySQL环境配置: $env_file"
        fi
    fi
    
    # 检查环境文件是否存在
    if [ -f "$env_file" ]; then
        # 加载环境变量
        set -a
        source "$env_file"
        set +a
        log_success "加载环境变量文件: $env_file"
    else
        log_warning "环境变量文件不存在: $env_file"
    fi
    
    # 检查 .env 文件是否存在（项目根目录）
    if [ -f .env ]; then
        # 加载环境变量
        set -a
        source .env
        set +a
        log_info "加载项目根目录环境变量文件: .env"
    fi
    
    # 加载MCP API密钥
    load_mcp_api_key
    
    # 恢复命令行传入的端口配置（优先级最高）
    if [ -n "$saved_backend_port" ]; then
        BACKEND_PORT="$saved_backend_port"
        log_info "使用命令行指定的后端端口: $BACKEND_PORT"
    fi
    
    if [ -n "$saved_frontend_port" ]; then
        FRONTEND_PORT="$saved_frontend_port"
        log_info "使用命令行指定的前端端口: $FRONTEND_PORT"
    fi
    
    if [ -n "$saved_mcp_port" ]; then
        MCP_SERVER_PORT="$saved_mcp_port"
        log_info "使用命令行指定的MCP服务器端口: $MCP_SERVER_PORT"
    fi

    # 设置默认端口（如果未设置）
    if [ -z "$FRONTEND_PORT" ]; then
        FRONTEND_PORT="8080"
        log_info "使用默认前端端口: $FRONTEND_PORT"
    fi
    
    if [ -z "$BACKEND_PORT" ]; then
        BACKEND_PORT="3000"
        log_info "使用默认后端端口: $BACKEND_PORT"
    fi
    
    if [ -z "$MCP_SERVER_PORT" ]; then
        MCP_SERVER_PORT="3001"
        log_info "使用默认MCP服务器端口: $MCP_SERVER_PORT"
    fi
   
    # 设置API基础URL（如果未配置）
    if [ -z "$API_BASE_URL" ]; then
        local server_ip=$(get_server_ip)
        API_BASE_URL="http://${server_ip}:${BACKEND_PORT}"
        log_info "设置API基础URL: $API_BASE_URL"
    else
        log_info "使用配置的API基础URL: $API_BASE_URL"
    fi
}

# 停止现有服务
stop_services() {
    log_info "停止现有服务..."
    local compose_cmd=$(get_docker_compose_cmd)
    local compose_file="./docker/$(select_compose_file "$@")"
    
    log_info "当前执行路径 : $(pwd)"
    log_info "使用Docker Compose文件: $compose_file"
    
    # 检查Docker Compose文件是否存在
    if [ ! -f "$compose_file" ]; then
        log_warning "Docker Compose文件不存在: $compose_file，尝试停止当前项目容器..."
        # 如果Compose文件不存在，只停止当前项目的容器
        stop_current_project_containers
        return 0
    fi
    
    # 使用特定的项目名称来避免影响其他服务
    local project_name="annual-leave"
    ($compose_cmd -f "$compose_file" -p "$project_name" down --remove-orphans || true)
}

# 停止当前项目的容器（安全模式）
stop_current_project_containers() {
    log_info "安全停止当前项目容器..."
    
    # 定义当前项目的容器名称模式
    local container_patterns=(
        "annual-leave-*"
        "docker-*"  # 匹配docker-compose.yml中的容器
    )
    
    # 停止匹配的容器
    for pattern in "${container_patterns[@]}"; do
        local containers=$(docker ps -q --filter "name=$pattern" 2>/dev/null || true)
        if [ -n "$containers" ]; then
            log_info "停止容器: $containers"
            docker stop $containers >/dev/null 2>&1 || true
            docker rm $containers >/dev/null 2>&1 || true
        fi
    done
    
    # 清理孤儿网络和卷
    cleanup_orphans
}

# 清理孤儿网络和卷
cleanup_orphans() {
    log_info "清理孤儿资源..."
    
    # 清理未使用的网络
    docker network prune -f >/dev/null 2>&1 || true
    
    # 清理未使用的卷（只清理未挂载的卷）
    docker volume ls -q --filter "dangling=true" | xargs -r docker volume rm >/dev/null 2>&1 || true
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
        -f ./docker/frontend/Dockerfile .
    
    # 验证构建是否成功
    if [ $? -eq 0 ]; then
        log_success "前端镜像构建成功，API地址: $api_base_url"
    else
        log_error "前端镜像构建失败"
        exit 1
    fi
}

# 选择Docker Compose文件
select_compose_file() {
    # 检查是否使用单容器模式
    if [ "$1" = "--unified" ]; then
        echo "docker-compose.unified.yml"
    elif [ "$RUN_MODE" = "sqlite" ]; then
        echo "docker-compose.sqlite.yml"
    else
        echo "docker-compose.yml"
    fi
}

# 启动服务
start_services() {
    log_info "启动服务..."
    local compose_cmd=$(get_docker_compose_cmd)
    local compose_file="./docker/$(select_compose_file "$@")"
    
    log_info "使用Docker Compose文件: $compose_file"
    
    # 检查Docker Compose文件是否存在
    if [ ! -f "$compose_file" ]; then
        log_error "Docker Compose文件不存在: $compose_file"
        exit 1
    fi
    
    # 使用特定的项目名称来避免影响其他服务
    local project_name="annual-leave"
    
    # 对于unified模式，使用缓存构建镜像（提高构建速度）
    if [ "$1" = "--unified" ]; then
        log_info "构建统一镜像（使用缓存）..."
        ($compose_cmd -f "$compose_file" -p "$project_name" build)
    fi
    
    ($compose_cmd -f "$compose_file" -p "$project_name" up -d)
    
    # 等待服务启动（减少等待时间）
    log_info "等待服务启动..."
    sleep 10
    
    # 检查服务状态
    check_services_health
}

# 检查服务健康状态
check_services_health() {
    log_info "检查服务健康状态..."
    
    # 检查前端服务（优化重试机制，减少等待时间）
    local frontend_healthy=false
    for i in {1..3}; do
        log_info "尝试检查前端服务健康状态 (第 $i 次)..."
        if curl -f http://localhost:${FRONTEND_PORT}/health > /dev/null 2>&1; then
            log_success "前端服务运行正常"
            frontend_healthy=true
            break
        else
            log_warning "前端服务健康检查失败 (第 $i 次)，等待 5 秒后重试..."
            sleep 5
        fi
    done
    
    if [ "$frontend_healthy" = false ]; then
        log_error "前端服务健康检查失败，请检查容器日志"
        log_info "尝试获取容器状态..."
        docker ps -a | grep annual-leave || true
        log_info "尝试获取容器日志..."
        docker logs annual-leave-unified --tail=20 2>/dev/null || true
        return 1
    fi
    
    # 检查后端服务（优化重试机制，减少等待时间）
    local backend_healthy=false
    for i in {1..3}; do
        log_info "尝试检查后端服务健康状态 (第 $i 次)..."
        if curl -f http://localhost:${BACKEND_PORT}/health > /dev/null 2>&1; then
            log_success "后端服务运行正常"
            backend_healthy=true
            break
        else
            log_warning "后端服务健康检查失败 (第 $i 次)，等待 5 秒后重试..."
            sleep 5
        fi
    done
    
    if [ "$backend_healthy" = false ]; then
        log_error "后端服务健康检查失败，请检查容器日志"
        log_info "尝试获取容器状态..."
        docker ps -a | grep annual-leave || true
        log_info "尝试获取容器日志..."
        docker logs annual-leave-unified --tail=20 2>/dev/null || true
        return 1
    fi
    
    log_success "所有服务健康检查通过"
}

# 显示服务状态
show_services_status() {
    log_info "服务状态:"
    local compose_cmd=$(get_docker_compose_cmd)
    local compose_file="docker/$(select_compose_file)"
    
    log_info "使用Docker Compose文件: $compose_file"
    
    # 检查Docker Compose文件是否存在
    if [ ! -f "$compose_file" ]; then
        log_error "Docker Compose文件不存在: $compose_file"
        exit 1
    fi
    
    # 使用特定的项目名称来显示正确的服务状态
    local project_name="annual-leave"
    (cd docker && $compose_cmd -f "$(basename "$compose_file")" -p "$project_name" ps)
    
    log_info "容器日志:"
    (cd docker && $compose_cmd -f "$(basename "$compose_file")" -p "$project_name" logs --tail=10)
}

# 备份数据
backup_data() {
    if [ "$1" = "--backup" ]; then
        log_info "备份上传文件..."
        if [ -d "./uploads" ]; then
            tar -czf "backup-uploads-$(date +%Y%m%d-%H%M%S).tar.gz" ./uploads/
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
    echo "  --unified         使用单容器模式部署"
    echo "  --help            显示此帮助信息"
    echo ""
    echo "端口配置:"
    echo "  通过环境变量配置:"
    echo "  BACKEND_PORT      后端服务端口（默认: 3000）"
    echo "  FRONTEND_PORT     前端服务端口（默认: 8080）"
    echo "  MCP_SERVER_PORT   MCP服务器端口（默认: 3001）"
    echo ""
    echo "示例:"
    echo "  $0                    # 完整部署流程"
    echo "  $0 --backup           # 备份后部署"
    echo "  $0 --restore backup.tar.gz  # 恢复备份后部署"
    echo "  $0 --unified          # 使用单容器模式部署"
    echo ""
    echo "注意: 端口配置通过环境变量传递，支持所有参数组合"
}

# 主函数
main() {
    local action="full"
    local backup_file=""
    local unified_mode=false
    
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
            --run-local)
                # SQLite 模式参数，由环境变量处理
                shift
                ;;
            --backend-port)
                # 后端端口参数，由环境变量处理
                shift 2
                ;;
            --frontend-port)
                # 前端端口参数，由环境变量处理
                shift 2
                ;;
            --unified)
                unified_mode=true
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
    
    log_info "=== Excel_lowCode Docker部署 ==="
    
    # 检查依赖
    check_dependencies
    
    # 检查环境配置
    check_env
    
    # 根据模式选择执行逻辑
    if [ "$unified_mode" = true ]; then
        log_info "使用单容器模式部署"
        case $action in
            "stop")
                stop_services --unified
                ;;
            "start")
                start_services --unified
                show_services_status
                ;;
            "full")
                stop_services --unified
                start_services --unified
                show_services_status
                ;;
        esac
    else
        log_info "使用多容器模式部署"
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
    fi
    
    log_success "部署流程完成"
    local server_ip=$(get_server_ip)
    log_info "前端访问地址: http://${server_ip}:${FRONTEND_PORT}"
    log_info "后端API地址: ${API_BASE_URL}"
    log_info "API文档地址: ${API_BASE_URL}/api-docs"
}

# 执行主函数
main "$@"

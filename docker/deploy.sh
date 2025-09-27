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

# 检查依赖
check_dependencies() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi
}

# 检查环境文件
check_env() {
    if [ ! -f .env ]; then
        log_error "未找到.env文件，请先复制.env.template为.env并配置环境变量"
        exit 1
    fi
}

# 停止现有服务
stop_services() {
    log_info "停止现有服务..."
    docker-compose down --remove-orphans || true
}

# 启动服务
start_services() {
    log_info "启动服务..."
    docker-compose up -d
    
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
    if curl -f http://localhost:80/health > /dev/null 2>&1; then
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
    docker-compose ps
    
    log_info "容器日志:"
    docker-compose logs --tail=10
}

# 备份数据
backup_data() {
    if [ "$1" = "--backup" ]; then
        log_info "备份上传文件..."
        if [ -d "uploads" ]; then
            tar -czf "backup-uploads-$(date +%Y%m%d-%H%M%S).tar.gz" uploads/
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
            start_services
            show_services_status
            ;;
    esac
    
    log_success "部署流程完成"
    log_info "前端访问地址: http://localhost:80"
    log_info "后端API地址: http://localhost:3000"
    log_info "API文档地址: http://localhost:3000/api-docs"
}

# 执行主函数
main "$@"

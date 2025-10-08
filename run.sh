#!/bin/bash

# Excel_lowCode - 完整运行脚本（构建 + 部署）
# 按顺序调用 build.sh 和 deploy.sh
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

# 检查当前目录
check_current_directory() {
    local expected_dir="-"
    local current_dir=$(basename "$(pwd)")
    
    if [ "$current_dir" != "$expected_dir" ]; then
        log_warning "当前目录: $current_dir"
        log_warning "建议在项目根目录 ($expected_dir) 执行此脚本"
        # read -p "是否继续在当前目录执行? (y/N): " -n 1 -r
        # echo
        # if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        #     log_info "请切换到项目根目录后重新执行"
        #     exit 1
        # fi
    fi
}

# 检查脚本文件是否存在
check_script_files() {
    if [ ! -f "docker/build.sh" ]; then
        log_error "构建脚本不存在: docker/build.sh"
        exit 1
    fi
    
    if [ ! -f "docker/deploy.sh" ]; then
        log_error "部署脚本不存在: docker/deploy.sh"
        exit 1
    fi
    
    # 检查脚本是否可执行
    if [ ! -x "docker/build.sh" ]; then
        log_warning "构建脚本不可执行，添加执行权限..."
        chmod +x docker/build.sh
    fi
    
    if [ ! -x "docker/deploy.sh" ]; then
        log_warning "部署脚本不可执行，添加执行权限..."
        chmod +x docker/deploy.sh
    fi
}

# 执行构建阶段
run_build() {
    log_info "=== 开始构建阶段 ==="
    
    # 传递参数给构建脚本（过滤掉部署相关参数）
    local build_args=()
    for arg in "$@"; do
        case $arg in
            --backup|--restore|--stop-only|--start-only|--help)
                # 跳过部署相关参数
                ;;
            *)
                build_args+=("$arg")
                ;;
        esac
    done
    
    log_info "执行构建命令: docker/build.sh ${build_args[*]}"
    
    if docker/build.sh "${build_args[@]}"; then
        log_success "构建阶段完成"
        return 0
    else
        log_error "构建阶段失败"
        return 1
    fi
}

# 执行部署阶段
run_deploy() {
    log_info "=== 开始部署阶段 ==="
    
    log_info "执行部署命令: docker/deploy.sh $*"
    
    if docker/deploy.sh "$@"; then
        log_success "部署阶段完成"
        return 0
    else
        log_error "部署阶段失败"
        return 1
    fi
}

# 显示使用说明
show_usage() {
    echo "使用方法: $0 [选项]"
    echo ""
    echo "描述: 按顺序执行构建和部署流程"
    echo ""
    echo "运行模式选项:"
    echo "  --run-local        使用本地SQLite数据库模式"
    echo ""
    echo "端口配置选项:"
    echo "  --backend-port PORT  设置后端服务端口（默认: 3000）"
    echo "  --frontend-port PORT 设置前端服务端口（默认: 8080）"
    echo ""
    echo "构建选项 (传递给 build.sh):"
    echo "  --clean            构建完成后清理Docker缓存"
    echo ""
    echo "部署选项 (传递给 deploy.sh):"
    echo "  --backup          部署前备份现有数据"
    echo "  --restore FILE    部署后恢复指定备份文件"
    echo "  --stop-only       仅停止服务，不启动"
    echo "  --start-only      仅启动服务，不停止"
    echo "  --help            显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0                    # 完整构建和部署流程"
    echo "  $0 --clean            # 构建后清理缓存并部署"
    echo "  $0 --backup           # 备份后构建和部署"
    echo "  $0 --stop-only        # 仅构建和停止服务"
    echo "  $0 --run-local        # 使用SQLite数据库本地运行"
    echo "  $0 --run-local --backend-port 4000 --frontend-port 9000  # 自定义端口运行"
    echo ""
    echo "注意: 此脚本会按顺序调用 docker/build.sh 和 docker/deploy.sh"
}

# 解析命令行参数
parse_arguments() {
    local run_local=false
    local backend_port=""
    local frontend_port=""
    local deploy_args=()
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --run-local)
                run_local=true
                deploy_args+=("$1")
                shift
                ;;
            --backend-port)
                if [[ -n "$2" && "$2" =~ ^[0-9]+$ ]]; then
                    backend_port="$2"
                    deploy_args+=("$1" "$2")
                    shift 2
                else
                    log_error "--backend-port 需要有效的端口号"
                    exit 1
                fi
                ;;
            --frontend-port)
                if [[ -n "$2" && "$2" =~ ^[0-9]+$ ]]; then
                    frontend_port="$2"
                    deploy_args+=("$1" "$2")
                    shift 2
                else
                    log_error "--frontend-port 需要有效的端口号"
                    exit 1
                fi
                ;;
            *)
                deploy_args+=("$1")
                shift
                ;;
        esac
    done
    
    # 设置环境变量
    if [ "$run_local" = true ]; then
        export RUN_MODE="sqlite"
        log_info "运行模式: SQLite 本地数据库"
    fi
    
    if [ -n "$backend_port" ]; then
        export BACKEND_PORT="$backend_port"
        log_info "后端端口: $backend_port"
    fi
    
    if [ -n "$frontend_port" ]; then
        export FRONTEND_PORT="$frontend_port"
        log_info "前端端口: $frontend_port"
    fi
    
    # 返回部署参数数组（使用全局变量）
    DEPLOY_ARGS=("${deploy_args[@]}")
}

# 主函数
main() {
    # 检查是否显示帮助
    for arg in "$@"; do
        if [ "$arg" = "--help" ]; then
            show_usage
            exit 0
        fi
    done
    
    log_info "=== Excel_lowCode - 完整运行流程 ==="
    
    # 环境检查
    check_current_directory
    check_script_files
    
    # 解析参数并设置环境变量
    parse_arguments "$@"
    
    # 执行构建阶段
    if ! run_build "$@"; then
        log_error "构建失败，停止部署流程"
        exit 1
    fi
    
    echo
    log_info "构建完成，准备开始部署..."
    echo
    
    # 执行部署阶段（传递环境变量）
    export RUN_MODE="$RUN_MODE"
    export BACKEND_PORT="$BACKEND_PORT"
    export FRONTEND_PORT="$FRONTEND_PORT"
    if ! run_deploy "${DEPLOY_ARGS[@]}"; then
        log_error "部署失败"
        exit 1
    fi
    
    echo
    log_success "=== 完整运行流程完成 ==="
    log_info "系统已成功构建并部署"
    log_info "请检查服务状态以确保一切正常"
}

# 执行主函数
main "$@"

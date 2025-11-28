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

# 检查并导入本地基础镜像
check_and_import_base_images() {
    log_info "=== 检查基础镜像状态 ==="
    
    # 定义需要的基础镜像
    local required_images=("nginx:alpine" "node:20-alpine" "node:16-alpine")
    local missing_images=()
    local local_images_available=false
    
    # 检查本地镜像包是否存在
    if [ -d "docker/docker-base-images-20251023" ]; then
        log_info "发现本地镜像包: docker/docker-base-images-20251023"
        local_images_available=true
    elif [ -d "docker/base-images" ]; then
        log_info "发现本地镜像目录: docker/base-images"
        local_images_available=true
    fi
    
    # 检查每个镜像是否存在
    for image in "${required_images[@]}"; do
        if docker image inspect "$image" > /dev/null 2>&1; then
            local image_size=$(docker image inspect "$image" | grep -o '"Size": [0-9]*' | cut -d' ' -f2)
            local human_size=$(numfmt --to=iec "$image_size")
            log_success "✓ $image ($human_size)"
        else
            log_warning "✗ $image (未找到)"
            missing_images+=("$image")
        fi
    done
    
    # 如果有缺失的镜像且本地镜像包可用，则自动导入
    if [ ${#missing_images[@]} -gt 0 ] && [ "$local_images_available" = true ]; then
        log_info "检测到 ${#missing_images[@]} 个缺失的基础镜像，尝试从本地导入..."
        
        # 优先使用完整的本地化包
        if [ -d "docker/docker-base-images-20251023" ]; then
            log_info "使用完整本地化包导入镜像..."
            if docker/import-base-images.sh auto "docker/docker-base-images-20251023"; then
                log_success "本地镜像导入成功"
            else
                log_warning "本地镜像导入失败，将尝试网络下载"
            fi
        elif [ -d "docker/base-images" ]; then
            log_info "使用基础镜像目录导入..."
            if docker/import-base-images.sh auto "docker/base-images"; then
                log_success "本地镜像导入成功"
            else
                log_warning "本地镜像导入失败，将尝试网络下载"
            fi
        fi
        
        # 重新检查镜像状态
        local still_missing=()
        for image in "${missing_images[@]}"; do
            if docker image inspect "$image" > /dev/null 2>&1; then
                log_success "✓ $image (已从本地导入)"
            else
                still_missing+=("$image")
            fi
        done
        
        missing_images=("${still_missing[@]}")
    fi
    
    # 如果仍有缺失的镜像，提示用户
    if [ ${#missing_images[@]} -gt 0 ]; then
        log_warning "以下基础镜像缺失，将在构建过程中从网络下载:"
        for image in "${missing_images[@]}"; do
            log_warning "  - $image"
        done
        log_info "如需离线构建，请先运行: docker/manage-base-images.sh pull"
    else
        log_success "所有基础镜像已就绪，可进行离线构建"
    fi
    
    echo
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
    
    # 过滤部署参数，只传递docker/deploy.sh支持的参数
    local deploy_args=()
    for arg in "$@"; do
        case $arg in
            --backup|--restore|--stop-only|--start-only|--unified|--help|--run-local)
                deploy_args+=("$arg")
                ;;
            --backend-port|--frontend-port|--mcp-port|--clean)
                # 这些参数通过环境变量传递，不传递给deploy.sh
                ;;
            *)
                # 其他参数传递给deploy.sh（可能包含值参数）
                if [[ "$arg" =~ ^--restore=.* ]] || [[ "$arg" =~ ^--backend-port=.* ]] || [[ "$arg" =~ ^--frontend-port=.* ]] || [[ "$arg" =~ ^--mcp-port=.* ]]; then
                    # 跳过这些参数，它们已经通过环境变量处理
                    :
                else
                    deploy_args+=("$arg")
                fi
                ;;
        esac
    done
    
    log_info "执行部署命令: docker/deploy.sh ${deploy_args[*]}"
    
    if docker/deploy.sh "${deploy_args[@]}"; then
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
    echo "  --unified          使用单容器模式部署（推荐）"
    echo ""
echo "端口配置选项:"
echo "  --backend-port PORT  设置后端服务端口（默认: 3050）"
echo "  --frontend-port PORT 设置前端服务端口（默认: 9900）"
echo "  --mcp-port PORT      设置MCP Server端口（默认: 3060）"
    echo ""
    echo "构建选项 (传递给 build.sh):"
    echo "  --clean            构建完成后清理Docker缓存"
    echo "  --multi-arch       构建多架构镜像 (支持 x86/ARM)"
    echo ""
    echo "部署选项 (传递给 deploy.sh):"
    echo "  --backup          部署前备份现有数据"
    echo "  --restore FILE    部署后恢复指定备份文件"
    echo "  --stop-only       仅停止服务，不启动"
    echo "  --start-only      仅启动服务，不停止"
    echo "  --help            显示此帮助信息"
    echo ""
    echo "清理选项:"
    echo "  --clean --unified  部署完成后清理所有中间产物（前端dist、MCP构建文件等）"
    echo ""
echo "示例:"
echo "  $0                    # 完整构建和部署流程"
echo "  $0 --clean            # 构建后清理缓存并部署"
echo "  $0 --backup           # 备份后构建和部署"
echo "  $0 --stop-only        # 仅构建和停止服务"
echo "  $0 --run-local        # 使用SQLite数据库本地运行"
echo "  $0 --unified          # 使用单容器模式部署"
echo "  $0 --run-local --backend-port 4000 --frontend-port 9000  # 自定义端口运行"
echo "  $0 --unified --backend-port 4000 --frontend-port 9000    # 单容器自定义端口"
echo "  $0 --mcp-port 9100    # 设置MCP Server端口为9100"
echo "  $0 --backend-port 4000 --frontend-port 9000 --mcp-port 9100  # 自定义所有端口"
echo "  $0 --clean --unified  # 构建部署后清理所有中间产物"
    echo ""
    echo "注意: 此脚本会按顺序调用 docker/build.sh 和 docker/deploy.sh"
}

# 解析命令行参数
parse_arguments() {
    local run_local=false
    local backend_port=""
    local frontend_port=""
    local mcp_port=""
    local unified_mode=false
    local deploy_args=()
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --run-local)
                run_local=true
                deploy_args+=("$1")  # 添加到deploy_args，让deploy.sh也能处理
                shift
                ;;
            --backend-port)
                if [[ -n "$2" && "$2" =~ ^[0-9]+$ ]]; then
                    backend_port="$2"
                    # 不添加到deploy_args，通过环境变量传递
                    shift 2
                else
                    log_error "--backend-port 需要有效的端口号"
                    exit 1
                fi
                ;;
            --frontend-port)
                if [[ -n "$2" && "$2" =~ ^[0-9]+$ ]]; then
                    frontend_port="$2"
                    # 不添加到deploy_args，通过环境变量传递
                    shift 2
                else
                    log_error "--frontend-port 需要有效的端口号"
                    exit 1
                fi
                ;;
            --mcp-port)
                if [[ -n "$2" && "$2" =~ ^[0-9]+$ ]]; then
                    mcp_port="$2"
                    # 不添加到deploy_args，通过环境变量传递
                    shift 2
                else
                    log_error "--mcp-port 需要有效的端口号"
                    exit 1
                fi
                ;;
            --unified)
                unified_mode=true
                deploy_args+=("$1")
                shift
                ;;
            --backup|--restore|--stop-only|--start-only|--help|--clean)
                deploy_args+=("$1")
                shift
                ;;
            --restore)
                if [[ -n "$2" ]]; then
                    deploy_args+=("$1" "$2")
                    shift 2
                else
                    log_error "--restore 需要指定备份文件路径"
                    exit 1
                fi
                ;;
            *)
                log_error "未知参数: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # 设置环境变量
    if [ "$run_local" = true ]; then
        export RUN_MODE="sqlite"
        log_info "运行模式: SQLite 本地数据库"
    else
        # 统一模式默认使用MySQL，除非明确指定--run-local
        if [ "$unified_mode" = true ]; then
            export RUN_MODE="mysql"
            log_info "运行模式: MySQL 数据库"
        fi
    fi
    
    if [ "$unified_mode" = true ]; then
        export DEPLOY_MODE="unified"
        log_info "部署模式: 单容器模式"
    fi
    
    if [ -n "$backend_port" ]; then
        export BACKEND_PORT="$backend_port"
        log_info "后端端口: $backend_port"
    fi
    
    if [ -n "$frontend_port" ]; then
        export FRONTEND_PORT="$frontend_port"
        log_info "前端端口: $frontend_port"
    fi
    
    if [ -n "$mcp_port" ]; then
        export MCP_SERVER_PORT="$mcp_port"
        log_info "MCP Server 端口: $mcp_port"
    fi
    
    # 返回部署参数数组（使用全局变量）
    DEPLOY_ARGS=("${deploy_args[@]}")
}

# 清理中间产物
clean_intermediate_files() {
    log_info "=== 清理构建中间产物 ==="
    
    # 清理前端构建产物
    if [ -d "fe/dist" ]; then
        log_info "清理前端构建产物: fe/dist/"
        rm -rf fe/dist
        log_success "前端构建产物已清理"
    else
        log_info "未找到前端构建产物: fe/dist/"
    fi
    
    # 清理MCP服务器构建产物
    if [ -d "MCPServer/build" ]; then
        log_info "清理MCP服务器构建产物: MCPServer/build/"
        rm -rf MCPServer/build
        log_success "MCP服务器构建产物已清理"
    else
        log_info "未找到MCP服务器构建产物: MCPServer/build/"
    fi
    
    # 清理TypeScript构建信息文件
    if [ -f "MCPServer/tsconfig.tsbuildinfo" ]; then
        log_info "清理TypeScript构建信息文件: MCPServer/tsconfig.tsbuildinfo"
        rm -f MCPServer/tsconfig.tsbuildinfo
        log_success "TypeScript构建信息文件已清理"
    fi
    
    # 清理Docker构建缓存
    log_info "清理Docker构建缓存..."
    docker system prune -f
    log_success "Docker构建缓存已清理"
    
    log_success "所有中间产物清理完成"
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
    
    # 检查并导入本地基础镜像（避免网络加载）
    check_and_import_base_images
    
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
    export MCP_SERVER_PORT="$MCP_SERVER_PORT"
    if ! run_deploy "${DEPLOY_ARGS[@]}"; then
        log_error "部署失败"
        exit 1
    fi
    
    # 检查是否需要清理中间产物（--clean --unified 参数组合）
    local clean_unified=false
    for arg in "$@"; do
        if [ "$arg" = "--clean" ]; then
            for other_arg in "$@"; do
                if [ "$other_arg" = "--unified" ]; then
                    clean_unified=true
                    break
                fi
            done
            break
        fi
    done
    
    if [ "$clean_unified" = true ]; then
        echo
        clean_intermediate_files
    fi
    
    echo
    log_success "=== 完整运行流程完成 ==="
    log_info "系统已成功构建并部署"
    log_info "请检查服务状态以确保一切正常"
}

# 执行主函数
main "$@"

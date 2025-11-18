#!/bin/bash

# Excel_lowCode - 多架构Docker镜像构建脚本
# 支持 linux/amd64 和 linux/arm64 架构
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

# 检查Docker Buildx是否可用
check_buildx() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    if ! docker buildx version &> /dev/null; then
        log_error "Docker Buildx未安装或不可用"
        log_info "请确保Docker Desktop已安装或手动安装Buildx插件"
        exit 1
    fi
    
    log_success "Docker Buildx可用: $(docker buildx version | head -n1)"
}

# 设置多架构构建器
setup_builder() {
    local builder_name="multi-arch-builder"
    
    # 检查是否已有构建器
    if docker buildx ls | grep -q "$builder_name"; then
        log_info "使用现有构建器: $builder_name"
        docker buildx use "$builder_name"
    else
        log_info "创建多架构构建器: $builder_name"
        docker buildx create --name "$builder_name" --use
        log_success "多架构构建器创建完成"
    fi
    
    # 检查构建器支持的平台
    log_info "构建器支持的平台:"
    docker buildx inspect --bootstrap | grep "Platforms:" || true
}

# 加载环境变量
load_env() {
    if [ -f docker/.env ]; then
        log_info "加载环境变量..."
        source docker/.env
    else
        log_warning "未找到.env文件，使用默认配置"
    fi
    
    # 设置默认值
    IMAGE_PREFIX=${IMAGE_PREFIX:-"excel-lowcode"}
    UNIFIED_TAG=${UNIFIED_TAG:-"latest"}
    BACKEND_TAG=${BACKEND_TAG:-"latest"}
    FRONTEND_TAG=${FRONTEND_TAG:-"latest"}
}

# 生成MCP API密钥
generate_mcp_api_key() {
    local key_file=".mcp_api_key"
    
    if [ -f "$key_file" ]; then
        MCP_API_KEY=$(cat "$key_file")
        log_info "使用现有的MCP API密钥: ${MCP_API_KEY:0:8}..."
    else
        if command -v uuidgen &> /dev/null; then
            MCP_API_KEY=$(uuidgen | tr -d '-')
        else
            MCP_API_KEY=$(date +%s | sha256sum | base64 | head -c 32 ; echo)
        fi
        echo "$MCP_API_KEY" > "$key_file"
        log_info "生成新的MCP API密钥: ${MCP_API_KEY:0:8}..."
    fi
    
    export MCP_API_KEY
}

# 构建多架构镜像
build_multi_arch_images() {
    local mode="$1"
    local platforms="linux/amd64,linux/arm64"
    local push_flag=""
    
    # 检查是否启用推送
    if [ "$2" = "--push" ]; then
        push_flag="--push"
        log_info "启用镜像推送模式"
    fi
    
    case "$mode" in
        "unified")
            log_info "构建统一镜像 (多架构: $platforms)"
            
            # 构建统一镜像
            docker buildx build \
                --platform "$platforms" \
                --target unified \
                -t "${IMAGE_PREFIX}-unified:${UNIFIED_TAG}" \
                -f docker/unified/Dockerfile \
                --build-arg VITE_API_BASE_URL=/backend \
                $push_flag \
                .
            ;;
        "all")
            log_info "构建所有镜像 (多架构: $platforms)"
            
            # 构建前端镜像
            log_info "构建前端镜像..."
            docker buildx build \
                --platform "$platforms" \
                -t "${IMAGE_PREFIX}-frontend:${FRONTEND_TAG}" \
                -f docker/frontend/Dockerfile \
                --build-arg VITE_API_BASE_URL=${API_BASE_URL:-http://localhost:3000} \
                $push_flag \
                .
            
            # 构建后端镜像
            log_info "构建后端镜像..."
            docker buildx build \
                --platform "$platforms" \
                -t "${IMAGE_PREFIX}-backend:${BACKEND_TAG}" \
                -f docker/backend/Dockerfile \
                $push_flag \
                .
            
            # 构建统一镜像
            log_info "构建统一镜像..."
            docker buildx build \
                --platform "$platforms" \
                --target unified \
                -t "${IMAGE_PREFIX}-unified:${UNIFIED_TAG}" \
                -f docker/unified/Dockerfile \
                --build-arg VITE_API_BASE_URL=/backend \
                $push_flag \
                .
            ;;
        *)
            log_error "未知的构建模式: $mode"
            show_usage
            exit 1
            ;;
    esac
    
    log_success "多架构镜像构建完成"
}

# 显示镜像信息
show_images() {
    log_info "当前多架构镜像列表:"
    
    case "$1" in
        "unified")
            docker images | grep "${IMAGE_PREFIX}-unified" || log_warning "未找到统一镜像"
            ;;
        "all")
            docker images | grep "${IMAGE_PREFIX}" || log_warning "未找到相关镜像"
            ;;
        *)
            docker images | grep "${IMAGE_PREFIX}" || log_warning "未找到相关镜像"
            ;;
    esac
    
    # 显示多架构镜像清单
    log_info "多架构镜像清单:"
    if command -v docker &> /dev/null; then
        for image in "${IMAGE_PREFIX}-unified:${UNIFIED_TAG}" "${IMAGE_PREFIX}-frontend:${FRONTEND_TAG}" "${IMAGE_PREFIX}-backend:${BACKEND_TAG}"; do
            if docker manifest inspect "$image" &> /dev/null; then
                log_success "✓ $image (多架构)"
                docker manifest inspect "$image" | grep "architecture" | sed 's/^/  /'
            else
                log_warning "✗ $image (未找到清单)"
            fi
        done
    fi
}

# 清理构建缓存
clean_cache() {
    log_info "清理Docker构建缓存..."
    docker buildx prune -f
    docker system prune -f
}

# 显示使用说明
show_usage() {
    echo "使用方法: $0 [模式] [选项]"
    echo ""
    echo "模式:"
    echo "  unified          构建统一镜像 (单容器)"
    echo "  all              构建所有镜像 (前端、后端、统一)"
    echo ""
    echo "选项:"
    echo "  --push           构建后推送镜像到仓库"
    echo "  --clean          构建完成后清理缓存"
    echo "  --help           显示此帮助信息"
    echo ""
    echo "环境变量:"
    echo "  IMAGE_PREFIX     镜像前缀 (默认: excel-lowcode)"
    echo "  UNIFIED_TAG      统一镜像标签 (默认: latest)"
    echo "  BACKEND_TAG      后端镜像标签 (默认: latest)"
    echo "  FRONTEND_TAG     前端镜像标签 (默认: latest)"
    echo "  API_BASE_URL     API基础URL (用于前端构建)"
    echo ""
    echo "示例:"
    echo "  $0 unified        # 构建统一镜像 (多架构)"
    echo "  $0 all            # 构建所有镜像 (多架构)"
    echo "  $0 unified --push # 构建并推送统一镜像"
    echo "  $0 all --clean    # 构建所有镜像并清理缓存"
    echo ""
    echo "支持的平台: linux/amd64, linux/arm64"
}

# 主函数
main() {
    local mode="unified"
    local push_enabled=false
    local clean_enabled=false
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            unified|all)
                mode="$1"
                shift
                ;;
            --push)
                push_enabled=true
                shift
                ;;
            --clean)
                clean_enabled=true
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
    
    log_info "=== Excel_lowCode 多架构Docker镜像构建 ==="
    
    # 检查依赖
    check_buildx
    
    # 设置构建器
    setup_builder
    
    # 加载配置
    load_env
    
    # 生成MCP API密钥
    generate_mcp_api_key
    
    # 构建镜像
    if [ "$push_enabled" = true ]; then
        build_multi_arch_images "$mode" "--push"
    else
        build_multi_arch_images "$mode"
    fi
    
    # 显示镜像信息
    show_images "$mode"
    
    # 清理缓存
    if [ "$clean_enabled" = true ]; then
        clean_cache
    fi
    
    log_success "多架构构建流程完成"
    log_info "镜像已支持: linux/amd64 (x86), linux/arm64 (ARM)"
}

# 执行主函数
main "$@"

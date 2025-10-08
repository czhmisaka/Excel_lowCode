#!/bin/bash

# Excel_lowCode - Docker镜像导出脚本
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
}

# 加载环境变量
load_env() {
    if [ -f .env ]; then
        log_info "加载环境变量..."
        source .env
    else
        log_warning "未找到.env文件，使用默认配置"
    fi
}

# 创建导出目录
create_export_dir() {
    local export_dir=${EXPORT_DIR:-./exports}
    mkdir -p "$export_dir"
    echo "$export_dir"
}

# 生成版本标签
generate_version_tag() {
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local git_hash=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    echo "${timestamp}-${git_hash}"
}

# 导出单个镜像
export_image() {
    local image_name=$1
    local export_dir=$2
    local version_tag=$3
    local compress=$4
    
    local image_file="${export_dir}/${image_name}-${version_tag}.tar"
    
    log_info "导出镜像: ${image_name}"
    
    # 检查镜像是否存在
    if ! docker image inspect "$image_name" > /dev/null 2>&1; then
        log_error "镜像不存在: ${image_name}"
        return 1
    fi
    
    # 导出镜像
    docker save -o "$image_file" "$image_name"
    
    # 压缩镜像文件
    if [ "$compress" = "true" ]; then
        log_info "压缩镜像文件..."
        gzip "$image_file"
        local compressed_file="${image_file}.gz"
        local original_size=$(stat -f%z "$compressed_file" 2>/dev/null || stat -c%s "$compressed_file")
        local compressed_size=$(du -h "$compressed_file" | cut -f1)
        log_success "镜像导出完成: ${compressed_file} (${compressed_size})"
        echo "$compressed_file"
    else
        local file_size=$(du -h "$image_file" | cut -f1)
        log_success "镜像导出完成: ${image_file} (${file_size})"
        echo "$image_file"
    fi
}

# 生成元数据文件
generate_metadata() {
    local export_dir=$1
    local version_tag=$2
    local frontend_file=$3
    local backend_file=$4
    
    local metadata_file="${export_dir}/metadata-${version_tag}.json"
    
    cat > "$metadata_file" << EOF
{
    "export": {
        "timestamp": "$(date -Iseconds)",
        "version": "${version_tag}",
        "system": "Excel_lowCode"
    },
    "images": {
        "frontend": {
            "file": "$(basename "$frontend_file")",
            "size": "$(du -h "$frontend_file" | cut -f1)",
            "checksum": "$(shasum -a 256 "$frontend_file" | cut -d' ' -f1)"
        },
        "backend": {
            "file": "$(basename "$backend_file")",
            "size": "$(du -h "$backend_file" | cut -f1)",
            "checksum": "$(shasum -a 256 "$backend_file" | cut -d' ' -f1)"
        }
    },
    "environment": {
        "node_version": "$(node --version 2>/dev/null || echo "N/A")",
        "npm_version": "$(npm --version 2>/dev/null || echo "N/A")",
        "docker_version": "$(docker --version | cut -d' ' -f3 | sed 's/,//')"
    }
}
EOF
    
    log_success "元数据文件生成完成: ${metadata_file}"
}

# 显示导出信息
show_export_info() {
    local export_dir=$1
    local version_tag=$2
    
    log_info "=== 导出完成 ==="
    log_info "导出目录: ${export_dir}"
    log_info "版本标签: ${version_tag}"
    log_info ""
    log_info "导出文件:"
    ls -la "${export_dir}"/*"${version_tag}"*
    log_info ""
    log_info "导入命令:"
    echo "  ./import-images.sh ${export_dir}/metadata-${version_tag}.json"
}

# 主函数
main() {
    local compress=${COMPRESS_IMAGES:-true}
    local export_single=""
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --no-compress)
                compress="false"
                shift
                ;;
            --frontend-only)
                export_single="frontend"
                shift
                ;;
            --backend-only)
                export_single="backend"
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
    
    log_info "=== Excel_lowCode Docker镜像导出 ==="
    
    # 检查依赖
    check_docker
    
    # 加载配置
    load_env
    
    # 创建导出目录
    local export_dir=$(create_export_dir)
    
    # 生成版本标签
    local version_tag=$(generate_version_tag)
    
    # 镜像名称
    local frontend_image="${IMAGE_PREFIX:-annual-leave}-frontend:${FRONTEND_TAG:-latest}"
    local backend_image="${IMAGE_PREFIX:-annual-leave}-backend:${BACKEND_TAG:-latest}"
    
    # 导出镜像
    local frontend_file=""
    local backend_file=""
    
    if [ -z "$export_single" ] || [ "$export_single" = "frontend" ]; then
        frontend_file=$(export_image "$frontend_image" "$export_dir" "$version_tag" "$compress")
    fi
    
    if [ -z "$export_single" ] || [ "$export_single" = "backend" ]; then
        backend_file=$(export_image "$backend_image" "$export_dir" "$version_tag" "$compress")
    fi
    
    # 生成元数据文件
    if [ -n "$frontend_file" ] && [ -n "$backend_file" ]; then
        generate_metadata "$export_dir" "$version_tag" "$frontend_file" "$backend_file"
    fi
    
    # 显示导出信息
    show_export_info "$export_dir" "$version_tag"
    
    log_success "镜像导出流程完成"
}

# 显示使用说明
show_usage() {
    echo "使用方法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --no-compress     不压缩导出的镜像文件"
    echo "  --frontend-only   仅导出前端镜像"
    echo "  --backend-only    仅导出后端镜像"
    echo "  --help            显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0                    # 导出所有镜像并压缩"
    echo "  $0 --no-compress      # 导出所有镜像不压缩"
    echo "  $0 --frontend-only    # 仅导出前端镜像"
}

# 执行主函数
main "$@"

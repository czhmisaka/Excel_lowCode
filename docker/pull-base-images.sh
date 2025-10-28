#!/bin/bash

# Excel_lowCode - 基础镜像拉取和备份脚本
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

# 配置Docker镜像源
configure_docker_mirror() {
    log_info "配置Docker镜像源..."
    
    # 检查是否已配置镜像源
    if docker info 2>/dev/null | grep -q "registry-mirrors"; then
        log_info "Docker镜像源已配置"
        return 0
    fi
    
    log_warning "建议配置Docker镜像源以加速下载"
    log_info "可以编辑 /etc/docker/daemon.json 添加以下配置："
    cat << EOF
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://registry.docker-cn.com"
  ]
}
EOF
}

# 拉取单个镜像
pull_image() {
    local image_name=$1
    local retry_count=${2:-3}
    
    log_info "拉取镜像: ${image_name}"
    
    for i in $(seq 1 $retry_count); do
        if docker pull "$image_name"; then
            local image_size=$(docker image inspect "$image_name" | grep -o '"Size": [0-9]*' | cut -d' ' -f2)
            local human_size=$(numfmt --to=iec "$image_size")
            log_success "镜像拉取成功: ${image_name} (${human_size})"
            return 0
        else
            log_warning "第${i}次拉取失败，${retry_count}秒后重试..."
            sleep "$retry_count"
        fi
    done
    
    log_error "镜像拉取失败: ${image_name}"
    return 1
}

# 导出单个镜像到文件
export_image() {
    local image_name=$1
    local export_dir=$2
    
    # 创建安全的文件名
    local safe_name=$(echo "$image_name" | sed 's/[\/:]/-/g')
    local image_file="${export_dir}/${safe_name}.tar"
    
    log_info "导出镜像: ${image_name} -> ${image_file}"
    
    # 检查镜像是否存在
    if ! docker image inspect "$image_name" > /dev/null 2>&1; then
        log_error "镜像不存在: ${image_name}"
        return 1
    fi
    
    # 导出镜像
    docker save -o "$image_file" "$image_name"
    
    local file_size=$(du -h "$image_file" | cut -f1)
    log_success "镜像导出完成: ${image_file} (${file_size})"
    
    echo "$image_file"
}

# 生成镜像列表文件
generate_image_list() {
    local export_dir=$1
    
    local image_list_file="${export_dir}/base-images-list.txt"
    
    cat > "$image_list_file" << EOF
# Excel_lowCode 基础镜像列表
# 生成时间: $(date)
# 项目: Excel_lowCode

nginx:alpine
node:20-alpine
node:16-alpine

# 可选的其他基础镜像
# alpine:latest
# busybox:latest
# redis:alpine
# postgres:alpine

EOF
    
    log_success "镜像列表生成完成: ${image_list_file}"
}

# 显示镜像信息
show_image_info() {
    log_info "=== 基础镜像信息 ==="
    
    local images=("nginx:alpine" "node:20-alpine" "node:16-alpine")
    
    for image in "${images[@]}"; do
        if docker image inspect "$image" > /dev/null 2>&1; then
            local image_id=$(docker image inspect "$image" | grep -o '"Id": "[^"]*' | cut -d'"' -f4 | cut -d: -f2 | head -c 12)
            local image_size=$(docker image inspect "$image" | grep -o '"Size": [0-9]*' | cut -d' ' -f2)
            local human_size=$(numfmt --to=iec "$image_size")
            log_success "✓ $image ($image_id) - ${human_size}"
        else
            log_warning "✗ $image (未找到)"
        fi
    done
}

# 主函数
main() {
    local action=${1:-"pull"}  # pull 或 export
    local export_dir=${2:-"./base-images"}
    
    log_info "=== Excel_lowCode 基础镜像管理 ==="
    
    # 检查依赖
    check_docker
    
    # 配置镜像源
    configure_docker_mirror
    
    # 基础镜像列表
    local base_images=(
        "nginx:alpine"
        "node:20-alpine" 
        "node:16-alpine"
    )
    
    case "$action" in
        "pull")
            log_info "开始拉取基础镜像..."
            
            # 拉取所有基础镜像
            for image in "${base_images[@]}"; do
                pull_image "$image" 3
            done
            
            # 显示镜像信息
            show_image_info
            ;;
            
        "export")
            log_info "开始导出基础镜像..."
            
            # 创建导出目录
            mkdir -p "$export_dir"
            
            # 导出所有基础镜像
            local exported_files=()
            for image in "${base_images[@]}"; do
                if docker image inspect "$image" > /dev/null 2>&1; then
                    local exported_file=$(export_image "$image" "$export_dir")
                    exported_files+=("$exported_file")
                else
                    log_warning "跳过未找到的镜像: ${image}"
                fi
            done
            
            # 生成镜像列表
            generate_image_list "$export_dir"
            
            log_info "=== 导出完成 ==="
            log_info "导出目录: ${export_dir}"
            log_info "导出文件:"
            for file in "${exported_files[@]}"; do
                log_info "  - $(basename "$file")"
            done
            ;;
            
        "info")
            show_image_info
            ;;
            
        "help"|"--help")
            show_usage
            exit 0
            ;;
            
        *)
            log_error "未知操作: $action"
            show_usage
            exit 1
            ;;
    esac
    
    log_success "操作完成"
}

# 显示使用说明
show_usage() {
    echo "使用方法: $0 [操作] [导出目录]"
    echo ""
    echo "操作:"
    echo "  pull       拉取基础镜像到本地（默认）"
    echo "  export     导出基础镜像到文件"
    echo "  info       显示基础镜像信息"
    echo "  help       显示此帮助信息"
    echo ""
    echo "参数:"
    echo "  导出目录   指定导出目录路径（默认为 ./base-images）"
    echo ""
    echo "示例:"
    echo "  $0 pull                    # 拉取所有基础镜像"
    echo "  $0 export                  # 导出所有基础镜像"
    echo "  $0 export /path/to/backup  # 导出到指定目录"
    echo "  $0 info                    # 显示镜像信息"
}

# 执行主函数
main "$@"

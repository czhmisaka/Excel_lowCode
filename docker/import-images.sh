#!/bin/bash

# Excel_lowCode - Docker镜像导入脚本
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

# 验证文件完整性
verify_file_integrity() {
    local file_path=$1
    local expected_checksum=$2
    
    if [ ! -f "$file_path" ]; then
        log_error "文件不存在: ${file_path}"
        return 1
    fi
    
    local actual_checksum=$(shasum -a 256 "$file_path" | cut -d' ' -f1)
    
    if [ "$actual_checksum" != "$expected_checksum" ]; then
        log_error "文件校验失败: ${file_path}"
        log_error "期望: ${expected_checksum}"
        log_error "实际: ${actual_checksum}"
        return 1
    fi
    
    log_success "文件校验通过: ${file_path}"
    return 0
}

# 解压文件（如果需要）
extract_file() {
    local file_path=$1
    
    if [[ "$file_path" == *.gz ]]; then
        log_info "解压文件: ${file_path}"
        local extracted_file="${file_path%.gz}"
        gunzip -c "$file_path" > "$extracted_file"
        echo "$extracted_file"
    else
        echo "$file_path"
    fi
}

# 导入单个镜像
import_image() {
    local image_file=$1
    local image_name=$2
    
    log_info "导入镜像: ${image_name}"
    
    # 检查文件是否存在
    if [ ! -f "$image_file" ]; then
        log_error "镜像文件不存在: ${image_file}"
        return 1
    fi
    
    # 导入镜像
    docker load -i "$image_file"
    
    # 验证导入
    if docker image inspect "$image_name" > /dev/null 2>&1; then
        local image_size=$(docker image inspect "$image_name" | grep -o '"Size": [0-9]*' | cut -d' ' -f2)
        local human_size=$(numfmt --to=iec "$image_size")
        log_success "镜像导入成功: ${image_name} (${human_size})"
        return 0
    else
        log_error "镜像导入失败: ${image_name}"
        return 1
    fi
}

# 解析元数据文件
parse_metadata() {
    local metadata_file=$1
    
    if [ ! -f "$metadata_file" ]; then
        log_error "元数据文件不存在: ${metadata_file}"
        return 1
    fi
    
    # 使用jq解析JSON，如果没有jq则使用其他方法
    if command -v jq &> /dev/null; then
        local export_dir=$(dirname "$metadata_file")
        local frontend_file=$(jq -r '.images.frontend.file' "$metadata_file")
        local backend_file=$(jq -r '.images.backend.file' "$metadata_file")
        local frontend_checksum=$(jq -r '.images.frontend.checksum' "$metadata_file")
        local backend_checksum=$(jq -r '.images.backend.checksum' "$metadata_file")
        local version=$(jq -r '.export.version' "$metadata_file")
        
        echo "${export_dir}/${frontend_file} ${frontend_checksum} ${export_dir}/${backend_file} ${backend_checksum} ${version}"
    else
        log_warning "jq未安装，使用基本解析"
        # 基本解析（假设文件在同一目录）
        local export_dir=$(dirname "$metadata_file")
        local frontend_file=$(grep -o '"frontend": {[^}]*' "$metadata_file" | grep -o '"file": "[^"]*' | cut -d'"' -f4)
        local backend_file=$(grep -o '"backend": {[^}]*' "$metadata_file" | grep -o '"file": "[^"]*' | cut -d'"' -f4)
        local version=$(grep -o '"version": "[^"]*' "$metadata_file" | cut -d'"' -f4)
        
        echo "${export_dir}/${frontend_file} unknown ${export_dir}/${backend_file} unknown ${version}"
    fi
}

# 显示导入信息
show_import_info() {
    local version=$1
    
    log_info "=== 导入完成 ==="
    log_info "版本: ${version}"
    log_info ""
    log_info "已导入的镜像:"
    docker images | grep "annual-leave" || log_warning "未找到相关镜像"
    log_info ""
    log_info "下一步操作:"
    echo "  1. 配置环境变量: cp .env.template .env"
    echo "  2. 修改数据库配置"
    echo "  3. 启动服务: ./deploy.sh"
}

# 主函数
main() {
    local metadata_file=""
    local frontend_file=""
    local backend_file=""
    
    # 解析参数
    if [ $# -eq 0 ]; then
        # 如果没有参数，查找最新的元数据文件
        local latest_metadata=$(ls -t exports/metadata-*.json 2>/dev/null | head -1)
        if [ -n "$latest_metadata" ]; then
            metadata_file="$latest_metadata"
            log_info "使用最新的元数据文件: ${metadata_file}"
        else
            log_error "未找到元数据文件，请指定文件路径"
            show_usage
            exit 1
        fi
    elif [ "$1" = "--help" ]; then
        show_usage
        exit 0
    else
        metadata_file="$1"
    fi
    
    log_info "=== Excel_lowCode Docker镜像导入 ==="
    
    # 检查依赖
    check_docker
    
    # 解析元数据
    local metadata_result=$(parse_metadata "$metadata_file")
    if [ $? -ne 0 ]; then
        exit 1
    fi
    
    # 提取文件信息
    read -r frontend_file frontend_checksum backend_file backend_checksum version <<< "$metadata_result"
    
    log_info "导入版本: ${version}"
    
    # 验证文件完整性
    if [ "$frontend_checksum" != "unknown" ]; then
        verify_file_integrity "$frontend_file" "$frontend_checksum" || exit 1
    fi
    
    if [ "$backend_checksum" != "unknown" ]; then
        verify_file_integrity "$backend_file" "$backend_checksum" || exit 1
    fi
    
    # 解压文件
    local frontend_extracted=$(extract_file "$frontend_file")
    local backend_extracted=$(extract_file "$backend_file")
    
    # 导入镜像
    import_image "$frontend_extracted" "annual-leave-frontend:latest" || exit 1
    import_image "$backend_extracted" "annual-leave-backend:latest" || exit 1
    
    # 清理临时解压文件
    if [ "$frontend_extracted" != "$frontend_file" ]; then
        rm -f "$frontend_extracted"
    fi
    if [ "$backend_extracted" != "$backend_file" ]; then
        rm -f "$backend_extracted"
    fi
    
    # 显示导入信息
    show_import_info "$version"
    
    log_success "镜像导入流程完成"
}

# 显示使用说明
show_usage() {
    echo "使用方法: $0 [元数据文件]"
    echo ""
    echo "参数:"
    echo "  元数据文件   指定要导入的元数据文件路径（可选）"
    echo "             如果不指定，会自动使用最新的元数据文件"
    echo ""
    echo "选项:"
    echo "  --help      显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0                              # 导入最新的镜像包"
    echo "  $0 exports/metadata-20250101-120000-abc123.json  # 导入指定版本"
}

# 执行主函数
main "$@"

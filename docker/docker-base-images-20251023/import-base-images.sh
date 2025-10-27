#!/bin/bash

# Excel_lowCode - 基础镜像导入脚本
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

# 检查文件完整性
verify_file_integrity() {
    local file_path=$1
    
    if [ ! -f "$file_path" ]; then
        log_error "文件不存在: ${file_path}"
        return 1
    fi
    
    # 检查文件大小
    local file_size=$(stat -f%z "$file_path" 2>/dev/null || stat -c%s "$file_path")
    if [ "$file_size" -lt 1024 ]; then
        log_warning "文件可能损坏，大小异常: ${file_path} (${file_size} bytes)"
        return 1
    fi
    
    # 检查文件类型
    if ! file "$file_path" | grep -q "tar archive"; then
        log_warning "文件格式可能不是tar格式: ${file_path}"
        return 1
    fi
    
    log_success "文件检查通过: ${file_path} ($(numfmt --to=iec "$file_size"))"
    return 0
}

# 导入单个镜像
import_image() {
    local image_file=$1
    local expected_image_name=$2
    
    log_info "导入镜像: ${image_file}"
    
    # 检查文件完整性
    verify_file_integrity "$image_file" || return 1
    
    # 导入镜像
    if docker load -i "$image_file"; then
        # 获取导入的镜像名称
        local loaded_image=$(docker load -i "$image_file" 2>/dev/null | grep "Loaded image:" | sed 's/Loaded image: //')
        
        if [ -n "$loaded_image" ]; then
            local image_size=$(docker image inspect "$loaded_image" | grep -o '"Size": [0-9]*' | cut -d' ' -f2)
            local human_size=$(numfmt --to=iec "$image_size")
            log_success "镜像导入成功: ${loaded_image} (${human_size})"
            
            # 如果期望的镜像名称与实际导入的不同，可以添加标签
            if [ -n "$expected_image_name" ] && [ "$loaded_image" != "$expected_image_name" ]; then
                log_info "添加标签: ${loaded_image} -> ${expected_image_name}"
                docker tag "$loaded_image" "$expected_image_name"
                log_success "标签添加完成"
            fi
            
            return 0
        else
            log_error "无法确定导入的镜像名称"
            return 1
        fi
    else
        log_error "镜像导入失败: ${image_file}"
        return 1
    fi
}

# 从目录自动导入镜像
import_from_directory() {
    local import_dir=$1
    
    log_info "从目录导入镜像: ${import_dir}"
    
    if [ ! -d "$import_dir" ]; then
        log_error "目录不存在: ${import_dir}"
        return 1
    fi
    
    # 查找tar文件
    local tar_files=($(find "$import_dir" -name "*.tar" -type f))
    
    if [ ${#tar_files[@]} -eq 0 ]; then
        log_error "在目录中未找到tar文件: ${import_dir}"
        return 1
    fi
    
    local success_count=0
    local total_count=${#tar_files[@]}
    
    log_info "找到 ${total_count} 个镜像文件"
    
    for tar_file in "${tar_files[@]}"; do
        log_info "处理文件: $(basename "$tar_file")"
        
        # 从文件名推断镜像名称
        local base_name=$(basename "$tar_file" .tar)
        local inferred_image=$(echo "$base_name" | sed 's/-/:/' | sed 's/-alpine/:alpine/')
        
        # 尝试导入镜像
        if import_image "$tar_file" "$inferred_image"; then
            ((success_count++))
        else
            log_warning "导入失败: $(basename "$tar_file")"
        fi
    done
    
    log_info "导入完成: ${success_count}/${total_count} 个镜像成功导入"
    
    if [ "$success_count" -eq "$total_count" ]; then
        log_success "所有镜像导入成功"
        return 0
    else
        log_warning "部分镜像导入失败"
        return 1
    fi
}

# 从镜像列表文件导入
import_from_list() {
    local list_file=$1
    local import_dir=$2
    
    log_info "从列表文件导入: ${list_file}"
    
    if [ ! -f "$list_file" ]; then
        log_error "列表文件不存在: ${list_file}"
        return 1
    fi
    
    if [ ! -d "$import_dir" ]; then
        log_error "导入目录不存在: ${import_dir}"
        return 1
    fi
    
    local success_count=0
    local total_count=0
    
    # 读取镜像列表（跳过注释行和空行）
    while IFS= read -r line; do
        # 跳过注释行和空行
        if [[ "$line" =~ ^[[:space:]]*# ]] || [[ -z "$line" ]]; then
            continue
        fi
        
        # 提取镜像名称
        local image_name=$(echo "$line" | sed 's/[[:space:]]*#.*$//' | xargs)
        
        if [ -n "$image_name" ]; then
            ((total_count++))
            
            # 构建对应的tar文件名
            local safe_name=$(echo "$image_name" | sed 's/[\/:]/-/g')
            local tar_file="${import_dir}/${safe_name}.tar"
            
            log_info "导入镜像: ${image_name}"
            
            if [ -f "$tar_file" ]; then
                if import_image "$tar_file" "$image_name"; then
                    ((success_count++))
                else
                    log_warning "导入失败: ${image_name}"
                fi
            else
                log_warning "镜像文件不存在: ${tar_file}"
            fi
        fi
    done < "$list_file"
    
    log_info "列表导入完成: ${success_count}/${total_count} 个镜像成功导入"
    
    if [ "$success_count" -eq "$total_count" ]; then
        log_success "所有镜像导入成功"
        return 0
    else
        log_warning "部分镜像导入失败"
        return 1
    fi
}

# 显示导入后的镜像信息
show_imported_images() {
    log_info "=== 已导入的基础镜像 ==="
    
    local expected_images=("nginx:alpine" "node:20-alpine" "node:16-alpine")
    local found_count=0
    
    for image in "${expected_images[@]}"; do
        if docker image inspect "$image" > /dev/null 2>&1; then
            local image_id=$(docker image inspect "$image" | grep -o '"Id": "[^"]*' | cut -d'"' -f4 | cut -d: -f2 | head -c 12)
            local image_size=$(docker image inspect "$image" | grep -o '"Size": [0-9]*' | cut -d' ' -f2)
            local human_size=$(numfmt --to=iec "$image_size")
            log_success "✓ $image ($image_id) - ${human_size}"
            ((found_count++))
        else
            log_warning "✗ $image (未找到)"
        fi
    done
    
    log_info "基础镜像状态: ${found_count}/${#expected_images[@]} 个镜像可用"
}

# 主函数
main() {
    local import_source=${1:-"auto"}  # auto, directory, list
    local source_path=${2:-"./base-images"}
    
    log_info "=== Excel_lowCode 基础镜像导入 ==="
    
    # 检查依赖
    check_docker
    
    case "$import_source" in
        "auto")
            log_info "自动检测导入模式..."
            if [ -f "${source_path}/base-images-list.txt" ]; then
                import_from_list "${source_path}/base-images-list.txt" "$source_path"
            else
                import_from_directory "$source_path"
            fi
            ;;
            
        "directory")
            import_from_directory "$source_path"
            ;;
            
        "list")
            import_from_list "$source_path" "$(dirname "$source_path")"
            ;;
            
        "help"|"--help")
            show_usage
            exit 0
            ;;
            
        *)
            log_error "未知导入模式: $import_source"
            show_usage
            exit 1
            ;;
    esac
    
    # 显示导入结果
    show_imported_images
    
    log_success "镜像导入流程完成"
}

# 显示使用说明
show_usage() {
    echo "使用方法: $0 [模式] [路径]"
    echo ""
    echo "模式:"
    echo "  auto       自动检测模式（默认）"
    echo "  directory  从目录导入所有tar文件"
    echo "  list       从列表文件导入指定镜像"
    echo "  help       显示此帮助信息"
    echo ""
    echo "参数:"
    echo "  路径       指定导入源路径（默认为 ./base-images）"
    echo "             - auto模式: 目录路径"
    echo "             - directory模式: 目录路径" 
    echo "             - list模式: 列表文件路径"
    echo ""
    echo "示例:"
    echo "  $0                          # 自动导入"
    echo "  $0 auto ./my-images         # 从指定目录自动导入"
    echo "  $0 directory ./backup       # 从目录导入所有tar文件"
    echo "  $0 list ./images-list.txt   # 从列表文件导入"
}

# 执行主函数
main "$@"

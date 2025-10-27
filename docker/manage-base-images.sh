#!/bin/bash

# Excel_lowCode - 基础镜像管理主脚本
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

# 脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 检查依赖
check_dependencies() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    # 检查必要的工具
    local required_tools=("numfmt" "stat" "du")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_warning "工具未安装: $tool，某些功能可能受限"
        fi
    done
}

# 显示系统信息
show_system_info() {
    log_info "=== 系统信息 ==="
    echo "操作系统: $(uname -s)"
    echo "架构: $(uname -m)"
    echo "Docker版本: $(docker --version 2>/dev/null | cut -d' ' -f3 | sed 's/,//' || echo "未知")"
    echo "脚本目录: $SCRIPT_DIR"
    echo ""
}

# 显示基础镜像状态
show_base_images_status() {
    log_info "=== 基础镜像状态 ==="
    
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
    
    local status_color=$GREEN
    if [ "$found_count" -eq 0 ]; then
        status_color=$RED
    elif [ "$found_count" -lt "${#expected_images[@]}" ]; then
        status_color=$YELLOW
    fi
    
    echo -e "${status_color}基础镜像状态: ${found_count}/${#expected_images[@]} 个镜像可用${NC}"
    echo ""
}

# 拉取基础镜像
pull_base_images() {
    log_info "开始拉取基础镜像..."
    "$SCRIPT_DIR/pull-base-images.sh" pull
}

# 导出基础镜像
export_base_images() {
    local export_dir=${1:-"./base-images"}
    log_info "开始导出基础镜像到: $export_dir"
    "$SCRIPT_DIR/pull-base-images.sh" export "$export_dir"
}

# 导入基础镜像
import_base_images() {
    local import_source=${1:-"auto"}
    local source_path=${2:-"./base-images"}
    log_info "开始导入基础镜像..."
    "$SCRIPT_DIR/import-base-images.sh" "$import_source" "$source_path"
}

# 配置镜像源
configure_mirrors() {
    log_info "配置Docker镜像源..."
    "$SCRIPT_DIR/configure-mirrors.sh" configure
}

# 测试镜像源速度
test_mirror_speed() {
    log_info "测试镜像源速度..."
    "$SCRIPT_DIR/configure-mirrors.sh" test
}

# 显示镜像源信息
show_mirror_info() {
    "$SCRIPT_DIR/configure-mirrors.sh" info
}

# 创建完整的本地化包
create_localization_package() {
    local package_dir=${1:-"./docker-base-images-$(date +%Y%m%d)"}
    
    log_info "创建完整的本地化包..."
    
    # 创建包目录
    mkdir -p "$package_dir"
    
    # 导出基础镜像
    export_base_images "$package_dir"
    
    # 复制管理脚本
    log_info "复制管理脚本..."
    cp "$SCRIPT_DIR/pull-base-images.sh" "$package_dir/"
    cp "$SCRIPT_DIR/import-base-images.sh" "$package_dir/"
    cp "$SCRIPT_DIR/configure-mirrors.sh" "$package_dir/"
    cp "$SCRIPT_DIR/manage-base-images.sh" "$package_dir/"
    
    # 创建使用说明
    cat > "$package_dir/README.md" << 'EOF'
# Excel_lowCode Docker基础镜像本地化包

## 概述
此包包含了Excel_lowCode项目所需的所有Docker基础镜像，可以在无网络环境下使用。

## 包含的镜像
- nginx:alpine
- node:20-alpine  
- node:16-alpine

## 使用方法

### 1. 导入所有基础镜像
```bash
./import-base-images.sh
```

### 2. 检查镜像状态
```bash
./manage-base-images.sh status
```

### 3. 配置镜像源（可选）
```bash
./configure-mirrors.sh configure
```

## 文件说明
- `*.tar` - Docker镜像文件
- `base-images-list.txt` - 镜像列表
- `*.sh` - 管理脚本
- `README.md` - 使用说明

## 系统要求
- Docker 20.10+
- Linux/macOS/Windows WSL2
EOF
    
    log_success "本地化包创建完成: $package_dir"
    log_info "包内容:"
    ls -la "$package_dir"
}

# 显示帮助信息
show_help() {
    cat << 'EOF'
Excel_lowCode - Docker基础镜像管理工具

使用方法: $0 [命令] [参数]

命令:
  status      显示基础镜像状态（默认）
  pull        拉取基础镜像到本地
  export      导出基础镜像到文件
  import      从文件导入基础镜像
  mirrors     配置Docker镜像源
  test        测试镜像源速度
  package     创建完整的本地化包
  help        显示此帮助信息

参数:
  对于 export 命令: [导出目录] (默认: ./base-images)
  对于 import 命令: [模式] [路径] (模式: auto|directory|list, 默认: auto ./base-images)
  对于 package 命令: [包目录] (默认: ./docker-base-images-日期)

示例:
  $0 status                    # 显示镜像状态
  $0 pull                      # 拉取基础镜像
  $0 export                    # 导出基础镜像
  $0 export ./my-backup        # 导出到指定目录
  $0 import                    # 导入基础镜像
  $0 import directory ./backup # 从目录导入
  $0 mirrors                   # 配置镜像源
  $0 test                      # 测试镜像源速度
  $0 package                   # 创建本地化包
  $0 package ./my-package      # 创建到指定目录

工作流程:
  1. 首次使用: $0 pull        # 拉取镜像
  2. 备份镜像: $0 export      # 导出备份
  3. 恢复镜像: $0 import      # 导入恢复
  4. 网络优化: $0 mirrors     # 配置镜像源

注意:
  - 需要Docker权限
  - 导出/导入操作需要足够的磁盘空间
  - 配置镜像源需要sudo权限
EOF
}

# 主函数
main() {
    local command=${1:-"status"}
    local arg1=$2
    local arg2=$3
    
    log_info "=== Excel_lowCode Docker基础镜像管理 ==="
    
    # 检查依赖
    check_dependencies
    
    # 显示系统信息
    show_system_info
    
    case "$command" in
        "status")
            show_base_images_status
            ;;
            
        "pull")
            pull_base_images
            show_base_images_status
            ;;
            
        "export")
            export_base_images "$arg1"
            ;;
            
        "import")
            import_base_images "$arg1" "$arg2"
            show_base_images_status
            ;;
            
        "mirrors")
            configure_mirrors
            ;;
            
        "test")
            test_mirror_speed
            ;;
            
        "package")
            create_localization_package "$arg1"
            ;;
            
        "help"|"--help"|"-h")
            show_help
            exit 0
            ;;
            
        *)
            log_error "未知命令: $command"
            show_help
            exit 1
            ;;
    esac
    
    log_success "操作完成"
}

# 执行主函数
main "$@"

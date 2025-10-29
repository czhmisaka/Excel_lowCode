#!/bin/bash

# Excel_lowCode - Unified Docker 容器导入导出脚本
# 专门用于处理 unified 容器的镜像和数据卷导入导出
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

# 检查unified容器状态
check_container_status() {
    local container_name="annual-leave-unified"
    
    if docker ps -a --format "table {{.Names}}" | grep -q "$container_name"; then
        if docker ps --format "table {{.Names}}" | grep -q "$container_name"; then
            log_info "容器正在运行: $container_name"
            return 0
        else
            log_warning "容器存在但未运行: $container_name"
            return 1
        fi
    else
        log_warning "容器不存在: $container_name"
        return 2
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
    echo "unified-${timestamp}-${git_hash}"
}

# 导出unified镜像
export_unified_image() {
    local image_name=$1
    local export_dir=$2
    local version_tag=$3
    local compress=$4
    
    # 清理镜像名称中的特殊字符
    local clean_image_name=$(echo "$image_name" | sed 's/[:/]/_/g')
    local image_file="${export_dir}/${clean_image_name}-${version_tag}.tar"
    
    log_info "导出unified镜像: ${image_name}"
    
    # 检查镜像是否存在
    if ! docker image inspect "$image_name" > /dev/null 2>&1; then
        log_error "unified镜像不存在: ${image_name}"
        return 1
    fi
    
    # 导出镜像
    docker save -o "$image_file" "$image_name"
    
    # 压缩镜像文件
    if [ "$compress" = "true" ]; then
        log_info "压缩镜像文件..."
        gzip "$image_file"
        local compressed_file="${image_file}.gz"
        local compressed_size=$(du -h "$compressed_file" 2>/dev/null | cut -f1 || echo "unknown")
        log_success "unified镜像导出完成: ${compressed_file} (${compressed_size})"
        echo "$compressed_file"
    else
        local file_size=$(du -h "$image_file" 2>/dev/null | cut -f1 || echo "unknown")
        log_success "unified镜像导出完成: ${image_file} (${file_size})"
        echo "$image_file"
    fi
}

# 备份数据卷
backup_data_volumes() {
    local export_dir=$1
    local version_tag=$2
    local container_name="annual-leave-unified"
    
    log_info "开始备份数据卷..."
    
    # 检查容器是否运行
    if ! docker ps --format "table {{.Names}}" | grep -q "$container_name"; then
        log_warning "容器未运行，无法备份数据卷"
        return 1
    fi
    
    # 备份uploads卷
    local uploads_backup="${export_dir}/uploads-${version_tag}.tar.gz"
    log_info "备份uploads卷..."
    docker run --rm --volumes-from "$container_name" -v "$export_dir:/backup" alpine \
        tar -czf /backup/uploads-${version_tag}.tar.gz -C /app uploads 2>/dev/null || {
        log_warning "uploads卷备份失败，可能不存在"
    }
    
    # 备份data卷
    local data_backup="${export_dir}/data-${version_tag}.tar.gz"
    log_info "备份data卷..."
    docker run --rm --volumes-from "$container_name" -v "$export_dir:/backup" alpine \
        tar -czf /backup/data-${version_tag}.tar.gz -C /app data 2>/dev/null || {
        log_warning "data卷备份失败，可能不存在"
    }
    
    # 备份exports卷
    local exports_backup="${export_dir}/exports-${version_tag}.tar.gz"
    log_info "备份exports卷..."
    docker run --rm --volumes-from "$container_name" -v "$export_dir:/backup" alpine \
        tar -czf /backup/exports-${version_tag}.tar.gz -C /app exports 2>/dev/null || {
        log_warning "exports卷备份失败，可能不存在"
    }
    
    log_success "数据卷备份完成"
}

# 生成元数据文件
generate_metadata() {
    local export_dir=$1
    local version_tag=$2
    local image_file=$3
    
    local metadata_file="${export_dir}/metadata-${version_tag}.json"
    
    # 获取文件大小和校验和，处理可能的错误
    local file_size=$(du -h "$image_file" 2>/dev/null | cut -f1 || echo "unknown")
    local file_checksum=$(shasum -a 256 "$image_file" 2>/dev/null | cut -d' ' -f1 || echo "unknown")
    
    cat > "$metadata_file" << EOF
{
    "export": {
        "timestamp": "$(date -Iseconds)",
        "version": "${version_tag}",
        "system": "Excel_lowCode",
        "type": "unified"
    },
    "image": {
        "file": "$(basename "$image_file")",
        "size": "${file_size}",
        "checksum": "${file_checksum}"
    },
    "volumes": {
        "uploads": {
            "file": "uploads-${version_tag}.tar.gz",
            "exists": "$([ -f "${export_dir}/uploads-${version_tag}.tar.gz" ] && echo "true" || echo "false")"
        },
        "data": {
            "file": "data-${version_tag}.tar.gz",
            "exists": "$([ -f "${export_dir}/data-${version_tag}.tar.gz" ] && echo "true" || echo "false")"
        },
        "exports": {
            "file": "exports-${version_tag}.tar.gz",
            "exists": "$([ -f "${export_dir}/exports-${version_tag}.tar.gz" ] && echo "true" || echo "false")"
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

# 导入unified镜像
import_unified_image() {
    local image_file=$1
    local image_name=$2
    
    log_info "导入unified镜像: ${image_name}"
    
    # 检查文件是否存在
    if [ ! -f "$image_file" ]; then
        log_error "镜像文件不存在: ${image_file}"
        return 1
    fi
    
    # 解压文件（如果需要）
    local actual_file="$image_file"
    if [[ "$image_file" == *.gz ]]; then
        log_info "解压镜像文件..."
        local extracted_file="${image_file%.gz}"
        gunzip -c "$image_file" > "$extracted_file"
        actual_file="$extracted_file"
    fi
    
    # 导入镜像
    docker load -i "$actual_file"
    
    # 清理临时文件
    if [ "$actual_file" != "$image_file" ]; then
        rm -f "$actual_file"
    fi
    
    # 验证导入
    if docker image inspect "$image_name" > /dev/null 2>&1; then
        local image_size=$(docker image inspect "$image_name" | grep -o '"Size": [0-9]*' | cut -d' ' -f2)
        local human_size=$(numfmt --to=iec "$image_size")
        log_success "unified镜像导入成功: ${image_name} (${human_size})"
        return 0
    else
        log_error "unified镜像导入失败: ${image_name}"
        return 1
    fi
}

# 恢复数据卷
restore_data_volumes() {
    local export_dir=$1
    local version_tag=$2
    local container_name="annual-leave-unified"
    
    log_info "开始恢复数据卷..."
    
    # 恢复uploads卷
    local uploads_backup="${export_dir}/uploads-${version_tag}.tar.gz"
    if [ -f "$uploads_backup" ]; then
        log_info "恢复uploads卷..."
        docker run --rm --volumes-from "$container_name" -v "$export_dir:/backup" alpine \
            sh -c "rm -rf /app/uploads/* && tar -xzf /backup/uploads-${version_tag}.tar.gz -C /app" 2>/dev/null || {
            log_warning "uploads卷恢复失败"
        }
    else
        log_warning "uploads备份文件不存在: $uploads_backup"
    fi
    
    # 恢复data卷
    local data_backup="${export_dir}/data-${version_tag}.tar.gz"
    if [ -f "$data_backup" ]; then
        log_info "恢复data卷..."
        docker run --rm --volumes-from "$container_name" -v "$export_dir:/backup" alpine \
            sh -c "rm -rf /app/data/* && tar -xzf /backup/data-${version_tag}.tar.gz -C /app" 2>/dev/null || {
            log_warning "data卷恢复失败"
        }
    else
        log_warning "data备份文件不存在: $data_backup"
    fi
    
    # 恢复exports卷
    local exports_backup="${export_dir}/exports-${version_tag}.tar.gz"
    if [ -f "$exports_backup" ]; then
        log_info "恢复exports卷..."
        docker run --rm --volumes-from "$container_name" -v "$export_dir:/backup" alpine \
            sh -c "rm -rf /app/exports/* && tar -xzf /backup/exports-${version_tag}.tar.gz -C /app" 2>/dev/null || {
            log_warning "exports卷恢复失败"
        }
    else
        log_warning "exports备份文件不存在: $exports_backup"
    fi
    
    log_success "数据卷恢复完成"
}

# 打包导出文件
package_export() {
    local export_dir=$1
    local version_tag=$2
    # 使用固定包名避免文件名过长
    local package_name="excel-lowcode-deployment"
    
    log_info "开始打包导出文件..."
    
    # 创建临时打包目录（使用更短的名称）
    local temp_dir="${export_dir}/temp-package"
    mkdir -p "$temp_dir"
    
    # 复制镜像文件
    cp "${export_dir}"/*"${version_tag}"*.tar.gz "$temp_dir/" 2>/dev/null || true
    cp "${export_dir}"/*"${version_tag}"*.tar "$temp_dir/" 2>/dev/null || true
    
    # 复制元数据文件
    cp "${export_dir}/metadata-${version_tag}.json" "$temp_dir/"
    
    # 复制启动脚本
    cp "docker-compose.unified.yml" "$temp_dir/"
    cp "docker-compose.sqlite.yml" "$temp_dir/"
    cp "docker-compose.local.yml" "$temp_dir/"
    cp "docker-compose.yml" "$temp_dir/"
    cp ".env.template" "$temp_dir/"
    
    # 创建启动脚本
    cat > "$temp_dir/start.sh" << 'EOF'
#!/bin/bash
# Excel_lowCode Unified 容器启动脚本

set -e

echo "=== Excel_lowCode Unified 容器启动 ==="

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "错误: Docker未安装，请先安装Docker"
    exit 1
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "错误: Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

# 加载环境变量
if [ -f .env ]; then
    echo "加载环境变量..."
    source .env
else
    echo "警告: 未找到.env文件，请先复制.env.template为.env并配置"
    cp .env.template .env
    echo "已创建.env文件，请编辑配置后重新运行此脚本"
    exit 1
fi

# 选择部署配置
echo "选择部署配置:"
echo "1) Unified 容器 (推荐)"
echo "2) SQLite 版本"
echo "3) 本地开发版本"
read -p "请输入选择 (1-3): " choice

case $choice in
    1)
        compose_file="docker-compose.unified.yml"
        ;;
    2)
        compose_file="docker-compose.sqlite.yml"
        ;;
    3)
        compose_file="docker-compose.local.yml"
        ;;
    *)
        echo "无效选择，使用默认配置"
        compose_file="docker-compose.unified.yml"
        ;;
esac

echo "使用配置: $compose_file"

# 启动服务
if command -v docker-compose &> /dev/null; then
    docker-compose -f "$compose_file" up -d
else
    docker compose -f "$compose_file" up -d
fi

echo "服务启动完成!"
echo ""
echo "访问地址:"
echo "前端: http://localhost:${FRONTEND_PORT:-8080}"
echo "后端API: http://localhost:${BACKEND_PORT:-3000}"
echo "MCP服务: http://localhost:${MCP_SERVER_PORT:-3001}"
echo ""
echo "查看服务状态: docker ps"
echo "查看日志: docker-compose -f $compose_file logs -f"

EOF
    
    chmod +x "$temp_dir/start.sh"
    
    # 创建导入脚本
    cat > "$temp_dir/import.sh" << 'EOF'
#!/bin/bash
# Excel_lowCode Unified 容器导入脚本

set -e

echo "=== Excel_lowCode Unified 容器导入 ==="

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "错误: Docker未安装，请先安装Docker"
    exit 1
fi

# 查找最新的元数据文件
metadata_file=$(ls -t metadata-unified-*.json 2>/dev/null | head -1)

if [ -z "$metadata_file" ] || [ ! -f "$metadata_file" ]; then
    echo "错误: 未找到元数据文件"
    exit 1
fi

echo "使用元数据文件: $metadata_file"

# 解析元数据
export_dir=$(dirname "$metadata_file")
version=$(grep -o '"version": "[^"]*' "$metadata_file" | cut -d'"' -f4)
image_file=$(grep -o '"file": "[^"]*' "$metadata_file" | head -1 | cut -d'"' -f4)

if [ -z "$version" ] || [ -z "$image_file" ]; then
    echo "错误: 无法解析元数据文件"
    exit 1
fi

echo "导入版本: $version"

# 完整文件路径
full_image_path="${export_dir}/${image_file}"

# 导入镜像
echo "导入镜像: $image_file"
if [[ "$image_file" == *.gz ]]; then
    echo "解压镜像文件..."
    gunzip -c "$full_image_path" | docker load
else
    docker load -i "$full_image_path"
fi

echo "镜像导入成功!"
echo ""
echo "下一步:"
echo "1. 运行 ./start.sh 启动服务"
echo "2. 或手动配置环境变量后启动"

EOF
    
    chmod +x "$temp_dir/import.sh"
    
    # 创建说明文档
    cat > "$temp_dir/README.md" << EOF
# Excel_lowCode Unified 容器部署包

## 版本信息
- 版本: ${version_tag}
- 导出时间: $(date)
- 系统: Excel_lowCode
- 类型: Unified 容器

## 包含内容
1. Docker 镜像文件
2. 启动脚本 (start.sh)
3. 导入脚本 (import.sh)  
4. Docker Compose 配置文件
5. 环境变量模板
6. 元数据文件

## 快速开始

### 方法1: 自动部署
\`\`\`bash
# 导入镜像
./import.sh

# 启动服务
./start.sh
\`\`\`

### 方法2: 手动部署
\`\`\`bash
# 1. 配置环境变量
cp .env.template .env
# 编辑 .env 文件配置数据库等信息

# 2. 导入镜像
docker load -i <镜像文件>

# 3. 启动服务
docker-compose -f docker-compose.unified.yml up -d
\`\`\`

## 访问地址
- 前端: http://localhost:8080
- 后端API: http://localhost:3000  
- MCP服务: http://localhost:3001

## 管理命令
\`\`\`bash
# 查看服务状态
docker ps

# 查看日志
docker-compose -f docker-compose.unified.yml logs -f

# 停止服务
docker-compose -f docker-compose.unified.yml down

# 重启服务
docker-compose -f docker-compose.unified.yml restart
\`\`\`

## 支持配置
- Unified 容器 (推荐)
- SQLite 版本
- 本地开发版本
EOF
    
    # 创建ZIP包
    local zip_file="${export_dir}/${package_name}.zip"
    cd "$temp_dir" && zip -r "../${package_name}.zip" ./* && cd - > /dev/null
    
    # 清理临时目录
    rm -rf "$temp_dir"
    
    log_success "打包完成: ${zip_file}"
    echo "$zip_file"
}

# 显示导出信息
show_export_info() {
    local export_dir=$1
    local version_tag=$2
    local zip_file=$3
    
    log_info "=== Unified容器导出完成 ==="
    log_info "导出目录: ${export_dir}"
    log_info "版本标签: ${version_tag}"
    log_info ""
    log_info "导出文件:"
    ls -la "${export_dir}"/*"${version_tag}"*
    if [ -n "$zip_file" ]; then
        ls -la "$zip_file"
    fi
    log_info ""
    log_info "导入命令:"
    echo "  ./docker.sh import ${export_dir}/metadata-${version_tag}.json"
    if [ -n "$zip_file" ]; then
        log_info ""
        log_info "完整部署包:"
        echo "  ${zip_file}"
        log_info ""
        log_info "快速部署:"
        echo "  解压后运行: ./import.sh 和 ./start.sh"
    fi
}

# 显示导入信息
show_import_info() {
    local version=$1
    
    log_info "=== Unified容器导入完成 ==="
    log_info "版本: ${version}"
    log_info ""
    log_info "已导入的镜像:"
    docker images | grep "annual-leave-unified" || log_warning "未找到unified镜像"
    log_info ""
    log_info "下一步操作:"
    echo "  1. 配置环境变量: cp .env.template .env"
    echo "  2. 启动服务: docker-compose -f docker-compose.unified.yml up -d"
    echo "  3. 检查服务状态: docker ps"
}

# 导出功能
export_unified() {
    local compress=${COMPRESS_IMAGES:-true}
    local skip_package="false"
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --no-compress)
                compress="false"
                shift
                ;;
            --no-volumes)
                skip_volumes="true"
                shift
                ;;
            --no-package)
                skip_package="true"
                shift
                ;;
            *)
                log_error "未知参数: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    log_info "=== Excel_lowCode Unified容器导出 ==="
    
    # 检查依赖
    check_docker
    
    # 加载配置
    load_env
    
    # 检查容器状态
    check_container_status
    
    # 创建导出目录
    local export_dir=$(create_export_dir)
    
    # 生成版本标签
    local version_tag=$(generate_version_tag)
    
    # 镜像名称
    local unified_image="${IMAGE_PREFIX:-annual-leave}-unified:${UNIFIED_TAG:-latest}"
    
    # 导出镜像
    local image_file=$(export_unified_image "$unified_image" "$export_dir" "$version_tag" "$compress")
    
    # 备份数据卷
    if [ "$skip_volumes" != "true" ]; then
        backup_data_volumes "$export_dir" "$version_tag"
    fi
    
    # 生成元数据文件
    generate_metadata "$export_dir" "$version_tag" "$image_file"
    
    # 打包导出文件
    local zip_file=""
    if [ "$skip_package" != "true" ]; then
        zip_file=$(package_export "$export_dir" "$version_tag")
    fi
    
    # 显示导出信息
    show_export_info "$export_dir" "$version_tag" "$zip_file"
    
    log_success "Unified容器导出流程完成"
}

# 导入功能
import_unified() {
    local metadata_file=""
    
    # 解析参数
    if [ $# -eq 0 ]; then
        # 如果没有参数，查找最新的元数据文件
        local latest_metadata=$(ls -t exports/metadata-unified-*.json 2>/dev/null | head -1)
        if [ -n "$latest_metadata" ]; then
            metadata_file="$latest_metadata"
            log_info "使用最新的unified元数据文件: ${metadata_file}"
        else
            log_error "未找到unified元数据文件，请指定文件路径"
            show_usage
            exit 1
        fi
    else
        metadata_file="$1"
    fi
    
    log_info "=== Excel_lowCode Unified容器导入 ==="
    
    # 检查依赖
    check_docker
    
    # 加载配置
    load_env
    
    # 解析元数据
    if [ ! -f "$metadata_file" ]; then
        log_error "元数据文件不存在: ${metadata_file}"
        exit 1
    fi
    
    local export_dir=$(dirname "$metadata_file")
    local version=$(grep -o '"version": "[^"]*' "$metadata_file" | cut -d'"' -f4)
    local image_file=$(grep -o '"file": "[^"]*' "$metadata_file" | head -1 | cut -d'"' -f4)
    
    if [ -z "$version" ] || [ -z "$image_file" ]; then
        log_error "无法解析元数据文件"
        exit 1
    fi
    
    log_info "导入版本: ${version}"
    
    # 完整文件路径
    local full_image_path="${export_dir}/${image_file}"
    
    # 导入镜像
    local unified_image="${IMAGE_PREFIX:-annual-leave}-unified:${UNIFIED_TAG:-latest}"
    import_unified_image "$full_image_path" "$unified_image" || exit 1
    
    # 恢复数据卷（需要先启动容器）
    log_info "启动容器以恢复数据卷..."
    docker-compose -f docker-compose.unified.yml up -d
    
    # 等待容器启动
    sleep 10
    
    # 恢复数据卷
    restore_data_volumes "$export_dir" "$version"
    
    # 重启容器应用更改
    log_info "重启容器应用数据卷更改..."
    docker-compose -f docker-compose.unified.yml restart
    
    # 显示导入信息
    show_import_info "$version"
    
    log_success "Unified容器导入流程完成"
}

# 显示使用说明
show_usage() {
    echo "使用方法: $0 <命令> [选项]"
    echo ""
    echo "命令:"
    echo "  export    导出unified容器镜像和数据卷"
    echo "  import    导入unified容器镜像和数据卷"
    echo ""
    echo "导出选项:"
    echo "  --no-compress     不压缩导出的镜像文件"
    echo "  --no-volumes      不备份数据卷"
    echo "  --no-package      不打包为ZIP文件"
    echo ""
    echo "导入选项:"
    echo "  <元数据文件>      指定要导入的元数据文件路径（可选）"
    echo "                   如果不指定，会自动使用最新的元数据文件"
    echo ""
    echo "示例:"
    echo "  $0 export                    # 导出unified容器并打包为ZIP"
    echo "  $0 export --no-compress      # 导出unified容器不压缩"
    echo "  $0 export --no-volumes       # 仅导出镜像，不备份数据卷"
    echo "  $0 export --no-package       # 仅导出文件，不打包"
    echo "  $0 import                    # 导入最新的unified容器包"
    echo "  $0 import exports/metadata-unified-20250101-120000-abc123.json  # 导入指定版本"
    echo ""
    echo "注意:"
    echo "  - 导入数据卷需要容器正在运行"
    echo "  - 确保有足够的磁盘空间进行导出导入操作"
    echo "  - 默认会打包为完整的部署ZIP包，包含启动脚本和配置文件"
}

# 主函数
main() {
    if [ $# -eq 0 ]; then
        show_usage
        exit 1
    fi
    
    case "$1" in
        export)
            shift
            export_unified "$@"
            ;;
        import)
            shift
            import_unified "$@"
            ;;
        --help|-h)
            show_usage
            ;;
        *)
            log_error "未知命令: $1"
            show_usage
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"

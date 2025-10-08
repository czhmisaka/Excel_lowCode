#!/bin/bash

# 年假计算系统 - 完整数据导出脚本
# 导出数据库数据、文件数据、配置数据和Docker镜像
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
    local missing_deps=()
    
    # 检查Docker
    if ! command -v docker &> /dev/null; then
        missing_deps+=("docker")
    fi
    
    # 检查MySQL客户端
    if ! command -v mysql &> /dev/null; then
        missing_deps+=("mysql-client")
    fi
    
    # 检查mysqldump
    if ! command -v mysqldump &> /dev/null; then
        missing_deps+=("mysqldump")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "缺少必要的依赖: ${missing_deps[*]}"
        log_info "请安装缺少的依赖后重试"
        exit 1
    fi
}

# 加载环境变量
load_env() {
    local env_files=(".env" "docker/.env")
    
    for env_file in "${env_files[@]}"; do
        if [ -f "$env_file" ]; then
            log_info "加载环境变量: $env_file"
            set -a
            source "$env_file"
            set +a
        fi
    done
    
    # 设置默认值
    DB_HOST=${DB_HOST:-localhost}
    DB_PORT=${DB_PORT:-3306}
    DB_NAME=${DB_NAME:-annual_leave}
    DB_USER=${DB_USER:-annual_user}
    DB_PASSWORD=${DB_PASSWORD:-annual_password}
    EXPORT_DIR=${EXPORT_DIR:-./exports}
    COMPRESS_DATA=${COMPRESS_DATA:-true}
}

# 创建导出目录
create_export_dir() {
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local git_hash=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    local export_name="annual-leave-backup-${timestamp}-${git_hash}"
    local export_path="${EXPORT_DIR}/${export_name}"
    
    mkdir -p "$export_path"
    echo "$export_path"
}

# 导出数据库数据
export_database() {
    local export_path=$1
    
    log_info "导出数据库数据..."
    
    # 创建数据库备份目录
    local db_dir="${export_path}/database"
    mkdir -p "$db_dir"
    
    # 导出数据库结构
    log_info "导出数据库结构..."
    mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" \
        --no-data --skip-comments "$DB_NAME" > "${db_dir}/database-structure.sql"
    
    # 导出数据（不包含系统表）
    log_info "导出业务数据..."
    mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" \
        --no-create-info --skip-comments --skip-triggers \
        --ignore-table="${DB_NAME}.table_mappings" \
        "$DB_NAME" employee_info annual_leave_records leave_records > "${db_dir}/data.sql"
    
    # 导出表映射数据
    log_info "导出表映射数据..."
    mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" \
        --no-create-info --skip-comments --skip-triggers \
        "$DB_NAME" table_mappings > "${db_dir}/table-mappings.sql"
    
    # 验证导出文件
    if [ -s "${db_dir}/database-structure.sql" ] && [ -s "${db_dir}/data.sql" ]; then
        log_success "数据库导出完成"
        return 0
    else
        log_error "数据库导出失败"
        return 1
    fi
}

# 导出文件数据
export_files() {
    local export_path=$1
    
    log_info "导出文件数据..."
    
    # 创建文件备份目录
    local files_dir="${export_path}/files"
    mkdir -p "$files_dir"
    
    # 检查Docker卷是否存在
    if docker volume inspect backend-uploads > /dev/null 2>&1; then
        log_info "备份Docker卷: backend-uploads"
        
        # 创建临时容器来备份卷数据
        docker run --rm \
            -v backend-uploads:/source \
            -v "${files_dir}:/backup" \
            alpine tar -czf /backup/uploads.tar.gz -C /source .
        
        if [ $? -eq 0 ]; then
            log_success "文件数据导出完成"
        else
            log_error "文件数据导出失败"
            return 1
        fi
    else
        log_warning "Docker卷 backend-uploads 不存在，跳过文件导出"
    fi
    
    # 备份本地上传目录（如果存在）
    if [ -d "backend/uploads" ]; then
        log_info "备份本地上传目录..."
        tar -czf "${files_dir}/local-uploads.tar.gz" -C backend uploads
        log_success "本地上传目录备份完成"
    fi
    
    return 0
}

# 导出配置数据
export_configs() {
    local export_path=$1
    
    log_info "导出配置数据..."
    
    # 创建配置备份目录
    local configs_dir="${export_path}/configs"
    mkdir -p "$configs_dir"
    
    # 备份环境变量文件
    local env_files=(".env" "docker/.env" "docker/.env.local" "fe/.env.production")
    for env_file in "${env_files[@]}"; do
        if [ -f "$env_file" ]; then
            cp "$env_file" "${configs_dir}/"
            log_info "备份配置文件: $env_file"
        fi
    done
    
    # 备份Docker配置
    if [ -f "docker/docker-compose.yml" ]; then
        cp docker/docker-compose.yml "${configs_dir}/"
    fi
    
    if [ -f "docker/docker-compose.local.yml" ]; then
        cp docker/docker-compose.local.yml "${configs_dir}/"
    fi
    
    # 备份数据库初始化脚本
    if [ -f "docker/init-database.sql" ]; then
        cp docker/init-database.sql "${configs_dir}/"
    fi
    
    log_success "配置数据导出完成"
    return 0
}

# 导出Docker镜像
export_images() {
    local export_path=$1
    
    log_info "导出Docker镜像..."
    
    # 创建镜像备份目录
    local images_dir="${export_path}/images"
    mkdir -p "$images_dir"
    
    # 调用现有的镜像导出脚本
    if [ -f "docker/export-images.sh" ]; then
        log_info "使用现有镜像导出脚本..."
        
        # 设置环境变量以控制导出目录
        export EXPORT_DIR="$images_dir"
        export COMPRESS_IMAGES=true
        
        if docker/export-images.sh --no-compress > /dev/null 2>&1; then
            log_success "Docker镜像导出完成"
            return 0
        else
            log_warning "镜像导出脚本执行失败，尝试直接导出镜像"
        fi
    fi
    
    # 直接导出镜像（备用方法）
    local images=("annual-leave-frontend:latest" "annual-leave-backend:latest")
    
    for image in "${images[@]}"; do
        if docker image inspect "$image" > /dev/null 2>&1; then
            log_info "导出镜像: $image"
            docker save -o "${images_dir}/${image//:/_}.tar" "$image"
        else
            log_warning "镜像不存在: $image"
        fi
    done
    
    log_success "Docker镜像导出完成"
    return 0
}

# 生成元数据文件
generate_metadata() {
    local export_path=$1
    
    log_info "生成元数据文件..."
    
    local metadata_file="${export_path}/metadata.json"
    
    cat > "$metadata_file" << EOF
{
    "export": {
        "timestamp": "$(date -Iseconds)",
        "version": "$(basename "$export_path")",
        "system": "年假计算系统",
        "description": "完整系统数据备份"
    },
    "database": {
        "host": "${DB_HOST}",
        "port": "${DB_PORT}",
        "name": "${DB_NAME}",
        "user": "${DB_USER}",
        "tables": ["employee_info", "annual_leave_records", "leave_records", "table_mappings"]
    },
    "components": {
        "database": "$(find "${export_path}/database" -name "*.sql" 2>/dev/null | wc -l || echo 0) 个文件",
        "files": "$(find "${export_path}/files" -name "*.tar.gz" 2>/dev/null | wc -l || echo 0) 个文件",
        "configs": "$(find "${export_path}/configs" -type f 2>/dev/null | wc -l || echo 0) 个文件",
        "images": "$(find "${export_path}/images" -name "*.tar" 2>/dev/null | wc -l || echo 0) 个镜像"
    },
    "environment": {
        "mysql_version": "$(mysql --version 2>/dev/null | head -1 || echo "N/A")",
        "docker_version": "$(docker --version | cut -d' ' -f3 | sed 's/,//' 2>/dev/null || echo "N/A")",
        "system": "$(uname -s) $(uname -r)"
    }
}
EOF
    
    log_success "元数据文件生成完成: ${metadata_file}"
}

# 压缩导出包
compress_export() {
    local export_path=$1
    
    if [ "$COMPRESS_DATA" = "true" ]; then
        log_info "压缩导出包..."
        
        local export_dir=$(dirname "$export_path")
        local export_name=$(basename "$export_path")
        local compressed_file="${export_dir}/${export_name}.tar.gz"
        
        # 压缩整个导出目录
        tar -czf "$compressed_file" -C "$export_dir" "$export_name"
        
        # 计算文件大小
        local file_size=$(du -h "$compressed_file" | cut -f1)
        
        # 删除原始目录
        rm -rf "$export_path"
        
        log_success "导出包压缩完成: ${compressed_file} (${file_size})"
        echo "$compressed_file"
    else
        log_info "跳过压缩，导出目录: ${export_path}"
        echo "$export_path"
    fi
}

# 显示导出信息
show_export_info() {
    local final_path=$1
    
    log_info "=== 导出完成 ==="
    log_info "导出位置: ${final_path}"
    log_info ""
    log_info "导出内容:"
    if [ -d "$final_path" ]; then
        find "$final_path" -type f | while read file; do
            local size=$(du -h "$file" | cut -f1)
            echo "  - $(basename "$file") (${size})"
        done
    else
        local size=$(du -h "$final_path" | cut -f1)
        echo "  - $(basename "$final_path") (${size})"
    fi
    log_info ""
    log_info "导入命令:"
    echo "  ./importData.sh ${final_path}"
}

# 显示使用说明
show_usage() {
    echo "使用方法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --no-compress     不压缩导出数据"
    echo "  --database-only   仅导出数据库数据"
    echo "  --files-only      仅导出文件数据"
    echo "  --configs-only    仅导出配置数据"
    echo "  --images-only     仅导出Docker镜像"
    echo "  --help            显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0                    # 导出所有数据并压缩"
    echo "  $0 --no-compress      # 导出所有数据不压缩"
    echo "  $0 --database-only    # 仅导出数据库数据"
}

# 主函数
main() {
    local compress=${COMPRESS_DATA:-true}
    local export_type="all"
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --no-compress)
                compress="false"
                shift
                ;;
            --database-only)
                export_type="database"
                shift
                ;;
            --files-only)
                export_type="files"
                shift
                ;;
            --configs-only)
                export_type="configs"
                shift
                ;;
            --images-only)
                export_type="images"
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
    
    log_info "=== 年假计算系统 - 完整数据导出 ==="
    
    # 检查依赖
    check_dependencies
    
    # 加载环境变量
    load_env
    
    # 创建导出目录
    local export_path=$(create_export_dir)
    
    log_info "开始导出流程..."
    log_info "导出类型: ${export_type}"
    log_info "导出目录: ${export_path}"
    
    # 执行导出操作
    case $export_type in
        "all")
            export_database "$export_path" || exit 1
            export_files "$export_path" || exit 1
            export_configs "$export_path" || exit 1
            export_images "$export_path" || exit 1
            ;;
        "database")
            export_database "$export_path" || exit 1
            ;;
        "files")
            export_files "$export_path" || exit 1
            ;;
        "configs")
            export_configs "$export_path" || exit 1
            ;;
        "images")
            export_images "$export_path" || exit 1
            ;;
    esac
    
    # 生成元数据
    if [ "$export_type" = "all" ]; then
        generate_metadata "$export_path" || exit 1
    fi
    
    # 压缩导出包
    local final_path=$(compress_export "$export_path")
    
    # 显示导出信息
    show_export_info "$final_path"
    
    log_success "数据导出流程完成"
}

# 执行主函数
main "$@"

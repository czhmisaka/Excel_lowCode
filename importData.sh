#!/bin/bash

# Excel_lowCode - 完整数据导入脚本
# 导入数据库数据、文件数据、配置数据和Docker镜像
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
}

# 解析导入包
parse_import_package() {
    local import_path=$1
    
    if [ -z "$import_path" ]; then
        log_error "请指定导入包路径"
        show_usage
        exit 1
    fi
    
    # 检查文件/目录是否存在
    if [ ! -e "$import_path" ]; then
        log_error "导入包不存在: ${import_path}"
        exit 1
    fi
    
    # 如果是压缩文件，先解压
    if [[ "$import_path" == *.tar.gz ]]; then
        log_info "解压导入包..."
        local extract_dir=$(mktemp -d)
        tar -xzf "$import_path" -C "$extract_dir"
        
        # 查找解压后的目录
        local extracted_dir=$(find "$extract_dir" -maxdepth 1 -type d -name "annual-leave-backup-*" | head -1)
        
        if [ -n "$extracted_dir" ]; then
            echo "$extracted_dir"
            return 0
        else
            log_error "无法找到有效的备份目录"
            rm -rf "$extract_dir"
            exit 1
        fi
    elif [ -d "$import_path" ]; then
        # 已经是目录
        echo "$import_path"
        return 0
    else
        log_error "不支持的导入包格式: ${import_path}"
        exit 1
    fi
}

# 验证导入包完整性
verify_import_package() {
    local import_dir=$1
    
    log_info "验证导入包完整性..."
    
    # 检查必要的目录结构
    local required_dirs=("database" "configs")
    local optional_dirs=("files" "images")
    
    for dir in "${required_dirs[@]}"; do
        if [ ! -d "${import_dir}/${dir}" ]; then
            log_error "导入包缺少必要目录: ${dir}"
            return 1
        fi
    done
    
    # 检查数据库文件
    local db_files=("database-structure.sql" "data.sql")
    for file in "${db_files[@]}"; do
        if [ ! -f "${import_dir}/database/${file}" ]; then
            log_error "数据库文件缺失: ${file}"
            return 1
        fi
    done
    
    # 检查元数据文件
    if [ -f "${import_dir}/metadata.json" ]; then
        log_info "找到元数据文件"
        if command -v jq &> /dev/null; then
            local system_name=$(jq -r '.export.system' "${import_dir}/metadata.json")
            log_info "导入系统: ${system_name}"
        fi
    fi
    
    log_success "导入包验证通过"
    return 0
}

# 停止现有服务
stop_services() {
    log_info "停止现有服务..."
    
    # 检查Docker Compose命令
    local compose_cmd=""
    if command -v docker-compose &> /dev/null; then
        compose_cmd="docker-compose"
    elif docker compose version &> /dev/null; then
        compose_cmd="docker compose"
    fi
    
    if [ -n "$compose_cmd" ] && [ -f "docker/docker-compose.yml" ]; then
        (cd docker && $compose_cmd down --remove-orphans 2>/dev/null || true)
        log_success "服务已停止"
    else
        log_warning "无法停止服务，跳过此步骤"
    fi
}

# 导入数据库数据
import_database() {
    local import_dir=$1
    
    log_info "导入数据库数据..."
    
    local db_dir="${import_dir}/database"
    
    # 检查数据库连接
    log_info "测试数据库连接..."
    if ! mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" > /dev/null 2>&1; then
        log_error "数据库连接失败，请检查数据库配置"
        return 1
    fi
    
    # 创建数据库（如果不存在）
    log_info "创建数据库..."
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || true
    
    # 导入数据库结构
    log_info "导入数据库结构..."
    if [ -f "${db_dir}/database-structure.sql" ]; then
        mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "${db_dir}/database-structure.sql"
    fi
    
    # 导入业务数据
    log_info "导入业务数据..."
    if [ -f "${db_dir}/data.sql" ]; then
        mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "${db_dir}/data.sql"
    fi
    
    # 导入表映射数据
    log_info "导入表映射数据..."
    if [ -f "${db_dir}/table-mappings.sql" ]; then
        mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "${db_dir}/table-mappings.sql"
    fi
    
    # 验证导入结果
    log_info "验证数据库导入..."
    local table_count=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -N -e "SHOW TABLES;" | wc -l)
    
    if [ "$table_count" -ge 3 ]; then
        log_success "数据库导入完成，共 ${table_count} 个表"
        return 0
    else
        log_error "数据库导入验证失败，表数量不足"
        return 1
    fi
}

# 导入文件数据
import_files() {
    local import_dir=$1
    
    log_info "导入文件数据..."
    
    local files_dir="${import_dir}/files"
    
    # 恢复Docker卷数据
    if [ -f "${files_dir}/uploads.tar.gz" ]; then
        log_info "恢复Docker卷数据..."
        
        # 确保Docker卷存在
        if ! docker volume inspect backend-uploads > /dev/null 2>&1; then
            log_info "创建Docker卷: backend-uploads"
            docker volume create backend-uploads
        fi
        
        # 使用临时容器恢复数据
        docker run --rm \
            -v backend-uploads:/target \
            -v "${files_dir}:/backup" \
            alpine sh -c "tar -xzf /backup/uploads.tar.gz -C /target && chmod -R 777 /target"
        
        if [ $? -eq 0 ]; then
            log_success "Docker卷数据恢复完成"
        else
            log_error "Docker卷数据恢复失败"
            return 1
        fi
    fi
    
    # 恢复本地上传目录
    if [ -f "${files_dir}/local-uploads.tar.gz" ]; then
        log_info "恢复本地上传目录..."
        mkdir -p backend/uploads
        tar -xzf "${files_dir}/local-uploads.tar.gz" -C backend
        
        if [ $? -eq 0 ]; then
            log_success "本地上传目录恢复完成"
        else
            log_error "本地上传目录恢复失败"
            return 1
        fi
    fi
    
    return 0
}

# 导入配置数据
import_configs() {
    local import_dir=$1
    local overwrite=$2
    
    log_info "导入配置数据..."
    
    local configs_dir="${import_dir}/configs"
    
    # 恢复环境变量文件
    local env_files=(".env" "docker/.env" "docker/.env.local" "fe/.env.production")
    
    for env_file in "${env_files[@]}"; do
        local backup_file="${configs_dir}/$(basename "$env_file")"
        
        if [ -f "$backup_file" ]; then
            if [ "$overwrite" = "true" ] || [ ! -f "$env_file" ]; then
                log_info "恢复配置文件: $env_file"
                cp "$backup_file" "$env_file"
            else
                log_warning "配置文件已存在，跳过: $env_file (使用 --overwrite 强制覆盖)"
            fi
        fi
    done
    
    # 恢复Docker配置
    if [ -f "${configs_dir}/docker-compose.yml" ] && ([ "$overwrite" = "true" ] || [ ! -f "docker/docker-compose.yml" ]); then
        cp "${configs_dir}/docker-compose.yml" "docker/docker-compose.yml"
        log_info "恢复Docker Compose配置"
    fi
    
    if [ -f "${configs_dir}/docker-compose.local.yml" ] && ([ "$overwrite" = "true" ] || [ ! -f "docker/docker-compose.local.yml" ]); then
        cp "${configs_dir}/docker-compose.local.yml" "docker/docker-compose.local.yml"
        log_info "恢复本地Docker Compose配置"
    fi
    
    # 恢复数据库初始化脚本
    if [ -f "${configs_dir}/init-database.sql" ] && ([ "$overwrite" = "true" ] || [ ! -f "docker/init-database.sql" ]); then
        cp "${configs_dir}/init-database.sql" "docker/init-database.sql"
        log_info "恢复数据库初始化脚本"
    fi
    
    log_success "配置数据导入完成"
    return 0
}

# 导入Docker镜像
import_images() {
    local import_dir=$1
    
    log_info "导入Docker镜像..."
    
    local images_dir="${import_dir}/images"
    
    # 检查是否有镜像导出脚本的元数据
    local metadata_files=($(find "$images_dir" -name "metadata-*.json" 2>/dev/null))
    
    if [ ${#metadata_files[@]} -gt 0 ]; then
        log_info "使用现有镜像导入脚本..."
        
        # 使用现有的镜像导入脚本
        if [ -f "docker/import-images.sh" ]; then
            local metadata_file="${metadata_files[0]}"
            if docker/import-images.sh "$metadata_file" > /dev/null 2>&1; then
                log_success "Docker镜像导入完成"
                return 0
            else
                log_warning "镜像导入脚本执行失败，尝试直接导入镜像"
            fi
        fi
    fi
    
    # 直接导入镜像（备用方法）
    local image_files=($(find "$images_dir" -name "*.tar" 2>/dev/null))
    
    if [ ${#image_files[@]} -eq 0 ]; then
        log_warning "未找到镜像文件，跳过镜像导入"
        return 0
    fi
    
    for image_file in "${image_files[@]}"; do
        log_info "导入镜像: $(basename "$image_file")"
        docker load -i "$image_file"
    done
    
    # 验证镜像导入
    local imported_images=$(docker images | grep "annual-leave" | wc -l)
    log_success "Docker镜像导入完成，共 ${imported_images} 个镜像"
    return 0
}

# 启动服务
start_services() {
    log_info "启动服务..."
    
    # 检查Docker Compose命令
    local compose_cmd=""
    if command -v docker-compose &> /dev/null; then
        compose_cmd="docker-compose"
    elif docker compose version &> /dev/null; then
        compose_cmd="docker compose"
    fi
    
    if [ -n "$compose_cmd" ] && [ -f "docker/docker-compose.yml" ]; then
        (cd docker && $compose_cmd up -d)
        
        # 等待服务启动
        log_info "等待服务启动..."
        sleep 30
        
        # 检查服务状态
        if (cd docker && $compose_cmd ps | grep -q "Up"); then
            log_success "服务启动完成"
            return 0
        else
            log_error "服务启动失败"
            return 1
        fi
    else
        log_warning "无法启动服务，请手动启动"
        return 0
    fi
}

# 显示导入信息
show_import_info() {
    local import_dir=$1
    
    log_info "=== 导入完成 ==="
    log_info "导入来源: ${import_dir}"
    log_info ""
    log_info "已导入的内容:"
    
    # 数据库信息
    if [ -d "${import_dir}/database" ]; then
        local db_files=$(find "${import_dir}/database" -name "*.sql" | wc -l)
        echo "  - 数据库: ${db_files} 个文件"
    fi
    
    # 文件信息
    if [ -d "${import_dir}/files" ]; then
        local file_count=$(find "${import_dir}/files" -name "*.tar.gz" | wc -l)
        echo "  - 文件数据: ${file_count} 个备份"
    fi
    
    # 配置信息
    if [ -d "${import_dir}/configs" ]; then
        local config_count=$(find "${import_dir}/configs" -type f | wc -l)
        echo "  - 配置文件: ${config_count} 个文件"
    fi
    
    # 镜像信息
    if [ -d "${import_dir}/images" ]; then
        local image_count=$(find "${import_dir}/images" -name "*.tar" | wc -l)
        echo "  - Docker镜像: ${image_count} 个镜像"
    fi
    
    log_info ""
    log_info "下一步操作:"
    echo "  1. 检查服务状态: cd docker && docker-compose ps"
    echo "  2. 查看服务日志: cd docker && docker-compose logs"
    echo "  3. 访问前端: http://localhost:${FRONTEND_PORT:-8080}"
    echo "  4. 验证数据完整性"
}

# 清理临时文件
cleanup_temp_files() {
    local temp_dir=$1
    
    if [ -n "$temp_dir" ] && [ -d "$temp_dir" ]; then
        log_info "清理临时文件..."
        rm -rf "$temp_dir"
    fi
}

# 显示使用说明
show_usage() {
    echo "使用方法: $0 [选项] <导入包路径>"
    echo ""
    echo "参数:"
    echo "  导入包路径    导出的数据包路径 (.tar.gz 文件或目录)"
    echo ""
    echo "选项:"
    echo "  --overwrite     覆盖现有配置文件"
    echo "  --no-start      不自动启动服务"
    echo "  --database-only 仅导入数据库数据"
    echo "  --files-only    仅导入文件数据"
    echo "  --configs-only  仅导入配置数据"
    echo "  --images-only   仅导入Docker镜像"
    echo "  --help          显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 exports/annual-leave-backup-20250101-120000-abc123.tar.gz"
    echo "  $0 --overwrite exports/annual-leave-backup-20250101-120000-abc123"
    echo "  $0 --database-only exports/annual-leave-backup-20250101-120000-abc123.tar.gz"
}

# 主函数
main() {
    local overwrite="false"
    local auto_start="true"
    local import_type="all"
    local import_path=""
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --overwrite)
                overwrite="true"
                shift
                ;;
            --no-start)
                auto_start="false"
                shift
                ;;
            --database-only)
                import_type="database"
                shift
                ;;
            --files-only)
                import_type="files"
                shift
                ;;
            --configs-only)
                import_type="configs"
                shift
                ;;
            --images-only)
                import_type="images"
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                if [ -z "$import_path" ]; then
                    import_path="$1"
                    shift
                else
                    log_error "未知参数: $1"
                    show_usage
                    exit 1
                fi
                ;;
        esac
    done
    
    log_info "=== Excel_lowCode - 完整数据导入 ==="
    
    # 检查依赖
    check_dependencies
    
    # 加载环境变量
    load_env
    
    # 解析导入包
    local import_dir=$(parse_import_package "$import_path")
    
    # 验证导入包完整性
    verify_import_package "$import_dir" || exit 1
    
    # 停止现有服务
    stop_services
    
    # 执行导入操作
    case $import_type in
        "all")
            import_database "$import_dir" || exit 1
            import_files "$import_dir" || exit 1
            import_configs "$import_dir" "$overwrite" || exit 1
            import_images "$import_dir" || exit 1
            ;;
        "database")
            import_database "$import_dir" || exit 1
            ;;
        "files")
            import_files "$import_dir" || exit 1
            ;;
        "configs")
            import_configs "$import_dir" "$overwrite" || exit 1
            ;;
        "images")
            import_images "$import_dir" || exit 1
            ;;
    esac
    
    # 启动服务
    if [ "$auto_start" = "true" ]; then
        start_services || log_warning "服务启动失败，请手动检查"
    fi
    
    # 显示导入信息
    show_import_info "$import_dir"
    
    # 清理临时文件
    if [[ "$import_path" == *.tar.gz ]]; then
        cleanup_temp_files "$(dirname "$import_dir")"
    fi
    
    log_success "数据导入流程完成"
}

# 执行主函数
main "$@"

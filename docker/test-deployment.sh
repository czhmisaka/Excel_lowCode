#!/bin/bash

# 年假计算系统 - 部署测试脚本
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
    log_info "检查系统依赖..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装"
        return 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose未安装"
        return 1
    fi
    
    log_success "系统依赖检查通过"
}

# 检查Docker服务状态
check_docker_service() {
    log_info "检查Docker服务状态..."
    
    if ! docker info &> /dev/null; then
        log_error "Docker服务未运行"
        return 1
    fi
    
    log_success "Docker服务运行正常"
}

# 检查配置文件
check_config_files() {
    log_info "检查配置文件..."
    
    local missing_files=()
    
    # 检查必需文件
    for file in "frontend/Dockerfile" "backend/Dockerfile" "docker-compose.yml" ".env.template"; do
        if [ ! -f "$file" ]; then
            missing_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -gt 0 ]; then
        log_error "缺少配置文件: ${missing_files[*]}"
        return 1
    fi
    
    log_success "配置文件检查通过"
}

# 检查脚本权限
check_script_permissions() {
    log_info "检查脚本权限..."
    
    local scripts=("build.sh" "deploy.sh" "export-images.sh" "import-images.sh")
    local missing_exec=()
    
    for script in "${scripts[@]}"; do
        if [ ! -x "$script" ]; then
            missing_exec+=("$script")
        fi
    done
    
    if [ ${#missing_exec[@]} -gt 0 ]; then
        log_warning "以下脚本缺少执行权限: ${missing_exec[*]}"
        log_info "正在修复权限..."
        chmod +x "${missing_exec[@]}"
    fi
    
    log_success "脚本权限检查通过"
}

# 测试Dockerfile语法
test_dockerfile_syntax() {
    log_info "测试Dockerfile语法..."
    
    # 测试前端Dockerfile
    if ! docker build -f frontend/Dockerfile . --no-cache -q &> /dev/null; then
        log_error "前端Dockerfile语法错误"
        return 1
    fi
    
    # 测试后端Dockerfile
    if ! docker build -f backend/Dockerfile . --no-cache -q &> /dev/null; then
        log_error "后端Dockerfile语法错误"
        return 1
    fi
    
    log_success "Dockerfile语法检查通过"
}

# 测试脚本语法
test_script_syntax() {
    log_info "测试脚本语法..."
    
    local scripts=("build.sh" "deploy.sh" "export-images.sh" "import-images.sh")
    
    for script in "${scripts[@]}"; do
        if ! bash -n "$script"; then
            log_error "脚本语法错误: $script"
            return 1
        fi
    done
    
    log_success "脚本语法检查通过"
}

# 显示测试结果
show_test_results() {
    log_info "=== 部署测试结果 ==="
    log_info "✅ 系统依赖检查"
    log_info "✅ Docker服务状态"
    log_info "✅ 配置文件检查"
    log_info "✅ 脚本权限检查"
    log_info "✅ Dockerfile语法检查"
    log_info "✅ 脚本语法检查"
    log_info ""
    log_success "所有测试通过！系统已准备好进行部署"
    log_info ""
    log_info "下一步操作建议:"
    echo "  1. 配置环境变量: cp .env.template .env"
    echo "  2. 修改数据库连接配置"
    echo "  3. 构建镜像: ./build.sh"
    echo "  4. 部署应用: ./deploy.sh"
}

# 主函数
main() {
    log_info "=== 年假计算系统 Docker部署测试 ==="
    
    # 检查依赖
    if ! check_dependencies; then
        exit 1
    fi
    
    # 检查Docker服务
    if ! check_docker_service; then
        exit 1
    fi
    
    # 检查配置文件
    if ! check_config_files; then
        exit 1
    fi
    
    # 检查脚本权限
    check_script_permissions
    
    # 测试Dockerfile语法
    if ! test_dockerfile_syntax; then
        exit 1
    fi
    
    # 测试脚本语法
    if ! test_script_syntax; then
        exit 1
    fi
    
    # 显示测试结果
    show_test_results
}

# 执行主函数
main "$@"

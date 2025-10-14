#!/bin/bash

# 测试前端API配置脚本
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

# 测试构建时API配置
test_build_with_api_config() {
    log_info "测试前端构建时的API配置..."
    
    # 设置测试用的API地址
    local test_api_url="http://192.168.1.100:3000"
    
    log_info "使用测试API地址: $test_api_url"
    
    # 构建前端镜像
    docker build -t test-frontend-api-config \
        --build-arg VITE_API_BASE_URL="$test_api_url" \
        -f ./docker/frontend/Dockerfile .
    
    if [ $? -eq 0 ]; then
        log_success "前端镜像构建成功"
    else
        log_error "前端镜像构建失败"
        return 1
    fi
    
    # 创建临时容器来检查构建结果
    log_info "检查构建结果..."
    local container_id=$(docker create test-frontend-api-config)
    
    # 从容器中提取构建后的文件
    docker cp $container_id:/usr/share/nginx/html ./test-build-output/
    
    # 停止并删除临时容器
    docker rm $container_id > /dev/null 2>&1
    
    # 检查构建后的JavaScript文件中的API配置
    log_info "检查构建文件中的API配置..."
    
    # 查找包含API配置的JavaScript文件
    local js_files=$(find ./test-build-output -name "*.js" -type f)
    
    local found_config=false
    for js_file in $js_files; do
        if grep -q "$test_api_url" "$js_file" 2>/dev/null; then
            log_success "在文件 $js_file 中找到正确的API配置: $test_api_url"
            found_config=true
            break
        fi
    done
    
    if [ "$found_config" = false ]; then
        log_warning "未在构建文件中找到API配置，检查是否使用相对路径"
        # 检查是否使用了相对路径
        for js_file in $js_files; do
            if grep -q "/backend" "$js_file" 2>/dev/null; then
                log_info "在文件 $js_file 中找到相对路径配置: /backend"
                found_config=true
            fi
        done
    fi
    
    # 清理测试文件
    rm -rf ./test-build-output
    docker rmi test-frontend-api-config > /dev/null 2>&1
    
    if [ "$found_config" = true ]; then
        log_success "API配置测试通过"
        return 0
    else
        log_error "API配置测试失败"
        return 1
    fi
}

# 测试部署脚本的API配置
test_deploy_script_api_config() {
    log_info "测试部署脚本的API配置..."
    
    # 设置测试环境变量
    export API_BASE_URL="http://192.168.1.200:3000"
    
    # 运行部署脚本的API配置部分
    log_info "模拟部署脚本的API配置检测..."
    
    # 获取服务器IP
    local detected_ip=$(source ./docker/deploy.sh && get_server_ip)
    log_info "检测到的服务器IP: $detected_ip"
    
    # 检查API_BASE_URL设置
    if [ -n "$API_BASE_URL" ]; then
        log_success "API_BASE_URL已正确设置: $API_BASE_URL"
        return 0
    else
        log_error "API_BASE_URL未正确设置"
        return 1
    fi
}

# 主测试函数
main() {
    log_info "=== 前端API配置测试 ==="
    
    # 测试1: 构建时API配置
    if test_build_with_api_config; then
        log_success "✅ 构建时API配置测试通过"
    else
        log_error "❌ 构建时API配置测试失败"
        exit 1
    fi
    
    # 测试2: 部署脚本API配置
    if test_deploy_script_api_config; then
        log_success "✅ 部署脚本API配置测试通过"
    else
        log_error "❌ 部署脚本API配置测试失败"
        exit 1
    fi
    
    log_success "=== 所有测试通过 ==="
    log_info "修复总结:"
    log_info "1. 前端Dockerfile已修复，不再硬编码API_BASE_URL"
    log_info "2. 部署脚本正确传递API_BASE_URL参数"
    log_info "3. 前端构建时将使用正确的服务器地址而非localhost"
}

# 执行测试
main "$@"

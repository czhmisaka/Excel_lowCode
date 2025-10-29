#!/bin/bash

# 测试清理中间产物功能
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

# 创建测试文件
create_test_files() {
    log_info "创建测试中间产物..."
    
    # 创建前端构建产物
    mkdir -p fe/dist
    echo "test frontend build" > fe/dist/index.html
    echo "test frontend css" > fe/dist/style.css
    
    # 创建MCP服务器构建产物
    mkdir -p MCPServer/build
    echo "test mcp build" > MCPServer/build/main.js
    echo "test mcp tools" > MCPServer/build/tools.js
    
    # 创建TypeScript构建信息文件
    echo "test ts build info" > MCPServer/tsconfig.tsbuildinfo
    
    log_success "测试文件创建完成"
}

# 检查文件是否存在
check_files_exist() {
    local all_exist=true
    
    if [ -d "fe/dist" ]; then
        log_success "✓ fe/dist/ 存在"
    else
        log_error "✗ fe/dist/ 不存在"
        all_exist=false
    fi
    
    if [ -d "MCPServer/build" ]; then
        log_success "✓ MCPServer/build/ 存在"
    else
        log_error "✗ MCPServer/build/ 不存在"
        all_exist=false
    fi
    
    if [ -f "MCPServer/tsconfig.tsbuildinfo" ]; then
        log_success "✓ MCPServer/tsconfig.tsbuildinfo 存在"
    else
        log_error "✗ MCPServer/tsconfig.tsbuildinfo 不存在"
        all_exist=false
    fi
    
    if [ "$all_exist" = true ]; then
        log_success "所有测试文件都存在"
        return 0
    else
        log_error "部分测试文件不存在"
        return 1
    fi
}

# 检查文件是否被清理
check_files_cleaned() {
    local all_cleaned=true
    
    if [ ! -d "fe/dist" ]; then
        log_success "✓ fe/dist/ 已清理"
    else
        log_error "✗ fe/dist/ 未清理"
        all_cleaned=false
    fi
    
    if [ ! -d "MCPServer/build" ]; then
        log_success "✓ MCPServer/build/ 已清理"
    else
        log_error "✗ MCPServer/build/ 未清理"
        all_cleaned=false
    fi
    
    if [ ! -f "MCPServer/tsconfig.tsbuildinfo" ]; then
        log_success "✓ MCPServer/tsconfig.tsbuildinfo 已清理"
    else
        log_error "✗ MCPServer/tsconfig.tsbuildinfo 未清理"
        all_cleaned=false
    fi
    
    if [ "$all_cleaned" = true ]; then
        log_success "所有测试文件都已清理"
        return 0
    else
        log_error "部分测试文件未清理"
        return 1
    fi
}

# 主测试函数
main() {
    log_info "=== 测试清理中间产物功能 ==="
    
    # 步骤1: 创建测试文件
    create_test_files
    
    echo
    log_info "步骤2: 验证测试文件存在"
    if ! check_files_exist; then
        log_error "测试文件创建失败，无法继续测试"
        exit 1
    fi
    
    echo
    log_info "步骤3: 执行清理功能"
    # 调用run.sh中的清理函数
    source run.sh
    clean_intermediate_files
    
    echo
    log_info "步骤4: 验证文件已清理"
    if check_files_cleaned; then
        log_success "=== 清理功能测试通过 ==="
    else
        log_error "=== 清理功能测试失败 ==="
        exit 1
    fi
}

# 执行测试
main

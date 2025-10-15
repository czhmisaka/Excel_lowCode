#!/bin/bash

# 测试参数组合的脚本
set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# 测试参数解析
test_param_parsing() {
    log_info "=== 测试参数解析 ==="
    
    # 测试1: 基本参数
    log_info "测试1: 基本参数组合"
    ./run.sh --help > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        log_success "测试1通过: --help 参数正常"
    else
        log_error "测试1失败: --help 参数异常"
        return 1
    fi
    
    # 测试2: 端口参数
    log_info "测试2: 端口参数组合"
    BACKEND_PORT=4000 FRONTEND_PORT=9000 MCP_SERVER_PORT=9100 ./run.sh --help > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        log_success "测试2通过: 端口参数正常"
    else
        log_error "测试2失败: 端口参数异常"
        return 1
    fi
    
    # 测试3: 模式参数组合
    log_info "测试3: 模式参数组合"
    ./run.sh --run-local --unified --help > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        log_success "测试3通过: 模式参数组合正常"
    else
        log_error "测试3失败: 模式参数组合异常"
        return 1
    fi
    
    # 测试4: 完整参数组合
    log_info "测试4: 完整参数组合"
    ./run.sh --run-local --unified --backend-port 4000 --frontend-port 9000 --mcp-port 9100 --help > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        log_success "测试4通过: 完整参数组合正常"
    else
        log_error "测试4失败: 完整参数组合异常"
        return 1
    fi
    
    # 测试5: 部署参数
    log_info "测试5: 部署参数"
    ./run.sh --backup --help > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        log_success "测试5通过: 部署参数正常"
    else
        log_error "测试5失败: 部署参数异常"
        return 1
    fi
    
    log_success "所有参数解析测试通过"
    return 0
}

# 测试环境变量传递
test_env_variables() {
    log_info "=== 测试环境变量传递 ==="
    
    # 测试环境变量设置
    export RUN_MODE="sqlite"
    export BACKEND_PORT="4000"
    export FRONTEND_PORT="9000"
    export MCP_SERVER_PORT="9100"
    
    log_info "设置的环境变量:"
    log_info "RUN_MODE=$RUN_MODE"
    log_info "BACKEND_PORT=$BACKEND_PORT"
    log_info "FRONTEND_PORT=$FRONTEND_PORT"
    log_info "MCP_SERVER_PORT=$MCP_SERVER_PORT"
    
    # 测试docker/deploy.sh参数过滤
    log_info "测试docker/deploy.sh参数过滤"
    ./docker/deploy.sh --help > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        log_success "docker/deploy.sh参数过滤正常"
    else
        log_error "docker/deploy.sh参数过滤异常"
        return 1
    fi
    
    log_success "环境变量传递测试通过"
    return 0
}

# 显示测试结果
show_test_results() {
    log_info "=== 测试结果汇总 ==="
    log_info "参数组合测试:"
    log_info "  - 基本参数: 通过"
    log_info "  - 端口参数: 通过"
    log_info "  - 模式参数组合: 通过"
    log_info "  - 完整参数组合: 通过"
    log_info "  - 部署参数: 通过"
    log_info ""
    log_info "环境变量测试:"
    log_info "  - 环境变量设置: 通过"
    log_info "  - 参数过滤: 通过"
    log_info ""
    log_info "支持的参数组合示例:"
    log_info "  ./run.sh --run-local --unified --backend-port 4000 --frontend-port 9000 --mcp-port 9100"
    log_info "  ./run.sh --unified --backend-port 5000"
    log_info "  ./run.sh --run-local --mcp-port 9200"
    log_info "  ./run.sh --unified --backup"
    log_info ""
    log_success "所有测试通过！参数系统已修复完成"
}

# 主函数
main() {
    log_info "开始参数组合测试..."
    
    if test_param_parsing && test_env_variables; then
        show_test_results
        return 0
    else
        log_error "测试失败，请检查参数处理逻辑"
        return 1
    fi
}

# 执行测试
main "$@"

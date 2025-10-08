#!/bin/bash
###
 # @Date: 2025-10-08 23:43:27
 # @LastEditors: CZH
 # @LastEditTime: 2025-10-08 23:43:53
 # @FilePath: /综合部-年假计算/test_param_parsing.sh
### 

# 测试参数解析的脚本
set -e

echo "=== 测试参数解析功能 ==="
echo

# 测试1: 测试参数解析函数
echo "测试1: 测试参数解析函数"
echo "模拟参数: --run-local --backend-port 4000 --frontend-port 9000"

# 模拟参数解析
parse_arguments() {
    local run_local=false
    local backend_port=""
    local frontend_port=""
    local deploy_args=()
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --run-local)
                run_local=true
                deploy_args+=("$1")
                shift
                ;;
            --backend-port)
                if [[ -n "$2" && "$2" =~ ^[0-9]+$ ]]; then
                    backend_port="$2"
                    deploy_args+=("$1" "$2")
                    shift 2
                else
                    echo "ERROR: --backend-port 需要有效的端口号"
                    exit 1
                fi
                ;;
            --frontend-port)
                if [[ -n "$2" && "$2" =~ ^[0-9]+$ ]]; then
                    frontend_port="$2"
                    deploy_args+=("$1" "$2")
                    shift 2
                else
                    echo "ERROR: --frontend-port 需要有效的端口号"
                    exit 1
                fi
                ;;
            *)
                deploy_args+=("$1")
                shift
                ;;
        esac
    done
    
    # 设置环境变量
    if [ "$run_local" = true ]; then
        export RUN_MODE="sqlite"
        echo "✓ 运行模式: SQLite 本地数据库"
    fi
    
    if [ -n "$backend_port" ]; then
        export BACKEND_PORT="$backend_port"
        echo "✓ 后端端口: $backend_port"
    fi
    
    if [ -n "$frontend_port" ]; then
        export FRONTEND_PORT="$frontend_port"
        echo "✓ 前端端口: $frontend_port"
    fi
    
    # 返回部署参数数组
    printf '%s\n' "${deploy_args[@]}"
}

# 测试参数解析
echo "解析结果:"
parse_arguments --run-local --backend-port 4000 --frontend-port 9000

echo
echo "环境变量设置:"
echo "RUN_MODE=$RUN_MODE"
echo "BACKEND_PORT=$BACKEND_PORT"
echo "FRONTEND_PORT=$FRONTEND_PORT"

echo
echo "=== 参数解析测试完成 ==="

#!/bin/bash

# 测试端口显示修复的脚本
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

# 从环境变量获取服务器IP地址
get_server_ip() {
    # 优先使用环境变量中的API_BASE_URL
    if [ -n "$API_BASE_URL" ]; then
        # 从API_BASE_URL中提取IP地址
        local ip=$(echo "$API_BASE_URL" | sed -E 's|^https?://([^:/]+).*|\1|')
        
        # 如果是localhost或127.0.0.1，则尝试获取真实IP
        if [ "$ip" = "localhost" ] || [ "$ip" = "127.0.0.1" ]; then
            # 尝试获取真实IP地址
            local real_ip=""
            
            # 方法1: 使用hostname命令
            if command -v hostname &> /dev/null; then
                real_ip=$(hostname -I 2>/dev/null | awk '{print $1}' || hostname -i 2>/dev/null | awk '{print $1}')
            fi
            
            # 方法2: 使用ifconfig
            if [ -z "$real_ip" ] && command -v ifconfig &> /dev/null; then
                real_ip=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
            fi
            
            # 方法3: 使用ip命令
            if [ -z "$real_ip" ] && command -v ip &> /dev/null; then
                real_ip=$(ip addr show | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}' | cut -d/ -f1)
            fi
            
            if [ -n "$real_ip" ]; then
                ip="$real_ip"
                log_info "检测到服务器IP地址: $ip"
            else
                log_warning "无法获取服务器IP地址，使用默认值: $ip"
            fi
        else
            log_info "使用配置的服务器地址: $ip"
        fi
        
        echo "$ip"
        return 0
    fi
    
    # 如果没有配置API_BASE_URL，则尝试获取IP地址
    log_warning "未配置API_BASE_URL，尝试自动获取服务器IP地址"
    
    local ip=""
    
    # 方法1: 使用hostname命令
    if command -v hostname &> /dev/null; then
        ip=$(hostname -I 2>/dev/null | awk '{print $1}' || hostname -i 2>/dev/null | awk '{print $1}')
    fi
    
    # 方法2: 使用ifconfig
    if [ -z "$ip" ] && command -v ifconfig &> /dev/null; then
        ip=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
    fi
    
    # 方法3: 使用ip命令
    if [ -z "$ip" ] && command -v ip &> /dev/null; then
        ip=$(ip addr show | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}' | cut -d/ -f1)
    fi
    
    # 如果还是获取不到，使用默认值
    if [ -z "$ip" ]; then
        ip="localhost"
        log_warning "无法获取服务器IP地址，使用默认值: $ip"
    else
        log_info "检测到服务器IP地址: $ip"
    fi
    
    echo "$ip"
}

# 测试端口显示
test_port_display() {
    log_info "=== 测试端口显示功能 ==="
    
    # 设置测试端口
    export FRONTEND_PORT="8080"
    export BACKEND_PORT="3000"
    export API_BASE_URL="http://localhost:3000"
    
    log_info "测试端口配置:"
    log_info "前端端口: $FRONTEND_PORT"
    log_info "后端端口: $BACKEND_PORT"
    log_info "API基础URL: $API_BASE_URL"
    
    # 获取服务器IP
    local server_ip=$(get_server_ip)
    
    log_info "=== 修复后的显示效果 ==="
    log_success "部署流程完成"
    log_info "前端访问地址: http://${server_ip}:${FRONTEND_PORT}"
    log_info "后端API地址: ${API_BASE_URL}"
    log_info "API文档地址: ${API_BASE_URL}/api-docs"
    
    log_info "=== 修复前的显示效果（对比） ==="
    log_info "前端访问地址: http://localhost:${FRONTEND_PORT}"
    log_info "后端API地址: ${API_BASE_URL}"
    log_info "API文档地址: ${API_BASE_URL}/api-docs"
    
    log_success "端口显示修复测试完成！"
}

# 执行测试
test_port_display

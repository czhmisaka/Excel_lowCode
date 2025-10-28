#!/bin/bash

# Excel_lowCode - Docker镜像源配置脚本
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

# 检查当前镜像源配置
check_current_mirrors() {
    log_info "检查当前Docker镜像源配置..."
    
    if docker info 2>/dev/null | grep -q "registry-mirrors"; then
        log_success "Docker镜像源已配置:"
        docker info 2>/dev/null | grep "registry-mirrors" -A 10
        return 0
    else
        log_warning "Docker镜像源未配置"
        return 1
    fi
}

# 生成镜像源配置
generate_mirror_config() {
    local config_file=${1:-"/etc/docker/daemon.json"}
    
    log_info "生成镜像源配置..."
    
    # 检查配置文件是否存在
    if [ -f "$config_file" ]; then
        log_warning "配置文件已存在: ${config_file}"
        log_info "备份原配置文件..."
        sudo cp "$config_file" "${config_file}.backup.$(date +%Y%m%d%H%M%S)"
    fi
    
    # 创建配置目录（如果需要）
    local config_dir=$(dirname "$config_file")
    if [ ! -d "$config_dir" ]; then
        log_info "创建配置目录: ${config_dir}"
        sudo mkdir -p "$config_dir"
    fi
    
    # 生成配置
    cat << EOF | sudo tee "$config_file" > /dev/null
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://registry.docker-cn.com",
    "https://dockerproxy.com",
    "https://mirror.ccs.tencentyun.com"
  ],
  "max-concurrent-downloads": 3,
  "max-download-attempts": 5,
  "experimental": false,
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3"
  }
}
EOF
    
    if [ $? -eq 0 ]; then
        log_success "镜像源配置生成完成: ${config_file}"
        return 0
    else
        log_error "镜像源配置生成失败"
        return 1
    fi
}

# 重启Docker服务
restart_docker_service() {
    log_info "重启Docker服务..."
    
    # 检测系统类型
    if command -v systemctl &> /dev/null; then
        # systemd系统
        sudo systemctl restart docker
        if [ $? -eq 0 ]; then
            log_success "Docker服务重启成功"
            return 0
        else
            log_error "Docker服务重启失败"
            return 1
        fi
    elif command -v service &> /dev/null; then
        # service系统
        sudo service docker restart
        if [ $? -eq 0 ]; then
            log_success "Docker服务重启成功"
            return 0
        else
            log_error "Docker服务重启失败"
            return 1
        fi
    else
        log_warning "无法确定如何重启Docker服务，请手动重启"
        return 1
    fi
}

# 测试镜像源速度
test_mirror_speed() {
    log_info "测试镜像源速度..."
    
    local test_images=(
        "nginx:alpine"
        "node:20-alpine"
        "alpine:latest"
    )
    
    for image in "${test_images[@]}"; do
        log_info "测试镜像: ${image}"
        
        # 记录开始时间
        local start_time=$(date +%s)
        
        # 拉取镜像（不保存）
        if docker pull "$image" > /dev/null 2>&1; then
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            local image_size=$(docker image inspect "$image" 2>/dev/null | grep -o '"Size": [0-9]*' | cut -d' ' -f2 || echo "0")
            local human_size=$(numfmt --to=iec "$image_size")
            
            if [ "$image_size" -gt 0 ]; then
                local speed=$((image_size / duration / 1024))
                log_success "✓ ${image}: ${duration}s, ${human_size}, ~${speed} KB/s"
                
                # 清理测试镜像
                docker rmi "$image" > /dev/null 2>&1 || true
            else
                log_warning "? ${image}: 无法获取镜像大小"
            fi
        else
            log_error "✗ ${image}: 拉取失败"
        fi
    done
}

# 显示镜像源信息
show_mirror_info() {
    log_info "=== 镜像源信息 ==="
    
    # 显示当前配置
    check_current_mirrors
    
    # 显示可用镜像源
    log_info "可用的镜像源:"
    cat << EOF
  - 中国科学技术大学: https://docker.mirrors.ustc.edu.cn
  - 网易: https://hub-mirror.c.163.com
  - Docker中国: https://registry.docker-cn.com
  - Docker代理: https://dockerproxy.com
  - 腾讯云: https://mirror.ccs.tencentyun.com
EOF
}

# 主函数
main() {
    local action=${1:-"info"}  # info, configure, test
    
    log_info "=== Excel_lowCode Docker镜像源配置 ==="
    
    # 检查依赖
    check_docker
    
    case "$action" in
        "info")
            show_mirror_info
            ;;
            
        "configure")
            log_info "开始配置Docker镜像源..."
            
            # 检查当前配置
            if check_current_mirrors; then
                log_warning "镜像源已配置，是否重新配置？(y/N)"
                read -r response
                if [[ ! "$response" =~ ^[Yy]$ ]]; then
                    log_info "取消配置"
                    exit 0
                fi
            fi
            
            # 生成配置
            if generate_mirror_config; then
                # 重启Docker服务
                if restart_docker_service; then
                    # 等待服务稳定
                    sleep 3
                    
                    # 测试配置
                    check_current_mirrors
                    
                    log_success "镜像源配置完成"
                    
                    # 可选：测试速度
                    log_info "是否测试镜像源速度？(y/N)"
                    read -r response
                    if [[ "$response" =~ ^[Yy]$ ]]; then
                        test_mirror_speed
                    fi
                else
                    log_error "配置完成但Docker服务重启失败，请手动重启"
                fi
            else
                log_error "镜像源配置失败"
                exit 1
            fi
            ;;
            
        "test")
            test_mirror_speed
            ;;
            
        "help"|"--help")
            show_usage
            exit 0
            ;;
            
        *)
            log_error "未知操作: $action"
            show_usage
            exit 1
            ;;
    esac
    
    log_success "操作完成"
}

# 显示使用说明
show_usage() {
    echo "使用方法: $0 [操作]"
    echo ""
    echo "操作:"
    echo "  info        显示当前镜像源信息（默认）"
    echo "  configure   配置Docker镜像源"
    echo "  test        测试镜像源速度"
    echo "  help        显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 info        # 显示镜像源信息"
    echo "  $0 configure   # 配置镜像源"
    echo "  $0 test        # 测试镜像源速度"
}

# 执行主函数
main "$@"

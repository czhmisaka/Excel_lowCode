#!/bin/bash

# 启动开发环境脚本
# 功能：同时启动backend和fe的dev模式，根据操作系统打开两个终端窗口
# 支持：macOS 和 Windows（通过Git Bash/WSL）

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/fe"

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

# 检查目录是否存在
check_directories() {
    log_info "检查项目目录结构..."
    
    if [ ! -d "$BACKEND_DIR" ]; then
        log_error "backend目录不存在: $BACKEND_DIR"
        exit 1
    fi
    
    if [ ! -d "$FRONTEND_DIR" ]; then
        log_error "fe目录不存在: $FRONTEND_DIR"
        exit 1
    fi
    
    log_success "项目目录结构检查通过"
}

# 获取后端端口
get_backend_port() {
    local backend_env_file="$BACKEND_DIR/.env"
    local default_port=3000
    
    if [ -f "$backend_env_file" ]; then
        local port=$(grep -E '^PORT=' "$backend_env_file" | cut -d'=' -f2 | tr -d '[:space:]')
        if [[ -n "$port" && "$port" =~ ^[0-9]+$ && "$port" -ge 1 && "$port" -le 65535 ]]; then
            echo "$port"
            return
        else
            log_warning "后端端口配置无效或未找到，使用默认端口: $default_port"
        fi
    else
        log_warning "后端配置文件不存在: $backend_env_file，使用默认端口: $default_port"
    fi
    
    echo "$default_port"
}

# 获取前端端口
get_frontend_port() {
    local vite_config_file="$FRONTEND_DIR/vite.config.ts"
    local default_port=5173
    
    if [ -f "$vite_config_file" ]; then
        # 查找 port: 配置，支持 port: 5173 或 port:5173 格式
        local port=$(grep -E 'port:[[:space:]]*[0-9]+' "$vite_config_file" | head -1 | grep -oE '[0-9]+')
        if [[ -n "$port" && "$port" =~ ^[0-9]+$ && "$port" -ge 1 && "$port" -le 65535 ]]; then
            echo "$port"
            return
        else
            log_warning "前端端口配置无效或未找到，使用默认端口: $default_port"
        fi
    else
        log_warning "前端配置文件不存在: $vite_config_file，使用默认端口: $default_port"
    fi
    
    echo "$default_port"
}

# 检查npm依赖
check_dependencies() {
    log_info "检查npm依赖..."
    
    # 检查backend依赖
    if [ -f "$BACKEND_DIR/package.json" ]; then
        if [ ! -d "$BACKEND_DIR/node_modules" ]; then
            log_warning "backend依赖未安装，请运行: cd backend && npm install"
        else
            log_info "backend依赖已安装"
        fi
    fi
    
    # 检查fe依赖
    if [ -f "$FRONTEND_DIR/package.json" ]; then
        if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
            log_warning "fe依赖未安装，请运行: cd fe && npm install"
        else
            log_info "fe依赖已安装"
        fi
    fi
}

# 检测操作系统
detect_os() {
    case "$(uname -s)" in
        Darwin)
            OS="macOS"
            ;;
        Linux)
            OS="Linux"
            ;;
        CYGWIN*|MINGW32*|MSYS*|MINGW*)
            OS="Windows"
            ;;
        *)
            OS="UNKNOWN"
            ;;
    esac
    
    echo "$OS"
}

# macOS启动函数
start_macos() {
    log_info "在macOS上启动开发环境..."
    
    # 获取端口
    local backend_port=$(get_backend_port)
    local frontend_port=$(get_frontend_port)
    
    # 启动后端服务
    log_info "启动后端服务 (端口: $backend_port)..."
    osascript <<EOF
tell application "Terminal"
    do script "cd '$BACKEND_DIR' && echo '启动后端服务...' && npm run dev"
    set custom title of front window to "后端服务 ($backend_port)"
end tell
EOF
    
    # 等待2秒，确保后端启动
    sleep 2
    
    # 启动前端服务
    log_info "启动前端服务 (端口: $frontend_port)..."
    osascript <<EOF
tell application "Terminal"
    do script "cd '$FRONTEND_DIR' && echo '启动前端服务...' && npm run dev"
    set custom title of front window to "前端服务 ($frontend_port)"
end tell
EOF
    
    log_success "开发环境启动完成！"
    echo ""
    echo "访问地址："
    echo "  后端API: http://localhost:$backend_port"
    echo "  前端应用: http://localhost:$frontend_port"
    echo ""
    echo "按 Ctrl+C 停止脚本，终端窗口会保持打开状态"
}

# Windows启动函数 (Git Bash)
start_windows() {
    log_info "在Windows上启动开发环境..."
    
    # 获取端口
    local backend_port=$(get_backend_port)
    local frontend_port=$(get_frontend_port)
    
    # 启动后端服务
    log_info "启动后端服务 (端口: $backend_port)..."
    start cmd /k "cd /d \"$BACKEND_DIR\" && echo 启动后端服务... && npm run dev"
    
    # 等待2秒
    sleep 2
    
    # 启动前端服务
    log_info "启动前端服务 (端口: $frontend_port)..."
    start cmd /k "cd /d \"$FRONTEND_DIR\" && echo 启动前端服务... && npm run dev"
    
    log_success "开发环境启动完成！"
    echo ""
    echo "访问地址："
    echo "  后端API: http://localhost:$backend_port"
    echo "  前端应用: http://localhost:$frontend_port"
    echo ""
    echo "命令提示符窗口会保持打开状态"
}

# Linux启动函数
start_linux() {
    log_info "在Linux上启动开发环境..."
    
    # 获取端口
    local backend_port=$(get_backend_port)
    local frontend_port=$(get_frontend_port)
    
    # 检查是否支持多个终端
    if command -v gnome-terminal &> /dev/null; then
        # GNOME Terminal
        log_info "使用 GNOME Terminal..."
        gnome-terminal --tab --title="后端服务 ($backend_port)" -- bash -c "cd '$BACKEND_DIR' && echo '启动后端服务...' && npm run dev; exec bash"
        gnome-terminal --tab --title="前端服务 ($frontend_port)" -- bash -c "cd '$FRONTEND_DIR' && echo '启动前端服务...' && npm run dev; exec bash"
    elif command -v konsole &> /dev/null; then
        # Konsole (KDE)
        log_info "使用 Konsole..."
        konsole --new-tab --title "后端服务 ($backend_port)" -e bash -c "cd '$BACKEND_DIR' && echo '启动后端服务...' && npm run dev; exec bash" &
        konsole --new-tab --title "前端服务 ($frontend_port)" -e bash -c "cd '$FRONTEND_DIR' && echo '启动前端服务...' && npm run dev; exec bash" &
    elif command -v xterm &> /dev/null; then
        # xterm
        log_info "使用 xterm..."
        xterm -title "后端服务 ($backend_port)" -e "cd '$BACKEND_DIR' && echo '启动后端服务...' && npm run dev" &
        xterm -title "前端服务 ($frontend_port)" -e "cd '$FRONTEND_DIR' && echo '启动前端服务...' && npm run dev" &
    else
        log_error "未找到支持的终端程序，请手动启动："
        echo "  后端: cd backend && npm run dev"
        echo "  前端: cd fe && npm run dev"
        exit 1
    fi
    
    log_success "开发环境启动完成！"
    echo ""
    echo "访问地址："
    echo "  后端API: http://localhost:$backend_port"
    echo "  前端应用: http://localhost:$frontend_port"
}

# 主函数
main() {
    echo ""
    echo "========================================"
    echo "      打卡系统开发环境启动脚本"
    echo "========================================"
    echo ""
    
    # 检查目录
    check_directories
    
    # 检查依赖
    check_dependencies
    
    # 检测操作系统
    OS=$(detect_os)
    log_info "检测到操作系统: $OS"
    
    echo ""
    log_info "准备启动开发环境..."
    echo ""
    
    # 根据操作系统选择启动方式
    case "$OS" in
        macOS)
            start_macos
            ;;
        Windows)
            start_windows
            ;;
        Linux)
            start_linux
            ;;
        *)
            log_error "不支持的操作系统: $OS"
            log_info "请手动启动："
            echo "  后端: cd backend && npm run dev"
            echo "  前端: cd fe && npm run dev"
            exit 1
            ;;
    esac
    
    echo ""
    echo "========================================"
    echo "      脚本执行完成"
    echo "========================================"
    echo ""
}

# 执行主函数
main "$@"

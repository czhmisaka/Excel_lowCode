#!/bin/sh
###
 # @Date: 2025-10-31 11:17:36
 # @LastEditors: CZH
 # @LastEditTime: 2025-10-31 13:59:57
 # @FilePath: /lowCode_excel/docker/unified/startup.sh
### 

# 统一容器启动脚本
# 负责处理环境变量替换、服务账户初始化和配置生成

set -e

echo "=== 开始容器启动流程 ==="

# 设置默认环境变量
: ${MCP_SERVER_PORT:=3001}
: ${BACKEND_PORT:=3000}
: ${API_BASE_URL:=http://localhost:3000}

echo "环境变量配置:"
echo "- MCP_SERVER_PORT: $MCP_SERVER_PORT"
echo "- BACKEND_PORT: $BACKEND_PORT"
echo "- API_BASE_URL: $API_BASE_URL"

# 生成初始的supervisord配置文件（不包含MCP服务账户令牌）
echo "生成初始supervisord配置文件..."
cat > /tmp/supervisord.conf << EOF
[supervisord]
nodaemon=true
logfile=/var/log/supervisor/supervisord.log
pidfile=/var/run/supervisord.pid
childlogdir=/var/log/supervisor

[program:nginx]
command=/usr/sbin/nginx -g "daemon off;"
autostart=true
autorestart=true
startretries=3
stderr_logfile=/var/log/supervisor/nginx.err.log
stdout_logfile=/var/log/supervisor/nginx.out.log
user=root

[program:backend]
command=npm start
directory=/app
autostart=true
autorestart=true
startretries=3
stderr_logfile=/var/log/supervisor/backend.err.log
stdout_logfile=/var/log/supervisor/backend.out.log
user=root
environment=NODE_ENV=production,PORT=$BACKEND_PORT

[program:mcp-server]
command=sleep 60
directory=/app/mcp-server
autostart=false
autorestart=false
startretries=1
stderr_logfile=/var/log/supervisor/mcp-server.err.log
stdout_logfile=/var/log/supervisor/mcp-server.out.log
user=root
environment=NODE_ENV=production,MCP_SERVER_PORT=$MCP_SERVER_PORT,API_BASE_URL=$API_BASE_URL
EOF

# 复制初始配置文件
cp /tmp/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

echo "=== 启动supervisor进程管理器（初始阶段） ==="
echo "启动后端服务和Nginx..."

# 启动supervisord（后台运行）
supervisord_pid=$(/usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf & echo $!)

# 等待后端服务启动
echo "等待后端服务启动..."
max_attempts=60
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -f -s "http://localhost:$BACKEND_PORT/health" > /dev/null 2>&1; then
        echo "后端服务已就绪"
        break
    fi
    
    echo "等待后端服务... ($attempt/$max_attempts)"
    sleep 2
    attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
    echo "错误: 后端服务启动超时"
    # 停止初始的supervisord进程
    kill $supervisord_pid 2>/dev/null || true
    exit 1
fi

# 检查MCP API密钥是否已配置
echo "检查MCP API密钥配置..."
if [ -z "$MCP_API_KEY" ]; then
    echo "警告: MCP_API_KEY未配置，将使用默认API密钥"
    # 生成一个临时的默认API密钥（仅用于开发环境）
    MCP_API_KEY="default_mcp_api_key_$(date +%s)"
else
    echo "MCP API密钥已配置"
fi

# 停止初始的supervisord进程
echo "停止初始supervisord进程..."
kill $supervisord_pid 2>/dev/null || true
sleep 2

# 生成最终的supervisord配置文件
echo "生成supervisord配置文件..."
cat > /tmp/supervisord.conf << EOF
[supervisord]
nodaemon=true
logfile=/var/log/supervisor/supervisord.log
pidfile=/var/run/supervisord.pid
childlogdir=/var/log/supervisor

[program:nginx]
command=/usr/sbin/nginx -g "daemon off;"
autostart=true
autorestart=true
startretries=3
stderr_logfile=/var/log/supervisor/nginx.err.log
stdout_logfile=/var/log/supervisor/nginx.out.log
user=root

[program:backend]
command=npm start
directory=/app
autostart=true
autorestart=true
startretries=3
stderr_logfile=/var/log/supervisor/backend.err.log
stdout_logfile=/var/log/supervisor/backend.out.log
user=root
environment=NODE_ENV=production,PORT=$BACKEND_PORT

[program:mcp-server]
command=npm start
directory=/app/mcp-server
autostart=true
autorestart=true
startretries=3
stderr_logfile=/var/log/supervisor/mcp-server.err.log
stdout_logfile=/var/log/supervisor/mcp-server.out.log
user=root
environment=NODE_ENV=production,MCP_SERVER_PORT=$MCP_SERVER_PORT,API_BASE_URL=$API_BASE_URL,MCP_API_KEY=$MCP_API_KEY
EOF

# 复制生成的配置文件
cp /tmp/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

echo "=== 启动supervisor进程管理器 ==="
echo "服务配置:"
echo "- 后端服务端口: $BACKEND_PORT"
echo "- MCP服务器端口: $MCP_SERVER_PORT"
echo "- API基础URL: $API_BASE_URL"
echo "- MCP API密钥: 已配置"

# 启动supervisord
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf

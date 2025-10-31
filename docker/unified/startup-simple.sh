#!/bin/sh
###
 # @Date: 2025-10-31 11:17:36
 # @LastEditors: CZH
 # @LastEditTime: 2025-10-31 11:41:10
 # @FilePath: /lowCode_excel/docker/unified/startup-simple.sh
### 

# 简化的统一容器启动脚本
# 使用环境变量替换和直接启动方式

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
environment=NODE_ENV=production,MCP_SERVER_PORT=$MCP_SERVER_PORT,API_BASE_URL=$API_BASE_URL,MCP_SERVICE_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQsInVzZXJuYW1lIjoibWNwX3NlcnZpY2UiLCJyb2xlIjoiYWRtaW4iLCJkaXNwbGF5TmFtZSI6Ik1DUCBTZXJ2aWNlIEFjY291bnQiLCJpYXQiOjE3NjE4Nzc4OTIsImV4cCI6MTc2MTk2NDI5Mn0.9oZQHESJJCAvlB9vz7p48eWxlWjZs9qinrZQjgJu2HI
EOF

# 复制生成的配置文件
cp /tmp/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

echo "=== 启动supervisor进程管理器 ==="
echo "服务配置:"
echo "- 后端服务端口: $BACKEND_PORT"
echo "- MCP服务器端口: $MCP_SERVER_PORT"
echo "- API基础URL: $API_BASE_URL"
echo "- MCP服务令牌: 已配置（使用默认令牌）"

# 启动supervisord
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf

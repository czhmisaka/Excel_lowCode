#!/bin/sh
###
 # @Date: 2025-10-31 11:17:36
 # @LastEditors: CZH
 # @LastEditTime: 2025-11-17 01:18:55
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

# 检查并初始化数据库
echo "检查数据库状态..."
if [ ! -f "/app/data/annual_leave.db" ]; then
    echo "数据库文件不存在，开始初始化数据库..."
    mkdir -p /app/data
    
    # 创建简单的数据库初始化脚本
    cat > /app/init-db.js << 'EOF'
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function initDatabase() {
    try {
        const dbPath = '/app/data/annual_leave.db';
        console.log('创建数据库文件:', dbPath);
        
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('创建数据库失败:', err.message);
                return;
            }
            console.log('✅ 数据库文件创建成功');
        });

        // 创建必要的表
        const createTables = `
            CREATE TABLE IF NOT EXISTS table_mappings (
                id INTEGER PRIMARY KEY,
                table_name VARCHAR(255) NOT NULL,
                hash_value VARCHAR(64) NOT NULL UNIQUE,
                original_file_name VARCHAR(255),
                column_count INTEGER NOT NULL DEFAULT 0,
                row_count INTEGER NOT NULL DEFAULT 0,
                header_row INTEGER NOT NULL DEFAULT 0,
                column_definitions JSON,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL,
                form_config JSON
            );
            
            CREATE TABLE IF NOT EXISTS form_definitions (
                id TEXT UNIQUE PRIMARY KEY,
                form_id VARCHAR(255) NOT NULL UNIQUE,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                table_mapping VARCHAR(64),
                definition JSON NOT NULL,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL
            );
            
            CREATE TABLE IF NOT EXISTS form_hooks (
                id TEXT UNIQUE PRIMARY KEY,
                form_id VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                type VARCHAR(50) NOT NULL,
                trigger_type VARCHAR(50) NOT NULL,
                config JSON NOT NULL,
                enabled BOOLEAN NOT NULL DEFAULT true,
                description TEXT,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL
            );
            
            CREATE TABLE IF NOT EXISTS form_submissions (
                id TEXT UNIQUE PRIMARY KEY,
                form_id VARCHAR(255) NOT NULL,
                submission_data JSON NOT NULL,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL
            );
            
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'user',
                display_name VARCHAR(255),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `;

        db.exec(createTables, (err) => {
            if (err) {
                console.error('创建表失败:', err.message);
            } else {
                console.log('✅ 数据库表创建成功');
            }
        });

        db.close((err) => {
            if (err) {
                console.error('关闭数据库失败:', err.message);
            } else {
                console.log('✅ 数据库初始化完成');
            }
        });

    } catch (error) {
        console.error('数据库初始化失败:', error);
    }
}

initDatabase();
EOF

    # 执行数据库初始化
    cd /app && node init-db.js
else
    echo "✅ 数据库文件已存在: /app/data/annual_leave.db"
fi

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

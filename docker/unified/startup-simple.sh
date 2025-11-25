#!/bin/sh
###
 # @Date: 2025-10-31 11:17:36
 # @LastEditors: CZH
 # @LastEditTime: 2025-11-23 14:22:55
 # @FilePath: /lowCode_excel/docker/unified/startup-simple.sh
### 

# 简化的统一容器启动脚本
# 支持MySQL和SQLite两种数据库模式

set -e

echo "=== 开始容器启动流程 ==="

# 设置默认环境变量
: ${MCP_SERVER_PORT:=3001}
: ${BACKEND_PORT:=3000}
: ${API_BASE_URL:=http://localhost:3000}
: ${DB_TYPE:=sqlite}

echo "环境变量配置:"
echo "- MCP_SERVER_PORT: $MCP_SERVER_PORT"
echo "- BACKEND_PORT: $BACKEND_PORT"
echo "- API_BASE_URL: $API_BASE_URL"
echo "- DB_TYPE: $DB_TYPE"

# 根据数据库类型执行不同的初始化逻辑
echo "检查数据库状态..."
if [ "$DB_TYPE" = "sqlite" ]; then
    echo "使用SQLite数据库模式"
    
    # SQLite数据库初始化
    if [ ! -f "/app/data/annual_leave.db" ]; then
        echo "SQLite数据库文件不存在，开始初始化数据库..."
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
        echo "✅ SQLite数据库文件已存在: /app/data/annual_leave.db"
    fi
else
    echo "使用MySQL数据库模式"
    echo "MySQL数据库表结构将在后端应用启动时自动创建"
    
    # 检查MySQL连接
    echo "测试MySQL数据库连接..."
    cat > /app/test-mysql.js << 'EOF'
const mysql = require('mysql2/promise');

async function testMySQL() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        
        console.log('✅ MySQL数据库连接成功');
        
        // 检查现有表
        const [tables] = await connection.execute(
            'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?',
            [process.env.DB_NAME]
        );
        
        console.log(`📊 MySQL数据库中现有表数量: ${tables.length}`);
        tables.forEach((table, index) => {
            console.log(`  ${index + 1}. ${table.TABLE_NAME}`);
        });
        
        await connection.end();
        return true;
    } catch (error) {
        console.error('❌ MySQL数据库连接失败:', error.message);
        console.error('请检查以下配置:');
        console.error('- 主机:', process.env.DB_HOST);
        console.error('- 端口:', process.env.DB_PORT);
        console.error('- 数据库:', process.env.DB_NAME);
        console.error('- 用户:', process.env.DB_USER);
        return false;
    }
}

testMySQL();
EOF

    # 测试MySQL连接
    cd /app && node test-mysql.js
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
command=node --max-old-space-size=12288 app.js
directory=/app
autostart=true
autorestart=true
startretries=3
stderr_logfile=/var/log/supervisor/backend.err.log
stdout_logfile=/var/log/supervisor/backend.out.log
user=root
environment=NODE_ENV=production,PORT=$BACKEND_PORT,CACHE_ENABLED=false,REDIS_ENABLED=false

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
echo "- 数据库类型: $DB_TYPE"

# 启动supervisord
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf

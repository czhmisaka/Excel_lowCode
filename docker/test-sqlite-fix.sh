#!/bin/bash
###
 # @Date: 2025-11-03 12:47:14
 # @LastEditors: CZH
 # @LastEditTime: 2025-11-03 12:47:34
 # @FilePath: /lowCode_excel/docker/test-sqlite-fix.sh
### 

# SQLite3 编译修复测试脚本
echo "=== SQLite3 编译修复测试 ==="

# 清理旧的镜像和容器
echo "1. 清理旧的镜像和容器..."
docker-compose down --rmi all 2>/dev/null || true

# 测试后端镜像构建
echo "2. 构建后端镜像（测试 SQLite3 编译）..."
if docker build -f docker/backend/Dockerfile -t test-backend-sqlite . --no-cache; then
    echo "✅ 后端镜像构建成功"
    echo "3. 验证后端 Node.js 版本和 SQLite3..."
    docker run --rm test-backend-sqlite node --version
    docker run --rm test-backend-sqlite npm list sqlite3
else
    echo "❌ 后端镜像构建失败"
    exit 1
fi

# 测试统一镜像构建
echo "4. 构建统一镜像（测试 SQLite3 编译）..."
if docker build -f docker/unified/Dockerfile -t test-unified-sqlite . --no-cache; then
    echo "✅ 统一镜像构建成功"
    echo "5. 验证统一镜像 Node.js 版本和 SQLite3..."
    docker run --rm test-unified-sqlite node --version
    docker run --rm test-unified-sqlite npm list sqlite3
else
    echo "❌ 统一镜像构建失败"
    exit 1
fi

echo "=== SQLite3 编译修复测试完成 ==="
echo "所有镜像都成功编译了 SQLite3 模块！"

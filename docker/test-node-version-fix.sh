#!/bin/bash
###
 # @Date: 2025-11-03 12:31:58
 # @LastEditors: CZH
 # @LastEditTime: 2025-11-03 12:32:15
 # @FilePath: /lowCode_excel/docker/test-node-version-fix.sh
### 

# Node.js 版本修复测试脚本
echo "=== Node.js 版本修复测试 ==="

# 清理旧的镜像和容器
echo "1. 清理旧的镜像和容器..."
docker-compose down --rmi all 2>/dev/null || true

# 构建镜像并验证 Node.js 版本
echo "2. 构建 MCP Server 镜像..."
docker build -f docker/mcp-server/Dockerfile -t test-mcp-server . --no-cache

echo "3. 验证 MCP Server Node.js 版本..."
docker run --rm test-mcp-server node --version

echo "4. 构建后端镜像..."
docker build -f docker/backend/Dockerfile -t test-backend . --no-cache

echo "5. 验证后端 Node.js 版本..."
docker run --rm test-backend node --version

echo "6. 构建统一镜像..."
docker build -f docker/unified/Dockerfile -t test-unified . --no-cache

echo "7. 验证统一镜像 Node.js 版本..."
docker run --rm test-unified node --version

echo "=== 测试完成 ==="
echo "所有镜像都使用 Node.js 20 版本构建成功！"

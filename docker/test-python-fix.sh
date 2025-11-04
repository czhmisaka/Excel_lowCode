#!/bin/bash
###
 # @Date: 2025-11-03 12:59:52
 # @LastEditors: CZH
 # @LastEditTime: 2025-11-03 13:00:10
 # @FilePath: /lowCode_excel/docker/test-python-fix.sh
### 

# Python 外部管理环境修复测试脚本
echo "=== Python 外部管理环境修复测试 ==="

# 清理旧的镜像和容器
echo "1. 清理旧的镜像和容器..."
docker-compose down --rmi all 2>/dev/null || true

# 测试后端镜像构建
echo "2. 构建后端镜像（测试 Python 修复）..."
if docker build -f docker/backend/Dockerfile -t test-backend-python . --no-cache; then
    echo "✅ 后端镜像构建成功"
    echo "3. 验证后端 Python 环境..."
    docker run --rm test-backend-python python3 --version
    docker run --rm test-backend-python which python3
else
    echo "❌ 后端镜像构建失败"
    exit 1
fi

# 测试统一镜像构建
echo "4. 构建统一镜像（测试 Python 修复）..."
if docker build -f docker/unified/Dockerfile -t test-unified-python . --no-cache; then
    echo "✅ 统一镜像构建成功"
    echo "5. 验证统一镜像 Python 环境..."
    docker run --rm test-unified-python python3 --version
    docker run --rm test-unified-python which python3
else
    echo "❌ 统一镜像构建失败"
    exit 1
fi

echo "=== Python 外部管理环境修复测试完成 ==="
echo "所有镜像都成功构建，Python 环境配置正确！"

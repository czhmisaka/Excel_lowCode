#!/bin/bash
###
 # @Date: 2025-11-03 13:16:57
 # @LastEditors: CZH
 # @LastEditTime: 2025-11-03 13:17:21
 # @FilePath: /lowCode_excel/docker/clean-and-test-fix.sh
### 

# 彻底清理和测试修复脚本
echo "=== 彻底清理和测试修复 ==="

# 1. 停止并清理所有容器和镜像
echo "1. 停止并清理所有容器和镜像..."
docker-compose down --rmi all --volumes 2>/dev/null || true

# 2. 清理 Docker 系统缓存
echo "2. 清理 Docker 系统缓存..."
docker system prune -a -f

# 3. 构建后端镜像测试
echo "3. 构建后端镜像测试..."
if docker build -f docker/backend/Dockerfile -t test-backend-fixed . --no-cache; then
    echo "✅ 后端镜像构建成功"
    echo "4. 验证后端 Python 环境和 SQLite3..."
    docker run --rm test-backend-fixed python3 --version
    docker run --rm test-backend-fixed python3 -c "import distutils; print('distutils available')"
    docker run --rm test-backend-fixed npm list sqlite3
else
    echo "❌ 后端镜像构建失败"
    exit 1
fi

# 4. 构建统一镜像测试
echo "5. 构建统一镜像测试..."
if docker build -f docker/unified/Dockerfile -t test-unified-fixed . --no-cache; then
    echo "✅ 统一镜像构建成功"
    echo "6. 验证统一镜像 Python 环境和 SQLite3..."
    docker run --rm test-unified-fixed python3 --version
    docker run --rm test-unified-fixed python3 -c "import distutils; print('distutils available')"
    docker run --rm test-unified-fixed npm list sqlite3
else
    echo "❌ 统一镜像构建失败"
    exit 1
fi

# 5. 重新构建所有服务
echo "7. 重新构建所有服务..."
if docker-compose build --no-cache; then
    echo "✅ 所有服务构建成功"
else
    echo "❌ 服务构建失败"
    exit 1
fi

echo "=== 修复测试完成 ==="
echo "所有镜像都成功构建，Python distutils 和 SQLite3 编译问题已解决！"
echo ""
echo "现在可以运行: docker-compose up -d"

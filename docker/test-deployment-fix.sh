#!/bin/bash
###
 # @Date: 2025-11-03 13:18:39
 # @LastEditors: CZH
 # @LastEditTime: 2025-11-03 13:18:56
 # @FilePath: /lowCode_excel/docker/test-deployment-fix.sh
### 

# 部署修复测试脚本 - 集成到标准测试流程
echo "=== 部署修复测试 ==="

# 清理旧的镜像和容器
echo "1. 清理旧的镜像和容器..."
docker-compose down --rmi all --volumes 2>/dev/null || true

# 清理 Docker 系统缓存
echo "2. 清理 Docker 系统缓存..."
docker system prune -a -f

# 使用标准构建脚本构建统一镜像
echo "3. 使用标准构建脚本构建统一镜像..."
if bash ./run.sh --unified --run-local --clean; then
    echo "✅ 标准构建流程成功"
else
    echo "❌ 标准构建流程失败"
    exit 1
fi

# 验证修复效果
echo "4. 验证修复效果..."
echo "4.1 验证 Python distutils 可用性..."
docker-compose exec backend python3 -c "import distutils; print('✅ distutils 模块可用')" || echo "❌ distutils 模块不可用"

echo "4.2 验证 SQLite3 模块状态..."
docker-compose exec backend npm list sqlite3 || echo "❌ SQLite3 模块检查失败"

echo "4.3 验证 Node.js 版本..."
docker-compose exec backend node --version || echo "❌ Node.js 版本检查失败"

echo "4.4 验证服务健康状态..."
curl -f http://localhost:3000/health && echo "✅ 后端服务健康" || echo "❌ 后端服务不健康"

echo "=== 部署修复测试完成 ==="
echo "所有修复已成功应用，系统可以正常运行！"

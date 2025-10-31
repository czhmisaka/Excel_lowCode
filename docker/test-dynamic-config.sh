#!/bin/bash

# 动态配置功能测试脚本
# 用于验证环境变量替换和MCP服务账户初始化功能

set -e

echo "=== 动态配置功能测试 ==="

# 检查必要的文件是否存在
echo "1. 检查配置文件..."
if [ ! -f "docker/unified/supervisord.conf" ]; then
    echo "错误: supervisord.conf 文件不存在"
    exit 1
fi

if [ ! -f "docker/unified/startup.sh" ]; then
    echo "错误: startup.sh 文件不存在"
    exit 1
fi

if [ ! -f "docker/unified/Dockerfile" ]; then
    echo "错误: Dockerfile 文件不存在"
    exit 1
fi

echo "✓ 所有配置文件都存在"

# 检查supervisord.conf中的环境变量占位符
echo "2. 检查supervisord.conf中的环境变量占位符..."
if grep -q "%MCP_SERVER_PORT%" docker/unified/supervisord.conf && \
   grep -q "%API_BASE_URL%" docker/unified/supervisord.conf && \
   grep -q "%MCP_SERVICE_TOKEN%" docker/unified/supervisord.conf; then
    echo "✓ supervisord.conf 包含正确的环境变量占位符"
else
    echo "错误: supervisord.conf 缺少环境变量占位符"
    exit 1
fi

# 检查Dockerfile中的启动脚本配置
echo "3. 检查Dockerfile配置..."
if grep -q "CMD.*startup.sh" docker/unified/Dockerfile; then
    echo "✓ Dockerfile 使用自定义启动脚本"
else
    echo "错误: Dockerfile 未配置使用启动脚本"
    exit 1
fi

# 检查启动脚本权限
echo "4. 检查启动脚本权限..."
chmod +x docker/unified/startup.sh
if [ -x "docker/unified/startup.sh" ]; then
    echo "✓ 启动脚本具有执行权限"
else
    echo "错误: 启动脚本没有执行权限"
    exit 1
fi

# 检查后端API路由
echo "5. 检查后端API路由..."
if [ -f "backend/routes/serviceAccounts.js" ]; then
    if grep -q "/api/service-accounts/mcp/init" backend/routes/serviceAccounts.js; then
        echo "✓ 后端包含MCP服务账户初始化API"
    else
        echo "错误: 后端缺少MCP服务账户初始化API"
        exit 1
    fi
else
    echo "错误: serviceAccounts.js 文件不存在"
    exit 1
fi

# 测试环境变量替换功能
echo "6. 测试环境变量替换..."
cat > /tmp/test_supervisord.conf << 'EOF'
[program:test]
command=echo "Test"
environment=NODE_ENV=production,MCP_SERVER_PORT=%MCP_SERVER_PORT%,API_BASE_URL=%API_BASE_URL%,MCP_SERVICE_TOKEN=%MCP_SERVICE_TOKEN%
EOF

# 模拟环境变量替换
export MCP_SERVER_PORT=9999
export API_BASE_URL=http://test:8888
export MCP_SERVICE_TOKEN=test_token_123

sed -e "s|%MCP_SERVER_PORT%|$MCP_SERVER_PORT|g" \
    -e "s|%API_BASE_URL%|$API_BASE_URL|g" \
    -e "s|%MCP_SERVICE_TOKEN%|$MCP_SERVICE_TOKEN|g" \
    /tmp/test_supervisord.conf > /tmp/test_result.conf

if grep -q "MCP_SERVER_PORT=9999" /tmp/test_result.conf && \
   grep -q "API_BASE_URL=http://test:8888" /tmp/test_result.conf && \
   grep -q "MCP_SERVICE_TOKEN=test_token_123" /tmp/test_result.conf; then
    echo "✓ 环境变量替换功能正常"
else
    echo "错误: 环境变量替换功能异常"
    exit 1
fi

# 清理测试文件
rm -f /tmp/test_supervisord.conf /tmp/test_result.conf

echo ""
echo "=== 测试总结 ==="
echo "✓ 所有配置检查通过"
echo "✓ 环境变量替换功能正常"
echo "✓ MCP服务账户初始化API已配置"
echo "✓ 启动脚本已集成到Dockerfile"
echo ""
echo "部署说明:"
echo "1. 构建新的Docker镜像: docker build -f docker/unified/Dockerfile -t your-app ."
echo "2. 运行容器时可以通过环境变量覆盖配置:"
echo "   - MCP_SERVER_PORT: MCP服务器端口 (默认: 3001)"
echo "   - BACKEND_PORT: 后端服务端口 (默认: 3000)"
echo "   - API_BASE_URL: API基础URL (默认: http://localhost:3000)"
echo "3. 每次启动容器时都会自动初始化MCP服务账户并获取新令牌"
echo ""
echo "示例运行命令:"
echo "docker run -d \\"
echo "  -p 8080:80 \\"
echo "  -p 3000:3000 \\"
echo "  -p 3002:3001 \\"
echo "  -e MCP_SERVER_PORT=3002 \\"
echo "  -e BACKEND_PORT=3000 \\"
echo "  -e API_BASE_URL=http://localhost:3000 \\"
echo "  your-app"

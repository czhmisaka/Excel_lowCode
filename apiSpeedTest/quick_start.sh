#!/bin/bash
# Excel数据管理服务器 - 压力测试快速启动脚本

echo "🚀 Excel数据管理服务器 - 压力测试快速启动"
echo "=========================================="

# 检查Python环境
if ! command -v python3 &> /dev/null; then
    echo "❌ 未找到Python3，请先安装Python3"
    exit 1
fi

# 检查依赖
echo "📦 检查Python依赖..."
if ! python3 -c "import requests" &> /dev/null; then
    echo "安装requests依赖..."
    pip3 install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
    echo "✅ 依赖安装成功"
else
    echo "✅ 依赖已安装"
fi

# 测试连接
echo ""
echo "🔌 测试服务器连接..."
python3 test_connection.py local

if [ $? -ne 0 ]; then
    echo ""
    echo "⚠️  本地服务器连接失败，尝试远程服务器..."
    python3 test_connection.py remote
    
    if [ $? -ne 0 ]; then
        echo ""
        echo "❌ 所有服务器连接失败，请检查："
        echo "   1. 确保后端服务正在运行"
        echo "   2. 检查网络连接"
        echo "   3. 确认服务器地址配置正确"
        echo ""
        echo "📋 配置信息："
        echo "   本地服务器: http://localhost:3000"
        echo "   远程服务器: http://101.126.91.134:9000"
        echo "   目标表哈希: 25295650f0cc6d4c6a18c39e77245406"
        exit 1
    fi
fi

echo ""
echo "✅ 连接测试通过！"
echo ""
echo "🎯 选择测试模式："
echo "   1. 快速测试 (10并发，100请求)"
echo "   2. 中等测试 (30并发，300请求)" 
echo "   3. 全面测试 (所有测试场景)"
echo "   4. 自定义测试"
echo "   5. 退出"

read -p "请输入选择 (1-5): " choice

case $choice in
    1)
        echo "🚀 开始快速测试..."
        python3 api_speed_test.py concurrent 10 100 mixed
        ;;
    2)
        echo "🚀 开始中等测试..."
        python3 api_speed_test.py concurrent 30 300 mixed
        ;;
    3)
        echo "🚀 开始全面测试..."
        python3 api_speed_test.py comprehensive
        ;;
    4)
        echo "🔧 自定义测试配置"
        read -p "并发数 (默认10): " concurrent
        concurrent=${concurrent:-10}
        read -p "总请求数 (默认100): " total
        total=${total:-100}
        read -p "查询类型 (simple/complex/pagination/mixed, 默认mixed): " query_type
        query_type=${query_type:-mixed}
        
        echo "🚀 开始自定义测试..."
        python3 api_speed_test.py concurrent $concurrent $total $query_type
        ;;
    5)
        echo "👋 退出"
        exit 0
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac

echo ""
echo "🎉 测试完成！"
echo "📊 查看测试报告了解详细性能指标"

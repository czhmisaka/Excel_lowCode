#!/bin/bash
###
 # @Date: 2025-10-09 00:34:42
 # @LastEditors: CZH
 # @LastEditTime: 2025-10-09 01:48:32
 # @FilePath: /lowCode_excel/docker/test_path_fixed.sh
### 

# 只加载必要的函数，避免执行主函数
source <(grep -A 20 "select_compose_file()" deploy.sh)

echo "=== 测试 select_compose_file 函数 ==="
compose_file=$(select_compose_file)
echo "返回的路径: $compose_file"

echo "=== 测试完整路径拼接 ==="
full_path=$(pwd)/$compose_file
echo "完整路径: $full_path"

echo "=== 检查文件是否存在 ==="
if [ -f "$full_path" ]; then
    echo "✅ Docker Compose文件存在: $full_path"
else
    echo "❌ Docker Compose文件不存在: $full_path"
fi

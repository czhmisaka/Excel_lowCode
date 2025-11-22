#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
连接测试脚本
用于验证服务器连接和基本功能
"""

import requests
import json
import sys
import os

# 添加当前目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import SERVERS, SPECIAL_AUTH_HEADER, TARGET_HASH


def test_server_connection(server_name):
    """测试服务器连接"""
    if server_name not in SERVERS:
        print(f"❌ 未知的服务器配置: {server_name}")
        print(f"可用服务器: {', '.join(SERVERS.keys())}")
        return False
    
    server_config = SERVERS[server_name]
    base_url = server_config["base_url"]
    description = server_config["description"]
    
    print(f"🔍 测试服务器连接: {server_name} ({description})")
    print(f"目标地址: {base_url}")
    print(f"认证头: {SPECIAL_AUTH_HEADER}")
    print("-" * 60)
    
    # 测试健康检查接口
    health_url = f"{base_url}/health"
    try:
        response = requests.get(health_url, timeout=10)
        if response.status_code == 200:
            health_data = response.json()
            print(f"✅ 健康检查通过")
            print(f"   状态: {health_data.get('status', 'unknown')}")
            print(f"   数据库: {health_data.get('database', 'unknown')}")
            print(f"   环境: {health_data.get('environment', 'unknown')}")
        else:
            print(f"⚠️  健康检查返回状态码: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ 健康检查失败: {e}")
        return False
    
    # 测试数据查询接口
    data_url = f"{base_url}/api/data/{TARGET_HASH}"
    params = {
        "page": 1,
        "limit": 5,
        "search": json.dumps({"部门": {"$like": "%技术%"}}, ensure_ascii=False)
    }
    
    try:
        response = requests.get(
            data_url, 
            params=params, 
            headers=SPECIAL_AUTH_HEADER,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            result_count = len(data.get("data", []))
            print(f"✅ 数据查询成功")
            print(f"   返回记录数: {result_count}")
            print(f"   表名: {data.get('tableInfo', {}).get('tableName', 'unknown')}")
            return True
        else:
            print(f"❌ 数据查询失败")
            print(f"   状态码: {response.status_code}")
            print(f"   响应内容: {response.text[:200]}...")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ 数据查询失败: {e}")
        return False


def main():
    """主函数"""
    print("🔌 Excel数据管理服务器 - 连接测试工具")
    print("=" * 50)
    
    if len(sys.argv) > 1:
        # 命令行参数模式
        server_name = sys.argv[1]
        success = test_server_connection(server_name)
        sys.exit(0 if success else 1)
    else:
        # 交互式模式
        print("选择要测试的服务器:")
        for i, (name, config) in enumerate(SERVERS.items(), 1):
            print(f"{i}. {name} - {config['description']} ({config['base_url']})")
        
        try:
            choice = input("\n请输入选择 (1-3): ").strip()
            server_names = list(SERVERS.keys())
            if choice.isdigit() and 1 <= int(choice) <= len(server_names):
                server_name = server_names[int(choice) - 1]
                success = test_server_connection(server_name)
                sys.exit(0 if success else 1)
            else:
                print("❌ 无效选择")
                sys.exit(1)
        except KeyboardInterrupt:
            print("\n👋 用户取消")
            sys.exit(1)


if __name__ == "__main__":
    main()

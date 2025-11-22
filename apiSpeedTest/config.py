'''
Date: 2025-11-23 01:04:31
LastEditors: CZH
LastEditTime: 2025-11-23 01:04:58
FilePath: /lowCode_excel/apiSpeedTest/config.py
'''
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试配置文件
支持配置不同的服务器地址和环境
"""

# 服务器配置
SERVERS = {
    "local": {
        "base_url": "http://localhost:3000",
        "description": "本地开发环境"
    },
    "remote": {
        "base_url": "http://101.126.91.134:9000", 
        "description": "远程服务器环境"
    },
    "production": {
        "base_url": "https://api.example.com",
        "description": "生产环境"
    }
}

# 默认服务器配置
DEFAULT_SERVER = "local"

# 测试目标表哈希
TARGET_HASH = "25295650f0cc6d4c6a18c39e77245406"  # 年假余额表

# MCP认证头
SPECIAL_AUTH_HEADER = {
    "x-special-auth": "czhmisakaLogin:aGithubUserFuckEverything"
}

# 测试数据配置
TEST_DATA = {
    "departments": ["技术部", "销售部", "市场部", "人事部", "财务部", "研发部", "运营部", "客服部"],
    "names": ["张", "李", "王", "刘", "陈", "杨", "赵", "黄", "周", "吴", "徐", "孙", "胡", "朱", "高", "林"],
    "employee_ids": list(range(1000, 2000)),  # 员工编号范围
    "vacation_days": ["5", "10", "15", "20", "25", "30"]  # 年假天数
}

# 测试参数配置
TEST_CONFIG = {
    "timeout": 120,  # 请求超时时间（秒）
    "max_workers": 100,  # 最大并发线程数
    "default_concurrent_count": 10,  # 默认并发数
    "default_total_requests": 100,  # 默认总请求数
    "default_query_type": "mixed"  # 默认查询类型
}

# 性能指标阈值
PERFORMANCE_THRESHOLDS = {
    "excellent": {
        "avg_response_time": 0.1,  # 100ms
        "success_rate": 99.0
    },
    "good": {
        "avg_response_time": 0.5,  # 500ms
        "success_rate": 95.0
    },
    "acceptable": {
        "avg_response_time": 1.0,  # 1s
        "success_rate": 90.0
    },
    "poor": {
        "avg_response_time": 3.0,  # 3s
        "success_rate": 80.0
    }
}

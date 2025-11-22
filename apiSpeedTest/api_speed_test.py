#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Excel数据管理服务器 - 查询接口压力测试脚本
针对年假余额表进行性能测试
"""

import requests
import json
import time
import concurrent.futures
from collections import defaultdict
import random
import statistics
import sys


class ApiSpeedTest:
    def __init__(self, base_url="http://localhost:3000"):
        """初始化测试配置"""
        self.base_url = base_url
        self.target_hash = "25295650f0cc6d4c6a18c39e77245406"  # 年假余额表哈希
        
        # MCP服务器特殊认证头
        self.special_auth_header = {
            "x-special-auth": "czhmisakaLogin:aGithubUserFuckEverything"
        }
        
        # 测试数据配置
        self.departments = ["技术部", "销售部", "市场部", "人事部", "财务部", "研发部", "运营部", "客服部"]
        self.names = ["张", "李", "王", "刘", "陈", "杨", "赵", "黄", "周", "吴", "徐", "孙", "胡", "朱", "高", "林"]
        self.employee_ids = list(range(1000, 2000))  # 员工编号范围
        self.vacation_days = ["5", "10", "15", "20", "25", "30"]  # 年假天数
        
        # 统计信息
        self.stats = {
            "total_requests": 0,
            "success_requests": 0,
            "failed_requests": 0,
            "response_times": [],
            "error_details": defaultdict(int)
        }

    def generate_simple_query(self):
        """生成简单查询条件 - 单字段模糊搜索"""
        field = random.choice(["部门", "姓名", "员工编号", "当前剩余年休假_天"])
        
        if field == "部门":
            value = random.choice(self.departments)
        elif field == "姓名":
            value = random.choice(self.names)
        elif field == "员工编号":
            value = str(random.choice(self.employee_ids))
        else:  # 当前剩余年休假_天
            value = random.choice(self.vacation_days)
        
        return {
            field: {"$like": f"%{value}%"}
        }

    def generate_complex_query(self):
        """生成复杂查询条件 - 多字段联合搜索"""
        # 随机选择2-3个字段进行联合查询
        num_fields = random.randint(2, 3)
        selected_fields = random.sample(["部门", "姓名", "员工编号", "当前剩余年休假_天"], num_fields)
        
        conditions = []
        for field in selected_fields:
            if field == "部门":
                value = random.choice(self.departments)
            elif field == "姓名":
                value = random.choice(self.names)
            elif field == "员工编号":
                value = str(random.choice(self.employee_ids))
            else:  # 当前剩余年休假_天
                value = random.choice(self.vacation_days)
            
            conditions.append({
                field: {"$like": f"%{value}%"}
            })
        
        return {"$or": conditions}

    def generate_pagination_query(self):
        """生成分页查询条件"""
        page = random.randint(1, 10)  # 随机页码
        limit = random.choice([10, 20, 50, 100])  # 随机分页大小
        
        # 随机选择简单或复杂查询
        if random.random() > 0.5:
            search_condition = self.generate_simple_query()
        else:
            search_condition = self.generate_complex_query()
        
        return {
            "page": page,
            "limit": limit,
            "search": json.dumps(search_condition, ensure_ascii=False)
        }

    def execute_query(self, query_type="simple"):
        """执行单个查询请求"""
        # 构建查询参数
        if query_type == "simple":
            search_condition = self.generate_simple_query()
            params = {
                "page": 1,
                "limit": 100,
                "search": json.dumps(search_condition, ensure_ascii=False)
            }
        elif query_type == "complex":
            search_condition = self.generate_complex_query()
            params = {
                "page": 1,
                "limit": 50,
                "search": json.dumps(search_condition, ensure_ascii=False)
            }
        elif query_type == "pagination":
            pagination_params = self.generate_pagination_query()
            params = pagination_params
        else:
            # 混合查询类型
            query_types = ["simple", "complex", "pagination"]
            selected_type = random.choice(query_types)
            return self.execute_query(selected_type)
        
        # 构建完整URL
        url = f"{self.base_url}/api/data/{self.target_hash}"
        
        # 记录开始时间
        start_time = time.time()
        
        try:
            # 发送GET请求（使用MCP特殊认证）
            response = requests.get(
                url, 
                params=params, 
                headers=self.special_auth_header,
                timeout=120
            )
            response_time = time.time() - start_time
            
            # 检查响应状态
            if response.status_code == 200:
                try:
                    data = response.json()
                    result_count = len(data.get("data", []))
                    return {
                        "success": True,
                        "response_time": response_time,
                        "status_code": response.status_code,
                        "result_count": result_count,
                        "query_type": query_type,
                        "error": None
                    }
                except json.JSONDecodeError:
                    return {
                        "success": True,
                        "response_time": response_time,
                        "status_code": response.status_code,
                        "result_count": 0,
                        "query_type": query_type,
                        "error": "响应内容无法解析为JSON"
                    }
            else:
                return {
                    "success": False,
                    "response_time": response_time,
                    "status_code": response.status_code,
                    "result_count": 0,
                    "query_type": query_type,
                    "error": f"状态码: {response.status_code}"
                }

        except requests.exceptions.RequestException as e:
            response_time = time.time() - start_time
            return {
                "success": False,
                "response_time": response_time,
                "status_code": None,
                "result_count": 0,
                "query_type": query_type,
                "error": str(e)
            }

    def run_single_test(self):
        """测试单个请求，用于调试"""
        print("🧪 测试单个请求...")
        print(f"目标接口: {self.base_url}/api/data/{self.target_hash}")
        print(f"使用认证头: {self.special_auth_header}")
        print("-" * 60)
        
        result = self.execute_query("simple")
        
        print(f"状态: {'✅ 成功' if result['success'] else '❌ 失败'}")
        print(f"响应时间: {result['response_time']:.3f}s")
        print(f"状态码: {result['status_code']}")
        print(f"结果条数: {result['result_count']}")
        print(f"查询类型: {result['query_type']}")
        
        if not result["success"]:
            print(f"错误: {result['error']}")
        
        return result

    def run_concurrent_test(self, concurrent_count=10, total_requests=100, query_type="mixed"):
        """并发测试函数"""
        print(f"🚀 开始并发压力测试...")
        print(f"目标接口: {self.base_url}/api/data/{self.target_hash}")
        print(f"测试表: 年假余额表 (1062条记录)")
        print(f"查询类型: {query_type}")
        print(f"并发数: {concurrent_count}")
        print(f"总请求数: {total_requests}")
        print(f"认证方式: MCP服务器特殊认证")
        print("-" * 80)
        
        # 重置统计信息
        self.stats = {
            "total_requests": 0,
            "success_requests": 0,
            "failed_requests": 0,
            "response_times": [],
            "error_details": defaultdict(int),
            "query_type_stats": defaultdict(int)
        }
        
        start_time = time.time()
        
        # 使用线程池执行并发请求
        with concurrent.futures.ThreadPoolExecutor(max_workers=concurrent_count) as executor:
            # 提交所有任务
            futures = [executor.submit(self.execute_query, query_type) for _ in range(total_requests)]
            
            # 收集结果
            for i, future in enumerate(concurrent.futures.as_completed(futures)):
                result = future.result()
                
                # 更新统计
                self.stats["total_requests"] += 1
                if result["success"]:
                    self.stats["success_requests"] += 1
                    self.stats["response_times"].append(result["response_time"])
                    status = "✅ 成功"
                else:
                    self.stats["failed_requests"] += 1
                    self.stats["error_details"][result["error"]] += 1
                    status = "❌ 失败"
                
                # 记录查询类型统计
                self.stats["query_type_stats"][result["query_type"]] += 1
                
                # 显示进度
                progress = (i + 1) / total_requests * 100
                current_success_rate = (self.stats["success_requests"] / (i + 1)) * 100
                
                print(f"进度: {i+1}/{total_requests} ({progress:.1f}%) - {status} - "
                      f"响应时间: {result['response_time']:.3f}s - "
                      f"结果条数: {result['result_count']} - "
                      f"实时成功率: {current_success_rate:.1f}%")
        
        total_time = time.time() - start_time
        
        # 生成测试报告
        self.generate_report(total_time, concurrent_count, total_requests, query_type)

    def generate_report(self, total_time, concurrent_count, total_requests, query_type):
        """生成详细的测试报告"""
        print("\n" + "=" * 80)
        print("📊 压力测试报告")
        print("=" * 80)
        print(f"目标接口: {self.base_url}/api/data/{self.target_hash}")
        print(f"测试表: 年假余额表 (1062条记录)")
        print(f"查询类型: {query_type}")
        print(f"并发数: {concurrent_count}")
        print(f"总请求数: {total_requests}")
        print(f"总测试时间: {total_time:.2f}s")
        print(f"平均吞吐量: {total_requests/total_time:.2f} 请求/秒")
        print("-" * 80)
        
        # 基本统计
        success_rate = (self.stats["success_requests"] / total_requests) * 100
        print(f"成功请求: {self.stats['success_requests']}")
        print(f"失败请求: {self.stats['failed_requests']}")
        print(f"成功率: {success_rate:.2f}%")
        
        # 响应时间统计
        if self.stats["response_times"]:
            avg_response_time = statistics.mean(self.stats["response_times"])
            min_response_time = min(self.stats["response_times"])
            max_response_time = max(self.stats["response_times"])
            std_deviation = statistics.stdev(self.stats["response_times"]) if len(self.stats["response_times"]) > 1 else 0
            
            print(f"平均响应时间: {avg_response_time:.3f}s")
            print(f"最快响应时间: {min_response_time:.3f}s")
            print(f"最慢响应时间: {max_response_time:.3f}s")
            print(f"响应时间标准差: {std_deviation:.3f}s")
            
            # 响应时间分布
            print(f"\n📈 响应时间分布:")
            time_ranges = [
                (0, 0.1, "0-100ms"),
                (0.1, 0.5, "100-500ms"),
                (0.5, 1.0, "500ms-1s"),
                (1.0, 3.0, "1-3s"),
                (3.0, float('inf'), ">3s")
            ]
            
            for min_t, max_t, label in time_ranges:
                count = len([t for t in self.stats["response_times"] if min_t <= t < max_t])
                percentage = (count / len(self.stats["response_times"])) * 100
                print(f"  {label}: {count}次 ({percentage:.1f}%)")
        
        # 查询类型统计
        print(f"\n🔍 查询类型分布:")
        for qtype, count in self.stats["query_type_stats"].items():
            percentage = (count / total_requests) * 100
            print(f"  {qtype}: {count}次 ({percentage:.1f}%)")
        
        # 错误详情
        if self.stats["failed_requests"] > 0:
            print(f"\n❌ 错误详情:")
            for error, count in self.stats["error_details"].items():
                percentage = (count / self.stats["failed_requests"]) * 100
                print(f"  - {error}: {count}次 ({percentage:.1f}%)")
        
        print("=" * 80)

    def run_comprehensive_test(self):
        """运行全面的压力测试"""
        print("🎯 Excel数据管理服务器 - 全面压力测试")
        print("=" * 60)
        
        # 1. 首先测试单个请求
        print("1. 测试单个请求...")
        self.run_single_test()
        
        # 2. 简单查询并发测试
        print("\n2. 简单查询并发测试 (10并发, 100请求)...")
        self.run_concurrent_test(concurrent_count=10, total_requests=100, query_type="simple")
        
        # 3. 复杂查询并发测试
        print("\n3. 复杂查询并发测试 (20并发, 200请求)...")
        self.run_concurrent_test(concurrent_count=20, total_requests=200, query_type="complex")
        
        # 4. 分页查询并发测试
        print("\n4. 分页查询并发测试 (15并发, 150请求)...")
        self.run_concurrent_test(concurrent_count=15, total_requests=150, query_type="pagination")
        
        # 5. 混合负载测试
        print("\n5. 混合负载测试 (30并发, 300请求)...")
        self.run_concurrent_test(concurrent_count=30, total_requests=300, query_type="mixed")
        
        print("\n🎉 所有测试完成！")


def main():
    """主函数"""
    # 创建测试实例
    tester = ApiSpeedTest(base_url="http://localhost:3000")
    
    print("Excel数据管理服务器 - 查询接口压力测试工具")
    print("=" * 50)
    
    if len(sys.argv) > 1:
        # 命令行参数模式
        if sys.argv[1] == "single":
            tester.run_single_test()
        elif sys.argv[1] == "concurrent":
            concurrent_count = int(sys.argv[2]) if len(sys.argv) > 2 else 10
            total_requests = int(sys.argv[3]) if len(sys.argv) > 3 else 100
            query_type = sys.argv[4] if len(sys.argv) > 4 else "mixed"
            tester.run_concurrent_test(concurrent_count, total_requests, query_type)
        elif sys.argv[1] == "comprehensive":
            tester.run_comprehensive_test()
        else:
            print("用法:")
            print("  python api_speed_test.py single                    # 测试单个请求")
            print("  python api_speed_test.py concurrent [并发数] [总请求数] [查询类型]")
            print("  python api_speed_test.py comprehensive            # 运行全面测试")
            print("\n查询类型: simple, complex, pagination, mixed")
    else:
        # 交互式模式
        print("选择测试模式:")
        print("1. 测试单个请求")
        print("2. 并发压力测试")
        print("3. 全面压力测试")
        
        choice = input("\n请输入选择 (1-3): ").strip()
        
        if choice == "1":
            tester.run_single_test()
        elif choice == "2":
            concurrent_count = int(input("并发数 (默认10): ") or "10")
            total_requests = int(input("总请求数 (默认100): ") or "100")
            query_type = input("查询类型 (simple/complex/pagination/mixed, 默认mixed): ") or "mixed"
            tester.run_concurrent_test(concurrent_count, total_requests, query_type)
        elif choice == "3":
            tester.run_comprehensive_test()
        else:
            print("无效选择")


if __name__ == "__main__":
    main()

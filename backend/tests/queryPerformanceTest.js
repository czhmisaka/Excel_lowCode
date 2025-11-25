/*
 * @Date: 2025-11-24 10:00:00
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-24 10:01:54
 * @FilePath: /lowCode_excel/backend/tests/queryPerformanceTest.js
 * @Description: 查询性能测试脚本
 */

const axios = require('axios');
const { performance } = require('perf_hooks');

/**
 * 查询性能测试类
 */
class QueryPerformanceTest {
    constructor(baseURL = 'http://localhost:3000') {
        this.baseURL = baseURL;
        this.results = [];
    }

    /**
     * 执行性能测试
     * @param {Object} testConfig 测试配置
     */
    async runPerformanceTest(testConfig = {}) {
        const {
            tableHash = '4401184d1ed23a25b6fe6b0b08c11431', // 默认测试表
            iterations = 10,
            pageSizes = [10, 50, 100],
            searchConditions = [
                null,
                { name: { $like: '测试' } },
                { status: { $eq: 'active' } }
            ]
        } = testConfig;

        console.log('🚀 开始查询性能测试...');
        console.log(`测试表: ${tableHash}`);
        console.log(`迭代次数: ${iterations}`);
        console.log(`页面大小: ${pageSizes.join(', ')}`);
        console.log('---');

        for (const pageSize of pageSizes) {
            for (const searchCondition of searchConditions) {
                await this.testQueryPerformance(tableHash, pageSize, searchCondition, iterations);
            }
        }

        this.printResults();
    }

    /**
     * 测试单个查询的性能
     * @param {string} tableHash 表哈希
     * @param {number} pageSize 页面大小
     * @param {Object} searchCondition 搜索条件
     * @param {number} iterations 迭代次数
     */
    async testQueryPerformance(tableHash, pageSize, searchCondition, iterations) {
        const testName = this.getTestName(pageSize, searchCondition);
        console.log(`📊 测试: ${testName}`);

        const executionTimes = [];
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < iterations; i++) {
            try {
                const startTime = performance.now();
                
                const response = await this.executeQuery(tableHash, 1, pageSize, searchCondition);
                
                const endTime = performance.now();
                const executionTime = endTime - startTime;

                executionTimes.push(executionTime);
                successCount++;

                if (response.data.success) {
                    console.log(`  ✅ 第 ${i + 1} 次: ${executionTime.toFixed(2)}ms (${response.data.pagination.total} 条记录)`);
                } else {
                    console.log(`  ❌ 第 ${i + 1} 次: 查询失败 - ${response.data.message}`);
                    errorCount++;
                }
            } catch (error) {
                console.log(`  ❌ 第 ${i + 1} 次: 请求失败 - ${error.message}`);
                errorCount++;
            }

            // 短暂延迟，避免服务器压力过大
            await this.delay(100);
        }

        // 计算统计信息
        const stats = this.calculateStats(executionTimes);
        
        this.results.push({
            testName,
            pageSize,
            searchCondition: searchCondition ? JSON.stringify(searchCondition) : '无',
            iterations,
            successCount,
            errorCount,
            ...stats
        });

        console.log(`  📈 统计: 平均 ${stats.avgTime.toFixed(2)}ms, 最小 ${stats.minTime.toFixed(2)}ms, 最大 ${stats.maxTime.toFixed(2)}ms`);
        console.log('---');
    }

    /**
     * 执行查询
     * @param {string} tableHash 表哈希
     * @param {number} page 页码
     * @param {number} limit 每页数量
     * @param {Object} searchCondition 搜索条件
     */
    async executeQuery(tableHash, page, limit, searchCondition) {
        const params = {
            page,
            limit
        };

        if (searchCondition) {
            params.search = JSON.stringify(searchCondition);
        }

        const response = await axios.get(`${this.baseURL}/api/data/${tableHash}`, { params });
        return response;
    }

    /**
     * 获取测试名称
     * @param {number} pageSize 页面大小
     * @param {Object} searchCondition 搜索条件
     */
    getTestName(pageSize, searchCondition) {
        let name = `页面大小 ${pageSize}`;
        
        if (searchCondition) {
            const conditionStr = JSON.stringify(searchCondition);
            name += `, 条件 ${conditionStr.substring(0, 30)}...`;
        } else {
            name += ', 无条件';
        }

        return name;
    }

    /**
     * 计算统计信息
     * @param {Array} executionTimes 执行时间数组
     */
    calculateStats(executionTimes) {
        if (executionTimes.length === 0) {
            return {
                avgTime: 0,
                minTime: 0,
                maxTime: 0,
                medianTime: 0,
                stdDev: 0
            };
        }

        const sortedTimes = [...executionTimes].sort((a, b) => a - b);
        const sum = sortedTimes.reduce((a, b) => a + b, 0);
        const avg = sum / sortedTimes.length;
        
        // 中位数
        const mid = Math.floor(sortedTimes.length / 2);
        const median = sortedTimes.length % 2 === 0 
            ? (sortedTimes[mid - 1] + sortedTimes[mid]) / 2 
            : sortedTimes[mid];

        // 标准差
        const squareDiffs = sortedTimes.map(time => Math.pow(time - avg, 2));
        const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / sortedTimes.length;
        const stdDev = Math.sqrt(avgSquareDiff);

        return {
            avgTime: avg,
            minTime: Math.min(...sortedTimes),
            maxTime: Math.max(...sortedTimes),
            medianTime: median,
            stdDev: stdDev
        };
    }

    /**
     * 打印测试结果
     */
    printResults() {
        console.log('\n🎯 查询性能测试结果汇总');
        console.log('=' .repeat(80));

        this.results.forEach((result, index) => {
            console.log(`\n${index + 1}. ${result.testName}`);
            console.log(`   成功次数: ${result.successCount}/${result.iterations}`);
            console.log(`   平均时间: ${result.avgTime.toFixed(2)}ms`);
            console.log(`   最小时间: ${result.minTime.toFixed(2)}ms`);
            console.log(`   最大时间: ${result.maxTime.toFixed(2)}ms`);
            console.log(`   中位时间: ${result.medianTime.toFixed(2)}ms`);
            console.log(`   标准差: ${result.stdDev.toFixed(2)}ms`);
        });

        // 总体统计
        const totalTests = this.results.length;
        const totalIterations = this.results.reduce((sum, r) => sum + r.iterations, 0);
        const totalSuccess = this.results.reduce((sum, r) => sum + r.successCount, 0);
        const avgOverallTime = this.results.reduce((sum, r) => sum + r.avgTime, 0) / totalTests;

        console.log('\n📊 总体统计');
        console.log(`总测试数: ${totalTests}`);
        console.log(`总迭代数: ${totalIterations}`);
        console.log(`成功率: ${((totalSuccess / totalIterations) * 100).toFixed(2)}%`);
        console.log(`平均查询时间: ${avgOverallTime.toFixed(2)}ms`);
    }

    /**
     * 延迟函数
     * @param {number} ms 毫秒数
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 测试索引创建效果
     */
    async testIndexEffect() {
        console.log('\n🔍 测试索引创建效果...');
        
        // 测试无索引查询
        console.log('1. 无索引查询测试...');
        const beforeIndexTimes = await this.simpleQueryTest();
        
        // 等待索引创建
        console.log('⏳ 等待索引创建...');
        await this.delay(5000);
        
        // 测试有索引查询
        console.log('2. 有索引查询测试...');
        const afterIndexTimes = await this.simpleQueryTest();

        console.log('\n📊 索引效果对比');
        console.log(`无索引平均时间: ${beforeIndexTimes.avgTime.toFixed(2)}ms`);
        console.log(`有索引平均时间: ${afterIndexTimes.avgTime.toFixed(2)}ms`);
        console.log(`性能提升: ${((beforeIndexTimes.avgTime - afterIndexTimes.avgTime) / beforeIndexTimes.avgTime * 100).toFixed(2)}%`);
    }

    /**
     * 简单查询测试
     */
    async simpleQueryTest() {
        const executionTimes = [];
        
        for (let i = 0; i < 5; i++) {
            const startTime = performance.now();
            
            try {
                await this.executeQuery('4401184d1ed23a25b6fe6b0b08c11431', 1, 10, null);
            } catch (error) {
                // 忽略错误
            }
            
            const endTime = performance.now();
            executionTimes.push(endTime - startTime);
            
            await this.delay(500);
        }

        return this.calculateStats(executionTimes);
    }
}

// 如果直接运行此文件，执行性能测试
if (require.main === module) {
    const test = new QueryPerformanceTest();
    
    // 执行性能测试
    test.runPerformanceTest()
        .then(() => {
            console.log('\n✅ 性能测试完成');
        })
        .catch(error => {
            console.error('❌ 性能测试失败:', error);
        });
}

module.exports = QueryPerformanceTest;

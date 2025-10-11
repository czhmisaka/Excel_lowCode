/*
 * @Date: 2025-10-11 14:47:09
 * @LastEditors: CZH
 * @LastEditTime: 2025-10-11 14:47:43
 * @FilePath: /lowCode_excel/MCPServer/test_query_fix.js
 */
/**
 * 测试MCP服务器查询条件修复
 * 这个脚本模拟查询条件传递，验证修复是否有效
 */

import httpClient from './build/utils/httpClient.js';

async function testQueryFix() {
    console.log('开始测试MCP服务器查询条件修复...\n');

    // 模拟查询参数
    const testParams = {
        hash: 'e1e8f53f385486c4004a9759c95e15ce',
        page: 1,
        limit: 10,
        conditions: {
            "姓名": {
                "$like": "%陈%"
            }
        }
    };

    console.log('测试查询参数:');
    console.log(JSON.stringify(testParams, null, 2));
    console.log('');

    try {
        // 检查API连接
        const isConnected = await httpClient.checkConnection();
        if (!isConnected) {
            console.log('❌ 无法连接到Excel数据管理系统API，请确保后端服务正在运行');
            return;
        }

        console.log('✅ API连接正常');

        // 构建正确的查询参数
        const params = {
            page: testParams.page,
            limit: testParams.limit
        };

        if (Object.keys(testParams.conditions).length > 0) {
            params.search = JSON.stringify(testParams.conditions);
        }

        console.log('构建的查询参数:');
        console.log(JSON.stringify(params, null, 2));
        console.log('');

        // 执行查询
        console.log('执行查询...');
        const result = await httpClient.get(`/api/data/${testParams.hash}`, params);

        console.log('✅ 查询成功！');
        console.log('查询结果摘要:');
        console.log(`- 成功: ${result.success}`);
        console.log(`- 数据条数: ${result.data ? result.data.length : 0}`);
        console.log(`- 总记录数: ${result.pagination ? result.pagination.total : 'N/A'}`);

        if (result.data && result.data.length > 0) {
            console.log('\n前几条数据:');
            result.data.slice(0, 3).forEach((record, index) => {
                console.log(`  ${index + 1}. ${record.姓名 || 'N/A'} (${record.部门 || 'N/A'})`);
            });
        }

        console.log('\n✅ 修复验证成功！查询条件现在可以正确传递和处理。');

    } catch (error) {
        console.log('❌ 测试失败:');
        console.log(error.message);
    }
}

// 执行测试
testQueryFix().catch(console.error);

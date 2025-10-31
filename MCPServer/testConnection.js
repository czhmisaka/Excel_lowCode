/*
 * @Date: 2025-10-31 09:54:31
 * @LastEditors: CZH
 * @LastEditTime: 2025-10-31 09:54:59
 * @FilePath: /lowCode_excel/MCPServer/testConnection.js
 */
import httpClient from './utils/httpClient.js';

async function testConnection() {
    try {
        console.log('测试 MCP server 连接和认证...');

        // 测试连接
        const isConnected = await httpClient.checkConnection();
        console.log('API连接状态:', isConnected);

        if (isConnected) {
            // 测试获取映射关系（不需要认证的接口）
            console.log('\n测试获取映射关系...');
            try {
                const mappings = await httpClient.get('/api/mappings');
                console.log('映射关系获取成功:', mappings.success);
                console.log('数据条数:', mappings.data?.length || 0);
            } catch (error) {
                console.error('获取映射关系失败:', error.message);
            }

            // 测试获取系统信息（不需要认证的接口）
            console.log('\n测试获取系统信息...');
            try {
                const systemInfo = await httpClient.get('/api/system/info');
                console.log('系统信息获取成功:', systemInfo.success);
                console.log('数据库状态:', systemInfo.data?.database?.status);
            } catch (error) {
                console.error('获取系统信息失败:', error.message);
            }

            // 测试数据查询（需要认证的接口）
            console.log('\n测试数据查询（需要认证）...');
            try {
                // 首先获取一个有效的哈希值
                const mappings = await httpClient.get('/api/mappings');
                if (mappings.success && mappings.data && mappings.data.length > 0) {
                    const hash = mappings.data[0].hashValue;
                    console.log('使用哈希值测试:', hash);

                    const data = await httpClient.get(`/api/data/${hash}`, { page: 1, limit: 5 });
                    console.log('数据查询成功:', data.success);
                    console.log('返回数据条数:', data.data?.length || 0);
                } else {
                    console.log('没有可用的映射关系用于测试');
                }
            } catch (error) {
                console.error('数据查询失败:', error.message);
            }
        }

    } catch (error) {
        console.error('测试过程中发生错误:', error);
    }
}

testConnection();

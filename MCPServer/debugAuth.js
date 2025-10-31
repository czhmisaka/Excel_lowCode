/*
 * @Date: 2025-10-31 09:55:29
 * @LastEditors: CZH
 * @LastEditTime: 2025-10-31 09:55:54
 * @FilePath: /lowCode_excel/MCPServer/debugAuth.js
 */
import httpClient from './utils/httpClient.js';

async function debugAuth() {
    console.log('调试认证问题...');

    // 检查环境变量
    console.log('环境变量检查:');
    console.log('- API_BASE_URL:', process.env.API_BASE_URL);
    console.log('- MCP_SERVICE_TOKEN:', process.env.MCP_SERVICE_TOKEN ? '已设置' : '未设置');
    console.log('- MCP_SERVICE_TOKEN 长度:', process.env.MCP_SERVICE_TOKEN?.length || 0);

    // 检查 HTTP 客户端实例
    console.log('\nHTTP 客户端实例检查:');
    console.log('- baseURL:', httpClient.baseURL);
    console.log('- serviceToken:', httpClient.serviceToken ? '已设置' : '未设置');
    console.log('- serviceToken 长度:', httpClient.serviceToken?.length || 0);

    // 测试一个简单的请求，查看请求头
    console.log('\n测试请求头...');
    try {
        // 创建一个临时的 axios 实例来查看请求头
        const axios = await import('axios');
        const testClient = axios.default.create({
            baseURL: httpClient.baseURL,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // 添加请求拦截器来查看实际发送的请求头
        testClient.interceptors.request.use((config) => {
            console.log('实际请求头:', config.headers);
            return config;
        });

        // 测试请求
        await testClient.get('/health');

    } catch (error) {
        console.error('调试请求失败:', error.message);
    }
}

debugAuth();

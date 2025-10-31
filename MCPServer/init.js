/*
 * @Date: 2025-10-31 10:20:59
 * @LastEditors: CZH
 * @LastEditTime: 2025-10-31 13:59:13
 * @FilePath: /lowCode_excel/MCPServer/init.js
 */
/**
 * MCP Server 初始化脚本
 * 负责验证API密钥并启动服务器
 */

import httpClient from './utils/httpClient.js';

/**
 * 初始化 MCP Server
 */
async function initMCPServer() {
    try {
        console.log('正在初始化 MCP Server...');

        // 检查后端连接
        const isConnected = await httpClient.checkConnection();
        if (!isConnected) {
            throw new Error('无法连接到后端服务器');
        }

        console.log('✓ 后端服务器连接正常');

        // 检查API密钥是否配置
        const apiKey = process.env.MCP_API_KEY;
        if (!apiKey) {
            console.warn('MCP_API_KEY未配置，将使用默认API密钥');
        } else {
            console.log('✓ API密钥已配置');
        }

        // 验证API密钥是否有效
        try {
            await httpClient.get('/api/mappings');
            console.log('✓ API密钥验证成功');
        } catch (error) {
            console.error('API密钥验证失败:', error.message);
            throw new Error('API密钥无效或权限不足');
        }

        console.log('✓ MCP Server 初始化完成');

        return true;

    } catch (error) {
        console.error('MCP Server 初始化失败:', error.message);
        return false;
    }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
    initMCPServer()
        .then(success => {
            if (success) {
                console.log('\nMCP Server 初始化成功，可以启动服务器了');
                process.exit(0);
            } else {
                console.log('\nMCP Server 初始化失败');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('初始化过程中发生错误:', error);
            process.exit(1);
        });
}

export default initMCPServer;

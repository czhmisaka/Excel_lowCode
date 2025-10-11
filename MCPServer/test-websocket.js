/*
 * @Date: 2025-10-11 10:21:05
 * @LastEditors: CZH
 * @LastEditTime: 2025-10-11 10:21:34
 * @FilePath: /lowCode_excel/MCPServer/test-websocket.js
 */
import WebSocket from 'ws';

// WebSocket客户端测试
const ws = new WebSocket('ws://localhost:3001/mcp');

ws.on('open', function open() {
    console.log('✅ WebSocket连接已建立');

    // 发送初始化请求
    const initMessage = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
            protocolVersion: '2024-11-05',
            capabilities: {
                tools: {},
                resources: {}
            },
            clientInfo: {
                name: 'test-client',
                version: '1.0.0'
            }
        }
    };

    ws.send(JSON.stringify(initMessage));
    console.log('📤 发送初始化消息:', initMessage);
});

ws.on('message', function message(data) {
    const response = JSON.parse(data.toString());
    console.log('📥 收到服务器响应:', JSON.stringify(response, null, 2));

    // 如果收到初始化响应，请求工具列表
    if (response.id === 1 && response.result) {
        console.log('✅ 初始化成功');

        // 请求工具列表
        const toolsListMessage = {
            jsonrpc: '2.0',
            id: 2,
            method: 'tools/list'
        };

        setTimeout(() => {
            ws.send(JSON.stringify(toolsListMessage));
            console.log('📤 发送工具列表请求:', toolsListMessage);
        }, 1000);
    }

    // 如果收到工具列表响应，测试一个工具调用
    if (response.id === 2 && response.result) {
        console.log('✅ 工具列表获取成功');

        // 测试系统健康检查工具
        const healthCheckMessage = {
            jsonrpc: '2.0',
            id: 3,
            method: 'tools/call',
            params: {
                name: 'check_system_health',
                arguments: {}
            }
        };

        setTimeout(() => {
            ws.send(JSON.stringify(healthCheckMessage));
            console.log('📤 发送健康检查工具调用:', healthCheckMessage);
        }, 1000);
    }

    // 如果收到工具调用响应，关闭连接
    if (response.id === 3) {
        console.log('✅ 工具调用测试完成');
        setTimeout(() => {
            ws.close();
            console.log('🔌 关闭WebSocket连接');
        }, 1000);
    }
});

ws.on('error', function error(err) {
    console.error('❌ WebSocket错误:', err);
});

ws.on('close', function close() {
    console.log('🔌 WebSocket连接已关闭');
});

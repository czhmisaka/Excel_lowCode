import { WebSocketServer } from 'ws';
import { Server } from '@modelcontextprotocol/sdk-server/index.js';

/**
 * WebSocket传输适配器，支持MCP over WebSocket
 */
export class WebSocketTransport {
    constructor(server, wss) {
        this.server = server;
        this.wss = wss;
        this.connections = new Map();
    }

    /**
     * 启动WebSocket服务器
     */
    async start() {
        this.wss.on('connection', (ws, request) => {
            console.log('[MCP WebSocket] 新客户端连接');

            const connectionId = this.generateConnectionId();
            this.connections.set(connectionId, ws);

            // 设置消息处理器
            ws.on('message', async (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    console.log('[MCP WebSocket] 收到消息:', message);

                    // 处理MCP消息
                    const response = await this.server.handleMessage(message);
                    if (response) {
                        ws.send(JSON.stringify(response));
                    }
                } catch (error) {
                    console.error('[MCP WebSocket] 消息处理错误:', error);
                    ws.send(JSON.stringify({
                        jsonrpc: '2.0',
                        error: {
                            code: -32603,
                            message: error.message
                        }
                    }));
                }
            });

            // 设置关闭处理器
            ws.on('close', () => {
                console.log('[MCP WebSocket] 客户端断开连接');
                this.connections.delete(connectionId);
            });

            // 设置错误处理器
            ws.on('error', (error) => {
                console.error('[MCP WebSocket] 连接错误:', error);
                this.connections.delete(connectionId);
            });

            // 发送初始化消息
            this.sendInitialization(ws);
        });

        console.log('[MCP WebSocket] WebSocket服务器已启动');
    }

    /**
     * 生成连接ID
     */
    generateConnectionId() {
        return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 发送初始化消息
     */
    async sendInitialization(ws) {
        try {
            // 发送服务器信息
            const initialization = await this.server.initialize();
            ws.send(JSON.stringify(initialization));
        } catch (error) {
            console.error('[MCP WebSocket] 初始化失败:', error);
        }
    }

    /**
     * 向所有客户端广播消息
     */
    broadcast(message) {
        for (const [connectionId, ws] of this.connections) {
            try {
                ws.send(JSON.stringify(message));
            } catch (error) {
                console.error(`[MCP WebSocket] 广播消息失败 (${connectionId}):`, error);
            }
        }
    }

    /**
     * 关闭所有连接
     */
    close() {
        for (const [connectionId, ws] of this.connections) {
            try {
                ws.close();
            } catch (error) {
                console.error(`[MCP WebSocket] 关闭连接失败 (${connectionId}):`, error);
            }
        }
        this.connections.clear();
    }

    /**
     * 获取连接统计
     */
    getStats() {
        return {
            totalConnections: this.connections.size,
            connectionIds: Array.from(this.connections.keys())
        };
    }
}

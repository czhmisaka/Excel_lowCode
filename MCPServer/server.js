#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { excelTools, ExcelToolsHandler } from './tools/excelTools.js';
import { dataTools, DataToolsHandler } from './tools/dataTools.js';
import { mappingTools, MappingToolsHandler } from './tools/mappingTools.js';
import { apiResources, ResourceHandler } from './resources/apiResources.js';
import httpClient from './utils/httpClient.js';
import initMCPServer from './init.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 简化的MCP服务器实现
 */
class SimpleMCPServer {
    constructor() {
        this.app = express();
        this.httpServer = createServer(this.app);
        this.wss = new WebSocketServer({ server: this.httpServer });
        this.port = process.env.MCP_SERVER_PORT || 3001;
        this.connections = new Map();

        this.setupExpress();
        this.setupWebSocket();
        this.setupErrorHandling();
    }

    /**
     * 设置Express中间件和路由
     */
    setupExpress() {
        // 中间件
        this.app.use(cors());
        this.app.use(express.json());

        // 健康检查端点
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'ok',
                server: 'excel-data-mcp-server',
                port: this.port,
                connections: this.connections.size,
                timestamp: new Date().toISOString()
            });
        });

        // 服务器信息端点
        this.app.get('/info', (req, res) => {
            res.json({
                name: 'Excel Data MCP Server',
                version: '1.0.0',
                protocol: 'MCP over WebSocket',
                endpoints: {
                    websocket: `/mcp`,
                    health: `/health`,
                    info: `/info`
                },
                tools: Object.keys({
                    ...excelTools,
                    ...dataTools,
                    ...mappingTools
                }),
                resources: Object.keys(apiResources)
            });
        });

        // MCP WebSocket端点
        this.app.get('/mcp', (req, res) => {
            res.json({
                message: 'MCP服务器运行中，请使用WebSocket连接到 /mcp 端点',
                protocol: 'MCP over WebSocket',
                supported_transports: ['WebSocket']
            });
        });
    }

    /**
     * 设置WebSocket服务器
     */
    setupWebSocket() {
        this.wss.on('connection', (ws, request) => {
            console.log('[MCP WebSocket] 新客户端连接');

            const connectionId = this.generateConnectionId();
            this.connections.set(connectionId, ws);

            // 发送初始化消息
            this.sendInitialization(ws, connectionId);

            // 设置消息处理器
            ws.on('message', async (data) => {
                try {
                    // 确保数据是有效的UTF-8编码
                    const messageString = this.ensureUtf8Encoding(data);
                    const message = JSON.parse(messageString);
                    console.log('[MCP WebSocket] 收到消息:', message);

                    // 处理MCP消息
                    const response = await this.handleMessage(message, connectionId);
                    if (response) {
                        // 确保响应数据是有效的UTF-8编码
                        const responseString = this.sanitizeJsonForTransmission(JSON.stringify(response));
                        ws.send(responseString);
                    }
                } catch (error) {
                    console.error('[MCP WebSocket] 消息处理错误:', error);
                    const errorResponse = {
                        jsonrpc: '2.0',
                        error: {
                            code: -32603,
                            message: this.cleanErrorMessage(error.message)
                        }
                    };
                    const errorString = this.sanitizeJsonForTransmission(JSON.stringify(errorResponse));
                    ws.send(errorString);
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
    async sendInitialization(ws, connectionId) {
        try {
            // 检查API连接状态
            const isConnected = await httpClient.checkConnection();

            const initialization = {
                jsonrpc: '2.0',
                id: 1,
                result: {
                    protocolVersion: '2024-11-05',
                    capabilities: {
                        tools: {
                            listChanged: false
                        },
                        resources: {
                            listChanged: false
                        }
                    },
                    serverInfo: {
                        name: 'excel-data-mcp-server',
                        version: '1.0.0'
                    }
                }
            };

            ws.send(JSON.stringify(initialization));
            console.log(`[MCP WebSocket] 初始化消息已发送 (${connectionId})`);
        } catch (error) {
            console.error('[MCP WebSocket] 初始化失败:', error);
        }
    }

    /**
     * 处理MCP消息
     */
    async handleMessage(message, connectionId) {
        try {
            // 验证JSON-RPC 2.0格式
            if (message.jsonrpc !== '2.0' || !message.id) {
                throw new Error('无效的JSON-RPC 2.0消息');
            }

            // 处理不同类型的请求
            switch (message.method) {
                case 'initialize':
                    return await this.handleInitialize(message);
                case 'tools/list':
                    return await this.handleToolsList(message);
                case 'tools/call':
                    return await this.handleToolCall(message);
                case 'resources/list':
                    return await this.handleResourcesList(message);
                case 'resources/read':
                    return await this.handleResourceRead(message);
                case 'ping':
                    return this.handlePing(message);
                default:
                    throw new Error(`未知的方法: ${message.method}`);
            }
        } catch (error) {
            console.error(`[MCP WebSocket] 消息处理失败 (${connectionId}):`, error);
            return {
                jsonrpc: '2.0',
                id: message.id,
                error: {
                    code: -32603,
                    message: error.message
                }
            };
        }
    }

    /**
     * 处理初始化请求
     */
    async handleInitialize(message) {
        // 检查API连接状态
        const isConnected = await httpClient.checkConnection();

        return {
            jsonrpc: '2.0',
            id: message.id,
            result: {
                protocolVersion: '2024-11-05',
                capabilities: {
                    tools: {
                        listChanged: false
                    },
                    resources: {
                        listChanged: false
                    }
                },
                serverInfo: {
                    name: 'excel-data-mcp-server',
                    version: '1.0.0'
                }
            }
        };
    }

    /**
     * 处理工具列表请求
     */
    async handleToolsList(message) {
        const allTools = {
            ...excelTools,
            ...dataTools,
            ...mappingTools
        };

        const tools = Object.values(allTools).map(tool => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema
        }));

        return {
            jsonrpc: '2.0',
            id: message.id,
            result: {
                tools: tools
            }
        };
    }

    /**
     * 处理工具调用请求
     */
    async handleToolCall(message) {
        const { name, arguments: args } = message.params;
        console.log(`[MCP Tool Call] ${name}`, args);

        // 检查API连接状态
        const isConnected = await httpClient.checkConnection();
        if (!isConnected) {
            throw new Error('无法连接到Excel数据管理系统API，请检查服务是否运行');
        }

        // 根据工具名称调用对应的处理器
        let result;
        switch (name) {
            case 'upload_excel_file':
                result = await ExcelToolsHandler.uploadExcelFile(args);
                break;
            case 'list_excel_files':
                result = await ExcelToolsHandler.listExcelFiles(args);
                break;
            case 'get_excel_metadata':
                result = await ExcelToolsHandler.getExcelMetadata(args);
                break;
            case 'query_table_data':
                result = await DataToolsHandler.queryTableData(args);
                break;
            case 'add_table_record':
                result = await DataToolsHandler.addTableRecord(args);
                break;
            case 'update_table_record':
                result = await DataToolsHandler.updateTableRecord(args);
                break;
            case 'delete_table_record':
                result = await DataToolsHandler.deleteTableRecord(args);
                break;
            case 'list_table_mappings':
                result = await MappingToolsHandler.listTableMappings(args);
                break;
            case 'get_table_info':
                result = await MappingToolsHandler.getTableInfo(args);
                break;
            case 'update_table_name':
                result = await MappingToolsHandler.updateTableName(args);
                break;
            case 'delete_table_mapping':
                result = await MappingToolsHandler.deleteTableMapping(args);
                break;
            case 'check_system_health':
                result = await MappingToolsHandler.checkSystemHealth(args);
                break;
            default:
                throw new Error(`未知工具: ${name}`);
        }

        return {
            jsonrpc: '2.0',
            id: message.id,
            result: result
        };
    }

    /**
     * 处理资源列表请求
     */
    async handleResourcesList(message) {
        const resources = Object.values(apiResources).map(resource => ({
            uri: `mcp://excel-data/${resource.name}`,
            name: resource.name,
            description: resource.description,
            mimeType: resource.mimeType
        }));

        return {
            jsonrpc: '2.0',
            id: message.id,
            result: {
                resources: resources
            }
        };
    }

    /**
     * 处理资源读取请求
     */
    async handleResourceRead(message) {
        const { uri } = message.params;
        console.log(`[MCP Resource Read] ${uri}`);

        // 检查API连接状态
        const isConnected = await httpClient.checkConnection();
        if (!isConnected) {
            throw new Error('无法连接到Excel数据管理系统API，请检查服务是否运行');
        }

        const result = await ResourceHandler.getResource(new URL(uri));
        return {
            jsonrpc: '2.0',
            id: message.id,
            result: result
        };
    }

    /**
     * 处理ping请求
     */
    handlePing(message) {
        return {
            jsonrpc: '2.0',
            id: message.id,
            result: {}
        };
    }

    /**
     * 设置错误处理
     */
    setupErrorHandling() {
        process.on('uncaughtException', (error) => {
            console.error('[Uncaught Exception]', error);
        });

        process.on('unhandledRejection', (reason, promise) => {
            console.error('[Unhandled Rejection]', reason);
        });
    }

    /**
     * 启动服务器
     */
    async run() {
        try {
            // 初始化 MCP Server（包括令牌管理）
            console.log('[MCP Server] 正在初始化...');
            const initialized = await initMCPServer();

            if (!initialized) {
                console.error('[MCP Server] 初始化失败，服务器无法启动');
                process.exit(1);
            }

            console.log('[MCP Server] 初始化完成，正在启动服务器...');

            // 启动HTTP服务器
            this.httpServer.listen(this.port, () => {
                console.log(`[MCP Server] HTTP服务器已启动，端口: ${this.port}`);
                console.log(`[MCP Server] 健康检查: http://localhost:${this.port}/health`);
                console.log(`[MCP Server] 服务器信息: http://localhost:${this.port}/info`);
                console.log(`[MCP Server] WebSocket端点: ws://localhost:${this.port}/mcp`);
                console.log(`[MCP Server] 等待WebSocket客户端连接...`);
            });

            // 优雅关闭
            this.setupGracefulShutdown();
        } catch (error) {
            console.error('[MCP Server] 启动失败:', error);
            process.exit(1);
        }
    }

    /**
     * 确保数据是有效的UTF-8编码
     * @param {Buffer|string} data - 输入数据
     * @returns {string} 有效的UTF-8字符串
     */
    ensureUtf8Encoding(data) {
        try {
            if (Buffer.isBuffer(data)) {
                return data.toString('utf8');
            } else if (typeof data === 'string') {
                // 验证字符串是否为有效的UTF-8
                return Buffer.from(data, 'utf8').toString('utf8');
            } else {
                return String(data);
            }
        } catch (error) {
            console.error('[Encoding Error] UTF-8编码验证失败:', error);
            // 如果UTF-8转换失败，尝试清理字符串
            return this.cleanString(String(data));
        }
    }

    /**
     * 清理字符串，移除无效字符和编码问题
     * @param {string} str - 要清理的字符串
     * @returns {string} 清理后的字符串
     */
    cleanString(str) {
        if (typeof str !== 'string') return str;

        // 移除控制字符和无效Unicode字符
        let cleaned = str.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

        // 尝试修复常见的编码问题
        cleaned = cleaned
            .replace(/\\x([0-9A-Fa-f]{2})/g, (match, hex) => {
                const charCode = parseInt(hex, 16);
                return charCode >= 32 && charCode <= 126 ? String.fromCharCode(charCode) : '';
            })
            .replace(/\\u([0-9A-Fa-f]{4})/g, (match, hex) => {
                const charCode = parseInt(hex, 16);
                return charCode >= 32 && charCode <= 126 ? String.fromCharCode(charCode) : '';
            });

        // 确保字符串是有效的UTF-8
        try {
            return Buffer.from(cleaned, 'utf8').toString('utf8');
        } catch {
            // 如果UTF-8转换失败，返回原始清理后的字符串
            return cleaned;
        }
    }

    /**
     * 清理错误消息，移除可能导致JSON解析问题的字符
     * @param {string} errorMessage - 原始错误消息
     * @returns {string} 清理后的错误消息
     */
    cleanErrorMessage(errorMessage) {
        if (typeof errorMessage !== 'string') return 'Unknown error';

        // 移除可能导致JSON解析问题的字符
        return errorMessage
            .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
            .replace(/"/g, "'")
            .replace(/\\/g, '/')
            .substring(0, 500); // 限制长度避免传输问题
    }

    /**
     * 为传输清理JSON字符串
     * @param {string} jsonString - JSON字符串
     * @returns {string} 清理后的JSON字符串
     */
    sanitizeJsonForTransmission(jsonString) {
        try {
            // 首先验证JSON是否有效
            JSON.parse(jsonString);

            // 清理字符串中的无效字符
            const cleaned = this.cleanString(jsonString);

            // 再次验证清理后的JSON
            JSON.parse(cleaned);

            return cleaned;
        } catch (error) {
            console.error('[JSON Sanitization] JSON清理失败:', error);
            // 如果清理失败，返回安全的错误响应
            return JSON.stringify({
                jsonrpc: '2.0',
                error: {
                    code: -32603,
                    message: '数据传输错误：JSON格式无效'
                }
            });
        }
    }

    /**
     * 设置优雅关闭
     */
    setupGracefulShutdown() {
        const shutdown = async (signal) => {
            console.log(`\n[${signal}] 收到关闭信号，正在优雅关闭...`);

            // 关闭WebSocket连接
            for (const [connectionId, ws] of this.connections) {
                try {
                    ws.close();
                } catch (error) {
                    console.error(`[MCP WebSocket] 关闭连接失败 (${connectionId}):`, error);
                }
            }
            this.connections.clear();

            // 关闭HTTP服务器
            this.httpServer.close(() => {
                console.log('[MCP Server] HTTP服务器已关闭');
                process.exit(0);
            });

            // 强制退出超时
            setTimeout(() => {
                console.error('[MCP Server] 强制退出');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));
    }
}

// 启动服务器
if (import.meta.url === `file://${process.argv[1]}`) {
    const server = new SimpleMCPServer();
    server.run().catch((error) => {
        console.error('服务器运行失败:', error);
        process.exit(1);
    });
}

export default SimpleMCPServer;

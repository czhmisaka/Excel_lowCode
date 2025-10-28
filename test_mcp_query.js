/**
 * MCP服务器查询能力测试脚本
 * 通过HTTP API直接测试MCP工具
 */

const axios = require('axios');

// MCP服务器配置
const MCP_BASE_URL = 'http://localhost:19902';
const API_KEY = 'test-key'; // 如果配置了API密钥

class MCPTester {
    constructor() {
        this.sessionId = null;
        this.client = axios.create({
            baseURL: MCP_BASE_URL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            }
        });
    }

    /**
     * 初始化MCP会话
     */
    async initializeSession() {
        try {
            console.log('初始化MCP会话...');
            const response = await this.client.post('/mcp', {
                jsonrpc: '2.0',
                id: 1,
                method: 'initialize',
                params: {
                    protocolVersion: '2024-11-05',
                    capabilities: {},
                    clientInfo: {
                        name: 'mcp-query-tester',
                        version: '1.0.0'
                    }
                }
            });

            if (response.data.result) {
                this.sessionId = response.data.result.sessionId;
                console.log('✅ MCP会话初始化成功');
                console.log(`会话ID: ${this.sessionId}`);
                return true;
            } else {
                console.log('❌ MCP会话初始化失败:', response.data.error);
                return false;
            }
        } catch (error) {
            console.log('❌ MCP会话初始化错误:', error.message);
            return false;
        }
    }

    /**
     * 调用MCP工具
     */
    async callTool(toolName, params) {
        if (!this.sessionId) {
            console.log('❌ 请先初始化MCP会话');
            return null;
        }

        try {
            console.log(`\n调用工具: ${toolName}`);
            console.log('参数:', JSON.stringify(params, null, 2));

            const response = await this.client.post('/mcp', {
                jsonrpc: '2.0',
                id: Date.now(),
                method: 'tools/call',
                params: {
                    name: toolName,
                    arguments: params
                }
            }, {
                headers: {
                    'mcp-session-id': this.sessionId
                }
            });

            if (response.data.result) {
                console.log('✅ 工具调用成功');
                return response.data.result;
            } else {
                console.log('❌ 工具调用失败:', response.data.error);
                return null;
            }
        } catch (error) {
            console.log('❌ 工具调用错误:', error.message);
            return null;
        }
    }

    /**
     * 列出可用工具
     */
    async listTools() {
        if (!this.sessionId) {
            console.log('❌ 请先初始化MCP会话');
            return null;
        }

        try {
            console.log('\n获取可用工具列表...');
            const response = await this.client.post('/mcp', {
                jsonrpc: '2.0',
                id: Date.now(),
                method: 'tools/list',
                params: {}
            }, {
                headers: {
                    'mcp-session-id': this.sessionId
                }
            });

            if (response.data.result) {
                console.log('✅ 工具列表获取成功');
                return response.data.result;
            } else {
                console.log('❌ 工具列表获取失败:', response.data.error);
                return null;
            }
        } catch (error) {
            console.log('❌ 工具列表获取错误:', error.message);
            return null;
        }
    }

    /**
     * 测试系统健康检查
     */
    async testSystemHealth() {
        console.log('\n=== 测试系统健康检查 ===');
        const result = await this.callTool('check_system_health', {});
        if (result) {
            console.log('系统健康状态:', result);
        }
        return result;
    }

    /**
     * 测试列出表映射关系
     */
    async testListTableMappings() {

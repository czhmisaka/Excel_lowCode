/**
 * MCP服务器查询能力完整测试脚本
 * 通过HTTP API直接测试Streamable模式下的MCP工具
 */

const axios = require('axios');

// MCP服务器配置
const MCP_BASE_URL = 'http://localhost:19902';

class MCPQueryTester {
    constructor() {
        this.sessionId = null;

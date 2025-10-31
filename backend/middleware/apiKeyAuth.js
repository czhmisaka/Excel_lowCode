/*
 * @Date: 2025-10-31 13:55:30
 * @LastEditors: CZH
 * @LastEditTime: 2025-10-31 13:56:02
 * @FilePath: /lowCode_excel/backend/middleware/apiKeyAuth.js
 */
/**
 * API密钥认证中间件
 * 用于MCP服务器等内部服务的认证
 */

/**
 * API密钥认证中间件
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
function apiKeyAuth(req, res, next) {
    // 获取API密钥
    const apiKey = req.headers['x-api-key'];
    const expectedApiKey = process.env.MCP_API_KEY;

    // 如果没有配置API密钥，跳过认证
    if (!expectedApiKey) {
        console.warn('MCP_API_KEY未配置，跳过API密钥认证');
        return next();
    }

    // 验证API密钥
    if (!apiKey) {
        return res.status(401).json({
            success: false,
            message: '缺少API密钥'
        });
    }

    if (apiKey !== expectedApiKey) {
        return res.status(401).json({
            success: false,
            message: '无效的API密钥'
        });
    }

    // API密钥验证通过，设置用户上下文
    req.user = {
        id: -1, // 系统用户ID
        username: 'mcp_service',
        role: 'admin',
        displayName: 'MCP Service Account',
        isApiKeyAuth: true
    };

    next();
}

/**
 * 可选的API密钥认证中间件
 * 如果提供了有效的API密钥则认证，否则继续处理
 */
function optionalApiKeyAuth(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    const expectedApiKey = process.env.MCP_API_KEY;

    // 如果没有配置API密钥或没有提供API密钥，跳过认证
    if (!expectedApiKey || !apiKey) {
        return next();
    }

    // 验证API密钥
    if (apiKey === expectedApiKey) {
        req.user = {
            id: -1,
            username: 'mcp_service',
            role: 'admin',
            displayName: 'MCP Service Account',
            isApiKeyAuth: true
        };
    }

    next();
}

module.exports = {
    apiKeyAuth,
    optionalApiKeyAuth
};

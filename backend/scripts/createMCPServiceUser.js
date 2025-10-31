/*
 * @Date: 2025-10-31 09:48:00
 * @LastEditors: CZH
 * @LastEditTime: 2025-10-31 09:49:45
 * @FilePath: /lowCode_excel/backend/scripts/createMCPServiceUser.js
 */
require('dotenv').config();
const { sequelize } = require('../config/database');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

/**
 * 创建 MCP 服务账户并生成令牌
 */
const createMCPServiceUser = async () => {
    try {
        // 测试数据库连接
        await sequelize.authenticate();
        console.log('数据库连接成功');

        // 同步数据库表
        await sequelize.sync({ alter: true });
        console.log('数据库表同步成功');

        // 检查是否已存在 MCP 服务账户
        const existingMCPService = await User.findOne({
            where: { username: 'mcp_service' }
        });

        if (existingMCPService) {
            console.log('MCP 服务账户已存在，更新令牌...');

            // 生成新的令牌
            const token = generateToken(existingMCPService);

            console.log('MCP 服务账户信息:');
            console.log(`- 用户名: ${existingMCPService.username}`);
            console.log(`- 显示名称: ${existingMCPService.displayName}`);
            console.log(`- 角色: ${existingMCPService.role}`);
            console.log(`- 状态: ${existingMCPService.isActive ? '激活' : '禁用'}`);
            console.log('');
            console.log('MCP 服务令牌:');
            console.log(token);
            console.log('');
            console.log('重要提示:');
            console.log('1. 请将此令牌添加到 MCP server 的环境变量中');
            console.log('2. 环境变量名: MCP_SERVICE_TOKEN');
            console.log('3. 令牌将在24小时后过期，请定期更新');

            return token;
        }

        // 创建 MCP 服务账户
        const mcpServiceUser = await User.createWithPassword({
            username: 'mcp_service',
            password: 'mcp_service_password_' + Date.now(), // 使用时间戳确保唯一性
            displayName: 'MCP Service Account',
            email: 'mcp_service@example.com',
            role: 'admin' // 需要管理员权限来执行所有操作
        });

        console.log('MCP 服务账户创建成功');

        // 生成令牌
        const token = generateToken(mcpServiceUser);

        console.log('MCP 服务账户信息:');
        console.log(`- 用户名: ${mcpServiceUser.username}`);
        console.log(`- 显示名称: ${mcpServiceUser.displayName}`);
        console.log(`- 角色: ${mcpServiceUser.role}`);
        console.log(`- 邮箱: ${mcpServiceUser.email}`);
        console.log('');
        console.log('MCP 服务令牌:');
        console.log(token);
        console.log('');
        console.log('重要提示:');
        console.log('1. 请将此令牌添加到 MCP server 的环境变量中');
        console.log('2. 环境变量名: MCP_SERVICE_TOKEN');
        console.log('3. 令牌将在24小时后过期，请定期更新');
        console.log('4. 此账户用于 MCP server 自动访问系统 API');

        return token;

    } catch (error) {
        console.error('创建 MCP 服务账户失败:', error);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
};

// 如果直接运行此脚本
if (require.main === module) {
    createMCPServiceUser();
}

module.exports = createMCPServiceUser;

/**
 * 初始化服务账户脚本
 * 在项目启动时自动创建必要的服务账户
 */

const { User } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * 创建或更新 MCP 服务账户
 */
async function initMCPServiceUser() {
    try {
        console.log('初始化 MCP 服务账户...');

        const username = 'mcp_service';
        const password = 'mcp_service_password_' + Date.now(); // 使用时间戳确保唯一性
        const displayName = 'MCP Service Account';
        const role = 'admin';

        // 检查账户是否已存在
        let user = await User.findOne({ where: { username } });

        if (user) {
            console.log('MCP 服务账户已存在，更新密码和令牌...');

            // 更新密码
            const saltRounds = 10;
            const passwordHash = await bcrypt.hash(password, saltRounds);

            await User.update(
                {
                    passwordHash,
                    displayName,
                    role,
                    isActive: true,
                    updatedAt: new Date()
                },
                { where: { username } }
            );

            user = await User.findOne({ where: { username } });
        } else {
            console.log('创建新的 MCP 服务账户...');

            // 创建新账户
            const saltRounds = 10;
            const passwordHash = await bcrypt.hash(password, saltRounds);

            user = await User.create({
                username,
                email: 'mcp_service@system.local',
                passwordHash,
                displayName,
                role,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        // 生成 JWT 令牌
        const token = jwt.sign(
            {
                userId: user.id,
                username: user.username,
                role: user.role,
                displayName: user.displayName
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        console.log('MCP 服务账户初始化完成:');
        console.log('- 用户名:', user.username);
        console.log('- 显示名称:', user.displayName);
        console.log('- 角色:', user.role);
        console.log('- 状态:', user.isActive ? '激活' : '禁用');
        console.log('- 令牌:', token);

        return {
            success: true,
            user: {
                id: user.id,
                username: user.username,
                displayName: user.displayName,
                role: user.role,
                isActive: user.isActive
            },
            token
        };

    } catch (error) {
        console.error('初始化 MCP 服务账户失败:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * 初始化所有服务账户
 */
async function initAllServiceUsers() {
    try {
        console.log('开始初始化所有服务账户...');

        const results = {
            mcpService: await initMCPServiceUser()
        };

        console.log('\n服务账户初始化完成:');
        console.log('- MCP 服务账户:', results.mcpService.success ? '成功' : '失败');

        return results;

    } catch (error) {
        console.error('初始化服务账户失败:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    const { sequelize } = require('../models/index');

    sequelize.authenticate()
        .then(() => {
            console.log('数据库连接成功');
            return initAllServiceUsers();
        })
        .then(results => {
            console.log('\n服务账户初始化脚本执行完成');
            process.exit(0);
        })
        .catch(error => {
            console.error('脚本执行失败:', error);
            process.exit(1);
        });
}

module.exports = {
    initMCPServiceUser,
    initAllServiceUsers
};

const express = require('express');
const router = express.Router();
const { User } = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * @swagger
 * /api/service-accounts/mcp/token:
 *   get:
 *     summary: 获取 MCP 服务账户令牌
 *     description: 获取 MCP 服务账户的最新令牌（仅限内部使用）
 *     tags:
 *       - 服务账户
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取令牌
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     displayName:
 *                       type: string
 *                     role:
 *                       type: string
 *       401:
 *         description: 未授权
 *       404:
 *         description: MCP 服务账户不存在
 *       500:
 *         description: 服务器错误
 */
router.get('/mcp/token', async (req, res) => {
    try {
        // 验证调用者权限 - 允许管理员或 MCP 服务账户自己获取令牌
        if (!req.user || (req.user.role !== 'admin' && req.user.username !== 'mcp_service')) {
            return res.status(403).json({
                success: false,
                message: '权限不足'
            });
        }

        const username = 'mcp_service';

        // 查找 MCP 服务账户
        const user = await User.findOne({ where: { username } });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'MCP 服务账户不存在'
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'MCP 服务账户已被禁用'
            });
        }

        // 生成新的 JWT 令牌
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

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                displayName: user.displayName,
                role: user.role
            }
        });

    } catch (error) {
        console.error('获取 MCP 服务令牌失败:', error);
        res.status(500).json({
            success: false,
            message: '获取服务令牌失败'
        });
    }
});

/**
 * @swagger
 * /api/service-accounts/mcp/init:
 *   post:
 *     summary: 初始化 MCP 服务账户
 *     description: 创建或更新 MCP 服务账户并返回令牌（无需认证，仅限内部使用）
 *     tags:
 *       - 服务账户
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 default: mcp_service
 *               password:
 *                 type: string
 *                 description: 可选密码，如果不提供将自动生成
 *     responses:
 *       200:
 *         description: 成功初始化服务账户
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     displayName:
 *                       type: string
 *                     role:
 *                       type: string
 *       500:
 *         description: 服务器错误
 */
router.post('/mcp/init', async (req, res) => {
    try {
        console.log('初始化 MCP 服务账户...');

        const username = req.body.username || 'mcp_service';
        const password = req.body.password || `mcp_service_password_${Date.now()}`;
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

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                displayName: user.displayName,
                role: user.role,
                isActive: user.isActive
            }
        });

    } catch (error) {
        console.error('初始化 MCP 服务账户失败:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/service-accounts/mcp/status:
 *   get:
 *     summary: 检查 MCP 服务账户状态
 *     description: 检查 MCP 服务账户的状态和令牌信息
 *     tags:
 *       - 服务账户
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取状态
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 exists:
 *                   type: boolean
 *                 isActive:
 *                   type: boolean
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     displayName:
 *                       type: string
 *                     role:
 *                       type: string
 *                     lastLogin:
 *                       type: string
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.get('/mcp/status', async (req, res) => {
    try {
        // 验证调用者权限
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: '权限不足'
            });
        }

        const username = 'mcp_service';
        const user = await User.findOne({ where: { username } });

        if (!user) {
            return res.json({
                success: true,
                exists: false,
                isActive: false
            });
        }

        res.json({
            success: true,
            exists: true,
            isActive: user.isActive,
            user: {
                id: user.id,
                username: user.username,
                displayName: user.displayName,
                role: user.role,
                lastLogin: user.lastLogin
            }
        });

    } catch (error) {
        console.error('检查 MCP 服务账户状态失败:', error);
        res.status(500).json({
            success: false,
            message: '检查服务账户状态失败'
        });
    }
});

module.exports = router;

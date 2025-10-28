/*
 * @Date: 2025-10-28 14:29:00
 * @LastEditors: CZH
 * @LastEditTime: 2025-10-28 14:30:03
 * @FilePath: /lowCode_excel/backend/middleware/auth.js
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'lowcode_excel_secret_key_2025';

/**
 * 生成JWT令牌
 * @param {Object} user - 用户对象
 * @returns {string} JWT令牌
 */
const generateToken = (user) => {
    const payload = {
        userId: user.id,
        username: user.username,
        role: user.role,
        displayName: user.displayName
    };

    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: '24h' // 令牌24小时过期
    });
};

/**
 * 验证JWT令牌
 * @param {string} token - JWT令牌
 * @returns {Object|null} 解码后的令牌数据或null
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

/**
 * 认证中间件 - 验证JWT令牌
 */
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: '访问令牌缺失'
            });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: '无效的访问令牌'
            });
        }

        // 从数据库获取用户信息，确保用户仍然存在且活跃
        const user = await User.findByPk(decoded.userId);
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: '用户不存在或已被禁用'
            });
        }

        // 将用户信息添加到请求对象中
        req.user = {
            id: user.id,
            username: user.username,
            role: user.role,
            displayName: user.displayName
        };

        next();
    } catch (error) {
        console.error('认证中间件错误:', error);
        return res.status(500).json({
            success: false,
            message: '认证过程发生错误'
        });
    }
};

/**
 * 权限检查中间件
 * @param {Array} allowedRoles - 允许的角色数组
 */
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '需要认证'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: '权限不足'
            });
        }

        next();
    };
};

/**
 * 可选认证中间件 - 如果提供了令牌则验证，但不强制要求
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = verifyToken(token);
            if (decoded) {
                const user = await User.findByPk(decoded.userId);
                if (user && user.isActive) {
                    req.user = {
                        id: user.id,
                        username: user.username,
                        role: user.role,
                        displayName: user.displayName
                    };
                }
            }
        }

        next();
    } catch (error) {
        // 可选认证失败不影响继续处理
        console.warn('可选认证失败:', error.message);
        next();
    }
};

module.exports = {
    generateToken,
    verifyToken,
    authenticateToken,
    requireRole,
    optionalAuth,
    JWT_SECRET
};

/*
 * @Date: 2025-10-28 14:30:00
 * @LastEditors: CZH
 * @LastEditTime: 2025-10-28 14:31:28
 * @FilePath: /lowCode_excel/backend/controllers/authController.js
 */
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

/**
 * 用户登录
 */
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // 验证输入参数
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: '用户名和密码不能为空'
            });
        }

        // 查找用户
        const user = await User.findOne({
            where: { username }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: '用户名或密码错误'
            });
        }

        // 检查用户是否激活
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: '用户已被禁用，请联系管理员'
            });
        }

        // 验证密码
        const isValidPassword = await user.validatePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: '用户名或密码错误'
            });
        }

        // 更新最后登录时间
        await user.updateLastLogin();

        // 生成JWT令牌
        const token = generateToken(user);

        // 返回用户信息（不包含密码哈希）
        const userInfo = {
            id: user.id,
            username: user.username,
            email: user.email,
            displayName: user.displayName,
            role: user.role,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt
        };

        res.json({
            success: true,
            message: '登录成功',
            data: {
                user: userInfo,
                token: token
            }
        });

    } catch (error) {
        console.error('用户登录错误:', error);
        res.status(500).json({
            success: false,
            message: `登录失败: ${error.message}`
        });
    }
};

/**
 * 用户注册
 */
const register = async (req, res) => {
    try {
        const { username, password, email, displayName } = req.body;

        // 验证输入参数
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: '用户名和密码不能为空'
            });
        }

        // 检查用户名是否已存在
        const existingUser = await User.findOne({
            where: { username }
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: '用户名已存在'
            });
        }

        // 检查邮箱是否已存在（如果提供了邮箱）
        if (email) {
            const existingEmail = await User.findOne({
                where: { email }
            });

            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: '邮箱已被注册'
                });
            }
        }

        // 创建用户
        const user = await User.createWithPassword({
            username,
            password,
            email,
            displayName: displayName || username,
            role: 'user' // 默认用户角色
        });

        // 生成JWT令牌
        const token = generateToken(user);

        // 返回用户信息（不包含密码哈希）
        const userInfo = {
            id: user.id,
            username: user.username,
            email: user.email,
            displayName: user.displayName,
            role: user.role,
            createdAt: user.createdAt
        };

        res.status(201).json({
            success: true,
            message: '注册成功',
            data: {
                user: userInfo,
                token: token
            }
        });

    } catch (error) {
        console.error('用户注册错误:', error);
        res.status(500).json({
            success: false,
            message: `注册失败: ${error.message}`
        });
    }
};

/**
 * 获取当前用户信息
 */
const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['passwordHash'] }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        res.json({
            success: true,
            data: user
        });

    } catch (error) {
        console.error('获取用户信息错误:', error);
        res.status(500).json({
            success: false,
            message: `获取用户信息失败: ${error.message}`
        });
    }
};

/**
 * 更新当前用户信息
 */
const updateCurrentUser = async (req, res) => {
    try {
        const { displayName, email } = req.body;
        const userId = req.user.id;

        // 构建更新数据
        const updateData = {};
        if (displayName !== undefined) updateData.displayName = displayName;
        if (email !== undefined) updateData.email = email;

        // 检查邮箱是否已被其他用户使用
        if (email) {
            const existingEmail = await User.findOne({
                where: {
                    email,
                    id: { $ne: userId }
                }
            });

            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: '邮箱已被其他用户使用'
                });
            }
        }

        // 更新用户信息
        const [affectedRows] = await User.update(updateData, {
            where: { id: userId }
        });

        if (affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 获取更新后的用户信息
        const updatedUser = await User.findByPk(userId, {
            attributes: { exclude: ['passwordHash'] }
        });

        res.json({
            success: true,
            message: '用户信息更新成功',
            data: updatedUser
        });

    } catch (error) {
        console.error('更新用户信息错误:', error);
        res.status(500).json({
            success: false,
            message: `更新用户信息失败: ${error.message}`
        });
    }
};

/**
 * 修改密码
 */
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        // 验证输入参数
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: '当前密码和新密码不能为空'
            });
        }

        // 获取用户
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 验证当前密码
        const isValidPassword = await user.validatePassword(currentPassword);
        if (!isValidPassword) {
            return res.status(400).json({
                success: false,
                message: '当前密码错误'
            });
        }

        // 更新密码
        await User.updatePassword(userId, newPassword);

        res.json({
            success: true,
            message: '密码修改成功'
        });

    } catch (error) {
        console.error('修改密码错误:', error);
        res.status(500).json({
            success: false,
            message: `修改密码失败: ${error.message}`
        });
    }
};

module.exports = {
    login,
    register,
    getCurrentUser,
    updateCurrentUser,
    changePassword
};

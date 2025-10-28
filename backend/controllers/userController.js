/*
 * @Date: 2025-10-28 14:31:00
 * @LastEditors: CZH
 * @LastEditTime: 2025-10-28 14:36:33
 * @FilePath: /lowCode_excel/backend/controllers/userController.js
 */
const User = require('../models/User');

/**
 * 获取用户列表（管理员权限）
 */
const getUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, search } = req.query;
        const offset = (page - 1) * limit;

        // 构建查询条件
        const whereCondition = {};
        if (search) {
            whereCondition.$or = [
                { username: { $like: `%${search}%` } },
                { displayName: { $like: `%${search}%` } },
                { email: { $like: `%${search}%` } }
            ];
        }

        // 查询用户列表
        const { count, rows: users } = await User.findAndCountAll({
            where: whereCondition,
            attributes: { exclude: ['passwordHash'] },
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count,
                    totalPages: Math.ceil(count / limit)
                }
            }
        });

    } catch (error) {
        console.error('获取用户列表错误:', error);
        res.status(500).json({
            success: false,
            message: `获取用户列表失败: ${error.message}`
        });
    }
};

/**
 * 获取单个用户信息（管理员权限）
 */
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findByPk(id, {
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
 * 更新用户信息（管理员权限）
 */
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { displayName, email, role, isActive } = req.body;

        // 检查用户是否存在
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 构建更新数据
        const updateData = {};
        if (displayName !== undefined) updateData.displayName = displayName;
        if (email !== undefined) updateData.email = email;
        if (role !== undefined) updateData.role = role;
        if (isActive !== undefined) updateData.isActive = isActive;

        // 检查邮箱是否已被其他用户使用
        if (email && email !== user.email) {
            const existingEmail = await User.findOne({
                where: {
                    email,
                    id: { $ne: id }
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
        await User.update(updateData, {
            where: { id }
        });

        // 获取更新后的用户信息
        const updatedUser = await User.findByPk(id, {
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
 * 删除用户（管理员权限）
 */
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // 检查用户是否存在
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 不能删除自己
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({
                success: false,
                message: '不能删除自己的账户'
            });
        }

        // 删除用户
        await User.destroy({
            where: { id }
        });

        res.json({
            success: true,
            message: '用户删除成功'
        });

    } catch (error) {
        console.error('删除用户错误:', error);
        res.status(500).json({
            success: false,
            message: `删除用户失败: ${error.message}`
        });
    }
};

/**
 * 重置用户密码（管理员权限）
 */
const resetUserPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword) {
            return res.status(400).json({
                success: false,
                message: '新密码不能为空'
            });
        }

        // 检查用户是否存在
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 重置密码
        await User.updatePassword(id, newPassword);

        res.json({
            success: true,
            message: '用户密码重置成功'
        });

    } catch (error) {
        console.error('重置用户密码错误:', error);
        res.status(500).json({
            success: false,
            message: `重置用户密码失败: ${error.message}`
        });
    }
};

/**
 * 创建用户（管理员权限）
 */
const createUser = async (req, res) => {
    try {
        const { username, password, email, displayName, role } = req.body;

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
            role: role || 'user'
        });

        // 返回用户信息（不包含密码哈希）
        const userInfo = {
            id: user.id,
            username: user.username,
            email: user.email,
            displayName: user.displayName,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt
        };

        res.status(201).json({
            success: true,
            message: '用户创建成功',
            data: userInfo
        });

    } catch (error) {
        console.error('创建用户错误:', error);
        res.status(500).json({
            success: false,
            message: `创建用户失败: ${error.message}`
        });
    }
};

module.exports = {
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    resetUserPassword,
    createUser
};

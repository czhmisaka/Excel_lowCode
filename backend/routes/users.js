/*
 * @Date: 2025-10-28 14:34:00
 * @LastEditors: CZH
 * @LastEditTime: 2025-10-28 14:35:10
 * @FilePath: /lowCode_excel/backend/routes/users.js
 */
const express = require('express');
const router = express.Router();
const {
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    resetUserPassword,
    createUser
} = require('../controllers/userController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// 所有用户管理路由都需要管理员权限
router.use(authenticateToken, requireRole(['admin']));

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: 获取用户列表（管理员权限）
 *     tags: [用户管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 每页数量
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜索关键词（用户名、显示名称、邮箱）
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 */
router.get('/', getUsers);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: 创建用户（管理员权限）
 *     tags: [用户管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: 用户名
 *               password:
 *                 type: string
 *                 description: 密码
 *               email:
 *                 type: string
 *                 description: 邮箱（可选）
 *               displayName:
 *                 type: string
 *                 description: 显示名称（可选）
 *               role:
 *                 type: string
 *                 enum: [admin, user, guest]
 *                 description: 用户角色
 *     responses:
 *       201:
 *         description: 创建成功
 *       400:
 *         description: 用户名已存在或其他验证错误
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 */
router.post('/', createUser);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: 获取单个用户信息（管理员权限）
 *     tags: [用户管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 用户ID
 *     responses:
 *       200:
 *         description: 获取成功
 *       404:
 *         description: 用户不存在
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 */
router.get('/:id', getUserById);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: 更新用户信息（管理员权限）
 *     tags: [用户管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 用户ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *                 description: 显示名称
 *               email:
 *                 type: string
 *                 description: 邮箱
 *               role:
 *                 type: string
 *                 enum: [admin, user, guest]
 *                 description: 用户角色
 *               isActive:
 *                 type: boolean
 *                 description: 是否激活
 *     responses:
 *       200:
 *         description: 更新成功
 *       400:
 *         description: 邮箱已被其他用户使用
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 *       404:
 *         description: 用户不存在
 */
router.put('/:id', updateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: 删除用户（管理员权限）
 *     tags: [用户管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 用户ID
 *     responses:
 *       200:
 *         description: 删除成功
 *       400:
 *         description: 不能删除自己的账户
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 *       404:
 *         description: 用户不存在
 */
router.delete('/:id', deleteUser);

/**
 * @swagger
 * /api/users/{id}/reset-password:
 *   post:
 *     summary: 重置用户密码（管理员权限）
 *     tags: [用户管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 用户ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 description: 新密码
 *     responses:
 *       200:
 *         description: 密码重置成功
 *       400:
 *         description: 新密码不能为空
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 *       404:
 *         description: 用户不存在
 */
router.post('/:id/reset-password', resetUserPassword);

module.exports = router;

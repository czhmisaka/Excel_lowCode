/*
 * @Date: 2025-10-28 14:33:00
 * @LastEditors: CZH
 * @LastEditTime: 2025-10-28 14:34:03
 * @FilePath: /lowCode_excel/backend/routes/auth.js
 */
const express = require('express');
const router = express.Router();
const {
    login,
    register,
    getCurrentUser,
    updateCurrentUser,
    changePassword
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: 用户登录
 *     tags: [认证]
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
 *     responses:
 *       200:
 *         description: 登录成功
 *       401:
 *         description: 用户名或密码错误
 */
router.post('/login', login);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: 用户注册
 *     tags: [认证]
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
 *     responses:
 *       201:
 *         description: 注册成功
 *       400:
 *         description: 用户名已存在或其他验证错误
 */
router.post('/register', register);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: 获取当前用户信息
 *     tags: [认证]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 */
router.get('/me', authenticateToken, getCurrentUser);

/**
 * @swagger
 * /api/auth/me:
 *   put:
 *     summary: 更新当前用户信息
 *     tags: [认证]
 *     security:
 *       - bearerAuth: []
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
 *     responses:
 *       200:
 *         description: 更新成功
 *       401:
 *         description: 未认证
 */
router.put('/me', authenticateToken, updateCurrentUser);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: 修改密码
 *     tags: [认证]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: 当前密码
 *               newPassword:
 *                 type: string
 *                 description: 新密码
 *     responses:
 *       200:
 *         description: 密码修改成功
 *       400:
 *         description: 当前密码错误
 *       401:
 *         description: 未认证
 */
router.post('/change-password', authenticateToken, changePassword);

module.exports = router;

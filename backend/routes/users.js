const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: 获取用户列表
 *     tags: [用户管理]
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
 *           default: 10
 *         description: 每页数量
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜索关键词（姓名、手机号、用户名）
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *         description: 公司ID（可选）
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: 是否启用（true/false）
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/', UserController.getUsers);

/**
 * @swagger
 * /api/users/phone/{phone}:
 *   get:
 *     summary: 根据手机号获取用户信息
 *     tags: [用户管理]
 *     parameters:
 *       - in: path
 *         name: phone
 *         required: true
 *         schema:
 *           type: string
 *         description: 手机号
 *     responses:
 *       200:
 *         description: 获取成功
 *       404:
 *         description: 用户不存在
 */
router.get('/phone/:phone', UserController.getUserByPhone);

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: 手机号登录/自动注册
 *     tags: [用户管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *                 description: 手机号
 *               companyCode:
 *                 type: string
 *                 description: 公司代码（可选，用于自动注册）
 *     responses:
 *       200:
 *         description: 登录成功
 *       400:
 *         description: 登录失败
 *       404:
 *         description: 用户不存在
 */
router.post('/login', UserController.loginByPhone);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: 创建用户
 *     tags: [用户管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - realName
 *               - phone
 *               - companyId
 *             properties:
 *               username:
 *                 type: string
 *                 description: 用户名
 *               realName:
 *                 type: string
 *                 description: 真实姓名
 *               phone:
 *                 type: string
 *                 description: 手机号
 *               companyId:
 *                 type: string
 *                 description: 公司ID
 *               role:
 *                 type: string
 *                 enum: [employee, manager, admin]
 *                 default: employee
 *                 description: 用户角色
 *     responses:
 *       201:
 *         description: 创建成功
 *       400:
 *         description: 创建失败（手机号已存在等）
 */
router.post('/', UserController.createUser);

/**
 * @swagger
 * /api/users/{userId}:
 *   put:
 *     summary: 更新用户信息
 *     tags: [用户管理]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               realName:
 *                 type: string
 *                 description: 真实姓名
 *               role:
 *                 type: string
 *                 enum: [employee, manager, admin]
 *                 description: 用户角色
 *               isActive:
 *                 type: boolean
 *                 description: 是否启用
 *     responses:
 *       200:
 *         description: 更新成功
 *       404:
 *         description: 用户不存在
 */
router.put('/:userId', UserController.updateUser);

/**
 * @swagger
 * /api/users/{userId}:
 *   delete:
 *     summary: 删除用户
 *     tags: [用户管理]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户ID
 *     responses:
 *       200:
 *         description: 删除成功
 *       404:
 *         description: 用户不存在
 */
router.delete('/:userId', UserController.deleteUser);

/**
 * @swagger
 * /api/users/batch:
 *   post:
 *     summary: 批量导入用户
 *     tags: [用户管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - users
 *             properties:
 *               users:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - username
 *                     - realName
 *                     - phone
 *                     - companyId
 *                   properties:
 *                     username:
 *                       type: string
 *                     realName:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     companyId:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [employee, manager, admin]
 *                       default: employee
 *     responses:
 *       201:
 *         description: 批量导入成功
 *       400:
 *         description: 批量导入失败
 */
router.post('/batch', UserController.batchImportUsers);

/**
 * @swagger
 * /api/users/{userId}/password:
 *   put:
 *     summary: 管理员修改用户密码
 *     tags: [用户管理]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
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
 *                 description: 新密码（至少6个字符）
 *     responses:
 *       200:
 *         description: 密码修改成功
 *       400:
 *         description: 密码格式错误
 *       404:
 *         description: 用户不存在
 */
router.put('/:userId/password', UserController.adminChangePassword);

module.exports = router;

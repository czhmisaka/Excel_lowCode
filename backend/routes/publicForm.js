const express = require('express');
const router = express.Router();
const publicFormController = require('../controllers/publicFormController');

/**
 * @swagger
 * /api/public/form/{hash}/structure:
 *   get:
 *     summary: 获取公开表单表结构信息
 *     description: 根据哈希值获取公开表单的表结构信息，无需认证
 *     tags:
 *       - 公开表单
 *     parameters:
 *       - in: path
 *         name: hash
 *         required: true
 *         schema:
 *           type: string
 *         description: 表的哈希值
 *     responses:
 *       200:
 *         description: 成功获取表结构信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     columns:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: "name"
 *                           type:
 *                             type: string
 *                             example: "string"
 *                           nullable:
 *                             type: boolean
 *                             example: true
 *                           defaultValue:
 *                             type: any
 *                             example: null
 *                     tableName:
 *                       type: string
 *                       example: "员工信息表"
 *       400:
 *         description: 无效的哈希值格式
 *       404:
 *         description: 表不存在
 *       500:
 *         description: 服务器内部错误
 */
router.get('/:hash/structure', publicFormController.getTableStructure);

/**
 * @swagger
 * /api/public/form/{hash}/submit:
 *   post:
 *     summary: 提交公开表单数据
 *     description: 向指定表提交表单数据，无需认证
 *     tags:
 *       - 公开表单
 *     parameters:
 *       - in: path
 *         name: hash
 *         required: true
 *         schema:
 *           type: string
 *         description: 表的哈希值
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - data
 *             properties:
 *               data:
 *                 type: object
 *                 description: 表单数据
 *                 example: { "name": "张三", "age": 25, "department": "技术部" }
 *     responses:
 *       200:
 *         description: 数据提交成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "数据提交成功"
 *                 data:
 *                   type: object
 *                   description: 新增的数据（包含生成的ID）
 *       400:
 *         description: 请求参数错误
 *       404:
 *         description: 表不存在
 *       500:
 *         description: 服务器内部错误
 */
router.post('/:hash/submit', publicFormController.addData);

module.exports = router;

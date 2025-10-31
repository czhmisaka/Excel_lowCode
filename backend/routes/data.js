const express = require('express');
const router = express.Router();
const { TableMapping, getDynamicModel } = require('../models');
const queryController = require('../controllers/queryController');
const editController = require('../controllers/editController');
const exportController = require('../controllers/exportController');
const { authenticateToken } = require('../middleware/auth');
const { optionalApiKeyAuth } = require('../middleware/apiKeyAuth');

/**
 * @swagger
 * /api/data/{hash}:
 *   get:
 *     summary: 查询数据
 *     description: 根据哈希值查询对应表的数据（支持分页和条件查询）
 *     tags:
 *       - 数据操作
 *     parameters:
 *       - in: path
 *         name: hash
 *         required: true
 *         schema:
 *           type: string
 *         description: 表的哈希值
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: 每页条数
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜索条件（JSON字符串）
 *     responses:
 *       200:
 *         description: 成功获取数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     additionalProperties: true
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 100
 *                     pages:
 *                       type: integer
 *                       example: 10
 *       404:
 *         description: 表不存在
 *       500:
 *         description: 服务器内部错误
 */
router.get('/:hash', optionalApiKeyAuth, authenticateToken, queryController.queryData);

/**
 * @swagger
 * /api/data/{hash}:
 *   put:
 *     summary: 更新数据
 *     description: 根据哈希值和条件更新数据
 *     tags:
 *       - 数据操作
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
 *               - conditions
 *               - updates
 *             properties:
 *               conditions:
 *                 type: object
 *                 description: 更新条件
 *                 example: { "id": 1 }
 *               updates:
 *                 type: object
 *                 description: 更新内容
 *                 example: { "name": "李四", "age": 26 }
 *     responses:
 *       200:
 *         description: 数据更新成功
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
 *                   example: "数据更新成功"
 *                 affectedRows:
 *                   type: integer
 *                   example: 1
 *       400:
 *         description: 请求参数错误
 *       404:
 *         description: 表不存在
 *       500:
 *         description: 服务器内部错误
 */
router.put('/:hash', authenticateToken, editController.updateData);

/**
 * @swagger
 * /api/data/{hash}/add:
 *   post:
 *     summary: 新增数据
 *     description: 向指定表中新增数据
 *     tags:
 *       - 数据操作
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
 *                 description: 新增数据
 *                 example: { "name": "王五", "age": 30, "department": "销售部" }
 *     responses:
 *       200:
 *         description: 数据新增成功
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
 *                   example: "数据新增成功"
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
router.post('/:hash/add', authenticateToken, editController.addData);

/**
 * @swagger
 * /api/data/{hash}:
 *   delete:
 *     summary: 删除数据
 *     description: 根据条件删除数据
 *     tags:
 *       - 数据操作
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
 *               - conditions
 *             properties:
 *               conditions:
 *                 type: object
 *                 description: 删除条件
 *                 example: { "id": 1 }
 *     responses:
 *       200:
 *         description: 数据删除成功
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
 *                   example: "数据删除成功"
 *                 affectedRows:
 *                   type: integer
 *                   example: 1
 *       400:
 *         description: 请求参数错误
 *       404:
 *         description: 表不存在
 *       500:
 *         description: 服务器内部错误
 */
router.delete('/:hash', authenticateToken, editController.deleteData);

/**
 * @swagger
 * /api/data/{hash}/export:
 *   get:
 *     summary: 导出数据为Excel
 *     description: 根据哈希值导出对应表的所有数据为Excel文件
 *     tags:
 *       - 数据操作
 *     parameters:
 *       - in: path
 *         name: hash
 *         required: true
 *         schema:
 *           type: string
 *         description: 表的哈希值
 *     responses:
 *       200:
 *         description: 成功导出Excel文件
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: 无效的哈希值格式
 *       404:
 *         description: 表不存在
 *       500:
 *         description: 服务器内部错误或Excel生成失败
 */
router.get('/:hash/export', exportController.exportData);

/**
 * @swagger
 * /api/data/{hash}/export/status:
 *   get:
 *     summary: 获取导出状态
 *     description: 检查表是否存在以及是否支持导出
 *     tags:
 *       - 数据操作
 *     parameters:
 *       - in: path
 *         name: hash
 *         required: true
 *         schema:
 *           type: string
 *         description: 表的哈希值
 *     responses:
 *       200:
 *         description: 成功获取导出状态
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
 *                     tableName:
 *                       type: string
 *                       example: "员工信息表"
 *                     originalFileName:
 *                       type: string
 *                       example: "员工信息表.xlsx"
 *                     columnCount:
 *                       type: integer
 *                       example: 5
 *                     rowCount:
 *                       type: integer
 *                       example: 100
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     exportSupported:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: 无效的哈希值格式
 *       404:
 *         description: 表不存在
 *       500:
 *         description: 服务器内部错误
 */
router.get('/:hash/export/status', exportController.getExportStatus);

module.exports = router;

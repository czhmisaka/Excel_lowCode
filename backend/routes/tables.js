/*
 * @Date: 2025-11-20 10:00:00
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-20 10:04:43
 * @FilePath: /lowCode_excel/backend/routes/tables.js
 * @Description: 数据表管理路由
 */

const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');

/**
 * @swagger
 * tags:
 *   name: Tables
 *   description: 数据表管理API
 */

/**
 * @swagger
 * /api/tables:
 *   post:
 *     summary: 创建数据表
 *     tags: [Tables]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - columns
 *             properties:
 *               name:
 *                 type: string
 *                 description: 表名
 *                 example: "user_profiles"
 *               description:
 *                 type: string
 *                 description: 表描述
 *                 example: "用户档案表"
 *               columns:
 *                 type: array
 *                 description: 字段定义
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - type
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: 字段名
 *                       example: "username"
 *                     type:
 *                       type: string
 *                       description: 字段类型
 *                       example: "VARCHAR(255)"
 *                     primaryKey:
 *                       type: boolean
 *                       description: 是否为主键
 *                       example: false
 *                     autoIncrement:
 *                       type: boolean
 *                       description: 是否自增
 *                       example: false
 *                     unique:
 *                       type: boolean
 *                       description: 是否唯一
 *                       example: false
 *                     allowNull:
 *                       type: boolean
 *                       description: 是否允许为空
 *                       example: true
 *                     defaultValue:
 *                       type: string
 *                       description: 默认值
 *                       example: "CURRENT_TIMESTAMP"
 *     responses:
 *       201:
 *         description: 数据表创建成功
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
 *                   example: "数据表创建成功"
 *                 data:
 *                   type: object
 *                   properties:
 *                     tableName:
 *                       type: string
 *                       example: "user_profiles"
 *                     hashValue:
 *                       type: string
 *                       example: "a1b2c3d4e5f6..."
 *                     columnCount:
 *                       type: integer
 *                       example: 5
 *                     mappingId:
 *                       type: integer
 *                       example: 1
 *       400:
 *         description: 参数错误
 *       409:
 *         description: 表已存在
 *       500:
 *         description: 服务器错误
 */
router.post('/', tableController.createTable);

/**
 * @swagger
 * /api/tables:
 *   get:
 *     summary: 获取数据表列表
 *     tags: [Tables]
 *     parameters:
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
 *           default: 20
 *         description: 每页数量
 *     responses:
 *       200:
 *         description: 数据表列表获取成功
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
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       tableName:
 *                         type: string
 *                         example: "user_profiles"
 *                       hashValue:
 *                         type: string
 *                         example: "a1b2c3d4e5f6..."
 *                       columnCount:
 *                         type: integer
 *                         example: 5
 *                       rowCount:
 *                         type: integer
 *                         example: 100
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-11-20T02:00:00.000Z"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-11-20T02:00:00.000Z"
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 20
 *                     total:
 *                       type: integer
 *                       example: 50
 *                     pages:
 *                       type: integer
 *                       example: 3
 *       500:
 *         description: 服务器错误
 */
router.get('/', tableController.getTables);

/**
 * @swagger
 * /api/tables/{tableName}:
 *   get:
 *     summary: 获取数据表详情
 *     tags: [Tables]
 *     parameters:
 *       - in: path
 *         name: tableName
 *         required: true
 *         schema:
 *           type: string
 *         description: 表名
 *     responses:
 *       200:
 *         description: 数据表详情获取成功
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
 *                     mapping:
 *                       type: object
 *                       description: 表映射信息
 *                     structure:
 *                       type: object
 *                       description: 表结构信息
 *       404:
 *         description: 表不存在
 *       500:
 *         description: 服务器错误
 */
router.get('/:tableName', tableController.getTableDetail);

/**
 * @swagger
 * /api/tables/{tableName}:
 *   delete:
 *     summary: 删除数据表
 *     tags: [Tables]
 *     parameters:
 *       - in: path
 *         name: tableName
 *         required: true
 *         schema:
 *           type: string
 *         description: 表名
 *     responses:
 *       200:
 *         description: 数据表删除成功
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
 *                   example: "数据表删除成功"
 *       404:
 *         description: 表不存在
 *       500:
 *         description: 服务器错误
 */
router.delete('/:tableName', tableController.deleteTable);

module.exports = router;

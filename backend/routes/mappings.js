const express = require('express');
const router = express.Router();
const { TableMapping } = require('../models');
const { deleteMapping } = require('../controllers/deleteController');
const { updateTableName } = require('../controllers/updateMappingController');
const { optionalApiKeyAuth } = require('../middleware/apiKeyAuth');

/**
 * @swagger
 * /api/mappings:
 *   get:
 *     summary: 获取所有表映射关系
 *     description: 查询所有Excel文件与动态表的映射关系
 *     tags:
 *       - 映射关系
 *     responses:
 *       200:
 *         description: 成功获取映射关系列表
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
 *                         example: "员工信息表"
 *                       hashValue:
 *                         type: string
 *                         example: "abc123def456..."
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-09-27T23:11:16.000Z"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-09-27T23:11:16.000Z"
 *                 total:
 *                   type: integer
 *                   example: 1
 *       500:
 *         description: 服务器内部错误
 */
router.get('/', async (req, res) => {
    try {
        const mappings = await TableMapping.findAll({
            attributes: ['id', 'tableName', 'hashValue', 'columnDefinitions', 'headerRow', 'rowCount', 'columnCount', 'createdAt', 'updatedAt'],
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            data: mappings,
            total: mappings.length
        });
    } catch (error) {
        console.error('获取映射关系失败:', error);
        res.status(500).json({
            success: false,
            message: '获取映射关系失败',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/mappings/{hash}:
 *   get:
 *     summary: 根据哈希值获取映射关系详情
 *     description: 根据哈希值查询特定的表映射关系
 *     tags:
 *       - 映射关系
 *     parameters:
 *       - in: path
 *         name: hash
 *         required: true
 *         schema:
 *           type: string
 *         description: 表的哈希值
 *     responses:
 *       200:
 *         description: 成功获取映射关系详情
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
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     tableName:
 *                       type: string
 *                       example: "员工信息表"
 *                     hashValue:
 *                       type: string
 *                       example: "abc123def456..."
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-09-27T23:11:16.000Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-09-27T23:11:16.000Z"
 *       404:
 *         description: 映射关系不存在
 *       500:
 *         description: 服务器内部错误
 */
router.get('/:hash', async (req, res) => {
    try {
        const { hash } = req.params;
        const mapping = await TableMapping.findOne({
            where: { hashValue: hash },
            attributes: ['id', 'tableName', 'hashValue', 'columnDefinitions', 'headerRow', 'createdAt', 'updatedAt']
        });

        if (!mapping) {
            return res.status(404).json({
                success: false,
                message: '映射关系不存在'
            });
        }

        res.json({
            success: true,
            data: mapping
        });
    } catch (error) {
        console.error('获取映射关系详情失败:', error);
        res.status(500).json({
            success: false,
            message: '获取映射关系详情失败',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/mappings/{hash}:
 *   put:
 *     summary: 更新表名
 *     description: 根据哈希值更新表映射关系的表名
 *     tags:
 *       - 映射关系
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
 *               - tableName
 *             properties:
 *               tableName:
 *                 type: string
 *                 example: "新的表名"
 *                 description: "新的表名"
 *     responses:
 *       200:
 *         description: 成功更新表名
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
 *                   example: "表名更新成功"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     tableName:
 *                       type: string
 *                       example: "新的表名"
 *                     hashValue:
 *                       type: string
 *                       example: "abc123def456..."
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-09-27T23:11:16.000Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-09-28T16:42:00.000Z"
 *       400:
 *         description: 无效的请求参数
 *       404:
 *         description: 映射关系不存在
 *       500:
 *         description: 服务器内部错误
 */
router.put('/:hash', updateTableName);

/**
 * @swagger
 * /api/mappings/{hash}/columns:
 *   get:
 *     summary: 根据哈希值获取表的列信息
 *     description: 根据哈希值查询特定表的列定义信息，用于前端表单配置
 *     tags:
 *       - 映射关系
 *     parameters:
 *       - in: path
 *         name: hash
 *         required: true
 *         schema:
 *           type: string
 *         description: 表的哈希值
 *     responses:
 *       200:
 *         description: 成功获取列信息
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
 *                       name:
 *                         type: string
 *                         example: "name"
 *                         description: "列名"
 *                       type:
 *                         type: string
 *                         example: "string"
 *                         description: "数据类型"
 *                       nullable:
 *                         type: boolean
 *                         example: true
 *                         description: "是否可为空"
 *                       defaultValue:
 *                         type: any
 *                         example: null
 *                         description: "默认值"
 *       404:
 *         description: 映射关系不存在
 *       500:
 *         description: 服务器内部错误
 */
router.get('/:hash/columns', async (req, res) => {
    try {
        const { hash } = req.params;
        const mapping = await TableMapping.findOne({
            where: { hashValue: hash },
            attributes: ['id', 'tableName', 'hashValue', 'columnDefinitions']
        });

        if (!mapping) {
            return res.status(404).json({
                success: false,
                message: '映射关系不存在'
            });
        }

        // 解析columnDefinitions
        let columnDefinitions = [];
        if (mapping.columnDefinitions) {
            if (typeof mapping.columnDefinitions === 'string') {
                try {
                    columnDefinitions = JSON.parse(mapping.columnDefinitions);
                } catch (error) {
                    console.error('解析columnDefinitions失败:', error);
                    columnDefinitions = [];
                }
            } else {
                columnDefinitions = mapping.columnDefinitions;
            }
        }

        res.json({
            success: true,
            data: columnDefinitions
        });
    } catch (error) {
        console.error('获取列信息失败:', error);
        res.status(500).json({
            success: false,
            message: '获取列信息失败',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/mappings/{hash}:
 *   delete:
 *     summary: 删除表映射关系
 *     description: 根据哈希值删除表映射关系，并同步删除对应的数据表
 *     tags:
 *       - 映射关系
 *     parameters:
 *       - in: path
 *         name: hash
 *         required: true
 *         schema:
 *           type: string
 *         description: 表的哈希值
 *     responses:
 *       200:
 *         description: 成功删除映射关系
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
 *                   example: "映射关系删除成功"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     tableName:
 *                       type: string
 *                       example: "员工信息表"
 *                     hashValue:
 *                       type: string
 *                       example: "abc123def456..."
 *                     originalFileName:
 *                       type: string
 *                       example: "员工信息表.xlsx"
 *                     tableDropped:
 *                       type: boolean
 *                       example: true
 *                     deletedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-09-28T02:30:00.000Z"
 *       400:
 *         description: 无效的哈希值格式
 *       404:
 *         description: 映射关系不存在
 *       500:
 *         description: 服务器内部错误
 */
router.delete('/:hash', deleteMapping);

module.exports = router;

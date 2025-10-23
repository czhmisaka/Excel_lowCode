/*
 * @Date: 2025-10-22 17:00:00
 * @LastEditors: CZH
 * @LastEditTime: 2025-10-22 16:59:39
 * @FilePath: /lowCode_excel/backend/routes/import.js
 */
const express = require('express');
const { importExcelData } = require('../controllers/importController');
const { uploadMiddleware, validateFile } = require('../middleware/upload');

const router = express.Router();

/**
 * @swagger
 * /api/import/excel:
 *   post:
 *     summary: 导入Excel数据到现有表
 *     description: 将Excel文件中的数据导入到指定的现有表中，支持表头行选择和导入规则配置
 *     tags: [数据导入]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Excel文件 (.xlsx, .xls)
 *               targetHash:
 *                 type: string
 *                 description: 目标表的哈希值
 *               headerRow:
 *                 type: integer
 *                 description: 表头行号（从0开始），默认为0
 *                 example: 0
 *               importRules:
 *                 type: object
 *                 description: 导入规则配置
 *                 properties:
 *                   deduplicationFields:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: 去重字段列表
 *                   conflictStrategy:
 *                     type: string
 *                     enum: [skip, overwrite, error]
 *                     description: 冲突处理策略
 *                     example: skip
 *                   validationRules:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: 验证规则列表
 *     responses:
 *       200:
 *         description: 数据导入成功
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
 *                   example: "导入完成：成功 10 条，失败 2 条"
 *                 data:
 *                   type: object
 *                   properties:
 *                     successCount:
 *                       type: integer
 *                       description: 成功导入的记录数
 *                     errorCount:
 *                       type: integer
 *                       description: 导入失败的记录数
 *                     totalRecords:
 *                       type: integer
 *                       description: 总记录数
 *                     matchedColumns:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: 匹配的字段列表
 *                     missingColumns:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: 缺失的字段列表
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: 错误信息列表（最多10条）
 *       400:
 *         description: 数据导入失败
 *       404:
 *         description: 目标表不存在
 *       500:
 *         description: 服务器内部错误
 */
router.post('/excel', uploadMiddleware, validateFile, importExcelData);

module.exports = router;

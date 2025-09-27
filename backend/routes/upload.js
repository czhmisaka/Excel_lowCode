/*
 * @Date: 2025-09-27 23:23:41
 * @LastEditors: CZH
 * @LastEditTime: 2025-09-27 23:24:11
 * @FilePath: /backend/routes/upload.js
 */
const express = require('express');
const { uploadFile } = require('../controllers/uploadController');
const { uploadMiddleware, validateFile } = require('../middleware/upload');

const router = express.Router();

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: 上传Excel文件
 *     description: 上传Excel文件并创建对应的数据表
 *     tags: [文件上传]
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
 *     responses:
 *       200:
 *         description: 文件上传成功
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
 *                   example: "文件上传成功"
 *                 data:
 *                   type: object
 *                   properties:
 *                     hash:
 *                       type: string
 *                       description: 文件哈希值
 *                     tableName:
 *                       type: string
 *                       description: 表名
 *                     originalFileName:
 *                       type: string
 *                       description: 原始文件名
 *                     recordCount:
 *                       type: integer
 *                       description: 记录数量
 *                     columnCount:
 *                       type: integer
 *                       description: 列数量
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: 文件上传失败
 *       500:
 *         description: 服务器内部错误
 */
router.post('/', uploadMiddleware, validateFile, uploadFile);

module.exports = router;

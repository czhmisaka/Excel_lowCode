/*
 * @Date: 2025-09-27 23:23:41
 * @LastEditors: CZH
 * @LastEditTime: 2025-10-17 11:04:53
 * @FilePath: /lowCode_excel/backend/routes/upload.js
 */
const express = require('express');
const { uploadFile } = require('../controllers/uploadController');
const { uploadLargeFile, getUploadProgress, smartUploadFile } = require('../controllers/largeFileUploadController');
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

/**
 * @swagger
 * /api/upload/large:
 *   post:
 *     summary: 上传大Excel文件
 *     description: 上传大Excel文件（支持1000MB以上），使用流式处理避免内存溢出
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
 *         description: 大文件上传成功
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
 *                   example: "大文件上传成功"
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
 *                     batchErrors:
 *                       type: array
 *                       description: 批次处理错误信息
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: 文件上传失败
 *       500:
 *         description: 服务器内部错误
 */
router.post('/large', uploadMiddleware, validateFile, uploadLargeFile);

/**
 * @swagger
 * /api/upload/smart:
 *   post:
 *     summary: 智能上传Excel文件
 *     description: 根据文件大小自动选择处理方式，小文件使用快速处理，大文件使用流式处理
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
router.post('/smart', uploadMiddleware, validateFile, smartUploadFile);

/**
 * @swagger
 * /api/upload/progress/{progressId}:
 *   get:
 *     summary: 获取上传进度
 *     description: 获取大文件上传的处理进度
 *     tags: [文件上传]
 *     parameters:
 *       - in: path
 *         name: progressId
 *         required: true
 *         schema:
 *           type: string
 *         description: 进度跟踪ID
 *     responses:
 *       200:
 *         description: 进度信息获取成功
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
 *                     status:
 *                       type: string
 *                       description: 处理状态
 *                     processedRows:
 *                       type: integer
 *                       description: 已处理行数
 *                     totalRows:
 *                       type: integer
 *                       description: 总行数
 *                     currentBatch:
 *                       type: integer
 *                       description: 当前批次
 *                     message:
 *                       type: string
 *                       description: 进度消息
 *       404:
 *         description: 进度信息不存在
 *       500:
 *         description: 服务器内部错误
 */
router.get('/progress/:progressId', getUploadProgress);

module.exports = router;

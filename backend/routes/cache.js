/*
 * @Date: 2025-11-23 02:04:00
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-23 02:05:09
 * @FilePath: /lowCode_excel/backend/routes/cache.js
 */
const express = require('express');
const router = express.Router();
const cacheController = require('../controllers/cacheController');
const { authenticateToken } = require('../middleware/auth');
const { optionalApiKeyAuth } = require('../middleware/apiKeyAuth');

/**
 * @swagger
 * /api/cache/stats:
 *   get:
 *     summary: 获取缓存统计信息
 *     description: 获取详细的缓存统计信息，包括命中率、内存使用情况等
 *     tags:
 *       - 缓存管理
 *     responses:
 *       200:
 *         description: 成功获取缓存统计信息
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
 *                     enabled:
 *                       type: boolean
 *                       example: true
 *                     memoryCache:
 *                       type: object
 *                       properties:
 *                         enabled:
 *                           type: boolean
 *                           example: true
 *                         currentUsage:
 *                           type: integer
 *                           example: 52428800
 *                         maxUsage:
 *                           type: integer
 *                           example: 104857600
 *                         usagePercentage:
 *                           type: string
 *                           example: "50.00"
 *                         hits:
 *                           type: integer
 *                           example: 100
 *                         misses:
 *                           type: integer
 *                           example: 20
 *                         hitRate:
 *                           type: string
 *                           example: "83.33"
 *                     redisCache:
 *                       type: object
 *                       properties:
 *                         enabled:
 *                           type: boolean
 *                           example: true
 *                         connected:
 *                           type: boolean
 *                           example: true
 *                         hits:
 *                           type: integer
 *                           example: 50
 *                         misses:
 *                           type: integer
 *                           example: 10
 *                         hitRate:
 *                           type: string
 *                           example: "83.33"
 *                     overall:
 *                       type: object
 *                       properties:
 *                         totalQueries:
 *                           type: integer
 *                           example: 180
 *                         totalHits:
 *                           type: integer
 *                           example: 150
 *                         totalMisses:
 *                           type: integer
 *                           example: 30
 *                         hitRate:
 *                           type: string
 *                           example: "83.33"
 *                         lastReset:
 *                           type: string
 *                           format: date-time
 *       500:
 *         description: 服务器内部错误
 */
router.get('/stats', optionalApiKeyAuth, authenticateToken, cacheController.getCacheStats);

/**
 * @swagger
 * /api/cache/stats/reset:
 *   post:
 *     summary: 重置缓存统计信息
 *     description: 重置所有缓存统计计数器
 *     tags:
 *       - 缓存管理
 *     responses:
 *       200:
 *         description: 缓存统计信息已重置
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
 *                   example: "缓存统计信息已重置"
 *       500:
 *         description: 服务器内部错误
 */
router.post('/stats/reset', optionalApiKeyAuth, authenticateToken, cacheController.resetCacheStats);

/**
 * @swagger
 * /api/cache/table/{hash}:
 *   delete:
 *     summary: 清除指定表的缓存
 *     description: 清除指定哈希值对应的表的所有缓存数据
 *     tags:
 *       - 缓存管理
 *     parameters:
 *       - in: path
 *         name: hash
 *         required: true
 *         schema:
 *           type: string
 *         description: 表的哈希值
 *     responses:
 *       200:
 *         description: 表缓存已清除
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
 *                   example: "表 abc123 的缓存已清除"
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器内部错误
 */
router.delete('/table/:hash', optionalApiKeyAuth, authenticateToken, cacheController.clearTableCache);

/**
 * @swagger
 * /api/cache/all:
 *   delete:
 *     summary: 清除所有缓存
 *     description: 清除所有缓存数据，包括内存缓存和Redis缓存
 *     tags:
 *       - 缓存管理
 *     responses:
 *       200:
 *         description: 所有缓存已清除
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
 *                   example: "所有缓存已清除"
 *       500:
 *         description: 服务器内部错误
 */
router.delete('/all', optionalApiKeyAuth, authenticateToken, cacheController.clearAllCache);

/**
 * @swagger
 * /api/cache/status:
 *   get:
 *     summary: 获取缓存状态
 *     description: 获取缓存系统的简要状态信息
 *     tags:
 *       - 缓存管理
 *     responses:
 *       200:
 *         description: 成功获取缓存状态
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
 *                     enabled:
 *                       type: boolean
 *                       example: true
 *                     memoryCache:
 *                       type: object
 *                       properties:
 *                         enabled:
 *                           type: boolean
 *                           example: true
 *                         usage:
 *                           type: string
 *                           example: "50.00%"
 *                         hitRate:
 *                           type: string
 *                           example: "83.33%"
 *                     redisCache:
 *                       type: object
 *                       properties:
 *                         enabled:
 *                           type: boolean
 *                           example: true
 *                         connected:
 *                           type: boolean
 *                           example: true
 *                         hitRate:
 *                           type: string
 *                           example: "83.33%"
 *                     overall:
 *                       type: object
 *                       properties:
 *                         hitRate:
 *                           type: string
 *                           example: "83.33%"
 *                         totalQueries:
 *                           type: integer
 *                           example: 180
 *       500:
 *         description: 服务器内部错误
 */
router.get('/status', optionalApiKeyAuth, authenticateToken, cacheController.getCacheStatus);

module.exports = router;

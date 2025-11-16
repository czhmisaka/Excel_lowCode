const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/database');

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: 系统健康检查
 *     description: 检查系统各组件运行状态
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: 系统健康状态
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
 *                       example: "healthy"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     components:
 *                       type: object
 *                       properties:
 *                         database:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                               example: "connected"
 *                             latency:
 *                               type: number
 *                               example: 15
 *                         memory:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                               example: "normal"
 *                             usage:
 *                               type: number
 *                               example: 65.2
 *                         api:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                               example: "available"
 *                             responseTime:
 *                               type: number
 *                               example: 120
 *       500:
 *         description: 系统异常
 */
router.get('/', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // 检查数据库连接
    let dbStatus = 'disconnected';
    let dbLatency = 0;
    try {
      const dbStartTime = Date.now();
      await sequelize.authenticate();
      dbLatency = Date.now() - dbStartTime;
      dbStatus = 'connected';
    } catch (error) {
      console.error('数据库连接检查失败:', error.message);
      dbStatus = 'error';
    }

    // 检查内存使用情况
    const memoryUsage = process.memoryUsage();
    const memoryPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    const memoryStatus = memoryPercent < 80 ? 'normal' : 'high';

    // 计算API响应时间
    const apiResponseTime = Date.now() - startTime;

    // 系统总体状态判断
    let overallStatus = 'healthy';
    if (dbStatus !== 'connected') {
      overallStatus = 'degraded';
    }
    if (memoryStatus === 'high') {
      overallStatus = 'warning';
    }

    res.json({
      success: true,
      data: {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        components: {
          database: {
            status: dbStatus,
            latency: dbLatency
          },
          memory: {
            status: memoryStatus,
            usage: Math.round(memoryPercent * 100) / 100
          },
          api: {
            status: 'available',
            responseTime: apiResponseTime
          }
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '系统健康检查失败',
      error: error.message
    });
  }
});

module.exports = router;

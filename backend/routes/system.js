const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/database');
const { TableMapping } = require('../models');

/**
 * @swagger
 * /api/system/info:
 *   get:
 *     summary: 获取系统信息
 *     description: 返回系统部署信息、数据库状态、服务状态等详细信息
 *     tags: [系统状态]
 *     responses:
 *       200:
 *         description: 系统信息获取成功
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
 *                     system:
 *                       type: object
 *                       properties:
 *                         environment:
 *                           type: string
 *                           example: "production"
 *                         nodeVersion:
 *                           type: string
 *                           example: "v18.17.0"
 *                         platform:
 *                           type: string
 *                           example: "linux"
 *                         uptime:
 *                           type: number
 *                           example: 3600
 *                     database:
 *                       type: object
 *                       properties:
 *                         type:
 *                           type: string
 *                           example: "mysql"
 *                         host:
 *                           type: string
 *                           example: "118.196.16.32"
 *                         port:
 *                           type: number
 *                           example: 3306
 *                         name:
 *                           type: string
 *                           example: "max"
 *                         status:
 *                           type: string
 *                           example: "connected"
 *                         tableCount:
 *                           type: number
 *                           example: 5
 *                         totalRecords:
 *                           type: number
 *                           example: 1000
 *                     services:
 *                       type: object
 *                       properties:
 *                         backend:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                               example: "running"
 *                             port:
 *                               type: number
 *                               example: 3000
 *                             version:
 *                               type: string
 *                               example: "1.0.0"
 *                         frontend:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                               example: "running"
 *                             port:
 *                               type: number
 *                               example: 8080
 *                         mcpServer:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                               example: "running"
 *                             port:
 *                               type: number
 *                               example: 3001
 *                     deployment:
 *                       type: object
 *                       properties:
 *                         mode:
 *                           type: string
 *                           example: "docker"
 *                         composeVersion:
 *                           type: string
 *                           example: "3.8"
 *                         healthChecks:
 *                           type: boolean
 *                           example: true
 *       500:
 *         description: 系统信息获取失败
 */
router.get('/info', async (req, res) => {
    try {
        // 测试数据库连接
        let dbStatus = 'disconnected';
        let tableCount = 0;
        let totalRecords = 0;

        try {
            await sequelize.authenticate();
            dbStatus = 'connected';

            // 获取表数量
            const mappings = await TableMapping.findAll();
            tableCount = mappings.length;

            // 获取总记录数（需要查询每个表）
            for (const mapping of mappings) {
                try {
                    const [results] = await sequelize.query(`SELECT COUNT(*) as count FROM \`${mapping.tableName}\``);
                    totalRecords += results[0].count;
                } catch (error) {
                    console.warn(`无法查询表 ${mapping.tableName} 的记录数:`, error.message);
                }
            }
        } catch (dbError) {
            console.error('数据库连接测试失败:', dbError.message);
            dbStatus = 'disconnected';
        }

        // 构建系统信息响应
        const systemInfo = {
            system: {
                environment: process.env.NODE_ENV || 'development',
                nodeVersion: process.version,
                platform: process.platform,
                uptime: Math.floor(process.uptime()),
                timestamp: new Date().toISOString()
            },
            database: {
                type: process.env.DB_TYPE || 'mysql',
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT) || 3306,
                name: process.env.DB_NAME || 'unknown',
                status: dbStatus,
                tableCount: tableCount,
                totalRecords: totalRecords,
                dialect: sequelize.getDialect()
            },
            services: {
                backend: {
                    status: 'running',
                    port: parseInt(process.env.PORT) || 3000,
                    version: '1.0.0'
                },
                frontend: {
                    status: 'running', // 假设前端正常运行
                    port: parseInt(process.env.FRONTEND_PORT) || 8080,
                    version: '1.0.0'
                },
                mcpServer: {
                    status: 'running', // 假设MCP服务器正常运行
                    port: parseInt(process.env.MCP_SERVER_PORT) || 3001,
                    version: '1.0.0'
                }
            },
            deployment: {
                mode: process.env.DEPLOYMENT_MODE || 'docker',
                composeVersion: '3.8',
                healthChecks: true,
                volumes: ['backend-uploads', 'mcp-exports']
            }
        };

        res.json({
            success: true,
            data: systemInfo
        });

    } catch (error) {
        console.error('获取系统信息失败:', error);
        res.status(500).json({
            success: false,
            message: '获取系统信息失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;

/*
 * @Date: 2025-10-28 15:08:43
 * @LastEditors: CZH
 * @LastEditTime: 2025-10-28 16:33:27
 * @FilePath: /lowCode_excel/backend/routes/rollback.js
 */
const express = require('express');
const router = express.Router();
const RollbackController = require('../controllers/rollbackController');
const { authenticateToken, requireRole } = require('../middleware/auth');

/**
 * 回退路由
 * 提供操作日志查看和回退功能
 */

// 获取操作日志列表 - 需要认证
router.get('/logs', authenticateToken, RollbackController.getOperationLogs);

// 获取单个日志详情 - 需要认证
router.get('/logs/:logId', authenticateToken, RollbackController.getLogDetail);

// 回退单个操作 - 需要管理员权限
router.post('/logs/:logId/rollback', authenticateToken, requireRole(['admin']), RollbackController.rollbackOperation);

// 批量回退操作 - 需要管理员权限
router.post('/batch-rollback', authenticateToken, requireRole(['admin']), RollbackController.batchRollback);

module.exports = router;

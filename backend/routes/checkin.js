const express = require('express');
const router = express.Router();
const CheckinController = require('../controllers/checkinController');

/**
 * @swagger
 * /api/checkin/checkin:
 *   post:
 *     summary: 用户签到
 *     tags: [签到管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - companyCode
 *             properties:
 *               phone:
 *                 type: string
 *                 description: 手机号
 *               companyCode:
 *                 type: string
 *                 description: 公司代码
 *               location:
 *                 type: string
 *                 description: 签到位置（可选）
 *     responses:
 *       200:
 *         description: 签到成功
 *       400:
 *         description: 签到失败（重复签到等）
 */
router.post('/checkin', CheckinController.checkin);

/**
 * @swagger
 * /api/checkin/checkout:
 *   post:
 *     summary: 用户签退
 *     tags: [签到管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - companyCode
 *             properties:
 *               phone:
 *                 type: string
 *                 description: 手机号
 *               companyCode:
 *                 type: string
 *                 description: 公司代码
 *     responses:
 *       200:
 *         description: 签退成功
 *       400:
 *         description: 签退失败（未签到等）
 */
router.post('/checkout', CheckinController.checkout);

/**
 * @swagger
 * /api/checkin/history:
 *   get:
 *     summary: 获取签到历史
 *     tags: [签到管理]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: 用户ID（可选）
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *         description: 公司ID（可选）
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 开始日期（可选）
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 结束日期（可选）
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 每页数量
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/history', CheckinController.getCheckinHistory);

/**
 * @swagger
 * /api/checkin/today-status:
 *   get:
 *     summary: 获取今日签到状态
 *     tags: [签到管理]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           required: true
 *         description: 用户ID
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *           required: true
 *         description: 公司ID
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/today-status', CheckinController.getTodayStatus);

/**
 * @swagger
 * /api/checkin/records:
 *   get:
 *     summary: 获取公司签到记录
 *     tags: [签到管理]
 *     parameters:
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *           required: true
 *         description: 公司ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 每页数量
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/records', CheckinController.getCheckinHistory);

/**
 * @swagger
 * /api/checkin/record/{recordId}:
 *   delete:
 *     summary: 删除打卡记录
 *     tags: [签到管理]
 *     parameters:
 *       - in: path
 *         name: recordId
 *         schema:
 *           type: string
 *           required: true
 *         description: 打卡记录ID
 *     responses:
 *       200:
 *         description: 删除成功
 *       404:
 *         description: 记录不存在
 */
router.delete('/record/:recordId', CheckinController.deleteCheckinRecord);

/**
 * @swagger
 * /api/checkin/export:
 *   get:
 *     summary: 导出打卡记录为Excel
 *     tags: [签到管理]
 *     parameters:
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *         description: 公司ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 开始日期（格式：YYYY-MM-DD）
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 结束日期（格式：YYYY-MM-DD）
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜索关键词（姓名或手机号）
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码（用于分页查询）
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 1000
 *         description: 每页数量（最大1000）
 *     responses:
 *       200:
 *         description: Excel文件下载
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: 参数错误
 *       500:
 *         description: 服务器内部错误
 */
router.get('/export', CheckinController.exportCheckinRecords);

/**
 * @swagger
 * /api/checkin/records/batch:
 *   delete:
 *     summary: 批量删除打卡记录
 *     tags: [签到管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recordIds
 *             properties:
 *               recordIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: 要删除的记录ID数组
 *     responses:
 *       200:
 *         description: 批量删除成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedCount:
 *                       type: integer
 *                     totalRequested:
 *                       type: integer
 *       400:
 *         description: 参数错误（如recordIds为空或不是数组）
 *       500:
 *         description: 服务器内部错误
 */
router.delete('/records/batch', CheckinController.batchDeleteCheckinRecords);

module.exports = router;

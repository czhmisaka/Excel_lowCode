/*
 * @Date: 2025-12-11 18:00:00
 * @LastEditors: CZH
 * @LastEditTime: 2025-12-11 18:05:58
 * @FilePath: /打卡/backend/routes/laborSources.js
 * @Description: 劳务公司来源配置路由 - 每个公司独立的劳务来源管理
 */
const express = require('express');
const router = express.Router({ mergeParams: true }); // 合并参数以支持嵌套路由
const LaborSourceController = require('../controllers/laborSourceController');

/**
 * @swagger
 * /api/companies/{companyId}/labor-sources:
 *   get:
 *     summary: 获取公司的劳务来源列表
 *     tags: [劳务来源管理]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜索关键词（名称、代码或描述）
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: 是否启用（true/false）
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, code, sortOrder]
 *           default: sortOrder
 *         description: 排序字段
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: 排序顺序
 *     responses:
 *       200:
 *         description: 获取成功
 *       404:
 *         description: 公司不存在
 */
router.get('/', LaborSourceController.getLaborSources);

/**
 * @swagger
 * /api/companies/{companyId}/labor-sources/active:
 *   get:
 *     summary: 获取公司启用的劳务来源列表（用于下拉选择）
 *     tags: [劳务来源管理]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 公司ID
 *     responses:
 *       200:
 *         description: 获取成功
 *       404:
 *         description: 公司不存在
 */
router.get('/active', LaborSourceController.getActiveLaborSources);

/**
 * @swagger
 * /api/companies/{companyId}/labor-sources/{laborSourceId}:
 *   get:
 *     summary: 获取单个劳务来源
 *     tags: [劳务来源管理]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 公司ID
 *       - in: path
 *         name: laborSourceId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 劳务来源ID
 *     responses:
 *       200:
 *         description: 获取成功
 *       404:
 *         description: 公司或劳务来源不存在
 */
router.get('/:laborSourceId', LaborSourceController.getLaborSource);

/**
 * @swagger
 * /api/companies/{companyId}/labor-sources:
 *   post:
 *     summary: 创建劳务来源
 *     tags: [劳务来源管理]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 公司ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *             properties:
 *               name:
 *                 type: string
 *                 description: 劳务来源名称
 *               code:
 *                 type: string
 *                 description: 劳务来源代码（同一公司内唯一）
 *               description:
 *                 type: string
 *                 description: 劳务来源描述（可选）
 *               isActive:
 *                 type: boolean
 *                 description: 是否启用（默认true）
 *               sortOrder:
 *                 type: integer
 *                 description: 排序顺序（默认0）
 *     responses:
 *       201:
 *         description: 创建成功
 *       400:
 *         description: 创建失败（代码已存在等）
 *       404:
 *         description: 公司不存在
 */
router.post('/', LaborSourceController.createLaborSource);

/**
 * @swagger
 * /api/companies/{companyId}/labor-sources/{laborSourceId}:
 *   put:
 *     summary: 更新劳务来源信息
 *     tags: [劳务来源管理]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 公司ID
 *       - in: path
 *         name: laborSourceId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 劳务来源ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 劳务来源名称
 *               description:
 *                 type: string
 *                 description: 劳务来源描述
 *               isActive:
 *                 type: boolean
 *                 description: 是否启用
 *               sortOrder:
 *                 type: integer
 *                 description: 排序顺序
 *     responses:
 *       200:
 *         description: 更新成功
 *       404:
 *         description: 公司或劳务来源不存在
 */
router.put('/:laborSourceId', LaborSourceController.updateLaborSource);

/**
 * @swagger
 * /api/companies/{companyId}/labor-sources/{laborSourceId}:
 *   delete:
 *     summary: 删除劳务来源
 *     tags: [劳务来源管理]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 公司ID
 *       - in: path
 *         name: laborSourceId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 劳务来源ID
 *     responses:
 *       200:
 *         description: 删除成功
 *       400:
 *         description: 删除失败（有签到记录使用）
 *       404:
 *         description: 公司或劳务来源不存在
 */
router.delete('/:laborSourceId', LaborSourceController.deleteLaborSource);

/**
 * @swagger
 * /api/companies/{companyId}/labor-sources/{laborSourceId}/toggle:
 *   put:
 *     summary: 切换劳务来源启用状态
 *     tags: [劳务来源管理]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 公司ID
 *       - in: path
 *         name: laborSourceId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 劳务来源ID
 *     responses:
 *       200:
 *         description: 切换成功
 *       404:
 *         description: 公司或劳务来源不存在
 */
router.put('/:laborSourceId/toggle', LaborSourceController.toggleLaborSourceStatus);

/**
 * @swagger
 * /api/companies/{companyId}/labor-sources/batch:
 *   post:
 *     summary: 批量创建劳务来源
 *     tags: [劳务来源管理]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 公司ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - laborSources
 *             properties:
 *               laborSources:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - code
 *                   properties:
 *                     name:
 *                       type: string
 *                     code:
 *                       type: string
 *                     description:
 *                       type: string
 *                     isActive:
 *                       type: boolean
 *                     sortOrder:
 *                       type: integer
 *     responses:
 *       201:
 *         description: 批量创建成功
 *       400:
 *         description: 批量创建失败
 *       404:
 *         description: 公司不存在
 */
router.post('/batch', LaborSourceController.batchCreateLaborSources);

/**
 * @swagger
 * /api/labor-sources/company/{companyCode}/active:
 *   get:
 *     summary: 根据公司代码获取启用的劳务来源列表（用于签到页面）
 *     tags: [劳务来源管理]
 *     parameters:
 *       - in: path
 *         name: companyCode
 *         required: true
 *         schema:
 *           type: string
 *         description: 公司代码
 *     responses:
 *       200:
 *         description: 获取成功
 *       404:
 *         description: 公司不存在或已停用
 */
router.get('/company/:companyCode/active', LaborSourceController.getActiveLaborSourcesByCompanyCode);

module.exports = router;

const express = require('express');
const router = express.Router();
const CompanyController = require('../controllers/companyController');

/**
 * @swagger
 * /api/companies:
 *   get:
 *     summary: 获取公司列表
 *     tags: [公司管理]
 *     parameters:
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
 *         description: 搜索关键词（公司名称或代码）
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: 是否启用（true/false）
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/', CompanyController.getCompanies);

/**
 * @swagger
 * /api/companies/code/{companyCode}:
 *   get:
 *     summary: 根据公司代码获取公司信息
 *     tags: [公司管理]
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
 *         description: 公司不存在
 */
router.get('/code/:companyCode', CompanyController.getCompanyByCode);

/**
 * @swagger
 * /api/companies/{companyId}:
 *   get:
 *     summary: 根据公司ID获取公司信息
 *     tags: [公司管理]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *         description: 公司ID
 *     responses:
 *       200:
 *         description: 获取成功
 *       404:
 *         description: 公司不存在
 */
router.get('/:companyId', CompanyController.getCompany);

/**
 * @swagger
 * /api/companies:
 *   post:
 *     summary: 创建公司
 *     tags: [公司管理]
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
 *                 description: 公司名称
 *               code:
 *                 type: string
 *                 description: 公司代码（唯一标识）
 *               description:
 *                 type: string
 *                 description: 公司描述（可选）
 *     responses:
 *       201:
 *         description: 创建成功
 *       400:
 *         description: 创建失败（代码已存在等）
 */
router.post('/', CompanyController.createCompany);

/**
 * @swagger
 * /api/companies/{companyId}:
 *   put:
 *     summary: 更新公司信息
 *     tags: [公司管理]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *         description: 公司ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 公司名称
 *               description:
 *                 type: string
 *                 description: 公司描述
 *               isActive:
 *                 type: boolean
 *                 description: 是否启用
 *     responses:
 *       200:
 *         description: 更新成功
 *       404:
 *         description: 公司不存在
 */
router.put('/:companyId', CompanyController.updateCompany);

/**
 * @swagger
 * /api/companies/{companyId}:
 *   delete:
 *     summary: 删除公司
 *     tags: [公司管理]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *         description: 公司ID
 *     responses:
 *       200:
 *         description: 删除成功
 *       404:
 *         description: 公司不存在
 */
router.delete('/:companyId', CompanyController.deleteCompany);

/**
 * @swagger
 * /api/companies/batch:
 *   post:
 *     summary: 批量创建公司
 *     tags: [公司管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - companies
 *             properties:
 *               companies:
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
 *     responses:
 *       201:
 *         description: 批量创建成功
 *       400:
 *         description: 批量创建失败
 */
router.post('/batch', CompanyController.batchCreateCompanies);

// 嵌套劳务来源路由
const laborSourcesRouter = require('./laborSources');
router.use('/:companyId/labor-sources', laborSourcesRouter);

module.exports = router;

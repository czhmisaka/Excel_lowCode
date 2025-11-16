// 表单管理路由
const express = require('express');
const router = express.Router();
const formController = require('../controllers/formController');

/**
 * @swagger
 * /api/forms:
 *   get:
 *     summary: 获取表单列表
 *     description: 获取所有表单定义，支持分页和搜索
 *     tags:
 *       - 表单管理
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
 *         description: 每页条数
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜索关键词（表单名称）
 *     responses:
 *       200:
 *         description: 成功获取表单列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FormDefinition'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 5
 *                     pages:
 *                       type: integer
 *                       example: 1
 *       500:
 *         description: 服务器内部错误
 */
router.get('/', formController.getForms);

/**
 * @swagger
 * /api/forms/{formId}:
 *   get:
 *     summary: 获取表单详情
 *     description: 根据表单ID获取表单详情，包含关联的Hook配置
 *     tags:
 *       - 表单管理
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         schema:
 *           type: string
 *         description: 表单ID
 *     responses:
 *       200:
 *         description: 成功获取表单详情
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/FormDefinition'
 *       404:
 *         description: 表单不存在
 *       500:
 *         description: 服务器内部错误
 */
router.get('/:formId', formController.getForm);

/**
 * @swagger
 * /api/forms:
 *   post:
 *     summary: 创建表单
 *     description: 创建新的表单定义
 *     tags:
 *       - 表单管理
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - formId
 *               - name
 *               - definition
 *             properties:
 *               formId:
 *                 type: string
 *                 description: 表单唯一标识
 *                 example: "labor_sign_in"
 *               name:
 *                 type: string
 *                 description: 表单名称
 *                 example: "劳务人员签到系统"
 *               description:
 *                 type: string
 *                 description: 表单描述
 *                 example: "智能签到签退表单"
 *               tableMapping:
 *                 type: string
 *                 description: 关联的数据表哈希
 *                 example: "a7b672aabd61efd9f39668fc4fa179fc"
 *               definition:
 *                 type: object
 *                 description: 表单定义JSON
 *                 example: {"fields": [], "hooks": {}}
 *     responses:
 *       201:
 *         description: 表单创建成功
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
 *                   example: "表单创建成功"
 *                 data:
 *                   $ref: '#/components/schemas/FormDefinition'
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器内部错误
 */
router.post('/', formController.createForm);

/**
 * @swagger
 * /api/forms/{formId}:
 *   put:
 *     summary: 更新表单
 *     description: 更新表单定义
 *     tags:
 *       - 表单管理
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         schema:
 *           type: string
 *         description: 表单ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 表单名称
 *               description:
 *                 type: string
 *                 description: 表单描述
 *               tableMapping:
 *                 type: string
 *                 description: 关联的数据表哈希
 *               definition:
 *                 type: object
 *                 description: 表单定义JSON
 *     responses:
 *       200:
 *         description: 表单更新成功
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
 *                   example: "表单更新成功"
 *                 data:
 *                   $ref: '#/components/schemas/FormDefinition'
 *       404:
 *         description: 表单不存在
 *       500:
 *         description: 服务器内部错误
 */
router.put('/:formId', formController.updateForm);

/**
 * @swagger
 * /api/forms/{formId}:
 *   delete:
 *     summary: 删除表单
 *     description: 删除表单及其关联的Hook配置和提交记录
 *     tags:
 *       - 表单管理
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         schema:
 *           type: string
 *         description: 表单ID
 *     responses:
 *       200:
 *         description: 表单删除成功
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
 *                   example: "表单删除成功"
 *       404:
 *         description: 表单不存在
 *       500:
 *         description: 服务器内部错误
 */
router.delete('/:formId', formController.deleteForm);

/**
 * @swagger
 * /api/forms/{formId}/hooks:
 *   get:
 *     summary: 获取表单Hook列表
 *     description: 获取表单的所有Hook配置
 *     tags:
 *       - Hook管理
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         schema:
 *           type: string
 *         description: 表单ID
 *     responses:
 *       200:
 *         description: 成功获取Hook列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FormHook'
 *       500:
 *         description: 服务器内部错误
 */
router.get('/:formId/hooks', formController.getFormHooks);

/**
 * @swagger
 * /api/forms/{formId}/hooks:
 *   post:
 *     summary: 创建Hook
 *     description: 为表单创建新的Hook配置
 *     tags:
 *       - Hook管理
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         schema:
 *           type: string
 *         description: 表单ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - triggerType
 *               - config
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [javascript, http, database, conditional]
 *                 description: Hook类型
 *                 example: "javascript"
 *               triggerType:
 *                 type: string
 *                 enum: [beforeSubmit, afterSubmit, onError]
 *                 description: 触发时机
 *                 example: "beforeSubmit"
 *               config:
 *                 type: object
 *                 description: Hook配置JSON
 *                 example: {"code": "return data;"}
 *               enabled:
 *                 type: boolean
 *                 description: 是否启用
 *                 default: true
 *     responses:
 *       201:
 *         description: Hook创建成功
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
 *                   example: "Hook创建成功"
 *                 data:
 *                   $ref: '#/components/schemas/FormHook'
 *       400:
 *         description: 请求参数错误
 *       404:
 *         description: 表单不存在
 *       500:
 *         description: 服务器内部错误
 */
router.post('/:formId/hooks', formController.createHook);

module.exports = router;

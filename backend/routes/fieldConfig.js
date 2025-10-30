/*
 * 字段配置路由
 * @Date: 2025-10-30
 */
const express = require('express');
const router = express.Router();
const {
    getFieldConfig,
    updateFieldConfig,
    getTableStructure,
    resetFieldConfig
} = require('../controllers/fieldConfigController');

// 获取字段配置
router.get('/:hash', getFieldConfig);

// 更新字段配置
router.put('/:hash', updateFieldConfig);

// 获取完整表结构信息
router.get('/:hash/structure', getTableStructure);

// 重置字段配置
router.delete('/:hash', resetFieldConfig);

module.exports = router;

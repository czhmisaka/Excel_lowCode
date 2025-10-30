/*
 * 字段配置控制器
 * @Date: 2025-10-30
 */
const TableMapping = require('../models/TableMapping');

/**
 * 获取表的字段配置
 */
const getFieldConfig = async (req, res) => {
    try {
        const { hash } = req.params;

        if (!hash) {
            return res.status(400).json({
                success: false,
                message: '缺少表哈希参数'
            });
        }

        const mapping = await TableMapping.findOne({
            where: { hashValue: hash }
        });

        if (!mapping) {
            return res.status(404).json({
                success: false,
                message: '未找到对应的表映射'
            });
        }

        // 返回字段配置，如果没有配置则返回空对象
        const fieldConfig = mapping.formConfig || {};

        res.json({
            success: true,
            data: fieldConfig
        });

    } catch (error) {
        console.error('获取字段配置失败:', error);
        res.status(500).json({
            success: false,
            message: '获取字段配置失败',
            error: error.message
        });
    }
};

/**
 * 更新表的字段配置
 */
const updateFieldConfig = async (req, res) => {
    try {
        const { hash } = req.params;
        const { fieldConfig } = req.body;

        if (!hash) {
            return res.status(400).json({
                success: false,
                message: '缺少表哈希参数'
            });
        }

        if (!fieldConfig) {
            return res.status(400).json({
                success: false,
                message: '缺少字段配置数据'
            });
        }

        const mapping = await TableMapping.findOne({
            where: { hashValue: hash }
        });

        if (!mapping) {
            return res.status(404).json({
                success: false,
                message: '未找到对应的表映射'
            });
        }

        // 更新字段配置
        await mapping.update({
            formConfig: fieldConfig
        });

        console.log(`更新表 ${hash} 的字段配置成功`);

        res.json({
            success: true,
            message: '字段配置更新成功',
            data: fieldConfig
        });

    } catch (error) {
        console.error('更新字段配置失败:', error);
        res.status(500).json({
            success: false,
            message: '更新字段配置失败',
            error: error.message
        });
    }
};

/**
 * 获取表的完整结构信息（包括字段配置）
 */
const getTableStructure = async (req, res) => {
    try {
        const { hash } = req.params;

        if (!hash) {
            return res.status(400).json({
                success: false,
                message: '缺少表哈希参数'
            });
        }

        const mapping = await TableMapping.findOne({
            where: { hashValue: hash }
        });

        if (!mapping) {
            return res.status(404).json({
                success: false,
                message: '未找到对应的表映射'
            });
        }

        // 构建完整的表结构信息
        const tableStructure = {
            tableName: mapping.tableName,
            hash: mapping.hashValue,
            originalFileName: mapping.originalFileName,
            columnCount: mapping.columnCount,
            rowCount: mapping.rowCount,
            columns: mapping.columnDefinitions || [],
            fieldConfig: mapping.formConfig || {}
        };

        res.json({
            success: true,
            data: tableStructure
        });

    } catch (error) {
        console.error('获取表结构信息失败:', error);
        res.status(500).json({
            success: false,
            message: '获取表结构信息失败',
            error: error.message
        });
    }
};

/**
 * 重置字段配置为默认值
 */
const resetFieldConfig = async (req, res) => {
    try {
        const { hash } = req.params;

        if (!hash) {
            return res.status(400).json({
                success: false,
                message: '缺少表哈希参数'
            });
        }

        const mapping = await TableMapping.findOne({
            where: { hashValue: hash }
        });

        if (!mapping) {
            return res.status(404).json({
                success: false,
                message: '未找到对应的表映射'
            });
        }

        // 重置字段配置为空对象
        await mapping.update({
            formConfig: {}
        });

        console.log(`重置表 ${hash} 的字段配置成功`);

        res.json({
            success: true,
            message: '字段配置重置成功',
            data: {}
        });

    } catch (error) {
        console.error('重置字段配置失败:', error);
        res.status(500).json({
            success: false,
            message: '重置字段配置失败',
            error: error.message
        });
    }
};

module.exports = {
    getFieldConfig,
    updateFieldConfig,
    getTableStructure,
    resetFieldConfig
};

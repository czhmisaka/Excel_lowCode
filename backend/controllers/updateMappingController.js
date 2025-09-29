/*
 * @Date: 2025-09-28 16:41:10
 * @LastEditors: CZH
 * @LastEditTime: 2025-09-28 16:41:42
 * @FilePath: /综合部-年假计算/backend/controllers/updateMappingController.js
 */
const { TableMapping } = require('../models');
const { validateHash } = require('../utils/hashGenerator');
const { Op } = require('sequelize');

/**
 * 更新表名
 */
const updateTableName = async (req, res) => {
    try {
        const { hash } = req.params;
        const { tableName } = req.body;

        // 验证哈希值
        if (!validateHash(hash)) {
            return res.status(400).json({
                success: false,
                message: '无效的哈希值格式'
            });
        }

        // 验证表名
        if (!tableName || typeof tableName !== 'string' || tableName.trim() === '') {
            return res.status(400).json({
                success: false,
                message: '表名不能为空'
            });
        }

        const trimmedTableName = tableName.trim();

        // 检查表名长度
        if (trimmedTableName.length > 255) {
            return res.status(400).json({
                success: false,
                message: '表名长度不能超过255个字符'
            });
        }

        // 检查映射关系是否存在
        const mapping = await TableMapping.findOne({
            where: { hashValue: hash }
        });

        if (!mapping) {
            return res.status(404).json({
                success: false,
                message: '未找到对应的映射关系'
            });
        }

        // 检查表名是否已存在（排除当前记录）
        const existingMapping = await TableMapping.findOne({
            where: {
                tableName: trimmedTableName,
                hashValue: { [Op.ne]: hash } // 排除当前记录
            }
        });

        if (existingMapping) {
            return res.status(400).json({
                success: false,
                message: '表名已存在，请使用其他表名'
            });
        }

        // 更新表名
        await TableMapping.update(
            { tableName: trimmedTableName },
            { where: { hashValue: hash } }
        );

        // 获取更新后的记录
        const updatedMapping = await TableMapping.findOne({
            where: { hashValue: hash },
            attributes: ['id', 'tableName', 'hashValue', 'columnDefinitions', 'createdAt', 'updatedAt']
        });

        res.json({
            success: true,
            message: '表名更新成功',
            data: updatedMapping
        });

    } catch (error) {
        console.error('更新表名错误:', error);
        res.status(500).json({
            success: false,
            message: `更新表名失败: ${error.message}`
        });
    }
};

module.exports = {
    updateTableName
};

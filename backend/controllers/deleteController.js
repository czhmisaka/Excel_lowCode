/*
 * @Date: 2025-09-28 02:33:00
 * @LastEditors: CZH
 * @LastEditTime: 2025-09-28 02:38:57
 * @FilePath: /backend/controllers/deleteController.js
 */
const { TableMapping, dropDynamicTable } = require('../models');

/**
 * 删除映射关系控制器
 */
const deleteMapping = async (req, res) => {
    const { hash } = req.params;

    // 验证哈希值格式（MD5哈希长度为32）
    if (!hash || typeof hash !== 'string' || hash.length !== 32) {
        return res.status(400).json({
            success: false,
            message: '无效的哈希值格式'
        });
    }

    let transaction;

    try {
        // 开启事务
        transaction = await TableMapping.sequelize.transaction();

        // 查找映射关系
        const mapping = await TableMapping.findOne({
            where: { hashValue: hash },
            transaction
        });

        if (!mapping) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: '映射关系不存在'
            });
        }

        // 记录映射信息用于返回
        const mappingInfo = {
            id: mapping.id,
            tableName: mapping.tableName,
            hashValue: mapping.hashValue,
            originalFileName: mapping.originalFileName
        };

        // 删除动态数据表
        const tableDropped = await dropDynamicTable(hash);

        // 删除映射关系记录
        await TableMapping.destroy({
            where: { hashValue: hash },
            transaction
        });

        // 提交事务
        await transaction.commit();

        res.json({
            success: true,
            message: '映射关系删除成功',
            data: {
                ...mappingInfo,
                tableDropped: tableDropped,
                deletedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        // 回滚事务
        if (transaction) {
            await transaction.rollback();
        }

        console.error('删除映射关系失败:', error);
        res.status(500).json({
            success: false,
            message: '删除映射关系失败',
            error: error.message
        });
    }
};

module.exports = {
    deleteMapping
};

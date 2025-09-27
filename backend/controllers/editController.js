const { TableMapping, getDynamicModel } = require('../models');
const { validateHash } = require('../utils/hashGenerator');

/**
 * 更新数据
 */
const updateData = async (req, res) => {
    try {
        const { hash } = req.params;
        const { conditions, updates } = req.body;

        // 验证哈希值
        if (!validateHash(hash)) {
            return res.status(400).json({
                success: false,
                message: '无效的哈希值格式'
            });
        }

        // 检查映射关系是否存在
        const mapping = await TableMapping.findOne({
            where: { hashValue: hash }
        });

        if (!mapping) {
            return res.status(404).json({
                success: false,
                message: '未找到对应的数据表'
            });
        }

        // 验证请求参数
        if (!conditions || typeof conditions !== 'object') {
            return res.status(400).json({
                success: false,
                message: '必须提供有效的查询条件'
            });
        }

        if (!updates || typeof updates !== 'object') {
            return res.status(400).json({
                success: false,
                message: '必须提供有效的更新数据'
            });
        }

        // 获取动态表模型
        const DynamicModel = getDynamicModel(hash, mapping.columnDefinitions);

        // 执行更新操作
        const [affectedRows] = await DynamicModel.update(updates, {
            where: conditions
        });

        res.json({
            success: true,
            message: '数据更新成功',
            affectedRows: affectedRows
        });

    } catch (error) {
        console.error('更新数据错误:', error);
        res.status(500).json({
            success: false,
            message: `更新数据失败: ${error.message}`
        });
    }
};

/**
 * 新增数据
 */
const addData = async (req, res) => {
    try {
        const { hash } = req.params;
        const { updates } = req.body;

        // 验证哈希值
        if (!validateHash(hash)) {
            return res.status(400).json({
                success: false,
                message: '无效的哈希值格式'
            });
        }

        // 检查映射关系是否存在
        const mapping = await TableMapping.findOne({
            where: { hashValue: hash }
        });

        if (!mapping) {
            return res.status(404).json({
                success: false,
                message: '未找到对应的数据表'
            });
        }

        // 验证请求参数
        if (!updates || typeof updates !== 'object') {
            return res.status(400).json({
                success: false,
                message: '必须提供有效的新增数据'
            });
        }

        // 获取动态表模型
        const DynamicModel = getDynamicModel(hash, mapping.columnDefinitions);

        // 执行新增操作
        const newRecord = await DynamicModel.create(updates);

        res.json({
            success: true,
            message: '数据新增成功',
            data: newRecord
        });

    } catch (error) {
        console.error('新增数据错误:', error);
        res.status(500).json({
            success: false,
            message: `新增数据失败: ${error.message}`
        });
    }
};

/**
 * 删除数据
 */
const deleteData = async (req, res) => {
    try {
        const { hash } = req.params;
        const { conditions } = req.body;

        // 验证哈希值
        if (!validateHash(hash)) {
            return res.status(400).json({
                success: false,
                message: '无效的哈希值格式'
            });
        }

        // 检查映射关系是否存在
        const mapping = await TableMapping.findOne({
            where: { hashValue: hash }
        });

        if (!mapping) {
            return res.status(404).json({
                success: false,
                message: '未找到对应的数据表'
            });
        }

        // 验证请求参数
        if (!conditions || typeof conditions !== 'object') {
            return res.status(400).json({
                success: false,
                message: '必须提供有效的删除条件'
            });
        }

        // 获取动态表模型
        const DynamicModel = getDynamicModel(hash, mapping.columnDefinitions);

        // 执行删除操作
        const affectedRows = await DynamicModel.destroy({
            where: conditions
        });

        res.json({
            success: true,
            message: '数据删除成功',
            affectedRows: affectedRows
        });

    } catch (error) {
        console.error('删除数据错误:', error);
        res.status(500).json({
            success: false,
            message: `删除数据失败: ${error.message}`
        });
    }
};

module.exports = {
    updateData,
    addData,
    deleteData
};

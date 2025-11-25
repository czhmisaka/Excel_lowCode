const { TableMapping, getDynamicModel } = require('../models');
const { validateHash } = require('../utils/hashGenerator');
const OperationLogger = require('../utils/logger');
const cacheService = require('../utils/cacheService');

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

        // 查找要更新的记录（用于日志记录）
        const recordsToUpdate = await DynamicModel.findAll({
            where: conditions
        });

        if (recordsToUpdate.length === 0) {
            return res.status(404).json({
                success: false,
                message: '未找到匹配的记录'
            });
        }

        // 执行更新操作
        const [affectedRows] = await DynamicModel.update(updates, {
            where: conditions
        });

        // 记录操作日志
        const userInfo = OperationLogger.extractUserInfo(req);
        const clientInfo = OperationLogger.extractClientInfo(req);

        // 为 MCP 操作添加专门的描述
        const isMCP = userInfo.isMCP;
        const operationSource = isMCP ? 'MCP Server' : '用户';

        for (const record of recordsToUpdate) {
            const updatedRecord = await DynamicModel.findOne({
                where: { id: record.id }
            });

            await OperationLogger.logUpdate({
                tableName: mapping.tableName,
                tableHash: hash,
                recordId: record.id,
                oldData: record.toJSON(),
                newData: updatedRecord.toJSON(),
                description: `${operationSource} 更新记录 #${record.id}`,
                user: userInfo,
                ipAddress: clientInfo.ipAddress,
                userAgent: clientInfo.userAgent
            });
        }

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
        const { data } = req.body;

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
        if (!data || typeof data !== 'object') {
            return res.status(400).json({
                success: false,
                message: '必须提供有效的新增数据'
            });
        }

        // 获取动态表模型
        const DynamicModel = getDynamicModel(hash, mapping.columnDefinitions);

        // 执行新增操作
        const newRecord = await DynamicModel.create(data);

        // 更新 TableMapping 表的 rowCount 字段
        const currentRowCount = await DynamicModel.count();
        await TableMapping.update(
            { rowCount: currentRowCount },
            { where: { hashValue: hash } }
        );

        // 清除表相关的缓存
        await cacheService.clearTableCache(hash);

        // 记录操作日志
        const userInfo = OperationLogger.extractUserInfo(req);
        const clientInfo = OperationLogger.extractClientInfo(req);

        // 为 MCP 操作添加专门的描述
        const isMCP = userInfo.isMCP;
        const operationSource = isMCP ? 'MCP Server' : '用户';

        await OperationLogger.logCreate({
            tableName: mapping.tableName,
            tableHash: hash,
            recordId: newRecord.id,
            oldData: null,
            newData: newRecord.toJSON(),
            description: `${operationSource} 新增记录 #${newRecord.id}`,
            user: userInfo,
            ipAddress: clientInfo.ipAddress,
            userAgent: clientInfo.userAgent
        });

        res.json({
            success: true,
            message: '数据新增成功',
            data: newRecord,
            updatedRowCount: currentRowCount
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

        // 查找要删除的记录（用于日志记录）
        const recordsToDelete = await DynamicModel.findAll({
            where: conditions
        });

        if (recordsToDelete.length === 0) {
            return res.status(404).json({
                success: false,
                message: '未找到匹配的记录'
            });
        }

        // 执行删除操作
        const affectedRows = await DynamicModel.destroy({
            where: conditions
        });

        // 更新 TableMapping 表的 rowCount 字段
        const currentRowCount = await DynamicModel.count();
        await TableMapping.update(
            { rowCount: currentRowCount },
            { where: { hashValue: hash } }
        );

        // 清除表相关的缓存
        await cacheService.clearTableCache(hash);

        // 记录操作日志
        const userInfo = OperationLogger.extractUserInfo(req);
        const clientInfo = OperationLogger.extractClientInfo(req);

        // 为 MCP 操作添加专门的描述
        const isMCP = userInfo.isMCP;
        const operationSource = isMCP ? 'MCP Server' : '用户';

        for (const record of recordsToDelete) {
            await OperationLogger.logDelete({
                tableName: mapping.tableName,
                tableHash: hash,
                recordId: record.id,
                oldData: record.toJSON(),
                newData: null,
                description: `${operationSource} 删除记录 #${record.id}`,
                user: userInfo,
                ipAddress: clientInfo.ipAddress,
                userAgent: clientInfo.userAgent
            });
        }

        res.json({
            success: true,
            message: '数据删除成功',
            affectedRows: affectedRows,
            updatedRowCount: currentRowCount
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

const { TableMapping, getDynamicModel, TableLog } = require('../models');
const OperationLogger = require('../utils/logger');

/**
 * 回退控制器
 * 用于实现数据操作的回退功能
 */
class RollbackController {
    /**
     * 获取操作日志列表
     */
    static async getOperationLogs(req, res) {
        try {
            const {
                tableName,
                tableHash,
                recordId,
                operationType,
                isRolledBack,
                page = 1,
                limit = 20
            } = req.query;

            // 构建查询选项
            const options = {
                tableName,
                tableHash,
                recordId: recordId ? parseInt(recordId) : undefined,
                operationType,
                isRolledBack,
                page: parseInt(page),
                limit: parseInt(limit)
            };

            // 获取日志列表
            const result = await OperationLogger.getLogs(options);

            res.json({
                success: true,
                message: '获取操作日志成功',
                data: result
            });

        } catch (error) {
            console.error('获取操作日志失败:', error);
            res.status(500).json({
                success: false,
                message: `获取操作日志失败: ${error.message}`
            });
        }
    }

    /**
     * 获取单个日志详情
     */
    static async getLogDetail(req, res) {
        try {
            const { logId } = req.params;

            if (!logId) {
                return res.status(400).json({
                    success: false,
                    message: '必须提供日志ID'
                });
            }

            // 获取日志详情
            const log = await OperationLogger.getLogDetail(parseInt(logId));

            res.json({
                success: true,
                message: '获取日志详情成功',
                data: log
            });

        } catch (error) {
            console.error('获取日志详情失败:', error);
            if (error.message === '日志记录不存在') {
                return res.status(404).json({
                    success: false,
                    message: '日志记录不存在'
                });
            }
            res.status(500).json({
                success: false,
                message: `获取日志详情失败: ${error.message}`
            });
        }
    }

    /**
     * 回退操作
     */
    static async rollbackOperation(req, res) {
        try {
            const { logId } = req.params;
            const { description } = req.body;

            if (!logId) {
                return res.status(400).json({
                    success: false,
                    message: '必须提供日志ID'
                });
            }

            // 获取日志记录
            const log = await OperationLogger.getLogDetail(parseInt(logId));

            // 检查是否已经回退
            if (log.isRolledBack) {
                return res.status(400).json({
                    success: false,
                    message: '该操作已经回退，无法再次回退'
                });
            }

            // 检查操作类型是否支持回退
            if (log.operationType === 'create') {
                const result = await this.rollbackCreateOperation(log, req, description);
                return res.json(result);
            } else if (log.operationType === 'update') {
                const result = await this.rollbackUpdateOperation(log, req, description);
                return res.json(result);
            } else if (log.operationType === 'delete') {
                const result = await this.rollbackDeleteOperation(log, req, description);
                return res.json(result);
            } else {
                return res.status(400).json({
                    success: false,
                    message: '不支持的操作类型'
                });
            }

        } catch (error) {
            console.error('回退操作失败:', error);
            if (error.message === '日志记录不存在') {
                return res.status(404).json({
                    success: false,
                    message: '日志记录不存在'
                });
            }
            res.status(500).json({
                success: false,
                message: `回退操作失败: ${error.message}`
            });
        }
    }

    /**
     * 回退创建操作（删除记录）
     */
    static async rollbackCreateOperation(log, req, description) {
        // 获取映射关系
        const mapping = await TableMapping.findOne({
            where: { hashValue: log.tableHash }
        });

        if (!mapping) {
            throw new Error('未找到对应的数据表映射');
        }

        // 获取动态表模型
        const DynamicModel = getDynamicModel(log.tableHash, mapping.columnDefinitions);

        // 检查记录是否存在
        const record = await DynamicModel.findByPk(log.recordId);
        if (!record) {
            throw new Error('要回退的记录不存在');
        }

        // 执行删除操作
        await DynamicModel.destroy({
            where: { id: log.recordId }
        });

        // 更新日志记录状态
        const userInfo = OperationLogger.extractUserInfo(req);
        const clientInfo = OperationLogger.extractClientInfo(req);

        await log.update({
            isRolledBack: true,
            rollbackTime: new Date(),
            rollbackUserId: userInfo.id,
            rollbackUsername: userInfo.username,
            rollbackDescription: description || '回退创建操作'
        });

        // 记录回退操作日志
        await OperationLogger.logDelete({
            tableName: log.tableName,
            tableHash: log.tableHash,
            recordId: log.recordId,
            oldData: record.toJSON(),
            newData: null,
            description: `回退创建操作 #${log.id}`,
            user: userInfo,
            ipAddress: clientInfo.ipAddress,
            userAgent: clientInfo.userAgent
        });

        return {
            success: true,
            message: '创建操作回退成功',
            data: {
                logId: log.id,
                operationType: log.operationType,
                recordId: log.recordId
            }
        };
    }

    /**
     * 回退更新操作（恢复旧数据）
     */
    static async rollbackUpdateOperation(log, req, description) {
        // 获取映射关系
        const mapping = await TableMapping.findOne({
            where: { hashValue: log.tableHash }
        });

        if (!mapping) {
            throw new Error('未找到对应的数据表映射');
        }

        // 获取动态表模型
        const DynamicModel = getDynamicModel(log.tableHash, mapping.columnDefinitions);

        // 检查记录是否存在
        const currentRecord = await DynamicModel.findByPk(log.recordId);
        if (!currentRecord) {
            throw new Error('要回退的记录不存在');
        }

        // 解析旧数据
        const oldData = JSON.parse(log.oldData);

        // 执行更新操作，恢复旧数据
        await DynamicModel.update(oldData, {
            where: { id: log.recordId }
        });

        // 获取更新后的记录
        const restoredRecord = await DynamicModel.findByPk(log.recordId);

        // 更新日志记录状态
        const userInfo = OperationLogger.extractUserInfo(req);
        const clientInfo = OperationLogger.extractClientInfo(req);

        await log.update({
            isRolledBack: true,
            rollbackTime: new Date(),
            rollbackUserId: userInfo.id,
            rollbackUsername: userInfo.username,
            rollbackDescription: description || '回退更新操作'
        });

        // 记录回退操作日志
        await OperationLogger.logUpdate({
            tableName: log.tableName,
            tableHash: log.tableHash,
            recordId: log.recordId,
            oldData: currentRecord.toJSON(),
            newData: restoredRecord.toJSON(),
            description: `回退更新操作 #${log.id}`,
            user: userInfo,
            ipAddress: clientInfo.ipAddress,
            userAgent: clientInfo.userAgent
        });

        return {
            success: true,
            message: '更新操作回退成功',
            data: {
                logId: log.id,
                operationType: log.operationType,
                recordId: log.recordId
            }
        };
    }

    /**
     * 回退删除操作（恢复记录）
     */
    static async rollbackDeleteOperation(log, req, description) {
        // 获取映射关系
        const mapping = await TableMapping.findOne({
            where: { hashValue: log.tableHash }
        });

        if (!mapping) {
            throw new Error('未找到对应的数据表映射');
        }

        // 获取动态表模型
        const DynamicModel = getDynamicModel(log.tableHash, mapping.columnDefinitions);

        // 解析旧数据
        const oldData = JSON.parse(log.oldData);

        // 执行创建操作，恢复记录
        const restoredRecord = await DynamicModel.create(oldData);

        // 更新日志记录状态
        const userInfo = OperationLogger.extractUserInfo(req);
        const clientInfo = OperationLogger.extractClientInfo(req);

        await log.update({
            isRolledBack: true,
            rollbackTime: new Date(),
            rollbackUserId: userInfo.id,
            rollbackUsername: userInfo.username,
            rollbackDescription: description || '回退删除操作'
        });

        // 记录回退操作日志
        await OperationLogger.logCreate({
            tableName: log.tableName,
            tableHash: log.tableHash,
            recordId: restoredRecord.id,
            oldData: null,
            newData: restoredRecord.toJSON(),
            description: `回退删除操作 #${log.id}`,
            user: userInfo,
            ipAddress: clientInfo.ipAddress,
            userAgent: clientInfo.userAgent
        });

        return {
            success: true,
            message: '删除操作回退成功',
            data: {
                logId: log.id,
                operationType: log.operationType,
                recordId: restoredRecord.id
            }
        };
    }

    /**
     * 批量回退操作
     */
    static async batchRollback(req, res) {
        try {
            const { logIds, description } = req.body;

            if (!logIds || !Array.isArray(logIds) || logIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: '必须提供有效的日志ID列表'
                });
            }

            const results = [];
            const errors = [];

            // 逐个回退操作
            for (const logId of logIds) {
                try {
                    const result = await this.rollbackOperationById(logId, req, description);
                    results.push({
                        logId,
                        success: true,
                        data: result
                    });
                } catch (error) {
                    errors.push({
                        logId,
                        success: false,
                        error: error.message
                    });
                }
            }

            res.json({
                success: true,
                message: `批量回退完成，成功: ${results.length}，失败: ${errors.length}`,
                data: {
                    results,
                    errors
                }
            });

        } catch (error) {
            console.error('批量回退失败:', error);
            res.status(500).json({
                success: false,
                message: `批量回退失败: ${error.message}`
            });
        }
    }

    /**
     * 根据ID回退单个操作（内部方法）
     */
    static async rollbackOperationById(logId, req, description) {
        const log = await OperationLogger.getLogDetail(parseInt(logId));

        if (log.isRolledBack) {
            throw new Error('该操作已经回退，无法再次回退');
        }

        if (log.operationType === 'create') {
            return await this.rollbackCreateOperation(log, req, description);
        } else if (log.operationType === 'update') {
            return await this.rollbackUpdateOperation(log, req, description);
        } else if (log.operationType === 'delete') {
            return await this.rollbackDeleteOperation(log, req, description);
        } else {
            throw new Error('不支持的操作类型');
        }
    }
}

module.exports = RollbackController;

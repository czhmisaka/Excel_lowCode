const { sequelize } = require('../config/database');
const TableLogModel = require('../models/TableLog');
const crypto = require('crypto');

// 初始化日志表模型
const TableLog = TableLogModel(sequelize);

/**
 * 日志记录工具类
 * 用于记录所有数据操作的历史记录
 */
class OperationLogger {
    /**
     * 记录操作日志
     * @param {Object} options 日志选项
     * @param {string} options.operationType 操作类型: create, update, delete
     * @param {string} options.tableName 表名
     * @param {string} options.tableHash 表哈希值
     * @param {number} options.recordId 记录ID
     * @param {Object} options.oldData 操作前的数据
     * @param {Object} options.newData 操作后的数据
     * @param {string} options.description 操作描述
     * @param {Object} options.user 操作用户信息
     * @param {string} options.ipAddress IP地址
     * @param {string} options.userAgent 用户代理
     * @returns {Promise<Object>} 创建的日志记录
     */
    static async logOperation(options) {
        try {
            const {
                operationType,
                tableName,
                tableHash,
                recordId,
                oldData,
                newData,
                description,
                user,
                ipAddress,
                userAgent
            } = options;

            // 验证必需参数
            if (!operationType || !tableName || !tableHash || !recordId || !user) {
                throw new Error('缺少必需的日志参数');
            }

            // 创建日志记录
            const logRecord = await TableLog.create({
                operationType,
                tableName,
                tableHash,
                recordId,
                oldData: oldData ? JSON.stringify(oldData) : null,
                newData: newData ? JSON.stringify(newData) : null,
                description,
                userId: user.id,
                username: user.username,
                operationTime: new Date(),
                ipAddress,
                userAgent
            });

            console.log(`✅ 操作日志记录成功: ${operationType} ${tableName}#${recordId}`);
            return logRecord;
        } catch (error) {
            console.error('❌ 记录操作日志失败:', error);
            // 不抛出错误，避免影响主业务流程
            return null;
        }
    }

    /**
     * 记录创建操作
     * @param {Object} options 日志选项
     * @returns {Promise<Object>} 创建的日志记录
     */
    static async logCreate(options) {
        return this.logOperation({
            ...options,
            operationType: 'create'
        });
    }

    /**
     * 记录更新操作
     * @param {Object} options 日志选项
     * @returns {Promise<Object>} 创建的日志记录
     */
    static async logUpdate(options) {
        return this.logOperation({
            ...options,
            operationType: 'update'
        });
    }

    /**
     * 记录删除操作
     * @param {Object} options 日志选项
     * @returns {Promise<Object>} 创建的日志记录
     */
    static async logDelete(options) {
        return this.logOperation({
            ...options,
            operationType: 'delete'
        });
    }

    /**
     * 获取操作日志列表
     * @param {Object} options 查询选项
     * @param {string} options.tableName 表名（可选）
     * @param {string} options.tableHash 表哈希值（可选）
     * @param {number} options.recordId 记录ID（可选）
     * @param {string} options.operationType 操作类型（可选）
     * @param {number} options.userId 用户ID（可选）
     * @param {boolean} options.isRolledBack 是否已回退（可选）
     * @param {number} options.page 页码
     * @param {number} options.limit 每页数量
     * @returns {Promise<Object>} 日志列表和分页信息
     */
    static async getLogs(options = {}) {
        try {
            const {
                tableName,
                tableHash,
                recordId,
                operationType,
                userId,
                isRolledBack,
                page = 1,
                limit = 20
            } = options;

            // 构建查询条件
            const where = {};
            if (tableName) where.tableName = tableName;
            if (tableHash) where.tableHash = tableHash;
            if (recordId) where.recordId = recordId;
            if (operationType) where.operationType = operationType;
            if (userId) where.userId = userId;
            if (isRolledBack !== undefined) {
                // 处理布尔值参数
                where.isRolledBack = isRolledBack === 'true' || isRolledBack === true;
            }

            // 计算偏移量
            const offset = (page - 1) * limit;

            // 查询日志记录
            const { count, rows } = await TableLog.findAndCountAll({
                where,
                order: [['operationTime', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            return {
                logs: rows,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(count / limit)
                }
            };
        } catch (error) {
            console.error('❌ 获取操作日志失败:', error);
            throw error;
        }
    }

    /**
     * 获取单个日志记录详情
     * @param {number} logId 日志ID
     * @returns {Promise<Object>} 日志记录详情
     */
    static async getLogDetail(logId) {
        try {
            const log = await TableLog.findByPk(logId);
            if (!log) {
                throw new Error('日志记录不存在');
            }
            return log;
        } catch (error) {
            console.error('❌ 获取日志详情失败:', error);
            throw error;
        }
    }

    /**
     * 生成表哈希值
     * @param {string} tableName 表名
     * @param {Array} columnDefinitions 列定义
     * @returns {string} 哈希值
     */
    static generateTableHash(tableName, columnDefinitions) {
        const content = `${tableName}:${JSON.stringify(columnDefinitions)}`;
        return crypto.createHash('md5').update(content).digest('hex');
    }

    /**
     * 从请求中提取用户信息
     * @param {Object} req 请求对象
     * @returns {Object} 用户信息
     */
    static extractUserInfo(req) {
        // 检查是否为 API 密钥认证的 MCP 服务账户
        if (req.user?.isApiKeyAuth) {
            return {
                id: req.user.id,
                username: req.user.username,
                displayName: req.user.displayName,
                isMCP: true
            };
        }

        // 普通用户认证
        return {
            id: req.user?.id,
            username: req.user?.username,
            displayName: req.user?.displayName,
            isMCP: false
        };
    }

    /**
     * 从请求中提取客户端信息
     * @param {Object} req 请求对象
     * @returns {Object} 客户端信息
     */
    static extractClientInfo(req) {
        let ipAddress = 'unknown';

        // 多种方式获取IP地址
        if (req.ip) {
            ipAddress = req.ip;
        } else if (req.connection && req.connection.remoteAddress) {
            ipAddress = req.connection.remoteAddress;
        } else if (req.socket && req.socket.remoteAddress) {
            ipAddress = req.socket.remoteAddress;
        } else if (req.headers['x-forwarded-for']) {
            ipAddress = req.headers['x-forwarded-for'].split(',')[0].trim();
        } else if (req.headers['x-real-ip']) {
            ipAddress = req.headers['x-real-ip'];
        }

        return {
            ipAddress: ipAddress,
            userAgent: req.get ? req.get('User-Agent') : (req.headers ? req.headers['user-agent'] : 'unknown')
        };
    }
}

module.exports = OperationLogger;

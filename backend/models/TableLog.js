const { DataTypes } = require('sequelize');

/**
 * 日志表模型
 * 用于记录所有数据操作的历史记录
 */
const TableLog = (sequelize) => {
    return sequelize.define('TableLog', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        // 操作类型：create, update, delete
        operationType: {
            type: DataTypes.ENUM('create', 'update', 'delete'),
            allowNull: false
        },
        // 操作的表名
        tableName: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        // 表哈希值
        tableHash: {
            type: DataTypes.STRING(64),
            allowNull: false
        },
        // 操作的数据ID
        recordId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        // 操作前的数据（JSON格式）
        oldData: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        // 操作后的数据（JSON格式）
        newData: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        // 操作描述
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        // 操作用户ID
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        // 操作用户名
        username: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        // 操作时间
        operationTime: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        // 是否已回退
        isRolledBack: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        // 回退时间
        rollbackTime: {
            type: DataTypes.DATE,
            allowNull: true
        },
        // 回退操作用户ID
        rollbackUserId: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        // 回退操作用户名
        rollbackUsername: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        // 回退描述
        rollbackDescription: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        // IP地址
        ipAddress: {
            type: DataTypes.STRING(45),
            allowNull: true
        },
        // 用户代理
        userAgent: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'table_logs',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                name: 'table_logs_operation_type',
                fields: ['operation_type']
            },
            {
                name: 'table_logs_table_name',
                fields: ['table_name']
            },
            {
                name: 'table_logs_table_hash',
                fields: ['table_hash']
            },
            {
                name: 'table_logs_record_id',
                fields: ['record_id']
            },
            {
                name: 'table_logs_user_id',
                fields: ['user_id']
            },
            {
                name: 'table_logs_operation_time',
                fields: ['operation_time']
            },
            {
                name: 'table_logs_is_rolled_back',
                fields: ['is_rolled_back']
            }
        ]
    });
};

module.exports = TableLog;

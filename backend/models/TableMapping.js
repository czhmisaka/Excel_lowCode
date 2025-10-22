/*
 * @Date: 2025-09-27 23:16:41
 * @LastEditors: CZH
 * @LastEditTime: 2025-10-22 10:51:30
 * @FilePath: /lowCode_excel/backend/models/TableMapping.js
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TableMapping = sequelize.define('TableMapping', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'id'
    },
    tableName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: '原始表名',
        field: 'table_name'
    },
    hashValue: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
        comment: '哈希值(SHA256)',
        field: 'hash_value'
    },
    originalFileName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: '原始文件名',
        field: 'original_file_name'
    },
    columnCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '列数',
        field: 'column_count'
    },
    rowCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '行数',
        field: 'row_count'
    },
    headerRow: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '表头行号（从0开始）',
        field: 'header_row'
    },
    columnDefinitions: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: '列定义信息',
        field: 'column_definitions'
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at'
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'updated_at'
    }
}, {
    tableName: 'table_mappings',
    timestamps: true,
    underscored: true, // 启用下划线命名
    indexes: [
        {
            unique: true,
            fields: ['hash_value']
        },
        {
            fields: ['table_name']
        },
        {
            fields: ['created_at']
        }
    ]
});

module.exports = TableMapping;

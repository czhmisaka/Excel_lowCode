/*
 * @Date: 2025-09-27 23:17:13
 * @LastEditors: CZH
 * @LastEditTime: 2025-09-28 02:33:14
 * @FilePath: /backend/models/index.js
 */
const { sequelize } = require('../config/database');
const TableMapping = require('./TableMapping');

// 初始化所有模型
const initModels = async () => {
    try {
        // 同步数据库表
        await sequelize.sync({ force: false });
        console.log('数据库表同步成功');

        return {
            TableMapping
        };
    } catch (error) {
        console.error('数据库表同步失败:', error);
        throw error;
    }
};

// 获取动态表模型
const getDynamicModel = (hashValue, columnDefinitions) => {
    const { DataTypes } = require('sequelize');

    console.log('创建动态模型，哈希值:', hashValue);
    console.log('列定义:', JSON.stringify(columnDefinitions, null, 2));

    // 确保columnDefinitions是数组格式
    let columnDefs = columnDefinitions;
    if (typeof columnDefs === 'string') {
        try {
            columnDefs = JSON.parse(columnDefs);
        } catch (error) {
            console.error('解析columnDefinitions失败:', error);
            columnDefs = [];
        }
    }

    // 根据列定义创建模型属性
    const attributes = {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        }
    };

    // 添加动态列
    if (columnDefs && Array.isArray(columnDefs)) {
        columnDefs.forEach(column => {
            let dataType = DataTypes.STRING; // 默认字符串类型

            // 根据列类型推断数据类型
            if (column.type === 'number') {
                dataType = DataTypes.FLOAT;
            } else if (column.type === 'date') {
                dataType = DataTypes.DATE;
            } else if (column.type === 'boolean') {
                dataType = DataTypes.BOOLEAN;
            }

            // 使用原始字段名，不进行任何转换
            const fieldName = column.name;

            attributes[fieldName] = {
                type: dataType,
                allowNull: true,
                comment: column.originalName || column.name,
                field: fieldName // 明确指定数据库字段名
            };
        });
    }

    console.log('模型属性:', JSON.stringify(Object.keys(attributes), null, 2));

    // 创建动态模型
    const DynamicModel = sequelize.define(`Data_${hashValue}`, attributes, {
        tableName: `data_${hashValue}`,
        timestamps: false, // 禁用时间戳，因为现有表没有这些字段
        underscored: false, // 禁用下划线命名，直接使用原始字段名
        freezeTableName: true // 防止Sequelize自动修改表名
    });

    return DynamicModel;
};

// 删除动态表
const dropDynamicTable = async (hashValue) => {
    try {
        const tableName = `data_${hashValue}`;

        // 检查表是否存在
        const [results] = await sequelize.query(
            `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
            {
                replacements: [sequelize.config.database, tableName],
                type: sequelize.QueryTypes.SELECT
            }
        );

        if (results) {
            // 表存在，执行删除
            await sequelize.query(`DROP TABLE \`${tableName}\``);
            console.log(`动态表 ${tableName} 删除成功`);
            return true;
        } else {
            console.log(`动态表 ${tableName} 不存在，无需删除`);
            return false;
        }
    } catch (error) {
        console.error(`删除动态表失败 (hash: ${hashValue}):`, error);
        throw error;
    }
};

module.exports = {
    initModels,
    TableMapping,
    getDynamicModel,
    dropDynamicTable
};

/*
 * @Date: 2025-09-27 23:17:13
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-26 00:08:08
 * @FilePath: /lowCode_excel/backend/models/index.js
 */
const { sequelize } = require('../config/database');
const TableMapping = require('./TableMapping');
const User = require('./User');
const TableLog = require('./TableLog');
const FormDefinition = require('./FormDefinition');
const FormHook = require('./FormHook');
const FormSubmission = require('./FormSubmission');

// 初始化 TableLog 模型
const TableLogModel = TableLog(sequelize);

// 检查数据完整性
const checkDataIntegrity = async () => {
    try {
        console.log('开始检查数据完整性...');
        
        // 检查 form_definitions 表的数据完整性
        const formDefinitions = await FormDefinition.findAll();
        console.log(`form_definitions 表共有 ${formDefinitions.length} 条记录`);
        
        // 检查 form_id 的唯一性和有效性
        const formIds = formDefinitions.map(fd => fd.formId);
        const uniqueFormIds = [...new Set(formIds)];
        
        if (formIds.length !== uniqueFormIds.length) {
            console.warn('⚠️ 发现重复的 form_id，需要清理数据');
            return false;
        }
        
        const nullFormIds = formDefinitions.filter(fd => !fd.formId || fd.formId.trim() === '');
        if (nullFormIds.length > 0) {
            console.warn(`⚠️ 发现 ${nullFormIds.length} 条记录的 form_id 为空或无效`);
            return false;
        }
        
        console.log('✅ 数据完整性检查通过');
        return true;
    } catch (error) {
        console.error('数据完整性检查失败:', error);
        return false;
    }
};

// 清理问题数据
const cleanupProblematicData = async () => {
    try {
        console.log('开始清理问题数据...');
        
        // 删除 form_id 为 null 或空的记录
        const deletedNullFormIds = await FormDefinition.destroy({
            where: {
                formId: {
                    [sequelize.Op.or]: [
                        null,
                        '',
                        sequelize.where(sequelize.fn('TRIM', sequelize.col('form_id')), '')
                    ]
                }
            }
        });
        
        if (deletedNullFormIds > 0) {
            console.log(`✅ 已删除 ${deletedNullFormIds} 条 form_id 为空的记录`);
        }
        
        // 删除重复的 form_id 记录（保留最新的）
        const duplicates = await FormDefinition.findAll({
            attributes: [
                'formId',
                [sequelize.fn('COUNT', sequelize.col('form_id')), 'count']
            ],
            group: ['formId'],
            having: sequelize.where(sequelize.fn('COUNT', sequelize.col('form_id')), '>', 1)
        });
        
        let totalDuplicatesDeleted = 0;
        for (const dup of duplicates) {
            const records = await FormDefinition.findAll({
                where: { formId: dup.formId },
                order: [['created_at', 'ASC']]
            });
            
            // 保留最新的记录，删除其他重复记录
            const recordsToDelete = records.slice(0, -1);
            for (const record of recordsToDelete) {
                await record.destroy();
                totalDuplicatesDeleted++;
            }
        }
        
        if (totalDuplicatesDeleted > 0) {
            console.log(`✅ 已删除 ${totalDuplicatesDeleted} 条重复的 form_id 记录`);
        }
        
        console.log('✅ 数据清理完成');
        return true;
    } catch (error) {
        console.error('数据清理失败:', error);
        return false;
    }
};

// 初始化所有模型
const initModels = async () => {
    try {
        // 建立模型关联关系
        // FormDefinition 和 FormHook 的一对多关系
        FormDefinition.hasMany(FormHook, {
            foreignKey: 'form_id',
            sourceKey: 'formId',
            as: 'hooks'
        });
        
        FormHook.belongsTo(FormDefinition, {
            foreignKey: 'form_id',
            targetKey: 'formId',
            as: 'form'
        });

        // 先检查数据完整性
        const isDataValid = await checkDataIntegrity();
        
        if (!isDataValid) {
            console.log('发现数据问题，正在自动清理...');
            await cleanupProblematicData();
            console.log('数据清理完成，重新检查数据完整性...');
            await checkDataIntegrity();
        }

        // 安全同步数据库表 - 对于SQLite，避免使用alter选项
        const syncOptions = {
            force: false,        // 不强制重建表
            alter: false         // 在SQLite中禁用alter，避免表结构修改问题
        };
        
        // 同步所有表，包括 TableLog
        await TableMapping.sync(syncOptions);
        await User.sync(syncOptions);
        await TableLogModel.sync(syncOptions);
        await FormHook.sync(syncOptions);
        await FormSubmission.sync(syncOptions);
        
        console.log('数据库表同步成功');

        return {
            TableMapping,
            User,
            TableLog: TableLogModel,
            FormDefinition,
            FormHook,
            FormSubmission
        };
    } catch (error) {
        console.error('数据库表同步失败:', error);
        
        // 如果是唯一性约束错误，提供更详细的错误信息
        if (error.name === 'SequelizeUniqueConstraintError') {
            console.error('唯一性约束错误详情:');
            console.error('- 字段:', error.fields);
            console.error('- 值:', error.parent?.sql);
            console.error('建议运行数据清理脚本来修复问题数据');
        }
        
        // 如果是SQLite表结构修改错误，忽略并继续
        if (error.name === 'SequelizeDatabaseError' && 
            error.message && error.message.includes('SQLITE_ERROR')) {
            console.warn('⚠️ SQLite表结构修改失败，但系统可以继续运行');
            console.warn('这通常是因为表已经存在且结构正确');
            
            // 返回模型，让系统继续运行
            return {
                TableMapping,
                User,
                TableLog: TableLogModel,
                FormDefinition,
                FormHook,
                FormSubmission
            };
        }
        
        throw error;
    }
};

// 获取动态表模型
const getDynamicModel = (hashValue, columnDefinitions, tableName) => {
    const { DataTypes } = require('sequelize');

    console.log('创建动态模型，哈希值:', hashValue);
    console.log('表名:', tableName);
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
    const attributes = {};

    // 检查是否有 id 列，如果有则标记为主键
    let hasIdColumn = false;
    let idColumnName = null;

    // 对于现有的表，不自动添加id列，使用表已有的结构
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

            // 检查是否是 id 列
            if (fieldName === 'id') {
                hasIdColumn = true;
                idColumnName = fieldName;
            }

            attributes[fieldName] = {
                type: dataType,
                allowNull: column.nullable !== false,
                comment: column.originalName || column.name,
                field: fieldName // 明确指定数据库字段名
            };
        });
    }

    console.log('模型属性:', JSON.stringify(Object.keys(attributes), null, 2));
    console.log('是否有 id 列:', hasIdColumn, 'id 列名:', idColumnName);

    // 始终使用基于哈希值的表名，确保表名一致性
    const actualTableName = `data_${hashValue}`;

    // 准备模型选项
    const modelOptions = {
        tableName: actualTableName,
        timestamps: false, // 禁用时间戳，因为现有表没有这些字段
        underscored: false, // 禁用下划线命名，直接使用原始字段名
        freezeTableName: true, // 防止Sequelize自动修改表名
        // 明确禁用 Sequelize 的自动主键检测，避免冲突
        id: false
    };

    // 如果有 id 列，在属性中明确标记为主键
    if (hasIdColumn && attributes[idColumnName]) {
        console.log(`将 ${idColumnName} 列标记为主键`);
        attributes[idColumnName].primaryKey = true;
        attributes[idColumnName].autoIncrement = true;
    }

    // 创建动态模型
    const DynamicModel = sequelize.define(`Data_${hashValue}`, attributes, modelOptions);

    return DynamicModel;
};

// 删除动态表
const dropDynamicTable = async (hashValue) => {
    try {
        const tableName = `data_${hashValue}`;
        const dialect = sequelize.getDialect();

        console.log(`开始删除动态表 ${tableName} (数据库类型: ${dialect})`);

        let tableExists = false;

        // 根据数据库类型检查表是否存在
        if (dialect === 'mysql') {
            // MySQL: 使用 INFORMATION_SCHEMA.TABLES
            const [results] = await sequelize.query(
                `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
                 WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
                {
                    replacements: [sequelize.config.database, tableName],
                    type: sequelize.QueryTypes.SELECT
                }
            );
            tableExists = !!results;
        } else if (dialect === 'sqlite') {
            // SQLite: 使用 sqlite_master 表
            const [results] = await sequelize.query(
                `SELECT name FROM sqlite_master 
                 WHERE type='table' AND name = ?`,
                {
                    replacements: [tableName],
                    type: sequelize.QueryTypes.SELECT
                }
            );
            tableExists = !!results;
        } else {
            throw new Error(`不支持的数据库类型: ${dialect}`);
        }

        if (tableExists) {
            // 表存在，执行删除
            let dropQuery;
            if (dialect === 'mysql') {
                dropQuery = `DROP TABLE \`${tableName}\``;
            } else {
                dropQuery = `DROP TABLE "${tableName}"`;
            }

            await sequelize.query(dropQuery);
            console.log(`动态表 ${tableName} 删除成功`);
            return true;
        } else {
            console.log(`动态表 ${tableName} 不存在，无需删除`);
            return false;
        }
    } catch (error) {
        console.error(`删除动态表失败 (hash: ${hashValue}):`, error);

        // 如果是表不存在的错误，直接返回false而不是抛出错误
        if (error.message && (
            error.message.includes('doesn\'t exist') ||
            error.message.includes('Unknown table') ||
            error.message.includes('no such table')
        )) {
            console.log(`动态表 data_${hashValue} 不存在，无需删除`);
            return false;
        }

        throw error;
    }
};

module.exports = {
    initModels,
    TableMapping,
    User,
    TableLog,
    FormDefinition,
    FormHook,
    FormSubmission,
    getDynamicModel,
    dropDynamicTable
};

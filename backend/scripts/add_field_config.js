/*
 * 添加字段配置字段到TableMapping模型
 * @Date: 2025-10-30
 */
const { sequelize } = require('../config/database');
const TableMapping = require('../models/TableMapping');

async function addFieldConfig() {
    try {
        console.log('开始添加字段配置字段...');

        // 检查表结构
        const tableInfo = await sequelize.getQueryInterface().describeTable('table_mappings');
        console.log('当前表结构:', Object.keys(tableInfo));

        // 如果form_config字段不存在，添加它
        if (!tableInfo.form_config) {
            console.log('添加form_config字段...');
            await sequelize.getQueryInterface().addColumn('table_mappings', 'form_config', {
                type: 'JSON',
                allowNull: true,
                comment: '表单配置信息（JSON Schema格式）'
            });
            console.log('form_config字段添加成功');
        } else {
            console.log('form_config字段已存在');
        }

        console.log('字段配置更新完成');
    } catch (error) {
        console.error('添加字段配置失败:', error);
        throw error;
    }
}

// 如果是直接运行此脚本
if (require.main === module) {
    addFieldConfig()
        .then(() => {
            console.log('脚本执行完成');
            process.exit(0);
        })
        .catch(error => {
            console.error('脚本执行失败:', error);
            process.exit(1);
        });
}

module.exports = addFieldConfig;

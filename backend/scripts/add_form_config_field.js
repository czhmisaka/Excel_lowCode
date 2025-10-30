/*
 * 数据库迁移脚本 - 添加 form_config 字段到 table_mappings 表
 * @Date: 2025-10-30
 * @LastEditors: CZH
 */

const { sequelize } = require('../config/database');

async function addFormConfigField() {
    try {
        console.log('开始执行数据库迁移：添加 form_config 字段...');

        // 检查表结构
        const [results] = await sequelize.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'table_mappings' 
            AND COLUMN_NAME = 'form_config'
        `);

        if (results.length > 0) {
            console.log('form_config 字段已存在，跳过迁移');
            return;
        }

        // 添加 form_config 字段
        await sequelize.query(`
            ALTER TABLE table_mappings 
            ADD COLUMN form_config JSON NULL COMMENT '表单配置信息（JSON Schema格式）'
        `);

        console.log('✅ form_config 字段添加成功');

    } catch (error) {
        console.error('❌ 数据库迁移失败:', error.message);
        throw error;
    }
}

// 如果是直接运行此脚本
if (require.main === module) {
    addFormConfigField()
        .then(() => {
            console.log('✅ 数据库迁移完成');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ 数据库迁移失败:', error);
            process.exit(1);
        });
}


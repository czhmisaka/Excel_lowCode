/*
 * @Date: 2025-10-23 11:04:57
 * @LastEditors: CZH
 * @LastEditTime: 2025-10-23 11:05:21
 * @FilePath: /lowCode_excel/fix_database.js
 */
const { Sequelize } = require('sequelize');

// 创建数据库连接
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: '/app/data/annual_leave.db',
    logging: false
});

async function fixDatabase() {
    try {
        console.log('开始修复数据库...');

        // 检查表结构
        const [results] = await sequelize.query(`
            PRAGMA table_info(table_mappings);
        `);

        console.log('当前表结构:');
        results.forEach(col => {
            console.log(`  ${col.name} (${col.type})`);
        });

        // 检查是否已存在 header_row 字段
        const hasHeaderRow = results.some(col => col.name === 'header_row');

        if (!hasHeaderRow) {
            console.log('添加 header_row 字段...');
            await sequelize.query(`
                ALTER TABLE table_mappings ADD COLUMN header_row INTEGER DEFAULT 0;
            `);
            console.log('header_row 字段添加成功');
        } else {
            console.log('header_row 字段已存在');
        }

        // 验证修复结果
        const [updatedResults] = await sequelize.query(`
            PRAGMA table_info(table_mappings);
        `);

        console.log('修复后的表结构:');
        updatedResults.forEach(col => {
            console.log(`  ${col.name} (${col.type})`);
        });

        console.log('数据库修复完成！');

    } catch (error) {
        console.error('修复数据库时出错:', error);
    } finally {
        await sequelize.close();
    }
}

fixDatabase();

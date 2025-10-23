/*
 * @Date: 2025-10-23 11:16:00
 * @LastEditors: CZH
 * @LastEditTime: 2025-10-23 11:17:15
 * @FilePath: /lowCode_excel/fix_mysql_database.js
 * @Description: 修复远程MySQL数据库表结构 - 添加header_row字段
 */
const mysql = require('mysql2/promise');

// 数据库连接配置
const dbConfig = {
    host: '101.126.91.134',
    port: 3306,
    database: 'czhmisaka',
    user: 'czhmisaka',
    password: 'czhmisaka',
    charset: 'utf8mb4'
};

async function fixMySQLDatabase() {
    let connection;

    try {
        console.log('开始连接到远程MySQL数据库...');

        // 创建数据库连接
        connection = await mysql.createConnection(dbConfig);
        console.log('数据库连接成功！');

        // 检查表结构
        console.log('检查 table_mappings 表结构...');
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'table_mappings'
            ORDER BY ORDINAL_POSITION
        `, [dbConfig.database]);

        console.log('当前表结构:');
        columns.forEach(col => {
            console.log(`  ${col.COLUMN_NAME} (${col.DATA_TYPE}) - ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'} - 默认值: ${col.COLUMN_DEFAULT} - 注释: ${col.COLUMN_COMMENT}`);
        });

        // 检查是否已存在 header_row 字段
        const hasHeaderRow = columns.some(col => col.COLUMN_NAME === 'header_row');

        if (!hasHeaderRow) {
            console.log('添加 header_row 字段...');

            // 执行 ALTER TABLE 语句添加 header_row 字段
            await connection.execute(`
                ALTER TABLE table_mappings 
                ADD COLUMN header_row INTEGER NOT NULL DEFAULT 0 COMMENT '表头行号（从0开始）'
            `);

            console.log('header_row 字段添加成功！');
        } else {
            console.log('header_row 字段已存在，无需添加');
        }

        // 验证修复结果
        console.log('验证修复结果...');
        const [updatedColumns] = await connection.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'table_mappings'
            ORDER BY ORDINAL_POSITION
        `, [dbConfig.database]);

        console.log('修复后的表结构:');
        updatedColumns.forEach(col => {
            console.log(`  ${col.COLUMN_NAME} (${col.DATA_TYPE}) - ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'} - 默认值: ${col.COLUMN_DEFAULT} - 注释: ${col.COLUMN_COMMENT}`);
        });

        // 检查 header_row 字段是否成功添加
        const headerRowColumn = updatedColumns.find(col => col.COLUMN_NAME === 'header_row');
        if (headerRowColumn) {
            console.log('✅ header_row 字段修复成功！');
            console.log(`   字段类型: ${headerRowColumn.DATA_TYPE}`);
            console.log(`   是否可为空: ${headerRowColumn.IS_NULLABLE}`);
            console.log(`   默认值: ${headerRowColumn.COLUMN_DEFAULT}`);
            console.log(`   注释: ${headerRowColumn.COLUMN_COMMENT}`);
        } else {
            console.log('❌ header_row 字段添加失败！');
        }

        console.log('数据库修复完成！');

    } catch (error) {
        console.error('修复数据库时出错:', error);
        console.error('错误详情:', error.message);

        if (error.code) {
            console.error('错误代码:', error.code);
        }

        if (error.sqlMessage) {
            console.error('SQL错误信息:', error.sqlMessage);
        }

    } finally {
        // 关闭数据库连接
        if (connection) {
            await connection.end();
            console.log('数据库连接已关闭');
        }
    }
}

// 执行修复
fixMySQLDatabase().catch(console.error);

/*
 * @Date: 2025-11-11 00:29:57
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-11 00:33:29
 * @FilePath: /lowCode_excel/backend/scripts/runFormTablesMigration.js
 */
// 执行表单系统数据库迁移脚本
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

async function runMigration() {
  let connection;
  
  try {
    // 数据库连接配置
    const dbConfig = {
      host: '118.196.16.32',
      port: 3306,
      user: 'max',
      password: 'max',
      database: 'max',
      multipleStatements: true
    };
    
    console.log('正在连接数据库...');
    connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功');
    
    // 读取SQL文件
    const sqlFilePath = path.join(__dirname, 'create_form_tables.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('正在执行数据库迁移...');
    
    // 分割SQL语句并分别执行
    const sqlStatements = sql.split(';').filter(stmt => stmt.trim());
    console.log(`找到 ${sqlStatements.length} 条SQL语句`);
    
    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i].trim();
      if (statement && !statement.startsWith('--')) {
        console.log(`\n执行语句 ${i + 1}/${sqlStatements.length}:`);
        console.log(`SQL: ${statement.substring(0, 100)}...`);
        try {
          const [result] = await connection.execute(statement);
          console.log(`✅ 语句执行成功`);
        } catch (error) {
          console.error(`❌ 语句执行失败: ${error.message}`);
          console.error(`完整错误:`, error);
          // 继续执行其他语句
        }
      }
    }
    
    console.log('数据库迁移执行成功！');
    
    // 验证表是否创建成功
    console.log('\n验证表结构...');
    
    // 检查form_definitions表
    const [tables] = await connection.execute(`
      SHOW TABLES LIKE 'form_definitions'
    `);
    
    if (tables.length > 0) {
      console.log('✅ form_definitions表创建成功');
    } else {
      console.log('❌ form_definitions表创建失败');
    }
    
    // 检查form_hooks表
    const [hooksTables] = await connection.execute(`
      SHOW TABLES LIKE 'form_hooks'
    `);
    
    if (hooksTables.length > 0) {
      console.log('✅ form_hooks表创建成功');
    } else {
      console.log('❌ form_hooks表创建失败');
    }
    
    // 检查form_submissions表
    const [submissionsTables] = await connection.execute(`
      SHOW TABLES LIKE 'form_submissions'
    `);
    
    if (submissionsTables.length > 0) {
      console.log('✅ form_submissions表创建成功');
    } else {
      console.log('❌ form_submissions表创建失败');
    }
    
    console.log('\n数据库迁移完成！');
    
  } catch (error) {
    console.error('数据库迁移失败:', error.message);
    console.error('详细错误:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('数据库连接已关闭');
    }
  }
}

// 执行迁移
runMigration();

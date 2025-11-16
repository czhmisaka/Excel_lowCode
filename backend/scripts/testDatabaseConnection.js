/*
 * @Date: 2025-11-11 00:31:48
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-11 00:32:10
 * @FilePath: /lowCode_excel/backend/scripts/testDatabaseConnection.js
 */
// 测试数据库连接和表创建
const mysql = require('mysql2/promise');

async function testDatabase() {
  let connection;
  
  try {
    // 数据库连接配置
    const dbConfig = {
      host: '118.196.16.32',
      port: 3306,
      user: 'max',
      password: 'max',
      database: 'max'
    };
    
    console.log('正在连接数据库...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');
    
    // 测试简单查询
    console.log('\n测试简单查询...');
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ 简单查询成功:', rows);
    
    // 检查现有表
    console.log('\n检查现有表...');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('现有表:', tables.map(t => Object.values(t)[0]));
    
    // 尝试创建简单的测试表
    console.log('\n尝试创建测试表...');
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS test_form_definitions (
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ 测试表创建成功');
    } catch (error) {
      console.error('❌ 测试表创建失败:', error.message);
    }
    
    // 检查测试表是否创建成功
    const [testTables] = await connection.execute("SHOW TABLES LIKE 'test_form_definitions'");
    if (testTables.length > 0) {
      console.log('✅ 测试表验证成功');
    } else {
      console.log('❌ 测试表验证失败');
    }
    
  } catch (error) {
    console.error('❌ 数据库测试失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n数据库连接已关闭');
    }
  }
}

// 执行测试
testDatabase();

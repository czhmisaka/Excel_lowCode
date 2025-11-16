// 简单的表单系统数据库迁移脚本
const mysql = require('mysql2/promise');

async function runMigration() {
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
    
    console.log('\n开始创建表单系统表...');
    
    // 创建表单定义表
    console.log('\n1. 创建 form_definitions 表...');
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS form_definitions (
          id VARCHAR(36) PRIMARY KEY,
          form_id VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          table_mapping VARCHAR(64),
          definition JSON NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ form_definitions 表创建成功');
    } catch (error) {
      console.error('❌ form_definitions 表创建失败:', error.message);
    }
    
    // 创建Hook配置表
    console.log('\n2. 创建 form_hooks 表...');
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS form_hooks (
          id VARCHAR(36) PRIMARY KEY,
          form_id VARCHAR(255) NOT NULL,
          type VARCHAR(20) NOT NULL,
          trigger_type VARCHAR(20) NOT NULL,
          config JSON NOT NULL,
          enabled BOOLEAN DEFAULT TRUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ form_hooks 表创建成功');
    } catch (error) {
      console.error('❌ form_hooks 表创建失败:', error.message);
    }
    
    // 创建表单提交记录表
    console.log('\n3. 创建 form_submissions 表...');
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS form_submissions (
          id VARCHAR(36) PRIMARY KEY,
          form_id VARCHAR(255) NOT NULL,
          submission_data JSON NOT NULL,
          processed_data JSON,
          status VARCHAR(20) DEFAULT 'pending',
          error_message TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ form_submissions 表创建成功');
    } catch (error) {
      console.error('❌ form_submissions 表创建失败:', error.message);
    }
    
    // 验证表是否创建成功
    console.log('\n验证表结构...');
    
    // 检查form_definitions表
    const [tables] = await connection.execute(`SHOW TABLES LIKE 'form_definitions'`);
    if (tables.length > 0) {
      console.log('✅ form_definitions表验证成功');
    } else {
      console.log('❌ form_definitions表验证失败');
    }
    
    // 检查form_hooks表
    const [hooksTables] = await connection.execute(`SHOW TABLES LIKE 'form_hooks'`);
    if (hooksTables.length > 0) {
      console.log('✅ form_hooks表验证成功');
    } else {
      console.log('❌ form_hooks表验证失败');
    }
    
    // 检查form_submissions表
    const [submissionsTables] = await connection.execute(`SHOW TABLES LIKE 'form_submissions'`);
    if (submissionsTables.length > 0) {
      console.log('✅ form_submissions表验证成功');
    } else {
      console.log('❌ form_submissions表验证失败');
    }
    
    console.log('\n🎉 数据库迁移完成！');
    
  } catch (error) {
    console.error('❌ 数据库迁移失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n数据库连接已关闭');
    }
  }
}

// 执行迁移
runMigration();

/*
 * @Date: 2025-11-11 01:58:06
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-11 01:58:30
 * @FilePath: /lowCode_excel/backend/scripts/initDatabase.js
 */
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './data/annual_leave.db',
  logging: false
});

async function initDatabase() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 创建必要的表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS table_mappings (
        id INTEGER PRIMARY KEY,
        table_name VARCHAR(255) NOT NULL,
        hash_value VARCHAR(64) NOT NULL UNIQUE,
        original_file_name VARCHAR(255),
        column_count INTEGER NOT NULL DEFAULT 0,
        row_count INTEGER NOT NULL DEFAULT 0,
        header_row INTEGER NOT NULL DEFAULT 0,
        column_definitions JSON,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        form_config JSON
      )
    `);
    console.log('✅ table_mappings表创建成功');

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS form_definitions (
        id UUID UNIQUE PRIMARY KEY,
        form_id VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        table_mapping VARCHAR(64),
        definition JSON NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
      )
    `);
    console.log('✅ form_definitions表创建成功');

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS form_hooks (
        id UUID UNIQUE PRIMARY KEY,
        form_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        trigger_type VARCHAR(50) NOT NULL,
        config JSON NOT NULL,
        enabled BOOLEAN NOT NULL DEFAULT true,
        description TEXT,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
      )
    `);
    console.log('✅ form_hooks表创建成功');

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS form_submissions (
        id UUID UNIQUE PRIMARY KEY,
        form_id VARCHAR(255) NOT NULL,
        submission_data JSON NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
      )
    `);
    console.log('✅ form_submissions表创建成功');

    console.log('🎉 数据库初始化完成！');
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
  } finally {
    await sequelize.close();
  }
}

initDatabase();

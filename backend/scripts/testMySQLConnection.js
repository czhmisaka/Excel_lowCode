/*
 * @Date: 2025-11-21 02:50:00
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-21 02:51:27
 * @FilePath: /lowCode_excel/backend/scripts/testMySQLConnection.js
 * @Description: 测试MySQL数据库连接
 */

const { Sequelize } = require('sequelize');
require('dotenv').config({ path: '../docker/.env' });

// 从环境变量读取MySQL配置
const dbConfig = {
  host: process.env.DB_HOST || '101.126.91.134',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'czhmisaka',
  username: process.env.DB_USER || 'czhmisaka',
  password: process.env.DB_PASSWORD || 'czhmisaka',
  dialect: 'mysql'
};

console.log('MySQL连接配置:');
console.log('- 主机:', dbConfig.host);
console.log('- 端口:', dbConfig.port);
console.log('- 数据库:', dbConfig.database);
console.log('- 用户名:', dbConfig.username);
console.log('- 密码:', dbConfig.password ? '***' : '未设置');

async function testMySQLConnection() {
  try {
    // 创建MySQL连接
    const sequelize = new Sequelize(
      dbConfig.database,
      dbConfig.username,
      dbConfig.password,
      {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: 'mysql',
        logging: console.log,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    );

    console.log('\n正在连接到MySQL数据库...');
    
    // 测试连接
    await sequelize.authenticate();
    console.log('✅ MySQL数据库连接成功！');

    // 查询数据库中的表
    console.log('\n查询数据库中的表...');
    const [tables] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ?
    `, {
      replacements: [dbConfig.database]
    });

    console.log(`📊 数据库 ${dbConfig.database} 中的表:`);
    if (tables.length === 0) {
      console.log('   - 没有找到任何表');
    } else {
      tables.forEach((table, index) => {
        console.log(`   ${index + 1}. ${table.TABLE_NAME}`);
      });
    }

    // 检查核心表是否存在
    const coreTables = [
      'table_mappings',
      'form_definitions', 
      'form_hooks',
      'form_submissions',
      'users',
      'table_logs'
    ];

    console.log('\n🔍 检查核心表状态:');
    for (const tableName of coreTables) {
      const [exists] = await sequelize.query(
        'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',
        { replacements: [dbConfig.database, tableName] }
      );
      
      if (exists.length > 0) {
        console.log(`   ✅ ${tableName} - 存在`);
        
        // 查看表结构
        const [columns] = await sequelize.query(
          `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
           FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? 
           ORDER BY ORDINAL_POSITION`,
          { replacements: [dbConfig.database, tableName] }
        );
        
        console.log(`      字段数: ${columns.length}`);
        // 显示前几个字段作为示例
        columns.slice(0, 3).forEach(col => {
          console.log(`      - ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
        });
        if (columns.length > 3) {
          console.log(`      ... 还有 ${columns.length - 3} 个字段`);
        }
      } else {
        console.log(`   ❌ ${tableName} - 不存在`);
      }
    }

    await sequelize.close();
    console.log('\n🎉 MySQL连接测试完成！');
    return true;
    
  } catch (error) {
    console.error('❌ MySQL连接测试失败:', error.message);
    console.error('详细错误信息:', error);
    return false;
  }
}

// 执行测试
if (require.main === module) {
  testMySQLConnection()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('测试过程发生错误:', error);
      process.exit(1);
    });
}

module.exports = { testMySQLConnection };

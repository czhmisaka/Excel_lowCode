/*
 * @Date: 2025-11-21 02:53:00
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-21 02:54:07
 * @FilePath: /lowCode_excel/backend/scripts/upgradeMySQLTables.js
 * @Description: MySQL表结构升级脚本
 */

const { Sequelize } = require('sequelize');
const { tableDefinitions } = require('../config/tableDefinitions');
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

async function upgradeMySQLTables() {
  let sequelize;
  
  try {
    // 创建MySQL连接
    sequelize = new Sequelize(
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

    console.log('🚀 开始MySQL表结构升级...\n');
    
    const upgradeReport = {
      tablesUpgraded: 0,
      fieldsAdded: 0,
      indexesCreated: 0,
      errors: [],
      warnings: []
    };

    // 升级每个表
    for (const [tableName, definition] of Object.entries(tableDefinitions)) {
      console.log(`📊 升级表: ${tableName}`);
      
      // 检查表是否存在
      const [exists] = await sequelize.query(
        'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',
        { replacements: [dbConfig.database, tableName] }
      );

      if (exists.length === 0) {
        console.log(`   ❌ 表 ${tableName} 不存在，跳过升级`);
        continue;
      }

      let tableUpgraded = false;

      // 添加缺失的字段
      for (const definedColumn of definition.columns) {
        const [columnExists] = await sequelize.query(
          'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
          { replacements: [dbConfig.database, tableName, definedColumn.name] }
        );

        if (columnExists.length === 0) {
          console.log(`   ➕ 添加字段: ${definedColumn.name}`);
          
          try {
            const alterSQL = generateAddColumnSQL(tableName, definedColumn);
            await sequelize.query(alterSQL);
            console.log(`      ✅ 字段 ${definedColumn.name} 添加成功`);
            upgradeReport.fieldsAdded++;
            tableUpgraded = true;
          } catch (error) {
            console.log(`      ❌ 字段 ${definedColumn.name} 添加失败:`, error.message);
            upgradeReport.errors.push({
              table: tableName,
              field: definedColumn.name,
              error: error.message
            });
          }
        }
      }

      // 创建缺失的索引
      const definedIndexes = definition.indexes || [];
      for (const definedIndex of definedIndexes) {
        const [indexExists] = await sequelize.query(
          'SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?',
          { replacements: [dbConfig.database, tableName, definedIndex.name] }
        );

        if (indexExists.length === 0) {
          console.log(`   📈 创建索引: ${definedIndex.name}`);
          
          try {
            const indexSQL = generateCreateIndexSQL(tableName, definedIndex);
            await sequelize.query(indexSQL);
            console.log(`      ✅ 索引 ${definedIndex.name} 创建成功`);
            upgradeReport.indexesCreated++;
            tableUpgraded = true;
          } catch (error) {
            // 索引可能已经存在，忽略重复创建的错误
            if (error.message && error.message.includes('Duplicate key name')) {
              console.log(`      ℹ️ 索引 ${definedIndex.name} 已存在`);
            } else {
              console.log(`      ❌ 索引 ${definedIndex.name} 创建失败:`, error.message);
              upgradeReport.errors.push({
                table: tableName,
                index: definedIndex.name,
                error: error.message
              });
            }
          }
        }
      }

      if (tableUpgraded) {
        upgradeReport.tablesUpgraded++;
        console.log(`   ✅ 表 ${tableName} 升级完成`);
      } else {
        console.log(`   ℹ️ 表 ${tableName} 无需升级`);
      }
      
      console.log('');
    }

    // 生成升级报告
    console.log('📋 MySQL表结构升级总结:');
    console.log(`- 升级表数: ${upgradeReport.tablesUpgraded}`);
    console.log(`- 添加字段: ${upgradeReport.fieldsAdded}`);
    console.log(`- 创建索引: ${upgradeReport.indexesCreated}`);
    console.log(`- 错误数: ${upgradeReport.errors.length}`);

    if (upgradeReport.errors.length > 0) {
      console.log('\n❌ 升级过程中发生的错误:');
      upgradeReport.errors.forEach(error => {
        console.log(`   - ${error.table}.${error.field || error.index}: ${error.error}`);
      });
    }

    if (upgradeReport.fieldsAdded === 0 && upgradeReport.indexesCreated === 0) {
      console.log('\n🎉 所有表结构都已是最新版本，无需升级！');
    } else {
      console.log('\n🎉 MySQL表结构升级完成！');
    }

    return upgradeReport;

  } catch (error) {
    console.error('❌ MySQL表结构升级失败:', error.message);
    throw error;
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
}

/**
 * 生成添加字段的SQL语句
 */
function generateAddColumnSQL(tableName, columnDef) {
  let sql = `ALTER TABLE \`${tableName}\` ADD \`${columnDef.name}\` ${columnDef.type}`;
  
  if (columnDef.primaryKey) {
    sql += ' PRIMARY KEY';
    if (columnDef.autoIncrement) {
      sql += ' AUTO_INCREMENT';
    }
  }
  
  if (columnDef.unique) {
    sql += ' UNIQUE';
  }
  
  if (!columnDef.allowNull) {
    sql += ' NOT NULL';
  }
  
  if (columnDef.defaultValue) {
    if (columnDef.defaultValue === 'UUID') {
      // 对于UUID字段，不设置默认值
    } else if (typeof columnDef.defaultValue === 'string' && columnDef.defaultValue !== 'CURRENT_TIMESTAMP') {
      sql += ` DEFAULT '${columnDef.defaultValue}'`;
    } else {
      sql += ` DEFAULT ${columnDef.defaultValue}`;
    }
  }
  
  return sql;
}

/**
 * 生成创建索引的SQL语句
 */
function generateCreateIndexSQL(tableName, indexDef) {
  const columns = indexDef.columns.map(col => `\`${col}\``).join(', ');
  return `CREATE INDEX \`${indexDef.name}\` ON \`${tableName}\` (${columns})`;
}

// 执行升级
if (require.main === module) {
  upgradeMySQLTables()
    .then(report => {
      if (report.errors.length === 0) {
        console.log('✅ 升级成功完成');
        process.exit(0);
      } else {
        console.log('⚠️ 升级完成，但有部分错误');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('升级过程发生错误:', error);
      process.exit(1);
    });
}

module.exports = { upgradeMySQLTables };

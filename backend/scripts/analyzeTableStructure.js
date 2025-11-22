/*
 * @Date: 2025-11-21 02:51:00
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-21 02:52:51
 * @FilePath: /lowCode_excel/backend/scripts/analyzeTableStructure.js
 * @Description: 分析MySQL表结构与定义的差异
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

async function analyzeTableStructure() {
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
        logging: false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    );

    console.log('🔍 开始分析MySQL表结构差异...\n');
    
    const analysisReport = {
      tables: {},
      missingFields: [],
      typeMismatches: [],
      missingIndexes: [],
      totalIssues: 0
    };

    // 分析每个表
    for (const [tableName, definition] of Object.entries(tableDefinitions)) {
      console.log(`📊 分析表: ${tableName}`);
      
      const tableReport = {
        name: tableName,
        exists: false,
        fieldDifferences: [],
        indexDifferences: [],
        issues: 0
      };

      // 检查表是否存在
      const [exists] = await sequelize.query(
        'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',
        { replacements: [dbConfig.database, tableName] }
      );

      if (exists.length === 0) {
        console.log(`   ❌ 表 ${tableName} 不存在`);
        tableReport.exists = false;
        analysisReport.tables[tableName] = tableReport;
        continue;
      }

      tableReport.exists = true;
      console.log(`   ✅ 表存在`);

      // 获取实际表结构
      const [actualColumns] = await sequelize.query(
        `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_TYPE, EXTRA
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? 
         ORDER BY ORDINAL_POSITION`,
        { replacements: [dbConfig.database, tableName] }
      );

      // 获取实际索引
      const [actualIndexes] = await sequelize.query(
        `SELECT INDEX_NAME, COLUMN_NAME, NON_UNIQUE
         FROM INFORMATION_SCHEMA.STATISTICS 
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME != 'PRIMARY'
         ORDER BY INDEX_NAME, SEQ_IN_INDEX`,
        { replacements: [dbConfig.database, tableName] }
      );

      // 对比字段定义
      for (const definedColumn of definition.columns) {
        const actualColumn = actualColumns.find(col => 
          col.COLUMN_NAME.toLowerCase() === definedColumn.name.toLowerCase()
        );

        if (!actualColumn) {
          console.log(`   ❌ 缺失字段: ${definedColumn.name}`);
          tableReport.fieldDifferences.push({
            type: 'missing',
            field: definedColumn.name,
            defined: definedColumn,
            actual: null
          });
          analysisReport.missingFields.push({
            table: tableName,
            field: definedColumn.name,
            definedType: definedColumn.type
          });
          tableReport.issues++;
          continue;
        }

        // 检查数据类型兼容性
        const typeMatch = checkDataTypeCompatibility(definedColumn.type, actualColumn.DATA_TYPE);
        if (!typeMatch.compatible) {
          console.log(`   ⚠️ 类型不匹配: ${definedColumn.name}`);
          console.log(`      定义: ${definedColumn.type}, 实际: ${actualColumn.DATA_TYPE}`);
          tableReport.fieldDifferences.push({
            type: 'type_mismatch',
            field: definedColumn.name,
            defined: definedColumn,
            actual: actualColumn,
            compatibility: typeMatch
          });
          analysisReport.typeMismatches.push({
            table: tableName,
            field: definedColumn.name,
            definedType: definedColumn.type,
            actualType: actualColumn.DATA_TYPE,
            message: typeMatch.message
          });
          tableReport.issues++;
        }
      }

      // 对比索引定义
      const definedIndexes = definition.indexes || [];
      for (const definedIndex of definedIndexes) {
        const indexColumns = definedIndex.columns || [];
        const actualIndex = actualIndexes.find(idx => 
          idx.INDEX_NAME.toLowerCase() === definedIndex.name.toLowerCase()
        );

        if (!actualIndex) {
          console.log(`   ❌ 缺失索引: ${definedIndex.name}`);
          tableReport.indexDifferences.push({
            type: 'missing',
            index: definedIndex.name,
            defined: definedIndex,
            actual: null
          });
          analysisReport.missingIndexes.push({
            table: tableName,
            index: definedIndex.name,
            columns: indexColumns
          });
          tableReport.issues++;
        }
      }

      analysisReport.tables[tableName] = tableReport;
      analysisReport.totalIssues += tableReport.issues;
      
      if (tableReport.issues === 0) {
        console.log(`   ✅ 表结构完整`);
      } else {
        console.log(`   ⚠️ 发现 ${tableReport.issues} 个问题`);
      }
      console.log('');
    }

    // 生成总结报告
    console.log('📋 表结构分析总结:');
    console.log(`- 检查表数: ${Object.keys(tableDefinitions).length}`);
    console.log(`- 缺失字段: ${analysisReport.missingFields.length}`);
    console.log(`- 类型不匹配: ${analysisReport.typeMismatches.length}`);
    console.log(`- 缺失索引: ${analysisReport.missingIndexes.length}`);
    console.log(`- 总问题数: ${analysisReport.totalIssues}`);

    // 显示详细问题
    if (analysisReport.missingFields.length > 0) {
      console.log('\n🔧 需要添加的字段:');
      analysisReport.missingFields.forEach(item => {
        console.log(`   - ${item.table}.${item.field} (${item.definedType})`);
      });
    }

    if (analysisReport.typeMismatches.length > 0) {
      console.log('\n⚠️ 类型不匹配的字段:');
      analysisReport.typeMismatches.forEach(item => {
        console.log(`   - ${item.table}.${item.field}: 定义=${item.definedType}, 实际=${item.actualType}`);
        console.log(`     说明: ${item.message}`);
      });
    }

    if (analysisReport.missingIndexes.length > 0) {
      console.log('\n📈 需要添加的索引:');
      analysisReport.missingIndexes.forEach(item => {
        console.log(`   - ${item.table}.${item.index} (${item.columns.join(', ')})`);
      });
    }

    return analysisReport;

  } catch (error) {
    console.error('❌ 表结构分析失败:', error.message);
    throw error;
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
}

/**
 * 检查数据类型兼容性
 */
function checkDataTypeCompatibility(definedType, actualType) {
  const defined = definedType.toLowerCase();
  const actual = actualType.toLowerCase();
  
  // MySQL数据类型映射
  const typeMappings = {
    'integer': ['int', 'integer', 'bigint', 'smallint', 'mediumint'],
    'varchar': ['varchar', 'char', 'text', 'longtext', 'mediumtext'],
    'json': ['json', 'longtext', 'text'],
    'datetime': ['datetime', 'timestamp'],
    'boolean': ['tinyint', 'boolean'],
    'text': ['text', 'longtext', 'mediumtext', 'varchar'],
    'uuid': ['varchar', 'char']
  };

  // 检查是否兼容
  for (const [baseType, compatibleTypes] of Object.entries(typeMappings)) {
    if (defined.includes(baseType) && compatibleTypes.some(t => actual.includes(t))) {
      return {
        compatible: true,
        message: `定义类型 "${definedType}" 与 实际类型 "${actualType}" 兼容`
      };
    }
  }

  return {
    compatible: false,
    message: `定义类型 "${definedType}" 与 实际类型 "${actualType}" 不兼容`
  };
}

// 执行分析
if (require.main === module) {
  analyzeTableStructure()
    .then(report => {
      console.log('\n🎉 表结构分析完成！');
      process.exit(report.totalIssues === 0 ? 0 : 1);
    })
    .catch(error => {
      console.error('分析过程发生错误:', error);
      process.exit(1);
    });
}

module.exports = { analyzeTableStructure };

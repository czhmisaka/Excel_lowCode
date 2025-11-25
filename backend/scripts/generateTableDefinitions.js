/*
 * @Date: 2025-11-25 19:18:00
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-25 19:18:39
 * @FilePath: /lowCode_excel/backend/scripts/generateTableDefinitions.js
 * @Description: 表结构定义生成脚本 - 从模型自动生成表结构定义
 */

const TableDefinitionGenerator = require('../utils/tableDefinitionGenerator');
const path = require('path');

/**
 * 表结构定义生成脚本
 * 从Sequelize模型自动生成表结构定义文件
 */
async function generateTableDefinitions() {
  try {
    console.log('🚀 开始生成表结构定义...');
    
    // 加载模型
    console.log('📦 加载模型定义...');
    const models = require('../models');
    
    // 生成表结构定义
    console.log('🔧 生成表结构定义...');
    const definitions = TableDefinitionGenerator.generateFromModels(models, 'sqlite');
    
    // 验证表结构定义
    console.log('✅ 验证表结构定义...');
    const validation = TableDefinitionGenerator.validateTableDefinitions(definitions, models);
    
    if (!validation.success) {
      console.error('❌ 表结构定义验证失败:');
      validation.errors.forEach(error => console.error('   - ' + error));
      validation.warnings.forEach(warning => console.warn('   ⚠️ ' + warning));
      process.exit(1);
    }
    
    if (validation.warnings.length > 0) {
      console.warn('⚠️ 表结构定义验证警告:');
      validation.warnings.forEach(warning => console.warn('   - ' + warning));
    }
    
    // 保存表结构定义
    console.log('💾 保存表结构定义...');
    const outputPath = path.join(__dirname, '../config/tableDefinitions.js');
    TableDefinitionGenerator.saveTableDefinitions(definitions, outputPath);
    
    // 生成统计信息
    const tableCount = Object.keys(definitions).length;
    let totalColumns = 0;
    let totalIndexes = 0;
    
    Object.values(definitions).forEach(tableDef => {
      totalColumns += tableDef.columns.length;
      totalIndexes += (tableDef.indexes || []).length;
    });
    
    console.log('📊 生成统计:');
    console.log('   - 表数量: ' + tableCount);
    console.log('   - 总列数: ' + totalColumns);
    console.log('   - 总索引数: ' + totalIndexes);
    
    console.log('🎉 表结构定义生成完成!');
    
  } catch (error) {
    console.error('❌ 表结构定义生成失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 如果是直接运行此脚本
if (require.main === module) {
  generateTableDefinitions();
}

module.exports = generateTableDefinitions;

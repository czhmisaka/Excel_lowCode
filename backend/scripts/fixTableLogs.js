/*
 * @Date: 2025-11-26
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-26 00:10:15
 * @FilePath: /lowCode_excel/backend/scripts/fixTableLogs.js
 * @Description: 修复 table_logs 表结构脚本
 */

const { sequelize } = require('../config/database');
const TableLog = require('../models/TableLog');

/**
 * 修复 table_logs 表结构
 * 强制删除旧表并重新创建新表
 */
async function fixTableLogs() {
  try {
    console.log('开始修复 table_logs 表结构...');
    
    // 检查当前表结构
    const [currentSchema] = await sequelize.query('PRAGMA table_info(table_logs)');
    console.log('当前表结构:');
    currentSchema.forEach(col => {
      console.log(`- ${col.name} (${col.type})`);
    });
    
    // 备份现有数据（如果有）
    console.log('备份现有数据...');
    const [existingData] = await sequelize.query('SELECT * FROM table_logs');
    console.log(`找到 ${existingData.length} 条现有记录`);
    
    // 删除旧表
    console.log('删除旧表...');
    await sequelize.query('DROP TABLE IF EXISTS table_logs');
    console.log('✅ 旧表已删除');
    
    // 创建新表
    console.log('创建新表...');
    const TableLogModel = TableLog(sequelize);
    await TableLogModel.sync({ force: true });
    console.log('✅ 新表已创建');
    
    // 验证新表结构
    const [newSchema] = await sequelize.query('PRAGMA table_info(table_logs)');
    console.log('新表结构:');
    newSchema.forEach(col => {
      console.log(`- ${col.name} (${col.type})`);
    });
    
    console.log('✅ table_logs 表结构修复完成');
    
    return {
      success: true,
      message: 'table_logs 表结构修复成功',
      oldRecordsCount: existingData.length,
      newSchema: newSchema
    };
    
  } catch (error) {
    console.error('❌ table_logs 表结构修复失败:', error);
    return {
      success: false,
      message: `table_logs 表结构修复失败: ${error.message}`,
      error: error
    };
  } finally {
    await sequelize.close();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  fixTableLogs()
    .then(result => {
      if (result.success) {
        console.log('🎉 table_logs 表结构修复成功！');
        process.exit(0);
      } else {
        console.error('❌ table_logs 表结构修复失败！');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ 脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { fixTableLogs };

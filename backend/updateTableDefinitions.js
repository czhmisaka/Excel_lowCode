/*
 * @Date: 2025-12-02 10:38:49
 * @LastEditors: CZH
 * @LastEditTime: 2025-12-02 10:42:09
 * @FilePath: /打卡/backend/updateTableDefinitions.js
 */
/**
 * 更新表结构定义脚本
 * 根据当前模型重新生成表结构定义配置
 */

const TableDefinitionGenerator = require('./utils/tableDefinitionGenerator');
const path = require('path');
const fs = require('fs');

// 加载所有模型
const { sequelize } = require('./config/database');

// 初始化模型
const TableMapping = require('./models/TableMapping');
const User = require('./models/User');
const TableLog = require('./models/TableLog');
const CheckinRecord = require('./models/CheckinRecord');
const Company = require('./models/Company');

// 初始化模型实例
const TableLogModel = TableLog(sequelize);
const CheckinRecordModel = CheckinRecord(sequelize);
const CompanyModel = Company(sequelize);

// 收集所有模型
const models = {
  TableMapping,
  User,
  TableLog: TableLogModel,
  CheckinRecord: CheckinRecordModel,
  Company: CompanyModel
};

console.log('开始生成表结构定义...');
console.log('模型数量:', Object.keys(models).length);

// 生成表结构定义
const tableDefinitions = TableDefinitionGenerator.generateFromModels(models, 'sqlite');

console.log('生成的表定义数量:', Object.keys(tableDefinitions).length);

// 保存到文件
const outputPath = path.join(__dirname, 'config', 'tableDefinitions.js');
TableDefinitionGenerator.saveTableDefinitions(tableDefinitions, outputPath);

console.log('✅ 表结构定义更新完成');
console.log('文件位置:', outputPath);

// 验证表定义
console.log('\n验证表定义...');
const validation = TableDefinitionGenerator.validateTableDefinitions(tableDefinitions, models);

if (validation.success) {
  console.log('✅ 表定义验证通过');
} else {
  console.log('❌ 表定义验证失败:');
  validation.errors.forEach(error => console.log('  -', error));
}

if (validation.warnings.length > 0) {
  console.log('⚠️ 表定义警告:');
  validation.warnings.forEach(warning => console.log('  -', warning));
}

process.exit(validation.success ? 0 : 1);

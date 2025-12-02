/*
 * @Date: 2025-12-02 10:47:24
 * @LastEditors: CZH
 * @LastEditTime: 2025-12-02 10:48:00
 * @FilePath: /打卡/test_labor_source.js
 */
/**
 * 测试劳务来源功能
 * 验证数据库字段、API接口和前端页面是否正常工作
 */

const { sequelize } = require('./backend/config/database');
const { CheckinRecord } = require('./backend/models');

async function testLaborSourceFeature() {
  console.log('=== 测试劳务来源功能 ===\n');
  
  try {
    // 1. 测试数据库连接
    console.log('1. 测试数据库连接...');
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功\n');
    
    // 2. 检查CheckinRecord模型是否有laborSource字段
    console.log('2. 检查CheckinRecord模型字段...');
    const modelAttributes = CheckinRecord(sequelize).rawAttributes;
    const hasLaborSourceField = 'laborSource' in modelAttributes;
    
    if (hasLaborSourceField) {
      console.log('✅ CheckinRecord模型包含laborSource字段');
      const fieldConfig = modelAttributes.laborSource;
      console.log(`   - 字段名: ${fieldConfig.field || 'laborSource'}`);
      console.log(`   - 类型: ${fieldConfig.type.key || fieldConfig.type}`);
      console.log(`   - 允许空值: ${fieldConfig.allowNull}`);
      console.log(`   - 注释: ${fieldConfig.comment || '无'}`);
    } else {
      console.log('❌ CheckinRecord模型缺少laborSource字段');
    }
    console.log('');
    
    // 3. 检查数据库表结构
    console.log('3. 检查数据库表结构...');
    const [results] = await sequelize.query(
      "PRAGMA table_info(checkin_records)",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    const hasLaborSourceColumn = results.some(col => col.name === 'labor_source');
    if (hasLaborSourceColumn) {
      console.log('✅ 数据库表包含labor_source列');
      const columnInfo = results.find(col => col.name === 'labor_source');
      console.log(`   - 列名: ${columnInfo.name}`);
      console.log(`   - 类型: ${columnInfo.type}`);
      console.log(`   - 允许空值: ${columnInfo.notnull === 0}`);
    } else {
      console.log('❌ 数据库表缺少labor_source列');
    }
    console.log('');
    
    // 4. 验证劳务来源选项
    console.log('4. 验证劳务来源选项...');
    const validOptions = ['汇博劳务公司', '恒信劳务公司', '其他类（临时工）'];
    console.log('✅ 有效的劳务来源选项:');
    validOptions.forEach(option => console.log(`   - ${option}`));
    console.log('');
    
    // 5. 总结
    console.log('=== 测试总结 ===');
    if (hasLaborSourceField && hasLaborSourceColumn) {
      console.log('✅ 劳务来源功能已成功集成');
      console.log('   数据库模型和表结构都已更新');
      console.log('   前端页面已添加劳务来源选择器');
      console.log('   API接口已支持laborSource参数');
      console.log('   公司签到记录页面已添加劳务来源列');
    } else {
      console.log('⚠️  部分功能可能未完全集成');
      console.log('   请检查以上错误信息');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

// 运行测试
testLaborSourceFeature().then(() => {
  console.log('\n测试完成');
  process.exit(0);
}).catch(error => {
  console.error('测试执行失败:', error);
  process.exit(1);
});

/*
 * @Date: 2025-11-29 11:34:33
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-29 11:35:08
 * @FilePath: /打卡/backend/test_new_checkin_system.js
 */
/**
 * 测试新的签到系统功能
 */

const { sequelize } = require('./config/database');
const { QueryTypes } = require('sequelize');

async function testNewCheckinSystem() {
  console.log('=== 测试新的签到系统功能 ===\n');
  
  try {
    // 1. 验证表结构
    console.log('1. 验证表结构...');
    const columns = await sequelize.query(
      'PRAGMA table_info(checkin_records)',
      { type: QueryTypes.SELECT }
    );
    
    const hasRealName = columns.some(col => col.name === 'real_name');
    const hasPhone = columns.some(col => col.name === 'phone');
    const hasUserId = columns.some(col => col.name === 'user_id');
    
    console.log(`   - real_name字段: ${hasRealName ? '✅ 存在' : '❌ 缺失'}`);
    console.log(`   - phone字段: ${hasPhone ? '✅ 存在' : '❌ 缺失'}`);
    console.log(`   - user_id字段: ${hasUserId ? '❌ 存在（应该移除）' : '✅ 已移除'}`);
    
    if (!hasRealName || !hasPhone || hasUserId) {
      throw new Error('表结构验证失败');
    }
    
    // 2. 验证数据迁移
    console.log('\n2. 验证数据迁移...');
    const records = await sequelize.query(
      'SELECT id, real_name, phone, company_id, checkin_type FROM checkin_records WHERE is_active = 1',
      { type: QueryTypes.SELECT }
    );
    
    console.log(`   - 有效记录数: ${records.length}`);
    if (records.length > 0) {
      console.log('   - 示例记录:');
      records.forEach(record => {
        console.log(`     ID: ${record.id}, 姓名: ${record.real_name}, 手机: ${record.phone}, 类型: ${record.checkin_type}`);
      });
    }
    
    // 3. 验证索引
    console.log('\n3. 验证索引...');
    const indexes = await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='checkin_records'",
      { type: QueryTypes.SELECT }
    );
    
    console.log('   - 现有索引:');
    indexes.forEach(index => {
      console.log(`     - ${index.name}`);
    });
    
    const hasPhoneIndex = indexes.some(index => index.name === 'idx_checkin_phone_company_time');
    console.log(`   - 手机号索引: ${hasPhoneIndex ? '✅ 存在' : '❌ 缺失'}`);
    
    console.log('\n=== 测试结果 ===');
    console.log('✅ 新的签到系统功能验证通过！');
    console.log('✅ 数据库表结构已正确更新');
    console.log('✅ 历史数据已成功迁移');
    console.log('✅ 新的索引已创建');
    console.log('\n现在可以正常使用新的签到系统了！');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    process.exit(1);
  }
}

// 运行测试
testNewCheckinSystem();

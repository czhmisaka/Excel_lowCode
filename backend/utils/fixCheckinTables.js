/*
 * @Date: 2025-11-27
 * @LastEditors: CZH
 * @FilePath: /打卡/backend/utils/fixCheckinTables.js
 * @Description: 修复公司和签到模块表结构
 */

const { sequelize } = require('../config/database');

/**
 * 直接修复公司和签到模块的表结构
 */
async function fixCheckinTables() {
  try {
    console.log('开始修复公司和签到模块表结构...');
    
    // 1. 检查 Company 表并添加 is_active 字段
    console.log('检查 Company 表...');
    const [companyColumns] = await sequelize.query(`PRAGMA table_info("companies")`);
    const hasIsActive = companyColumns.some(col => col.name === 'is_active');
    
    if (!hasIsActive) {
      console.log('添加 is_active 字段到 Company 表...');
      await sequelize.query(`ALTER TABLE companies ADD COLUMN is_active BOOLEAN DEFAULT 1`);
      console.log('✅ Company 表修复完成');
    } else {
      console.log('✅ Company 表结构正常');
    }
    
    // 2. 检查 User 表并添加缺失字段
    console.log('检查 User 表...');
    const [userColumns] = await sequelize.query(`PRAGMA table_info("users")`);
    const hasRealName = userColumns.some(col => col.name === 'real_name');
    const hasPhone = userColumns.some(col => col.name === 'phone');
    const hasIdCard = userColumns.some(col => col.name === 'id_card');
    const hasCompanyId = userColumns.some(col => col.name === 'company_id');
    
    if (!hasRealName) {
      console.log('添加 real_name 字段到 User 表...');
      await sequelize.query(`ALTER TABLE users ADD COLUMN real_name VARCHAR(50)`);
    }
    
    if (!hasPhone) {
      console.log('添加 phone 字段到 User 表...');
      await sequelize.query(`ALTER TABLE users ADD COLUMN phone VARCHAR(20)`);
    }
    
    if (!hasIdCard) {
      console.log('添加 id_card 字段到 User 表...');
      await sequelize.query(`ALTER TABLE users ADD COLUMN id_card VARCHAR(18)`);
    }
    
    if (!hasCompanyId) {
      console.log('添加 company_id 字段到 User 表...');
      await sequelize.query(`ALTER TABLE users ADD COLUMN company_id INTEGER`);
    }
    
    console.log('✅ User 表修复完成');
    
    // 3. 检查 CheckinRecord 表并添加缺失字段
    console.log('检查 CheckinRecord 表...');
    const [checkinColumns] = await sequelize.query(`PRAGMA table_info("checkin_records")`);
    const hasCheckinType = checkinColumns.some(col => col.name === 'checkin_type');
    const hasWorkDuration = checkinColumns.some(col => col.name === 'work_duration');
    const hasLocation = checkinColumns.some(col => col.name === 'location');
    const hasDeviceInfo = checkinColumns.some(col => col.name === 'device_info');
    
    if (!hasCheckinType) {
      console.log('添加 checkin_type 字段到 CheckinRecord 表...');
      await sequelize.query(`ALTER TABLE checkin_records ADD COLUMN checkin_type VARCHAR(20)`);
    }
    
    if (!hasWorkDuration) {
      console.log('添加 work_duration 字段到 CheckinRecord 表...');
      await sequelize.query(`ALTER TABLE checkin_records ADD COLUMN work_duration INTEGER`);
    }
    
    if (!hasLocation) {
      console.log('添加 location 字段到 CheckinRecord 表...');
      await sequelize.query(`ALTER TABLE checkin_records ADD COLUMN location TEXT`);
    }
    
    if (!hasDeviceInfo) {
      console.log('添加 device_info 字段到 CheckinRecord 表...');
      await sequelize.query(`ALTER TABLE checkin_records ADD COLUMN device_info TEXT`);
    }
    
    console.log('✅ CheckinRecord 表修复完成');
    
    console.log('✅ 所有表和签到模块表结构修复完成');
    return { success: true, message: '表结构修复成功' };
    
  } catch (error) {
    console.error('❌ 表结构修复失败:', error.message);
    return { success: false, message: error.message };
  }
}

// 如果直接运行此文件，则执行修复
if (require.main === module) {
  fixCheckinTables()
    .then(result => {
      if (result.success) {
        console.log('✅ 修复完成');
        process.exit(0);
      } else {
        console.error('❌ 修复失败');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ 修复过程出错:', error);
      process.exit(1);
    });
}

module.exports = { fixCheckinTables };

/**
 * 更新CheckinRecord表结构
 * 添加real_name和phone字段，移除对user_id的依赖
 */

const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

async function updateCheckinTable() {
  try {
    console.log('开始更新CheckinRecord表结构...');
    
    // 检查表是否存在
    const tableExists = await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='checkin_records'",
      { type: QueryTypes.SELECT }
    );
    
    if (tableExists.length === 0) {
      console.log('checkin_records表不存在，无需更新');
      return { success: true, message: '表不存在，无需更新' };
    }
    
    // 检查是否已存在real_name字段
    const columns = await sequelize.query(
      "PRAGMA table_info(checkin_records)",
      { type: QueryTypes.SELECT }
    );
    
    const hasRealName = columns.some(col => col.name === 'real_name');
    const hasPhone = columns.some(col => col.name === 'phone');
    
    if (hasRealName && hasPhone) {
      console.log('表结构已是最新，无需更新');
      return { success: true, message: '表结构已是最新' };
    }
    
    // 创建临时表
    console.log('创建临时表...');
    await sequelize.query(`
      CREATE TABLE checkin_records_temp (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        real_name VARCHAR(50) NOT NULL,
        phone VARCHAR(11) NOT NULL,
        company_id INTEGER NOT NULL,
        checkin_type VARCHAR(10) NOT NULL,
        checkin_time DATETIME NOT NULL,
        location VARCHAR(500),
        device_info TEXT,
        work_duration INTEGER,
        remark VARCHAR(300),
        is_active BOOLEAN DEFAULT true,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id)
      )
    `);
    
    // 如果有旧数据，迁移数据
    const oldRecords = await sequelize.query(
      "SELECT * FROM checkin_records WHERE is_active = 1",
      { type: QueryTypes.SELECT }
    );
    
    if (oldRecords.length > 0) {
      console.log(`迁移 ${oldRecords.length} 条记录...`);
      
      for (const record of oldRecords) {
        // 获取用户信息
        const user = await sequelize.query(
          `SELECT real_name, phone FROM users WHERE id = ? AND is_active = 1`,
          {
            type: QueryTypes.SELECT,
            replacements: [record.user_id]
          }
        );
        
        const realName = user.length > 0 ? user[0].real_name : '未知用户';
        const phone = user.length > 0 ? user[0].phone : '未知手机号';
        
        await sequelize.query(`
          INSERT INTO checkin_records_temp 
          (id, real_name, phone, company_id, checkin_type, checkin_time, location, device_info, work_duration, remark, is_active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, {
          replacements: [
            record.id,
            realName,
            phone,
            record.company_id,
            record.checkin_type,
            record.checkin_time,
            record.location,
            record.device_info,
            record.work_duration,
            record.remark,
            record.is_active,
            record.created_at,
            record.updated_at
          ]
        });
      }
    }
    
    // 删除原表
    console.log('删除原表...');
    await sequelize.query("DROP TABLE checkin_records");
    
    // 重命名临时表
    console.log('重命名临时表...');
    await sequelize.query("ALTER TABLE checkin_records_temp RENAME TO checkin_records");
    
    // 创建索引
    console.log('创建索引...');
    await sequelize.query(`
      CREATE INDEX idx_checkin_phone_company_time ON checkin_records (phone, company_id, checkin_time)
    `);
    await sequelize.query(`
      CREATE INDEX idx_checkin_company_type_time ON checkin_records (company_id, checkin_type, checkin_time)
    `);
    
    console.log('✅ CheckinRecord表结构更新完成');
    return { 
      success: true, 
      message: '表结构更新成功',
      migratedRecords: oldRecords.length
    };
    
  } catch (error) {
    console.error('❌ 更新表结构失败:', error);
    return { 
      success: false, 
      message: '更新表结构失败',
      error: error.message 
    };
  }
}

// 如果直接运行此文件
if (require.main === module) {
  updateCheckinTable()
    .then(result => {
      console.log('执行结果:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('执行失败:', error);
      process.exit(1);
    });
}

module.exports = updateCheckinTable;

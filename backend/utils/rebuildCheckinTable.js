/*
 * @Date: 2025-11-27
 * @LastEditors: CZH
 * @FilePath: /打卡/backend/utils/rebuildCheckinTable.js
 * @Description: 重建 CheckinRecord 表以修复字段类型问题
 */

const { sequelize } = require('../config/database');

/**
 * 重建 CheckinRecord 表
 */
async function rebuildCheckinTable() {
  try {
    console.log('开始重建 CheckinRecord 表...');
    
    // 1. 备份现有数据
    console.log('备份现有数据...');
    const [existingData] = await sequelize.query(`SELECT * FROM checkin_records`);
    console.log(`备份了 ${existingData.length} 条记录`);
    
    // 2. 删除现有表
    console.log('删除现有表...');
    await sequelize.query(`DROP TABLE IF EXISTS checkin_records`);
    
    // 3. 重新创建表（使用正确的字段类型）
    console.log('重新创建表...');
    const createTableSQL = `
      CREATE TABLE checkin_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        company_id INTEGER NOT NULL,
        checkin_type VARCHAR(20) NOT NULL,
        checkin_time DATETIME NOT NULL,
        location TEXT,
        device_info TEXT,
        work_duration INTEGER,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (company_id) REFERENCES companies(id)
      )
    `;
    await sequelize.query(createTableSQL);
    
    // 4. 创建索引
    console.log('创建索引...');
    await sequelize.query(`CREATE INDEX idx_checkin_user_company_time ON checkin_records (user_id, company_id, checkin_time)`);
    await sequelize.query(`CREATE INDEX idx_checkin_company_type_time ON checkin_records (company_id, checkin_type, checkin_time)`);
    
    // 5. 恢复数据（如果可能）
    if (existingData.length > 0) {
      console.log('尝试恢复数据...');
      for (const record of existingData) {
        try {
          await sequelize.query(`
            INSERT INTO checkin_records 
            (user_id, company_id, checkin_type, checkin_time, location, device_info, work_duration, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, {
            replacements: [
              record.user_id,
              record.company_id,
              record.checkin_type,
              record.checkin_time,
              record.location,
              record.device_info,
              record.work_duration,
              record.created_at,
              record.updated_at
            ]
          });
        } catch (insertError) {
          console.warn(`无法恢复记录 ${record.id}:`, insertError.message);
        }
      }
      console.log('✅ 数据恢复完成');
    }
    
    console.log('✅ CheckinRecord 表重建完成');
    return { success: true, message: '表重建成功', restoredRecords: existingData.length };
    
  } catch (error) {
    console.error('❌ 表重建失败:', error.message);
    return { success: false, message: error.message };
  }
}

// 如果直接运行此文件，则执行重建
if (require.main === module) {
  rebuildCheckinTable()
    .then(result => {
      if (result.success) {
        console.log('✅ 重建完成');
        process.exit(0);
      } else {
        console.error('❌ 重建失败');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ 重建过程出错:', error);
      process.exit(1);
    });
}

module.exports = { rebuildCheckinTable };

/*
 * @Date: 2025-11-11 14:20:00
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-11 14:21:28
 * @FilePath: /lowCode_excel/backend/scripts/enhancedDataMigration.js
 */
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './data/annual_leave.db',
  logging: console.log
});

/**
 * 增强的数据迁移脚本
 * 清理 form_definitions 表中的问题数据
 */
async function enhancedDataMigration() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');
    
    console.log('=== 开始数据迁移 ===');
    
    // 1. 检查当前数据状态
    console.log('\n1. 检查当前数据状态...');
    const [currentData] = await sequelize.query('SELECT * FROM form_definitions');
    console.log(`当前 form_definitions 表共有 ${currentData.length} 条记录`);
    
    // 2. 统计问题数据
    console.log('\n2. 统计问题数据...');
    
    // 统计 form_id 为 null 或空的记录
    const [nullFormIds] = await sequelize.query(`
      SELECT COUNT(*) as count FROM form_definitions 
      WHERE form_id IS NULL OR form_id = '' OR TRIM(form_id) = ''
    `);
    console.log(`- form_id 为 null 或空的记录: ${nullFormIds[0].count} 条`);
    
    // 统计重复的 form_id
    const [duplicates] = await sequelize.query(`
      SELECT form_id, COUNT(*) as count 
      FROM form_definitions 
      WHERE form_id IS NOT NULL AND form_id != '' 
      GROUP BY form_id 
      HAVING COUNT(*) > 1
    `);
    console.log(`- 重复的 form_id 数量: ${duplicates.length} 组`);
    
    // 3. 清理问题数据
    console.log('\n3. 开始清理问题数据...');
    
    // 3.1 删除 form_id 为 null 或空的记录
    if (nullFormIds[0].count > 0) {
      const [deletedNull] = await sequelize.query(`
        DELETE FROM form_definitions 
        WHERE form_id IS NULL OR form_id = '' OR TRIM(form_id) = ''
      `);
      console.log(`✅ 已删除 ${nullFormIds[0].count} 条 form_id 为 null 或空的记录`);
    }
    
    // 3.2 处理重复的 form_id
    let totalDuplicatesDeleted = 0;
    for (const dup of duplicates) {
      console.log(`\n处理重复的 form_id: ${dup.form_id} (${dup.count} 条记录)`);
      
      // 获取所有重复记录，按创建时间排序
      const [duplicateRecords] = await sequelize.query(`
        SELECT id, form_id, name, created_at 
        FROM form_definitions 
        WHERE form_id = ? 
        ORDER BY created_at ASC
      `, { replacements: [dup.form_id] });
      
      // 保留最新的记录，删除其他记录
      const recordsToKeep = duplicateRecords.slice(-1); // 保留最新的
      const recordsToDelete = duplicateRecords.slice(0, -1); // 删除旧的
      
      for (const record of recordsToDelete) {
        await sequelize.query('DELETE FROM form_definitions WHERE id = ?', {
          replacements: [record.id]
        });
        totalDuplicatesDeleted++;
        console.log(`  - 删除记录: id=${record.id}, name="${record.name}", created_at=${record.created_at}`);
      }
      
      console.log(`  - 保留记录: id=${recordsToKeep[0].id}, name="${recordsToKeep[0].name}", created_at=${recordsToKeep[0].created_at}`);
    }
    
    if (totalDuplicatesDeleted > 0) {
      console.log(`\n✅ 总共删除 ${totalDuplicatesDeleted} 条重复记录`);
    }
    
    // 4. 验证清理结果
    console.log('\n4. 验证清理结果...');
    const [finalData] = await sequelize.query('SELECT * FROM form_definitions');
    console.log(`清理后 form_definitions 表共有 ${finalData.length} 条记录`);
    
    // 检查是否还有问题数据
    const [remainingNull] = await sequelize.query(`
      SELECT COUNT(*) as count FROM form_definitions 
      WHERE form_id IS NULL OR form_id = '' OR TRIM(form_id) = ''
    `);
    
    const [remainingDuplicates] = await sequelize.query(`
      SELECT form_id, COUNT(*) as count 
      FROM form_definitions 
      WHERE form_id IS NOT NULL AND form_id != '' 
      GROUP BY form_id 
      HAVING COUNT(*) > 1
    `);
    
    if (remainingNull[0].count === 0 && remainingDuplicates.length === 0) {
      console.log('✅ 数据清理完成，所有问题数据已修复');
    } else {
      console.log('⚠️ 仍有问题数据存在:');
      if (remainingNull[0].count > 0) {
        console.log(`  - form_id 为 null 或空的记录: ${remainingNull[0].count} 条`);
      }
      if (remainingDuplicates.length > 0) {
        console.log(`  - 重复的 form_id: ${remainingDuplicates.length} 组`);
      }
    }
    
    // 5. 生成修复报告
    console.log('\n5. 修复报告:');
    console.log(`- 初始记录数: ${currentData.length}`);
    console.log(`- 最终记录数: ${finalData.length}`);
    console.log(`- 删除记录数: ${currentData.length - finalData.length}`);
    console.log(`- 删除 null/空 form_id: ${nullFormIds[0].count}`);
    console.log(`- 删除重复记录: ${totalDuplicatesDeleted}`);
    
    console.log('\n=== 数据迁移完成 ===');
    
  } catch (error) {
    console.error('数据迁移失败:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  enhancedDataMigration()
    .then(() => {
      console.log('数据迁移脚本执行完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('数据迁移脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = enhancedDataMigration;
